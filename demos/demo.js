/* Read-only surfaces captured from the current app. No backend or user data. */
(async()=>{
 const params=new URLSearchParams(location.search),version=encodeURIComponent(params.get('v')||'features-20261106'),settings=await (await fetch(`current-ui/frame-settings.json?v=${version}`)).json();
 const cache=new Map();let renderVersion=0,current=params.get('view')||'manuscript',eye=params.get('eye')==='1',compare=params.get('checkpoint')==='1'&&params.get('compare')==='1',panel=params.get('checkpoint')==='1';
 let eyePreset=eye?BreadmakerEyeDemo.choose(-1):-1,eyeActivation=null;
 const setEye=(value,activation=null)=>{if(value&&(!eye||activation!==eyeActivation))eyePreset=BreadmakerEyeDemo.choose(eyePreset);eye=!!value;eyeActivation=activation;compare=false;panel=false;show('manuscript')};
 const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)];
 async function show(name){
  const versionAtStart=++renderVersion;
  const key=name==='manuscript'?(eye?'eye':compare?'checkpoints':panel?'checkpoint-list':'manuscript'):name;
  if(!Object.hasOwn(settings,key))return;
  if(!cache.has(key))cache.set(key,await(await fetch(`current-ui/frames/${key}.html?v=${version}`)).text());
  if(versionAtStart!==renderVersion)return;
  current=name;document.body.innerHTML=cache.get(key);document.documentElement.style.cssText=settings[key].rootStyle;
  document.documentElement.dataset.theme=settings[key].rootTheme;
  (settings[key].scroll||[]).forEach(({id,left,top})=>{const el=document.getElementById(id);if(el){el.scrollLeft=left;el.scrollTop=top}});
  if(eye&&name==='manuscript')BreadmakerEyeDemo.apply(eyePreset);
  document.documentElement.dataset.initialView=name;document.documentElement.dataset.demoView=key;
  $$('.main-tab').forEach(button=>button.addEventListener('click',()=>{eye=false;compare=false;panel=false;show(button.dataset.view)}));
  $('#themeBtn')?.addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';if(eye)BreadmakerEyeDemo.apply(eyePreset)});
  $('#toggleRail')?.addEventListener('click',()=>$('#canvasRail')?.classList.toggle('collapsed'));
  $('#toggleMapRail')?.addEventListener('click',()=>$('#mapRail')?.classList.toggle('collapsed'));
  $('#editorsEyeBtn')?.addEventListener('click',()=>setEye(!eye));
  $('#checkpointBtn')?.addEventListener('click',()=>{panel=!panel;compare=false;eye=false;show('manuscript')});
  $('#closeCheckpointPanel')?.addEventListener('click',()=>{panel=false;show('manuscript')});
  $$('[data-checkpoint-compare]').forEach(button=>button.addEventListener('click',()=>{compare=true;panel=false;show('manuscript')}));
  $('#closeSplitBtn')?.addEventListener('click',()=>{compare=false;panel=false;show('manuscript')});
  $$('#app a').forEach(a=>a.addEventListener('click',event=>event.preventDefault()));
  $$('input[type=checkbox]').forEach(box=>box.addEventListener('change',()=>box.closest('.task-row')?.classList.toggle('is-done',box.checked)));
  const selectMapLine=id=>{
   $$('.map-tree-line-row').forEach(row=>row.classList.toggle('active',row.dataset.mapTreeLine===id));
   $$('.map-line-group').forEach(group=>{group.classList.toggle('selected',group.dataset.mapLine===id);group.style.opacity=group.dataset.mapLine===id?'1':'.18'});
  };
  $$('.map-tree-line-row').forEach(row=>row.addEventListener('click',()=>selectMapLine(row.dataset.mapTreeLine)));
  $$('.map-line-group').forEach(group=>group.addEventListener('click',()=>selectMapLine(group.dataset.mapLine)));
  // Retain the original preview's card drag and connected paths.
  const edges=[[1,2,1],[2,3,2],[2,4,3],[5,2,4]];
  const drawEdges=()=>edges.forEach(([from,to,id])=>{
   const a=$(`.canvas-node[data-id="${from}"]`),b=$(`.canvas-node[data-id="${to}"]`);if(!a||!b)return;
   const x1=parseFloat(a.style.left)+a.offsetWidth,y1=parseFloat(a.style.top)+a.offsetHeight/2,x2=parseFloat(b.style.left),y2=parseFloat(b.style.top)+b.offsetHeight/2,d=Math.max(65,Math.abs(x2-x1)*.42);
   $$(`path[data-edge-id="${id}"]`).forEach(path=>path.setAttribute('d',`M${x1} ${y1} C${x1+d} ${y1} ${x2-d} ${y2} ${x2} ${y2}`));
  });
  $$('.canvas-node').forEach(node=>node.addEventListener('pointerdown',event=>{
   if(!event.target.closest('.node-drag-strip'))return;
   const transform=$('#canvasWorld')?.style.transform||'',scale=Number(transform.match(/scale\(([^)]+)/)?.[1]||1);
   const x=event.clientX,y=event.clientY,left=parseFloat(node.style.left)||0,top=parseFloat(node.style.top)||0;
   event.preventDefault();node.setPointerCapture(event.pointerId);
   const move=e=>{node.style.left=(left+(e.clientX-x)/scale)+'px';node.style.top=(top+(e.clientY-y)/scale)+'px';drawEdges();};
   const up=()=>{node.removeEventListener('pointermove',move);node.removeEventListener('pointerup',up)};
   node.addEventListener('pointermove',move);node.addEventListener('pointerup',up);
  }));
 }
 addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='set-eye')return;setEye(!!event.data.value,event.data.activation)});
 await show(current);
 if(parent!==window)parent.postMessage({type:'preview-ready'},location.origin);
})().catch(error=>console.error('Breadmaker preview could not load',error));
