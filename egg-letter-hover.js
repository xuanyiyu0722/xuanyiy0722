/* Alternate the EGG artwork between upright and tilted. */
(() => {
  const hover = document.querySelector('.home-page .poster-egg-hover');
  const target = document.querySelector('.home-page .poster-egg-select');
  if (!hover || !target) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  // Each interval includes the transition into the corresponding pose.
  const uprightTime = 1350;
  const tiltedTime = 1150;
  let timer;

  function resume() {
    clearTimeout(timer);
    if (document.hidden || reduce.matches) return;
    const tilted = hover.classList.contains('is-tilted');
    timer = setTimeout(() => {
      hover.classList.toggle('is-tilted', !tilted);
      resume();
    }, tilted ? tiltedTime : uprightTime);
  }

  function reset() {
    clearTimeout(timer);
    const hovering = !document.hidden && !reduce.matches && fine.matches && target.matches(':hover');
    hover.classList.toggle('is-tilted', hovering);
    if (!hovering) resume();
  }

  target.addEventListener('pointerenter', event => {
    if (fine.matches && !reduce.matches && event.pointerType === 'mouse') {
      clearTimeout(timer);
      hover.classList.add('is-tilted');
    }
  });
  target.addEventListener('pointerleave', resume);
  target.addEventListener('pointercancel', resume);
  reduce.addEventListener('change', reset);
  fine.addEventListener('change', reset);
  document.addEventListener('visibilitychange', reset);
  window.addEventListener('pagehide', () => clearTimeout(timer));
  window.addEventListener('pageshow', reset);
  reset();
})();
