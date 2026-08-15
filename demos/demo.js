(() => {
  const $ = (s, p=document) => p.querySelector(s);
  const $$ = (s, p=document) => [...p.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);
  let current = params.get('view') || 'manuscript';

  function setView(name){
    current=name;
    $$('.view').forEach(v=>v.classList.toggle('active',v.id===`${name}View`));
    $$('.main-tab').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  }
  $$('.main-tab').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  setView(current);

  if(params.get('projectcenter')==='1') document.getElementById('demoProjectCenter')?.classList.remove('hidden');
  if(params.get('newproject')==='1') document.getElementById('demoNewProject')?.classList.remove('hidden');

  $('#themeBtn')?.addEventListener('click',()=>{
    const dark=document.documentElement.dataset.theme==='dark';
    document.documentElement.dataset.theme=dark?'light':'dark';
  });

  $('#toggleRail')?.addEventListener('click',()=>$('#canvasRail')?.classList.toggle('collapsed'));
  $('#toggleMapRail')?.addEventListener('click',()=>$('#mapRail')?.classList.toggle('collapsed'));

  const checkpointBtn=$('#checkpointBtn'), checkpointPanel=$('#checkpointPanel'), split=$('#splitPane'), compareBar=$('#checkpointCompareToolbar');
  function setCheckpoint(open){checkpointPanel?.classList.toggle('hidden',!open);checkpointPanel?.classList.toggle('demo-open',open);checkpointBtn?.classList.toggle('active',open)}
  function setCompare(open){split?.classList.toggle('hidden',!open);split?.classList.toggle('demo-open',open);compareBar?.classList.toggle('hidden',!open);compareBar?.classList.toggle('demo-open',open)}
  checkpointBtn?.addEventListener('click',()=>setCheckpoint(checkpointPanel.classList.contains('hidden')));
  $('#closeCheckpointPanel')?.addEventListener('click',()=>setCheckpoint(false));
  $('#demoCompare')?.addEventListener('click',()=>setCompare(true));
  // Every preview starts from a clean manuscript state. Checkpoint UI is only
  // opened deliberately by the dedicated Checkpoints landing-page section.
  setCheckpoint(false);
  setCompare(false);
  if(params.get('checkpoint')==='1') setCheckpoint(true);
  if(params.get('compare')==='1' && params.get('checkpoint')==='1') setCompare(true);

  const eyeBtn=$('#editorsEyeBtn'), scroller=$('#documentScroller');
  function eyeWave(on){
    const wave=document.createElement('div'); wave.className=`editors-eye-wave ${on?'wave-on':'wave-off'}`;
    const r=scroller.getBoundingClientRect(); Object.assign(wave.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});
    document.body.appendChild(wave); setTimeout(()=>wave.remove(),520);
  }
  function setEye(on){
    eyeBtn?.classList.toggle('active',on); eyeBtn?.setAttribute('aria-pressed',String(on)); eyeWave(on);
    setTimeout(()=>scroller?.classList.toggle('editors-eye-active',on),150);
  }
  eyeBtn?.addEventListener('click',()=>setEye(!eyeBtn.classList.contains('active')));
  if(params.get('eye')==='1') setTimeout(()=>setEye(true),350);

  // Canvas demo: the cards are genuine Breadmaker node markup, with a lightweight demo-only drag.
  const nodePositions={1:[140,160],2:[565,275],3:[1030,125],4:[1035,485],5:[180,525]};
  const edgeDefs=[ [1,2,'1'],[2,3,'2'],[2,4,'3'],[5,2,'4'] ];
  function point(node,side){const x=parseFloat(node.style.left),y=parseFloat(node.style.top),w=node.offsetWidth,h=node.offsetHeight;return side==='left'?[x,y+h/2]:[x+w,y+h/2]}
  function drawEdges(){edgeDefs.forEach(([a,b,id])=>{const A=$(`[data-demo-node="${a}"]`),B=$(`[data-demo-node="${b}"]`),P=$(`[data-edge="${id}"]`);if(!A||!B||!P)return;const [x1,y1]=point(A,'right'),[x2,y2]=point(B,'left'),d=Math.max(65,Math.abs(x2-x1)*.42);P.setAttribute('d',`M${x1} ${y1} C${x1+d} ${y1} ${x2-d} ${y2} ${x2} ${y2}`)})}
  $$('.canvas-node .node-drag-strip').forEach(strip=>strip.addEventListener('pointerdown',e=>{const node=strip.closest('.canvas-node');e.preventDefault();const sx=e.clientX,sy=e.clientY,ox=parseFloat(node.style.left),oy=parseFloat(node.style.top);strip.setPointerCapture?.(e.pointerId);const move=ev=>{node.style.left=`${Math.max(0,ox+ev.clientX-sx)}px`;node.style.top=`${Math.max(0,oy+ev.clientY-sy)}px`;drawEdges()};const up=()=>{strip.removeEventListener('pointermove',move);strip.removeEventListener('pointerup',up)};strip.addEventListener('pointermove',move);strip.addEventListener('pointerup',up)}));
  requestAnimationFrame(drawEdges);

  function selectMapLine(id){$$('[data-map-line]').forEach(r=>r.classList.toggle('demo-selected',r.dataset.mapLine===id));$$('[data-map-group]').forEach(g=>{const match=g.dataset.mapGroup===id;g.classList.toggle('selected',match);g.classList.toggle('dim',!match)})}
  $$('[data-map-line]').forEach(r=>r.addEventListener('click',()=>selectMapLine(r.dataset.mapLine)));
  $$('[data-map-group]').forEach(g=>g.addEventListener('click',()=>selectMapLine(g.dataset.mapGroup)));

  $$('.task-row input[type="checkbox"]').forEach(cb=>cb.addEventListener('change',()=>cb.closest('.task-row').classList.toggle('is-done',cb.checked)));
})();

addEventListener('message', event => {
  if(event.data?.type==='set-eye'){
    const btn=document.getElementById('editorsEyeBtn');
    const scroller=document.getElementById('documentScroller');
    const on=!!event.data.value;
    btn?.classList.toggle('active',on); btn?.setAttribute('aria-pressed',String(on));
    if(scroller){
      const wave=document.createElement('div'); wave.className=`editors-eye-wave ${on?'wave-on':'wave-off'}`;
      const r=scroller.getBoundingClientRect(); Object.assign(wave.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});
      document.body.appendChild(wave); setTimeout(()=>wave.remove(),520);
      setTimeout(()=>scroller.classList.toggle('editors-eye-active',on),150);
    }
  }
});
