/* A short delete/retype flourish. Stable text remains available to assistive tech. */
(() => {
  const hero = document.querySelector('.hero');
  const lines = [...document.querySelectorAll('[data-type-target]')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!hero || !lines.length) return;

  const timers = new Set();
  let played = false;
  const later = (callback, delay) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
  };
  const finish = () => {
    timers.forEach(clearTimeout);
    timers.clear();
    lines.forEach(line => {
      line.textContent = line.dataset.typeTarget;
      line.nextElementSibling?.classList.remove('live');
    });
  };
  const rewrite = line => {
    const target = line.dataset.typeTarget;
    const cursor = line.nextElementSibling;
    let length = target.length;
    cursor?.classList.add('live');
    const type = () => {
      line.textContent = target.slice(0, ++length);
      if (length < target.length) later(type, 58);
      else later(() => cursor?.classList.remove('live'), 300);
    };
    const erase = () => {
      line.textContent = target.slice(0, --length);
      if (length > 0) later(erase, 32);
      else later(type, 180);
    };
    erase();
  };

  // Play once, in under five seconds; never leave ongoing animation or hidden timers.
  const observer = new IntersectionObserver(entries => {
    const visible = entries.some(entry => entry.isIntersecting);
    if (!visible) return finish();
    if (played || motion.matches || document.hidden) return;
    played = true;
    lines.forEach((line, index) => later(() => rewrite(line), 900 + index * 900));
  }, {threshold: .25});
  observer.observe(hero);
  motion.addEventListener?.('change', finish);
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });
  addEventListener('pagehide', () => { finish(); observer.disconnect(); }, {once:true});
})();
