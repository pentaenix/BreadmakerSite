(() => {
  'use strict';
  const engine = window.BreadmakerGuideSearch;
  const input = document.querySelector('#guide-search-input');
  if (!engine || !input) return;
  const form = document.querySelector('#search');
  const results = document.querySelector('#guide-search-results');
  const status = document.querySelector('#guide-search-status');
  const clear = document.querySelector('#guide-search-clear');
  const select = document.querySelector('#guide-topic-select');
  const sections = [...document.querySelectorAll('[data-guide-topic]')];
  const documents = engine.index(sections.map(section => ({
    id: section.id, title: section.dataset.guideTopic, summary: section.dataset.guideSummary,
    group: section.dataset.guideGroup, keywords: section.dataset.guideKeywords, body: section.textContent
  })));
  for (const doc of documents) {
    const option = document.createElement('option');
    option.value = doc.id; option.textContent = doc.title; select.append(option);
    const back = document.createElement('a');
    back.href = '#top'; back.className = 'guide-back-top'; back.textContent = 'All topics ↑';
    document.getElementById(doc.id).querySelector('.guide-copy').append(back);
  }
  function reveal(id) {
    const section = document.getElementById(id);
    if (!section) return;
    section.classList.add('visible');
    const heading = section.querySelector('h2');
    if (heading) { heading.tabIndex = -1; requestAnimationFrame(() => heading.focus({preventScroll: true})); }
  }
  function render(saveURL = true) {
    const query = input.value.trim();
    clear.hidden = !query; results.replaceChildren(); results.hidden = !query;
    if (!query) status.textContent = 'Browse all ' + documents.length + ' topics below.';
    else {
      const matches = engine.search(documents, query);
      status.textContent = matches.length ? matches.length + (matches.length === 1 ? ' topic found.' : ' topics found.') : 'No close matches. Try a shorter phrase, or browse all topics below.';
      for (const doc of matches) {
        const item = document.createElement('li'), link = document.createElement('a');
        link.href = '#' + doc.id;
        const label = document.createElement('strong'), summary = document.createElement('span'), group = document.createElement('small');
        label.textContent = doc.title; summary.textContent = doc.summary; group.textContent = doc.group;
        link.append(group, label, summary); item.append(link); results.append(item);
      }
    }
    if (saveURL) {
      const url = new URL(location.href);
      if (query) url.searchParams.set('q', query); else url.searchParams.delete('q');
      history.replaceState(null, '', url);
    }
  }
  input.addEventListener('input', () => render());
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); input.value = ''; render(); }
    if (event.key === 'ArrowDown') { const first = results.querySelector('a'); if (first) { event.preventDefault(); first.focus(); } }
    if (event.key === 'Enter') { const first = results.querySelector('a'); if (first) { event.preventDefault(); first.click(); } }
  });
  clear.addEventListener('click', () => { input.value = ''; render(); input.focus(); });
  document.querySelectorAll('[data-guide-query]').forEach(button => button.addEventListener('click', () => {
    input.value = button.dataset.guideQuery; render(); input.focus();
  }));
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link) reveal(link.hash.slice(1));
  });
  select.addEventListener('change', () => {
    if (!select.value) return;
    location.hash = select.value; reveal(select.value); select.value = '';
  });
  const findLink = document.querySelector('#guide-find-link');
  findLink.addEventListener('click', () => requestAnimationFrame(() => input.focus({preventScroll: true})));
  function fromURL() { input.value = (new URL(location.href).searchParams.get('q') || '').slice(0, 200); render(false); }
  window.addEventListener('popstate', fromURL);
  form.hidden = false; select.hidden = false; findLink.hidden = false;
  fromURL();
})();
