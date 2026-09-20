/* Independent read-only adapter. No Firebase SDK, authentication, counters or writes. */
(() => {
 'use strict';
 const KST=9*3600000, DAY=86400000, TTL=120000;
 const time=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
 function derive(record,epoch,fresh=true){
  const k=new Date(epoch+KST), date=k.toISOString().slice(0,10), month=k.getUTCMonth()+1;
  const minute=k.getUTCHours()*60+k.getUTCMinutes()+k.getUTCSeconds()/60;
  const dayStart=Math.floor((epoch+KST)/DAY)*DAY-KST;
  const usual=[1,2,11,12].includes(month)?1020:[3,10].includes(month)?1050:[4,9].includes(month)?1080:1110;
  const valid=fresh&&record&&typeof record==='object'&&!Array.isArray(record)&&record.date===date&&record.serviceDayStart===dayStart&&Number.isInteger(record.updatedAt)&&record.updatedAt>=dayStart&&record.updatedAt<=epoch+60000&&['normal','shortened','cancel','closed'].includes(record.status)&&typeof record.memo==='string'&&record.memo.length<=500;
  let status=valid?record.status:'pending',last=usual;
  if(status==='shortened'){
   if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(record.lastDeparture||''))status='pending';
   else{const [h,m]=record.lastDeparture.split(':').map(Number);last=h*60+m;if(last<480||last>usual)status='pending';}
  }
  if(status==='pending')last=usual;
  if(['normal','shortened'].includes(status)&&minute>=last)status='closed';
  const active=['normal','shortened'].includes(status);
  const next=active&&minute>=480?Math.min((Math.floor(minute/30)+1)*30,last):null;
  return {date,month,status,last,returnAt:last-60,next,remaining:next===null?null:Math.max(0,Math.ceil(next-minute)),memo:valid&&status!=='pending'?record.memo:'',confirmed:status!=='pending'};
 }
 // A pure date/status function is exposed only for deterministic regression checks.
 window.UdoFerry=Object.freeze({derive});
 const panels=[...document.querySelectorAll('[data-ferry]')];if(!panels.length)return;
 let record=null,receivedAt=0,offset=0,busy=false,failed=false;
 const endpoint=document.querySelector('meta[name="udosignature-ferry-source"]')?.content;
 function write(panel,selector,value){panel.querySelectorAll(selector).forEach(el=>{if(el.textContent!==value)el.textContent=value;});}
 function render(){
  const epoch=Date.now()+offset,s=derive(record,epoch,!failed&&receivedAt>0&&Date.now()-receivedAt<TTL);
  panels.forEach(panel=>{
   panel.dataset.ferryState=s.status;
   write(panel,'[data-ferry-status]',{pending:'당일 운항 확인 필요',normal:'정상 운항 안내',shortened:'단축 운항 안내',cancel:'결항 안내',closed:'오늘 운항 종료'}[s.status]);
   write(panel,'[data-ferry-last]',s.status==='cancel'?'결항':`${s.status==='pending'?'기준 ':''}${time(s.last)}`);
   write(panel,'[data-ferry-return]',s.status==='cancel'?'매장 문의':`${s.status==='pending'?'기준 ':''}${time(s.returnAt)}까지`);
   const departure=s.next!==null?`${time(s.next)} ${s.next%60?'유동 출항':'정시 기준'}`:s.status==='cancel'?'결항':s.status==='closed'?'운항 종료':'항구 확인';
   write(panel,'[data-ferry-next], [data-ferry-out]',departure);
   write(panel,'[data-ferry-next-note]',s.next!==null?`기준 시각까지 약 ${s.remaining}분 · 추가 출항은 항구에서 결정`:'첫 배·당일 출항 여부는 항구에 확인해 주세요.');
   write(panel,'[data-ferry-note]',s.status==='pending'?`${s.month}월 기준 마지막 배 ${time(s.last)}, 반납 ${time(s.returnAt)}까지입니다. 오늘 운항 확인 전의 기준표이며 실제 운항은 항구에 확인해 주세요.`:s.status==='cancel'?'오늘 날짜의 결항 안내가 게시되었습니다. 출항 카운트다운은 표시하지 않습니다.':s.status==='closed'?'오늘의 마지막 배 시간이 지났거나 운항 종료가 안내되었습니다. 다음 이용일은 항구에 확인해 주세요.':`${s.date} 코코나라 운항 안내 · 실제 출항은 기상·만선·항구 상황에 따라 달라집니다.`);
   write(panel,'[data-ferry-checked]',receivedAt?`한국시간 ${new Date(receivedAt+offset+KST).toISOString().slice(11,16)} 확인 · ${failed?'최신 정보 수신 실패':s.confirmed?'오늘 안내 반영':'오늘 확인된 안내 없음'}`:'당일 정보를 확인하고 있습니다.');
   write(panel,'[data-ferry-memo]',s.memo);panel.querySelectorAll('[data-ferry-memo]').forEach(el=>el.hidden=!s.memo);
  });
 }
 async function refresh(){
  if(busy||document.hidden||!endpoint)return;busy=true;
  panels.forEach(p=>p.querySelectorAll('[data-ferry-refresh]').forEach(b=>{b.disabled=true;b.textContent='확인 중…';}));
  try{
   const response=await fetch(endpoint,{method:'GET',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw new Error('Status unavailable');
   const remoteTime=Date.parse(response.headers.get('date')||'');if(Number.isFinite(remoteTime))offset=remoteTime-Date.now();
   record=await response.json();receivedAt=Date.now();failed=false;
  }catch{record=null;receivedAt=Date.now();failed=true;}
  finally{busy=false;panels.forEach(p=>p.querySelectorAll('[data-ferry-refresh]').forEach(b=>{b.disabled=false;b.textContent='새로 확인';}));render();}
 }
 panels.forEach(p=>p.querySelectorAll('[data-ferry-refresh]').forEach(b=>{b.hidden=false;b.addEventListener('click',refresh);}));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();refresh();}});
 window.addEventListener('online',refresh);render();refresh();
 setInterval(()=>{if(!document.hidden)render();},30000);setInterval(refresh,60000);
})();
