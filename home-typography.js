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
    const aspectRatio = 1136 / 1307;
    let posterWidth = Math.min(width - 2 * margin, (height - 2 * margin) * aspectRatio);
    if (!stacked.matches) {
      const box = carton.getBoundingClientRect();
      const cartonEdge = box.left - canvas.left + box.width * .048;
      const overlap = Math.min(74, width * .065);
      // The right tip of “below” is 67.2% across the supplied artwork.
      posterWidth = Math.min(posterWidth, (cartonEdge - margin + overlap) / .672);
    }
    const verticalSpace = height - posterWidth / aspectRatio;
    svg.style.left = `${margin}px`;
    svg.style.top = `${Math.max(margin, verticalSpace * .67)}px`;
    svg.style.width = `${posterWidth}px`;
    svg.style.height = `${posterWidth / aspectRatio}px`;
  }

  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(frame);
  else window.addEventListener('resize', fit, { passive: true });
  document.fonts?.ready.then(fit);
})();
