/* Fit the headline around the existing carton and caption. */
(() => {
  const svg = document.querySelector('.home-page .hero-poster');
  const frame = svg?.closest('h2');
  const lines = svg ? [...svg.querySelectorAll('.hero-poster-row > text')] : [];
  const carton = document.querySelector('#assetCarton');
  const layout = carton?.closest('.carton-layout');
  const note = layout?.querySelector('.hero-note');
  const context = document.createElement('canvas').getContext('2d');
  if (!frame || lines.length !== 5 || !layout || !note || !context) return;

  const referenceSize = 128;
  const originalWords = ['There’s', 'more', 'under', 'the', 'EGGshell.'];
  const stacked = matchMedia('(max-width: 560px)');
  // Leftmost opaque edge of carton.webp in successive vertical bands.
  const cartonContour = [[.09, .106], [.16, .07], [.29, .065], [.39, .049], [.52, .032], [.73, .06], [.80, .088], [.89, 1]];

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

  function measure(line) {
    const { fontStyle, fontWeight, fontFamily, letterSpacing, fontSize } = getComputedStyle(line);
    context.font = `${fontStyle} ${fontWeight} ${referenceSize}px ${fontFamily}`;
    const spacing = (parseFloat(letterSpacing) || 0) * referenceSize / parseFloat(fontSize);
    const ink = context.measureText(line.textContent);
    return {
      left: -ink.actualBoundingBoxLeft,
      right: ink.actualBoundingBoxRight + spacing * (line.textContent.length - 1),
      ascent: ink.actualBoundingBoxAscent,
      descent: ink.actualBoundingBoxDescent
    };
  }

  function place(line, ink, { x, top, width, height, align = 0 }) {
    const inkWidth = ink.right - ink.left;
    const inkHeight = ink.ascent + ink.descent;
    const scale = Math.min(width / inkWidth, height / inkHeight);
    line.parentElement.style.fontSize = `${referenceSize * scale}px`;
    const usedHeight = inkHeight * scale;
    const inkTop = top + (height - usedHeight) * align;
    line.setAttribute('x', x - ink.left * scale);
    line.setAttribute('y', inkTop + ink.ascent * scale);
    return inkTop + usedHeight;
  }

  function fit() {
    const canvas = frame.getBoundingClientRect();
    const { width, height } = canvas;
    if (width <= 0 || height <= 0) return;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    positionCarton(canvas);

    const ink = lines.map(measure);
    const margin = Math.max(6, Math.min(13, width * .011));
    const [there, more, beneath, the, eggshell] = lines;
    const [thereInk, moreInk, beneathInk, theInk, eggshellInk] = ink;
    if (stacked.matches) {
      const full = width - 2 * margin;
      const gap = Math.max(3, height * .007);
      const usableHeight = height - 2 * margin - 4 * gap;
      const shares = [.21, .20, .21, .18, .20];
      let top = margin;
      lines.forEach((line, i) => {
        const band = usableHeight * shares[i];
        place(line, ink[i], { x: margin, top, width: full, height: band, align: i === lines.length - 1 ? 1 : .5 });
        top += band + gap;
      });
      return;
    }

    const box = carton.getBoundingClientRect();
    const caption = note.getBoundingClientRect();
    const cartonTop = box.top - canvas.top;
    const imageBottom = cartonTop + box.height * .89;
    const full = width - 2 * margin;

    function room(top, bottom) {
      const low = (top - cartonTop) / box.height;
      const high = (bottom - cartonTop) / box.height;
      let right = width - margin;
      cartonContour.slice(0, -1).forEach(([start, edge], i) => {
        if (high > start && low < cartonContour[i + 1][0]) {
          right = Math.min(right, box.left - canvas.left + box.width * edge - 6);
        }
      });
      if (bottom > caption.top - canvas.top - 6 && top < caption.bottom - canvas.top + 6) {
        right = Math.min(right, caption.left - canvas.left - 7);
      }
      return right - margin;
    }

    const titleTop = margin;
    const titleHeight = Math.min(height * .25, Math.max(height * .12, cartonTop + box.height * .09 - titleTop - 3));
    const titleWidth = room(titleTop, titleTop + titleHeight);
    const headingBottom = place(there, thereInk, { x: margin, top: titleTop, width: titleWidth, height: titleHeight });

    const bottom = height - margin;
    const footerTop = Math.max(height * .69, imageBottom + 2);
    const fullFooter = bottom - footerTop >= Math.max(46, height * .08);
    const footerStart = fullFooter ? footerTop : height * .81;
    const middleTop = headingBottom + Math.max(5, height * .009);
    const middle = footerStart - middleTop;
    function middleLine(line, bounds, start, end, align) {
      const top = middleTop + middle * start;
      const lineHeight = middle * (end - start);
      place(line, bounds, { x: margin, top, width: room(top, top + lineHeight), height: lineHeight, align });
    }
    middleLine(more, moreInk, 0, .30, .62);
    middleLine(beneath, beneathInk, .31, .56, .50);
    middleLine(the, theInk, .57, .99, .68);
    place(eggshell, eggshellInk, {
      x: margin, top: footerStart, width: fullFooter ? full : room(footerStart, bottom),
      height: bottom - footerStart, align: 1
    });
  }

  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(frame);
  else window.addEventListener('resize', fit, { passive: true });
  document.fonts?.ready.then(fit);
})();
