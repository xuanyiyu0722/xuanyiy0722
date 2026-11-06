/* Reuse the portfolio image viewer; artwork remains original. */
(() => {
  const viewer = document.querySelector('#image-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;
  const raster = viewer.querySelector('img');
  let picture = raster;
  let cropSize = null;
  let nativeFit = false;
  const caption = viewer.querySelector('[data-viewer-caption-output]');
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
    const naturalWidth = cropSize ? cropSize[0] : raster.naturalWidth;
    const naturalHeight = cropSize ? cropSize[1] : raster.naturalHeight;
    return naturalWidth && naturalHeight ? Math.min(width, height * naturalWidth / naturalHeight, nativeFit ? naturalWidth : Infinity) : width;
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
  raster.addEventListener('load', () => {
    if (picture !== raster) return;
    setZoom(1); scroller.scrollTop = 0; scroller.scrollLeft = 0;
  });
  window.addEventListener('resize', () => { if (viewer.open) setZoom(zoom); });
  document.querySelectorAll('a[data-image-viewer]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    opener = link;
    nativeFit = link.hasAttribute('data-viewer-native-fit');
    scroller.querySelector('.ep-viewer-art')?.remove();
    const crop = (link.dataset.viewerViewbox || '').split(/\s+/).map(Number);
    const size = (link.dataset.viewerSize || '').split(/\s+/).map(Number);
    const hasCrop = crop.length === 4 && crop.every(Number.isFinite) && crop[2] > 0 && crop[3] > 0
      && size.length === 2 && size.every(value => Number.isFinite(value) && value > 0);
    const inline = link.hasAttribute('data-viewer-inline') ? link.querySelector('svg') : null;
    raster.hidden = hasCrop || !!inline;
    cropSize = hasCrop ? [crop[2], crop[3]] : null;
    if (inline) {
      picture = inline.cloneNode(true);
      picture.classList.add('ep-viewer-art');
      picture.querySelectorAll('[id]').forEach(node => {node.id = 'viewer-' + node.id;});
      picture.querySelectorAll('[clip-path],[filter]').forEach(node => {
        for (const attribute of ['clip-path', 'filter']) {
          const value = node.getAttribute(attribute);
          if (value) node.setAttribute(attribute, value.replace(/url\(#([^)]*)\)/g, 'url(#viewer-$1)'));
        }
      });
      scroller.append(picture);
    } else if (hasCrop) {
      const ns = 'http://www.w3.org/2000/svg';
      picture = document.createElementNS(ns, 'svg');
      picture.classList.add('ep-viewer-art');
      picture.setAttribute('viewBox', crop.join(' '));
      picture.setAttribute('width', crop[2]);
      picture.setAttribute('height', crop[3]);
      picture.setAttribute('role', 'img');
      picture.setAttribute('aria-label', link.dataset.imageViewer || 'Project image');
      const artwork = document.createElementNS(ns, 'image');
      artwork.setAttribute('href', link.href);
      artwork.setAttribute('width', size[0]);
      artwork.setAttribute('height', size[1]);
      picture.append(artwork);
      scroller.append(picture);
    } else {
      picture = raster;
      raster.src = link.href;
      raster.alt = link.dataset.imageViewer || link.querySelector('img')?.alt || 'Project image';
    }
    title.textContent = link.dataset.imageViewer || 'Project image';
    if(caption){caption.textContent=link.dataset.viewerCaption||'';caption.hidden=!link.dataset.viewerCaption;}
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
