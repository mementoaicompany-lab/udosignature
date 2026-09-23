/* Events are local to this website. No remote collector, cookies, Firebase writes or visitor counter. */
(()=>{'use strict';const site=document.body.dataset.site;document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const u=new URL(a.href,location.href);const type=u.hostname==='smartstore.naver.com'?'booking_click':u.protocol==='tel:'?'call_click':u.hostname==='map.naver.com'?'map_click':u.origin!==location.origin?'brand_click':'content_click';window.dispatchEvent(new CustomEvent('udosignature:event',{detail:{site,event:type,path:location.pathname,destination:u.origin+u.pathname}}));});})();

// Progressive enhancement: all content and destinations also work without JS.
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-panorama]').forEach(stage => {
    const button = stage.querySelector('.panorama-toggle');
    let paused = reduced.matches;
    const update = () => {
      stage.classList.toggle('motion-paused', paused || reduced.matches || document.hidden);
      button.textContent = paused ? '움직임 재생' : '움직임 멈추기';
      button.setAttribute('aria-pressed', String(paused));
      button.hidden = reduced.matches;
    };
    button.addEventListener('click', () => { paused = !paused; update(); });
    reduced.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    update();
  });
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const slides = [...carousel.querySelectorAll('[data-slide]')];
    const previous = carousel.querySelector('[data-prev]');
    const next = carousel.querySelector('[data-next]');
    const play = carousel.querySelector('[data-autoplay]');
    const counter = carousel.querySelector('[data-slide-label]');
    let index = 0, running = false, timer;
    function render(n) {
      index = (n + slides.length) % slides.length;
      slides.forEach((slide, i) => { slide.hidden = i !== index; });
      counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    }
    function stop() { running = false; clearInterval(timer); play.textContent = '자동 재생'; play.setAttribute('aria-pressed', 'false'); }
    previous.addEventListener('click', () => { stop(); render(index - 1); });
    next.addEventListener('click', () => { stop(); render(index + 1); });
    play.addEventListener('click', () => {
      if (running) return stop();
      running = true; play.textContent = '일시 정지'; play.setAttribute('aria-pressed', 'true');
      timer = setInterval(() => render(index + 1), 6000);
    });
    carousel.addEventListener('focusin', event => { if (event.target !== play) stop(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    reduced.addEventListener('change', () => { if (reduced.matches) stop(); });
    render(0);
  });
  const cards = [...document.querySelectorAll('.places-grid .place-card')];
  const query = new URLSearchParams(location.search).get('q')?.trim().slice(0, 80);
  if (cards.length && query) {
    const words = query.toLowerCase().split(/\s+/);
    let count = 0;
    cards.forEach(card => { const match = words.every(word => card.textContent.toLowerCase().includes(word)); card.hidden = !match; if (match) count++; });
    const summary = document.createElement('p'); summary.className = 'wrap search-summary'; summary.setAttribute('role', 'status');
    summary.append(document.createTextNode(`“${query}” 검색 결과 ${count}곳. `));
    const reset = document.createElement('a'); reset.href = location.pathname; reset.textContent = '전체 여행지 보기'; summary.append(reset);
    document.querySelector('.places-grid').parentElement.before(summary);
    const input = document.querySelector('.tour-search input'); if (input) input.value = query;
  }
})();
