/* Decorative words: random appearances, no pointer tracking or content collisions. */
(() => {
  const hero = document.querySelector('.hero');
  const field = hero?.querySelector('.thought-field');
  const copy = hero?.querySelector('.hero-copy');
  if (!hero || !field || !copy) return;

  const words = [...field.querySelectorAll('.thought')];
  const header = document.querySelector('.site-header');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const live = new Map();
  let visible = true, paused = false, epoch = 0, timer = 0, layoutFrame = 0, scrollFrame = 0;
  words.forEach(word => word.setAttribute('aria-hidden', 'true'));

  const random = (min, max) => min + Math.random() * (max - min);
  const intersects = (a, b) => a.left < b.right && a.right > b.left
    && a.top < b.bottom && a.bottom > b.top;
  const expand = (r, gap) => ({left:r.left-gap, right:r.right+gap,
    top:r.top-gap, bottom:r.bottom+gap});
  const localRect = (el, root) => {
    const r = el.getBoundingClientRect();
    return {left:r.left-root.left, right:r.right-root.left,
      top:r.top-root.top, bottom:r.bottom-root.top};
  };
  const shuffle = values => {
    for (let i=values.length-1; i>0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [values[i],values[j]] = [values[j],values[i]];
    }
    return values;
  };

  function geometry() {
    const root = hero.getBoundingClientRect();
    const copyRect = localRect(copy, root);
    const gap = root.width < 760 ? 12 : 18;
    const protectedRects = [];
    for (const selector of ['.hero-logo','.hero-title','.hero-subtitle',
      '.hero-description','.hero-actions','.hero-access-note','.hero-motion-toggle','.scroll-cue']) {
      const element = hero.querySelector(selector);
      if (!element) continue;
      const r = localRect(element, root);
      // Keep decorative notes outside the full title and product-definition rows.
      if (selector === '.hero-title' || selector === '.hero-subtitle') {
        r.left = copyRect.left;
        r.right = copyRect.right;
      }
      protectedRects.push(expand(r, gap));
    }
    if (header) protectedRects.push(expand(localRect(header, root), gap));
    const margin = root.width < 760 ? 12 : 20;
    return {root, protectedRects, bounds:{
      left:margin, right:root.width-margin,
      top:Math.max(margin,-root.top+margin),
      bottom:Math.min(root.height-margin,innerHeight-root.top-margin)
    }};
  }

  function remove(word) {
    const entry = live.get(word);
    live.delete(word);
    entry?.animation?.cancel();
    word.classList.remove('is-placed');
    word.style.removeProperty('opacity');
  }

  function clear() {
    epoch++;
    clearTimeout(timer);
    cancelAnimationFrame(layoutFrame);
    timer = layoutFrame = 0;
    [...live.keys()].forEach(remove);
  }

  function validate() {
    if (!live.size) return;
    const {root, protectedRects, bounds} = geometry();
    const accepted = [];
    for (const word of [...live.keys()]) {
      const r = localRect(word, root);
      if (r.left < bounds.left || r.right > bounds.right
          || r.top < bounds.top || r.bottom > bounds.bottom
          || protectedRects.some(p => intersects(r,p))
          || accepted.some(p => intersects(r,p))) remove(word);
      else accepted.push(expand(r,8));
    }
  }

  function place(word, state, occupied) {
    const measured = word.getBoundingClientRect();
    const {bounds, protectedRects} = state;
    const maxX = bounds.right-measured.width;
    const maxY = bounds.bottom-measured.height;
    if (maxX < bounds.left || maxY < bounds.top) return false;
    for (let attempt=0; attempt<180; attempt++) {
      const left = Math.round(random(bounds.left,maxX));
      const top = Math.round(random(bounds.top,maxY));
      const r = {left,top,right:left+measured.width,bottom:top+measured.height};
      if (protectedRects.some(p => intersects(r,p)) || occupied.some(p => intersects(r,p))) continue;
      word.style.left = `${left}px`;
      word.style.top = `${top}px`;
      word.classList.add('is-placed');
      const placedEpoch = epoch;
      const entry = {animation:null};
      live.set(word,entry);
      occupied.push(expand(r,8));
      if (motion.matches || !word.animate) word.style.opacity = '1';
      else {
        const duration = random(7000,13000);
        entry.animation = word.animate([
          {opacity:0}, {opacity:1,offset:.18},
          {opacity:1,offset:.7}, {opacity:0}
        ],{duration,easing:'ease-in-out',fill:'both'});
        entry.animation.currentTime = random(0,duration*.5);
        entry.animation.onfinish = () => {
          if (epoch === placedEpoch && live.get(word) === entry) remove(word);
        };
      }
      return true;
    }
    return false;
  }

  function pulse() {
    timer = 0;
    if (!visible || paused || document.hidden) return;
    validate();
    const state = geometry();
    const limit = state.root.width >= 1100 ? 11 : state.root.width >= 760 ? 8 : 5;
    const occupied = [...live.keys()].map(word => expand(localRect(word,state.root),8));
    for (const word of shuffle(words.filter(word => !live.has(word)))) {
      if (live.size >= limit) break;
      place(word,state,occupied);
    }
    if (!motion.matches) timer = setTimeout(pulse,random(850,1600));
  }

  function relayout() {
    // Hide stale placements synchronously before a resized layout can be painted.
    clear();
    layoutFrame = requestAnimationFrame(() => {layoutFrame=0;pulse();});
  }

  addEventListener('resize',relayout,{passive:true});
  window.visualViewport?.addEventListener('resize',relayout,{passive:true});
  addEventListener('scroll',() => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(() => {scrollFrame=0;validate();});
  },{passive:true});
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(relayout);
    [hero,copy,header,...words].filter(Boolean).forEach(el => observer.observe(el));
  }
  // Recheck changing text before paint without restarting notes for every typed letter.
  new MutationObserver(validate).observe(copy,{subtree:true,childList:true,characterData:true});
  new MutationObserver(relayout).observe(field,{subtree:true,childList:true,characterData:true});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) relayout(); else clear();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange',() => {if(document.hidden) clear();else relayout();});
  motion.addEventListener?.('change',relayout);
  document.addEventListener('breadmaker-motion-change',event => {paused=event.detail.paused;if(paused)clear();else relayout();});
  if (document.fonts) {
    document.fonts.ready.then(relayout);
    document.fonts.addEventListener?.('loadingdone',relayout);
  }
  relayout();
})();
