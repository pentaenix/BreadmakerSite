// Dependency-free behavior tests: fake time, real animation module.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'hero-typing.js'), 'utf8');
function setup(reduced = false) {
  let now = 0, id = 0, observer;
  const timers = new Map(), events = {}, motionEvents = {}, buttonEvents = {}, seen = new Set(), dispatched=[];
  const lines = ['Breadmaker', 'A writing app.'].map((target,index) => {
    const classes = new Set(); let value=target;
    return {get textContent(){return value;},set textContent(text){value=text;if(index)seen.add(text);},dataset:{typeTarget:target,...(index?{typeOptions:'A writing app.|A place to just write.|Writing made simple.'}:{})},nextElementSibling:{classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}},classes};
  });
  const button = {hidden:true,textContent:'Pause animation',attrs:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener:(name,fn)=>buttonEvents[name]=fn};
  const document = {hidden:false,querySelector:s=>s==='#hero-motion-toggle'?button:{},querySelectorAll:()=>lines,addEventListener:(name,fn)=>events[name]=fn,dispatchEvent:event=>dispatched.push(event)};
  const motion = {matches:reduced,addEventListener:(name,fn)=>motionEvents[name]=fn};
  vm.runInNewContext(source,{document,matchMedia:()=>motion,CustomEvent:class{constructor(name,opts){this.type=name;Object.assign(this,opts);}},
    setTimeout:(fn,delay)=>{timers.set(++id,{fn,time:now+delay});return id;},clearTimeout:id=>timers.delete(id),
    addEventListener:(name,fn)=>events[name]=fn,
    IntersectionObserver:class{constructor(fn){observer=fn;}observe(){}}
  });
  return {lines,timers,events,motion,motionEvents,document,button,buttonEvents,seen,dispatched,
    enter:()=>observer([{isIntersecting:true}]),leave:()=>observer([{isIntersecting:false}]),
    tick(ms){const until=now+ms;while(true){const next=[...timers].filter(([,t])=>t.time<=until).sort((a,b)=>a[1].time-b[1].time)[0];if(!next)break;timers.delete(next[0]);now=next[1].time;next[1].fn();}now=until;}
  };
}
const normal=setup();normal.enter();normal.tick(800);assert.ok(normal.lines[0].textContent.length<10,'Title visibly deletes');
normal.tick(14500);for(const phrase of ['A writing app.','A place to just write.','Writing made simple.'])assert.ok(normal.seen.has(phrase),phrase);
assert.ok(normal.timers.size,'Animation recurs');
normal.buttonEvents.click();assert.equal(normal.timers.size,0);assert.equal(normal.button.textContent,'Play animation');assert.equal(normal.dispatched.at(-1).detail.paused,true);
normal.buttonEvents.click();assert.ok(normal.timers.size);assert.equal(normal.dispatched.at(-1).detail.paused,false);
normal.leave();assert.equal(normal.timers.size,0);normal.enter();assert.ok(normal.timers.size);
normal.document.hidden=true;normal.events.visibilitychange();assert.equal(normal.timers.size,0);normal.document.hidden=false;normal.events.visibilitychange();assert.ok(normal.timers.size);
normal.motion.matches=true;normal.motionEvents.change();assert.equal(normal.timers.size,0);assert.ok(normal.button.hidden);
normal.motion.matches=false;normal.motionEvents.change();assert.ok(normal.timers.size);
normal.events.pagehide();assert.equal(normal.timers.size,0);normal.events.pageshow();assert.ok(normal.timers.size);
const reduced=setup(true);reduced.enter();assert.equal(reduced.timers.size,0);assert.ok(reduced.button.hidden);assert.equal(reduced.lines[1].textContent,'A writing app.');
console.log('OK: recurring three-phrase typing, pause/resume, reduced motion, visibility, offscreen and page lifecycle.');
