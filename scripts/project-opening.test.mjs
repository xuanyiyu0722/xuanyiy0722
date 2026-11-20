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
    fire(type,event={}) { for(const callback of handlers.get(type)||[]) callback(event); }
  });
}
function fixture({ arrival=false,reduced=false,storage=new Map(),blockedStorage=false }={}) {
  const frames=new Map(),timers=new Map(),nodes=[],navigations=[];
  let serial=0;
  const node=() => {
    const classes=new Set(),properties=new Map();
    const result=emitter({ children:[],removed:false,style:{
      setProperty:(key,value)=>properties.set(key,value),removeProperty:key=>properties.delete(key),
      getPropertyValue:key=>properties.get(key)||''
    },classList:{ add:(...values)=>values.forEach(value=>classes.add(value)),remove:(...values)=>values.forEach(value=>classes.delete(value)),contains:value=>classes.has(value) },
    append(...items) { this.children.push(...items); },remove() { this.removed=true; },setAttribute() {},
    animate() { return { finished:new Promise(()=>{}),cancel() {} }; }
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
  const storageAPI={ getItem:key=>{if(blockedStorage)throw Error('Unavailable');return storage.get(key)||null;},setItem:(key,value)=>{if(blockedStorage)throw Error('Unavailable');storage.set(key,value);},removeItem:key=>storage.delete(key) };
  const context={document,window,sessionStorage:storageAPI,matchMedia:()=>emitter({matches:reduced}),Element:class {animate() {}},URL,
    location:{href:arrival ? destination : 'https://portfolio.test/gallery.html',assign:url=>navigations.push(url)},
    innerWidth:1440,innerHeight:900,performance:{now:()=>0},
    requestAnimationFrame:fn=>{frames.set(++serial,fn);return serial;},cancelAnimationFrame:id=>frames.delete(id),
    setTimeout:fn=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id)
  };
  vm.runInNewContext(source,context);
  return { document,window,root,artwork,frames,nodes,navigations,storage,
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
  assert.equal(f.frames.size,1);
  assert(f.artwork.style.getPropertyValue('mask'));
  f.paint(800);assert.equal(f.frames.size,1);
  f.paint(1600);
  assert.equal(f.frames.size,0);
  assert.equal(f.artwork.style.getPropertyValue('mask'),'');
  assert.equal(f.root.classList.contains('project-opening-active'),false);
  assert.equal(storage.has('portfolio:project-opening'),false);
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
