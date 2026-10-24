(() => {
  'use strict';
  const supported = ['ko', 'en', 'zh-HK', 'ms', 'zh-TW', 'ja'];
  let dictionary = {}, catalogPromise, requested = 0;
  let current = 'ko';
  const records = [], attributes = [];
  const live = '#coco-road-map,dialog[data-map-dialog],.language-bar,[translate="no"],script,style,#service-date,#service-label,#service-message,#service-source,#service-checked,#service-last,#service-refresh,#month-hint,#season-last,#language-feedback';
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement.closest(live) && /[가-힣]/.test(node.textContent)) records.push([node, node.textContent]);
  }
  document.querySelectorAll('[alt],[aria-label],[title]').forEach(element => {
    if (element.closest('#coco-road-map,dialog[data-map-dialog],.language-bar,[translate="no"]')) return;
    for (const name of ['alt', 'aria-label', 'title']) {
      const value = element.getAttribute(name);
      if (value && /[가-힣]/.test(value)) attributes.push([element, name, value]);
    }
  });
  const originalTitle = document.title;
  const translate = (value, locale = current) => {
    if (locale === 'ko' || typeof value !== 'string') return value;
    const key = value.trim(), translated = dictionary[key]?.[locale];
    if (!translated) return value;
    return value.slice(0, value.indexOf(key)) + translated + value.slice(value.indexOf(key) + key.length);
  };
  window.udoTranslate = translate;
  window.udoLocale = current;
  const load = () => catalogPromise ||= Promise.all(['/i18n/common.json', '/i18n/articles.json'].map(async path => {
    const response = await fetch(path, { credentials: 'omit' });
    if (!response.ok) throw new Error('Language catalog unavailable');
    return response.json();
  })).then(parts => { dictionary = Object.assign({}, ...parts); }).catch(error => { catalogPromise = undefined; throw error; });
  function updateLinks(locale) {
    document.querySelectorAll('a[href]').forEach(anchor => {
      const url = new URL(anchor.getAttribute('href'), location.href);
      if (url.origin !== location.origin || /\/(?:admin|brands|privacy)(?:\/|$)/.test(url.pathname) || !/^https?:$/.test(url.protocol)) return;
      url.searchParams.set('lang', locale);
      anchor.setAttribute('href', url.pathname + url.search + url.hash);
    });
  }
  async function choose(locale, explicit = false, updateURL = true) {
    if (!supported.includes(locale)) locale = 'ko';
    const request = ++requested;
    document.querySelectorAll('[data-locale]').forEach(button => button.setAttribute('aria-busy', String(button.dataset.locale === locale)));
    try {
      if (locale !== 'ko') await load();
      if (request !== requested) return;
      current = locale;
      window.udoLocale = locale;
      document.documentElement.lang = locale;
      document.querySelector('.language-bar').setAttribute('aria-label', translate('언어 선택'));
      records.forEach(([node, original]) => { if (node.isConnected) node.textContent = translate(original); });
      attributes.forEach(([element, name, original]) => element.setAttribute(name, translate(original)));
      document.title = translate(originalTitle);
      document.querySelectorAll('[data-locale]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.locale === locale)));
      updateLinks(locale);
      if (updateURL) {
        const url = new URL(location.href);
        url.searchParams.set('lang', locale);
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
      document.dispatchEvent(new CustomEvent('udo:languagechange', { bubbles: true, detail: { locale } }));
      if (explicit) document.getElementById('language-feedback').textContent = translate('언어를 변경했습니다.');
      document.getElementById('language-error')?.remove();
    } catch (_) {
      if (request !== requested) return;
      if (explicit && !document.getElementById('language-error')) {
        const error = document.createElement('p');
        error.id = 'language-error'; error.className = 'wrap source-note'; error.setAttribute('role', 'alert');
        error.textContent = '언어를 불러오지 못했습니다. 연결을 확인하고 다시 선택해 주세요. / Language unavailable. Please check your connection and try again.';
        document.querySelector('.language-bar').after(error);
      }
    } finally {
      if (request === requested) document.querySelectorAll('[data-locale]').forEach(button => button.removeAttribute('aria-busy'));
    }
  }
  const preference = () => {
    const query = new URLSearchParams(location.search).get('lang');
    if (supported.includes(query)) return query;
    for (const raw of navigator.languages || [navigator.language]) {
      const language = raw.toLowerCase();
      if (language.startsWith('ko')) return 'ko';
      if (language.startsWith('zh-hk') || language.startsWith('zh-mo')) return 'zh-HK';
      if (language.startsWith('zh')) return 'zh-TW';
      for (const prefix of ['en', 'ms', 'ja']) if (language.startsWith(prefix)) return prefix;
    }
    return 'ko';
  };
  document.querySelectorAll('[data-locale]').forEach(button => button.addEventListener('click', () => void choose(button.dataset.locale, true)));
  window.addEventListener('popstate', () => void choose(preference(), false, false));
  void choose(preference());
})();
