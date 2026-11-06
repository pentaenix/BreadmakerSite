/* Breadmaker Editor presets, Apache-2.0 covered source material.
 * Source: pentaenix/breadmaker 0df65540, static/js/core/runtime.js and
 * features/manuscript/workspace.js. Presentation only; no manuscript writes.
 */
(() => {
 const presets = [
  {font:"Georgia, 'Times New Roman', serif",size:15.1,lineHeight:1.8,width:808,pad:76,gap:.62,tracking:.006,light:{bg:'#dceeff',text:'#17212b'},dusk:{bg:'#c8cfce',text:'#26302f'},dark:{bg:'#102a43',text:'#f1f7fa'}},
  {font:"'Avenir Next', Avenir, 'Segoe UI', sans-serif",size:14.6,lineHeight:1.76,width:910,pad:62,gap:.52,tracking:.012,light:{bg:'#fff0b8',text:'#2b2513'},dusk:{bg:'#d2cbb5',text:'#312d21'},dark:{bg:'#352b10',text:'#fff5d6'}},
  {font:"'American Typewriter', 'Courier New', Courier, monospace",size:15.7,lineHeight:1.72,width:785,pad:78,gap:.58,tracking:.008,light:{bg:'#ddf3d8',text:'#182719'},dusk:{bg:'#c5cec1',text:'#283128'},dark:{bg:'#15351f',text:'#eef8ef'}},
  {font:"Palatino, 'Palatino Linotype', 'Book Antiqua', serif",size:16.2,lineHeight:1.7,width:830,pad:82,gap:.55,tracking:.002,light:{bg:'#e8dff8',text:'#241d30'},dusk:{bg:'#cbc5cf',text:'#302a33'},dark:{bg:'#2d1f3d',text:'#f4eefa'}},
  {font:"Verdana, Geneva, sans-serif",size:14.35,lineHeight:1.84,width:895,pad:64,gap:.66,tracking:-.008,light:{bg:'#ffe0d3',text:'#2b1f1a'},dusk:{bg:'#d0c2ba',text:'#342a25'},dark:{bg:'#3a201b',text:'#fff0e9'}},
  {font:"'Trebuchet MS', 'Gill Sans', Arial, sans-serif",size:15.45,lineHeight:1.78,width:852,pad:70,gap:.6,tracking:.01,light:{bg:'#d9f0ee',text:'#162624'},dusk:{bg:'#c2cdca',text:'#273130'},dark:{bg:'#123536',text:'#eff9f8'}},
];
 const choose = last => {
  let index=Math.floor(Math.random()*presets.length);
  if(index===last)index=(index+1+Math.floor(Math.random()*(presets.length-1)))%presets.length;
  return index;
 };
 const apply = (index, root=document) => {
  const scroller=root.querySelector('#documentScroller'),preset=presets[index];
  if(!scroller||!preset)return;
  const palette=preset[root.documentElement.dataset.theme]||preset.light;
  const values={'bg':palette.bg,'text':palette.text,'font':preset.font,
   'size':`${preset.size.toFixed(2)}px`,'title-size':`${(preset.size*1.42).toFixed(2)}px`,
   'line-height':String(preset.lineHeight),'paper-width':`${preset.width}px`,
   'paper-pad':`${preset.pad}px`,'block-gap':`${preset.gap}em`,'tracking':`${preset.tracking}em`};
  for(const [key,value] of Object.entries(values))scroller.style.setProperty(`--ee-${key}`,value);
  scroller.dataset.eyePreset=String(index);
 };
 window.BreadmakerEyeDemo=Object.freeze({choose,apply});
})();
