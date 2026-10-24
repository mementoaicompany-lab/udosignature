/* Location stays in memory. The map and its illustration never supply GPS fixes. */
(function(global){'use strict';
const LIMITS=Object.freeze({fresh:30000,expire:60000,future:5000,accuracy:500,approximate:100});
function getDirection(fix,now=Date.now()){
 if(!fix||!Number.isFinite(now)||![fix.heading,fix.speed,fix.accuracy,fix.timestamp].every(Number.isFinite))return null;
 const age=now-fix.timestamp;
 return fix.heading>=0&&fix.heading<360&&fix.speed>=1&&fix.accuracy>=0&&fix.accuracy<=50&&age>=0&&age<=10000?fix.heading:null;
}
function validate(position,now,last){
 const c=position?.coords,t=position?.timestamp;
 if(!c||![c.latitude,c.longitude,c.accuracy,t].every(Number.isFinite)||Math.abs(c.latitude)>90||Math.abs(c.longitude)>180||c.accuracy<0)return {error:'invalid'};
 if(t>now+LIMITS.future||now-t>LIMITS.fresh||(last&&t<last.timestamp))return {error:'stale'};
 if(c.accuracy>LIMITS.accuracy)return {error:'inaccurate'};
 const fix={latitude:c.latitude,longitude:c.longitude,accuracy:c.accuracy,timestamp:t};
 if(Number.isFinite(c.heading)&&c.heading>=0&&c.heading<360)fix.heading=c.heading;
 if(Number.isFinite(c.speed)&&c.speed>=0)fix.speed=c.speed;
 return {fix};
}
function withinMap(x,y,width,height,padding=8){
 return [x,y,width,height,padding].every(Number.isFinite)&&width>padding*2&&height>padding*2&&x>=padding&&x<=width-padding&&y>=padding&&y<=height-padding;
}
function create(options){
 const now=options.now||Date.now,clock=options.clock||global,provider=options.provider;
 let enabled=false,active=true,watch=null,generation=0,timer=null,fix=null,status='off',started=0,lastAcceptedTimestamp=-Infinity;
 const emit=()=>options.onChange({enabled,active,status,fix:fix?{...fix}:null});
 function clear(){generation++;if(watch!==null){try{provider?.clearWatch(watch);}catch{}watch=null;}if(timer!==null){clock.clearInterval(timer);timer=null;}}
 function stop(){clear();enabled=false;fix=null;status='off';emit();}
 function refresh(){
  if(fix){const age=now()-fix.timestamp;if(age>LIMITS.expire){fix=null;status='stale';emit();}else if(age>LIMITS.fresh&&status!=='last'){delete fix.heading;status='last';emit();}else if(age>10000&&Object.hasOwn(fix,'heading')){delete fix.heading;emit();}}
  else if(status==='locating'&&now()-started>25000){status='slow';emit();}
 }
 function begin(){
  clear();fix=null;lastAcceptedTimestamp=-Infinity;
  if(!enabled)return;
  if(!active){status='paused';emit();return;}
  if(options.secure===false){enabled=false;status='insecure';emit();return;}
  if(!provider?.watchPosition){enabled=false;status='unsupported';emit();return;}
  const current=generation;status='locating';started=now();emit();
  const success=position=>{
   if(current!==generation||!enabled||!active)return;
   const result=validate(position,now(),{timestamp:lastAcceptedTimestamp});
   if(result.error){if(result.error==='stale'&&fix)return;fix=null;status=result.error;emit();return;}
   fix=result.fix;lastAcceptedTimestamp=fix.timestamp;status=fix.accuracy>LIMITS.approximate?'approximate':'located';emit();
  };
  const failure=error=>{
   if(current!==generation||!enabled||!active)return;
   fix=null;status=error?.code===1?'denied':error?.code===3?'timeout':'unavailable';
   if(status==='denied'){clear();enabled=false;}emit();
  };
  try{
   const id=provider.watchPosition(success,failure,{enableHighAccuracy:true,maximumAge:0,timeout:15000});
   if(current===generation&&enabled){watch=id;timer=clock.setInterval(refresh,5000);}else provider.clearWatch(id);
  }catch(error){failure({code:error?.name==='SecurityError'||error?.name==='NotAllowedError'?1:2});}
 }
 function start(){enabled=true;begin();}
 function setActive(value){value=!!value;if(active===value)return;active=value;if(!enabled)return;if(active)begin();else{clear();fix=null;status='paused';emit();}}
 return Object.freeze({start,stop,setActive,refresh,snapshot:()=>({enabled,active,status,fix:fix?{...fix}:null}),destroy:stop});
}
global.CoconaraGPS=Object.freeze({create,validate,LIMITS,getDirection,withinMap});
})(typeof window==='undefined'?globalThis:window);
