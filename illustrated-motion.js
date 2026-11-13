/* v61: a larger carton entrance, slower headline, and research-only counters. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const canAnimate = typeof Element.prototype.animate === 'function';
  let finishIntro = () => root.classList.remove('egg-intro-pending');

  async function homeEntrance() {
    if (!document.body.classList.contains('home-page')) return;
    if (reduce.matches || !canAnimate || scrollY > 80) { finishIntro(); return; }
    const target = document.querySelector('#assetCarton');
    if (!target) { finishIntro(); return; }
    const box = target.getBoundingClientRect();
    const veil = document.createElement('div');
    veil.className = 'egg-intro-veil';
    veil.setAttribute('aria-hidden', 'true');
    const actor = document.createElement('div');
    actor.className = 'egg-intro-actor';
    actor.setAttribute('aria-hidden', 'true');
    actor.inert = true;
    Object.assign(actor.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
    const drawing = target.cloneNode(true);
    drawing.removeAttribute('id');
    drawing.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    drawing.querySelectorAll('button,a').forEach(node => { node.tabIndex = -1; });
    actor.append(drawing);
    document.body.append(veil, actor);
    const animations = [];
    let ended = false;
    let timeout;
    const skipKeys = ['Escape','Enter',' ','Tab','ArrowDown','PageDown','End'];
    const skip = event => {
      if (event.type !== 'keydown' || skipKeys.includes(event.key)) finishIntro();
    };
    finishIntro = () => {
      if (ended) return;
      ended = true;
      clearTimeout(timeout);
      animations.forEach(animation => animation.cancel());
      veil.remove();
      actor.remove();
      root.classList.remove('egg-intro-pending');
      root.dataset.eggEntrance = 'complete';
      for (const type of ['wheel','touchstart','pointerdown','keydown','resize']) window.removeEventListener(type, skip);
    };
    try {
      const dx = innerWidth / 2 - box.left - box.width / 2;
      const dy = innerHeight / 2 - box.top - box.height / 2;
      const scale = Math.min(innerWidth * 1.04, innerHeight * 1.10 * box.width / box.height) / box.width;
      const centered = `translate(${dx}px,${dy}px) scale(${scale})`;
      actor.style.transform = centered;
      root.dataset.eggEntrance = 'loading';
      for (const type of ['wheel','touchstart','pointerdown','keydown','resize']) window.addEventListener(type, skip, { passive: type !== 'keydown' });
      timeout = setTimeout(finishIntro, 5500);
      // The opening uses every original carton/egg layer. Decode them first so
      // a slow image load cannot turn the opening into an empty moving box.
      let decodeTimeout;
      await Promise.race([
        Promise.all([...target.querySelectorAll('img')].map(image =>
          image.decode ? image.decode().catch(() => {}) : Promise.resolve())),
        new Promise(resolve => { decodeTimeout = setTimeout(resolve, 1600); })
      ]);
      clearTimeout(decodeTimeout);
      if (ended) return;
      const movement = actor.animate([
        { transform: centered, opacity: 0, offset: 0, easing: 'ease-out' },
        { transform: centered, opacity: 1, offset: .12 },
        { transform: centered, opacity: 1, offset: .26, easing: 'cubic-bezier(.76,0,.18,1)' },
        { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 1 }
      ], { duration: 1680, fill: 'both' });
      animations.push(movement);
      movement.finished.then(() => {
        if (ended) return;
        actor.remove();
        root.dataset.eggEntrance = 'settling';
      }).catch(() => {});
      animations.push(veil.animate([{ opacity: 1 },{ opacity: 0 }], {
        duration: 720, delay: 680, easing: 'ease-in-out', fill: 'both'
      }));

      const rows = new Map();
      document.querySelectorAll('.hero-poster .hero-poster-row').forEach(line => {
        const y = line.querySelector('text').getAttribute('y');
        if (!rows.has(y)) rows.set(y, rows.size);
        line.classList.add('intro-copy-line');
        animations.push(line.animate([
          { opacity: 0, transform: 'translateY(24px)', filter: 'blur(3px)' },
          { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }
        ], { duration: 1150, delay: 1050 + rows.get(y) * 150, easing: 'cubic-bezier(.22,.72,.18,1)', fill: 'both' }));
      });
      const note = document.querySelector('.hero-note');
      if (note) animations.push(note.animate([{ opacity: 0 },{ opacity: 1 }], {
        duration: 750, delay: 1230, easing: 'ease-out', fill: 'both'
      }));
      root.dataset.eggEntrance = 'playing';
      root.classList.remove('egg-intro-pending');
      // Clean up only once every entrance has reached its original CSS state.
      Promise.all(animations.map(animation => animation.finished.catch(() => {}))).then(finishIntro);
    } catch { finishIntro(); }
  }

  function navigationEggs() {
    let pending = null;
    let selected = null;
    document.querySelectorAll('.nav a').forEach(link => {
      link.addEventListener('click', event => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey
          || event.shiftKey || event.altKey || link.target === '_blank'
          || !link.querySelector('.illustrated-egg')) return;
        window.PortfolioSound?.eggCrack();
        if (reduce.matches || !canAnimate) return;
        event.preventDefault();
        finishIntro();
        if (pending) clearTimeout(pending);
        selected?.classList.remove('is-hatching');
        selected = link;
        link.classList.remove('is-hatching');
        // Restart a deliberate hatch even when the same link is clicked again.
        void link.offsetWidth;
        link.classList.add('is-hatching');
        pending = setTimeout(() => location.assign(link.href), 640);
      });
    });
    window.addEventListener('pageshow', event => {
      if (!event.persisted) return;
      if (pending) clearTimeout(pending);
      pending = null;
      document.querySelectorAll('.nav .is-hatching').forEach(link => link.classList.remove('is-hatching'));
    });
  }

  function projectCounters() {
    if (!document.body.classList.contains('project-page')) return;
    const selectors = [
      '.market-metric strong', '.segment-facts dt', '.consumer-stat strong',
      '.personalized-values > span:not(.growth-arrow)',
      '.fk-workplace > strong', '.fk-survey-meta > strong', '.fk-result > strong',
      '.ep-market-total > strong', '.ep-spending-grid > div > p', '.ep-donut > span',
      '.ep-grief-evidence strong', '.ep-response-count > strong', '.ep-key-score',
      '.bjd-market-stats dd'
    ].join(',');
    const researchSections = '#market, #background, #questionnaire, #bjd-market-data';
    const counters = [];
    const frames = new Set();
    const numberPattern = /\d[\d,]*(?:\.\d+)?/g;

    function enhance(parent) {
      if (!parent.closest(researchSections)) return;
      // Animate the metric's own text only; preserve years, labels and /5 spans.
      [...parent.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).forEach(node => {
        const original = node.textContent;
        if (!/\d/.test(original)) return;
        const parts = [];
        let cursor = 0;
        for (const match of original.matchAll(numberPattern)) {
          parts.push(original.slice(cursor, match.index));
          const token = match[0];
          const decimals = token.includes('.') ? token.split('.')[1].length : 0;
          parts.push({ value: Number(token.replaceAll(',', '')), format: new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: token.includes(',')
          }) });
          cursor = match.index + token.length;
        }
        parts.push(original.slice(cursor));
        const wrapper = document.createElement('span');
        wrapper.className = 'metric-counter';
        wrapper.dataset.countFinal = original.trim();
        wrapper.dataset.countState = 'idle';
        const measure = document.createElement('span');
        measure.className = 'metric-counter-measure';
        measure.textContent = original;
        measure.setAttribute('aria-hidden', 'true');
        const value = document.createElement('span');
        value.className = 'metric-counter-value';
        value.textContent = original;
        value.setAttribute('aria-hidden', 'true');
        const accessible = document.createElement('span');
        accessible.className = 'metric-counter-sr';
        accessible.textContent = original;
        wrapper.append(measure, value, accessible);
        node.replaceWith(wrapper);
        counters.push({ wrapper, value, original, parts });
      });
    }
    document.querySelectorAll(selectors).forEach(enhance);

    let observer;
    const showFinal = () => {
      frames.forEach(cancelAnimationFrame);
      frames.clear();
      observer?.disconnect();
      counters.forEach(counter => {
        counter.value.textContent = counter.original;
        counter.wrapper.dataset.countState = 'done';
      });
    };
    if (reduce.matches || !('IntersectionObserver' in window)) { showFinal(); return; }
    function start(counter, delay) {
      counter.wrapper.dataset.countState = 'running';
      const started = performance.now() + delay;
      let frame;
      const tick = now => {
        frames.delete(frame);
        const progress = Math.max(0, Math.min(1, (now - started) / 1650));
        const eased = 1 - Math.pow(1 - progress, 3);
        const text = progress === 1 ? counter.original : counter.parts.map(part =>
          typeof part === 'string' ? part : part.format.format(part.value * eased)).join('');
        if (counter.value.textContent !== text) counter.value.textContent = text;
        if (progress < 1) { frame = requestAnimationFrame(tick); frames.add(frame); }
        else counter.wrapper.dataset.countState = 'done';
      };
      frame = requestAnimationFrame(tick);
      frames.add(frame);
    }
    try {
      observer = new IntersectionObserver(entries => {
        let order = 0;
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const counter = counters.find(item => item.wrapper === entry.target);
          if (counter && counter.wrapper.dataset.countState === 'idle') start(counter, Math.min(order++, 2) * 80);
          observer.unobserve(entry.target);
        });
      }, { threshold: .45, rootMargin: '0px 0px -24px 0px' });
      counters.forEach(counter => observer.observe(counter.wrapper));
    } catch { showFinal(); }
    reduce.addEventListener('change', event => { if (event.matches) showFinal(); });


  }

  navigationEggs();
  projectCounters();
  homeEntrance();
  reduce.addEventListener('change', event => { if (event.matches) finishIntro(); });
  window.addEventListener('pageshow', event => { if (event.persisted) finishIntro(); });
})();
