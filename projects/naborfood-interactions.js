(() => {
  // Percentages refer to the exported screen artwork, including its original frame.
  const regions = [
    [[[0,7.5,22,85,12]],[[0,7.5,36.3,85,37.4]],[[0,7.5,76,85,14.5]]],
    [[[0,7,38,86,34]],[[0,7,72,86,10],[1,6,19,88,67],[2,6,19,88,67]],[[0,7,19,86,18],[0,7,86,32,6]]],
    [[[0,6,14,88,10],[1,6,14,88,10]],[[0,6,25,88,43]],[[0,6,69,88,8]],[[1,6,29,88,59]],[[2,6,14,88,76]]],
    [[[0,6,18,88,16],[1,6,27,88,50]],[[0,6,35,88,51]]],
    [[[0,6,14,88,13],[1,6,14,88,13]],[[0,6,31,88,12],[1,6,31,88,12]],[[0,6,65,88,21],[1,6,60,88,21]]],
    [[[0,6,12,88,10]],[[0,6,23,88,15]],[[0,6,40,88,19]],[[0,6,60,88,27]]],
    [[[0,12,34,76,34]]],
    [[[0,17.8,60,17.5,6]],[[0,56.5,34,26.4,41.5]]],
    [[[0,23,18,74,68],[1,23,18,74,68]],[[0,2.5,14,17,67],[1,2.5,14,17,67]]],
    [[[0,3,13,94,17]],[[0,3,31,94,50]],[[0,3,83,94,7]]],
    [[[0,30,26,40,64]]],
    [[[0,3,15,94,79]]]
  ];
  const motion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  document.querySelectorAll('.wf-row').forEach((row,rowIndex) => {
    const anchors = [...row.querySelectorAll('.wf-screen a')];
    const headings = [...row.querySelectorAll('.wf-notes dt')];
    if (!regions[rowIndex] || regions[rowIndex].length !== headings.length) return;
    let active = -1;
    const buttons = headings.map((heading,index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'wf-feature-button';
      button.textContent = heading.textContent;
      button.setAttribute('aria-label',heading.textContent.trim());
      button.setAttribute('aria-pressed','false');
      button.dataset.wfFeature = `${rowIndex}:${index}`;
      button.setAttribute('aria-controls', [...new Set(regions[rowIndex][index].map(r=>`wf-screen-${rowIndex}-${r[0]}`))].join(' '));
      heading.replaceChildren(button);
      return button;
    });
    anchors.forEach((anchor,index) => { anchor.id = `wf-screen-${rowIndex}-${index}`; });
    const status = document.createElement('p');
    status.className = 'wf-feature-status';
    status.setAttribute('aria-live','polite');
    row.querySelector('.wf-notes').append(status);
    const draw = () => {
      anchors.forEach(a => { a.querySelectorAll('.wf-highlight').forEach(h=>h.remove()); a.classList.remove('wf-screen-selected'); });
      if (active < 0) return;
      regions[rowIndex][active].forEach(([screen,x,y,w,h]) => {
        const anchor = anchors[screen];
        const img = anchor.querySelector('img');
        const bounds = img.getBoundingClientRect();
        const parent = anchor.getBoundingClientRect();
        const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : bounds.width / bounds.height;
        const drawWidth = Math.min(bounds.width,bounds.height*ratio);
        const drawHeight = drawWidth / ratio;
        const marker = document.createElement('span');
        marker.className = 'wf-highlight';
        marker.setAttribute('aria-hidden','true');
        marker.style.left = `${bounds.left-parent.left+(bounds.width-drawWidth)/2+drawWidth*x/100}px`;
        marker.style.top = `${bounds.top-parent.top+drawHeight*y/100}px`;
        marker.style.width = `${drawWidth*w/100}px`;
        marker.style.height = `${drawHeight*h/100}px`;
        anchor.append(marker);
        anchor.classList.add('wf-screen-selected');
      });
    };
    buttons.forEach((button,index) => button.addEventListener('click',() => {
      active = active === index ? -1 : index;
      buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===active)));
      row.dataset.activeFunction = active < 0 ? '' : button.textContent;
      status.textContent = active < 0 ? '' : `Highlighted: ${button.textContent}`;
      draw();
      if (active >= 0 && window.matchMedia('(max-width: 640px)').matches) anchors[regions[rowIndex][active][0][0]].scrollIntoView({behavior:motion(),block:'center'});
    }));
    anchors.forEach(a=>a.querySelector('img').addEventListener('load',draw));
    new ResizeObserver(draw).observe(row);
  });

  const store = document.querySelector('[data-store-explorer]');
  if (!store) return;
  const modeButtons = [...document.querySelectorAll('[data-store-mode]')];
  const featureButtons = [...store.querySelectorAll('[data-store-feature]')];
  const points = [...store.querySelectorAll('.store-feature-point')];
  const cards = [...store.querySelectorAll('.store-feature-card')];
  const connectors = store.querySelector('.store-connectors');
  const paths = [...connectors.querySelectorAll('path')];
  const overview = document.querySelector('[data-store-reset]');
  const play = document.querySelector('[data-store-play]');
  const hint = document.querySelector('[data-store-hint]');
  let mode = 'journey';
  let activeFeature = -1;
  let frame = null;
  const compact = matchMedia('(max-width: 820px)');
  const drawLeaders = () => {
    frame = null;
    if (mode !== 'spaces' || compact.matches) return;
    const bounds = store.getBoundingClientRect();
    const pointBoxes = points.map(point => point.getBoundingClientRect());
    const cardBoxes = cards.map(card => card.getBoundingClientRect());
    connectors.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
    paths.forEach((path,i) => {
      const point = pointBoxes[i];
      const card = cardBoxes[i];
      const x = point.left+point.width/2-bounds.left;
      const y = point.top+point.height/2-bounds.top;
      const endX = card.left-bounds.left;
      const endY = card.top+card.height/2-bounds.top;
      const bend = Math.max(30,(endX-x)*.4);
      path.setAttribute('d',`M${x},${y} C${x+bend},${y} ${endX-35},${endY} ${endX},${endY}`);
      path.classList.toggle('is-active',activeFeature===i);
    });
  };
  const schedule = () => {
    if (mode === 'spaces' && !compact.matches && frame === null) frame = requestAnimationFrame(drawLeaders);
  };
  const clearFeature = () => {
    activeFeature = -1;
    featureButtons.forEach(b=>b.setAttribute('aria-pressed','false'));
    store.querySelectorAll('[data-store-zone]').forEach(g=>g.classList.remove('is-active'));
    schedule();
  };
  const setMode = value => {
    mode = value;
    overview.click();
    clearFeature();
    store.dataset.storeView = mode;
    modeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.storeMode===mode)));
    play.hidden = mode === 'spaces';
    hint.textContent = mode === 'spaces' ? 'Select a display to locate it in the store.' : 'Choose a stage to explore the store.';
    schedule();
  };
  modeButtons.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.storeMode)));
  featureButtons.forEach(button=>button.addEventListener('click',()=> {
    const selected = Number(button.dataset.storeFeature);
    activeFeature = activeFeature===selected ? -1 : selected;
    featureButtons.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.storeFeature)===activeFeature)));
    store.querySelectorAll('[data-store-zone]').forEach(g=>g.classList.toggle('is-active',Number(g.dataset.storeZone)===activeFeature));
    store.dataset.activeDisplay = activeFeature < 0 ? '' : cards[activeFeature].querySelector('strong').textContent;
    schedule();
    if (activeFeature>=0 && window.matchMedia('(max-width: 820px)').matches) store.querySelector('.store-scene').scrollIntoView({behavior:motion(),block:'center'});
  }));
  overview.addEventListener('click',clearFeature);
  new ResizeObserver(schedule).observe(store);
  window.addEventListener('resize',schedule);
  store.querySelector('.store-base').addEventListener('load',schedule);
  store.querySelector('.store-camera').addEventListener('transitionend',schedule);
  setMode('journey');
})();
