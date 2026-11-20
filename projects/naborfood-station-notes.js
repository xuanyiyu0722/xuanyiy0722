// Connect the explanatory copy to the corresponding parts of the machine.
(() => {
  const overview = document.querySelector('.station-overview');
  const image = overview?.querySelector('.station-machine img');
  const leaders = overview?.querySelector('.station-leaders');
  if (!overview || !image || !leaders) return;
  const targets = {qr:[.11,.36], brand:[.9,.1], bars:[.9,.75]};
  const compact = matchMedia('(max-width:1100px)');
  const notes = Object.entries(targets).map(([name, point]) => ({
    point, note:overview.querySelector(`[data-station-note="${name}"]`),
    path:leaders.querySelector(`[data-station-leader="${name}"]`)
  }));
  let frame = 0, suspended = false;
  const setAttribute = (element, name, value) => {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  };
  const draw = () => {
    frame = 0;
    if (suspended || compact.matches) return;
    const box = overview.getBoundingClientRect();
    const machine = image.getBoundingClientRect();
    const boxes = notes.map(({note}) => note.getBoundingClientRect());
    const paths = notes.map(({point:[x,y]}, index) => {
      const note = boxes[index];
      const toX = machine.left + machine.width*x - box.left;
      const toY = machine.top + machine.height*y - box.top;
      const fromX = (note.left < machine.left ? note.right + 7 : note.left - 7) - box.left;
      const fromY = note.top + note.height*.5 - box.top;
      const bendX = note.left < machine.left ? machine.left-box.left-10 : machine.right-box.left+10;
      return `M ${fromX} ${fromY} H ${bendX} V ${toY} H ${toX}`;
    });
    setAttribute(leaders, 'viewBox', `0 0 ${box.width} ${box.height}`);
    notes.forEach(({path}, index) => setAttribute(path, 'd', paths[index]));
  };
  const schedule = () => {
    if (!suspended && !frame) frame = requestAnimationFrame(draw);
  };
  new ResizeObserver(schedule).observe(overview);
  image.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);
  document.fonts.ready.then(schedule);
  window.addEventListener('pagehide', () => { suspended = true; cancelAnimationFrame(frame); frame = 0; });
  window.addEventListener('pageshow', () => { suspended = false; schedule(); });
  schedule();
})();
