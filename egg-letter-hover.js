/* Tilt EGG while the mouse is over the selectable letters. */
(() => {
  const hover = document.querySelector('.home-page .poster-egg-hover');
  const target = document.querySelector('.home-page .poster-egg-select');
  if (!hover || !target) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const straighten = () => hover.classList.remove('is-tilted');
  function syncHover() {
    const hovering = !document.hidden && !reduce.matches && fine.matches && target.matches(':hover');
    hover.classList.toggle('is-tilted', hovering);
  }

  target.addEventListener('pointerenter', event => {
    if (fine.matches && !reduce.matches && event.pointerType === 'mouse') {
      hover.classList.add('is-tilted');
    }
  });
  target.addEventListener('pointerleave', straighten);
  target.addEventListener('pointercancel', straighten);
  reduce.addEventListener('change', syncHover);
  fine.addEventListener('change', syncHover);
  document.addEventListener('visibilitychange', syncHover);
  window.addEventListener('pagehide', straighten);
  window.addEventListener('pageshow', syncHover);
  syncHover();
})();
