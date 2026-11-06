// Use the existing project app icons as pointers over the homepage project index.
(() => {
  const projects = [
    {href:'projects/naborfood.html', icon:'assets/images/naborfood-cursor-icon.png'},
    {href:'projects/fridgekey.html', icon:'assets/images/fridgekey-design/app-logo-original.png', viewBox:'52 212 842 842', width:1845, height:2294},
    {href:'projects/project-03.html', icon:'assets/images/everpaw-research/app-logo-original.png'},
    {href:'projects/project-04.html', icon:'assets/images/musubi-background/musubi-app-icon.png'}
  ];
  const cursor = document.createElement('div');
  cursor.className = 'project-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.hidden = true;
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  let active = null;
  let pointerPosition = null;

  const hide = () => {
    cursor.hidden = true;
    active?.row.classList.remove('has-project-cursor');
    active?.art.classList.remove('is-active');
    active = null;
  };

  for (const project of projects) {
    const row = document.querySelector(`.home-page .index-row[href="${project.href}"]`);
    if (!row) continue;
    const art = document.createElement('span');
    art.className = 'project-cursor-icon';
    art.dataset.project = row.querySelector('.index-title').textContent;
    const image = new Image();
    image.alt = '';
    image.src = project.icon;
    let ready = false;
    image.decode().then(() => { ready = true; }).catch(() => {});

    if (project.viewBox) {
      // The FridgeKey icon sits in the upper-left of its original logo board.
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', project.viewBox);
      svg.setAttribute('focusable', 'false');
      const raster = document.createElementNS(ns, 'image');
      raster.setAttribute('href', project.icon);
      raster.setAttribute('width', project.width);
      raster.setAttribute('height', project.height);
      svg.append(raster);
      art.append(svg);
    } else {
      art.append(image);
    }
    cursor.append(art);

    const show = event => {
      if (!finePointer.matches || event.pointerType !== 'mouse' || !ready) {
        hide();
        return;
      }
      if (active?.row !== row) {
        hide();
        active = {row, art};
        row.classList.add('has-project-cursor');
        art.classList.add('is-active');
      }
      pointerPosition = {x:event.clientX, y:event.clientY};
      cursor.style.transform = `translate3d(${event.clientX - 24}px,${event.clientY - 24}px,0)`;
      cursor.hidden = false;
    };
    row.addEventListener('pointerenter', show);
    row.addEventListener('pointermove', show);
    row.addEventListener('pointerleave', hide);
    row.addEventListener('click', hide);
  }

  document.body.append(cursor);
  window.addEventListener('blur', hide);
  window.addEventListener('scroll', () => {
    if (!active || !pointerPosition) return;
    const underPointer = document.elementFromPoint(pointerPosition.x, pointerPosition.y);
    if (!underPointer || !active.row.contains(underPointer)) hide();
  }, {passive:true});
  window.addEventListener('resize', hide);
  document.addEventListener('visibilitychange', hide);
  document.addEventListener('keydown', hide);
  finePointer.addEventListener('change', hide);
})();
