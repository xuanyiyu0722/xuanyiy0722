/* Three slow photo columns: adjacent columns always use different photos. */
(() => {
  const mosaic=document.querySelector('.about-mosaic');
  const originals=[...mosaic?.querySelectorAll('.about-mosaic__tile') || []];
  const caption=document.querySelector('.about-photo-caption');
  if (originals.length < 4 || !caption || typeof Element.prototype.animate !== 'function') return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const stage=document.createElement('div');
  stage.className='about-photo-wall'; stage.tabIndex=0;
  stage.setAttribute('role','region'); stage.setAttribute('aria-label','Photos of Alicia and her doll collection');
  stage.setAttribute('aria-describedby',caption.id);
  const columns=document.createElement('div'); columns.className='about-photo-columns';
  const split=Math.ceil(originals.length/2),sets=[originals.slice(0,split),originals.slice(split)];
  const initial=[.12,.53,.37],speeds=[-18,15,-16];
  const entries=Array.from({length:3},(_,index) => {
    const column=document.createElement('div'); column.className='about-photo-column';
    const track=document.createElement('div'); track.className='about-photo-track';
    const sources=sets[index%2],offset=index>1 ? 2%sources.length : 0;
    let group;
    for (let copy=0;copy<2;copy++) {
      const current=document.createElement('div'); current.className='about-photo-group';
      if (copy || index>=2) current.setAttribute('aria-hidden','true');
      sources.forEach((_,position) => {
        const source=sources[(position+offset)%sources.length];
        const figure=document.createElement('figure');
        figure.className='about-photo-card '+source.className.replace('about-mosaic__tile','');
        const image=source.querySelector('img').cloneNode(); image.draggable=false;
        figure.append(image); current.append(figure);
      });
      if (!copy) group=current;
      track.append(current);
    }
    column.append(track); columns.append(column);
    return {track,group,index,animation:null,duration:0};
  });
  stage.append(columns,caption); mosaic.replaceChildren(stage); mosaic.classList.add('about-mosaic--wall');
  let visible=true,drag=null;
  const updatePlayback=() => entries.forEach(({animation}) => {
    if (!animation) return;
    if (reduce.matches || document.hidden || !visible || drag) animation.pause();
    else animation.play();
  });
  const measure=() => {
    entries.forEach(entry => {
      const phase=entry.animation && entry.duration ? ((Number(entry.animation.currentTime)||0)%entry.duration)/entry.duration : initial[entry.index];
      entry.animation?.cancel(); entry.animation=null;
      const distance=entry.group.getBoundingClientRect().height;
      if (!distance) return;
      const from=speeds[entry.index]<0 ? 0 : -distance,to=speeds[entry.index]<0 ? -distance : 0;
      if (reduce.matches) { entry.track.style.transform=`translateY(${from+(to-from)*phase}px)`; return; }
      entry.track.style.removeProperty('transform');
      entry.duration=distance/Math.abs(speeds[entry.index])*1000;
      entry.animation=entry.track.animate([{transform:`translateY(${from}px)`},{transform:`translateY(${to}px)`}],{duration:entry.duration,iterations:Infinity,easing:'linear'});
      entry.animation.currentTime=phase*entry.duration;
    });
    updatePlayback();
  };
  stage.addEventListener('pointerdown',event => {
    if (event.button!==0 || event.pointerType==='touch' || reduce.matches) return;
    event.preventDefault(); stage.focus({preventScroll:true});
    drag={id:event.pointerId,y:event.clientY,times:entries.map(entry=>Number(entry.animation?.currentTime)||0)};
    stage.setPointerCapture(event.pointerId); stage.classList.add('is-dragging'); updatePlayback();
  });
  stage.addEventListener('pointermove',event => {
    if (!drag || event.pointerId!==drag.id) return;
    const dy=event.clientY-drag.y;
    entries.forEach((entry,index) => {
      if (entry.animation) entry.animation.currentTime=((drag.times[index]+dy/speeds[index]*1000)%entry.duration+entry.duration)%entry.duration;
    });
  });
  const release=event => {
    if (!drag || event.pointerId!==drag.id) return;
    drag=null; stage.classList.remove('is-dragging');
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    updatePlayback();
  };
  for (const type of ['pointerup','pointercancel','lostpointercapture']) stage.addEventListener(type,release);
  stage.addEventListener('keydown',event => {
    if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowUp','ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    entries.forEach(entry => {
      if (entry.animation) entry.animation.currentTime=(Number(entry.animation.currentTime)||0)+(event.key==='ArrowDown'?6000:-6000);
    });
  });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(stage);
  else window.addEventListener('resize',measure,{passive:true});
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { visible=entry.isIntersecting; updatePlayback(); }).observe(stage);
  document.addEventListener('visibilitychange',updatePlayback);
  window.addEventListener('pagehide',() => { visible=false; drag=null; stage.classList.remove('is-dragging'); updatePlayback(); });
  window.addEventListener('pageshow',() => { visible=true; updatePlayback(); });
  reduce.addEventListener('change',measure);
  measure();
})();
