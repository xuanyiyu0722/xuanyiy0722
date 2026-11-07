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
    note.dataset.placement = 'right';
    const anchor = trigger.getBoundingClientRect();
    const host = story.getBoundingClientRect();
    const gap = 14;
    const sideWidth = Math.min(260, host.width - anchor.width - gap);
    let placement = sideWidth >= 174 ? 'right' : 'above';
    let width = placement === 'right' ? sideWidth : Math.min(290, host.width);
    note.style.width = `${width}px`;
    let y = host.bottom - note.offsetHeight;
    if (placement === 'above' || y < 12) {
      placement = 'above';
      width = Math.min(290, host.width);
      note.style.width = `${width}px`;
      y = anchor.top - gap - note.offsetHeight;
      if (y < 12) placement = 'below';
    }
    note.dataset.placement = placement;
    const offset = placement === 'below' ? 0 : host.width - width;
    note.style.left = `${offset}px`;
    note.style.top = placement === 'below' ? '0' : `${y - host.top}px`;
    note.style.bottom = 'auto';
    note.style.setProperty('--note-tail-y', `${clamp(anchor.top + anchor.height / 2 - y, 18, note.offsetHeight - 18)}px`);
    note.style.setProperty('--note-tail-x', `${clamp(anchor.width / 2 - offset, 20, width - 20)}px`);
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
