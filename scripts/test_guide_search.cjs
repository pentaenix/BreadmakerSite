/* Dependency-free behavior tests; run with node scripts/test_guide_search.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {index, search, distance} = require('../guide/search-engine.js');
const html = fs.readFileSync(path.join(__dirname, '../guide/index.html'), 'utf8');
const decode = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
const docs = [...html.matchAll(/<section\b([^>]*data-guide-topic[^>]*)>([\s\S]*?)<\/section>/g)].map(([, attributes, body]) => {
  const attr = key => decode(attributes.match(new RegExp('(?:^|\\s)' + key + '="([^"]*)"'))?.[1] || '');
  return {id: attr('id'), title: attr('data-guide-topic'), group: attr('data-guide-group'), summary: attr('data-guide-summary'), keywords: attr('data-guide-keywords'), body: decode(body.replace(/<[^>]*>/g, ' '))};
});
const indexed = index(docs);
assert.equal(docs.length, 28);
assert.equal(new Set(docs.map(doc => doc.id)).size, docs.length);
for (const doc of docs) {
  assert.ok(doc.id && doc.title && doc.summary && doc.keywords && doc.group);
  assert.ok(html.includes('href="#' + doc.id + '"'), 'Missing table-of-contents link: ' + doc.id);
  assert.equal(search(indexed, doc.title)[0].id, doc.id, 'Exact title ranking: ' + doc.id);
}
const cases = [
  ['narration', 'narration'], ['naration', 'narration'], ['narraiton', 'narration'], ['narrat', 'narration'],
  ['how do I read out loud', 'narration'], ['text to speech', 'narration'], ['listen to my book', 'narration'],
  ['download audio', 'audio-export'], ['export wav', 'audio-export'], ['audiobook mp3', 'audio-export'],
  ['change voice', 'voices'], ['voice pitch', 'voices'], ['narrator speed', 'voices'],
  ['import Word', 'import'], ['improt docx', 'import'], ['upload manuscript', 'import'],
  ['PDF', 'export'], ['export writing', 'export'], ['recover a draft', 'history'],
  ['lost writing', 'history'], ['backups', 'backups'], ['back up my book', 'backups'], ['Google Drive backup', 'backups'], ['undo', 'history'],
  ['beta reader', 'reviews'], ['feedback', 'reviews'], ['to do', 'tasks'],
  ['writing goals', 'targets'], ['word count goal', 'targets'], ['pictures', 'images'],
  ['nàrràtion', 'narration'], ['find replace', 'find'], ['side by side', 'focus'],
  ['dark theme', 'formatting'], ['change language', 'languages'], ['brainstorm', 'plan']
];
const failures = cases.filter(([query, expected]) => search(indexed, query)[0]?.id !== expected).map(([query, expected]) => ({query, expected, actual: search(indexed, query).slice(0,3).map(d => [d.id,d.score])}));
assert.deepEqual(failures, [], 'Search ranking regressions');
assert.equal(distance('improt', 'import'), 1);
for (const query of ['', '   ', 'how do I', 'zzzzzzzzqqqq', '<script>alert(987654321)</script>']) assert.equal(search(indexed, query).length, 0, query);
assert.ok(search(indexed, 'narration '.repeat(1000)).length);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML id');
for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(anchor), 'Missing anchor: ' + anchor);
assert.equal((html.match(/data-guide-loop/g) || []).length, 8, 'Keep eight original videos');
assert.equal((html.match(/<track kind="captions"/g) || []).length, 8, 'Keep all captions');
console.log('OK: 28 indexed topics, 36 search cases, every topic title, anchors, and original video/caption coverage.');
