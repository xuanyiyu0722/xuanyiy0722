/* A small, draggable progress guide for the existing vertical gallery. */
(() => {
  const guide = document.querySelector('.gallery-scroll-guide');
  const stages = [...document.querySelectorAll('.gallery-project')];
  if (!guide || stages.length < 2) return;
  const track = guide.querySelector('.gallery-scroll-track');
  const thumb = guide.querySelector('.gallery-scroll-thumb');
  let current = 0, frame = 0, dragging = false;
  let resting = 0;
  let pendingStop = null;
  let snapTimer;
  let touching = false;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const positions = () => stages.map(stage => {
    const rect = stage.getBoundingClientRect();
    const header = innerWidth <= 820 ? 56 : 0;
    return clamp(rect.top + scrollY + rect.height/2 - (innerHeight + header)/2,
      0, document.documentElement.scrollHeight - innerHeight);
  });
  const closest = stops => stops.reduce((best, stop, index) =>
    Math.abs(stop - scrollY) < Math.abs(stops[best] - scrollY) ? index : best, 0);
  const update = () => {
    frame = 0;
    const stops = positions();
    const progress = clamp((scrollY - stops[0]) / Math.max(1, stops.at(-1) - stops[0]), 0, 1);
    current = closest(stops);
    thumb.style.transform = `translate3d(-50%,${progress * (track.clientHeight - thumb.clientHeight)}px,0)`;
    track.setAttribute('aria-valuenow', current + 1);
    track.setAttribute('aria-valuetext', `${current + 1} of ${stages.length} — ${stages[current].querySelector('h2').textContent}`);
  };
  const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
  const scrollTo = (top, immediate = false) => {
    if (window.PortfolioGalleryScroll) window.PortfolioGalleryScroll.to(top, { immediate });
    else window.scrollTo({ top, behavior:immediate ? 'instant' : 'smooth' });
  };
  const select = (index, stops = positions()) => {
    resting = clamp(index, 0, stops.length - 1);
    const top = stops[resting];
    pendingStop = Math.abs(top - scrollY) > 1 ? top : null;
    if (pendingStop !== null) scrollTo(top);
  };
  const snap = (useDirection = true) => {
    clearTimeout(snapTimer);
    if (dragging || touching || document.documentElement.classList.contains('page-arrival-active')) return;
    if (pendingStop !== null) {
      if (Math.abs(pendingStop - scrollY) <= 1) pendingStop = null;
      return;
    }
    const stops = positions();
    const nearest = closest(stops);
    const distance = scrollY - stops[resting];
    const threshold = Math.min(90, innerHeight * .13);
    const target = useDirection && nearest === resting && Math.abs(distance) >= threshold
      ? nearest + Math.sign(distance) : nearest;
    select(target, stops);
  };
  const scheduleSnap = () => {
    clearTimeout(snapTimer);
    snapTimer = setTimeout(snap, 130);
  };
  const reset = () => {
    clearTimeout(snapTimer);
    pendingStop = null;
    resting = closest(positions());
    queue();
  };
  const drag = event => {
    const rect = track.getBoundingClientRect();
    const stops = positions();
    const progress = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    scrollTo(stops[0] + progress * (stops.at(-1) - stops[0]), true);
    queue();
  };
  track.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    track.focus({ preventScroll:true });
    track.setPointerCapture(event.pointerId);
    dragging = true;
    drag(event);
  });
  track.addEventListener('pointermove', event => { if (dragging) drag(event); });
  const finishDrag = () => {
    if (!dragging) return;
    dragging = false;
    snap(false);
  };
  track.addEventListener('pointerup', finishDrag);
  track.addEventListener('pointercancel', finishDrag);
  track.addEventListener('lostpointercapture', finishDrag);
  track.addEventListener('keydown', event => {
    const actions = { ArrowUp:current-1, ArrowDown:current+1, PageUp:current-1, PageDown:current+1, Home:0, End:stages.length-1 };
    if (!(event.key in actions)) return;
    event.preventDefault();
    select(actions[event.key]);
  });
  guide.hidden = false;
  track.setAttribute('aria-valuemax', stages.length);
  window.addEventListener('scroll', () => { queue(); scheduleSnap(); }, { passive:true });
  // A fresh gesture may interrupt an in-flight snap. Its own scroll events may not.
  const releaseSnap = () => { pendingStop = null; };
  for (const event of ['wheel', 'pointerdown']) {
    window.addEventListener(event, releaseSnap, { capture:true, passive:true });
  }
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) releaseSnap();
  }, { capture:true });
  window.addEventListener('touchstart', () => { touching = true; }, { passive:true });
  for (const event of ['touchend', 'touchcancel']) {
    window.addEventListener(event, () => { touching = false; scheduleSnap(); }, { passive:true });
  }
  window.addEventListener('resize', reset, { passive:true });
  window.addEventListener('pageshow', reset);
  window.addEventListener('pagehide', () => {
    clearTimeout(snapTimer);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    pendingStop = null;
    dragging = false;
    touching = false;
  });
  document.fonts?.ready.then(queue);
  update();
})();
