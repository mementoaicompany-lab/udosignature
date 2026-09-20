(() => {
  'use strict';
  // Independent, memory-only events. No provider, cookies, identifiers, network or legacy counter.
  window.udosignatureEvents = [];
  const allowed = new Set(['booking_click','vehicle_detail_click','map_click','guide_click','inquiry_click','language_guide_click','content_click']);
  document.addEventListener('click', e => {
    const link = e.target.closest('a[data-event]'); if(!link || !allowed.has(link.dataset.event)) return;
    const detail = Object.freeze({ site: 'udosignature', event: link.dataset.event, page: document.body.dataset.page, vehicle: link.dataset.vehicle || null, placement: link.dataset.placement || 'content' });
    window.udosignatureEvents.push(detail); if(window.udosignatureEvents.length > 100) window.udosignatureEvents.shift();
    window.dispatchEvent(new CustomEvent('udosignature:conversion', { detail }));
  });
})();

// Loop the supplied artwork only while visible; visitors can stop every scene.
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = [...document.querySelectorAll('[data-motion]')];
  function update(scene) { scene.dataset.running = String(scene.dataset.visible === 'true' && scene.dataset.paused !== 'true' && !document.hidden && !reduced.matches); }
  const observer = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => { target.dataset.visible=String(isIntersecting); update(target); }), {threshold:.08});
  scenes.forEach(scene => {
    const button=scene.querySelector('.motion-toggle'); button.hidden=false;
    scene.dataset.paused=String(reduced.matches);
    const label=()=>{const stopped=scene.dataset.paused==='true'||reduced.matches;button.disabled=reduced.matches;button.textContent=reduced.matches?'기기 설정으로 움직임 꺼짐':stopped?'움직임 재생':'움직임 멈추기';button.setAttribute('aria-pressed',String(stopped));};
    button.addEventListener('click',()=>{scene.dataset.paused=String(scene.dataset.paused!=='true');update(scene);label();});
    reduced.addEventListener('change',()=>{scene.dataset.paused=String(reduced.matches);update(scene);label();});
    observer.observe(scene);label();
  });
  document.addEventListener('visibilitychange',()=>scenes.forEach(update));
})();
