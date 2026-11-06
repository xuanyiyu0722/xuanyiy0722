// Connect the explanatory copy to the corresponding parts of the machine.
(() => {
  const overview = document.querySelector('.station-overview');
  const image = overview?.querySelector('.station-machine img');
  const leaders = overview?.querySelector('.station-leaders');
  if (!overview || !image || !leaders) return;
  const targets = {qr:[.11,.36], brand:[.9,.1], bars:[.9,.75]};
  let scheduled = false;
  const draw = () => {
    scheduled = false;
    if (matchMedia('(max-width:1100px)').matches) return;
    const box = overview.getBoundingClientRect();
    const machine = image.getBoundingClientRect();
    leaders.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    for (const [name, [x,y]] of Object.entries(targets)) {
      const note = overview.querySelector(`[data-station-note="${name}"]`).getBoundingClientRect();
      const toX = machine.left + machine.width*x - box.left;
      const toY = machine.top + machine.height*y - box.top;
      const fromX = (note.left < machine.left ? note.right + 7 : note.left - 7) - box.left;
      const fromY = note.top + note.height*.5 - box.top;
      const bendX = note.left < machine.left ? machine.left-box.left-10 : machine.right-box.left+10;
      leaders.querySelector(`[data-station-leader="${name}"]`).setAttribute('d', `M ${fromX} ${fromY} H ${bendX} V ${toY} H ${toX}`);
    }
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(draw);
  };
  new ResizeObserver(schedule).observe(overview);
  image.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);
  document.fonts.ready.then(schedule);
  schedule();
})();
