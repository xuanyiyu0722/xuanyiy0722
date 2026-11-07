(() => {
  const mosaic = document.querySelector('.about-mosaic');
  if (!mosaic) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const preview = document.createElement('div');
  const image = document.createElement('img');
  preview.className = 'about-photo-preview';
  preview.setAttribute('aria-hidden', 'true');
  image.alt = '';
  preview.append(image);
  document.body.append(preview);

  let active = null;
  let pinned = false;

  function revealPixels(container, source, isThumbnail) {
    container.querySelector('canvas')?.remove();
    if (reduce.matches || !source.naturalWidth) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;

    let sx = 0, sy = 0, sw = source.naturalWidth, sh = source.naturalHeight;
    if (isThumbnail) {
      const style = getComputedStyle(source);
      const [focusX, focusY] = style.objectPosition.split(' ').map(value => parseFloat(value) / 100);
      const zoom = Number(style.getPropertyValue('--photo-zoom')) || 1;
      const cover = Math.max(width / sw, height / sh);
      const cropWidth = width / cover;
      const cropHeight = height / cover;
      sx = (sw - cropWidth) * focusX + cropWidth * (1 - 1 / zoom) / 2;
      sy = (sh - cropHeight) * focusY + cropHeight * (1 - 1 / zoom) / 2;
      sw = cropWidth / zoom;
      sh = cropHeight / zoom;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    canvas.className = 'about-photo-pixels';
    canvas.setAttribute('aria-hidden', 'true');
    container.append(canvas);

    const blockSizes = [30, 19, 11, 6, 3];
    const duration = isThumbnail ? 560 : 360;
    const start = performance.now();
    let stage = -1;
    function draw(now) {
      if (!canvas.isConnected) return;
      const progress = (now - start) / duration;
      if (progress >= 1 || reduce.matches) { canvas.remove(); return; }
      const next = Math.floor(progress * blockSizes.length);
      if (next !== stage) {
        stage = next;
        canvas.width = Math.max(1, Math.round(width / blockSizes[stage]));
        canvas.height = Math.max(1, Math.round(height / blockSizes[stage]));
        context.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      }
      canvas.style.opacity = Math.min(1, (1 - progress) * 6);
      requestAnimationFrame(draw);
    }
    draw(start);
  }

  function close() {
    active?.setAttribute('aria-expanded', 'false');
    active = null;
    pinned = false;
    preview.classList.remove('is-visible');
    preview.querySelector('canvas')?.remove();
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

    const changed = active !== tile;
    active?.setAttribute('aria-expanded', 'false');
    active = tile;
    pinned = keepOpen;
    active.setAttribute('aria-expanded', 'true');
    image.src = source.currentSrc;
    preview.classList.toggle('is-portrait', tile.classList.contains('about-mosaic__portrait'));
    Object.assign(preview.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
    preview.classList.add('is-visible');
    if (changed) revealPixels(preview, source, false);
  }

  for (const tile of mosaic.querySelectorAll('.about-mosaic__tile')) {
    tile.addEventListener('animationstart', event => {
      if (event.animationName !== 'about-tile-reveal') return;
      const source = tile.querySelector('img');
      if (source.complete) revealPixels(tile, source, true);
      else source.addEventListener('load', () => revealPixels(tile, source, true), { once: true });
    });
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
