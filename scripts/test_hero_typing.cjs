// Dependency-free behavior tests: fake time, real animation module.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'hero-typing.js'), 'utf8');
function setup(reduced = false) {
  let now = 0, id = 0, observer, disconnected = false;
  const timers = new Map(), events = {}, motionEvents = {};
  const lines = ['Breadmaker', 'A writing app.'].map(target => {
    const classes = new Set();
    return {textContent: target, dataset:{typeTarget:target}, nextElementSibling:{classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}}, classes};
  });
  const document = {hidden:false,querySelector:()=>({}),querySelectorAll:()=>lines,addEventListener:(name,fn)=>events[name]=fn};
  const motion = {matches:reduced,addEventListener:(name,fn)=>motionEvents[name]=fn};
  vm.runInNewContext(source, {document,matchMedia:()=>motion,
    setTimeout:(fn,delay)=>{timers.set(++id,{fn,time:now+delay});return id;},
    clearTimeout:id=>timers.delete(id),
    addEventListener:(name,fn)=>events[name]=fn,
    IntersectionObserver:class {constructor(fn){observer=fn;}observe(){}disconnect(){disconnected=true;}}
  });
  return {lines,timers,events,motion,motionEvents,document,
    enter:()=>observer([{isIntersecting:true}]),leave:()=>observer([{isIntersecting:false}]),
    disconnected:()=>disconnected,
    tick(ms){const until=now+ms;while(true){const next=[...timers].filter(([,t])=>t.time<=until).sort((a,b)=>a[1].time-b[1].time)[0];if(!next)break;timers.delete(next[0]);now=next[1].time;next[1].fn();}now=until;}
  };
}
const normal=setup(); normal.enter(); normal.tick(1000);
assert.ok(normal.lines[0].textContent.length<10,'Title visibly deletes');
normal.tick(1100);assert.ok(normal.lines[1].textContent.length<14,'Subtitle visibly deletes');
normal.tick(2800);normal.lines.forEach(x=>assert.equal(x.textContent,x.dataset.typeTarget));
assert.equal(normal.timers.size,0,'Animation finishes before five seconds');
normal.leave();normal.enter();assert.equal(normal.timers.size,0,'No continuous animation');
const reduced=setup(true);reduced.enter();assert.equal(reduced.timers.size,0);
const hidden=setup();hidden.enter();hidden.tick(1000);hidden.document.hidden=true;hidden.events.visibilitychange();
hidden.lines.forEach(x=>assert.equal(x.textContent,x.dataset.typeTarget));assert.equal(hidden.timers.size,0);
const offscreen=setup();offscreen.enter();offscreen.tick(1100);offscreen.leave();assert.equal(offscreen.timers.size,0);
const changed=setup();changed.enter();changed.tick(1000);changed.motionEvents.change();assert.equal(changed.timers.size,0);
const closed=setup();closed.enter();closed.events.pagehide();assert.equal(closed.timers.size,0);assert.ok(closed.disconnected());
console.log('OK: typing, stable text, reduced motion, visibility, offscreen and page cleanup.');
