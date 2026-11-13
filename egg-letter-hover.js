/* Hold only EGG in a gentle lean while hovered, preserving the fitted line. */
(() => {
  const hover = document.querySelector('.home-page .poster-egg-hover');
  if (!hover) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const reset = () => hover.classList.remove('is-tilted');
  hover.addEventListener('pointerenter', event => {
    if (fine.matches && !reduce.matches && event.pointerType === 'mouse') hover.classList.add('is-tilted');
  });
  hover.addEventListener('pointerleave', reset);
  hover.addEventListener('pointercancel', reset);
  reduce.addEventListener('change', reset);
  fine.addEventListener('change', reset);
  document.addEventListener('visibilitychange', reset);
  window.addEventListener('pagehide', reset);
})();
