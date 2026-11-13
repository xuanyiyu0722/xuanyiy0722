/* Fit the visible headline rows, then adjust the lines beside the carton. */
(() => {
  const svg = document.querySelector('.home-page .hero-poster');
  const frame = svg?.closest('h2');
  const posterLines = svg ? [...svg.querySelectorAll('.hero-poster-row text')] : [];
  const carton = document.querySelector('#assetCarton');
  const layout = carton?.closest('.carton-layout');
  const note = layout?.querySelector('.hero-note');
  const context = document.createElement('canvas').getContext('2d');
  if (!frame || !posterLines.length || !context) return;
  const referenceSize = 128;
  const counterData = {"units":1000,"shapes":{"a":["M167.5 111.5Q219 55 300.0 55.0Q381 55 432.5 111.5Q484 168 484.0 250.0Q484 332 432.5 388.5Q381 445 300.0 445.0Q219 445 167.5 388.5Q116 332 116.0 250.0Q116 168 167.5 111.5Z"],"b":["M201.5 111.5Q253 55 334.0 55.0Q415 55 466.5 111.5Q518 168 518.0 250.0Q518 332 466.5 388.5Q415 445 334.0 445.0Q253 445 201.5 388.5Q150 332 150.0 250.0Q150 168 201.5 111.5Z"],"e":["M293 445Q230 445 182.0 407.5Q134 370 121 291H457Q445 365 401.0 405.0Q357 445 293 445Z"],"o":["M168.5 111.5Q221 55 305.0 55.0Q389 55 441.5 111.5Q494 168 494.0 250.0Q494 332 441.5 388.5Q389 445 305.0 445.0Q221 445 168.5 388.5Q116 332 116.0 250.0Q116 168 168.5 111.5Z"]}};
  let countersReady = false;
  const paintCounters = (lines, metrics) => {
    lines.forEach((line, lineIndex) => {
      const layer = line.parentElement.querySelector('.hero-counter-layer');
      if (!layer) return;
      layer.replaceChildren();
      if (!countersReady || !line.getStartPositionOfChar) return;
      let index = 0;
      for (const character of line.textContent) {
        const shapes = counterData.shapes[character];
        if (shapes) {
          const start = line.getStartPositionOfChar(index);
          const group = document.createElementNS('http://www.w3.org/2000/svg','g');
          const scale = metrics[lineIndex].fontSize / counterData.units;
          group.setAttribute('transform', `translate(${start.x} ${start.y}) scale(${scale} ${-scale})`);
          shapes.forEach(outline => {
            const path = document.createElementNS('http://www.w3.org/2000/svg','path');
            path.setAttribute('d', outline);
            group.append(path);
          });
          layer.append(group);
        }
        index += character.length;
      }
    });
  };

  const fit = () => {
    const canvas = frame.getBoundingClientRect();
    const { width, height } = canvas;
    if (width <= 0 || height <= 0) return;
    const lines = posterLines.filter(line => line.getClientRects().length);
    const intervals = lines.length - 1;
    if (intervals < 1) return;
    context.font = '300 128px "Euclid Circular A", sans-serif';
    const metrics = lines.map(line => {
      const text = line.textContent;
      const metric = context.measureText(text);
      return {
        width: metric.width - 2 * Math.max(0, [...text].length - 1),
        inkRight: metric.actualBoundingBoxRight / referenceSize,
        letterGaps: Math.max(0, [...text].length - 1),
        ascent: metric.actualBoundingBoxAscent,
        descent: metric.actualBoundingBoxDescent
      };
    });
    const padding = 2;
    const widest = Math.max(...metrics.map(metric => metric.width));
    const firstAscent = metrics[0].ascent;
    const lastDescent = Math.max(0, metrics.at(-1).descent);
    const fontSize = Math.min(
      (width - padding * 2) * referenceSize / widest,
      (height - padding * 2) / ((firstAscent + lastDescent) / referenceSize + intervals * .82)
    );
    const scale = fontSize / referenceSize;
    const firstBaseline = padding + firstAscent * scale;
    const lastBaseline = height - padding - lastDescent * scale;
    const baselineStep = (lastBaseline - firstBaseline) / intervals;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.fontSize = `${fontSize}px`;
    svg.style.letterSpacing = `${-fontSize / 64}px`;
    if (layout) layout.style.transform = 'none';
    const cartonBox = carton?.getBoundingClientRect();
    lines.forEach((line, index) => {
      const baseline = firstBaseline + index * baselineStep;
      const metric = metrics[index];
      metric.fontSize = fontSize;
      line.setAttribute('x', padding);
      line.setAttribute('y', baseline);
      const word = line.closest('.poster-condensed-word');
      if (!word) return;

      const bottom = canvas.top + baseline + metric.descent * scale;
      const top = canvas.top + baseline - metric.ascent * scale;
      const naturalWidth = word.hasAttribute('data-natural-width');
      let glyphWidth = naturalWidth ? 1 : .96;
      let tracking = naturalWidth ? -1 / 64 : -.032;
      let wordSize = fontSize;
      if (cartonBox && cartonBox.left > canvas.left + padding
        && bottom > cartonBox.top + cartonBox.height * .09
        && top < cartonBox.top + cartonBox.height * .89) {
        // Use the visible left edge of the front-facing artwork, including its transparent margin.
        const depth = (bottom - cartonBox.top) / cartonBox.height;
        const inset = Math.max(.033, .101 - depth * .106);
        const available = cartonBox.left + cartonBox.width * inset - canvas.left - padding - 5;
        if (!naturalWidth) {
          const isMore = line.textContent === 'more';
          // The gap after r in “more” closes sooner than the other lines' gaps.
          const tightest = isMore ? -.048 : -.062;
          glyphWidth = isMore ? .92 : .9;
          tracking = Math.max(tightest, Math.min(tracking,
            (available / (fontSize * glyphWidth) - metric.inkRight) / metric.letterGaps));
        }
        wordSize = Math.min(fontSize, available / (glyphWidth * (metric.inkRight + tracking * metric.letterGaps)));
      }
      const wordScale = wordSize / fontSize;
      const center = (top + bottom) / 2 - canvas.top;
      line.style.fontSize = `${wordSize}px`;
      line.style.letterSpacing = `${tracking * wordSize}px`;
      line.setAttribute('y', center + (metric.ascent - metric.descent) * wordSize / referenceSize / 2);
      if (!naturalWidth) {
        word.setAttribute('transform', `translate(${padding} 0) scale(${glyphWidth} 1) translate(${-padding} 0)`);
      }
      metric.fontSize = wordSize;
      metric.width = (metric.inkRight + tracking * metric.letterGaps) * referenceSize * glyphWidth * wordScale;
      const trim = (metric.ascent + metric.descent) * (1 - wordScale) / 2;
      metric.ascent -= trim;
      metric.descent -= trim;
    });
    paintCounters(lines, metrics);
    // Keep the caption clear of the poster while it stays anchored to the carton.
    if (note) {
      const caption = note.getBoundingClientRect();
      let shift = 0;
      metrics.forEach((metric, index) => {
        const baseline = canvas.top + firstBaseline + index * baselineStep;
        const top = baseline - metric.ascent * scale;
        const bottom = baseline + metric.descent * scale;
        const left = canvas.left + padding;
        const right = left + metric.width * scale;
        if (caption.left < right && caption.right > left
          && caption.top + shift < bottom + 12 && caption.bottom + shift > top - 12) {
          shift = Math.max(shift, bottom + 12 - caption.top);
        }
      });
      if (shift > 0) layout.style.transform = `translateY(${shift}px)`;
    }
  };
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(frame);
  else window.addEventListener('resize', fit, { passive: true });
  document.fonts?.load('300 128px "Euclid Circular A"').then(fonts => { countersReady = fonts.length > 0; fit(); }, fit);
})();
