const assert = require('node:assert/strict');
const fs = require('node:fs');
const {dayStart, next, visible, createClient, HOSTS} = require('../assets/visitor-count.js');
let assertions=0;
function equal(a,b){assert.deepEqual(a,b);assertions++;}
const now=Date.parse('2026-10-24T04:00:00Z'),day=dayStart(now),DAY=86400000;
equal(dayStart(Date.parse('2026-10-23T14:59:59Z')),day-DAY);
equal(dayStart(Date.parse('2026-10-23T15:00:00Z')),day);
equal(next(null,day),{total:1,today:1,day});
equal(next({total:20,today:8,day:day-DAY},day),{total:21,today:1,day});
equal(visible({total:20,today:8,day:day-DAY},day),{today:0,total:20});
assert.throws(()=>next({total:20,today:8,day:day+DAY},day));assertions++;

// Execute the exact Firebase expressions against snapshot-shaped test data.
const rule=JSON.parse(fs.readFileSync(__dirname+'/../firebase/brand-visitor.rules.json')).$site;
function snap(v){return{val:()=>v,exists:()=>v!==null&&v!==undefined,isNumber:()=>typeof v==='number',child:k=>snap(v?.[k]),hasChildren:ks=>ks.every(k=>v?.[k]!==undefined)}}
function allowed(previous,value,time=now,site='coconara'){
 const exec=expression=>new Function('data','newData','now','$site','return '+expression)(snap(previous),snap(value),time,site);
 return exec(rule['.write'])&&exec(rule['.validate'])&&Object.keys(value).every(k=>Object.hasOwn(rule,k));
}
equal(allowed(null,{total:1,today:1,day}),true);
equal(allowed(null,{total:100,today:100,day}),false);
equal(allowed(null,null),false);
equal(allowed(null,{total:1,today:1,day},now,'unknown'),false);
const prev={total:7,today:2,day};
equal(allowed(prev,{total:8,today:3,day}),true);
for(const value of [{total:0,today:0,day},{total:9,today:3,day},{total:8,today:1,day},{total:8.1,today:3,day},{total:8,today:3,day:day+DAY},{total:8,today:3,day,identity:'x'},{total:8,today:3}])equal(allowed(prev,value),false);
equal(allowed(prev,{total:8,today:1,day:day+DAY},now+DAY),true);
equal(allowed(prev,{total:8,today:3,day},now+DAY),false);

function memory(){const map=new Map();return{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}}
function server(){
 let value=null,version=0,writes=0,conflicts=0;
 return {get value(){return value},get writes(){return writes},get conflicts(){return conflicts},
  fetch:async(url,opts)=>{
   assert.match(url,/\/brandVisitsV1\/(signature|coconara|udo|dalkom|peanut|cafe)\.json$/);
   equal(opts.credentials,'omit');equal(opts.referrerPolicy,'no-referrer');
   if(opts.method==='GET'){const snapshot=value&&{...value},etag=String(version);return{ok:true,status:200,headers:{get:()=>etag},json:async()=>snapshot};}
   if(opts.headers['if-match']!==String(version)){conflicts++;return{ok:false,status:412};}
   value=JSON.parse(opts.body);version++;writes++;
   return{ok:true,status:200,json:async()=>({...value})};
  }};
}
function client(db,storage=memory(),extra={}) {return createClient({site:'coconara',host:HOSTS.coconara,storage,fetch:db.fetch,now:()=>now,...extra});}
(async()=>{
 const db=server(),storage=memory();
 equal(await client(db,storage).refresh(),{today:1,total:1});
 equal(await client(db,storage).refresh(),{today:1,total:1});equal(db.writes,1);
 await client(db,memory(),{host:'localhost'}).refresh();equal(db.writes,1);
 await client(db,null).refresh();equal(db.writes,1);
 await client(db,memory(),{allowCount:false}).refresh();equal(db.writes,1);
 const concurrent=server();await Promise.all([client(concurrent).refresh(),client(concurrent).refresh()]);
 equal(concurrent.value,{total:2,today:2,day});equal(concurrent.conflicts,1);
 let queue=Promise.resolve();const lock=(_,fn)=>{const p=queue.then(fn);queue=p.catch(()=>{});return p;};
 const tabs=server(),shared=memory();await Promise.all([client(tabs,shared,{lock}).refresh(),client(tabs,shared,{lock}).refresh()]);equal(tabs.writes,1);
 let clock=now;const rollover=client(db,storage,{now:()=>clock});clock+=DAY;
 equal(await rollover.refresh(),{today:1,total:2});equal(db.value.day,day+DAY);
 const uncertain=server(),mark=memory();let dropped=false;
 const flaky=async(u,o)=>{const response=await uncertain.fetch(u,o);if(o.method==='PUT'&&!dropped){dropped=true;throw new Error('response lost');}return response;};
 equal(await client(uncertain,mark,{fetch:flaky}).refresh(),{today:1,total:1});
 await client(uncertain,mark,{fetch:flaky}).refresh();equal(uncertain.writes,1);
 const broken={fetch:async()=>({ok:false,status:503})};await assert.rejects(()=>client(broken).refresh());assertions++;
 for(const site of Object.keys(HOSTS)){const scoped=server();await createClient({site,host:HOSTS[site],storage:memory(),fetch:scoped.fetch,now:()=>now}).refresh();equal(scoped.writes,1);}
 console.log(JSON.stringify({assertions,status:'PASS',scenarios:'KST midnight; browser/day dedupe; cross-tab lock; ETag conflict; lost response; storage disabled; local/DNT read-only; six brand paths; unchanged legacy rules; monotonic rule validation'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
