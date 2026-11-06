(() => {
 'use strict';
 const meta={"monitor": {"label": "Monitor · Home", "nodeId": "4384:10140", "width": 168.29965209960938, "height": 365.905029296875}, "status": {"label": "Edit Widgets", "nodeId": "4384:10042", "width": 168.2311553955078, "height": 365.75634765625}, "activity": {"label": "Activity Log", "nodeId": "4384:10277", "width": 168.2311553955078, "height": 365.75634765625}, "settings": {"label": "Settings", "nodeId": "4384:10375", "width": 168.2315216064453, "height": 365.757080078125}, "voice": {"label": "Voice Studio", "nodeId": "4384:10405", "width": 168.2315216064453, "height": 365.757080078125}, "color": {"label": "Color Room", "nodeId": "4384:10451", "width": 168.2315216064453, "height": 365.757080078125}, "warning": {"label": "Warning Alert", "nodeId": "4384:10516", "width": 168.2315216064453, "height": 365.757080078125}, "emergency": {"label": "Emergency Alert", "nodeId": "4384:10598", "width": 168.2315216064453, "height": 365.757080078125}, "understand": {"label": "Understand", "nodeId": "4384:10614", "width": 168.2315216064453, "height": 365.7568664550781}, "pets": {"label": "Choose Pet", "nodeId": "4384:10757", "width": 168.2315216064453, "height": 365.7568664550781}, "mode": {"label": "Mode Selection", "nodeId": "4384:9609", "width": 248.496337890625, "height": 540.26318359375}, "album": {"label": "Album", "nodeId": "4384:9712", "width": 248.496337890625, "height": 540.26318359375}, "ai-cam": {"label": "AI Cam", "nodeId": "4384:9509", "width": 248.496337890625, "height": 540.26318359375}, "timeline": {"label": "Timeline", "nodeId": "4384:9824", "width": 248.496337890625, "height": 540.26318359375}, "avatar": {"label": "Memory Mode · Avatar", "nodeId": "4384:9926", "width": 248.496337890625, "height": 540.26318359375}, "theme-monitor": {"label": "Theme · Monitor", "nodeId": "4384:11913", "width": 211.168212890625, "height": 459.1070251464844}, "theme-profile": {"label": "Theme · My Profile", "nodeId": "4416:6797", "width": 211.51010131835938, "height": 459.850341796875}};
 const names=Object.keys(meta);
 const dialog=document.querySelector('.ep-screen-dialog');if(!dialog)return;
 const canvas=dialog.querySelector('.ep-screen-dialog-canvas');
 let current=0,opener,oldOverflow='';
 function render(name){
  const source=document.querySelector('.ep-native-screen[data-screen="'+name+'"]');if(!source)return;
  current=names.indexOf(name);const clone=source.cloneNode(true);
  clone.removeAttribute('data-open-screen');clone.removeAttribute('data-screen');clone.removeAttribute('tabindex');
  clone.setAttribute('role','img');clone.setAttribute('aria-label',meta[name].label);clone.querySelector('.ep-native-open')?.remove();
  canvas.replaceChildren(clone);dialog.querySelector('h2').textContent=meta[name].label;
  dialog.querySelector('[data-screen-counter]').textContent=String(current+1).padStart(2,'0')+' / '+names.length;
 }
 function open(name,source){if(!meta[name])return;opener=source||document.activeElement;render(name);
  if(!dialog.open){oldOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';dialog.showModal();}
  dialog.querySelector('[data-screen-close]').focus({preventScroll:true});
 }
 function close(){dialog.close();}
 dialog.addEventListener('close',()=>{document.documentElement.style.overflow=oldOverflow;canvas.replaceChildren();if(opener?.isConnected)opener.focus({preventScroll:true});});
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.querySelector('[data-screen-close]').addEventListener('click',close);
 dialog.querySelector('[data-screen-prev]').addEventListener('click',()=>render(names[(current+names.length-1)%names.length]));
 dialog.querySelector('[data-screen-next]').addEventListener('click',()=>render(names[(current+1)%names.length]));
 document.addEventListener('click',event=>{const button=event.target.closest('[data-open-screen]');if(!button)return;event.preventDefault();open(button.dataset.openScreen,button);});
 document.addEventListener('keydown',event=>{
  if(dialog.open){if(event.key==='ArrowRight'){event.preventDefault();render(names[(current+1)%names.length]);}if(event.key==='ArrowLeft'){event.preventDefault();render(names[(current+names.length-1)%names.length]);}return;}
  const button=event.target.closest('.ep-native-screen[data-open-screen]');if(button&&['Enter',' '].includes(event.key)){event.preventDefault();open(button.dataset.openScreen,button);}
 });
})();
