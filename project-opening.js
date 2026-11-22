/* A straight paper sheet reveals the live case study before the expansion ends. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'portfolio:project-opening';
  const pages = ['project-04.html','fridgekey.html','naborfood.html','project-03.html'];
  const runtimeURL = document.currentScript.src;
  const destinations = new Set(pages.map(page => new URL(`projects/${page}`,runtimeURL).href));
  const previewToken = window.parent !== window ? location.hash.match(/^#portfolio-preview=([a-z0-9-]+)$/)?.[1] : null;
  const animations = new Set(), timers = new Set();
  const previews = new Map();
  const targetOrigin = location.origin === 'null' ? '*' : location.origin;
  let opening = null, artwork, handoff, previewStarted = false, generation = 0;
  const canAnimate = () => !reduce.matches && typeof Element.prototype.animate === 'function';
  const after = (callback,delay) => {
    const id = setTimeout(() => { timers.delete(id); callback(); },delay);
    timers.add(id);
    return id;
  };
  const cancelTimer = id => { clearTimeout(id); timers.delete(id); };
  const track = animation => {
    animations.add(animation);
    animation.finished.catch(() => {}).then(() => animations.delete(animation));
    return animation;
  };
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved && destinations.has(saved.url) && saved.url === location.href &&
        Date.now()-saved.createdAt < 10000 && saved.createdAt <= Date.now()) {
      handoff = saved;
      sessionStorage.removeItem(storageKey);
    }
  } catch { /* Native links remain available without session storage. */ }
  if (handoff?.settled) root.classList.add('project-opening-settled');
  else if ((previewToken || handoff) && canAnimate()) {
    root.classList.add('project-opening-pending');
    after(() => { root.classList.remove('project-opening-pending'); handoff=null; },2500);
  }
  const clean = event => {
    const wasOpening = Boolean(opening);
    generation++;
    timers.forEach(id => clearTimeout(id)); timers.clear();
    animations.forEach(animation => animation.cancel()); animations.clear();
    if (opening?.previewURL) URL.revokeObjectURL(opening.previewURL);
    opening?.sheet.remove();
    opening = null;
    if (artwork) {
      artwork.classList.remove('project-opening-art');
      artwork = null;
    }
    document.querySelectorAll('.project-opening-line').forEach(node => node.classList.remove('project-opening-line'));
    // A completed arrival stays settled for this document's lifetime. Clearing
    // it here lets later entrance/observer setup conceal the hero a second time.
    root.classList.remove('project-opening-pending','project-opening-active','project-opening-out');
    handoff = null;
    if (wasOpening && event?.type !== 'pagehide' && event?.type !== 'beforeprint') window.dispatchEvent(new Event('project-opening-end'));
  };
  // Cache only four small first-screen documents. No case-study widgets, charts,
  // videos, or nested app prototypes are initialized inside the opening sheet.
  const prefetch = url => {
    if (!destinations.has(url) || !canAnimate() || location.protocol === 'file:' ||
        typeof fetch !== 'function' || typeof DOMParser !== 'function' || typeof URL.createObjectURL !== 'function') return null;
    if (previews.has(url)) return previews.get(url);
    const pending = fetch(url, {credentials:'same-origin'}).then(response => {
      if (!response.ok) throw new Error('Project preview unavailable');
      return response.text();
    }).then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const hero = doc.querySelector('.case-hero');
      const main = doc.querySelector('main');
      if (!hero || !main) throw new Error('Project hero unavailable');
      const navigation = [...doc.querySelectorAll('.project-sidebar,.project-mobile-bar')];
      main.replaceChildren(hero);
      doc.body.replaceChildren(...navigation, main);
      doc.querySelectorAll('script,base').forEach(node => node.remove());
      doc.querySelectorAll('.reveal').forEach(node => node.classList.remove('reveal','in'));
      // A Blob document keeps local SVG mask fragments local. Rebase source URLs
      // instead of using <base>, which would redirect those fragments elsewhere.
      doc.querySelectorAll('[src],[href],[poster]').forEach(node => {
        for (const name of ['src','href','poster']) {
          const value = node.getAttribute(name);
          if (value && !value.startsWith('#')) node.setAttribute(name, new URL(value,url).href);
        }
      });
      doc.querySelectorAll('style,[style]').forEach(node => {
        const rebase = css => css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/g, (match,quote,value) =>
          value.startsWith('#') ? match : `url("${new URL(value,url).href}")`);
        if (node.tagName === 'STYLE') node.textContent = rebase(node.textContent);
        else node.setAttribute('style',rebase(node.getAttribute('style')));
      });
      const style = doc.createElement('style');
      style.textContent = 'html{overflow-y:scroll}';
      const script = doc.createElement('script');
      script.src = runtimeURL;
      script.defer = true;
      doc.head.append(style,script);
      return '<!doctype html>\n'+doc.documentElement.outerHTML;
    }).catch(() => { previews.delete(url); return null; });
    previews.set(url,pending);
    return pending;
  };
  const navigate = settled => {
    if (!opening || opening.navigated) return;
    opening.navigated = true;
    timers.forEach(id => clearTimeout(id)); timers.clear();
    try { sessionStorage.setItem(storageKey,JSON.stringify({url:opening.url,createdAt:Date.now(),settled})); } catch {}
    location.assign(opening.url);
  };
  const finishWhenReady = () => { if (opening?.paperDone && opening.childDone) navigate(true); };
  const startPreview = () => {
    if (!opening?.ready || opening.startedAt === null || opening.childStarted) return;
    opening.childStarted = true;
    opening.frame.style.visibility='visible';
    opening.frame.contentWindow.postMessage({type:'project-opening:start',token:opening.token,elapsed:Math.max(0,performance.now()-opening.startedAt)},targetOrigin);
  };
  const grow = () => {
    if (!opening?.ready || opening.navigated || opening.startedAt !== null) return;
    cancelTimer(opening.loadTimer);
    opening.startedAt=performance.now();
    opening.sheet.style.visibility='visible';
    // Loading time must not consume the reveal's own completion deadline.
    after(() => navigate(true),2400);
    const session = opening;
    try {
      track(opening.sheet.animate([
        {clipPath:opening.from},
        {clipPath:'inset(0px 0px 0px 0px round 0px)'}
      ],{duration:900,easing:'cubic-bezier(.76,0,.18,1)',fill:'both'})).finished.then(() => {
        if (opening !== session) return;
        session.paperDone=true;
        finishWhenReady();
      },() => {});
      startPreview();
    } catch { navigate(true); }
  };
  const open = (event,link) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.hasAttribute('download') || (link.target && link.target !== '_self') || !destinations.has(link.href) || !canAnimate()) return;
    const cover=link.closest('.gallery-project')?.querySelector('.gallery-cover');
    if (!cover) return;
    // Settle the gallery entrance before measuring the source sheet rectangle.
    window.dispatchEvent(new Event('project-opening-start'));
    const rect=cover.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    event.preventDefault();
    if (opening) return;
    const preview = prefetch(link.href);
    const sheet=document.createElement('div');
    sheet.className='project-opening-sheet';
    sheet.setAttribute('aria-hidden','true');
    const inset=[Math.max(0,rect.top),Math.max(0,innerWidth-rect.right),Math.max(0,innerHeight-rect.bottom),Math.max(0,rect.left)];
    const from=`inset(${inset.map(value => value.toFixed(2)+'px').join(' ')} round 3px)`;
    sheet.style.clipPath=from;
    sheet.style.visibility='hidden';
    const frame=document.createElement('iframe');
    frame.className='project-opening-preview';
    frame.title='Opening project'; frame.tabIndex=-1;
    frame.setAttribute('aria-hidden','true');
    const token=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
    const url=new URL(link.href); url.hash='portfolio-preview='+token;
    if (!preview) frame.src=url.href;
    sheet.append(frame);
    opening={sheet,frame,from,token,url:link.href,previewURL:null,startedAt:null,loadTimer:null,ready:false,childStarted:false,paperDone:false,childDone:false,navigated:false};
    document.body.append(sheet);
    root.classList.add('project-opening-out');
    const session = opening;
    preview?.then(html => {
      if (opening !== session) return;
      if (!html) { frame.src=url.href; return; }
      session.previewURL = URL.createObjectURL(new Blob([html],{type:'text/html'}));
      frame.src = session.previewURL+'#portfolio-preview='+token;
    });
    // Keep the gallery cover visible until the preview has decoded its first screen.
    session.loadTimer=after(() => navigate(true),3200);
  };
  const reveal = (elapsed=0) => {
    const hero=document.querySelector('.case-hero');
    artwork=hero?.querySelector('.case-hero-art');
    if (!hero || !artwork || !canAnimate()) { clean(); return; }
    timers.forEach(id => clearTimeout(id)); timers.clear();
    root.classList.add('project-opening-active');
    const complete = () => {
      clean();
      if (previewToken) window.parent.postMessage({type:'project-opening:done',token:previewToken},targetOrigin);
    };
    try {
      const lines=[...hero.querySelectorAll('.case-brand,.case-tagline,.summary--project > p,.case-meta > span')];
      lines.forEach((node,index) => {
        const planned=index < 3 ? 580+index*120 : 1000+(index-3)*60;
        node.classList.add('project-opening-line');
        const motion = track(node.animate([
          {clipPath:'inset(0% 0% 100% 0%)',transform:'translateY(26px)'},
          {clipPath:'inset(0% 0% 0% 0%)',transform:'translateY(0px)'}
        ],{duration:700,delay:planned,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'}));
        motion.currentTime = elapsed;
      });
      const navigation=document.querySelector(innerWidth > 820 ? '.project-sidebar' : '.project-mobile-bar');
      if (navigation) {
        const motion = track(navigation.animate([
          {clipPath:'inset(0% 0% 100% 0%)'},{clipPath:'inset(0% 0% 0% 0%)'}
        ],{duration:500,delay:950,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'}));
        motion.currentTime = elapsed;
      }
      // Opacity/transform keep the decoded artwork on one reusable layer.
      // SVG masks isolated MUSUBI's blend backdrop and repainted every frame.
      artwork.classList.add('project-opening-art');
      const artMotion=track(artwork.animate([
        {opacity:0,transform:'translateY(16px)'},
        {opacity:1,transform:'translateY(0px)'}
      ],{duration:850,delay:120,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'}));
      artMotion.currentTime=elapsed;
      root.classList.remove('project-opening-pending');
      after(complete,Math.max(0,1900-elapsed));
    } catch { complete(); }
  };
  window.addEventListener('message',event => {
    if (event.origin !== location.origin || !event.data) return;
    const data=event.data;
    if (opening && !opening.navigated && event.source === opening.frame.contentWindow && data.token === opening.token) {
      if (data.type === 'project-opening:ready') { opening.ready=true; grow(); startPreview(); }
      else if (data.type === 'project-opening:done' && opening.childStarted) { opening.childDone=true; finishWhenReady(); }
      else if (data.type === 'project-opening:unavailable') navigate(true);
    } else if (previewToken && !previewStarted && event.source === window.parent && data.token === previewToken &&
               data.type === 'project-opening:start' && Number.isFinite(data.elapsed) && data.elapsed >= 0 && data.elapsed < 5000) {
      previewStarted=true;
      reveal(data.elapsed);
    }
  });
  document.addEventListener('DOMContentLoaded',() => {
    if (document.querySelector('.gallery-showcase')) {
      const warmPreview = event => {
        const link=event.target.closest('.gallery-cover-stage,.gallery-project-title-link');
        if (link) prefetch(link.href);
      };
      document.addEventListener('pointerover',warmPreview,{passive:true});
      document.addEventListener('focusin',warmPreview);
      document.addEventListener('click',event => {
        const link=event.target.closest('.gallery-cover-stage,.gallery-project-title-link');
        if (link) open(event,link);
      });
    }
    if (handoff?.settled) { clean(); return; }
    if (!previewToken && !handoff) return;
    const ready = () => {
      if (previewToken) window.parent.postMessage({type:'project-opening:ready',token:previewToken},targetOrigin);
      else if (handoff) reveal();
    };
    const loading=[...document.querySelectorAll('.case-hero img')].filter(image => typeof image.decode === 'function');
    if (loading.length && canAnimate()) {
      let sent=false;
      const currentGeneration=generation;
      const start=decoded => {
        if (sent || currentGeneration!==generation) return;
        sent=true;
        if (decoded) ready();
        else {
          // Slow or failed assets use the native page, without a half-decoded
          // image entering an already-running ink reveal or restarting it later.
          clean();
          if (previewToken) window.parent.postMessage({type:'project-opening:unavailable',token:previewToken},targetOrigin);
        }
      };
      const wait=after(() => start(false),1200);
      Promise.all([...loading.map(image => Promise.resolve().then(() => image.decode())),document.fonts?.ready || Promise.resolve()])
        .then(() => { cancelTimer(wait); start(true); },() => { cancelTimer(wait); start(false); });
    } else ready();
  },{once:true});
  window.addEventListener('keydown',event => {
    if (opening && event.key === 'Escape') {
      event.preventDefault();
      try { sessionStorage.removeItem(storageKey); } catch {}
      clean();
    } else if (opening && ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Tab'].includes(event.key)) event.preventDefault();
    else if (!previewToken && (root.classList.contains('project-opening-active') || root.classList.contains('project-opening-pending'))) clean();
  },{capture:true});
  for (const type of ['wheel','touchstart','pointerdown']) window.addEventListener(type,() => {
    if (!previewToken && (root.classList.contains('project-opening-active') || root.classList.contains('project-opening-pending'))) clean();
  },{passive:true});
  window.addEventListener('pagehide',clean);
  window.addEventListener('pageshow',event => { if (event.persisted) clean(); });
  window.addEventListener('beforeprint',clean);
  document.addEventListener('visibilitychange',() => { if (document.hidden && !opening) clean(); });
  reduce.addEventListener('change',() => { if (reduce.matches) { if (opening) navigate(false); else clean(); } });
})();
