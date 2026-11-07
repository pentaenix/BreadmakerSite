/* One guide at a time. Plain anchors and complete HTML remain usable without JS. */
(() => {
  const home = document.querySelector('.guide-hero');
  const sections = [...document.querySelectorAll('[data-guide-topic]')];
  const nav = document.querySelector('#guide-article-nav');
  const back = document.querySelector('#guide-back-link');
  const group = document.querySelector('#guide-current-group');
  const input = document.querySelector('#guide-search-input');
  if (!home || !nav || !sections.length) return;
  const topics = new Map(sections.map(section => [section.id, section]));
  const baseTitle = document.title;
  let returnFocus = null;
  document.documentElement.classList.add('guide-reader');
  function show(focus = true) {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { id = ''; }
    const current = topics.get(id);
    home.hidden = !!current;
    nav.hidden = !current;
    sections.forEach(section => {
      section.hidden = section !== current;
      if (section.hidden) section.querySelectorAll('video').forEach(video => video.pause());
    });
    document.title = current ? current.dataset.guideTopic + ' · Breadmaker Guide' : baseTitle;
    if (current) {
      current.classList.add('visible');
      group.textContent = current.dataset.guideGroup;
      back.textContent = input?.value.trim() ? '← Search results' : '← All topics';
    }
    if (focus) {
      const previous = returnFocus?.isConnected ? returnFocus : null;
      const target = current?.querySelector('h2') || (id === 'search' ? input : previous) || (input?.value.trim() ? input : null) || home.querySelector('h1');
      if (target) { if (!target.matches('a,input,button')) target.tabIndex=-1; target.focus({preventScroll:true}); }
      window.scrollTo({top:0,behavior:'instant'});
    }
  }
  document.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.hash.slice(1);
    if (!topics.has(id) && !['top','search'].includes(id)) return;
    if (link.closest('.guide-hero')) returnFocus=link;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    show();
  });
  window.addEventListener('popstate', () => show());
  window.addEventListener('hashchange', () => show());
  show(!!location.hash);
})();
