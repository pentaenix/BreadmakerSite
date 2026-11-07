(()=>{
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const reduced=motion.matches;
  if(!reduced) document.documentElement.classList.add('has-reveals');
  const steps=[...document.querySelectorAll('.guide-step,.guide-overview')];
  if(reduced){steps.forEach(e=>e.classList.add('visible'))}else{
    const o=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');o.unobserve(entry.target)}}),{threshold:.12});
    steps.forEach(e=>o.observe(e));
  }

  const videos=[...document.querySelectorAll('[data-guide-loop]')];
  const playing = new Map();
  const syncVideo = video => {
    video.controls=motion.matches; video.loop=!motion.matches; video.preload='metadata';
    if (!motion.matches && playing.get(video) && !document.hidden && !video.closest('[hidden]')) video.play().catch(()=>{});
    else video.pause();
  };
  const vo=new IntersectionObserver(entries=>entries.forEach(entry=>{
    playing.set(entry.target,entry.isIntersecting);syncVideo(entry.target);
  }),{threshold:.35});
  videos.forEach(video=>{syncVideo(video);vo.observe(video)});
  motion.addEventListener?.('change',()=>videos.forEach(syncVideo));
  document.addEventListener('visibilitychange',()=>videos.forEach(syncVideo));

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

// Scale the real captured Reviews interface within its existing presentation frame.
(() => {
 const frame=document.querySelector('.guide-app-preview');
 if(!frame)return;
 const fit=()=>{frame.querySelector('iframe').style.transform=`scale(${frame.clientWidth/1366})`};
 new ResizeObserver(fit).observe(frame);fit();
})();
