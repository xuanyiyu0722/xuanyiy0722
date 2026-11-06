/* Filter the documented brainstorm priorities without changing the design choices. */
(() => {
  const section=document.querySelector('#function-brainstorm');
  if(!section)return;
  const controls=[...section.querySelectorAll('[data-function-filter]')];
  const ideas=[...section.querySelectorAll('[data-function-priority]')];
  const groups=[...section.querySelectorAll('.fk-bubble-cluster')];
  const count=section.querySelector('[data-function-count]');
  controls.forEach(button=>button.addEventListener('click',()=>{
    const filter=button.dataset.functionFilter;
    controls.forEach(control=>control.setAttribute('aria-pressed',String(control===button)));
    let shown=0;
    ideas.forEach(idea=>{
      const priority=idea.dataset.functionPriority;
      const visible=filter==='all'||(filter==='main'?priority==='main':priority!=='idea');
      idea.hidden=!visible;
      if(visible)shown++;
    });
    groups.forEach(group=>{group.hidden=![...group.querySelectorAll('[data-function-priority]')].some(idea=>!idea.hidden);});
    count.textContent=`Showing ${shown} ${filter==='main'?'main functions':filter==='selected'?'selected functions':'ideas'}`;
  }));
})();
