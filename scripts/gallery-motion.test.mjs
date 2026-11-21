import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = name => fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
function emitter(extra={}) {
  const events = new Map();
  return Object.assign(extra,{
    addEventListener(type,fn) { if(!events.has(type))events.set(type,new Set());events.get(type).add(fn); },
    removeEventListener(type,fn) {events.get(type)?.delete(fn);},
    fire(type,event={}) {for(const fn of [...events.get(type)||[]])fn(event);}
  });
}
function classes(...initial) {const values=new Set(initial);return {add:(...v)=>v.forEach(x=>values.add(x)),remove:(...v)=>v.forEach(x=>values.delete(x)),contains:x=>values.has(x)};}
function clock() {
  let id=0;const frames=new Map(),timers=new Map();
  return {frames,timers,
    requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:key=>frames.delete(key),
    setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:key=>timers.delete(key),
    paint(){const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn(100));},
    timeout(delay){for(const [key,value] of [...timers])if(value.delay===delay){timers.delete(key);value.fn();}}
  };
}
const settle = async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function animation(node,keyframes,options,all) {
  let resolve,reject;const finished=new Promise((yes,no)=>{resolve=yes;reject=no;});
  const value={node,keyframes,options,finished,currentTime:0,cancel(){reject(new Error('cancelled'));},complete(){resolve();}};all.push(value);return value;
}
function entryFixture() {
  const c=clock(),all=[],observers=[];
  const root={classList:classes('page-arrival-active','gallery-entry-pending'),dataset:{}};
  const make=kind=>({kind,classList:classes(),animate:(keys,opts)=>animation(kind,keys,opts,all)});
  const first=[make('left'),make('right'),make('cover')],offscreen=[make('off-left'),make('off-right'),make('off-cover')];
  const stage=(top,nodes)=>({getBoundingClientRect:()=>({top,bottom:top+700}),querySelectorAll:q=>q.includes('project-left')?nodes.slice(0,2):nodes.slice(2)});
  const stages=[stage(0,first),stage(700,offscreen)];
  const showcase={querySelector:()=>({decode:()=>Promise.resolve()}),querySelectorAll:()=>stages};
  const document={documentElement:root,fonts:{ready:Promise.resolve()},querySelector:()=>showcase};
  const window=emitter();const reduce=emitter({matches:false});
  vm.runInNewContext(source('gallery-entry.js'),{document,window,matchMedia:()=>reduce,scrollY:0,innerHeight:700,
    Element:{prototype:{animate(){}}},MutationObserver:class{constructor(fn){observers.push(fn);}observe(){}disconnect(){}},
    getComputedStyle:node=>({transform:node.kind==='cover'?'none':'matrix(1, 0, 0, 1, 0, -100)'}),...c});
  return {c,all,root,window,observers,first};
}
test('gallery entry waits for the curtain and only animates the visible card',async()=>{
  const f=entryFixture();await settle();assert.equal(f.all.length,0);assert.equal(f.c.frames.size,0);
  f.root.classList.remove('page-arrival-active');f.observers.forEach(fn=>fn());await settle();f.c.paint();f.c.paint();
  assert.equal(f.all.length,3,'No entry animations for offscreen projects');
  assert.deepEqual(f.all.map(a=>a.options.delay),[0,45,240]);
  assert.deepEqual(f.all.map(a=>a.options.duration),[850,850,1100]);
  assert.equal(f.all[0].keyframes[1].transform,'matrix(1, 0, 0, 1, 0, -100)','Preserve vertical centering');
  assert.equal(f.root.dataset.galleryEntry,'playing');
  f.all.forEach(a=>a.complete());await settle();assert.equal(f.root.dataset.galleryEntry,'complete');
  assert(f.first.every(n=>!n.classList.contains('gallery-entry-node')),'Release temporary layer promotion');
});
test('opening a project cancels queued gallery entry work before it can restart',async()=>{
  const f=entryFixture();f.window.fire('project-opening-start');
  f.root.classList.remove('page-arrival-active');f.observers.forEach(fn=>fn());await settle();f.c.paint();f.c.paint();
  assert.equal(f.all.length,0);assert.equal(f.c.frames.size,0);assert.equal(f.root.dataset.galleryEntry,'complete');
});
function revealFixture({elapsed=0,decoders=[],fonts=Promise.resolve(),start=true}={}) {
  const c=clock(),all=[],messages=[],svgNodes=[];
  const root={classList:classes(),dataset:{}};
  const style={setProperty(){},removeProperty(){}};
  const art={style,classList:classes(),animate:(keys,opts)=>animation('art',keys,opts,all)};
  const lines=Array.from({length:7},()=>({classList:classes(),animate:(keys,opts)=>animation('line',keys,opts,all)}));
  const hero={querySelector:()=>art,querySelectorAll:()=>lines};
  const group={children:[],append(node){this.children.push(node);}};
  const document=emitter({documentElement:root,currentScript:{src:'https://portfolio.test/project-opening.js?v=179'},fonts:{ready:fonts},
    body:{append(){}},querySelector:q=>q==='.case-hero'?hero:null,
    querySelectorAll:q=>q==='.project-opening-line'?lines:q==='.case-hero img'?decoders.map(decode=>({decode})):[],
    createElementNS:(ns,tag)=>{
      const node={tag,namespaceURI:ns,attributes:new Map(),children:[],classList:classes(),
        append(child){this.children.push(child);},setAttribute(key,value){this.attributes.set(key,value);},
        querySelector:()=>group,remove(){},animate:(keys,opts)=>animation(tag,keys,opts,all)};
      svgNodes.push(node);return node;
    }
  });
  const parent={postMessage:message=>messages.push(message)};
  const window=emitter({parent});
  vm.runInNewContext(source('project-opening.js'),{document,window,location:{hash:'#portfolio-preview=token-1',href:'blob:https://portfolio.test/preview#portfolio-preview=token-1',origin:'https://portfolio.test'},
    matchMedia:()=>emitter({matches:false}),Element:{prototype:{animate(){}}},innerWidth:1440,innerHeight:700,URL,Blob,performance:{now:()=>0},
    sessionStorage:{getItem:()=>null},...c});
  document.fire('DOMContentLoaded');
  const startPreview=()=>window.fire('message',{origin:'https://portfolio.test',source:parent,data:{type:'project-opening:start',token:'token-1',elapsed}});
  if(start)startPreview();
  return {c,all,messages,svgNodes,root,window,art,startPreview};
}
test('artwork reveals on one opacity/transform layer without SVG masks or a painting loop',()=>{
  const f=revealFixture(),art=f.all.filter(a=>a.node==='art');
  assert.equal(art.length,1);assert.equal(f.c.frames.size,0);assert.equal(f.svgNodes.length,0);
  assert.equal(art[0].options.duration,850);assert.equal(art[0].options.delay,120);
  assert.equal(art[0].keyframes[0].opacity,0);assert.equal(art[0].keyframes[1].opacity,1);
  assert(art[0].keyframes.every(frame=>Object.keys(frame).every(key=>['opacity','transform'].includes(key))));
  assert(f.art.classList.contains('project-opening-art'));
  f.c.timeout(1900);assert.equal(f.messages.at(-1).type,'project-opening:done');
  assert(!f.art.classList.contains('project-opening-art'));
  assert(!f.root.classList.contains('project-opening-active'));assert.equal(f.c.timers.size,0);
});
test('late preview readiness seeks the shared clock instead of restarting text reveals',()=>{
  const f=revealFixture({elapsed:1800});assert.equal(f.all.length,8);assert(f.all.every(a=>a.currentTime===1800));
  f.c.timeout(100);assert.equal(f.messages.at(-1).type,'project-opening:done');
});
test('artwork cleanup cancels its completion timer and ignores foreign messages',()=>{
  const f=revealFixture();assert.equal(f.c.frames.size,0);
  f.window.fire('pagehide');assert.equal(f.c.timers.size,0);
  const g=revealFixture();const count=g.all.length;
  g.window.fire('message',{origin:'https://foreign.test',source:g.window.parent,data:{type:'project-opening:start',token:'token-1',elapsed:0}});
  assert.equal(g.all.length,count);
});

