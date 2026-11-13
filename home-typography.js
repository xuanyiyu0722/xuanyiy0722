/* Fit five equal-baseline rows using the actual Euclid font, without stretching glyphs. */
(() => {
  const svg = document.querySelector('.home-page .hero-poster');
  const frame = svg?.closest('h2');
  const lines = svg ? [...svg.querySelectorAll('text')] : [];
  const context = document.createElement('canvas').getContext('2d');
  if (!frame || lines.length !== 5 || !context) return;
  const referenceSize = 128;
  const counterData = {"units":1000,"shapes":{"a":["M167.5 111.5Q219 55 300.0 55.0Q381 55 432.5 111.5Q484 168 484.0 250.0Q484 332 432.5 388.5Q381 445 300.0 445.0Q219 445 167.5 388.5Q116 332 116.0 250.0Q116 168 167.5 111.5Z"],"d":["M167 111Q219 55 300 55Q381 55 432.5 111.5Q484 168 484 250Q484 332 432.5 388.5Q381 445 300 445Q219 445 167.5 388.5Q116 332 116 250Q116 168 167 111Z"],"e":["M293 445Q230 445 182.0 407.5Q134 370 121 291H457Q445 365 401.0 405.0Q357 445 293 445Z"],"o":["M168.5 111.5Q221 55 305.0 55.0Q389 55 441.5 111.5Q494 168 494.0 250.0Q494 332 441.5 388.5Q389 445 305.0 445.0Q221 445 168.5 388.5Q116 332 116.0 250.0Q116 168 168.5 111.5Z"]}};
  let countersReady = false;
  const paintCounters = fontSize => {
    lines.forEach(line => {
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
          const scale = fontSize / counterData.units;
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
    const { width, height } = frame.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    context.font = '300 128px "Euclid Circular A", sans-serif';
    const metrics = lines.map(line => {
      const text = line.textContent;
      const metric = context.measureText(text);
      return {
        width: metric.width - 2 * Math.max(0, [...text].length - 1),
        ascent: metric.actualBoundingBoxAscent,
        descent: metric.actualBoundingBoxDescent
      };
    });
    const padding = 2;
    const widest = Math.max(...metrics.map(metric => metric.width));
    const firstAscent = metrics[0].ascent;
    const lastDescent = Math.max(0, metrics[4].descent);
    const fontSize = Math.min(
      (width - padding * 2) * referenceSize / widest,
      (height - padding * 2) / ((firstAscent + lastDescent) / referenceSize + 4 * .82)
    );
    const scale = fontSize / referenceSize;
    const firstBaseline = padding + firstAscent * scale;
    const lastBaseline = height - padding - lastDescent * scale;
    const baselineStep = (lastBaseline - firstBaseline) / 4;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.fontSize = `${fontSize}px`;
    svg.style.letterSpacing = `${-fontSize / 64}px`;
    lines.forEach((line, index) => {
      line.setAttribute('x', padding);
      line.setAttribute('y', firstBaseline + index * baselineStep);
    });
    paintCounters(fontSize);
    // Keep the caption clear of the poster while it stays anchored to the carton.
    const layout = document.querySelector('.carton-layout');
    const note = layout?.querySelector('.hero-note');
    if (note) {
      layout.style.transform = 'none';
      const caption = note.getBoundingClientRect();
      const canvas = frame.getBoundingClientRect();
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
