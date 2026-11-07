(() => {
  const story = document.querySelector('.about-egg-story');
  const trigger = story?.querySelector('.about-story-trigger');
  const note = story?.querySelector('.about-egg-note');
  if (!trigger || !note) return;
  let pinned = false;
  let frame = 0;
  let closeTimer = 0;
  const cancelClose = () => { clearTimeout(closeTimer); closeTimer = 0; };
  const fitNote = () => {
    frame = 0;
    if (note.hidden) return;
    const headroom = Math.max(48, story.getBoundingClientRect().bottom - 12);
    note.style.setProperty('--note-headroom', `${headroom}px`);
  };
  const queueFit = () => { if (!note.hidden && !frame) frame = requestAnimationFrame(fitNote); };
  const setOpen = open => {
    cancelClose();
    note.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    story.classList.toggle('is-open', open);
    if (open) fitNote();
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
  trigger.addEventListener('click', () => {
    pinned = !pinned;
    if (pinned) window.PortfolioSound?.eggCrack();
    setOpen(pinned);
  });
  document.addEventListener('pointerdown', event => {
    if (!story.contains(event.target)) dismiss();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') dismiss(); });
  window.addEventListener('resize', queueFit, { passive:true });
  window.addEventListener('scroll', queueFit, { passive:true });
  window.addEventListener('pagehide', () => { if (frame) cancelAnimationFrame(frame); frame = 0; dismiss(); });
})();
