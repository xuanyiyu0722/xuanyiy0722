/* Reveal the visible card after the loading curtain; scrolling owns inner layers. */
(() => {
  const root = document.documentElement;
  const showcase = document.querySelector('.gallery-showcase');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = [], targets = [];
  const types = ['wheel','touchstart','pointerdown','keydown'];
  let ended = false, decodeTimeout, startFrame = 0, arrivalObserver;
  const finish = () => {
    if (ended) return;
    ended = true;
    clearTimeout(decodeTimeout);
    cancelAnimationFrame(startFrame);
    arrivalObserver?.disconnect();
    animations.forEach(animation => animation.cancel());
    targets.forEach(node => node.classList.remove('gallery-entry-node'));
    root.classList.remove('gallery-entry-pending');
    root.dataset.galleryEntry = 'complete';
    types.forEach(type => window.removeEventListener(type, skip));
    reduce.removeEventListener('change', motionChange);
    window.removeEventListener('project-opening-start',finish);
    window.removeEventListener('resize',finish);
  };
  const skip = event => {
    if (event.type !== 'keydown' || ['Escape','Tab','ArrowDown','PageDown','End',' '].includes(event.key)) finish();
  };
  const motionChange = event => { if (event.matches) finish(); };
  if (!showcase || reduce.matches || !Element.prototype.animate || scrollY > 80 || root.dataset.galleryRestoring === 'true') { finish(); return; }
  root.dataset.galleryEntry = 'loading';
  types.forEach(type => window.addEventListener(type,skip,{passive:type !== 'keydown'}));
  reduce.addEventListener('change',motionChange);
  window.addEventListener('pagehide',finish,{once:true});
  window.addEventListener('beforeprint',finish,{once:true});
  window.addEventListener('project-opening-start',finish);
  window.addEventListener('resize',finish,{once:true});
  const arrivalReady = new Promise(resolve => {
    if (!root.classList.contains('page-arrival-active')) { resolve(); return; }
    arrivalObserver = new MutationObserver(() => {
      if (!root.classList.contains('page-arrival-active')) { arrivalObserver.disconnect(); resolve(); }
    });
    arrivalObserver.observe(root,{attributes:true,attributeFilter:['class']});
  });
  (async () => {
    try {
      const image = showcase.querySelector('img');
      await Promise.all([arrivalReady, Promise.race([
        Promise.all([image?.decode ? image.decode().catch(() => {}) : Promise.resolve(),document.fonts?.ready || Promise.resolve()]),
        new Promise(resolve => { decodeTimeout = setTimeout(resolve,1000); })
      ])]);
      clearTimeout(decodeTimeout);
      if (ended) return;
      root.dataset.galleryEntry = 'waiting';
      // Let the scroll engine measure and establish its static initial pose first.
      startFrame = requestAnimationFrame(() => {
        startFrame = requestAnimationFrame(async () => {
          try {
            startFrame = 0;
            if (ended) return;
            const visible = [...showcase.querySelectorAll('.gallery-project')].filter(stage => {
              const box = stage.getBoundingClientRect();
              return box.bottom > 0 && box.top < innerHeight;
            });
            const plan = visible.flatMap(stage => {
              const sides = [...stage.querySelectorAll('.gallery-project-left,.gallery-project-info')];
              return [...sides.map((node,index) => ({node,distance:14,duration:850,delay:index*45})),
                ...[...stage.querySelectorAll('.gallery-cover-stage')].map(node => ({node,distance:20,duration:1100,delay:240}))];
            }).map(item => ({...item,base:getComputedStyle(item.node).transform}));
            // All measurements precede animation/style writes. Keep static centering.
            plan.forEach(({node,distance,duration,delay,base}) => {
              targets.push(node);
              node.classList.add('gallery-entry-node');
              animations.push(node.animate([
                {opacity:0,transform:`translateY(${distance}px) ${base === 'none' ? '' : base}`.trim()},
                {opacity:1,transform:base}
              ],{duration,delay,easing:'cubic-bezier(.22,.72,.18,1)',fill:'both'}));
            });
            root.classList.remove('gallery-entry-pending');
            root.dataset.galleryEntry = 'playing';
            await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
            finish();
          } catch { finish(); }
        });
      });
    } catch { finish(); }
  })();
})();
