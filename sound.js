/* Short, gesture-activated effects shared by the three main portfolio pages. */
(() => {
  const preference = 'alicia-portfolio-sound';
  const readPreference = () => {
    try { return localStorage.getItem(preference) !== 'off'; }
    catch { return true; }
  };
  let enabled = readPreference();
  let unlocked = false;
  let lastSelect = -Infinity;
  let lastEgg = -Infinity;
  let lastTurn = -Infinity;
  let eggUntil = 0;
  let pageSerial = 0;
  let priming = false;
  const selection = new Audio('assets/audio/egg-select-mechanical.mp3');
  const egg = new Audio('assets/audio/egg-crack.mp3');
  const page = new Audio('assets/audio/gallery-page-turn.mp3');
  selection.preload = egg.preload = page.preload = 'auto';
  selection.volume = .2;
  egg.volume = .28 * 2 / 3;
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
    selection.pause();
    selection.currentTime = 0;
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
  window.PortfolioSound = Object.freeze({
    eggSelect() {
      const now = performance.now();
      if (!enabled || !unlocked || document.hidden || now < eggUntil || now - lastSelect < 180) return;
      lastSelect = now;
      stopPage();
      selection.pause();
      selection.currentTime = 0;
      play(selection);
    },
    eggCrack({ hover = false } = {}) {
      const now = performance.now();
      if (!enabled || (!hover && !unlocked) || document.hidden || now - lastEgg < 180) return;
      lastEgg = now;
      eggUntil = now + 850;
      stopPage();
      selection.pause();
      selection.currentTime = 0;
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
  };
  window.addEventListener('storage', event => { if (event.key === preference) syncPreference(); });
  window.addEventListener('pageshow', syncPreference);
  window.addEventListener('pagehide', stopAll);
  window.addEventListener('beforeprint', stopAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
})();
