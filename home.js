// Homepage project preview, from alicia_portfolio_latest.
(()=>{
 const dialog=document.querySelector('.egg-dialog'), zoom=dialog.querySelector('.zoom-egg'), crack=dialog.querySelector('.crack-button'), top=dialog.querySelector('.egg-top'), bottom=dialog.querySelector('.egg-bottom'), link=dialog.querySelector('.project-reveal'), hint=dialog.querySelector('.preview-hint');
 const urls={NABORFOOD:'projects/naborfood.html',FridgeKey:'projects/fridgekey.html',EverPaw:'projects/project-03.html',MUSUBI:'projects/project-04.html'};
 let source=null, phase='closed', motions=[],token=0,oldOverflow='';
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 async function move(el,frames,options){const a=el.animate(frames,options);motions.push(a);try{await a.finished;}catch{}return a;}
 function close(){if(!dialog.open)return;token++;motions.forEach(a=>a.cancel());motions=[];dialog.close();if(source){source.classList.remove('is-lifted');source.focus({preventScroll:true});}document.body.style.overflow=oldOverflow;phase='closed';source=null;}
 document.querySelectorAll('.asset-egg').forEach(button=>button.addEventListener('click',async()=>{
  if(phase!=='closed')return;
  window.PortfolioSound?.eggSelect();
  const current=++token;source=button;phase='moving';const start=button.getBoundingClientRect();
  link.classList.remove('visible');link.style.opacity='0';link.querySelector('span').textContent=button.dataset.project;link.href=urls[button.dataset.project];
  crack.disabled=false;hint.textContent='';dialog.showModal();oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';source.classList.add('is-lifted');
  const end=zoom.getBoundingClientRect();const dx=start.x+start.width/2-end.x-end.width/2,dy=start.y+start.height/2-end.y-end.height/2;
  if(!reduced())await move(zoom,[{transform:`translate(${dx}px,${dy}px) scale(${start.width/end.width})`},{transform:'translate(0,0) scale(1)'}],{duration:700,easing:'cubic-bezier(.22,.68,.2,1)',fill:'none'});
  if(current!==token)return;
  if(!reduced())await move(zoom,[{transform:'rotate(0)'},{transform:'rotate(-2deg)'},{transform:'rotate(2deg)'},{transform:'rotate(-1.4deg)'},{transform:'rotate(1deg)'},{transform:'rotate(0)'}],{duration:430,easing:'ease-in-out'});
  if(current!==token)return;phase='ready';hint.textContent='Click again to crack';crack.focus({preventScroll:true});
 }));
 crack.addEventListener('click',async()=>{
  if(phase!=='ready')return;window.PortfolioSound?.eggCrack();phase='cracking';const current=token;crack.disabled=true;hint.textContent='';
  const duration=reduced()?0:650;
  link.classList.add('visible');
  await Promise.all([
   move(top,[{transform:'translateY(0) rotate(0)'},{transform:'translateY(-43%) rotate(-7deg)'}],{duration,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'}),
   move(bottom,[{transform:'translateY(0) rotate(0)'},{transform:'translateY(43%) rotate(7deg)'}],{duration,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'}),
   move(link,[{opacity:0},{opacity:1}],{duration:reduced()?0:350,delay:reduced()?0:230,fill:'forwards'})
  ]);
  if(current!==token)return;phase='open';hint.textContent='';link.focus({preventScroll:true});
 });
 dialog.querySelector('.close-preview').addEventListener('click',close);
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
})();
