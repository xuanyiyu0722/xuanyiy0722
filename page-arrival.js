(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!Element.prototype.animate) return;

  const scriptURL = document.currentScript.src;
  const destinations = ['gallery.html', 'about.html'].map(page => new URL(page, scriptURL));
  const ostrichArtwork = new URL('assets/images/about-ostrich-egg.png', scriptURL).href;
  const samePage = (a, b) => a.origin === b.origin && a.pathname === b.pathname;
  const currentPage = new URL(location.href);
  const handoffKey = 'portfolio-arrival-covered';
  const expansionDuration = 800;
  const progressStepDuration = 345;
  const eggShakeDuration = 240;
  const eggCrackDuration = 95;
  const hatchDuration = 210;
  const progressHoldDuration = 500;
  let curtain;
  let animation;
  let progressAnimations = [];
  let finish;

  const progressMarker = `
    <span class="page-arrival-marker">
      <svg class="page-arrival-marker-egg" focusable="false"><use href="#page-arrival-closed-egg"/></svg>
      <svg class="page-arrival-marker-chick" focusable="false"><use href="#page-arrival-hatched-egg"/></svg>
    </span>`;
  const progressGroup = `<div class="page-arrival-progress">${progressMarker.repeat(3)}</div>`;

  const illustration = `
    <div class="page-arrival-scene">
      <div class="page-arrival-stage">
        ${progressGroup}
        <svg class="page-arrival-pot" viewBox="0 0 400 474" focusable="false">
          <defs>
            <clipPath id="page-arrival-waterline"><path d="M106 -32H304V94Q205 121 106 94Z"/></clipPath>
            <clipPath id="page-arrival-ostrich-crop"><path d="M448 312H1144V1502H286V612H448Z"/></clipPath>
            <symbol id="page-arrival-closed-egg" viewBox="2020 424 868 1078">
              <image href="${ostrichArtwork}" width="2888" height="1502"/>
            </symbol>
            <symbol id="page-arrival-hatched-egg" viewBox="286 312 858 1190">
              <image clip-path="url(#page-arrival-ostrich-crop)" href="${ostrichArtwork}" width="2888" height="1502"/>
            </symbol>
          </defs>
          <g fill="none" stroke="#B49BBF" stroke-width="4.5" stroke-linecap="round">
            <path class="boiling-steam" d="M116 93c-15-14 12-19 3-35" />
            <path class="boiling-steam" d="M261 36c-13-11 8-18 2-29" style="--beat: 220ms"/>
            <path class="boiling-steam" d="M314 101c-15-14 11-22 3-35" style="--beat: 410ms"/>
          </g>
          <g transform="translate(11 54)">
            <path fill="#493757" d="M22 139c-34 50-29 104 6 146 37 44 89 51 161 51s124-7 161-51c35-42 40-96 6-146Z"/>
            <path fill="#68567E" d="M32 190c8-11 19-10 21 0 2 8-3 16 2 28 3 8 14 18 10 23-6 11-23 1-31-12-8-13-8-30-2-39Zm40 62c4-9 19-6 22 3 4 12-16 13-22 1Z"/>
            <ellipse cx="189" cy="108" rx="185" ry="87.5" fill="#68567E"/>
            <ellipse cx="189" cy="105" rx="153.5" ry="63.5" fill="#F8F5F1"/>
            <ellipse cx="205" cy="98" rx="87" ry="23" fill="#E9CD77"/>
            <g fill="#F0E6C7">
              <path class="boiling-ripple" d="M70 87c11-7 25-9 29-5 6 6-8 11-8 18 0 11 29 20 55 26 6 1 3 4 13 3 11-1 17 4 14 9-3 7-36 9-47 4-9-4-3-7-12-10-12-5-30-6-43-14-14-8-14-21-1-31Z"/>
              <path class="boiling-ripple" d="M229 138c10-2 20 0 32-4 6-2 10 0 10 4 0 6-18 11-38 11-8 0-12-9-4-11Zm66-18c10-7 4-15 14-15 13 1 8 16-7 23-12 6-16-2-7-8Z" style="--beat: 250ms"/>
            </g>
            <g fill="#E9CD77">
              <circle class="boiling-bubble" cx="112" cy="110" r="4.5" style="--beat: 230ms"/>
              <circle class="boiling-bubble" cx="296" cy="100" r="5"/>
              <circle class="boiling-bubble" cx="311" cy="113" r="3" style="--beat: 560ms"/>
            </g>
            <g clip-path="url(#page-arrival-waterline)">
              <g class="boiling-egg">
                <path fill="#F0E6C7" d="M209 0C244 -2 271 42 279 80 292 135 268 188 207 188 147 188 119 143 127 93 134 50 169 2 209 0Z"/>
                <path fill="#B9A4C8" d="M151 51c10-6 12-8 23-20 3-3 5-1 9 1 8 5 15 5 24 2 8-2 8 1 8 10 0 10 3 16 4 23-8 3-22 7-25 15l-35-2Z"/>
                <path fill="#CFB6E3" d="M151 51c14-1 20-4 28-12 11 7 17 6 27 4 1 12 6 17 12 23 4 5-11 1-19 13-4 6-4 10-7 9-5-1-11-4-16-3-7 1-14 5-15 4-2-3-2-8-6-11-4-2-9-3-14-5 7-5 11-9 10-22Z"/>
                <circle cx="167" cy="58.5" r="3" fill="#202132"/>
                <circle cx="186.5" cy="59.5" r="3" fill="#202132"/>
                <path fill="#F0E6C7" d="M171 62c3-4 6-4 8 0 3 1 6 1 5 4 0 4-12 4-16 1-2-2 0-4 3-5Z"/>
              </g>
            </g>
          </g>
          <g class="boiling-fire">
            <g>
              <path fill="#E49B61" d="M200 436c-54 0-106-9-112-46-4-25 13-38 9-64 13 9 27 26 28 43 17-20 13-40 38-62-1 22 10 34 19 39 18-17 28-34 22-62 28 19 43 45 39 69 13-9 22-25 25-44 21 16 19 40 19 47 10-4 19-13 25-23 13 35 8 69-18 87-24 16-62 16-94 16Z"/>
              <path fill="#F0CF78" d="M204 433c-45 0-80-10-83-34-2-12 4-21 8-30 6 13 16 23 29 27 2-17 9-30 21-43-1 17 10 26 20 32 12-10 19-23 17-41 18 15 26 32 25 51 16-5 27-17 33-27 12 20 7 40-7 50-15 10-35 15-63 15Z"/>
            </g>
            <g>
              <path fill="#E49B61" d="M200 436c-54 0-107-9-114-43-5-23 11-37 17-55 10 12 14 21 15 34 17-13 19-39 13-56 25 11 38 24 41 44 16-14 24-37 19-61 14 9 25 21 30 36 18-14 25-29 27-53 26 25 31 52 27 75 16-9 24-23 30-42 20 32 16 69-6 91-22 23-60 30-99 30Z"/>
              <path fill="#F0CF78" d="M202 433c-43 0-79-11-83-34-2-13 6-21 10-32 4 12 14 21 27 26 7-12 9-25 7-38 18 6 31 16 36 30 14-10 25-25 29-44 15 15 21 33 17 51 16-7 29-18 35-31 8 21 5 41-12 53-18 13-43 19-66 19Z"/>
            </g>
          </g>
        </svg>
        ${progressGroup}
      </div>
    </div>`;

  function clear() {
    finish = null;
    progressAnimations.forEach(motion => motion.cancel());
    progressAnimations = [];
    animation?.cancel();
    animation = null;
    curtain?.remove();
    curtain = null;
    root.classList.remove('page-arrival-active');
  }

  function eggMask(width, height, radius) {
    const point = (x, y) => `${(width / 2 + x * radius).toFixed(2)} ${(height / 2 + y * radius).toFixed(2)}`;
    return `path("M ${point(0, -1)}
      C ${point(.37, -1)} ${point(.67, -.44)} ${point(.73, .05)}
      C ${point(.81, .62)} ${point(.51, 1)} ${point(0, 1)}
      C ${point(-.51, 1)} ${point(-.81, .62)} ${point(-.73, .05)}
      C ${point(-.67, -.44)} ${point(-.37, -1)} ${point(0, -1)} Z")`.replace(/\s+/g, ' ');
  }

  function applyMosaicEdge(layer) {
    const width = layer.clientWidth;
    const height = layer.clientHeight;
    const tile = Math.max(14, Math.min(30, Math.round(width / 48)));
    const rows = 5;
    const edgeHeight = tile * rows;
    const tiles = [];

    for (let row = 0; row < rows; row++) {
      for (let x = 0, column = 0; x < width; x += tile, column++) {
        const variation = ((column * 17 + row * 13 + column * row * 7) % 23) / 22 - .5;
        const opacity = Math.max(0, Math.min(1, 1 - (row + 1) / (rows + 1) + variation * .43));
        tiles.push(`<rect x="${x}" y="${height + row * tile}" width="${tile}" height="${tile}" opacity="${opacity.toFixed(2)}"/>`);
      }
    }

    // Start the mosaic just beyond the viewport so the cover is solid before it lifts.
    const mask = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height + edgeHeight}" preserveAspectRatio="none" shape-rendering="crispEdges" fill="white"><rect width="${width}" height="${height}"/>${tiles.join('')}</svg>`;
    layer.style.maskImage = `url("data:image/svg+xml,${encodeURIComponent(mask)}")`;
    layer.style.maskSize = `100% calc(100% + ${edgeHeight}px)`;
    layer.style.maskRepeat = 'no-repeat';
    return edgeHeight;
  }

  function boil(destination, startedAt) {
    const leaving = Boolean(destination);
    const layer = document.createElement('div');
    layer.className = startedAt ? 'page-arrival' : 'page-arrival page-arrival--opening';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = illustration;
    const startTime = startedAt || Date.now();
    if (startedAt) {
      // Continue the simmer at the same phase after the new document loads.
      layer.style.setProperty('--boil-phase', `${startedAt - Date.now()}ms`);
    }
    curtain = layer;
    document.body.prepend(layer);
    root.classList.add('page-arrival-active');

    const reveal = () => {
      animation?.cancel();
      const edgeHeight = applyMosaicEdge(layer);
      const mosaicPosition = `0px -${edgeHeight}px`;
      animation = layer.animate([
        { transform: 'translateY(0)', maskPosition: '0px 0px' },
        { maskPosition: mosaicPosition, offset: .42 },
        { transform: 'translateY(-100%)', maskPosition: mosaicPosition }
      ], { duration: 720, easing: 'cubic-bezier(.52, .06, .25, 1)', fill: 'both' });
      const close = () => { if (curtain === layer) clear(); };
      animation.finished.then(close, close);
    };
    finish = () => {
      if (!leaving) { clear(); return; }
      finish = null;
      try {
        sessionStorage.setItem(handoffKey, JSON.stringify({ destination, startTime }));
      } catch { /* Storage can be unavailable for local files. */ }
      location.assign(destination);
    };

    if (startedAt) { reveal(); return; }

    const width = layer.clientWidth;
    const height = layer.clientHeight;
    animation = layer.animate([
      { clipPath: eggMask(width, height, 1) },
      { clipPath: eggMask(width, height, Math.hypot(width, height)) }
    ], {
      duration: expansionDuration,
      easing: 'cubic-bezier(.68, .012, .82, .40)',
      fill: 'backwards'
    });

    const markers = Array.from(layer.querySelectorAll('.page-arrival-marker'));
    const progressStart = expansionDuration - 160;
    const shakeAndCrackDuration = eggShakeDuration + eggCrackDuration;
    const shakeEnd = eggShakeDuration / shakeAndCrackDuration;
    const hatches = markers.map((marker, index) => {
      const egg = marker.querySelector('.page-arrival-marker-egg');
      const chick = marker.querySelector('.page-arrival-marker-chick');
      const eggStart = progressStart + index * progressStepDuration;
      // A new egg appears just as the preceding one cracks. The last hatches before the hold.
      const hatchStart = eggStart + progressStepDuration;
      const hatchAndHold = hatchDuration + (index === markers.length - 1 ? progressHoldDuration : 0);
      const appear = marker.animate([
        { opacity: 0, transform: 'scale(.65)' },
        { opacity: 1, transform: 'scale(1)' }
      ], { delay: eggStart, duration: 125, easing: 'ease-out', fill: 'both' });
      const crack = egg.animate([
        { opacity: 1, transform: 'scale(1) rotate(0deg)' },
        { opacity: 1, transform: 'scale(1) rotate(-10deg)', offset: shakeEnd * .22 },
        { opacity: 1, transform: 'scale(1) rotate(9deg)', offset: shakeEnd * .44 },
        { opacity: 1, transform: 'scale(1) rotate(-7deg)', offset: shakeEnd * .64 },
        { opacity: 1, transform: 'scale(1) rotate(5deg)', offset: shakeEnd * .83 },
        { opacity: 1, transform: 'scale(1) rotate(0deg)', offset: shakeEnd, easing: 'ease-out' },
        { opacity: 0, transform: 'scale(1.12) rotate(-9deg)' }
      ], {
        delay: hatchStart - eggShakeDuration,
        duration: shakeAndCrackDuration,
        fill: 'both'
      });
      const hatch = chick.animate([
        { opacity: 0, transform: 'translateY(12%) scale(.75)' },
        { opacity: 1, transform: 'translateY(-8%) scale(1.13)', offset: 125 / hatchAndHold },
        { opacity: 1, transform: 'none', offset: hatchDuration / hatchAndHold },
        { opacity: 1, transform: 'none' }
      ], { delay: hatchStart, duration: hatchAndHold, easing: 'linear', fill: 'both' });
      progressAnimations.push(appear, crack, hatch);
      return hatch;
    });
    hatches.at(-1).finished.then(() => {
      if (curtain !== layer || !finish) return;
      if (leaving) finish();
      else reveal();
    }, () => {});
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey || reduceMotion.matches) return;
    const link = event.target.closest('a[href]');
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (samePage(url, currentPage) || !destinations.some(page => samePage(url, page))) return;
    event.preventDefault();
    if (curtain) return;
    if (link.closest('.nav')) window.PortfolioSound?.eggCrack();
    boil(url.href);
  }, { capture: true });

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' || event.key === 'Tab') finish?.();
  });
  window.addEventListener('pagehide', clear);
  window.addEventListener('beforeprint', clear);
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) finish?.();
  });

  const navigation = performance.getEntriesByType('navigation')[0];
  if (destinations.some(page => samePage(currentPage, page))) {
    let startedAt;
    try {
      const stored = sessionStorage.getItem(handoffKey);
      sessionStorage.removeItem(handoffKey);
      const handoff = JSON.parse(stored);
      if (handoff?.destination === currentPage.href && Date.now() - handoff.startTime < 30000) {
        startedAt = handoff.startTime;
      }
    } catch { /* Direct entry uses the full sequence. */ }
    if (!reduceMotion.matches && navigation?.type !== 'back_forward') boil(undefined, startedAt);
  }
})();
