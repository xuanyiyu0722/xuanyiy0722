(() => {
  const story = document.querySelector('.about-egg-story');
  const trigger = story?.querySelector('.about-story-trigger');
  const note = story?.querySelector('.about-egg-note');
  if (!trigger || !note) return;
  let pinned = false;
  const setOpen = open => {
    note.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    story.classList.toggle('is-open', open);
  };
  const dismiss = () => { pinned = false; setOpen(false); };
  trigger.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') setOpen(true);
  });
  story.addEventListener('pointerleave', () => {
    if (!pinned && !story.contains(document.activeElement)) setOpen(false);
  });
  story.addEventListener('focusin', () => setOpen(true));
  story.addEventListener('focusout', event => {
    if (!story.contains(event.relatedTarget)) dismiss();
  });
  trigger.addEventListener('click', () => { pinned = !pinned; setOpen(pinned); });
  document.addEventListener('pointerdown', event => {
    if (!story.contains(event.target)) dismiss();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') dismiss(); });
  window.addEventListener('pagehide', dismiss);
})();
