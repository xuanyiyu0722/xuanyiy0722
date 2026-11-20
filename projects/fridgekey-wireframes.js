/* Browse six documented flows. Reuses the site's original image zoom viewer. */
(() => {
  const section = document.querySelector('#low-fidelity-wireframe');
  if (!section) return;
  const tabs = [...section.querySelectorAll('[data-wire-tab]')];
  const panels = [...section.querySelectorAll('[data-wire-panel]')];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  const dirty = new Set();
  function updateRail(panel) {
    const rail = panel.querySelector('.fk-wire-rail');
    const prev = panel.querySelector('[data-wire-scroll="-1"]');
    const next = panel.querySelector('[data-wire-scroll="1"]');
    const atStart = rail.scrollLeft < 2;
    const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
    if (prev.disabled !== atStart) prev.disabled = atStart;
    if (next.disabled !== atEnd) next.disabled = atEnd;
  }
  function flush() {
    frame = 0;
    dirty.forEach(panel => { if (!panel.hidden) updateRail(panel); });
    dirty.clear();
  }
  function schedule(panel) {
    dirty.add(panel);
    if (!frame) frame = requestAnimationFrame(flush);
  }
  function select(tab, focus = false) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(panel => {
      panel.hidden = panel.dataset.wirePanel !== tab.dataset.wireTab;
      if (!panel.hidden) updateRail(panel);
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        select(tabs[next], true);
      }
    });
  });
  panels.forEach(panel => {
    const rail = panel.querySelector('.fk-wire-rail');
    rail.addEventListener('scroll', () => schedule(panel), {passive: true});
    panel.querySelectorAll('[data-wire-scroll]').forEach(button => {
      button.addEventListener('click', () => {
        rail.scrollBy({left: Number(button.dataset.wireScroll) * (rail.clientWidth * .8), behavior: reduceMotion.matches ? 'instant' : 'smooth'});
      });
    });
  });
  window.addEventListener('resize', () => panels.forEach(panel => { if (!panel.hidden) schedule(panel); }), {passive:true});
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; dirty.clear(); });
  window.addEventListener('pageshow', () => panels.forEach(panel => { if (!panel.hidden) schedule(panel); }));
  updateRail(panels.find(panel => !panel.hidden));
})();
