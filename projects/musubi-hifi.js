/* Keep the embedded prototype idle offscreen; batch resize messages per paint. */
(() => {
  const frame = document.getElementById('musubi-hifi-preview');
  if (!frame) return;
  let visible = false, suspended = false, lastVisible;
  let heightFrame = 0, pendingHeight;
  const tell = (force = false) => {
    const next = visible && !document.hidden && !suspended;
    if (!force && next === lastVisible) return;
    lastVisible = next;
    frame.contentWindow?.postMessage({type:'musubi-hifi-visible', visible:next}, '*');
  };
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    tell();
  }, {threshold:.04}).observe(frame);
  frame.addEventListener('load', () => tell(true));
  document.addEventListener('visibilitychange', () => tell());
  const applyHeight = () => {
    heightFrame = 0;
    if (frame.style.height !== pendingHeight) frame.style.height = pendingHeight;
  };
  window.addEventListener('message', event => {
    if (event.source !== frame.contentWindow || suspended) return;
    if (event.data?.type === 'musubi-hifi-ready') tell(true);
    if (event.data?.type !== 'musubi-hifi-height') return;
    const height = Number(event.data.height);
    if (!Number.isFinite(height) || height < 400 || height >= 6000) return;
    pendingHeight = Math.ceil(height + 3) + 'px';
    if (!heightFrame && frame.style.height !== pendingHeight) heightFrame = requestAnimationFrame(applyHeight);
  });
  window.addEventListener('pagehide', () => {
    suspended = true;
    cancelAnimationFrame(heightFrame);
    heightFrame = 0;
    tell();
  });
  window.addEventListener('pageshow', () => {
    suspended = false;
    if (pendingHeight && !heightFrame && frame.style.height !== pendingHeight) heightFrame = requestAnimationFrame(applyHeight);
    tell(true);
  });
})();
