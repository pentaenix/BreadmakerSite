const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('cloud/preview.js','utf8');
function setup(supported = true) {
  const events = {}, closeEvents = {}, handlers = [];
  let focused = null;
  const buttons = [0,1].map(id=>({id,disabled:true,addEventListener:(name,callback)=>handlers[id]=callback,focus(){focused=id;}}));
  const dialog = {open:false,opens:0,showModal(){this.open=true;this.opens++;},close(){this.open=false;events.close();},addEventListener:(name,callback)=>events[name]=callback,querySelector:()=>({addEventListener:(name,callback)=>closeEvents[name]=callback})};
  if(!supported) delete dialog.showModal;
  vm.runInNewContext(source,{document:{querySelector:()=>dialog,querySelectorAll:()=>buttons}});
  return {buttons,handlers,dialog,events,closeEvents,focus:()=>focused};
}
let page=setup();
assert.ok(page.buttons.every(x=>!x.disabled));
page.handlers[0](); assert.equal(page.dialog.open,true); assert.equal(page.dialog.opens,1);
page.handlers[0](); assert.equal(page.dialog.opens,1,'Repeated clicks do not stack dialogs');
page.closeEvents.click(); assert.equal(page.dialog.open,false); assert.equal(page.focus(),0);
page.handlers[1](); assert.equal(page.dialog.open,true);page.dialog.close();assert.equal(page.focus(),1);
page=setup(false);assert.ok(page.buttons.every(x=>x.disabled),'Unsupported/no-JS previews stay non-transactional');
assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|location\.|window\.open/.test(source));
console.log('OK: preview-only subscribe buttons, repeated opening, dismissal/focus return, and safe unsupported-browser fallback.');
