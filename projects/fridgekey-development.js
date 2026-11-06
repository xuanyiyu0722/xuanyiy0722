(()=>{
const main=document.getElementById('fridgekey-hifi-preview'),journey=document.getElementById('fridgekey-journey-preview');if(!main)return;
let visible=false;const tell=()=>main.contentWindow?.postMessage({type:'fridgekey-visible',visible:visible&&!document.hidden},'*');
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;tell()},{threshold:.06}).observe(main);main.addEventListener('load',tell);document.addEventListener('visibilitychange',tell);
window.addEventListener('message',e=>{if(e.source===main.contentWindow&&e.data?.type==='fridgekey-ready')tell();if(e.data?.type!=='fridgekey-height')return;const frame=e.source===main.contentWindow?main:e.source===journey?.contentWindow?journey:null;if(!frame)return;const h=Number(e.data.height);if(Number.isFinite(h)&&h>=100&&h<4500)frame.style.height=Math.ceil(h+4)+'px'});
})();
