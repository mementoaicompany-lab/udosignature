(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  function closeMenu() { menu?.setAttribute('aria-expanded', 'false'); nav?.classList.remove('open'); }
  menu?.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
  nav?.addEventListener('click', e => { if(e.target.closest('a')) closeMenu(); });
  // Independent, memory-only events. No provider, cookies, identifiers, network or legacy counter.
  window.udosignatureEvents = [];
  const allowed = new Set(['booking_click','vehicle_detail_click','map_click','guide_click','inquiry_click','language_guide_click']);
  document.addEventListener('click', e => {
    const link = e.target.closest('a[data-event]'); if(!link || !allowed.has(link.dataset.event)) return;
    const detail = Object.freeze({ site: 'udosignature', event: link.dataset.event, page: document.body.dataset.page, vehicle: link.dataset.vehicle || null, placement: link.dataset.placement || 'content' });
    window.udosignatureEvents.push(detail); if(window.udosignatureEvents.length > 100) window.udosignatureEvents.shift();
    window.dispatchEvent(new CustomEvent('udosignature:conversion', { detail }));
  });
})();
