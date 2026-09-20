(() => {
 'use strict';
 const root=document.querySelector('[data-travel-map]');if(!root)return;
 const cards=[...root.querySelectorAll('[data-spot-card]')],links=[...root.querySelectorAll('[data-spot]')];
 function select(id,focus=false){
  cards.forEach(card=>card.hidden=card.id!==id);
  links.forEach(a=>a.setAttribute('aria-current',String(a.dataset.spot===id)));
  if(focus)root.querySelector('#'+CSS.escape(id)+' h3')?.focus({preventScroll:true});
 }
 links.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();select(a.dataset.spot,true);}));
 select(cards[0].id);
 const button=root.querySelector('[data-location]'),message=root.querySelector('[data-location-message]');
 if(!navigator.geolocation){message.textContent='현재 브라우저에서는 위치 기능을 사용할 수 없습니다.';return;}
 button.hidden=false;
 button.addEventListener('click',()=>{
  button.disabled=true;message.textContent='기기의 위치 권한을 허용하면 지도에만 표시합니다.';
  navigator.geolocation.getCurrentPosition(({coords})=>{
   const svg=root.querySelector('svg'),x=(coords.longitude-Number(svg.dataset.lon0))*Number(svg.dataset.scaleX)+Number(svg.dataset.offsetX),y=(Number(svg.dataset.lat1)-coords.latitude)*Number(svg.dataset.scaleY)+Number(svg.dataset.offsetY);
   let marker=svg.querySelector('[data-user-position]');
   if(x<0||x>700||y<0||y>620){message.textContent='현재 위치가 우도 지도 범위 밖입니다.';if(marker)marker.remove();}
   else{if(!marker){marker=document.createElementNS('http://www.w3.org/2000/svg','circle');marker.setAttribute('data-user-position','');marker.setAttribute('r','8');marker.setAttribute('class','user-position');svg.append(marker);}marker.setAttribute('cx',x);marker.setAttribute('cy',y);message.textContent=`내 위치를 표시했습니다. 위치 오차 약 ${Math.round(coords.accuracy)}m · 서버에 저장하지 않습니다.`;}
   button.disabled=false;
  },()=>{message.textContent='위치를 확인하지 못했습니다. 장소 목록에서 위치를 확인해 주세요.';button.disabled=false;},{enableHighAccuracy:false,timeout:10000,maximumAge:30000});
 });
})();
