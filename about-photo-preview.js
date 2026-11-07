(() => {
  const mosaic = document.querySelector('.about-mosaic');
  if (!mosaic) return;

  const tiles = [...mosaic.querySelectorAll('.about-mosaic__tile')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const preview = document.createElement('div');
  const image = document.createElement('img');
  preview.className = 'about-photo-preview';
  preview.setAttribute('aria-hidden', 'true');
  preview.hidden = true;
  image.alt = '';
  preview.append(image);
  document.body.append(preview);

  let active = null;
  let motion;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const boxStyle = ({ left, top, width, height }) => ({
    left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`
  });

  function transition(from, to, duration) {
    motion?.cancel();
    Object.assign(preview.style, boxStyle(to));
    if (reducedMotion.matches || !preview.animate) return null;
    motion = preview.animate([boxStyle(from), boxStyle(to)], {
      duration, easing: 'cubic-bezier(.22,.77,.26,1)'
    });
    return motion;
  }

  function makeWay(tile, wall, opened) {
    const gap = 9;
    const centerX = opened.left + opened.width / 2;
    const centerY = opened.top + opened.height / 2;
    const rightEdge = opened.left + opened.width;
    const bottomEdge = opened.top + opened.height;

    tiles.forEach(neighbor => {
      let x = 0;
      let y = 0;
      if (neighbor !== tile) {
        const left = wall.left + neighbor.offsetLeft;
        const top = wall.top + neighbor.offsetTop;
        const right = left + neighbor.offsetWidth;
        const bottom = top + neighbor.offsetHeight;
        const dx = (left + right) / 2 - centerX;
        const dy = (top + bottom) / 2 - centerY;
        const distance = Math.hypot(dx, dy) || 1;
        const nudge = Math.max(0, 1 - distance / wall.width) * 22;
        x = nudge * dx / distance;
        y = nudge * dy / distance;

        if (left < rightEdge + gap && right > opened.left - gap &&
            top < bottomEdge + gap && bottom > opened.top - gap) {
          const shiftX = dx < 0 ? opened.left - right - gap : rightEdge - left + gap;
          const shiftY = dy < 0 ? opened.top - bottom - gap : bottomEdge - top + gap;
          if (Math.abs(shiftX) < Math.abs(shiftY)) x = shiftX;
          else y = shiftY;
        }
      }
      neighbor.style.setProperty('--make-way-x', `${x}px`);
      neighbor.style.setProperty('--make-way-y', `${y}px`);
    });
  }

  function close(animateBack = true) {
    if (!active) {
      if (!animateBack) {
        motion?.cancel();
        preview.hidden = true;
      }
      return;
    }
    const tile = active;
    const from = preview.getBoundingClientRect();
    const to = tile.getBoundingClientRect();
    active = null;
    mosaic.classList.remove('is-making-way');
    tiles.forEach(neighbor => {
      neighbor.style.removeProperty('--make-way-x');
      neighbor.style.removeProperty('--make-way-y');
    });
    const restoreTile = () => {
      if (active !== tile) tile.setAttribute('aria-expanded', 'false');
      if (!active) preview.hidden = true;
    };
    const animation = animateBack ? transition(from, to, 350) : null;
    if (animation) animation.finished.then(restoreTile, restoreTile);
    else {
      motion?.cancel();
      restoreTile();
    }
  }

  function open(tile) {
    const source = tile.querySelector('img');
    if (!source.naturalWidth) return;
    const from = tile.getBoundingClientRect();
    const wall = mosaic.getBoundingClientRect();
    const margin = 16;
    const cover = Math.max(from.width / source.naturalWidth, from.height / source.naturalHeight);
    const scale = Math.min(cover * 2.15, wall.width * .79 / source.naturalWidth,
      wall.height * .88 / source.naturalHeight, (innerHeight - 2 * margin) / source.naturalHeight);
    const width = source.naturalWidth * scale;
    const height = source.naturalHeight * scale;
    const left = clamp(from.left + (from.width - width) / 2,
      Math.max(margin, wall.left), Math.min(innerWidth - margin, wall.right) - width);
    const top = clamp(from.top + (from.height - height) / 2, margin, innerHeight - margin - height);
    const to = { left, top, width, height };

    active?.setAttribute('aria-expanded', 'false');
    active = tile;
    tile.setAttribute('aria-expanded', 'true');
    image.src = source.currentSrc;
    image.style.objectPosition = getComputedStyle(source).objectPosition;
    preview.classList.toggle('is-portrait', tile.classList.contains('about-mosaic__portrait'));
    preview.hidden = false;
    mosaic.classList.add('is-making-way');
    makeWay(tile, wall, to);
    transition(from, to, 500);
  }

  tiles.forEach(tile => tile.addEventListener('click', () => {
    if (active === tile) close();
    else open(tile);
  }));
  preview.addEventListener('click', () => close());
  document.addEventListener('pointerdown', event => {
    if (!mosaic.contains(event.target) && !preview.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') close(false);
  });
  for (const event of ['scroll', 'resize', 'pagehide']) {
    window.addEventListener(event, () => close(false), { passive:true });
  }
})();
