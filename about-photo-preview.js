(() => {
  const mosaic = document.querySelector('.about-mosaic');
  if (!mosaic) return;

  const preview = document.createElement('div');
  const image = document.createElement('img');
  preview.className = 'about-photo-preview';
  preview.setAttribute('aria-hidden', 'true');
  image.alt = '';
  preview.append(image);
  document.body.append(preview);

  let active = null;
  let pinned = false;

  function close() {
    active?.setAttribute('aria-expanded', 'false');
    active = null;
    pinned = false;
    preview.classList.remove('is-visible');
  }

  function show(tile, keepOpen = false) {
    const source = tile.querySelector('img');
    if (!source.naturalWidth) return;

    const rect = tile.getBoundingClientRect();
    const margin = 16;
    const cover = Math.max(rect.width / source.naturalWidth, rect.height / source.naturalHeight);
    const scale = Math.min(cover * 1.1,
      (innerWidth - margin * 2) / source.naturalWidth,
      (innerHeight - margin * 2) / source.naturalHeight);
    const width = source.naturalWidth * scale;
    const height = source.naturalHeight * scale;
    const left = Math.max(margin, Math.min(rect.left + (rect.width - width) / 2, innerWidth - width - margin));
    const top = Math.max(margin, Math.min(rect.top + (rect.height - height) / 2, innerHeight - height - margin));

    active?.setAttribute('aria-expanded', 'false');
    active = tile;
    pinned = keepOpen;
    active.setAttribute('aria-expanded', 'true');
    image.src = source.currentSrc;
    preview.classList.toggle('is-portrait', tile.classList.contains('about-mosaic__portrait'));
    Object.assign(preview.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
    preview.classList.add('is-visible');
  }

  for (const tile of mosaic.querySelectorAll('.about-mosaic__tile')) {
    tile.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && !pinned) show(tile);
    });
    tile.addEventListener('pointerleave', () => {
      if (active === tile && !pinned && !tile.matches(':focus-visible')) close();
    });
    tile.addEventListener('focus', () => { if (tile.matches(':focus-visible')) show(tile); });
    tile.addEventListener('blur', () => { if (active === tile) close(); });
    tile.addEventListener('click', () => { if (active === tile && pinned) close(); else show(tile, true); });
  }

  document.addEventListener('pointerdown', event => { if (active && !active.contains(event.target)) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  window.addEventListener('scroll', close, { passive: true });
  window.addEventListener('resize', close);
  window.addEventListener('pagehide', close);
})();
