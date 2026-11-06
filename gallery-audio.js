/* One short transition sound as the next centered work becomes active. */
(() => {
  const stages = [...document.querySelectorAll('.gallery-project')];
  if (!stages.length) return;
  let active = -1;
  let frame = 0;
  let suppressUntil = 0;
  const distances = () => {
    const top = innerWidth <= 820 ? 56 : 0;
    const center = top + (innerHeight - top) / 2;
    return stages.map(stage => {
      const rect = stage.getBoundingClientRect();
      return Math.abs(rect.top + rect.height / 2 - center);
    });
  };
  const update = (silent = false) => {
    const values = distances();
    const next = values.indexOf(Math.min(...values));
    if (active < 0 || silent) { active = next; return; }
    // Keep the current work near the boundary, even with tiny trackpad reversals.
    if (next === active || values[next] + 48 >= values[active]) return;
    active = next;
    if (performance.now() >= suppressUntil) window.PortfolioSound?.pageTurn();
  };
  const queue = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; update(); });
  };
  const reset = () => {
    suppressUntil = performance.now() + 300;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    update(true);
  };
  window.addEventListener('scroll', queue, { passive:true });
  window.addEventListener('resize', reset, { passive:true });
  window.addEventListener('pageshow', reset);
  window.addEventListener('pagehide', () => { if (frame) cancelAnimationFrame(frame); frame = 0; });
  document.fonts?.ready.then(reset);
  reset();
})();
