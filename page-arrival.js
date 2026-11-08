(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!Element.prototype.animate) return;

  const destinations = ['gallery.html', 'about.html'].map(page => new URL(page, document.currentScript.src));
  const samePage = (a, b) => a.origin === b.origin && a.pathname === b.pathname;
  const currentPage = new URL(location.href);
  // Both paths have matching segments so the silhouette can morph as it rises.
  const eggCap = 'M22 735 C30 535 114 336 218 220 C309 116 410 46 500 46 C590 46 691 116 782 220 C886 336 970 535 978 735 C983 807 954 861 929 866 L847 805 L727 925 L619 849 L510 969 L385 866 L270 933 L151 814 L71 878 C44 861 17 807 22 735 Z';
  const fullShell = 'M-80 560 C-50 415 -20 270 165 115 C256 42 395 8 500 8 C605 8 744 42 835 115 C1020 270 1050 415 1080 560 C1090 733 1087 892 1074 955 L931 895 L806 970 L672 910 L545 992 L404 927 L263 978 L131 900 L-74 958 C-87 892 -90 733 -80 560 Z';
  const covered = 'translateY(-37%)';
  const coverDuration = 1120;
  const morphStart = .65;
  const handoffKey = 'portfolio-arrival-covered';
  let curtain;
  let animation;
  let watchdog;
  let finish;

  function clear() {
    clearTimeout(watchdog);
    finish = null;
    animation?.cancel();
    animation = null;
    curtain?.remove();
    curtain = null;
    root.classList.remove('page-arrival-active');
  }

  function sweep(destination, showIntro = false) {
    const leaving = Boolean(destination);
    const startWithCap = leaving || showIntro;
    const layer = document.createElement('div');
    layer.className = 'page-arrival';
    layer.classList.toggle('page-arrival--starting', startWithCap);
    layer.classList.toggle('page-arrival--intro', showIntro);
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = `
      <svg class="page-arrival-shell" viewBox="0 0 1000 1000" preserveAspectRatio="none" focusable="false">
        <path d="${startWithCap ? eggCap : fullShell}" fill="#FAF4EF">
          ${startWithCap ? `<animate attributeName="d" begin="indefinite" dur="${coverDuration}ms" fill="freeze"
            values="${eggCap};${eggCap};${fullShell}" keyTimes="0;${morphStart};1"
            calcMode="spline" keySplines="0 0 1 1;.58 .04 .25 1"/>` : ''}
        </path>
      </svg>`;
    curtain = layer;
    document.body.prepend(layer);
    root.classList.add('page-arrival-active');

    const drawing = layer.querySelector('svg');
    function play(frames, duration, onEnd) {
      clearTimeout(watchdog);
      animation?.cancel();
      const motion = drawing.animate(frames, { duration, fill: 'both' });
      animation = motion;
      const complete = () => {
        if (animation !== motion || !finish) return;
        clearTimeout(watchdog);
        onEnd();
      };
      watchdog = setTimeout(complete, duration + 250);
      motion.finished.then(complete, complete);
    }

    const reveal = () => {
      layer.classList.remove('page-arrival--intro', 'page-arrival--starting');
      play([
        { transform: covered, easing: 'cubic-bezier(.55,.02,.20,1)' },
        { transform: 'translateY(-105%)' }
      ], 680, clear);
    };
    finish = () => {
      if (!leaving) { clear(); return; }
      clearTimeout(watchdog);
      finish = null;
      try { sessionStorage.setItem(handoffKey, destination); } catch { /* Storage can be unavailable for local files. */ }
      location.assign(destination);
    };

    if (!startWithCap) { reveal(); return; }

    // Give the shell its natural silhouette before expanding it into the wipe.
    const width = layer.clientWidth;
    const height = layer.clientHeight;
    const capWidth = Math.min(width * .72, height * .62, 450);
    const capHeight = capWidth * .68;
    const pose = top => `translateY(${top}px) scale(${capWidth / width},${capHeight / drawing.clientHeight})`;
    const visible = pose((height - capHeight) * .55);
    const outline = drawing.querySelector('path');
    const morph = outline.querySelector('animate');
    play([
      { transform: pose(height + 12), easing: 'cubic-bezier(.20,.75,.32,1)' },
      { transform: visible, offset: .36 },
      { transform: visible, offset: morphStart, easing: 'cubic-bezier(.58,.04,.25,1)' },
      { transform: covered }
    ], coverDuration, () => {
      outline.setAttribute('d', fullShell);
      morph.remove();
      if (leaving) finish();
      else reveal();
    });
    morph.beginElement?.();
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
    sweep(url.href);
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
    let coveredByPreviousPage = false;
    try {
      coveredByPreviousPage = sessionStorage.getItem(handoffKey) === currentPage.href;
      sessionStorage.removeItem(handoffKey);
    } catch { /* Direct entry uses the full sequence. */ }
    if (!reduceMotion.matches && navigation?.type !== 'back_forward') {
      sweep(undefined, !coveredByPreviousPage);
    }
  }
})();
