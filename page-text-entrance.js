/* Refresh entrances for Gallery and About, with the reference's soft stagger. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = [...document.querySelectorAll(
    '.gallery-page-hero > *, .gallery-meta, .gallery-item > p, '
    + '.about-copy > *, .about-block, .resume-section-head, .resume-column-heading, '
    + '.internship, .activity, .skill-group'
  )];
  const animations = new Map();
  let observer;
  const showAll = () => {
    observer?.disconnect();
    animations.forEach(animation => animation.cancel());
    animations.clear();
    targets.forEach(node => node.classList.add('is-in-view'));
    root.classList.remove('page-text-ready');
  };
  targets.forEach(node => node.classList.add('text-arrival'));
  if (reduce.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) { showAll(); return; }
  try {
    observer = new IntersectionObserver(entries => {
      let order = 0;
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const node = entry.target;
        node.classList.add('is-in-view');
        const animation = node.animate([
          { opacity: 0, translate: '0 30px' },
          { opacity: 1, translate: '0 0' }
        ], { duration: 900, delay: Math.min(order++,4) * 90, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'backwards' });
        animations.set(node, animation);
        animation.finished.catch(() => {}).then(() => animations.delete(node));
        observer.unobserve(node);
      });
    }, { threshold: .04, rootMargin: '0px 0px -20px 0px' });
    root.classList.add('page-text-ready');
    targets.forEach(node => observer.observe(node));
  } catch { showAll(); return; }
  document.addEventListener('focusin', event => {
    const node = event.target.closest('.text-arrival');
    if (!node) return;
    animations.get(node)?.cancel(); animations.delete(node);
    node.classList.add('is-in-view'); observer.unobserve(node);
  });
  reduce.addEventListener('change', event => { if (event.matches) showAll(); });
  window.addEventListener('beforeprint', showAll);
})();
