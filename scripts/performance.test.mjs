import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const source = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
function emitter(extra = {}) {
  const handlers = new Map();
  return Object.assign(extra, {
    addEventListener(type, callback) { const list = handlers.get(type) || []; list.push(callback); handlers.set(type, list); },
    fire(type, event = {}) { for (const fn of handlers.get(type) || []) fn(event); }
  });
}
function clock() {
  let id = 0;
  const pending = new Map();
  return {
    requestAnimationFrame(fn) { pending.set(++id, fn); return id; },
    cancelAnimationFrame(key) { pending.delete(key); },
    flush() { const batch = [...pending.values()]; pending.clear(); batch.forEach(fn => fn(100)); },
    get size() { return pending.size; }
  };
}
for (const kind of ['musubi','fridgekey']) {
  test(`${kind}: resize bursts paint only the latest valid height, with bounded pending work`, () => {
    const c = clock(), messages = [], writes = [];
    const main = emitter({contentWindow:{postMessage:m => messages.push(m)}, style:{}});
    Object.defineProperty(main.style, 'height', {get:() => main.height || '', set:value => { writes.push(value); main.height = value; }});
    const journey = emitter({contentWindow:{}, style:{}});
    const document = emitter({hidden:false, getElementById:id => id.includes('journey') ? journey : main});
    const window = emitter();
    let observe;
    const context = {document,window,...c,requestAnimationFrame:c.requestAnimationFrame, cancelAnimationFrame:c.cancelAnimationFrame,
      IntersectionObserver:class { constructor(fn) { observe = fn; } observe() {} }};
    vm.runInNewContext(source(kind === 'musubi' ? 'projects/musubi-hifi.js' : 'projects/fridgekey-development.js'), context);
    const type = kind === 'musubi' ? 'musubi-hifi-height' : 'fridgekey-height';
    const send = (height, sender = main.contentWindow) => window.fire('message', {source:sender, data:{type,height}});
    send(900, {}); send(NaN); send(Infinity); send(9000); send(1);
    assert.equal(c.size,0, 'Reject unrelated frames and invalid dimensions');
    for (let height = 500; height < 1500; height++) send(height);
    assert.equal(c.size,1, 'One pending paint despite 1,000 resize messages');
    c.flush(); assert.deepEqual(writes,[kind === 'musubi' ? '1502px' : '1503px']);
    send(1499); assert.equal(c.size,0, 'Repeated dimensions do not invalidate layout');
    send(1600); send(1499); c.flush(); assert.equal(writes.length,1, 'A reverted burst does not cause an unnecessary write');
    observe([{isIntersecting:true}]); assert.equal(messages.at(-1).visible,true);
    const count = messages.length; observe([{isIntersecting:true}]); assert.equal(messages.length,count);
    document.hidden = true; document.fire('visibilitychange'); assert.equal(messages.at(-1).visible,false);
    observe([{isIntersecting:true}]); assert.equal(messages.at(-1).visible,false, 'Observer updates cannot resume a hidden prototype');
    document.hidden = false; document.fire('visibilitychange'); assert.equal(messages.at(-1).visible,true);
    send(1800); window.fire('pagehide'); assert.equal(c.size,0); assert.equal(messages.at(-1).visible,false);
    window.fire('pageshow'); c.flush(); assert.equal(messages.at(-1).visible,true);
    assert.equal(main.height, kind === 'musubi' ? '1803px' : '1804px');
    if (kind === 'fridgekey') { send(700,journey.contentWindow); c.flush(); assert.equal(journey.style.height,'704px'); }
  });
}
for (const name of ['projects/research-viewer.js','projects/musubi-background.js','projects/naborfood-experience.js','projects/everpaw-research.js']) {
  test(`${name}: pointer bursts retain the latest sample and the release position`, () => {
    const c = clock(), scroller = emitter({classList:{remove() {}},scrollLeft:0,scrollTop:0}), window = emitter();
    const script = source(name);
    const fragment = script.slice(script.indexOf('  let dragFrame = 0, pointer;'),script.indexOf("  scroller.addEventListener('pointercancel', endDrag);") + "  scroller.addEventListener('pointercancel', endDrag);".length);
    const context = vm.createContext({scroller,window,drag:{x:10,y:20,left:400,top:600},requestAnimationFrame:c.requestAnimationFrame,cancelAnimationFrame:c.cancelAnimationFrame});
    vm.runInContext(fragment,context);
    for (let i = 0; i < 500; i++) scroller.fire('pointermove',{clientX:i,clientY:i*2});
    assert.equal(c.size,1); assert.equal(scroller.scrollLeft,0);
    c.flush(); assert.equal(scroller.scrollLeft,-89); assert.equal(scroller.scrollTop,-378);
    scroller.fire('pointermove',{clientX:510,clientY:520}); scroller.fire('pointerup');
    assert.equal(scroller.scrollLeft,-100); assert.equal(scroller.scrollTop,100); assert.equal(c.size,0);
    scroller.fire('pointermove',{clientX:900,clientY:900}); assert.equal(c.size,0,'Released viewers schedule no work');
    vm.runInContext('drag = {x:0,y:0,left:0,top:0}',context);
    scroller.fire('pointermove',{clientX:20,clientY:30}); window.fire('pagehide'); assert.equal(c.size,0);
  });
}

