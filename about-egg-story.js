(() => {
  const story = document.querySelector('.about-egg-story');
  const trigger = story?.querySelector('.about-story-trigger');
  const note = story?.querySelector('.about-egg-note');
  if (!trigger || !note) return;
  let pinned = false;
  let frame = 0;
  let closeTimer = 0;
  const cancelClose = () => { clearTimeout(closeTimer); closeTimer = 0; };
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const positionNote = () => {
    frame = 0;
    if (note.hidden) return;
    const anchor = trigger.getBoundingClientRect();
    const host = story.getBoundingClientRect();
    const margin = 16, gap = 14;
    const availableRight = innerWidth - anchor.right - gap - margin;
    const availableLeft = anchor.left - gap - margin;
    let placement = availableRight >= 220 ? 'right' : availableLeft >= 220 ? 'left' : 'above';
    const beside = placement !== 'above';
    const width = Math.min(320, placement === 'right' ? availableRight
      : placement === 'left' ? availableLeft : innerWidth - margin * 2);
    note.style.width = `${width}px`;
    const height = note.offsetHeight;
    if (!beside && anchor.top < height + gap + margin && innerHeight - anchor.bottom >= height + gap + margin) placement = 'below';
    note.dataset.placement = placement;
    const x = placement === 'right' ? anchor.right + gap : placement === 'left' ? anchor.left - gap - width
      : clamp(anchor.left + anchor.width / 2 - width / 2, margin, innerWidth - width - margin);
    const y = clamp(beside ? anchor.top + anchor.height / 2 - height + 24
      : placement === 'above' ? anchor.top - height - gap : anchor.bottom + gap,
      margin, innerHeight - height - margin);
    note.style.left = `${x - host.left}px`;
    note.style.top = `${y - host.top}px`;
    note.style.bottom = 'auto';
    note.style.setProperty('--note-tail-y', `${clamp(anchor.top + anchor.height / 2 - y, 18, height - 18)}px`);
    note.style.setProperty('--note-tail-x', `${clamp(anchor.left + anchor.width / 2 - x, 20, width - 20)}px`);
  };
  const queuePosition = () => { if (!note.hidden && !frame) frame = requestAnimationFrame(positionNote); };
  const setOpen = open => {
    cancelClose();
    note.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    story.classList.toggle('is-open', open);
    if (open) positionNote();
  };
  const dismiss = () => { pinned = false; setOpen(false); };
  trigger.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') setOpen(true);
  });
  story.addEventListener('pointerenter', cancelClose);
  story.addEventListener('pointerleave', () => {
    cancelClose();
    if (!pinned && !story.contains(document.activeElement)) closeTimer = setTimeout(() => {
      if (!pinned && !story.matches(':hover') && !story.contains(document.activeElement)) setOpen(false);
    }, 180);
  });
  story.addEventListener('focusin', () => setOpen(true));
  story.addEventListener('focusout', event => {
    if (!story.contains(event.relatedTarget) && !story.matches(':hover')) dismiss();
  });
  trigger.addEventListener('click', () => { pinned = !pinned; setOpen(pinned); });
  document.addEventListener('pointerdown', event => {
    if (!story.contains(event.target)) dismiss();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') dismiss(); });
  window.addEventListener('resize', queuePosition, { passive:true });
  window.addEventListener('scroll', queuePosition, { passive:true });
  document.fonts?.ready.then(queuePosition);
  window.addEventListener('pagehide', () => { if (frame) cancelAnimationFrame(frame); frame = 0; dismiss(); });
})();
