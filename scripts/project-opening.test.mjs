import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../project-opening.js',import.meta.url),'utf8');
const destination = 'https://portfolio.test/projects/project-04.html';
function emitter(extra={}) {
  const handlers=new Map();
  return Object.assign(extra,{
    addEventListener(type,callback) { const list=handlers.get(type)||[]; list.push(callback); handlers.set(type,list); },
    fire(type,event={}) { for(const callback of handlers.get(type)||[]) callback(event); },
    dispatchEvent(event) {this.fire(event.type,event);return true;}
  });
}
function fixture({ arrival=false,reduced=false,storage=new Map(),blockedStorage=false }={}) {
  const frames=new Map(),timers=new Map(),nodes=[],navigations=[],messages=[],effects=[];
  let serial=0;
  const node=() => {
    const classes=new Set(),properties=new Map();
    const result=emitter({ children:[],removed:false,style:{
      setProperty:(key,value)=>properties.set(key,value),removeProperty:key=>properties.delete(key),
      getPropertyValue:key=>properties.get(key)||''
    },classList:{ add:(...values)=>values.forEach(value=>classes.add(value)),remove:(...values)=>values.forEach(value=>classes.delete(value)),contains:value=>classes.has(value) },
    append(...items) { this.children.push(...items); },remove() { this.removed=true; },setAttribute() {},
    contentWindow:{postMessage:data=>messages.push(data)},
    animate(keyframes,options) {
      let finish;
      const finished=new Promise(resolve=>{finish=resolve;});
      effects.push({keyframes,options,finish});
      return {finished,cancel() {}};
    }
    });
    nodes.push(result);
    return result;
  };
  const artwork=node(),group=node(),line=node(),hero={querySelector:()=>artwork,querySelectorAll:()=>[line]};
  const root=node();
  const document=emitter({ documentElement:root,currentScript:{src:'https://portfolio.test/project-opening.js'},
    hidden:false,head:node(),body:node(),
    querySelector:selector=>selector==='.gallery-showcase' ? (!arrival ? {} : null) : selector==='.case-hero' ? hero : null,
    querySelectorAll:()=>[line],createElement:node,
    createElementNS() {const result=node(); result.namespaceURI='http://www.w3.org/2000/svg'; result.querySelector=()=>group; return result;}
  });
  const window=emitter();
  window.parent=window;
  const storageAPI={ getItem:key=>{if(blockedStorage)throw Error('Unavailable');return storage.get(key)||null;},setItem:(key,value)=>{if(blockedStorage)throw Error('Unavailable');storage.set(key,value);},removeItem:key=>storage.delete(key) };
  const context={document,window,Event,sessionStorage:storageAPI,matchMedia:()=>emitter({matches:reduced}),Element:class {animate() {}},URL,
    location:{origin:'https://portfolio.test',hash:'',href:arrival ? destination : 'https://portfolio.test/gallery.html',assign:url=>navigations.push(url)},
    innerWidth:1440,innerHeight:900,performance:{now:()=>0},
    requestAnimationFrame:fn=>{frames.set(++serial,fn);return serial;},cancelAnimationFrame:id=>frames.delete(id),
    setTimeout:fn=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id)
  };
  vm.runInNewContext(source,context);
  return { document,window,root,artwork,frames,nodes,navigations,storage,messages,effects,
    initialize:()=>document.fire('DOMContentLoaded'),
    flushTimers() {const batch=[...timers.values()];timers.clear();batch.forEach(fn=>fn());},
    paint(now) {const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn(now));},
    click(extra={}) {
      const cover={getBoundingClientRect:()=>({left:400,top:200,right:1000,bottom:650,width:600,height:450})};
      const link={href:destination,target:'',hasAttribute:()=>false,closest:()=>({querySelector:()=>cover})};
      const event={button:0,target:{closest:()=>link},preventDefault(){this.defaultPrevented=true;},...extra};
      document.fire('click',event);
      return event;
    }
  };
}

test('cover opening navigates once and preserves its handoff through pagehide',()=>{
  const f=fixture();f.initialize();
  assert.equal(f.click().defaultPrevented,true);
  assert.equal(f.root.classList.contains('project-opening-out'),true);
  f.flushTimers();f.flushTimers();
  assert.deepEqual(f.navigations,[destination]);
  f.window.fire('pagehide');
  assert.equal(f.root.classList.contains('project-opening-out'),false);
  assert.equal(JSON.parse(f.storage.get('portfolio:project-opening')).url,destination);
});

test('Escape cancels the sheet and all pending navigation',()=>{
  const f=fixture();f.initialize();f.click();
  f.window.fire('keydown',{key:'Escape',preventDefault(){}});
  f.flushTimers();
  assert.deepEqual(f.navigations,[]);
  assert.equal(f.storage.has('portfolio:project-opening'),false);
  assert.equal(f.root.classList.contains('project-opening-out'),false);
});

