/* Reuse the portfolio image viewer; artwork remains original. */
(() => {
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

(() => {
  const scroll = document.querySelector('#kimono-scroll');
  if (!scroll) return;
  const previous = document.querySelector('[data-kimono-prev]');
  const next = document.querySelector('[data-kimono-next]');
  const progress = document.querySelector('.kimono-progress i');
  const controls = document.querySelector('.kimono-controls');
  const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  const update = () => {
    const max = scroll.scrollWidth - scroll.clientWidth;
    controls.hidden = max <= 1;
    scroll.tabIndex = max > 1 ? 0 : -1;
    previous.disabled = scroll.scrollLeft <= 1;
    next.disabled = scroll.scrollLeft >= max - 1;
    progress.style.width = `${max > 0 ? (scroll.scrollLeft / max) * 100 : 100}%`;
  };
  const move = direction => scroll.scrollBy({left:direction * (matchMedia('(max-width:640px)').matches ? 330 : 320),behavior:motion()});
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  scroll.addEventListener('scroll', update, {passive:true});
  scroll.addEventListener('keydown', event => {
    if (event.target !== scroll) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();move(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();scroll.scrollTo({left:event.key==='Home'?0:scroll.scrollWidth,behavior:motion()});
    }
  });
  new ResizeObserver(update).observe(scroll);
  update();
})();
