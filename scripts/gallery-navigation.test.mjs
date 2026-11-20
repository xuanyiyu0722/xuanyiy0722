import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function emitter(extra = {}) {
  const handlers = new Map();
  return Object.assign(extra, {
    addEventListener(type, callback) {
      const list = handlers.get(type) || [];
      list.push(callback);
      handlers.set(type, list);
    },
    fire(type, event = {}) { for (const callback of handlers.get(type) || []) callback(event); }
  });
}

function gallery() {
  const frames = new Map(), timers = new Map(), calls = [];
  let serial = 0;
  const track = emitter({ clientHeight:116, setAttribute() {}, getBoundingClientRect:() => ({ top:400, height:116 }) });
  const thumb = { clientHeight:22, style:{} };
  const guide = { querySelector:selector => selector.includes('thumb') ? thumb : track };
  const previous = emitter(), next = emitter(), status = {};
  const stages = ['MUSUBI','FridgeKey','NABORFOOD','EverPaw'].map((title,index) => ({
    querySelector:() => ({ textContent:title }),
    getBoundingClientRect:() => ({ top:index * 900 - context.scrollY, height:900 }),
    contains:() => false
  }));
  const root = { scrollHeight:3600, dataset:{}, classList:{ contains:() => false } };
  const document = emitter({ documentElement:root, activeElement:null,
    querySelector:selector => ({ '.gallery-scroll-guide':guide, '[data-gallery-previous]':previous, '[data-gallery-next]':next, '.gallery-keyboard-status':status })[selector],
    querySelectorAll:() => stages
  });
  const window = emitter({ PortfolioGalleryScroll:{ to:top => calls.push(top) } });
  const context = vm.createContext({ document,window,innerWidth:1440,innerHeight:900,scrollY:0,
    requestAnimationFrame:fn => { frames.set(++serial,fn); return serial; },
    cancelAnimationFrame:id => frames.delete(id),
    setTimeout:fn => { timers.set(++serial,fn); return serial; },
    clearTimeout:id => timers.delete(id)
  });
  vm.runInContext(fs.readFileSync(new URL('../gallery-position.js',import.meta.url),'utf8'),context);
  const key = (value, extra = {}) => {
    const event = { type:'keydown',key:value,target:{ closest:() => null }, preventDefault() { this.defaultPrevented = true; }, ...extra };
    document.fire('keydown',event);
    window.fire('keydown',event);
    return event;
  };
  return { key,calls,previous,next,status,window,
    settle(top) {
      context.scrollY = top;
      window.fire('scroll');
      const batch = [...frames.values()]; frames.clear(); batch.forEach(fn => fn());
      const timeouts = [...timers.values()]; timers.clear(); timeouts.forEach(fn => fn());
    }
  };
}

test('gallery arrows move by one project, keep rapid taps, and clamp at both ends', () => {
  const g = gallery();
  assert.equal(g.key('ArrowDown').defaultPrevented,true);
  g.key('ArrowDown');
  g.key('ArrowDown');
  g.key('ArrowDown');
  assert.deepEqual(g.calls,[900,1800,2700,2700]);
  g.settle(2700);
  assert.equal(g.next.disabled,true);
  g.key('ArrowUp');
  assert.equal(g.calls.at(-1),1800);
  g.key('Home');
  g.key('ArrowUp');
  assert.equal(g.calls.at(-1),0);
  g.settle(0);
  assert.equal(g.previous.disabled,true);
});

test('reversing a key cancels an in-flight move even before scrolling has started', () => {
  const g = gallery();
  g.key('ArrowDown');
  g.key('ArrowUp');
  assert.deepEqual(g.calls,[900,0]);
  g.next.fire('click');
  assert.equal(g.calls.at(-1),900);
  assert.equal(g.status.textContent,'2 of 4 — FridgeKey');
});

test('gallery preserves text editing, modified shortcuts, and key-repeat control', () => {
  const g = gallery();
  assert.equal(g.key('ArrowDown',{ target:{ closest:() => ({}) } }).defaultPrevented,undefined);
  assert.equal(g.key('ArrowDown',{ metaKey:true }).defaultPrevented,undefined);
  assert.deepEqual(g.calls,[]);
  g.key('ArrowDown');
  g.key('ArrowDown',{ repeat:true });
  assert.deepEqual(g.calls,[900]);
  g.settle(900);
  g.key('ArrowDown',{ repeat:true });
  assert.equal(g.calls.at(-1),1800);
});

test('a wheel gesture releases the previous target so the next key uses the visible project', () => {
  const g = gallery();
  g.key('End');
  g.window.fire('wheel',{ type:'wheel' });
  g.settle(900);
  g.key('ArrowDown');
  assert.equal(g.calls.at(-1),1800);
});
