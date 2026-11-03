(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduced) document.documentElement.classList.add('has-reveals');
  const steps=[...document.querySelectorAll('.guide-step,.guide-overview')];
  if(reduced){steps.forEach(e=>e.classList.add('visible'))}else{
    const o=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');o.unobserve(entry.target)}}),{threshold:.12});
    steps.forEach(e=>o.observe(e));
  }

  const videos=[...document.querySelectorAll('[data-guide-loop]')];
  if(reduced){videos.forEach(v=>{v.controls=true;v.loop=false;v.preload='metadata'});return}
  videos.forEach(v=>{v.loop=true;v.pause();});
  const vo=new IntersectionObserver(entries=>entries.forEach(entry=>{
    const v=entry.target;
    if(entry.isIntersecting){v.play().catch(()=>{})}
    else{v.pause();try{v.currentTime=0}catch{}}
  }),{threshold:.35});
  videos.forEach(v=>vo.observe(v));
})();

// Preview deployment: download controls are intentionally inert until Breadmaker is ready to ship.
document.querySelectorAll('[data-download-placeholder]').forEach((button) => {
  button.addEventListener('click', () => {
    button.animate(
      [{ transform: 'translateY(0)' }, { transform: 'translateY(1px)' }, { transform: 'translateY(0)' }],
      { duration: 140, easing: 'ease-out' }
    );
  });
});
