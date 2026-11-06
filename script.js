const qs=(s,c=document)=>c.querySelector(s);const qsa=(s,c=document)=>[...c.querySelectorAll(s)];
const io=new IntersectionObserver((entries)=>entries.forEach(e=>{e.target.classList.toggle('in',e.isIntersecting)}),{threshold:.1});qsa('.reveal').forEach(el=>io.observe(el));
const hero=qs('.wire-hero');const stage=qs('#eggStage');const backdrop=qs('.egg-focus-backdrop');let activeEgg=null;let isAnimating=false;
const canMotion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
if(window.gsap&&window.Flip)gsap.registerPlugin(Flip);
const resetCrack=egg=>{const pieces=qsa('.egg-piece',egg);const link=qs('.egg-project-link',egg);if(window.gsap)gsap.set([...pieces,link],{clearProps:'all'});};
const focusEgg=egg=>{
  if(isAnimating||activeEgg)return;
  activeEgg=egg;egg.setAttribute('aria-expanded','true');
  const state=window.Flip?Flip.getState(egg):null;
  hero?.classList.add('egg-focus');egg.classList.add('is-active');
  if(window.Flip&&canMotion){isAnimating=true;Flip.from(state,{duration:.75,ease:'power3.inOut',absolute:true,scale:true,onComplete:()=>isAnimating=false});}
};
const closeEgg=()=>{
  if(!activeEgg||isAnimating)return;
  const egg=activeEgg;const state=window.Flip?Flip.getState(egg):null;
  egg.classList.remove('is-cracked','is-active');egg.setAttribute('aria-expanded','false');hero?.classList.remove('egg-focus');resetCrack(egg);
  if(window.Flip&&canMotion){isAnimating=true;Flip.from(state,{duration:.55,ease:'power2.inOut',absolute:true,scale:true,onComplete:()=>{activeEgg=null;isAnimating=false;}});}
  else activeEgg=null;
};
const crackEgg=egg=>{
  if(isAnimating||egg.classList.contains('is-cracked'))return;
  const shell=qs('.egg-shell',egg);const left=qs('.egg-piece-left',egg);const right=qs('.egg-piece-right',egg);const link=qs('.egg-project-link',egg);
  egg.classList.add('is-cracked');
  if(!window.gsap||!canMotion)return;
  isAnimating=true;gsap.set(link,{autoAlpha:0,y:18});
  gsap.timeline({onComplete:()=>isAnimating=false})
    .to(shell,{rotation:-2,duration:.07,repeat:5,yoyo:true,ease:'sine.inOut'})
    .set(shell,{rotation:0})
    .fromTo(left,{x:0,rotation:0},{x:-86,rotation:-13,duration:.58,ease:'power3.out'},'+=.03')
    .fromTo(right,{x:0,rotation:0},{x:86,rotation:13,duration:.58,ease:'power3.out'},'<')
    .to(link,{autoAlpha:1,y:0,duration:.36,ease:'power2.out'},'-=.2');
};
qsa('.wire-egg').forEach(egg=>{
  egg.setAttribute('aria-expanded','false');
  egg.addEventListener('click',e=>{
    if(e.target.closest('.egg-project-link'))return;
    if(activeEgg===egg)crackEgg(egg);else focusEgg(egg);
  });
  egg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();egg.click();}});
});
backdrop?.addEventListener('click',closeEgg);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeEgg();});
const here=location.pathname.split('/').pop()||'index.html';qsa('.nav a,.mobile-nav a').forEach(a=>{const href=a.getAttribute('href')||'';if(href.endsWith(here)||(here===''&&href.endsWith('index.html')))a.classList.add('active')});
