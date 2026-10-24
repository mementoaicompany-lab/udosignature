(() => {
  const select = document.querySelector('#month-select');
  const hint = document.querySelector('#month-hint');
  if (select) {
    const month = new Date(Date.now() + 9 * 3600000).getUTCMonth() + 1;
    select.value = String(month);
    const render = () => {
      const value = Number(select.value);
      document.querySelectorAll('[data-months]').forEach(row => {
        const active = row.dataset.months.split(',').map(Number).includes(value);
        row.classList.toggle('is-selected', active);
        if (active && hint) hint.textContent = `${value}월 참고 막배 ${row.cells[2].textContent} · 당일 변동 여부 별도 확인`;
      });
    };
    select.addEventListener('change', render);
    render();
  }
})();
