/* Resize each prototype once per paint without repeated layout invalidation. */
(() => {
  const main = document.getElementById('fridgekey-hifi-preview');
  const journey = document.getElementById('fridgekey-journey-preview');
  if (!main) return;
  let visible = false, suspended = false, lastVisible;
  let heightFrame = 0;
  const pending = new Map();
  const tell = (force = false) => {
    const next = visible && !document.hidden && !suspended;
    if (!force && next === lastVisible) return;
    lastVisible = next;
    main.contentWindow?.postMessage({type:'fridgekey-visible', visible:next}, '*');
  };
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; tell(); }, {threshold:.06}).observe(main);
  main.addEventListener('load', () => tell(true));
  document.addEventListener('visibilitychange', () => tell());
  const applyHeights = () => {
    heightFrame = 0;
    for (const [frame, height] of pending) if (frame.style.height !== height) frame.style.height = height;
    pending.clear();
  };
  window.addEventListener('message', event => {
    if (suspended) return;
    if (event.source === main.contentWindow && event.data?.type === 'fridgekey-ready') tell(true);
    if (event.data?.type !== 'fridgekey-height') return;
    const frame = event.source === main.contentWindow ? main : event.source === journey?.contentWindow ? journey : null;
    if (!frame) return;
    const height = Number(event.data.height);
    if (!Number.isFinite(height) || height < 100 || height >= 4500) return;
    const value = Math.ceil(height + 4) + 'px';
    if (pending.has(frame) || frame.style.height !== value) pending.set(frame, value);
    if (pending.size && !heightFrame) heightFrame = requestAnimationFrame(applyHeights);
  });
  window.addEventListener('pagehide', () => {
    suspended = true;
    cancelAnimationFrame(heightFrame);
    heightFrame = 0;
    tell();
  });
  window.addEventListener('pageshow', () => {
    suspended = false;
    if (pending.size && !heightFrame) heightFrame = requestAnimationFrame(applyHeights);
    tell(true);
  });
})();
