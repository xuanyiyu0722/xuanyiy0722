/* Native anchor links work without JavaScript; this adds reading position. */
(() => {
  const links = [...document.querySelectorAll('.project-toc a[href^="#"]')];
  const sections = [...document.querySelectorAll('[data-toc-section]')];
  const menu = document.querySelector('.project-mobile-menu');
  if (!links.length || !sections.length) return;
  let current = '';
  let scheduled = false;
  let requested = sections.find(section => `#${section.id}` === location.hash);

  const update = () => {
    scheduled = false;
    const marker = window.innerWidth <= 820 ? 112 : 96;
    let active = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= marker) active = section;
      else break;
    }
    // Short final chapters cannot always reach the top of the viewport.
    // Keep an explicit anchor selection until the reader scrolls again.
    if (requested) active = requested;
    else if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3) active = sections[sections.length - 1];
    if (current === active.id) return;
    current = active.id;
    for (const link of links) {
      if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    const selected = document.querySelector('.project-sidebar a[aria-current="location"]');
    if (selected) {
      const nav = selected.closest('.project-toc');
      const itemBox = selected.getBoundingClientRect();
      const navBox = nav.getBoundingClientRect();
      if (itemBox.bottom > navBox.bottom) nav.scrollTop += itemBox.bottom - navBox.bottom + 8;
      if (itemBox.top < navBox.top) nav.scrollTop -= navBox.top - itemBox.top + 8;
    }
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; window.requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
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
    if (event.target.closest?.('.project-toc, .project-mobile-menu')) return;
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
