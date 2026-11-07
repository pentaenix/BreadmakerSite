(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion) document.documentElement.classList.add('has-reveals');

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

  // The organic, collision-aware hero word field is owned by hero-notes.js.

  // Hero typing is isolated in hero-typing.js; the workflow copy stays visible.

  // Section rail is purely descriptive. Native CSS scroll snapping does the paging.
  const sections=[...document.querySelectorAll('.snap-page')];
  const rail=document.querySelector('.section-rail');
  const railNum=document.querySelector('.section-rail-number');
  const railName=document.querySelector('.section-rail-name');
  const railFill=document.querySelector('.section-rail-fill');
  const names=['INTRO','WORKFLOW','CANVAS','MAPS','LINKS','MANUSCRIPT','TASKS','CHECKPOINTS','EDITOR’S EYE','REVIEWS','YOURS','QUESTIONS','DOWNLOAD'];
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

  // Keep the external control synchronized even if the lazy iframe is still loading.
  const eyeButton=document.getElementById('eyeToggle');
  const eyeFrame=document.getElementById('eyeFrame');
  let eyeOn=false,eyeActivation=0;
  const syncEye=()=>eyeFrame?.contentWindow?.postMessage({type:'set-eye',value:eyeOn,activation:eyeActivation},location.origin);
  eyeFrame?.addEventListener('load',syncEye);
  addEventListener('message',event=>{
    if(event.origin===location.origin&&event.source===eyeFrame?.contentWindow&&event.data?.type==='preview-ready')syncEye();
  });
  eyeButton?.addEventListener('click',()=>{
    eyeOn=!eyeOn;
    if(eyeOn)eyeActivation++;
    eyeButton.setAttribute('aria-pressed',String(eyeOn));
    eyeButton.textContent=eyeOn?'Return to manuscript':'Try Editor’s Eye';
    syncEye();
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
    const trunk = graph.querySelector('.graph-trunk');
    if (getComputedStyle(graph).display === 'grid') {
      const railX = Math.max(12, target.left - 22);
      let bottom = target.cy;
      links.forEach(([nodeSelector, pathSelector]) => {
        const node = graph.querySelector(nodeSelector);
        const path = graph.querySelector(pathSelector);
        if (!node || !path) return;
        const source = localRect(node);
        bottom = Math.max(bottom, source.cy);
        path.setAttribute('d', `M ${source.left.toFixed(1)} ${source.cy.toFixed(1)} H ${railX.toFixed(1)}`);
      });
      trunk?.setAttribute('d', `M ${railX.toFixed(1)} ${bottom.toFixed(1)} V ${target.cy.toFixed(1)} H ${target.left.toFixed(1)}`);
      return;
    }
    trunk?.setAttribute('d', '');
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
