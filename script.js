(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal once. This never gets reset by the hero typing animation.
  const revealEls = [...document.querySelectorAll('.reveal')];
  if (reducedMotion) revealEls.forEach(el => el.classList.add('visible'));
  else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .10 });
    revealEls.forEach(el => observer.observe(el));
  }

  // Hero depth only follows scroll/pointer. It never restarts when copy changes.
  const hero = document.querySelector('.hero');
  const field = document.querySelector('.thought-field');
  const heroCopy = document.querySelector('.hero-copy');
  if (!reducedMotion && hero && field && heroCopy) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const p = Math.min(1, Math.max(0, scrollY / Math.max(1, hero.offsetHeight)));
      field.style.transform = `translate3d(var(--hero-x,0px), calc(var(--hero-y,0px) - ${p * 34}px), 0)`;
      field.style.opacity = `${1 - p * .72}`;
      heroCopy.style.opacity = `${1 - p * .48}`;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive:true });
    hero.addEventListener('pointermove', e => {
      const r=hero.getBoundingClientRect();
      const x=((e.clientX-r.left)/r.width-.5)*-11;
      const y=((e.clientY-r.top)/r.height-.5)*-7;
      field.style.setProperty('--hero-x',`${x}px`);
      field.style.setProperty('--hero-y',`${y}px`);
      update();
    });
    hero.addEventListener('pointerleave',()=>{
      field.style.setProperty('--hero-x','0px');
      field.style.setProperty('--hero-y','0px');
      update();
    });
    update();
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const jitter = (base, spread=0) => base + Math.random() * spread;

  async function rewriteLoop(span, cursor, {
    firstDelay=500, deleteBase=22, typeBase=38, restMin=5000, restSpread=2500, choices=null
  }={}) {
    await sleep(firstDelay + Math.random()*250);
    let current = span.textContent;
    while (true) {
      cursor.classList.add('live');
      await sleep(jitter(180,160));
      for (let i=current.length; i>=0; i--) {
        span.textContent=current.slice(0,i);
        await sleep(jitter(deleteBase,16));
      }
      await sleep(jitter(170,160));
      let target = span.dataset.typeTarget || current;
      if (choices?.length) {
        const pool=choices.filter(x=>x!==current);
        target=pool[Math.floor(Math.random()*pool.length)] || choices[0];
      }
      for (let i=1; i<=target.length; i++) {
        span.textContent=target.slice(0,i);
        const ch=target[i-1];
        await sleep(jitter(typeBase + (/[.,!?]/.test(ch)?65:0),24));
      }
      current=target;
      span.dataset.typeTarget=target;
      await sleep(jitter(500,430));
      cursor.classList.remove('live');
      await sleep(jitter(restMin,restSpread));
    }
  }

  if (!reducedMotion) {
    const title=document.querySelector('[data-type-target="Breadmaker"]');
    const subtitle=document.querySelector('.hero-subtitle [data-type-target]');
    const subtitleLines=[
      'Writing has never been simpler.',
      'Just write.',
      'Start with a blank page.',
      'Keep the whole book together.',
      'Plan it here. Write it here.',
      'Your draft comes first.',
      'Open it. Start writing.',
      'Write first. Organize when you need to.',
      'Keep notes beside the manuscript.',
      'See the whole story at once.',
      'Plan as much or as little as you want.',
      'Your story stays on your computer.',
      'One project. The whole book.',
      'Start writing in seconds.'
    ];
    if (title) rewriteLoop(title,title.nextElementSibling,{firstDelay:550,deleteBase:24,typeBase:40,restMin:6500,restSpread:2600});
    if (subtitle) rewriteLoop(subtitle,subtitle.nextElementSibling,{firstDelay:1800,deleteBase:16,typeBase:29,restMin:3900,restSpread:2200,choices:subtitleLines});
  }

  // Tiny living edits in the orbit. Independent timers keep the field organic.
  const ambient=[
    ['.t16',['ending?','ending.','ending?']],
    ['.t9',['fix the pacing','cut this beat','fix the pacing']],
    ['.t21',['move this later','move this here?','move this later']],
    ['.t26',['what if she leaves?','what if she stays?','what if she leaves?']]
  ];
  if (!reducedMotion) ambient.forEach(([selector,states],idx)=>{
    const el=document.querySelector(selector); if(!el) return;
    let n=0;
    setInterval(()=>{
      el.animate([{opacity:.48},{opacity:0,transform:'translateY(-2px)'},{opacity:.48}],{duration:560,easing:'ease-in-out'});
      setTimeout(()=>{ n=(n+1)%states.length; el.textContent=states[n]; },270);
    },5200+idx*1350);
  });

  // Section rail is purely descriptive. Native CSS scroll snapping does the paging.
  const sections=[...document.querySelectorAll('.snap-page')];
  const rail=document.querySelector('.section-rail');
  const railNum=document.querySelector('.section-rail-number');
  const railName=document.querySelector('.section-rail-name');
  const railFill=document.querySelector('.section-rail-fill');
  const names=['INTRO','WRITE','MANUSCRIPT','CANVAS','MAPS','TASKS','LINKS','CHECKPOINTS','EDITOR’S EYE','YOURS','DOWNLOAD'];
  if (rail && sections.length) {
    const ratios=new Map();
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>ratios.set(e.target,e.intersectionRatio));
      let best=null,bestR=0;
      sections.forEach(s=>{const r=ratios.get(s)||0;if(r>bestR){best=s;bestR=r}});
      if(!best) return;
      const i=sections.indexOf(best);
      railNum.textContent=String(i+1).padStart(2,'0');
      railName.textContent=names[i]||'BREADMAKER';
      railFill?.style.setProperty('--section-progress',String((i+1)/sections.length));
      rail.classList.toggle('on',i>0&&i<sections.length-1);
    },{threshold:[0,.15,.35,.55,.75,1]});
    sections.forEach(s=>obs.observe(s));
  }

  // Editor's Eye is controlled from the landing page; embedded previews stay non-scrollable/passive.
  const eyeButton=document.getElementById('eyeToggle');
  const eyeFrame=document.getElementById('eyeFrame');
  let eyeOn=false;
  eyeButton?.addEventListener('click',()=>{
    eyeOn=!eyeOn;
    eyeFrame?.contentWindow?.postMessage({type:'set-eye',value:eyeOn},'*');
    eyeButton.textContent=eyeOn?'Return to manuscript':'Try Editor’s Eye';
  });
})();

