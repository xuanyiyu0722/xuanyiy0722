/* Side information leads the cover by 240ms, independently of scroll-linked effects. */
(() => {
  const root = document.documentElement;
  const showcase = document.querySelector('.gallery-showcase');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = [];
  let ended = false;
  let decodeTimeout;
  const types = ['wheel','touchstart','pointerdown','keydown'];
  const finish = () => {
    if (ended) return;
    ended = true;
    clearTimeout(decodeTimeout);
    animations.forEach(animation => animation.cancel());
    root.classList.remove('gallery-entry-pending');
    root.dataset.galleryEntry = 'complete';
    types.forEach(type => window.removeEventListener(type, skip));
    reduce.removeEventListener('change', motionChange);
  };
  const skip = event => {
    if (event.type !== 'keydown' || ['Escape','Tab','ArrowDown','PageDown','End',' '].includes(event.key)) finish();
  };
  const motionChange = event => { if (event.matches) finish(); };
  if (!showcase || reduce.matches || !Element.prototype.animate || scrollY > 80) { finish(); return; }
  root.dataset.galleryEntry = 'loading';
  types.forEach(type => window.addEventListener(type, skip, { passive:type !== 'keydown' }));
  reduce.addEventListener('change', motionChange);
  window.addEventListener('pagehide', finish, { once:true });
  window.addEventListener('beforeprint', finish, { once:true });
  (async () => {
    try {
      const image = showcase.querySelector('img');
      await Promise.race([
        Promise.all([image?.decode ? image.decode().catch(() => {}) : Promise.resolve(), document.fonts?.ready || Promise.resolve()]),
        new Promise(resolve => { decodeTimeout = setTimeout(resolve,1000); })
      ]);
      clearTimeout(decodeTimeout);
      if (ended) return;
      showcase.querySelectorAll('.gallery-project-left, .gallery-project-info').forEach((node,index) => {
        animations.push(node.animate([
          { opacity:0, translate:'0 14px' },
          { opacity:1, translate:'0 0' }
        ], { duration:850, delay:(index % 2) * 45, easing:'cubic-bezier(.22,.72,.18,1)', fill:'both' }));
      });
      showcase.querySelectorAll('.gallery-cover-stage').forEach(node => {
        animations.push(node.animate([
          { opacity:0, translate:'0 20px' },
          { opacity:1, translate:'0 0' }
        ], { duration:1100, delay:240, easing:'cubic-bezier(.22,.72,.18,1)', fill:'both' }));
      });
      root.classList.remove('gallery-entry-pending');
      root.dataset.galleryEntry = 'playing';
      await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
      finish();
    } catch { finish(); }
  })();
})();
