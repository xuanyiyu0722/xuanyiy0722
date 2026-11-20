/* CSS 3D keeps the original photos crisp; the spring runs only while moving. */
(() => {
  const mosaic = document.querySelector('.about-mosaic');
  const tiles = [...mosaic?.querySelectorAll('.about-mosaic__tile') || []];
  if (tiles.length < 3 || !CSS.supports('transform-style','preserve-3d')) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const stage = document.createElement('div');
  stage.className = 'about-photo-drum';
  stage.tabIndex = 0;
  stage.setAttribute('role','region');
  stage.setAttribute('aria-label','My pictures and doll collection. Scroll, drag, or use the up and down arrow keys to rotate the photos.');
  stage.title = 'Scroll, drag, or use ↑ / ↓ to explore';
  const rotor = document.createElement('div');
  rotor.className = 'about-drum-rotor';
  stage.append(rotor);
  const step = 360 / tiles.length;
  const cards = tiles.map(tile => {
    const card = document.createElement('div');
    card.className = 'about-drum-card';
    const back = document.createElement('div');
    back.className = 'about-drum-back';
    back.setAttribute('aria-hidden','true');
    const image = tile.querySelector('img').cloneNode();
    image.alt = '';
    image.draggable = false;
    back.append(image);
    tile.querySelector('img').draggable = false;
    card.append(tile,back);
    rotor.append(card);
    return card;
  });
  mosaic.prepend(stage);
  mosaic.classList.add('about-mosaic--drum');
  let angle = reduce.matches ? 4.35 : 4.35 - 60;
  let target = 4.35, velocity = 0, frame = 0, lastTime = 0;
  let size = 200, radius = 360, perspective = 1070, visible = true, drag = null, suppressClick = false;
  const omega = 8.5;
  const radians = Math.PI / 180;
  const paint = () => {
    rotor.style.transform = `translateZ(${-radius}px) rotateX(${angle}deg)`;
    const active = ((Math.round(angle / step) % tiles.length) + tiles.length) % tiles.length;
    tiles.forEach((tile,index) => {
      const theta = (angle - step * index) * radians;
      const facing = Math.cos(theta) * (perspective + radius) > radius;
      const pointerEvents = facing ? 'auto' : 'none';
      if (tile.style.pointerEvents !== pointerEvents) tile.style.pointerEvents = pointerEvents;
      const tabIndex = facing && index === active ? 0 : -1;
      if (tile.tabIndex !== tabIndex) tile.tabIndex = tabIndex;
      const hidden = String(!facing);
      if (tile.getAttribute('aria-hidden') !== hidden) tile.setAttribute('aria-hidden',hidden);
    });
  };
  const moving = () => Math.abs(target-angle) > .0005 || Math.abs(velocity) > .01;
  const tick = now => {
    frame = 0;
    if (document.hidden || !visible) return;
    let dt = Math.min(.064,Math.max(0,(now-lastTime)/1000));
    lastTime = now;
    if (reduce.matches) { angle = target; velocity = 0; }
    else if (!drag?.moved) {
      while (dt > 0) {
        const h = Math.min(.004,dt);
        velocity += (omega*omega*(target-angle) - 2*omega*velocity)*h;
        angle += velocity*h;
        dt -= h;
      }
      if (!moving()) { angle = target; velocity = 0; }
    }
    if (Math.abs(angle) > 3600) {
      const loops = Math.trunc(angle/360)*360;
      angle -= loops;
      target -= loops;
      if (drag) drag.startAngle -= loops;
    }
    paint();
    if (!drag?.moved && moving()) frame = requestAnimationFrame(tick);
  };
  const wake = () => {
    if (frame || document.hidden || !visible) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  };
  const changed = () => stage.dispatchEvent(new Event('about-photo-drum-change',{ bubbles:true }));
  const turn = delta => {
    changed();
    target += delta;
    if (reduce.matches) { angle = target; velocity = 0; paint(); }
    else wake();
  };
  const measure = () => {
    const rect = stage.getBoundingClientRect();
    size = Math.min(rect.width*.64,rect.height*.34,300);
    radius = size*1.16/Math.sin(step*radians);
    perspective = size*1510/282;
    stage.style.setProperty('--drum-size',`${size}px`);
    stage.style.setProperty('--drum-perspective',`${perspective}px`);
    cards.forEach((card,index) => { card.style.transform = `rotateX(${-index*step}deg) translateZ(${radius}px)`; });
    paint();
  };
  stage.addEventListener('wheel',event => {
    if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1);
    turn(pixels * step/(size*1.16));
  }, { passive:false });
  stage.addEventListener('keydown',event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = ['ArrowDown','PageDown',' '].includes(event.key) ? 1 : ['ArrowUp','PageUp'].includes(event.key) ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    stage.focus({ preventScroll:true });
    turn(step*direction);
  });
  stage.addEventListener('pointerdown',event => {
    if (event.button !== 0 || event.target.closest('a')) return;
    event.preventDefault();
    stage.focus({ preventScroll:true });
    cancelAnimationFrame(frame); frame = 0;
    target = angle; velocity = 0;
    drag = { id:event.pointerId, startY:event.clientY, startAngle:angle, lastY:event.clientY, lastTime:performance.now(), speed:0, moved:false };
    suppressClick = false;
  });
  stage.addEventListener('pointermove',event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (!drag.moved && Math.abs(event.clientY-drag.startY) < 5) return;
    if (!drag.moved) {
      drag.moved = true;
      suppressClick = true;
      stage.setPointerCapture(event.pointerId);
      stage.classList.add('is-dragging');
      changed();
    }
    const now = performance.now();
    const degreesPerPixel = step/(size*1.16);
    const speed = -(event.clientY-drag.lastY)*degreesPerPixel/Math.max(.008,(now-drag.lastTime)/1000);
    drag.speed = speed*.7 + drag.speed*.3;
    angle = target = drag.startAngle-(event.clientY-drag.startY)*degreesPerPixel;
    drag.lastY = event.clientY; drag.lastTime = now;
    wake();
  });
  const release = event => {
    if (!drag || event.pointerId !== drag.id) return;
    const coast = drag.moved && event.type === 'pointerup' && performance.now()-drag.lastTime < 90;
    velocity = coast && !reduce.matches ? drag.speed : 0;
    target = angle + velocity*2/omega;
    drag = null;
    stage.classList.remove('is-dragging');
    wake();
  };
  stage.addEventListener('pointerup',release);
  stage.addEventListener('pointercancel',release);
  stage.addEventListener('lostpointercapture',release);
  stage.addEventListener('click',event => {
    if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; }
  }, { capture:true });
  const stop = () => { cancelAnimationFrame(frame); frame = 0; drag = null; stage.classList.remove('is-dragging'); };
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(stage);
  else window.addEventListener('resize',measure,{ passive:true });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) wake(); else stop();
  }).observe(stage);
  document.addEventListener('visibilitychange',() => { if (document.hidden) stop(); else wake(); });
  window.addEventListener('pagehide',stop);
  window.addEventListener('pageshow',() => { measure(); wake(); });
  reduce.addEventListener('change',() => { if (reduce.matches) { angle=target; velocity=0; stop(); paint(); } else wake(); });
  measure();
  wake();
})();
