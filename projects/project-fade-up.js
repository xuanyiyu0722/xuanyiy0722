/* Fade Up In for long case studies: animate readable blocks, not entire pages. */
(() => {
  if (!document.body.classList.contains('project-page')) return;
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const chapters = [...document.querySelectorAll('#project-overview, [data-toc-section]')];
  const targets = new Set();
  const animations = new Map();
  const atomic = 'figure, picture, table, iframe, svg, a, p, h1, h2, h3, h4, header, '
    + '[data-hf-experience], .hf-experience, .store-viewer, .ep-journey-map-canvas, '
    + '.ep-native-showcase, .fk-development-frame';
  const excluded = 'script, style, noscript, dialog, br, hr, defs';

  // Replace the older project-only reveal classes with one entrance system.
  document.querySelectorAll('.project-page .reveal').forEach(node => node.classList.remove('reveal', 'in'));
  function collect(node, depth = 0) {
    if (node.matches(excluded) || node.hasAttribute('hidden') || node.closest('dialog')) return;
    if (node.hasAttribute('data-toc-section')) return;
    const children = [...node.children].filter(child => !child.matches(excluded));
    const rect = node.getBoundingClientRect();
    if (!rect.width || getComputedStyle(node).display === 'none') return;
    if (node.querySelector('[data-toc-section]')) {
      children.forEach(child => collect(child, depth + 1));
    } else if (rect.height > innerHeight * .8 && children.length && depth < 3 && !node.matches(atomic)) {
      children.forEach(child => collect(child, depth + 1));
    } else targets.add(node);
  }
  chapters.forEach(chapter => [...chapter.children].forEach(child => collect(child)));
  document.querySelectorAll('.case-next > *').forEach(node => targets.add(node));
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
        const animation = node.animate([
          { opacity: 0, translate: `0 ${innerWidth <= 820 ? 20 : 28}px` },
          { opacity: 1, translate: '0 0' }
        ], { duration: 850, delay: Math.min(order++, 3) * 65, easing: 'cubic-bezier(.22,.72,.18,1)', fill: 'backwards' });
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
