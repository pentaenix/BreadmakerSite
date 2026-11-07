(() => {
  'use strict';
  const engine = window.BreadmakerGuideSearch;
  const input = document.querySelector('#guide-search-input');
  if (!engine || !input) return;
  const form = document.querySelector('#search');
  const results = document.querySelector('#guide-search-results');
  const status = document.querySelector('#guide-search-status');
  const clear = document.querySelector('#guide-search-clear');
  const browse = document.querySelector('#guide-browse');
  const sections = [...document.querySelectorAll('[data-guide-topic]')];
  const documents = engine.index(sections.map(section => ({
    id: section.id, title: section.dataset.guideTopic, summary: section.dataset.guideSummary,
    group: section.dataset.guideGroup, keywords: section.dataset.guideKeywords, body: section.textContent
  })));
  function render(saveURL = true) {
    const query = input.value.trim();
    clear.hidden = !query; results.replaceChildren(); results.hidden = !query;
    browse.hidden = !!query;
    if (!query) status.textContent = '';
    else {
      const matches = engine.search(documents, query);
      status.textContent = matches.length ? matches.length + (matches.length === 1 ? ' topic found.' : ' topics found.') : 'No matches yet. Try a shorter phrase, or clear the search to browse topics.';
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
  function fromURL() { input.value = (new URL(location.href).searchParams.get('q') || '').slice(0, 200); render(false); }
  window.addEventListener('popstate', fromURL);
  form.hidden = false;
  fromURL();
})();
