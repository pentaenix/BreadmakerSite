/* Dependency-free behavior checks for focused guides and accessible navigation. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('guide/navigation.js', 'utf8');
function setup(hash = '', query = '') {
  const documentEvents = {}, windowEvents = {}, pushes = [];
  let active = null, scrolls = 0;
  const node = (tag = 'div', props = {}) => ({hidden:false, isConnected:true, tag,
    classList:{add(){}}, matches(selector){return selector.split(',').includes(tag);},
    focus(){active=this;}, ...props});
  const title = node('h1'), input = node('input', {value:query}), back = node('a'), group = node();
  const home = node('section', {querySelector(){return title;}}), nav = node('nav');
  const sections = ['write','narration','checkpoints'].map(id => {
    const heading = node('h2');
    const video = {pauses:0,pause(){this.pauses++;}};
    return node('section', {id, dataset:{guideTopic:id,guideGroup:'Writing'},heading,video,
      querySelector(){return heading;},querySelectorAll(){return [video];}});
  });
  const nodes = {'.guide-hero':home,'#guide-article-nav':nav,'#guide-back-link':back,'#guide-current-group':group,'#guide-search-input':input};
  const location = {hash};
  const document = {title:'Breadmaker Guide',documentElement:node('html'),
    querySelector:selector=>nodes[selector],querySelectorAll:()=>sections,
    addEventListener:(name,callback)=>documentEvents[name]=callback};
  const window = {addEventListener:(name,callback)=>windowEvents[name]=callback,scrollTo(){scrolls++;}};
  vm.runInNewContext(source,{document,window,location,history:{pushState(state,title,hash){location.hash=hash;pushes.push(hash);}}});
  function click(id, options = {}) {
    const link = node('a', {hash:'#'+id,closest:()=>options.fromHome === false ? null : home});
    let prevented = false;
    documentEvents.click({button:0,target:{closest:()=>link},preventDefault(){prevented=true;},...options});
    return {link,prevented};
  }
  return {home,nav,input,back,group,sections,location,document,click,pushes,windowEvents,
    active:()=>active,scrolls:()=>scrolls,visible:()=>sections.filter(s=>!s.hidden).map(s=>s.id)};
}
let page = setup();
assert.deepEqual(page.visible(), []); assert.equal(page.home.hidden, false); assert.equal(page.nav.hidden, true);
const writeLink = page.click('write').link;
assert.deepEqual(page.visible(), ['write']); assert.equal(page.home.hidden, true); assert.equal(page.nav.hidden, false);
assert.equal(page.active(),page.sections[0].heading); assert.equal(page.document.title,'write · Breadmaker Guide');
assert.equal(page.back.textContent,'← All topics'); assert.ok(page.sections[1].video.pauses > 0);
page.click('top',{fromHome:false}); assert.deepEqual(page.visible(),[]); assert.equal(page.active(),writeLink);
page.click('narration',{ctrlKey:true}); assert.deepEqual(page.visible(),[]);
assert.equal(page.click('unknown').prevented,false);
page = setup('#narration','read aloud');
assert.deepEqual(page.visible(),['narration']); assert.equal(page.back.textContent,'← Search results');
page.click('search',{fromHome:false}); assert.equal(page.active(),page.input);
const result = page.click('write').link;
result.isConnected=false; page.location.hash='#top'; page.windowEvents.popstate();
assert.equal(page.active(),page.input,'Removed search result must not receive focus on Back');
assert.deepEqual(page.visible(),[]); assert.equal(page.home.hidden,false);
page.location.hash='#checkpoints'; page.windowEvents.hashchange(); assert.deepEqual(page.visible(),['checkpoints']);
page.location.hash='#%E0%A4%A'; page.windowEvents.hashchange(); assert.deepEqual(page.visible(),[]);
assert.ok(page.scrolls()>0);
console.log('OK: one guide at a time, deep links, back/search focus, modified clicks, hidden video pause, and history navigation.');
