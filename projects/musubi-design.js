/* Independent strips keep each feature flow readable at its original screen ratio. */
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-wireframe-strip]').forEach(strip => {
    const group = strip.closest('.musubi-wireframe-group');
    const previous = group.querySelector('[data-wireframe-prev]');
    const next = group.querySelector('[data-wireframe-next]');
    if (!previous || !next) return;
    const controls = group.querySelector('.wireframe-scroll-controls');
    const update = () => {
      const max = strip.scrollWidth - strip.clientWidth;
      controls.hidden = max <= 1;
      previous.disabled = strip.scrollLeft <= 1;
      next.disabled = strip.scrollLeft >= max - 1;
    };
    const move = direction => strip.scrollBy({left:direction * Math.max(190, strip.clientWidth * .75),behavior:reduceMotion.matches ? 'instant' : 'smooth'});
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    strip.addEventListener('scroll', update, {passive:true});
    new ResizeObserver(update).observe(strip);
    update();
  });
})();

/* One pass through Hannah's journey, with pause, replay and direct scene selection. */
(() => {
  const root = document.querySelector('[data-storyline]');
  if (!root) return;
  const steps = JSON.parse(root.querySelector('[data-story-content]').textContent);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const play = root.querySelector('[data-story-play]');
  const buttons = [...root.querySelectorAll('[data-story-step]')];
  const scenes = [...root.querySelectorAll('[data-story-scene]')];
  const route = root.querySelector('#storyline-route');
  const progress = root.querySelector('.storyline-route-progress');
  const traveler = root.querySelector('.storyline-traveler');
  const canvas = root.querySelector('.storyline-canvas');
  const title = root.querySelector('[data-story-title]');
  const copy = root.querySelector('[data-story-copy]');
  const count = root.querySelector('[data-story-count]');
  const description = root.querySelector('.storyline-description');
  const length = route.getTotalLength();
  const duration = 30000;
  let position = 0, selected = -1, playing = false, visible = false;
  let started = false, frame = 0, previousTime = null;
  play.hidden = false;

  const select = index => {
    if (index === selected) return;
    selected = index;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    scenes.forEach((scene, i) => scene.classList.toggle('is-active', i === index));
    title.textContent = steps[index][0];
    copy.textContent = steps[index][1];
    count.textContent = `${String(index + 1).padStart(2, '0')} / 07`;
    if (canvas.scrollWidth > canvas.clientWidth + 1 && started) {
      const scene = scenes[index].getBoundingClientRect();
      const container = canvas.getBoundingClientRect();
      canvas.scrollTo({left: canvas.scrollLeft + scene.left - container.left - (canvas.clientWidth - Math.min(scene.width, canvas.clientWidth)) / 2, behavior: reduceMotion.matches ? 'instant' : 'smooth'});
    }
  };
  const render = () => {
    const point = route.getPointAtLength(length * position);
    progress.style.strokeDashoffset = String(1 - position);
    traveler.setAttribute('cx', point.x);
    traveler.setAttribute('cy', point.y);
    select(Math.min(6, Math.floor(position * 7)));
  };
  const updateButton = () => {
    play.setAttribute('aria-pressed', String(playing));
    play.innerHTML = playing ? 'Pause journey <span aria-hidden="true">Ⅱ</span>' : position >= 1 ? 'Replay journey <span aria-hidden="true">↺</span>' : 'Play journey <span aria-hidden="true">▷</span>';
    description.setAttribute('aria-live', playing ? 'off' : 'polite');
  };
  const tick = time => {
    frame = 0;
    if (!playing || !visible || document.hidden) { previousTime = null; return; }
    if (previousTime !== null) position = Math.min(1, position + Math.min(time - previousTime, 80) / duration);
    previousTime = time;
    render();
    if (position >= 1) { playing = false; previousTime = null; updateButton(); return; }
    frame = requestAnimationFrame(tick);
  };
  const resume = () => {
    if (playing && visible && !document.hidden && !frame) { previousTime = null; frame = requestAnimationFrame(tick); }
  };
  const pause = () => {
    playing = false; previousTime = null; cancelAnimationFrame(frame); frame = 0; updateButton();
  };
  play.addEventListener('click', () => {
    started = true;
    if (playing) { pause(); return; }
    if (position >= 1) { position = 0; render(); }
    playing = true; updateButton(); resume();
  });
  buttons.forEach((button, index) => button.addEventListener('click', () => {
    started = true; pause(); position = index === 6 ? 1 : (index + .2) / 7; render();
    // Replaying after selecting the final scene should start from the beginning.
    updateButton();
  }));
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible && !started && !reduceMotion.matches) {
      started = true; playing = true; updateButton();
    }
    resume();
  }, {threshold: .15}).observe(root);
  document.addEventListener('visibilitychange', resume);
  reduceMotion.addEventListener('change', () => { if (reduceMotion.matches) pause(); });
  render(); updateButton();
})();
