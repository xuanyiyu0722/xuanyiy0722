/* Size the supplied headline artwork beside the existing carton. */
(() => {
  const svg = document.querySelector('.home-page .hero-poster');
  const frame = svg?.closest('h2');
  const carton = document.querySelector('#assetCarton');
  const layout = carton?.closest('.carton-layout');
  const note = layout?.querySelector('.hero-note');
  const context = document.createElement('canvas').getContext('2d');
  if (!frame || !layout || !note || !context) return;

  const referenceSize = 128;
  const originalWords = ['There’s', 'more', 'under', 'the', 'EGGshell.'];
  const stacked = matchMedia('(max-width: 560px)');
  const selectionRows = [...svg.querySelectorAll('.poster-selectable text')];
  const selectionBands = svg.querySelector('.poster-highlight-bands');
  const selectionClip = svg.querySelector('#headline-selection');
  let metrics;
  let layoutShift = 0;
  let fitFrame = 0;
  let selectionFrame = 0;
  let suspended = false;
  let lastBands = '';

  function positionCarton({ left, top, width, height }, caption) {
    // Keep the carton and caption at the positions set by the original poster.
    context.font = '300 128px "Euclid Circular A", sans-serif';
    const original = metrics ??= originalWords.map(word => {
      const ink = context.measureText(word);
      return {
        width: ink.width - 2 * (word.length - 1),
        ascent: ink.actualBoundingBoxAscent,
        descent: ink.actualBoundingBoxDescent
      };
    });
    const firstAscent = original[0].ascent;
    const lastDescent = Math.max(0, original.at(-1).descent);
    const scale = Math.min(
      (width - 4) / Math.max(...original.map(line => line.width)),
      (height - 4) / (firstAscent + lastDescent + 4 * .82 * referenceSize)
    );
    const first = 2 + firstAscent * scale;
    const last = height - 2 - lastDescent * scale;
    let shift = 0;
    original.forEach((line, index) => {
      const baseline = top + first + index * (last - first) / 4;
      const inkTop = baseline - line.ascent * scale;
      const inkBottom = baseline + line.descent * scale;
      if (caption.left < left + 2 + line.width * scale && caption.right > left + 2
        && caption.top + shift < inkBottom + 12 && caption.bottom + shift > inkTop - 12) {
        shift = Math.max(shift, inkBottom + 12 - caption.top);
      }
    });
    return shift;
  }

  function fit() {
    fitFrame = 0;
    if (suspended) return;
    const canvas = frame.getBoundingClientRect();
    const { width, height } = canvas;
    if (width <= 0 || height <= 0) return;
    // Measure before writing. Remove our previous translation mathematically,
    // so recalculating the caption never needs a forced layout after a reset.
    const box = carton.getBoundingClientRect();
    const captionBox = note.getBoundingClientRect();
    const caption = { left:captionBox.left, right:captionBox.right,
      top:captionBox.top - layoutShift, bottom:captionBox.bottom - layoutShift };
    const shift = positionCarton(canvas, caption);

    const margin = Math.max(6, Math.min(13, width * .024));
    const { width: artworkWidth, height: artworkHeight } = svg.viewBox.baseVal;
    const aspectRatio = artworkWidth / artworkHeight;
    let posterWidth = Math.min(width - 2 * margin, (height - 2 * margin) * aspectRatio);
    if (!stacked.matches) {
      const captionInset = Math.max(margin, caption.top + shift - canvas.top);
      const cartonEdge = box.left - canvas.left + box.width * .048;
      // Keep the title in the left column while allowing the artwork to meet the carton.
      const columnWidth = (cartonEdge - margin + Math.min(42, width * .035)) * artworkWidth / 699;
      posterWidth = Math.min(posterWidth, columnWidth, Math.max(height * .25, height - 2 * captionInset) * aspectRatio);

      // Enlarge the whole artwork within the inset marked in the desktop reference.
      const currentInset = (height - posterWidth / aspectRatio) / 2;
      const targetInset = Math.min(currentInset, height * .033);
      posterWidth = Math.min(posterWidth * 1.075, width - 2 * margin, (height - 2 * targetInset) * aspectRatio);
    }
    const verticalSpace = height - posterWidth / aspectRatio;
    layoutShift = shift;
    setStyle(layout, 'transform', shift > 0 ? `translateY(${shift}px)` : 'none');
    setStyle(svg, 'left', `${margin}px`);
    setStyle(svg, 'top', `${verticalSpace / 2}px`);
    setStyle(svg, 'width', `${posterWidth}px`);
    setStyle(svg, 'height', `${posterWidth / aspectRatio}px`);
  }
  function setStyle(element, name, value) {
    if (element.style[name] !== value) element.style[name] = value;
  }
  const scheduleFit = () => { if (!suspended && !fitFrame) fitFrame = requestAnimationFrame(fit); };

  function highlightSelection() {
    selectionFrame = 0;
    const selection = window.getSelection();
    const bands = [];
    if (selection?.rangeCount && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      for (const row of selectionRows) {
        if (!range.intersectsNode(row)) continue;
        // Read the row's band and the exact character offsets of the native selection.
        const clip = svg.querySelector(row.getAttribute('clip-path').slice(4, -1));
        const band = clip.firstElementChild;
        let offset = 0;
        let start = Infinity;
        let end = -Infinity;
        const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (range.intersectsNode(node)) {
            const first = range.startContainer === node ? range.startOffset : 0;
            const last = range.endContainer === node ? range.endOffset : node.length;
            if (last > first) {
              start = Math.min(start, row.getStartPositionOfChar(offset + first).x);
              end = Math.max(end, row.getEndPositionOfChar(offset + last - 1).x);
            }
          }
          offset += node.length;
        }
        if (end <= start) continue;
        const rect = document.createElementNS(svg.namespaceURI, 'rect');
        rect.setAttribute('x', Math.max(0, start));
        rect.setAttribute('y', band.getAttribute('y') || '0');
        rect.setAttribute('width', Math.min(svg.viewBox.baseVal.width, end) - Math.max(0, start));
        rect.setAttribute('height', band.getAttribute('height'));
        bands.push(rect);
      }
    }
    const signature = bands.map(rect => ['x','y','width','height'].map(name => rect.getAttribute(name)).join(',')).join(';');
    if (signature === lastBands) return;
    lastBands = signature;
    selectionBands.replaceChildren(...bands);
    selectionClip.replaceChildren(...bands.map(rect => rect.cloneNode()));
  }

  fit();
  if ('ResizeObserver' in window) new ResizeObserver(scheduleFit).observe(frame);
  else window.addEventListener('resize', scheduleFit, { passive: true });
  const fontsChanged = () => { metrics = undefined; scheduleFit(); };
  document.fonts?.ready.then(fontsChanged);
  document.fonts?.addEventListener('loadingdone', fontsChanged);
  document.addEventListener('selectionchange', () => {
    if (!suspended && !selectionFrame) selectionFrame = requestAnimationFrame(highlightSelection);
  });
  window.addEventListener('pagehide', () => {
    suspended = true;
    cancelAnimationFrame(fitFrame);
    cancelAnimationFrame(selectionFrame);
    fitFrame = selectionFrame = 0;
  });
  window.addEventListener('pageshow', () => { suspended = false; scheduleFit(); });
})();
