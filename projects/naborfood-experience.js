(() => {
  const store = document.querySelector('[data-store-explorer]');
  if (store) {
    const camera = store.querySelector('.store-camera');
    const controls = [...document.querySelectorAll('[data-store-stage]')];
    const panels = [...store.querySelectorAll('[data-store-panel]')];
    const overviewPanel = store.querySelector('[data-store-overview-panel]');
    const reset = document.querySelector('[data-store-reset]');
    const play = document.querySelector('[data-store-play]');
    const previous = store.querySelector('[data-store-previous]');
    const next = store.querySelector('[data-store-next]');
    const progress = store.querySelector('.store-progress');
    const counter = store.querySelector('[data-store-counter]');
    const cameras = [[2.5,-16.5,1.18],[11,-4,1.18],[-1.5,-3,1.2],[-9,6.5,1.18],[6,18,1.18]];
    const names = ['Brand Intro','Base Flavor Tasting','Customization','Product Wall','Checkout'];
    let current = -1;
    let timer = null;

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
      play.textContent = 'Play tour';
      play.setAttribute('aria-pressed', 'false');
    };
    const select = index => {
      current = Math.max(-1, Math.min(4, index));
      const [x,y,scale] = current < 0 ? [0,0,1] : cameras[current];
      camera.style.setProperty('--camera-x', `${x}%`);
      camera.style.setProperty('--camera-y', `${y}%`);
      camera.style.setProperty('--camera-scale', scale);
      controls.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.storeStage) === current)));
      overviewPanel.hidden = current !== -1;
      panels.forEach((panel,index) => {
        panel.hidden = index !== current;
        panel.classList.remove('store-panel-enter');
        if (index === current) {
          void panel.offsetWidth;
          panel.classList.add('store-panel-enter');
        }
      });
      counter.textContent = current < 0 ? 'Overview' : `Stage ${current + 1} / 5`;
      progress.setAttribute('aria-valuenow', current + 1);
      progress.setAttribute('aria-valuetext', current < 0 ? 'Overview' : `${current + 1} of 5: ${names[current]}`);
      progress.firstElementChild.style.width = `${(current + 1) * 20}%`;
      reset.setAttribute('aria-pressed', String(current === -1));
      previous.disabled = current <= 0;
      next.disabled = current >= 4;
      next.textContent = current < 0 ? 'Start journey →' : 'Next →';
      store.dataset.currentStage = current;
    };
    controls.forEach(button => button.addEventListener('click', () => { stop(); select(Number(button.dataset.storeStage)); }));
    reset.addEventListener('click', () => { stop(); select(-1); });
    previous.addEventListener('click', () => { stop(); select(current - 1); });
    next.addEventListener('click', () => { stop(); select(current + 1); });
    play.addEventListener('click', () => {
      if (timer) { stop(); return; }
      if (current < 0 || current === 4) select(0);
      play.textContent = 'Pause tour';
      play.setAttribute('aria-pressed', 'true');
      timer = window.setInterval(() => {
        if (current >= 4) { stop(); return; }
        select(current + 1);
      }, 3000);
    });
    // Keep an explicitly started tour running when its visual is below the fold.
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    window.addEventListener('portfolio:viewer-open', stop);
    select(-1);
  }

  const viewer = document.querySelector('#image-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;
  const picture = viewer.querySelector('img');
  const title = viewer.querySelector('.image-viewer-title');
  const scroller = viewer.querySelector('.image-viewer-scroll');
  const output = viewer.querySelector('output');
  const minus = viewer.querySelector('[data-viewer-minus]');
  const plus = viewer.querySelector('[data-viewer-plus]');
  let zoom = 1;
  let opener = null;
  let drag = null;
  const fitWidth = () => {
    const padding = window.getComputedStyle(scroller);
    const width = scroller.clientWidth - parseFloat(padding.paddingLeft) - parseFloat(padding.paddingRight);
    const height = scroller.clientHeight - parseFloat(padding.paddingTop) - parseFloat(padding.paddingBottom);
    return picture.naturalWidth && picture.naturalHeight ? Math.min(width, height * picture.naturalWidth / picture.naturalHeight) : width;
  };
  const setZoom = value => {
    const bounds = scroller.getBoundingClientRect();
    const before = picture.getBoundingClientRect();
    let cx = (bounds.left + scroller.clientWidth / 2 - before.left) / before.width;
    let cy = (bounds.top + scroller.clientHeight / 2 - before.top) / before.height;
    if (!Number.isFinite(cx) || cx < 0 || cx > 1) cx = .5;
    if (!Number.isFinite(cy) || cy < 0 || cy > 1) cy = .5;
    zoom = Math.max(.5, Math.min(6, value));
    picture.style.width = `${fitWidth() * zoom}px`;
    const after = picture.getBoundingClientRect();
    scroller.scrollLeft += after.left + cx * after.width - bounds.left - scroller.clientWidth / 2;
    scroller.scrollTop += after.top + cy * after.height - bounds.top - scroller.clientHeight / 2;
    scroller.classList.toggle('is-zoomed', zoom > 1);
    output.textContent = `${Math.round(zoom * 100)}%`;
    minus.disabled = zoom === .5;
    plus.disabled = zoom === 6;
  };
  picture.addEventListener('load', () => { setZoom(1); scroller.scrollTop = 0; scroller.scrollLeft = 0; });
  window.addEventListener('resize', () => { if (viewer.open) setZoom(zoom); });
  document.querySelectorAll('a[data-image-viewer]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    opener = link;
    picture.src = link.href;
    picture.alt = link.dataset.imageViewer || link.querySelector('img')?.alt || 'Project image';
    title.textContent = link.dataset.imageViewer || 'Project image';
    document.body.classList.add('viewer-open');
    viewer.showModal();
    zoom = 1;
    setZoom(1);
    scroller.scrollTop = 0;
    scroller.scrollLeft = 0;
    window.dispatchEvent(new CustomEvent('portfolio:viewer-open'));
  }));
  viewer.querySelector('[data-viewer-close]').addEventListener('click', () => viewer.close());
  viewer.querySelector('[data-viewer-reset]').addEventListener('click', () => { setZoom(1); scroller.scrollTop = 0; scroller.scrollLeft = 0; });
  minus.addEventListener('click', () => setZoom(zoom - .25));
  plus.addEventListener('click', () => setZoom(zoom + .25));
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => {
    document.body.classList.remove('viewer-open');
    scroller.classList.remove('is-dragging');
    drag = null;
    opener?.focus({preventScroll:true});
  });
  scroller.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || zoom <= 1) return;
    drag = {x:event.clientX,y:event.clientY,left:scroller.scrollLeft,top:scroller.scrollTop};
    scroller.setPointerCapture(event.pointerId);
    scroller.classList.add('is-dragging');
  });
  scroller.addEventListener('pointermove', event => {
    if (!drag) return;
    scroller.scrollLeft = drag.left - (event.clientX - drag.x);
    scroller.scrollTop = drag.top - (event.clientY - drag.y);
  });
  const endDrag = () => { drag = null; scroller.classList.remove('is-dragging'); };
  scroller.addEventListener('pointerup', endDrag);
  scroller.addEventListener('pointercancel', endDrag);
})();
