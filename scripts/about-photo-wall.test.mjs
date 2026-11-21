import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function emitter(extra={}) {
  const handlers=new Map();
  return Object.assign(extra,{
    addEventListener(type,callback) { const list=handlers.get(type)||[];list.push(callback);handlers.set(type,list); },
    fire(type,event={}) { for(const callback of handlers.get(type)||[])callback(event); }
  });
}
function wall({reduced=false,photoCount=9,height=600,cardHeight=140,arriving=false}={}) {
  const nodes=[],animations=[],observers=[];
  const node=(tag='div')=>{
    const classes=new Set(),attributes=new Map();
    const result=emitter({tag,children:[],style:{removeProperty(key){delete this[key];}},
      classList:{add:(...values)=>values.forEach(value=>classes.add(value)),remove:(...values)=>values.forEach(value=>classes.delete(value)),contains:value=>classes.has(value)},
      append(...children){children.forEach(child=>child.parent=this);this.children.push(...children);},replaceChildren(...children){this.children=children;},
      setAttribute:(key,value)=>attributes.set(key,value),getAttribute:key=>attributes.get(key),
      querySelector(selector){return selector==='img'?this.children.find(child=>child.tag==='img'):null;},
      getBoundingClientRect(){
        if(this.className==='about-photo-wall')return {top:0,height};
        if(this.className?.startsWith('about-photo-card'))return {top:this.parent.children.indexOf(this)*(cardHeight+14),height:cardHeight};
        return {top:0,height:this.children.length*(cardHeight+14)};
      },
      focus(){},setPointerCapture(){},hasPointerCapture(){return false;},
      animate(keyframes,options){
        const animation={keyframes,options,currentTime:0,state:'running',play(){this.state='running';},pause(){this.state='paused';},cancel(){this.state='canceled';}};
        animations.push(animation);return animation;
      }
    });
    nodes.push(result);return result;
  };
  const originals=Array.from({length:photoCount},(_,index)=>{
    const image=node('img');image.src='photo-'+index;image.cloneNode=()=>Object.assign(node('img'),{src:image.src});
    const figure=node('figure');figure.className='about-mosaic__tile photo-'+index+(index===0?' about-mosaic__portrait':'');figure.append(image);return figure;
  });
  const mosaic=node();mosaic.querySelectorAll=()=>originals;
  const caption=node('p');caption.id='caption';
  const root=node('html');if(arriving)root.classList.add('page-arrival-active');
  const document=emitter({documentElement:root,hidden:false,createElement:node,querySelector:selector=>selector==='.about-mosaic'?mosaic:caption});
  const window=emitter(),media=emitter({matches:reduced});
  vm.runInNewContext(fs.readFileSync(new URL('../about-photo-wall.js',import.meta.url),'utf8'),{document,window,matchMedia:()=>media,Element:class{animate(){}},
    MutationObserver:class{constructor(callback){observers.push(callback);}observe(){}disconnect(){}}
  });
  return {nodes,animations,document,window,media,root,observers,stage:nodes.find(item=>item.className==='about-photo-wall'),tracks:nodes.filter(item=>item.className==='about-photo-track')};
}

function assertOpeningCentered(f) {
  const track=f.tracks[1],group=track.children[0];
  const portrait=group.children.find(figure=>figure.children[0].src==='photo-0');
  assert(portrait,'The boat portrait belongs to the middle column');
  const animation=f.animations.filter(item=>item.state!=='canceled')[1];
  const from=parseFloat(animation?.keyframes[0].transform.slice(11));
  const to=parseFloat(animation?.keyframes[1].transform.slice(11));
  const shift=animation ? from+(to-from)*animation.currentTime/animation.options.duration : parseFloat(track.style.transform.slice(11));
  const photo=portrait.getBoundingClientRect(),distance=group.getBoundingClientRect().height;
  const center=photo.top+photo.height/2+shift,target=f.stage.getBoundingClientRect().height/2;
  assert(Math.min(Math.abs(center-target),Math.abs(center+distance-target))<.001,'One copy of the portrait starts at the wall center');
}

test('the opening boat portrait is centered in the middle column at different viewport sizes',()=>{
  for(const dimensions of [{height:600,cardHeight:240},{height:380,cardHeight:132},{height:100,cardHeight:300}]){
    assertOpeningCentered(wall({photoCount:14,...dimensions}));
    assertOpeningCentered(wall({photoCount:14,reduced:true,...dimensions}));
  }
});

test('the portrait waits for the loading curtain and resets on returning to About',()=>{
  const f=wall({arriving:true,photoCount:14});
  assert(f.animations.every(animation=>animation.state==='paused'));
  f.root.classList.remove('page-arrival-active');f.observers.forEach(callback=>callback());
  assertOpeningCentered(f);
  assert(f.animations.slice(-3).every(animation=>animation.state==='running'));
  f.animations.slice(-3).forEach(animation=>animation.currentTime+=10000);
  f.window.fire('pagehide');f.window.fire('pageshow',{persisted:true});
  assertOpeningCentered(f);
  assert(f.animations.slice(-3).every(animation=>animation.state==='running'));
});

test('all nine photos appear and neighboring columns never share a photo',()=>{
  const f=wall();
  const sets=f.tracks.map(track=>new Set(track.children[0].children.map(figure=>figure.children[0].src)));
  assert.equal(new Set([...sets[0],...sets[1]]).size,9);
  for(let index=0;index<sets.length-1;index++)assert.equal([...sets[index]].filter(photo=>sets[index+1].has(photo)).length,0);
  for(const track of f.tracks)assert.deepEqual(track.children[0].children.map(figure=>figure.children[0].src),track.children[1].children.map(figure=>figure.children[0].src));
  assert.equal(f.nodes.some(item=>item.tag==='dialog'),false,'The photo wall has no click-to-open popup');
});

test('automatic motion pauses while hidden or leaving the page and resumes on return',()=>{
  const f=wall();assert.equal(f.animations.length,3);
  f.document.hidden=true;f.document.fire('visibilitychange');
  assert(f.animations.every(animation=>animation.state==='paused'));
  f.document.hidden=false;f.document.fire('visibilitychange');
  assert(f.animations.every(animation=>animation.state==='running'));
  f.window.fire('pagehide');assert(f.animations.every(animation=>animation.state==='paused'));
  f.window.fire('pageshow');assert(f.animations.slice(-3).every(animation=>animation.state==='running'));
});

test('dragging scrubs the wall without opening photos, then resumes the drift',()=>{
  const f=wall(),before=f.animations.map(animation=>animation.currentTime);
  f.stage.fire('pointerdown',{button:0,pointerType:'mouse',pointerId:1,clientY:100,preventDefault(){}});
  assert(f.animations.every(animation=>animation.state==='paused'));
  f.stage.fire('pointermove',{pointerId:1,clientY:150});
  assert(f.animations.every((animation,index)=>animation.currentTime!==before[index]));
  f.stage.fire('pointerup',{pointerId:1});
  assert(f.animations.every(animation=>animation.state==='running'));
});

test('reduced motion keeps the photos static and cancels existing loops when enabled',()=>{
  const reduced=wall({reduced:true});assert.equal(reduced.animations.length,0);
  assert(reduced.tracks.every(track=>track.style.transform.startsWith('translateY(')));
  const f=wall();f.media.matches=true;f.media.fire('change');
  assert(f.animations.every(animation=>animation.state==='canceled'));
});
