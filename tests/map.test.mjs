import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const base=fileURLToPath(new URL('../ferry-source/public/map/',import.meta.url));
const manifest=JSON.parse(fs.readFileSync(path.join(base,'asset-manifest.json'),'utf8'));
const ctx={window:{}};vm.createContext(ctx);
for(const f of ['road-data.js','road-map-i18n.js','map-copy.js','road-gps.js']) vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),ctx);
const GPS=ctx.window.CoconaraGPS;
const NOW=Date.parse('2026-10-24T13:00:00+09:00');
const position=(overrides={})=>({coords:{latitude:33.508,longitude:126.943,accuracy:12,heading:90,speed:2,...overrides.coords},timestamp:overrides.timestamp??NOW});
function fixture(options={}) {
 let callbacks, watches=0, cleared=0, clock=NOW;
 const results=[];const provider={watchPosition:(success,error,opts)=>{callbacks={success,error,opts};watches++;return 1;},clearWatch:()=>{cleared++;}};
 const gps=GPS.create({provider,secure:true,now:()=>clock,clock:{setInterval:()=>1,clearInterval:()=>{}},onChange:x=>results.push(x),...options});
 return {gps,results,get callbacks(){return callbacks;},get watches(){return watches;},get cleared(){return cleared;},setNow:x=>clock=x};
}
test('geography, all 15 POIs, and the exact animated road route are unchanged',()=>{
 for(const field of ['land','roads','beaches','places','route','sourceDate','osmTimestamp']) assert.equal(createHash('sha256').update(JSON.stringify(ctx.window.COCO_ROAD_DATA[field])).digest('hex'),manifest.originalDataHashes[field]);
 assert.equal(ctx.window.COCO_ROAD_DATA.places.length,15);
});
test('all referenced photos and illustrated vehicles are local copied assets',()=>{
 const data=ctx.window.COCO_ROAD_DATA;
 assert.equal(data.cdn,'/map/assets/');
 for(const p of data.places)for(const photo of p.content.photos||[p.content.photo])if(photo)assert.ok(fs.existsSync(path.join(base,'assets',photo)),photo);
 for(const f of [data.fami,data.ferry])assert.ok(fs.existsSync(path.join(base,f.replace('/map/',''))));
});
test('six languages contain every UI control and map guide section',()=>{
 for(const locale of ['ko','en','zh-HK','ms','zh-TW','ja']){
  assert.ok(ctx.window.COCO_MAP_UI[locale]);const c=ctx.window.UDO_MAP_COPY.controls[locale];
  for(const key of ['gpsLabel','gpsEnable','gpsDisable','headingLabel','mapGuide','closePopup','north','photoFull','photoFill','local','guideIntro'])assert.ok(c[key],locale+':'+key);
  assert.equal(c.guideSections.length,5);assert.equal(Object.keys(ctx.window.UDO_MAP_COPY.briefs[locale]).length,11);
 }
});
test('GPS is never requested at initialization or while its explicit toggle is off',()=>{
 const f=fixture();assert.equal(f.watches,0);f.gps.setActive(false);f.gps.setActive(true);assert.equal(f.watches,0);
 f.gps.start();assert.equal(f.watches,1);assert.equal(f.callbacks.opts.enableHighAccuracy,true);
});
test('permission denial clears any fix, ends watch, and reports denied without a fake location',()=>{
 const f=fixture();f.gps.start();f.callbacks.success(position());assert.ok(f.gps.snapshot().fix);
 f.callbacks.error({code:1});assert.equal(f.gps.snapshot().status,'denied');assert.equal(f.gps.snapshot().enabled,false);assert.equal(f.gps.snapshot().fix,null);assert.equal(f.cleared,1);
});
test('switching location off clears the fix and ignores late callbacks',()=>{
 const f=fixture();f.gps.start();const old=f.callbacks;f.gps.stop();old.success(position());
 assert.equal(f.gps.snapshot().status,'off');assert.equal(f.gps.snapshot().fix,null);
});
test('hidden-page suspension ends tracking and resume only follows a prior explicit enable',()=>{
 const f=fixture();f.gps.start();f.gps.setActive(false);assert.equal(f.gps.snapshot().status,'paused');assert.equal(f.cleared,1);
 f.gps.setActive(true);assert.equal(f.watches,2);
});
test('unsupported or insecure environments do not request location',()=>{
 for(const options of [{provider:null},{secure:false}]){const f=fixture(options);f.gps.start();assert.equal(f.watches,0);assert.equal(f.gps.snapshot().enabled,false);assert.ok(['unsupported','insecure'].includes(f.gps.snapshot().status));}
});
test('timeout and unavailable errors stay explicit',()=>{
 const f=fixture();f.gps.start();f.callbacks.error({code:3});assert.equal(f.gps.snapshot().status,'timeout');
 f.callbacks.error({code:2});assert.equal(f.gps.snapshot().status,'unavailable');assert.equal(f.gps.snapshot().fix,null);
});
test('stale, inaccurate, invalid and future positions are rejected',()=>{
 for(const [p,error]of [[position({timestamp:NOW-31000}),'stale'],[position({coords:{accuracy:501}}),'inaccurate'],[position({coords:{latitude:91}}),'invalid'],[position({timestamp:NOW+5001}),'stale']])assert.equal(GPS.validate(p,NOW).error,error);
});
test('last location loses direction after 10 seconds and expires after 60 seconds',()=>{
 const f=fixture();f.gps.start();f.callbacks.success(position());f.setNow(NOW+10001);f.gps.refresh();assert.equal(f.gps.snapshot().fix.heading,undefined);
 f.setNow(NOW+31000);f.gps.refresh();assert.equal(f.gps.snapshot().status,'last');
 f.setNow(NOW+61000);f.gps.refresh();assert.equal(f.gps.snapshot().status,'stale');assert.equal(f.gps.snapshot().fix,null);
});
test('position and copies live only in memory; scripts have no analytics, storage, or location transmission calls',()=>{
 for(const file of ['road-gps.js','road-map.js']){
  const code=fs.readFileSync(path.join(base,file),'utf8');
  assert.doesNotMatch(code,/localStorage|sessionStorage|indexedDB|fetch\s*\(|XMLHttpRequest|sendBeacon|firebase|gtag\s*\(|selectTab\s*\(/i);
 }
 const code=fs.readFileSync(path.join(base,'road-map.js'),'utf8');assert.match(code,/udo:languagechange/);assert.doesNotMatch(code,/coco:language|cocoLanguage|COCO_TRANSLATIONS|pushPopupState|\.closest\('\.page'\)/);
});

test('map bounds accept interior points and reject outside, non-finite and invalid viewport values',()=>{
 assert.equal(GPS.withinMap(100,180,360,520),true);
 assert.equal(GPS.withinMap(8,8,360,520),true);
 for(const args of [[-1,20,360,520],[353,20,360,520],[100,513,360,520],[NaN,180,360,520],[100,180,0,0]])assert.equal(GPS.withinMap(...args),false);
});
