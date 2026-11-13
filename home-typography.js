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

  function positionCarton({ left, top, width, height }) {
    // Keep the carton and caption at the positions set by the original poster.
    context.font = '300 128px "Euclid Circular A", sans-serif';
    const original = originalWords.map(word => {
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
    layout.style.transform = 'none';
    const caption = note.getBoundingClientRect();
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
    if (shift > 0) layout.style.transform = `translateY(${shift}px)`;
  }

  function fit() {
    const canvas = frame.getBoundingClientRect();
    const { width, height } = canvas;
    if (width <= 0 || height <= 0) return;
    positionCarton(canvas);

    const margin = Math.max(6, Math.min(13, width * .024));
    const { width: artworkWidth, height: artworkHeight } = svg.viewBox.baseVal;
    const aspectRatio = artworkWidth / artworkHeight;
    let posterWidth = Math.min(width - 2 * margin, (height - 2 * margin) * aspectRatio);
    if (!stacked.matches) {
      const box = carton.getBoundingClientRect();
      const caption = note.getBoundingClientRect();
      const captionInset = Math.max(margin, caption.top - canvas.top);
      const cartonEdge = box.left - canvas.left + box.width * .048;
      // Keep the title in the left column while allowing the artwork to meet the carton.
      const columnWidth = (cartonEdge - margin + Math.min(42, width * .035)) * artworkWidth / 764;
      posterWidth = Math.min(posterWidth, columnWidth, Math.max(height * .25, height - 2 * captionInset) * aspectRatio);

      // Enlarge the whole artwork within the inset marked in the desktop reference.
      const currentInset = (height - posterWidth / aspectRatio) / 2;
      const targetInset = Math.min(currentInset, height * .033);
      posterWidth = Math.min(posterWidth * 1.075, width - 2 * margin, (height - 2 * targetInset) * aspectRatio);
    }
    const verticalSpace = height - posterWidth / aspectRatio;
    svg.style.left = `${margin}px`;
    svg.style.top = `${verticalSpace / 2}px`;
    svg.style.width = `${posterWidth}px`;
    svg.style.height = `${posterWidth / aspectRatio}px`;
  }

  function highlightSelection() {
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
        const transforms = row.transform.baseVal;
        const rowOffset = transforms.numberOfItems ? transforms.getItem(0).matrix.f : 0;
        rect.setAttribute('y', Number(band.getAttribute('y')) + rowOffset);
        rect.setAttribute('width', Math.min(svg.viewBox.baseVal.width, end) - Math.max(0, start));
        rect.setAttribute('height', band.getAttribute('height'));
        bands.push(rect);
      }
    }
    selectionBands.replaceChildren(...bands);
    selectionClip.replaceChildren(...bands.map(rect => rect.cloneNode()));
  }

  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(frame);
  else window.addEventListener('resize', fit, { passive: true });
  document.fonts?.ready.then(fit);
  document.addEventListener('selectionchange', highlightSelection);
})();
