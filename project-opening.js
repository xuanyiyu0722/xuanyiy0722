/* A straight paper sheet reveals the live case study before the expansion ends. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'portfolio:project-opening';
  const pages = ['project-04.html','fridgekey.html','naborfood.html','project-03.html'];
  const destinations = new Set(pages.map(page => new URL(`projects/${page}`,document.currentScript.src).href));
  const previewToken = window.parent !== window ? location.hash.match(/^#portfolio-preview=([a-z0-9-]+)$/)?.[1] : null;
  const animations = new Set(), timers = new Set();
  let opening = null, inkSVG, artwork, inkFrame, handoff, previewStarted = false;
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
  const clean = () => {
    timers.forEach(id => clearTimeout(id)); timers.clear();
    cancelAnimationFrame(inkFrame);
    animations.forEach(animation => animation.cancel()); animations.clear();
    opening?.sheet.remove();
    opening = null;
    if (artwork) {
      artwork.style.removeProperty('mask');
      artwork.style.removeProperty('-webkit-mask');
      artwork = null;
    }
    inkSVG?.remove(); inkSVG=null;
    document.querySelectorAll('.project-opening-line').forEach(node => node.classList.remove('project-opening-line'));
    root.classList.remove('project-opening-pending','project-opening-active','project-opening-out','project-opening-settled');
    handoff = null;
  };
  const prefetch = url => {
    if (!destinations.has(url) || document.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
    const link=document.createElement('link');
    link.rel='prefetch'; link.as='document'; link.href=url;
    document.head.append(link);
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
    opening.frame.contentWindow.postMessage({type:'project-opening:start',token:opening.token,elapsed:Math.max(0,performance.now()-opening.startedAt)},location.origin);
  };
  const grow = () => {
    if (!opening || opening.startedAt !== null) return;
    opening.startedAt=performance.now();
    try {
      track(opening.sheet.animate([
        {clipPath:opening.from},
        {clipPath:'inset(0px 0px 0px 0px round 0px)'}
      ],{duration:900,easing:'cubic-bezier(.76,0,.18,1)',fill:'both'})).finished.then(() => {
        if (!opening) return;
        opening.paperDone=true;
        finishWhenReady();
      },() => {});
      startPreview();
    } catch { navigate(false); }
  };
  const open = (event,link) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.hasAttribute('download') || (link.target && link.target !== '_self') || !destinations.has(link.href) || !canAnimate()) return;
    const cover=link.closest('.gallery-project')?.querySelector('.gallery-cover');
    if (!cover) return;
    const rect=cover.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    event.preventDefault();
    if (opening) return;
    prefetch(link.href);
    const sheet=document.createElement('div');
    sheet.className='project-opening-sheet';
    sheet.setAttribute('aria-hidden','true');
    const inset=[Math.max(0,rect.top),Math.max(0,innerWidth-rect.right),Math.max(0,innerHeight-rect.bottom),Math.max(0,rect.left)];
    const from=`inset(${inset.map(value => value.toFixed(2)+'px').join(' ')} round 3px)`;
    sheet.style.clipPath=from;
    const frame=document.createElement('iframe');
    frame.className='project-opening-preview';
    frame.title='Opening project'; frame.tabIndex=-1;
    frame.setAttribute('aria-hidden','true');
    const token=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
    const url=new URL(link.href); url.hash='portfolio-preview='+token;
    frame.src=url.href;
    sheet.append(frame);
    opening={sheet,frame,from,token,url:link.href,startedAt:null,ready:false,childStarted:false,paperDone:false,childDone:false,navigated:false};
    document.body.append(sheet);
    root.classList.add('project-opening-out');
    // Network work overlaps the first 180ms; slow loading always has a native-link exit.
    after(grow,180);
    after(() => navigate(false),3200);
  };
  const reveal = (elapsed=0) => {
    const hero=document.querySelector('.case-hero');
    artwork=hero?.querySelector('.case-hero-art');
    if (!hero || !artwork || !canAnimate()) { clean(); return; }
    timers.forEach(id => clearTimeout(id)); timers.clear();
    root.classList.add('project-opening-active');
    const complete = () => {
      clean();
      if (previewToken) window.parent.postMessage({type:'project-opening:done',token:previewToken},location.origin);
    };
    try {
      const lines=[...hero.querySelectorAll('.case-brand,.case-tagline,.summary--project > p,.case-meta > span')];
      lines.forEach((node,index) => {
        const planned=index < 3 ? 580+index*120 : 1000+(index-3)*60;
        node.classList.add('project-opening-line');
        track(node.animate([
          {clipPath:'inset(0% 0% 100% 0%)',transform:'translateY(26px)'},
          {clipPath:'inset(0% 0% 0% 0%)',transform:'translateY(0px)'}
        ],{duration:700,delay:Math.max(0,planned-elapsed),easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'}));
      });
      const navigation=document.querySelector(innerWidth > 820 ? '.project-sidebar' : '.project-mobile-bar');
      if (navigation) track(navigation.animate([
        {clipPath:'inset(0% 0% 100% 0%)'},{clipPath:'inset(0% 0% 0% 0%)'}
      ],{duration:500,delay:Math.max(0,950-elapsed),easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'}));
      inkSVG=document.createElementNS('http://www.w3.org/2000/svg','svg');
      inkSVG.classList.add('project-opening-ink-defs'); inkSVG.setAttribute('aria-hidden','true');
      inkSVG.innerHTML='<defs><filter id="project-opening-ink-edge" filterUnits="userSpaceOnUse" x="-200" y="-200" width="1400" height="1400"><feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="2" seed="7" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="65" xChannelSelector="R" yChannelSelector="G"/></filter><mask id="project-opening-ink" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="-.2" y="-.2" width="1.4" height="1.4"><g transform="scale(.001)"><g fill="white" filter="url(#project-opening-ink-edge)"></g></g></mask></defs>';
      const group=inkSVG.querySelector('mask g g');
      const points=[[230,380,0],[720,650,90],[480,120,160],[180,830,240],[880,300,300],[570,940,360],[520,530,130]];
      const circles=points.map(([x,y]) => {
        const circle=document.createElementNS(inkSVG.namespaceURI,'circle');
        circle.setAttribute('cx',x); circle.setAttribute('cy',y); circle.setAttribute('r',0); group.append(circle);
        return circle;
      });
      document.body.append(inkSVG);
      artwork.style.setProperty('mask','url(#project-opening-ink)');
      artwork.style.setProperty('-webkit-mask','url(#project-opening-ink)');
      root.classList.remove('project-opening-pending');
      const started=performance.now();
      const paint=now => {
        const time=elapsed+now-started;
        circles.forEach((circle,index) => {
          const progress=Math.max(0,Math.min(1,(time-120-points[index][2])/1050));
          circle.setAttribute('r',(650*(1-(1-progress)**3)).toFixed(1));
        });
        if (time < 1900 && !document.hidden) inkFrame=requestAnimationFrame(paint);
        else complete();
      };
      inkFrame=requestAnimationFrame(paint);
    } catch { complete(); }
  };
  window.addEventListener('message',event => {
    if (event.origin !== location.origin || !event.data) return;
    const data=event.data;
    if (opening && event.source === opening.frame.contentWindow && data.token === opening.token) {
      if (data.type === 'project-opening:ready') { opening.ready=true; grow(); startPreview(); }
      else if (data.type === 'project-opening:done' && opening.childStarted) { opening.childDone=true; finishWhenReady(); }
    } else if (previewToken && !previewStarted && event.source === window.parent && data.token === previewToken &&
               data.type === 'project-opening:start' && Number.isFinite(data.elapsed) && data.elapsed >= 0 && data.elapsed < 5000) {
      previewStarted=true;
      reveal(data.elapsed);
    }
  });
  document.addEventListener('DOMContentLoaded',() => {
    if (document.querySelector('.gallery-showcase')) {
      document.addEventListener('pointerover',event => {
        const link=event.target.closest('.gallery-cover-stage,.gallery-project-title-link');
        if (link) prefetch(link.href);
      },{passive:true});
      document.addEventListener('click',event => {
        const link=event.target.closest('.gallery-cover-stage,.gallery-project-title-link');
        if (link) open(event,link);
      });
    }
    if (handoff?.settled) { clean(); return; }
    if (!previewToken && !handoff) return;
    const ready = () => {
      if (previewToken) window.parent.postMessage({type:'project-opening:ready',token:previewToken},location.origin);
      else if (handoff) reveal();
    };
    const loading=[...document.querySelectorAll('.case-hero-art img')].filter(image => !image.complete && typeof image.decode === 'function');
    if (loading.length && canAnimate()) {
      let sent=false;
      const start=() => { if (!sent) { sent=true; ready(); } };
      const wait=after(start,450);
      Promise.allSettled(loading.map(image => image.decode())).then(() => { cancelTimer(wait); start(); });
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
