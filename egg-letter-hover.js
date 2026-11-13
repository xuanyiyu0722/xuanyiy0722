/* Hold only EGG in a gentle lean while hovered, preserving the fitted line. */
(() => {
  const hover = document.querySelector('.home-page .poster-egg-hover');
  const target = document.querySelector('.home-page .poster-egg-select');
  if (!hover || !target) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const reset = () => hover.classList.remove('is-tilted');
  target.addEventListener('pointerenter', event => {
    if (fine.matches && !reduce.matches && event.pointerType === 'mouse' && !event.buttons) {
      hover.classList.add('is-tilted');
    }
  });
  target.addEventListener('pointerdown', reset);
  target.addEventListener('pointerleave', reset);
  target.addEventListener('pointercancel', reset);
  reduce.addEventListener('change', reset);
  fine.addEventListener('change', reset);
  document.addEventListener('visibilitychange', reset);
  window.addEventListener('pagehide', reset);
})();
