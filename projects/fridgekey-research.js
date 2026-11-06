/* Horizontal navigation complements native touch, trackpad and keyboard scrolling. */
(() => {
  const section=document.querySelector('#user-journey-map');
  if(!section)return;
  const scroller=section.querySelector('.fk-journey-scroll');
  const prev=section.querySelector('[data-journey-prev]');
  const next=section.querySelector('[data-journey-next]');
  const update=()=>{prev.disabled=scroller.scrollLeft<2;next.disabled=scroller.scrollLeft>=scroller.scrollWidth-scroller.clientWidth-2;};
  const move=direction=>scroller.scrollBy({left:direction*Math.max(224,scroller.clientWidth*.7),behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
  prev.addEventListener('click',()=>move(-1));
  next.addEventListener('click',()=>move(1));
  scroller.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update);
  update();
})();
