/* Browser lifecycle contract tests; no network or browser credentials. */
const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const code = fs.readFileSync('assets/home-motion.js', 'utf8');
function fixture(options = {}) {
  const events = {}, observers = [], scripts = [], calls = [], mediaEvents = {};
  const element = () => ({hidden:false,textContent:'',dataset:{},attrs:{},listeners:{},
    setAttribute(k,v){this.attrs[k]=v;}, addEventListener(k,v){this.listeners[k]=v;},
    classList:{values:new Set(),toggle(k,v){v?this.values.add(k):this.values.delete(k);},add(k){this.values.add(k);},remove(k){this.values.delete(k);}}});
  const sceneButton=element(), filmButton=element(), status=element(), stage=element(), body=element(), scenes=[element(),element()];
  stage.querySelector=s=>s==='[data-film-toggle]'?filmButton:status;
  const document={hidden:false,body,head:{append:s=>scripts.push(s)},createElement:element,
    querySelector:s=>s==='[data-scenes-toggle]'?sceneButton:stage,querySelectorAll:()=>scenes,addEventListener:(k,v)=>{(events[k]??=[]).push(v);}};
  const reduced={matches:!!options.reduced,addEventListener:(k,v)=>{(mediaEvents[k]??=[]).push(v);}};
  let hooks;
  const player={playVideo(){calls.push('play');},pauseVideo(){calls.push('pause');},mute(){calls.push('mute');},getIframe:()=>element()};
  const context={document,matchMedia:()=>reduced,navigator:{connection:{saveData:!!options.saveData}},location:{origin:'https://udosignature.com'},setTimeout:()=>1,clearTimeout:()=>{},
    IntersectionObserver:function(cb){observers.push(cb);this.observe=()=>{};},
    YT:{PlayerState:{PLAYING:1},Player:function(id,o){hooks=o.events;return player;}}};
  context.window=context;
  if(options.deferAPI)delete context.YT;
  vm.runInNewContext(code,context);
  return {sceneButton,filmButton,status,stage,body,scenes,calls,scripts,reduced,context,get hooks(){return hooks;},ready(){hooks.onReady({target:player});},media(){(mediaEvents.change||[]).forEach(f=>f());},visibility(hidden){document.hidden=hidden;(events.visibilitychange||[]).forEach(f=>f());},view(v){observers[1]([{isIntersecting:v}]);}};
}
let f=fixture({reduced:true,deferAPI:true});assert.equal(f.scripts.length,0,'Reduced motion must not load YouTube');assert.equal(f.sceneButton.hidden,true);f.filmButton.listeners.click();assert.equal(f.scripts.length,1,'Explicit play may load video');
f=fixture({saveData:true,deferAPI:true});assert.equal(f.scripts.length,0,'Save data must not load YouTube');
f=fixture();f.ready();assert.deepEqual(f.calls,['mute','play']);f.hooks.onStateChange({data:1});assert.equal(f.stage.classList.values.has('film-visible'),true);f.filmButton.listeners.click();assert.equal(f.calls.at(-1),'pause');f.view(false);f.view(true);assert.equal(f.calls.at(-1),'pause','User pause survives leaving viewport');
f=fixture();f.ready();f.view(false);assert.equal(f.calls.at(-1),'pause');f.view(true);assert.equal(f.calls.at(-1),'play');f.visibility(true);assert.equal(f.calls.at(-1),'pause');f.visibility(false);assert.equal(f.calls.at(-1),'play');f.reduced.matches=true;f.media();assert.equal(f.calls.at(-1),'pause','Changed accessibility preference pauses video');
f=fixture();f.ready();f.hooks.onAutoplayBlocked();assert.match(f.status.textContent,/버튼/);f.filmButton.listeners.click();assert.equal(f.calls.at(-1),'play');f.hooks.onError();assert.equal(f.filmButton.hidden,true);assert.equal(f.stage.classList.values.has('film-visible'),false);assert.match(f.status.textContent,/전체 보기/);
f=fixture();f.sceneButton.listeners.click();assert.equal(f.body.classList.values.has('scenes-paused'),true);f.sceneButton.listeners.click();assert.equal(f.body.classList.values.has('scenes-paused'),false);f.visibility(true);assert.equal(f.body.classList.values.has('scenes-paused'),true);
console.log('PASS: reduced motion, save data, manual play/pause, viewport, visibility, autoplay blocking, video error, decorative motion controls');
