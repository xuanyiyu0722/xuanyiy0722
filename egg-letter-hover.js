/* Hold only EGG in a gentle lean while hovered, preserving the fitted line. */
(() => {
  const poster = document.querySelector('.home-page .hero-poster');
  const anchor = poster?.querySelector('.poster-ink');
  if (!anchor) return;
  const row = anchor.closest('.hero-poster-row');
  const line = anchor.parentElement;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const ns = 'http://www.w3.org/2000/svg';
  const hover = document.createElementNS(ns, 'g');
  hover.classList.add('poster-egg-hover');
  hover.setAttribute('aria-hidden', 'true');
  const hit = document.createElementNS(ns, 'rect');
  hit.classList.add('poster-egg-hit');
  const drawing = document.createElementNS(ns, 'g');
  drawing.classList.add('poster-egg-motion');
  const copy = document.createElementNS(ns, 'text');
  copy.classList.add('poster-egg-copy');
  copy.textContent = anchor.textContent;
  drawing.append(copy);
  hover.append(hit, drawing);
  row.append(hover);
  let frame = 0;
  const reset = () => hover.classList.remove('is-tilted');
  const sync = () => {
    frame = 0;
    reset();
    const box = anchor.getBBox();
    copy.setAttribute('x', line.getAttribute('x'));
    copy.setAttribute('y', line.getAttribute('y'));
    for (const name of ['x','y','width','height']) hit.setAttribute(name, box[name]);
  };
  const queueSync = () => {
    if (!frame) frame = requestAnimationFrame(sync);
  };
  sync();
  anchor.classList.add('poster-egg-anchor');
  // The original text still reserves its full width for the unchanged shell suffix.
  new MutationObserver(queueSync).observe(poster, {
    attributes:true, attributeFilter:['viewBox','style']
  });
  document.fonts?.ready.then(queueSync);
  window.addEventListener('resize', queueSync, { passive:true });
  hover.addEventListener('pointerenter', event => {
    if (fine.matches && !reduce.matches && event.pointerType === 'mouse') hover.classList.add('is-tilted');
  });
  hover.addEventListener('pointerleave', reset);
  hover.addEventListener('pointercancel', reset);
  reduce.addEventListener('change', reset);
  fine.addEventListener('change', reset);
  document.addEventListener('visibilitychange', reset);
  window.addEventListener('pagehide', () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    reset();
  });
})();
