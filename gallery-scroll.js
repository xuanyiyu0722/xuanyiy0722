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
  const advance = ({ timestamp }) => {
    lenis.raf(timestamp);
    if (lenis.isSmooth) Motion.frame.setup(advance);
    else ticking = false;
  };
  const wake = () => {
    if (!lenis || ticking) return;
    ticking = true;
    // Start the clock at the new gesture rather than counting the idle time.
    lenis.time = performance.now();
    Motion.frame.setup(advance);
  };
  window.PortfolioGalleryScroll = Object.freeze({
    to(top, { immediate = false } = {}) {
      if (!Number.isFinite(top)) return;
      if (lenis) lenis.scrollTo(top, { immediate, force:true, duration:.33, easing:progress => 1 - (1 - progress) ** 3, onStart:wake });
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
      lenis = new Lenis({ autoRaf:false, lerp:0.15, wheelMultiplier:1.12, smoothWheel:true, syncTouch:false, anchors:true });
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
    clearTimeout(resizeTimer);
    clearEffects();
    if (reduce.matches || printing) { destroySmooth(); return; }
    if (!window.Motion) { destroySmooth(); return; }
    startSmooth();
    const { animate, scroll } = Motion;
    try {
      cards.forEach(card => {
        const cover = card.querySelector('.gallery-cover');
        const index = card.querySelector('.gallery-project-number');
        const stage = card.closest('.gallery-project');
        const tall = card.getBoundingClientRect().height >= innerHeight * .94;
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
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(setup,100); }, { passive:true });
  reduce.addEventListener('change', setup);
  window.addEventListener('pagehide', () => { clearTimeout(resizeTimer); clearEffects(); destroySmooth(); });
  window.addEventListener('pageshow', event => { if (event.persisted) setup(); });
  window.addEventListener('beforeprint', () => { printing = true; setup(); });
  window.addEventListener('afterprint', () => { printing = false; setup(); });
  if (document.fonts?.status === 'loading') document.fonts.ready.then(setup);
  setup();
})();
