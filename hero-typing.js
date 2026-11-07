/* Recurring delete/retype, paused offscreen, in hidden tabs, or by the reader. */
(() => {
  const hero = document.querySelector('.hero');
  const lines = [...document.querySelectorAll('[data-type-target]')];
  const button = document.querySelector('#hero-motion-toggle');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!hero || !lines.length) return;
  const timers = new Set();
  const states = lines.map(line => ({line, index:0, text:line.dataset.typeTarget,
    choices:(line.dataset.typeOptions || line.dataset.typeTarget).split('|')}));
  let visible = false, paused = false, running = false, gone = false;
  const later = (callback, delay) => {
    const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
    timers.add(timer);
  };
  function stop() {
    timers.forEach(clearTimeout); timers.clear(); running = false;
    states.forEach(state => {
      state.line.textContent = state.text;
      state.line.nextElementSibling?.classList.remove('live');
    });
  }
  function rewrite(state) {
    const {line, choices} = state;
    const previous = line.textContent;
    state.index = (state.index + 1) % choices.length;
    const target = state.text = choices[state.index];
    const cursor = line.nextElementSibling;
    let length = previous.length;
    cursor?.classList.add('live');
    function type() {
      line.textContent = target.slice(0, ++length);
      if (length < target.length) later(type, 46);
      else {
        later(() => cursor?.classList.remove('live'), 250);
        later(() => rewrite(state), 4300);
      }
    }
    function erase() {
      line.textContent = previous.slice(0, --length);
      if (length > 0) later(erase, 26);
      else later(type, 140);
    }
    erase();
  }
  function sync() {
    if (button) button.hidden = motion.matches;
    if (gone || !visible || paused || motion.matches || document.hidden) return stop();
    if (running) return;
    running = true;
    states.forEach((state, index) => later(() => rewrite(state), 2000 + index * 600));
  }
  button?.addEventListener('click', () => {
    paused = !paused;
    button.setAttribute('aria-pressed', String(paused));
    button.textContent = paused ? 'Play animation' : 'Pause animation';
    document.dispatchEvent(new CustomEvent('breadmaker-motion-change', {detail:{paused}}));
    sync();
  });
  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting); sync();
  }, {threshold:.25});
  observer.observe(hero);
  motion.addEventListener?.('change', sync);
  document.addEventListener('visibilitychange', sync);
  addEventListener('pagehide', () => {gone=true;stop();});
  addEventListener('pageshow', () => {gone=false;sync();});
})();
