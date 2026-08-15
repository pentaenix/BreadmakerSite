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


// Responsive manuscript-link graph. Paths are derived from the rendered card
// positions instead of hard-coded desktop coordinates, so mobile reflow keeps
// every connector attached to the correct node.
(() => {
  const graph = document.querySelector('.link-graph');
  const svg = graph?.querySelector('.link-graph-lines');
  const manuscript = graph?.querySelector('.graph-manuscript');
  if (!graph || !svg || !manuscript) return;

  const links = [
    ['.graph-canvas', '.p1', -24],
    ['.graph-map', '.p2', 24],
    ['.graph-task', '.p3', -24],
    ['.graph-note', '.p4', 24],
  ];

  const localRect = (el) => {
    const root = graph.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left - root.left,
      right: rect.right - root.left,
      top: rect.top - root.top,
      bottom: rect.bottom - root.top,
      cx: rect.left - root.left + rect.width / 2,
      cy: rect.top - root.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
    };
  };

  const redraw = () => {
    const w = graph.clientWidth;
    const h = graph.clientHeight;
    if (!w || !h) return;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const target = localRect(manuscript);
    links.forEach(([nodeSelector, pathSelector, targetOffset]) => {
      const node = graph.querySelector(nodeSelector);
      const path = graph.querySelector(pathSelector);
      if (!node || !path) return;
      const source = localRect(node);

      // Attach each line to the edge facing the manuscript. This works for the
      // desktop left/right layout and the phone top/bottom layout.
      const dx = target.cx - source.cx;
      const dy = target.cy - source.cy;
      const horizontal = Math.abs(dx) >= Math.abs(dy);
      let x1, y1, x2, y2, d;

      if (horizontal) {
        const fromLeft = dx > 0;
        x1 = fromLeft ? source.right : source.left;
        y1 = source.cy;
        x2 = fromLeft ? target.left : target.right;
        y2 = Math.max(target.top + 24, Math.min(target.bottom - 24, target.cy + targetOffset));
        const bend = Math.max(34, Math.abs(x2 - x1) * 0.48);
        const c1 = x1 + (fromLeft ? bend : -bend);
        const c2 = x2 + (fromLeft ? -bend : bend);
        d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${c1.toFixed(1)} ${y1.toFixed(1)}, ${c2.toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      } else {
        const fromTop = dy > 0;
        x1 = source.cx;
        y1 = fromTop ? source.bottom : source.top;
        x2 = Math.max(target.left + 34, Math.min(target.right - 34, target.cx + targetOffset));
        y2 = fromTop ? target.top : target.bottom;
        const bend = Math.max(30, Math.abs(y2 - y1) * 0.45);
        const c1 = y1 + (fromTop ? bend : -bend);
        const c2 = y2 + (fromTop ? -bend : bend);
        d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${x1.toFixed(1)} ${c1.toFixed(1)}, ${x2.toFixed(1)} ${c2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      }
      path.setAttribute('d', d);
    });
  };

  let raf = 0;
  const requestRedraw = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(redraw);
  };

  requestRedraw();
  window.addEventListener('load', requestRedraw, { once: true });
  window.addEventListener('resize', requestRedraw, { passive: true });
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(requestRedraw);
    ro.observe(graph);
    ro.observe(manuscript);
    links.forEach(([selector]) => {
      const el = graph.querySelector(selector);
      if (el) ro.observe(el);
    });
  }
})();
