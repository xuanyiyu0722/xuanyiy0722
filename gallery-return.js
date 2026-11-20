/* Remember the gallery entry point independently of case-study section history. */
(() => {
  const entryKey = 'portfolio:gallery-entry';
  const restoreKey = 'portfolio:gallery-restore';
  const root = document.documentElement;
  const gallery = document.querySelector('.gallery-showcase');
  const read = key => {
    try {
      const value = JSON.parse(sessionStorage.getItem(key));
      if (!value || !Number.isFinite(value.y) || value.y < 0 ||
          !Number.isFinite(value.offset) || !/^work-[1-4]$/.test(value.stage)) return null;
      const url = new URL(value.url, location.href);
      if (url.origin !== location.origin || !url.pathname.endsWith('/gallery.html')) return null;
      return { ...value, url:url.pathname + url.search + url.hash };
    } catch { return null; }
  };
  const write = (key, value) => {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Anchor fallback remains available. */ }
  };
  const plainClick = event => event.button === 0 && !event.metaKey &&
    !event.ctrlKey && !event.shiftKey && !event.altKey;

  if (!gallery) {
    const entry = read(entryKey);
    if (!entry) return;
    document.querySelectorAll('a.back-home').forEach(link => {
      link.href = entry.url;
      link.addEventListener('click', event => {
        if (plainClick(event)) write(restoreKey, entry);
      }, { capture:true });
    });
    return;
  }

  document.addEventListener('click', event => {
    if (!plainClick(event)) return;
    const link = event.target.closest('.gallery-cover-stage, .gallery-project-title-link');
    const stage = link?.closest('.gallery-project');
    if (!stage || (link.target && link.target !== '_self')) return;
    write(entryKey, {
      url:location.pathname + location.search + location.hash,
      y:scrollY,
      stage:stage.id,
      offset:scrollY - (stage.getBoundingClientRect().top + scrollY),
      width:innerWidth,
      height:innerHeight
    });
  }, { capture:true });

  const entry = read(restoreKey);
  try { sessionStorage.removeItem(restoreKey); } catch { /* Storage may be unavailable. */ }
  if (!entry) return;
  const stage = document.getElementById(entry.stage);
  if (!stage) return;
  root.dataset.galleryRestoring = 'true';
  let interrupted = false;
  const restore = () => {
    if (interrupted) return;
    const rect = stage.getBoundingClientRect();
    const top = rect.top + scrollY;
    const sameViewport = entry.width === innerWidth && entry.height === innerHeight;
    const target = sameViewport ? top + entry.offset : top + rect.height / 2 - innerHeight / 2;
    const y = Math.max(0, Math.min(target, root.scrollHeight - innerHeight));
    if (window.PortfolioGalleryScroll) window.PortfolioGalleryScroll.to(y, { immediate:true });
    else window.scrollTo({ top:y, behavior:'instant' });
    window.dispatchEvent(new Event('gallery-position-restored'));
  };
  const release = event => {
    if (event.type === 'keydown' && !['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) return;
    interrupted = true;
    delete root.dataset.galleryRestoring;
    window.dispatchEvent(new Event('gallery-position-restored'));
    for (const type of ['wheel','pointerdown','touchstart','keydown']) window.removeEventListener(type, release, true);
  };
  for (const type of ['wheel','pointerdown','touchstart','keydown']) {
    window.addEventListener(type, release, { capture:true, passive:true });
  }
  // Apply before entry animations, then correct any font/image layout shifts.
  restore();
  document.fonts?.ready.then(() => requestAnimationFrame(restore));
  if (document.readyState !== 'complete') window.addEventListener('load', restore, { once:true });
})();
