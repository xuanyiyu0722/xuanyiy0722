/* Lenis and Motion share the setup/read frame order from Motion's Lenis example. */
(() => {
  const cards = [...document.querySelectorAll('.gallery-project-card')];
  if (!cards.length) return;
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let cancelScroll = [];
  let animations = [];
  let resizeTimer;
  let lenis = null;
  let ticking = false;
  let printing = false;
  let geometry, setupFrame = 0, suspended = false, openingProject = false;
  const signature = () => [innerWidth, innerHeight, root.clientWidth, ...cards.flatMap(card => [card.offsetWidth,card.offsetHeight])].join(':');
  const advance = ({ timestamp }) => {
    if (!lenis || document.hidden || openingProject) { ticking = false; return; }
    lenis.raf(timestamp);
    if (lenis.isSmooth) Motion.frame.setup(advance);
    else ticking = false;
  };
  const wake = () => {
    if (!lenis || ticking || document.hidden || openingProject) return;
    ticking = true;
    // Start the clock at the new gesture rather than counting the idle time.
    lenis.time = performance.now();
    Motion.frame.setup(advance);
  };
  window.PortfolioGalleryScroll = Object.freeze({
    to(top, { immediate = false } = {}) {
      if (!Number.isFinite(top) || openingProject) return;
      if (lenis) lenis.scrollTo(top, { immediate, force:true, duration:.28, easing:progress => 1 - (1 - progress) ** 3, onStart:wake });
      else window.scrollTo({ top, behavior:immediate || reduce.matches ? 'instant' : 'smooth' });
    }
  });
  const clearEffects = () => {
    cancelScroll.forEach(cancel => cancel());
    cancelScroll = [];
    animations.forEach(animation => {
      if (typeof animation.cancel === 'function') animation.cancel();
      else animation.stop?.();
    });
    animations = [];
    root.classList.remove('gallery-scroll-linked');
    delete root.dataset.galleryScrollEngine;
    cards.forEach(card => {
      card.style.removeProperty('opacity');
      card.querySelector('.gallery-cover').style.removeProperty('transform');
      card.querySelector('.gallery-cover').style.removeProperty('opacity');
      card.querySelector('.gallery-project-number').style.removeProperty('transform');
    });
  };
  const destroySmooth = () => {
    window.Motion?.cancelFrame?.(advance);
    document.removeEventListener('click', wake);
    lenis?.destroy();
    lenis = null;
    ticking = false;
    root.classList.remove('gallery-lenis-active');
    delete root.dataset.gallerySmoothEngine;
  };
  const startSmooth = () => {
    if (lenis || !window.Lenis || !window.Motion?.frame?.setup || !window.Motion?.cancelFrame) return;
    try {
      root.classList.add('gallery-lenis-active');
      lenis = new Lenis({ autoRaf:false, lerp:0.24, wheelMultiplier:1.6, smoothWheel:true, syncTouch:false, anchors:true });
      lenis.on('virtual-scroll', wake);
      // Lenis also handles same-page anchor links independently of wheel events.
      document.addEventListener('click', wake, { passive:true });
      root.dataset.gallerySmoothEngine = 'lenis';
    } catch (error) {
      destroySmooth();
      console.warn('Gallery is using native scrolling.', error);
    }
  };
  const setup = () => {
    setupFrame = 0;
    clearTimeout(resizeTimer);
    if (suspended || document.hidden || openingProject || root.classList.contains('page-arrival-active')) return;
    const nextGeometry = signature();
    if (animations.length && geometry === nextGeometry && !reduce.matches && !printing) return;
    // Read every card before any animation writes; avoid four alternating layouts.
    const plans = cards.map(card => ({card,height:card.getBoundingClientRect().height,
      cover:card.querySelector('.gallery-cover'),index:card.querySelector('.gallery-project-number'),stage:card.closest('.gallery-project')}));
    clearEffects();
    if (reduce.matches || printing) { destroySmooth(); return; }
    if (!window.Motion) { destroySmooth(); return; }
    startSmooth();
    geometry = nextGeometry;
    const { animate, scroll } = Motion;
    try {
      plans.forEach(({card,cover,index,stage,height}) => {
        const tall = height >= innerHeight * .94;
        const offset = tall
          ? ['start end','center 60%','center 40%','end start']
          : ['start end','end end','start start','end start'];
        // The side information leads; the cover reaches full opacity a little later.
        const coverOffset = tall
          ? ['start 90%','center 56%','center 40%','end start']
          : ['start 90%','end 85%','start start','end start'];
        const fade = animate(card, { opacity:[0,1,1,0] }, { ease:'linear' });
        const move = animate(cover, { opacity:[0,1,1,0], y:[60,0,0,-60], scale:[.94,1,1,.94] }, { ease:'linear' });
        const distance = innerWidth <= 820 ? 24 : 70;
        const number = animate(index, { y:[-distance,distance] }, { ease:'linear' });
        animations.push(fade, move, number);
        cancelScroll.push(
          scroll(fade, { target:card, offset }),
          scroll(move, { target:card, offset:coverOffset }),
          scroll(number, { target:stage, offset:['start end','end start'] })
        );
      });
      root.classList.add('gallery-scroll-linked');
      root.dataset.galleryScrollEngine = 'motion';
    } catch (error) {
      clearEffects();
      console.warn('Gallery scroll effects could not start.', error);
    }
  };
  const scheduleSetup = () => { if (!suspended && !setupFrame) setupFrame = requestAnimationFrame(setup); };
  let arrivalActive = root.classList.contains('page-arrival-active');
  const arrivalObserver = new MutationObserver(() => {
    const next = root.classList.contains('page-arrival-active');
    if (next === arrivalActive) return;
    arrivalActive = next;
    if (!next) scheduleSetup();
  });
  arrivalObserver.observe(root,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(scheduleSetup,100); }, {passive:true});
  window.addEventListener('project-opening-start', () => {
    openingProject = true;
    window.Motion?.cancelFrame?.(advance);
    ticking = false;
    lenis?.stop();
  });
  window.addEventListener('project-opening-end', () => {
    openingProject = false;
    lenis?.start();
    scheduleSetup();
  });
  reduce.addEventListener('change', setup);
  window.addEventListener('pagehide', () => { suspended = true; clearTimeout(resizeTimer); cancelAnimationFrame(setupFrame); setupFrame = 0; arrivalObserver.disconnect(); clearEffects(); destroySmooth(); });
  window.addEventListener('pageshow', event => { if (event.persisted) { suspended = false; arrivalActive = root.classList.contains('page-arrival-active'); arrivalObserver.observe(root,{attributes:true,attributeFilter:['class']}); scheduleSetup(); } });
  window.addEventListener('beforeprint', () => { printing = true; setup(); });
  window.addEventListener('afterprint', () => { printing = false; setup(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { window.Motion?.cancelFrame?.(advance); ticking = false; }
    else { scheduleSetup(); if (lenis?.isSmooth) wake(); }
  });
  if (document.fonts?.status === 'loading') document.fonts.ready.then(() => { if (signature() !== geometry) scheduleSetup(); });
  scheduleSetup();
})();
