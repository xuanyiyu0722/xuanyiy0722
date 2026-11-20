/* The cover-to-paper opening uses WAAPI and a bounded ink-mask animation. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'portfolio:project-opening';
  const scriptURL = document.currentScript.src;
  const pages = ['project-04.html','fridgekey.html','naborfood.html','project-03.html'];
  const destinations = new Set(pages.map(page => new URL(`projects/${page}`, scriptURL).href));
  const animations = new Set();
  let sheet, inkSVG, artwork, inkFrame, navigationTimer, imageTimer, failSafe, leaving = false;
  let handoff;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved && destinations.has(saved.url) && Date.now() - saved.createdAt < 10000 &&
        saved.createdAt <= Date.now() && saved.url === location.href) {
      handoff = saved;
      sessionStorage.removeItem(storageKey);
    }
  } catch { /* Ordinary links and direct entry remain available without storage. */ }
  const canAnimate = () => !reduce.matches && typeof Element.prototype.animate === 'function';
  if (handoff && canAnimate()) {
    root.classList.add('project-opening-pending');
    // A failed/slow initialization must never leave readable content hidden.
    failSafe = setTimeout(() => {
      root.classList.remove('project-opening-pending');
      handoff = null;
    }, 2500);
  }
  const track = animation => {
    animations.add(animation);
    animation.finished.catch(() => {}).then(() => animations.delete(animation));
    return animation;
  };
  const clean = () => {
    clearTimeout(failSafe);
    clearTimeout(navigationTimer);
    clearTimeout(imageTimer);
    cancelAnimationFrame(inkFrame);
    animations.forEach(animation => animation.cancel());
    animations.clear();
    sheet?.remove();
    sheet = null;
    if (artwork) {
      artwork.style.removeProperty('mask');
      artwork.style.removeProperty('-webkit-mask');
      artwork = null;
    }
    inkSVG?.remove();
    inkSVG = null;
    document.querySelectorAll('.project-opening-line').forEach(node => node.classList.remove('project-opening-line'));
    root.classList.remove('project-opening-pending','project-opening-active','project-opening-out');
    handoff = null;
    leaving = false;
  };
  const prefetch = url => {
    if (!destinations.has(url) || document.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'document';
    link.href = url;
    document.head.append(link);
  };
  const open = (event, link) => {
    const url = new URL(link.href);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey ||
        event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self') ||
        !destinations.has(url.href) || !canAnimate()) return;
    const cover = link.closest('.gallery-project')?.querySelector('.gallery-cover');
    if (!cover) return;
    const rect = cover.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    event.preventDefault();
    if (leaving) return;
    leaving = true;
    prefetch(url.href);
    try { sessionStorage.setItem(storageKey, JSON.stringify({ url:url.href, createdAt:Date.now() })); } catch {}
    sheet = document.createElement('div');
    sheet.className = 'project-opening-sheet';
    sheet.setAttribute('aria-hidden','true');
    sheet.style.transformOrigin = `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`;
    document.body.append(sheet);
    root.classList.add('project-opening-out');
    const inset = [Math.max(0,rect.top), Math.max(0,innerWidth-rect.right), Math.max(0,innerHeight-rect.bottom), Math.max(0,rect.left)];
    const from = `inset(${inset.map(value => value.toFixed(2)+'px').join(' ')} round 3px)`;
    let navigated = false;
    const navigate = () => {
      if (!leaving || navigated) return;
      navigated = true;
      clearTimeout(navigationTimer);
      location.assign(url.href);
    };
    // The native link remains the fallback even if the animation is interrupted.
    navigationTimer = setTimeout(navigate, 1200);
    try {
      track(sheet.animate([
        { clipPath:from, transform:'rotate(-2.5deg)' },
        { clipPath:'inset(0px 0px 0px 0px round 0px)', transform:'rotate(0deg)' }
      ], { duration:850, easing:'cubic-bezier(.76,0,.18,1)', fill:'both' })).finished.then(navigate, () => {});
    } catch { navigate(); }
  };
  const reveal = () => {
    clearTimeout(failSafe);
    const hero = document.querySelector('.case-hero');
    artwork = hero?.querySelector('.case-hero-art');
    if (!hero || !artwork || !canAnimate()) { clean(); return; }
    root.classList.add('project-opening-active');
    const lines = [...hero.querySelectorAll('.case-brand,.case-tagline,.summary--project > p,.case-meta > span')];
    try {
      lines.forEach((node,index) => {
        node.classList.add('project-opening-line');
        track(node.animate([
          { clipPath:'inset(0% 0% 100% 0%)', transform:'translateY(26px)' },
          { clipPath:'inset(0% 0% 0% 0%)', transform:'translateY(0px)' }
        ], { duration:750, delay:80+index*60, easing:'cubic-bezier(.2,.8,.2,1)', fill:'backwards' }));
      });
      const navigation = document.querySelector(innerWidth > 820 ? '.project-sidebar' : '.project-mobile-bar');
      if (navigation) track(navigation.animate([
        { clipPath:'inset(0% 0% 100% 0%)' }, { clipPath:'inset(0% 0% 0% 0%)' }
      ], { duration:650, easing:'cubic-bezier(.2,.8,.2,1)', fill:'backwards' }));
      inkSVG = document.createElementNS('http://www.w3.org/2000/svg','svg');
      inkSVG.classList.add('project-opening-ink-defs');
      inkSVG.setAttribute('aria-hidden','true');
      inkSVG.innerHTML = '<defs><filter id="project-opening-ink-edge" filterUnits="userSpaceOnUse" x="-200" y="-200" width="1400" height="1400"><feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="2" seed="7" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="65" xChannelSelector="R" yChannelSelector="G"/></filter><mask id="project-opening-ink" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="-.2" y="-.2" width="1.4" height="1.4"><g transform="scale(.001)"><g fill="white" filter="url(#project-opening-ink-edge)"></g></g></mask></defs>';
      const group = inkSVG.querySelector('mask g g');
      const points = [[230,380,0],[720,650,90],[480,120,160],[180,830,240],[880,300,300],[570,940,360],[520,530,130]];
      const circles = points.map(([x,y]) => {
        const circle = document.createElementNS(inkSVG.namespaceURI,'circle');
        circle.setAttribute('cx',x);
        circle.setAttribute('cy',y);
        circle.setAttribute('r',0);
        group.append(circle);
        return circle;
      });
      document.body.append(inkSVG);
      artwork.style.setProperty('mask','url(#project-opening-ink)');
      artwork.style.setProperty('-webkit-mask','url(#project-opening-ink)');
      root.classList.remove('project-opening-pending');
      const started = performance.now();
      const paint = now => {
        const elapsed = now - started;
        circles.forEach((circle,index) => {
          const progress = Math.max(0,Math.min(1,(elapsed-100-points[index][2])/1050));
          circle.setAttribute('r',(650*(1-(1-progress)**3)).toFixed(1));
        });
        if (elapsed < 1550 && !document.hidden) inkFrame = requestAnimationFrame(paint);
        else clean();
      };
      inkFrame = requestAnimationFrame(paint);
    } catch { clean(); }
  };
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.gallery-showcase')) {
      document.addEventListener('pointerover', event => {
        const link = event.target.closest('.gallery-cover-stage,.gallery-project-title-link');
        if (link) prefetch(link.href);
      }, { passive:true });
      document.addEventListener('click', event => {
        const link = event.target.closest('.gallery-cover-stage,.gallery-project-title-link');
        if (link) open(event,link);
      });
    }
    if (handoff) {
      const loading = [...document.querySelectorAll('.case-hero-art img')]
        .filter(image => !image.complete && typeof image.decode === 'function');
      if (loading.length && canAnimate()) {
        const start = () => {
          clearTimeout(imageTimer);
          if (handoff && root.classList.contains('project-opening-pending')) reveal();
        };
        imageTimer = setTimeout(start,450);
        Promise.allSettled(loading.map(image => image.decode())).then(start);
      } else reveal();
    }
  }, { once:true });
  window.addEventListener('keydown', event => {
    if (leaving && event.key === 'Escape') {
      event.preventDefault();
      try { sessionStorage.removeItem(storageKey); } catch {}
      clean();
    } else if (leaving && ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) event.preventDefault();
    else if (root.classList.contains('project-opening-active') || root.classList.contains('project-opening-pending')) clean();
  }, { capture:true });
  for (const type of ['wheel','touchstart','pointerdown']) window.addEventListener(type, () => {
    if (root.classList.contains('project-opening-active') || root.classList.contains('project-opening-pending')) clean();
  }, { passive:true });
  window.addEventListener('pagehide',clean);
  window.addEventListener('pageshow',event => { if (event.persisted) clean(); });
  window.addEventListener('beforeprint',clean);
  document.addEventListener('visibilitychange',() => { if (document.hidden && !leaving) clean(); });
  reduce.addEventListener('change',() => { if (reduce.matches) clean(); });
})();
