/* About uses the same Fade Up In timing and behavior as the project detail pages. */
(() => {
  if (!document.body.classList.contains('about-page')) return;
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = new Set(document.querySelectorAll(
    '.about-copy > *, .about-intro > *, .about-egg-story, .about-block, .resume-section-head, .resume-column-heading, '
    + '.internship, .activity, .skill-group'
  ));
  const animations = new Map();
  targets.forEach(node => node.classList.add('fade-up-in'));
  let observer;
  const showAll = () => {
    observer?.disconnect();
    animations.forEach(animation => animation.cancel());
    animations.clear();
    targets.forEach(node => node.classList.add('is-in-view'));
    root.classList.remove('project-fade-ready');
  };
  if (reduce.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) { showAll(); return; }
  try {
    observer = new IntersectionObserver(entries => {
      let order = 0;
      entries.forEach(entry => {
        const node = entry.target;
        if (!entry.isIntersecting) {
          animations.get(node)?.cancel();
          animations.delete(node);
          node.classList.remove('is-in-view');
          return;
        }
        if (node.classList.contains('is-in-view')) return;
        node.classList.add('is-in-view');
        const portrait = node.classList.contains('about-portrait');
        const delay = Math.min(order++, 3) * 65;
        const animation = node.animate([
          { opacity: 0, translate: `0 ${innerWidth <= 820 ? 20 : 28}px` },
          { opacity: 1, translate: '0 0' }
        ], {
          duration: portrait ? 1080 : 850, delay: portrait ? 0 : delay,
          easing: 'cubic-bezier(.22,.72,.18,1)', fill: 'backwards'
        });
        animations.set(node, animation);
        animation.finished.catch(() => {}).then(() => {
          if (animations.get(node) === animation) animations.delete(node);
        });
      });
    }, { threshold: .01, rootMargin: '0px 0px -28px 0px' });
    root.classList.add('project-fade-ready');
    targets.forEach(node => observer.observe(node));
  } catch { showAll(); return; }
  document.addEventListener('focusin', event => {
    const node = event.target.closest('.fade-up-in');
    if (!node) return;
    animations.get(node)?.cancel();
    animations.delete(node);
    node.classList.add('is-in-view');
  });
  reduce.addEventListener('change', event => { if (event.matches) showAll(); });
  window.addEventListener('beforeprint', showAll);
})();
