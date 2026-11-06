/* Filters surface the priorities already marked in the original sticky-note board. */
(() => {
  const section = document.querySelector('#function-brainstorm');
  if (!section) return;
  const controls = section.querySelector('.ep-feature-filters');
  const buttons = [...controls.querySelectorAll('[data-feature-filter]')];
  const notes = [...section.querySelectorAll('[data-feature-priority]')];
  const groups = [...section.querySelectorAll('[data-feature-category]')];
  const status = section.querySelector('[data-feature-status]');
  controls.hidden = false;
  buttons.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.featureFilter;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    notes.forEach(note => {
      const priority = note.dataset.featurePriority;
      note.hidden = !(filter === 'all' || (filter === 'selected' && priority !== 'idea') || priority === filter);
      if (!note.hidden) count++;
    });
    groups.forEach(group => { group.hidden = ![...group.querySelectorAll('[data-feature-priority]')].some(note => !note.hidden); });
    status.textContent = `${count} ${filter === 'mvp' ? 'MVP features' : filter === 'selected' ? 'prioritized features' : 'ideas'} shown`;
  }));
})();

/* Focus one stage at a time while keeping the original matrices available. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const players = [];
  document.querySelectorAll('[data-journey-map]').forEach(map => {
    const scroll = map.querySelector('[data-journey-scroll]');
    const table = scroll.querySelector('table');
    const previous = map.querySelector('[data-journey-prev]');
    const next = map.querySelector('[data-journey-next]');
    const status = map.querySelector('[data-journey-status]');
    const controls = previous.parentElement;
    const toolbar = map.querySelector('.ep-journey-toolbar');
    const headers = [...table.tHead.rows[0].cells].slice(1);
    const owner = table.id.includes('owner') ? 'owner' : 'pet';
    const play = document.createElement('button');
    play.type = 'button'; play.className = 'ep-map-play'; play.textContent = 'Play stages ▷';
    play.setAttribute('aria-pressed', 'false'); play.setAttribute('aria-controls', table.id);
    const overview = document.createElement('button');
    overview.type = 'button'; overview.className = 'ep-map-overview'; overview.textContent = 'Full map';
    overview.setAttribute('aria-pressed', 'true');
    const actions = document.createElement('div'); actions.className = 'ep-map-actions';
    actions.append(play, overview); toolbar.querySelector('p').replaceWith(actions);
    const progress = document.createElement('ol'); progress.className = 'ep-map-progress';
    progress.setAttribute('aria-label', owner + ' journey stages');
    const buttons = headers.map((header, i) => {
      const item = document.createElement('li'), button = document.createElement('button');
      button.type = 'button'; button.textContent = String(i + 1).padStart(2, '0');
      button.setAttribute('aria-label', owner + ' stage ' + (i + 1) + ': ' + header.textContent.trim().replace(/^\d+/, '').trim());
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {pause(); focus(i);});
      item.append(button); progress.append(item); return button;
    });
    map.append(progress);
    const curveRow = table.querySelector('.ep-feelings-row');
    const curve = curveRow.querySelector('svg');
    const emotions = curve.getAttribute('aria-label').split(',').map(s => s.trim());
    const focusedFeelings = document.createElement('tr'); focusedFeelings.className = 'ep-focused-feelings'; focusedFeelings.hidden = true;
    focusedFeelings.append(curveRow.querySelector('th').cloneNode(true));
    headers.forEach((header, i) => {
      const cell = document.createElement('td'), image = curve.cloneNode(true);
      image.setAttribute('viewBox', `${i * 220} 0 220 220`);
      image.setAttribute('aria-label', emotions[i]);
      image.querySelectorAll('defs,path').forEach(node => node.remove());
      [...image.children].filter(node => node.tagName.toLowerCase() === 'text').forEach((node, n) => {if (n !== i) node.remove();});
      [...image.children].filter(node => node.tagName.toLowerCase() === 'svg').forEach((node, n) => {if (n !== i) node.remove();});
      cell.append(image); focusedFeelings.append(cell);
    });
    curveRow.after(focusedFeelings);
    let index = -1, playing = false, elapsed = 0, frame = 0, last = 0, completed = false, shifted = false;
    const DURATION = 7600;
    function update() {
      controls.hidden = false;
      play.textContent = playing ? 'Pause stages Ⅱ' : completed ? 'Replay stages ↺' : index >= 0 ? 'Continue stages ▷' : 'Play stages ▷';
      play.setAttribute('aria-pressed', String(playing));
      overview.setAttribute('aria-pressed', String(index < 0));
      previous.disabled = index === 0 || (index < 0 && scroll.scrollLeft <= 1);
      next.disabled = index === headers.length - 1 || (index < 0 && scroll.scrollLeft >= scroll.scrollWidth - scroll.clientWidth - 1);
      if (index >= 0) status.textContent = `Stage ${String(index + 1).padStart(2, '0')} / 07`;
      else {
        const visible = Math.min(7, Math.max(1, Math.floor((scroll.clientWidth - 96) / 220)));
        const first = Math.min(8 - visible, Math.ceil(Math.max(0, scroll.scrollLeft - 1) / 220) + 1);
        status.textContent = `Stages ${String(first).padStart(2, '0')}–${String(Math.min(7, first + visible - 1)).padStart(2, '0')} / 07`;
      }
      buttons.forEach((button, i) => {
        button.setAttribute('aria-pressed', String(i === index));
        button.classList.toggle('is-complete', i < index || completed);
        button.style.setProperty('--map-progress', i === index ? String(elapsed / DURATION) : '0');
      });
    }
    function pause() {playing = false; cancelAnimationFrame(frame); last = 0; update();}
    players.push(pause);
    function focus(i, animate = true) {
      index = Math.max(0, Math.min(headers.length - 1, i)); elapsed = 0; completed = false; shifted = false;
      map.classList.add('is-stage-focused');
      curveRow.hidden = true; focusedFeelings.hidden = false;
      const width = Math.max(170, scroll.clientWidth - 96);
      map.style.setProperty('--ep-focused-column', width + 'px');
      table.style.width = 96 + width * headers.length + 'px';
      [...table.rows].forEach(row => [...row.cells].forEach((cell, cellIndex) => cell.classList.toggle('is-current-stage', cellIndex === index + 1)));
      // Reading the cell geometry commits the expanded columns before the camera moves.
      const target = headers[index].getBoundingClientRect().left - scroll.getBoundingClientRect().left + scroll.scrollLeft - 96;
      scroll.scrollTo({left: target, top: 0, behavior: animate && !reduced.matches ? 'smooth' : 'instant'});
      update();
    }
    function tick(now) {
      if (!playing) return;
      if (last) elapsed += Math.min(now - last, 100);
      last = now;
      if (!shifted && elapsed > DURATION * .48) {
        shifted = true;
        scroll.scrollTo({top: scroll.scrollHeight - scroll.clientHeight, behavior: reduced.matches ? 'instant' : 'smooth'});
      }
      if (elapsed >= DURATION) {
        if (index < headers.length - 1) focus(index + 1);
        else {elapsed = DURATION; completed = true; pause(); return;}
      }
      update(); frame = requestAnimationFrame(tick);
    }
    play.addEventListener('click', () => {
      if (playing) {pause(); return;}
      players.forEach(stop => stop());
      if (index < 0 || completed) focus(0);
      toolbar.scrollIntoView({block: 'start', behavior: reduced.matches ? 'instant' : 'smooth'});
      playing = true; last = 0; update(); frame = requestAnimationFrame(tick);
    });
    overview.addEventListener('click', () => {
      pause(); index = -1; elapsed = 0; completed = false;
      map.classList.remove('is-stage-focused'); table.style.width = '';
      curveRow.hidden = false; focusedFeelings.hidden = true;
      scroll.scrollTo({left: 0, top: 0, behavior: 'instant'}); update();
    });
    function move(direction) {
      pause();
      if (index >= 0) focus(index + direction);
      else scroll.scrollBy({left: direction * Math.max(1, Math.floor((scroll.clientWidth - 96) / 220)) * 220, behavior: reduced.matches ? 'instant' : 'smooth'});
    }
    previous.addEventListener('click', () => move(-1)); next.addEventListener('click', () => move(1));
    scroll.addEventListener('scroll', () => {if (index < 0) update();}, {passive: true});
    scroll.addEventListener('wheel', () => {if (playing) pause();}, {passive: true});
    scroll.addEventListener('touchstart', () => {if (playing) pause();}, {passive: true});
    scroll.addEventListener('keydown', event => {
      if (event.target !== scroll) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);}
    });
    let width = scroll.clientWidth;
    new ResizeObserver(() => {
      if (Math.abs(width - scroll.clientWidth) < 1) return;
      width = scroll.clientWidth;
      if (index >= 0) {pause(); focus(index, false);} else update();
    }).observe(scroll);
    new IntersectionObserver(entries => {if (!entries[0].isIntersecting && playing) pause();}).observe(scroll);
    document.addEventListener('visibilitychange', () => {if (document.hidden) pause();});
    window.addEventListener('pagehide', pause);
    update();
  });
})();