// Preview deployment: keep the CTA in place while the application download is intentionally unavailable.
document.querySelectorAll('[data-download-placeholder]').forEach((button) => {
  button.addEventListener('click', () => {
    button.animate(
      [{ transform: 'translateY(0)' }, { transform: 'translateY(1px)' }, { transform: 'translateY(0)' }],
      { duration: 140, easing: 'ease-out' }
    );
  });
});

// Phone product previews: preserve Breadmaker's desktop UI and scale it as one
// surface instead of letting the embedded app collapse into its compact layout.
(() => {
  const PREVIEW_WIDTH = 1366;
  const phonePreview = window.matchMedia('(max-width: 760px)');
  const shells = [...document.querySelectorAll('.live-app-shell')];

  const sizePreview = (shell) => {
    const frame = shell.querySelector('.live-app-frame');
    if (!frame) return;

    if (!phonePreview.matches) {
      shell.classList.remove('mobile-preview-scaled');
      shell.style.removeProperty('--mobile-preview-scale');
      frame.style.removeProperty('width');
      frame.style.removeProperty('height');
      frame.style.removeProperty('transform');
      return;
    }

    shell.classList.add('mobile-preview-scaled');
    const scale = shell.clientWidth / PREVIEW_WIDTH;
    shell.style.setProperty('--mobile-preview-scale', String(scale));
  };

  const refreshPreviews = () => shells.forEach(sizePreview);
  refreshPreviews();

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(entries => entries.forEach(entry => sizePreview(entry.target)));
    shells.forEach(shell => observer.observe(shell));
  } else {
    window.addEventListener('resize', refreshPreviews, { passive: true });
  }

  phonePreview.addEventListener?.('change', refreshPreviews);
})();
