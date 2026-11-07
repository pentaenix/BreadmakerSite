/* Local-only guide search. The visible HTML is the source of truth for the index. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BreadmakerGuideSearch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const stop = new Set('a an and are as at be can do does for from how i in is it its me my of on or please the this to use using want what where with would you your get make'.split(' '));
  const groups = [
    ['narration', 'narrate', 'narrating', 'listen', 'listening', 'speech', 'tts'],
    ['audio', 'sound', 'recording', 'recordings'],
    ['voice', 'voices', 'narrator'],
    ['import', 'importing', 'upload', 'uploading'],
    ['export', 'exporting', 'download', 'downloading'],
    ['recover', 'recovery', 'restore', 'restoring', 'lost'],
    ['backup', 'backups'], ['checkpoint', 'checkpoints', 'snapshot', 'snapshots'],
    ['task', 'tasks', 'todo', 'checklist'], ['target', 'targets', 'goal', 'goals'],
    ['review', 'reviews', 'reviewer', 'reviewers', 'feedback'],
    ['image', 'images', 'picture', 'pictures', 'photo', 'photos', 'illustration'],
    ['language', 'languages', 'translate', 'translation'],
    ['writing', 'draft', 'prose'], ['chapter', 'chapters'], ['scene', 'scenes'], ['tab', 'tabs', 'document', 'documents'],
    ['marker', 'markers', 'highlight', 'highlights'], ['note', 'notes', 'comment', 'comments'],
    ['canvas', 'brainstorm', 'mindmap'], ['map', 'maps', 'timeline'],
    ['cut', 'cuts', 'scraps'], ['format', 'formatting'], ['wordcount', 'count'],
    ['speed', 'fast', 'faster', 'slow', 'slower'], ['colour', 'color']
  ];
  const synonyms = new Map(groups.flatMap(group => group.map(word => [word, group[0]])));
  function normalize(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/read (?:out )?(?:a ?)?loud/g, 'narration').replace(/text[ -]to[ -]speech/g, 'narration')
      .replace(/back[ -]up/g, 'backup').replace(/to[ -]do/g, 'todo').replace(/side[ -]by[ -]side/g, 'split view')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function tokens(value) { return normalize(value).split(/\s+/).filter(Boolean).map(word => synonyms.get(word) || word); }
  function distance(a, b) {
    // Optimal-string-alignment distance includes common transposed-key typos.
    const rows = Array.from({length: a.length + 1}, () => Array(b.length + 1));
    for (let i = 0; i <= a.length; i++) rows[i][0] = i;
    for (let j = 0; j <= b.length; j++) rows[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
    }
    return rows[a.length][b.length];
  }
  function index(documents) {
    return documents.map((doc, order) => ({...doc, order, fields: [
      [tokens(doc.title), 8], [tokens(doc.keywords), 6], [tokens(doc.summary), 4], [tokens(doc.body), 1]
    ]}));
  }
  function match(query, word, fuzzy) {
    if (query === word) return 1;
    if (query.length >= 3 && word.startsWith(query)) return .8;
    const limit = query.length >= 8 ? 2 : query.length >= 4 ? 1 : 0;
    if (fuzzy && limit && Math.abs(query.length - word.length) <= limit && distance(query, word) <= limit) return .6;
    return 0;
  }
  function search(documents, input) {
    const query = [...new Set(tokens(String(input).slice(0, 200)).filter(word => !stop.has(word)))].slice(0, 16);
    if (!query.length) return [];
    const vocabulary = new Set(documents.flatMap(doc => doc.fields.flatMap(([words]) => words)));
    const fuzzy = query.map(term => ![...vocabulary].some(word => match(term, word, false)));
    return documents.map(doc => {
      const scores = query.map((term, i) => Math.max(...doc.fields.map(([words, weight]) => Math.max(0, ...words.map(word => match(term, word, fuzzy[i]))) * weight)));
      const matched = scores.filter(Boolean).length;
      const coverage = matched / query.length;
      const score = scores.reduce((a, b) => a + b, 0) * coverage + (coverage === 1 ? 16 : 0);
      return {...doc, score, matched};
    }).filter(doc => doc.matched >= Math.max(1, Math.ceil(query.length * .6)))
      .sort((a, b) => b.score - a.score || a.order - b.order);
  }
  return {index, search, normalize, distance};
});
