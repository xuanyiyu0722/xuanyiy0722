(() => {
  'use strict';
  const section = document.querySelector('#user-journey');
  if (!section) return;
  const svg = section.querySelector('.ep-lifetime-journey');
  const canvas = section.querySelector('.ep-journey-map-canvas');
  const content = section.querySelector('[data-journey-content]');
  if (!svg || !canvas || !content) return;
  const steps = JSON.parse(content.textContent);
  const totalStages = new Set(steps.map(step => step.stage)).size;
  const fit = section.querySelector('[data-journey-overview]');
  const minus = section.querySelector('[data-journey-zoom-out]');
  const plus = section.querySelector('[data-journey-zoom-in]');
  const play = section.querySelector('[data-journey-play]');
  const previous = section.querySelector('[data-journey-prev]');
  const next = section.querySelector('[data-journey-next]');
  const count = section.querySelector('[data-journey-count]');
  const progress = section.querySelector('[data-journey-progress]');
  const stageButtons = [...section.querySelectorAll('[data-journey-step]')];
  const points = [...section.querySelectorAll('[data-journey-point]')];
  const caption = section.querySelector('.ep-journey-caption');
  const title = section.querySelector('[data-journey-title]');
  const copy = section.querySelector('[data-journey-copy]');
  const phase = section.querySelector('[data-journey-phase]');
  const role = section.querySelector('[data-journey-role]');
  const BASE = {x: 0, y: 0, w: 2956, h: 1500};
  const DURATION = 4800;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let camera = {...BASE}, cameraFrame = 0, tourFrame = 0, drag = null;
  let index = -1, playing = false, elapsed = 0, lastTime = 0, finished = false;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const aspect = () => canvas.clientWidth / canvas.clientHeight || BASE.w / BASE.h;

  function constrain(rect) {
    const scale = Math.min(1, BASE.w / rect.w, BASE.h / rect.h);
    const w = rect.w * scale, h = rect.h * scale;
    return {x: clamp(rect.x + rect.w / 2 - w / 2, 0, BASE.w - w), y: clamp(rect.y + rect.h / 2 - h / 2, 0, BASE.h - h), w, h};
  }
  function render(rect) {
    camera = rect;
    svg.setAttribute('viewBox', [rect.x, rect.y, rect.w, rect.h].map(n => n.toFixed(2)).join(' '));
    const zoom = BASE.w / rect.w;
    const full = Math.abs(rect.w - BASE.w) < .5;
    section.querySelector('[data-journey-zoom]').textContent = Math.round(zoom * 100) + '%';
    minus.disabled = full;
    plus.disabled = zoom >= 5.98;
    fit.setAttribute('aria-pressed', String(full));
    canvas.classList.toggle('is-zoomed', !full);
    const unit = rect.w / Math.max(1, canvas.clientWidth);
    points.forEach(point => {
      point.querySelector('circle').setAttribute('r', String(13 * unit));
      point.querySelector('text').style.fontSize = 11 * unit + 'px';
    });
  }
  function move(target, animate = true) {
    cancelAnimationFrame(cameraFrame);
    if (!animate || reduced.matches) { render(target); return; }
    const from = {...camera}, start = performance.now();
    function tick(now) {
      const p = clamp((now - start) / 900, 0, 1);
      const ease = p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
      const rect = {};
      for (const key of ['x', 'y', 'w', 'h']) rect[key] = from[key] + (target[key] - from[key]) * ease;
      render(rect);
      if (p < 1) cameraFrame = requestAnimationFrame(tick);
    }
    cameraFrame = requestAnimationFrame(tick);
  }
  function stageCamera(i) {
    const step = steps[i];
    const w = Math.max(i === 7 || i === 11 ? 900 : 780, 470 * aspect());
    const h = w / aspect();
    return constrain({x: step.x - w / 2, y: step.y - 20 - h / 2, w, h});
  }
  function updateProgress() {
    stageButtons.forEach((button, i) => {
      button.classList.toggle('is-complete', i < index || finished);
      button.classList.toggle('is-active', i === index);
      button.setAttribute('aria-pressed', String(i === index));
      button.style.setProperty('--stage-progress', i === index ? String(elapsed / DURATION) : '0');
    });
  }
  function updatePlay() {
    play.setAttribute('aria-pressed', String(playing));
    play.querySelector('[data-journey-play-label]').textContent = playing ? 'Pause journey' : finished ? 'Replay journey' : index >= 0 ? 'Continue journey' : 'Play journey';
    play.querySelector('[data-journey-play-icon]').textContent = playing ? 'Ⅱ' : finished ? '↺' : '▷';
    section.classList.toggle('is-playing', playing);
    // Announce manual selections without interrupting a screen reader during playback.
    caption.setAttribute('aria-live', playing ? 'off' : 'polite');
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(tourFrame);
    lastTime = 0;
    updatePlay();
  }
  function selectStage(i, animate = true) {
    index = clamp(i, 0, steps.length - 1);
    elapsed = 0;
    finished = false;
    const step = steps[index];
    title.textContent = step.title;
    copy.textContent = step.description;
    phase.textContent = step.phase + (step.parallel ? ' · Parallel moment' : '');
    role.textContent = step.role + '-led moment';
    role.dataset.role = step.role.toLowerCase();
    count.textContent = step.label + ' / ' + totalStages;
    previous.disabled = index === 0;
    next.disabled = index === steps.length - 1;
    points.forEach((point, i) => {
      point.classList.toggle('is-active', i === index);
      point.setAttribute('aria-pressed', String(i === index));
    });
    canvas.classList.add('is-focused');
    updateProgress();
    updatePlay();
    move(stageCamera(index), animate);
  }
  function advance(now) {
    if (!playing) return;
    if (lastTime) elapsed += Math.min(now - lastTime, 100);
    lastTime = now;
    if (elapsed >= DURATION) {
      if (index < steps.length - 1) selectStage(index + 1);
      else {
        elapsed = DURATION;
        finished = true;
        updateProgress();
        pause();
        return;
      }
    }
    updateProgress();
    tourFrame = requestAnimationFrame(advance);
  }
  function start() {
    if (index < 0 || finished) selectStage(0);
    section.querySelector('.ep-journey-toolbar-simple').scrollIntoView({block: 'start', behavior: reduced.matches ? 'instant' : 'smooth'});
    playing = true;
    lastTime = 0;
    updatePlay();
    tourFrame = requestAnimationFrame(advance);
  }
  function overview() {
    pause();
    index = -1;
    elapsed = 0;
    finished = false;
    title.textContent = 'From adoption to remembrance';
    copy.textContent = 'Play the journey to follow each moment, or choose a numbered stage to explore at your own pace.';
    phase.textContent = 'A life together';
    role.textContent = 'Owner & pet';
    delete role.dataset.role;
    count.textContent = '00 / ' + totalStages;
    previous.disabled = true;
    next.disabled = false;
    points.forEach(point => {point.classList.remove('is-active'); point.setAttribute('aria-pressed', 'false');});
    canvas.classList.remove('is-focused');
    updateProgress();
    updatePlay();
    move({...BASE});
  }
  function zoomBy(factor) {
    pause();
    const w = clamp(camera.w / factor, BASE.w / 6, BASE.w), h = w / aspect();
    if (factor < 1 && (w >= BASE.w * .98 || h >= BASE.h * .98)) { overview(); return; }
    move(constrain({x: camera.x + camera.w / 2 - w / 2, y: camera.y + camera.h / 2 - h / 2, w, h}));
  }
  play.addEventListener('click', () => playing ? pause() : start());
  fit.addEventListener('click', overview);
  previous.addEventListener('click', () => { pause(); selectStage(index - 1); });
  next.addEventListener('click', () => { pause(); selectStage(index + 1); });
  plus.addEventListener('click', () => zoomBy(1.35));
  minus.addEventListener('click', () => zoomBy(1 / 1.35));
  stageButtons.forEach((button, i) => button.addEventListener('click', () => { pause(); selectStage(i); }));
  points.forEach((point, i) => {
    const select = () => { pause(); selectStage(i); };
    point.addEventListener('click', select);
    point.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); select();}
    });
  });
  canvas.addEventListener('keydown', event => {
    if (event.target !== canvas) return;
    if (['+', '=', '-', '_', 'Home', 'Escape', ' '].includes(event.key)) {
      event.preventDefault();
      if (event.key === ' ') playing ? pause() : start();
      else if (['Home', 'Escape'].includes(event.key)) overview();
      else zoomBy(['+', '='].includes(event.key) ? 1.35 : 1 / 1.35);
    }
    if (camera.w < BASE.w && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault(); pause(); cancelAnimationFrame(cameraFrame);
      const rect = {...camera}, delta = rect.w * .08;
      rect.x += event.key === 'ArrowRight' ? delta : event.key === 'ArrowLeft' ? -delta : 0;
      rect.y += event.key === 'ArrowDown' ? delta : event.key === 'ArrowUp' ? -delta : 0;
      render(constrain(rect));
    }
  });
  canvas.addEventListener('dragstart', event => event.preventDefault());
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || camera.w >= BASE.w || event.target.closest('button,a,[data-journey-point]')) return;
    pause(); cancelAnimationFrame(cameraFrame);
    drag = {id: event.pointerId, x: event.clientX, y: event.clientY, camera: {...camera}};
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    event.preventDefault();
    const unit = drag.camera.w / canvas.clientWidth;
    render(constrain({...drag.camera, x: drag.camera.x - (event.clientX - drag.x) * unit, y: drag.camera.y - (event.clientY - drag.y) * unit}));
  });
  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    drag = null;
    canvas.classList.remove('is-dragging');
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  let width = canvas.clientWidth;
  if ('ResizeObserver' in window) new ResizeObserver(() => {
    if (Math.abs(width - canvas.clientWidth) < 1) return;
    width = canvas.clientWidth;
    if (index >= 0) move(stageCamera(index), false);
    else render({...BASE});
  }).observe(canvas);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting && playing) pause();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => {if (document.hidden && playing) pause();});
  window.addEventListener('pagehide', () => {pause(); cancelAnimationFrame(cameraFrame);});
  play.hidden = false;
  section.querySelector('[data-journey-navigation]').hidden = false;
  progress.hidden = false;
  section.classList.add('has-journey-tour');
  render({...BASE});
  updatePlay();
})();