test('preview readiness waits for all hero images and fonts to decode',async()=>{
  let decode,wordmark,fonts;
  const imageReady=new Promise(resolve=>{decode=resolve;}),wordmarkReady=new Promise(resolve=>{wordmark=resolve;}),fontReady=new Promise(resolve=>{fonts=resolve;});
  const f=revealFixture({start:false,decoders:[()=>imageReady,()=>wordmarkReady],fonts:fontReady});
  await settle();assert.equal(f.messages.length,0);
  decode();await settle();assert.equal(f.messages.length,0,'The MUSUBI wordmark must also finish decoding');
  wordmark();await settle();assert.equal(f.messages.length,0,'Fonts also settle before the preview appears');
  fonts();await settle();assert.equal(f.messages.at(-1).type,'project-opening:ready');
  f.startPreview();assert.equal(f.all.length,8);
});

test('slow or broken hero images request a native fallback instead of entering mid-reveal',async()=>{
  let decode;
  const imageReady=new Promise(resolve=>{decode=resolve;});
  const f=revealFixture({start:false,decoders:[()=>imageReady]});
  f.c.timeout(1200);assert.equal(f.messages.at(-1).type,'project-opening:unavailable');
  assert(!f.root.classList.contains('project-opening-pending'));
  decode();await settle();assert.equal(f.messages.length,1,'A late decode cannot start another reveal');
  assert.equal(f.all.length,0);
  const broken=revealFixture({start:false,decoders:[()=>Promise.reject(new Error('broken image'))]});
  await settle();assert.equal(broken.messages.at(-1).type,'project-opening:unavailable');
  assert.equal(broken.all.length,0);
});