test('modified clicks, new tabs and reduced motion keep native link behavior',()=>{
  const f=fixture();f.initialize();
  assert.equal(f.click({metaKey:true}).defaultPrevented,undefined);
  assert.equal(f.click({ctrlKey:true}).defaultPrevented,undefined);
  assert.equal(f.click({button:1}).defaultPrevented,undefined);
  const reduced=fixture({reduced:true});reduced.initialize();
  assert.equal(reduced.click().defaultPrevented,undefined);
  const blocked=fixture({blockedStorage:true});blocked.initialize();blocked.click();blocked.flushTimers();
  assert.deepEqual(blocked.navigations,[destination],'Storage failure must not break navigation');
});

test('arrival consumes its handoff and removes masks and pending frames after revealing',()=>{
  const storage=new Map([['portfolio:project-opening',JSON.stringify({url:destination,createdAt:Date.now()})]]);
  const f=fixture({arrival:true,storage});
  assert.equal(f.root.classList.contains('project-opening-pending'),true);
  f.initialize();
  assert.equal(f.frames.size,0,'The ink reveal needs no JavaScript painting loop');
  assert(f.artwork.style.getPropertyValue('mask'));
  f.flushTimers();
  assert.equal(f.frames.size,0);
  assert.equal(f.artwork.style.getPropertyValue('mask'),'');
  assert.equal(f.root.classList.contains('project-opening-active'),false);
  assert.equal(storage.has('portfolio:project-opening'),false);
});

test('the live project starts inside a straight sheet before that sheet finishes expanding',async()=>{
  const f=fixture();f.initialize();f.click();
  const preview=f.nodes.find(node=>node.className==='project-opening-preview');
  const token=new URL(preview.src).hash.split('=')[1];
  f.window.fire('message',{origin:'https://portfolio.test',source:preview.contentWindow,data:{type:'project-opening:ready',token}});
  assert.equal(f.messages[0].type,'project-opening:start');
  assert.equal(f.effects[0].keyframes[0].clipPath,'inset(200.00px 440.00px 250.00px 400.00px round 3px)');
  assert(f.effects[0].keyframes.every(frame=>frame.transform===undefined),'The cover rectangle stays upright');
  assert.deepEqual(f.navigations,[],'The live reveal overlaps the expansion');
  f.window.fire('message',{origin:'https://portfolio.test',source:preview.contentWindow,data:{type:'project-opening:done',token}});
  assert.deepEqual(f.navigations,[],'An early ready message cannot bypass the expanding sheet');
  f.effects[0].finish();
  await Promise.resolve();await Promise.resolve();
  assert.deepEqual(f.navigations,[destination]);
  assert.equal(JSON.parse(f.storage.get('portfolio:project-opening')).settled,true,'The final page will not restart its entrance');
});

test('preview handoffs reject unrelated windows, origins, and tokens',()=>{
  const f=fixture();f.initialize();f.click();
  const preview=f.nodes.find(node=>node.className==='project-opening-preview');
  const token=new URL(preview.src).hash.split('=')[1];
  f.window.fire('message',{origin:'https://other.test',source:preview.contentWindow,data:{type:'project-opening:ready',token}});
  f.window.fire('message',{origin:'https://portfolio.test',source:{},data:{type:'project-opening:ready',token}});
  f.window.fire('message',{origin:'https://portfolio.test',source:preview.contentWindow,data:{type:'project-opening:ready',token:'wrong'}});
  assert.equal(f.messages.length,0);
  assert.deepEqual(f.navigations,[]);
});

test('unavailable preview assets fall back once to the settled native page',()=>{
  const f=fixture();f.initialize();f.click();
  const preview=f.nodes.find(node=>node.className==='project-opening-preview');
  const token=new URL(preview.src).hash.split('=')[1];
  const unavailable={type:'project-opening:unavailable',token};
  f.window.fire('message',{origin:'https://other.test',source:preview.contentWindow,data:unavailable});
  f.window.fire('message',{origin:'https://portfolio.test',source:{},data:unavailable});
  f.window.fire('message',{origin:'https://portfolio.test',source:preview.contentWindow,data:{...unavailable,token:'wrong'}});
  assert.deepEqual(f.navigations,[]);
  f.window.fire('message',{origin:'https://portfolio.test',source:preview.contentWindow,data:unavailable});
  f.flushTimers();
  f.window.fire('message',{origin:'https://portfolio.test',source:preview.contentWindow,data:unavailable});
  assert.deepEqual(f.navigations,[destination]);
  assert.equal(JSON.parse(f.storage.get('portfolio:project-opening')).settled,true,'Slow assets must not restart the reveal after navigation');
});

test('user input and slow initialization cannot leave case-study content hidden',()=>{
  const saved=()=>new Map([['portfolio:project-opening',JSON.stringify({url:destination,createdAt:Date.now()})]]);
  const interrupted=fixture({arrival:true,storage:saved()});interrupted.initialize();interrupted.window.fire('wheel');
  assert.equal(interrupted.frames.size,0);
  assert.equal(interrupted.artwork.style.getPropertyValue('mask'),'');
  const delayed=fixture({arrival:true,storage:saved()});delayed.flushTimers();delayed.initialize();
  assert.equal(delayed.root.classList.contains('project-opening-pending'),false);
  assert.equal(delayed.frames.size,0);
});