test('station notes read geometry before mutations and skip identical SVG updates', () => {
  const c = clock(), order = [], writes = [];
  const rect = (left,top,width,height) => ({left,top,width,height,right:left+width,bottom:top+height});
  const node = box => ({getBoundingClientRect() { order.push('read'); return box; }});
  const paths = Object.fromEntries(['qr','brand','bars'].map(name => [name, {getAttribute:key => paths[name][key],setAttribute(key,value) { order.push('write'); writes.push(value); this[key]=value; }}]));
  const image = emitter(node(rect(400,40,300,400)));
  const leaders = {querySelector:q => paths[q.match(/"(\w+)"/)[1]],getAttribute:key => leaders[key],setAttribute(key,value) { order.push('write');writes.push(value);this[key]=value; }};
  const notes = {qr:node(rect(10,100,200,40)),brand:node(rect(800,40,200,40)),bars:node(rect(800,300,200,40))};
  const overview = node(rect(0,0,1100,500)); overview.querySelector = q => q.includes('img') ? image : q.includes('leaders') ? leaders : notes[q.match(/"(\w+)"/)[1]];
  const document = {querySelector:() => overview,fonts:{ready:Promise.resolve()}}, window = emitter();
  vm.runInNewContext(source('projects/naborfood-station-notes.js'), {document,window,matchMedia:() => ({matches:false}),ResizeObserver:class { observe() {} },requestAnimationFrame:c.requestAnimationFrame,cancelAnimationFrame:c.cancelAnimationFrame});
  c.flush(); assert.equal(order.slice(0,5).every(item => item === 'read'),true);
  assert.equal(order.slice(5).every(item => item === 'write'),true);
  assert.equal(writes.length,4);
  for (let i=0;i<100;i++) window.fire('resize'); assert.equal(c.size,1);
  c.flush(); assert.equal(writes.length,4,'Unchanged leader geometry causes no DOM writes');
  window.fire('resize'); window.fire('pagehide'); assert.equal(c.size,0);
  window.fire('pageshow'); assert.equal(c.size,1);
});

test('home typography caches ink metrics and never measures layout after its writes', () => {
  const c = clock(), order = [], writes = [];
  let resize, measurements = 0, shift = 0;
  const style = (onWrite = () => {}) => new Proxy({}, {set(target,key,value) { order.push('write');writes.push([key,value]);onWrite(key,value);target[key]=value;return true; }});
  const rect = (left,top,width,height) => ({left,top,width,height,right:left+width,bottom:top+height});
  const node = get => ({getBoundingClientRect() { order.push('read');return get(); }});
  const frame = node(() => rect(0,0,1100,700));
  const note = node(() => rect(300,50+shift,180,36));
  const layout = {style:style((key,value) => {if(key === 'transform')shift=Number(value.match(/translateY\(([^p]+)px/)?.[1]||0);}),querySelector:() => note};
  const carton = {...node(() => rect(500,20+shift,800,600)),closest:() => layout};
  const svg = {closest:() => frame,querySelectorAll:() => [],querySelector:() => ({replaceChildren(){}}),viewBox:{baseVal:{width:1167,height:1284}},style:style()};
  const fonts = emitter({ready:{then() {}}});
  const document = emitter({querySelector:q => q.includes('hero-poster') ? svg : carton,fonts,
    createElement:() => ({getContext:() => ({measureText(word) { measurements++;return {width:word.length*70,actualBoundingBoxAscent:95,actualBoundingBoxDescent:22}; }})})});
  const window = emitter({ResizeObserver:true});
  vm.runInNewContext(source('home-typography.js'), {document,window,matchMedia:() => ({matches:false}),ResizeObserver:class {constructor(fn) {resize=fn;}observe() {}},requestAnimationFrame:c.requestAnimationFrame,cancelAnimationFrame:c.cancelAnimationFrame});
  assert.equal(measurements,5); assert(shift>0,'Exercise a caption that must move to avoid overlap');
  const original = JSON.stringify(svg.style), firstShift=shift;
  for(let i=0;i<100;i++)resize(); assert.equal(c.size,1);
  order.length=0;writes.length=0;c.flush();
  assert.equal(measurements,5,'Resizing reuses the same font ink metrics');
  assert.equal(shift,firstShift,'The previous shift is removed from the next measurement');
  assert.equal(JSON.stringify(svg.style),original);assert.equal(writes.length,0,'Stable geometry does not invalidate styles');
  fonts.fire('loadingdone');c.flush();assert.equal(measurements,10,'Font loading invalidates ink measurements');
  resize();window.fire('pagehide');assert.equal(c.size,0);
  window.fire('pageshow');order.length=0;c.flush();
  assert.equal(order.slice(0,3).every(x => x === 'read'),true);
  assert(!order.slice(order.indexOf('write')+1).includes('read') || !order.includes('write'));
});

// Immutable caching is safe only while content and filenames agree.
test('optimized assets retain their content hashes for immutable caching', () => {
  const manifest = JSON.parse(source('scripts/performance-assets.json'));
  for (const record of [...manifest.media,...manifest.fonts,...manifest.teachers,...manifest.everpawSuppliedFonts]) {
    const hash = record.optimized.match(/\.([a-f0-9]{12})\.(?:webp|svg|woff2)$/)?.[1];
    assert(hash,record.optimized);
    const buffer = fs.readFileSync(new URL('../'+record.optimized,import.meta.url));
    assert.equal(createHash('sha256').update(buffer).digest('hex').slice(0,12),hash,record.optimized);
    assert.equal(buffer.length,record.afterBytes);
  }
});
