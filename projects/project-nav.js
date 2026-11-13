/* Native anchor links work without JavaScript; this adds reading position. */
(() => {
  const links = [...document.querySelectorAll('.project-toc a[href^="#"]')];
  const sections = [...document.querySelectorAll('[data-toc-section]')];
  const menu = document.querySelector('.project-mobile-menu');
  if (!links.length || !sections.length) return;
  const linksBySection = new Map(sections.map(section => [
    section.id, links.filter(link => link.hash === `#${section.id}`)
  ]));
  let current = '';
  let frame = 0;
  let geometry;
  let requested = sections.find(section => `#${section.id}` === location.hash);

  const update = () => {
    frame = 0;
    const pageY = window.scrollY;
    geometry ??= {
      tops: sections.map(section => section.getBoundingClientRect().top + pageY),
      bottom: document.documentElement.scrollHeight - innerHeight - 3,
      marker: innerWidth <= 820 ? 112 : 96
    };
    let index = 0;
    for (let i = 0; i < sections.length; i++) {
      if (geometry.tops[i] <= pageY + geometry.marker) index = i;
      else break;
    }
    // Short final chapters cannot always reach the top of the viewport.
    // Keep an explicit anchor selection until the reader scrolls again.
    const active = requested || sections[pageY >= geometry.bottom ? sections.length - 1 : index];
    if (current === active.id) return;
    linksBySection.get(current)?.forEach(link => link.removeAttribute('aria-current'));
    current = active.id;
    const selectedLinks = linksBySection.get(current) || [];
    selectedLinks.forEach(link => link.setAttribute('aria-current', 'location'));
    const selected = selectedLinks.find(link => link.closest('.project-sidebar'));
    if (selected) {
      const nav = selected.closest('.project-toc');
      const itemBox = selected.getBoundingClientRect();
      const navBox = nav.getBoundingClientRect();
      if (itemBox.bottom > navBox.bottom) nav.scrollTop += itemBox.bottom - navBox.bottom + 8;
      if (itemBox.top < navBox.top) nav.scrollTop -= navBox.top - itemBox.top + 8;
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const remeasure = () => { geometry = undefined; schedule(); };
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', remeasure, {passive: true});
  window.addEventListener('load', remeasure);
  window.addEventListener('pageshow', remeasure);
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(remeasure);
    const main = sections[0].closest('main');
    if (main) observer.observe(main);
    sections.forEach(section => observer.observe(section));
  }
  window.addEventListener('hashchange', () => {
    requested = sections.find(section => `#${section.id}` === location.hash);
    schedule();
  });
  links.forEach(link => link.addEventListener('click', () => {
    requested = sections.find(section => `#${section.id}` === link.hash);
    if (menu) menu.open = false;
    schedule();
  }));
  const resumeReading = event => {
    if (!requested || event.target.closest?.('.project-toc, .project-mobile-menu')) return;
    requested = null;
    schedule();
  };
  document.addEventListener('wheel', resumeReading, {passive: true});
  document.addEventListener('touchmove', resumeReading, {passive: true});
  document.addEventListener('pointerdown', resumeReading, {passive: true});
  document.addEventListener('click', event => {
    if (menu?.open && !menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) resumeReading(event);
    if (event.key === 'Escape' && menu?.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
  update();
})();
