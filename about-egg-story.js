(() => {
  const story = document.querySelector('.about-egg-story');
  const trigger = story?.querySelector('.about-story-trigger');
  const note = story?.querySelector('.about-egg-note');
  if (!trigger || !note) return;
  const shell = trigger.querySelector('.about-story-state--closed');
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let pinned = false;
  let pointerType;
  let attentionDone = false;
  let attentionMotion;
  let viewObserver;
  let arrivalObserver;
  let inView = false;
  let frame = 0;
  let closeTimer = 0;
  const stopAttention = () => {
    if (attentionDone) return;
    attentionDone = true;
    attentionMotion?.cancel();
    viewObserver?.disconnect();
    arrivalObserver?.disconnect();
    document.removeEventListener('visibilitychange', updateAttention);
    reducedMotion.removeEventListener('change', updateAttention);
  };
  const updateAttention = () => {
    if (attentionDone) return;
    if (reducedMotion.matches) {
      attentionMotion?.cancel();
      attentionMotion = undefined;
      return;
    }
    if (!inView || document.hidden || root.classList.contains('page-arrival-active')) {
      attentionMotion?.pause();
      return;
    }
    attentionMotion ??= shell.animate([
      { translate: '0 0', easing: 'ease-out' },
      { translate: '0 -10px', offset: .2, easing: 'ease-in' },
      { translate: '0 0', offset: .46 },
      { translate: '0 0' }
    ], { duration: 1050, iterations: Infinity });
    attentionMotion.play();
  };

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
    if (open) {
      stopAttention();
      fitNote();
    }
  };
  const dismiss = () => { pinned = false; setOpen(false); };
  const isHovered = () => trigger.matches(':hover') || note.matches(':hover');
  const queueClose = event => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    cancelClose();
    closeTimer = setTimeout(() => {
      if (!pinned && !isHovered() && !story.querySelector(':focus-visible')) setOpen(false);
    }, 180);
  };
  trigger.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    if (note.hidden) window.PortfolioSound?.eggCrack({ hover: true });
    setOpen(true);
  });
  trigger.addEventListener('pointerleave', queueClose);
  note.addEventListener('pointerenter', cancelClose);
  note.addEventListener('pointerleave', queueClose);
  trigger.addEventListener('pointerdown', event => {
    pointerType = event.pointerType;
  });
  story.addEventListener('focusout', event => {
    if (!story.contains(event.relatedTarget) && !isHovered()) dismiss();
  });
  trigger.addEventListener('click', event => {
    if (event.detail > 0 && (pointerType === 'mouse' || pointerType === 'pen') && !note.hidden) return;
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
  window.addEventListener('pagehide', () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    attentionMotion?.pause();
    dismiss();
  });

  if (shell?.animate) {
    if (root.classList.contains('page-arrival-active')) {
      arrivalObserver = new MutationObserver(() => {
        if (root.classList.contains('page-arrival-active')) return;
        arrivalObserver.disconnect();
        updateAttention();
      });
      arrivalObserver.observe(root, { attributes: true, attributeFilter: ['class'] });
    }
    if ('IntersectionObserver' in window) {
      viewObserver = new IntersectionObserver(([entry]) => {
        inView = entry.intersectionRatio >= .65;
        updateAttention();
      }, { threshold: .65 });
      viewObserver.observe(trigger);
    } else {
      inView = true;
      updateAttention();
    }
    document.addEventListener('visibilitychange', updateAttention);
    reducedMotion.addEventListener('change', updateAttention);
  }
})();
