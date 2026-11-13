/* The yellow action cursor follows a mouse over Home's selectable eggs. */
(() => {
  if (!document.body.classList.contains('home-page')) return;
  const targets = [...document.querySelectorAll('.asset-egg, .egg-dialog .crack-button')];
  if (!targets.length) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const cursor = document.createElement('div');
  cursor.className = 'egg-crack-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  const disc = document.createElement('span');
  disc.className = 'egg-crack-cursor__disc';
  disc.textContent = 'crack';
  cursor.append(disc);
  document.body.append(cursor);
  let active = null;
  let frame = 0;
  let lastFrame = 0;
  let x = 0, y = 0, desiredX = 0, desiredY = 0;

  const position = () => {
    cursor.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
  };
  const tick = now => {
    frame = 0;
    if (!active) return;
    const elapsed = lastFrame ? Math.min(now - lastFrame, 50) : 1000 / 60;
    lastFrame = now;
    const follow = reduce.matches ? 1 : 1 - .72 ** (elapsed / (1000 / 60));
    x += (desiredX - x) * follow;
    y += (desiredY - y) * follow;
    const moving = Math.abs(desiredX - x) + Math.abs(desiredY - y) > .1;
    if (!moving) { x = desiredX; y = desiredY; }
    position();
    if (moving) frame = requestAnimationFrame(tick);
    else lastFrame = 0;
  };
  const hide = () => {
    if (!active) return;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
    active?.classList.remove('egg-cursor-active');
    active = null;
    cursor.classList.remove('is-visible', 'is-pressed');
  };
  const show = (target, event) => {
    if (!fine.matches || event.pointerType !== 'mouse' || target.disabled) { hide(); return; }
    if (active !== target) {
      hide();
      active = target;
      active.classList.add('egg-cursor-active');
      // Dialog contents occupy the browser's top layer; the cursor must join it.
      const host = target.closest('dialog') || document.body;
      if (cursor.parentElement !== host) host.append(cursor);
      x = event.clientX;
      y = event.clientY;
      position();
      cursor.classList.add('is-visible');
    }
    desiredX = event.clientX;
    desiredY = event.clientY;
    if (!frame && (desiredX !== x || desiredY !== y)) frame = requestAnimationFrame(tick);
  };
  targets.forEach(target => {
    target.addEventListener('pointerenter', event => show(target, event));
    target.addEventListener('pointermove', event => show(target, event));
    target.addEventListener('pointerleave', () => { if (active === target) hide(); });
    target.addEventListener('pointerdown', event => {
      if (active === target && event.pointerType === 'mouse') cursor.classList.add('is-pressed');
    });
    target.addEventListener('click', hide);
    target.addEventListener('pointercancel', hide);
  });
  document.addEventListener('pointerup', () => cursor.classList.remove('is-pressed'), { passive:true });
  document.addEventListener('keydown', hide);
  document.addEventListener('visibilitychange', hide);
  document.querySelector('.egg-dialog')?.addEventListener('close', hide);
  document.querySelector('.egg-dialog')?.addEventListener('cancel', hide);
  window.addEventListener('scroll', hide, { passive:true });
  window.addEventListener('resize', hide, { passive:true });
  window.addEventListener('blur', hide);
  window.addEventListener('pagehide', hide);
  window.addEventListener('beforeprint', hide);
  fine.addEventListener('change', hide);
})();
