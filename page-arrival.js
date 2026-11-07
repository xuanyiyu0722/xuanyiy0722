(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!Element.prototype.animate) return;

  const destinations = ['gallery.html', 'about.html'].map(page => new URL(page, document.currentScript.src));
  const samePage = (a, b) => a.origin === b.origin && a.pathname === b.pathname;
  const currentPage = new URL(location.href);
  const shell = 'M-48 350C24 171 234 8 500 8S976 171 1048 350V955L931 895L806 970L672 910L545 992L404 927L263 978L131 900L-48 958Z';
  const covered = 'translateY(-37%)';
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

  function sweep(destination) {
    const leaving = Boolean(destination);
    const layer = document.createElement('div');
    layer.className = leaving ? 'page-arrival page-arrival--leaving' : 'page-arrival';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = `
      <svg class="page-arrival-shell" viewBox="0 0 1000 1000" preserveAspectRatio="none" focusable="false">
        <defs><clipPath id="page-arrival-shell-shape"><path d="${shell}"/></clipPath></defs>
        <path d="${shell}" fill="#f3e8c8"/>
        <path d="M350 0H1060V1000H743C703 932 651 904 675 838C702 765 823 747 808 650C795 566 674 554 631 488C584 416 645 345 610 277C573 202 425 230 373 162C344 124 359 67 350 0Z"
          fill="#ecd58f" clip-path="url(#page-arrival-shell-shape)"/>
      </svg>`;
    curtain = layer;
    document.body.prepend(layer);
    root.classList.add('page-arrival-active');

    const duration = leaving ? 520 : 680;
    const start = leaving ? 'translateY(52%)' : covered;
    const end = leaving ? covered : 'translateY(-105%)';
    const complete = () => {
      if (curtain !== layer || finish !== complete) return;
      clearTimeout(watchdog);
      finish = null;
      if (leaving) location.assign(destination);
      else clear();
    };
    finish = complete;
    watchdog = setTimeout(complete, duration + 250);
    animation = layer.querySelector('svg').animate([
      { transform: start },
      { transform: end }
    ], {
      duration,
      easing: leaving ? 'cubic-bezier(.63,.04,.28,1)' : 'cubic-bezier(.55,.02,.20,1)',
      fill: 'both'
    });
    animation.finished.then(complete, complete);
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
  if (!reduceMotion.matches && navigation?.type !== 'back_forward' &&
      destinations.some(page => samePage(currentPage, page))) {
    sweep();
  }
})();