test('leaving a pending preview prevents a late decode from restarting it',async()=>{
  let decode;
  const imageReady=new Promise(resolve=>{decode=resolve;});
  const f=revealFixture({start:false,decoders:[()=>imageReady]});
  f.window.fire('pagehide');decode();await settle();
  assert.equal(f.messages.length,0);assert.equal(f.c.timers.size,0);assert.equal(f.all.length,0);
});

test('scroll bindings wait for the curtain, batch layout reads and survive BFCache once',async()=>{
  const c=clock(),order=[],observers=[],motions=[];
  let smoothCreated=0,smoothDestroyed=0,stopped=0,started=0;
  const style={removeProperty(){order.push('write');}};
  const root={classList:classes('page-arrival-active'),dataset:{},clientWidth:1440};
  const cards=Array.from({length:4},()=>({offsetHeight:440,offsetWidth:1000,style,
    getBoundingClientRect(){order.push('read');return {height:440};},
    querySelector:()=>({style}),closest:()=>({})}));
  const fonts={status:'loading',ready:Promise.resolve()};
  const document=emitter({documentElement:root,hidden:false,fonts,querySelectorAll:()=>cards});
  class Lenis{constructor(){smoothCreated++;}on(){}stop(){stopped++;}start(){started++;}destroy(){smoothDestroyed++;}}
  const Motion={frame:{setup(){}},cancelFrame(){},animate:(...args)=>{const motion={cancel(){}};motions.push(motion);order.push('write');return motion;},scroll:()=>()=>{}};
  const window=emitter({Lenis,Motion});const reduce=emitter({matches:false});
  vm.runInNewContext(source('gallery-scroll.js'),{document,window,Lenis,Motion,matchMedia:()=>reduce,
    innerWidth:1440,innerHeight:700,performance:{now:()=>0},MutationObserver:class{constructor(fn){observers.push(fn);}observe(){}disconnect(){}},...c});
  c.paint();assert.equal(motions.length,0);assert.equal(smoothCreated,0);
  root.classList.remove('page-arrival-active');observers.forEach(fn=>fn());c.paint();
  assert.equal(motions.length,12);assert.equal(smoothCreated,1);assert.deepEqual(order.slice(0,4),['read','read','read','read']);
  window.fire('project-opening-start');assert.equal(stopped,1);
  window.fire('project-opening-end');assert.equal(started,1);c.paint();
  await settle();c.paint();assert.equal(motions.length,12,'Font readiness with stable layout does not rebuild bindings');
  observers.forEach(fn=>fn());c.paint();assert.equal(motions.length,12,'Own root classes cannot create a scheduling loop');
  window.fire('pagehide');assert.equal(smoothDestroyed,1);assert.equal(c.frames.size,0);
  window.fire('pageshow',{persisted:true});c.paint();assert.equal(motions.length,24);assert.equal(smoothCreated,2);
  reduce.matches=true;reduce.fire('change');assert.equal(smoothDestroyed,2);assert(!root.classList.contains('gallery-scroll-linked'));
});
