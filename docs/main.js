(() => {
  const translate = text => window.udoTranslate?.(text) || text;
  const select = document.querySelector('#month-select');
  const hint = document.querySelector('#month-hint');
  function renderSchedule() {
    if (!select) return;
    const month = Number(select.value);
    const last = [1, 2, 11, 12].includes(month) ? '17:00' : [3, 10].includes(month) ? '17:30' : [4, 9].includes(month) ? '18:00' : '18:30';
    const value = document.querySelector('#season-last');
    if (value) value.textContent = last;
    document.querySelectorAll('[data-months]').forEach(row => row.classList.toggle('is-selected', row.dataset.months.split(',').map(Number).includes(month)));
    if (hint) hint.textContent = translate('월별 참고 시간입니다. 당일 변경 여부를 확인하세요.');
  }
  if (select) {
    select.value = String(new Date(Date.now() + 9 * 3600000).getUTCMonth() + 1);
    select.addEventListener('change', renderSchedule);
    renderSchedule();
  }
  document.addEventListener('udo:languagechange', renderSchedule);
  const track = document.querySelector('#vehicle-track');
  const buttons = [...document.querySelectorAll('[data-vehicle-target]')];
  if (track) {
    const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    buttons.forEach(button => button.addEventListener('click', () => {
      const card = track.children[Number(button.dataset.vehicleTarget)];
      track.scrollTo({ left: card.offsetLeft - track.children[0].offsetLeft, behavior: reduced() ? 'instant' : 'smooth' });
    }));
    const updatePager = () => {
      const cards = [...track.children];
      const index = cards.reduce((best, card, i) => Math.abs(card.offsetLeft - cards[0].offsetLeft - track.scrollLeft) < Math.abs(cards[best].offsetLeft - cards[0].offsetLeft - track.scrollLeft) ? i : best, 0);
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    };
    track.addEventListener('scroll', updatePager, { passive: true });
    track.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      track.scrollBy({ left: track.clientWidth * (event.key === 'ArrowRight' ? .9 : -.9), behavior: reduced() ? 'instant' : 'smooth' });
    });
    updatePager();
  }
  const nav = [...document.querySelectorAll('.bottom-nav a')];
  const updateNav = () => {
    const section = location.hash.replace('#', '');
    const key = section === 'island-map' ? 'map' : section === 'local' ? 'local' : section === 'icecream' ? 'icecream' : location.pathname === '/' ? 'home' : 'time';
    nav.forEach(link => {
      if (link.dataset.nav === key) link.setAttribute('aria-current', location.pathname === '/' ? 'location' : 'page');
      else link.removeAttribute('aria-current');
    });
  };
  window.addEventListener('hashchange', updateNav);
  updateNav();
})();
