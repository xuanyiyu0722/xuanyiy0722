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
    line.setAttribute('x', x + (width - inkWidth * scale) * align - ink.left * scale);
    line.setAttribute('y', top + (height - inkHeight * scale) / 2 + ink.ascent * scale);
    return top + (height + inkHeight * scale) / 2;
  }

  function fit() {
    const canvas = frame.getBoundingClientRect();
    const { width, height } = canvas;
    if (width <= 0 || height <= 0) return;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    positionCarton(canvas);

    const ink = lines.map(measure);
    const margin = Math.max(10, Math.min(26, width * .018));
    const [there, more, beneath, the, eggshell] = lines;
    const [thereInk, moreInk, beneathInk, theInk, eggshellInk] = ink;
    if (stacked.matches) {
      const full = width - 2 * margin;
      place(there, thereInk, { x: margin, top: height * .04, width: full, height: height * .17 });
      place(more, moreInk, { x: margin, top: height * .23, width: full * .89, height: height * .16, align: 1 });
      place(beneath, beneathInk, { x: margin, top: height * .42, width: full, height: height * .16 });
      place(the, theInk, { x: margin, top: height * .60, width: full * .83, height: height * .11, align: 1 });
      place(eggshell, eggshellInk, { x: margin, top: height * .75, width: full, height: height * .21 });
      return;
    }

    const box = carton.getBoundingClientRect();
    const caption = note.getBoundingClientRect();
    // The artwork includes transparent padding around the front-facing carton.
    const imageTop = box.top - canvas.top + box.height * .09;
    const imageBottom = box.top - canvas.top + box.height * .89;
    const imageLeft = box.left - canvas.left + box.width * .03;
    const leftColumn = imageLeft - margin - 9;
    const titleTop = height * .045;
    const titleHeight = Math.min(height * .19, Math.max(height * .10, imageTop - titleTop - 12));
    const titleBottom = titleTop + titleHeight;
    let titleWidth = width * .84 - margin;
    if (titleBottom > imageTop) titleWidth = Math.min(titleWidth, leftColumn);
    if (titleBottom > caption.top - canvas.top - 8 && titleTop < caption.bottom - canvas.top + 8) {
      titleWidth = Math.min(titleWidth, caption.left - canvas.left - margin - 9);
    }
    const headingBottom = place(there, thereInk, { x: margin, top: titleTop, width: titleWidth, height: titleHeight });

    const bottom = height - margin;
    const footerTop = Math.max(height * .75, imageBottom + 10);
    const fullFooter = bottom - footerTop >= Math.max(68, height * .115);
    const footerStart = fullFooter ? footerTop : height * .79;
    const middleTop = Math.max(height * .265, headingBottom + 13);
    const middle = footerStart - middleTop;
    place(more, moreInk, { x: margin, top: middleTop, width: leftColumn * .88, height: middle * .31, align: .9 });
    place(beneath, beneathInk, { x: margin, top: middleTop + middle * .37, width: leftColumn, height: middle * .30 });
    place(the, theInk, { x: margin, top: middleTop + middle * .70, width: leftColumn * .84, height: middle * .16, align: 1 });
    place(eggshell, eggshellInk, {
      x: margin, top: footerStart, width: fullFooter ? width * .89 - margin : leftColumn,
      height: bottom - footerStart
    });
  }

  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(frame);
  else window.addEventListener('resize', fit, { passive: true });
  document.fonts?.ready.then(fit);
})();
