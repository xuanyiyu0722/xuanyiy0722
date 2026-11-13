/* SVG image elements have no native lazy-loading attribute. Keep their original
   geometry and load the artwork shortly before the surrounding SVG is visible. */
(() => {
  const selector = 'image[data-src]';

  function load(root) {
    for (const image of root.querySelectorAll(selector)) {
      image.setAttribute('href', image.dataset.src);
      image.removeAttribute('data-src');
    }
  }

  window.PortfolioArtwork = { load };
  if (!('IntersectionObserver' in window)) {
    load(document);
    return;
  }

  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      load(target);
      observer.unobserve(target);
    }
  }, { rootMargin: '850px 0px' });
  const illustrations = new Set();
  for (const image of document.querySelectorAll(selector)) {
    let svg = image.ownerSVGElement;
    while (svg?.ownerSVGElement) svg = svg.ownerSVGElement;
    if (svg) illustrations.add(svg);
  }
  illustrations.forEach(svg => observer.observe(svg));
  window.addEventListener('beforeprint', () => {
    observer.disconnect();
    load(document);
  });
})();
