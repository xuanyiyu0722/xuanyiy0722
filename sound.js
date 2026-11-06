/* Short, gesture-activated effects shared by the three main portfolio pages. */
(() => {
  const preference = 'alicia-portfolio-sound';
  const readPreference = () => {
    try { return localStorage.getItem(preference) !== 'off'; }
    catch { return true; }
  };
  let enabled = readPreference();
  let unlocked = false;
  let lastEgg = -Infinity;
  let lastTurn = -Infinity;
  let eggUntil = 0;
  let pageSerial = 0;
  let priming = false;
  const egg = new Audio('assets/audio/egg-crack.mp3');
  const page = new Audio('assets/audio/gallery-page-turn.mp3');
  egg.preload = page.preload = 'auto';
  egg.volume = .28;
  page.volume = .23;
  const isGallery = document.body.classList.contains('gallery-page');
  const stopPage = () => {
    pageSerial++;
    priming = false;
    page.pause();
    page.currentTime = 0;
    page.muted = false;
  };
  const stopAll = () => {
    stopPage();
    egg.pause();
    egg.currentTime = 0;
    eggUntil = 0;
  };
  const play = audio => {
    try { audio.play()?.catch(() => {}); }
    catch { /* The browser may require another direct gesture. */ }
  };
  const primePage = () => {
    if (!isGallery || !enabled || priming || !page.paused) return;
    const serial = ++pageSerial;
    priming = true;
    page.muted = true;
    try {
      Promise.resolve(page.play()).catch(() => {}).then(() => {
        if (serial !== pageSerial) return;
        stopPage();
      });
    } catch { if (serial === pageSerial) stopPage(); }
  };
  const unlock = event => {
    if (!event.isTrusted) return;
    unlocked = true;
    // A silent prime uses a direct gesture; wheel playback still follows browser policy.
    if (event.type !== 'wheel') primePage();
  };
  ['pointerdown', 'keydown', 'touchend', 'click', 'wheel'].forEach(type => {
    document.addEventListener(type, unlock, { capture:true, passive:true });
  });
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sound-toggle';
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M11 5 6 9H3v6h3l5 4Z"/><path class="sound-waves" d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/><path class="sound-slash" d="m15 9 6 6m0-6-6 6"/></svg><span></span>';
  const label = button.querySelector('span');
  const render = () => {
    label.textContent = enabled ? 'Sound On' : 'Sound Off';
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Mute sound effects' : 'Enable sound effects');
    button.classList.toggle('is-muted', !enabled);
  };
  button.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem(preference, enabled ? 'on' : 'off'); } catch {}
    if (!enabled) stopAll();
    else primePage();
    render();
  });
  document.body.append(button);
  render();
  window.PortfolioSound = Object.freeze({
    eggCrack() {
      const now = performance.now();
      if (!enabled || !unlocked || document.hidden || now - lastEgg < 180) return;
      lastEgg = now;
      eggUntil = now + 850;
      stopPage();
      egg.pause();
      egg.currentTime = 0;
      play(egg);
    },
    pageTurn() {
      const now = performance.now();
      if (!enabled || !unlocked || document.hidden || now < eggUntil
        || now - lastTurn < 450 || (!priming && !page.paused)) return;
      lastTurn = now;
      stopPage();
      play(page);
    }
  });
  const syncPreference = () => {
    enabled = readPreference();
    if (!enabled) stopAll();
    render();
  };
  window.addEventListener('storage', event => { if (event.key === preference) syncPreference(); });
  window.addEventListener('pageshow', syncPreference);
  window.addEventListener('pagehide', stopAll);
  window.addEventListener('beforeprint', stopAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
})();
