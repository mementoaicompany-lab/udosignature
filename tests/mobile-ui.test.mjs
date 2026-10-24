import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createFerryStatusController } from '../ferry-source/public/ferry-status.js';
import { ADMIN_UID, koreanDate, koreanDayStart } from '../ferry-source/public/ferry-status-validator.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicRoot = path.join(root, 'ferry-source/public');
const languages = ['en', 'zh-HK', 'ms', 'zh-TW', 'ja'];
const catalogs = ['common', 'articles'].map(name => JSON.parse(fs.readFileSync(path.join(publicRoot, 'i18n', name + '.json'), 'utf8')));
const dictionary = Object.assign({}, ...catalogs);
const languageScript = fs.readFileSync(path.join(publicRoot, 'i18n.js'), 'utf8');
const settle = async () => { for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve)); };

test('every published translation has all five nonempty locales and critical facts retain their values', () => {
  assert.ok(Object.keys(dictionary).length >= 345);
  assert.equal(Object.keys(dictionary).length, catalogs.reduce((sum, catalog) => sum + Object.keys(catalog).length, 0), 'catalogs must not silently overwrite each other');
  for (const [source, values] of Object.entries(dictionary)) {
    assert.ok(source.trim());
    assert.deepEqual(Object.keys(values).sort(), [...languages].sort(), source);
    for (const [locale, value] of Object.entries(values)) {
      assert.equal(typeof value, 'string', source + ': ' + locale);
      assert.ok(value.trim(), source + ': ' + locale);
      assert.doesNotMatch(value, /\uFFFD/, source + ': malformed UTF-8');
    }
  }
  for (const [source, fact] of [['20% 할인', '20%'], ['사업자등록번호 101-34-52349', '101-34-52349'], ['매장 문의 0507-1373-2359', '0507-1373-2359']]) {
    for (const locale of languages) assert.ok(dictionary[source][locale].includes(fact), source + ': ' + locale);
  }
  assert.equal(dictionary['1월'].en, 'January');
  assert.equal(dictionary['12월'].ms, 'Disember');
  assert.equal(dictionary['아이스크림']['zh-HK'], '雪糕');
  assert.equal(dictionary['아이스크림']['zh-TW'], '冰淇淋');
});

// A small DOM adapter exercises the production script without controlling a browser
// or adding a dependency to this static site. It implements DOM primitives only.
class Events {
  listeners = new Map();
  addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, []); this.listeners.get(name).push(fn); }
  removeEventListener(name, fn) { this.listeners.set(name, (this.listeners.get(name) || []).filter(value => value !== fn)); }
  dispatchEvent(event) { for (const fn of this.listeners.get(event.type) || []) fn(event); return true; }
}
class Element extends Events {
  constructor(tag, attrs = {}, text = '') {
    super(); this.tagName = tag; this.attrs = { ...attrs }; this.textContent = text; this.parentElement = null;
    this.dataset = Object.fromEntries(Object.entries(attrs).filter(([key]) => key.startsWith('data-')).map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value]));
    this.hidden = false; this.disabled = false;
  }
  get id() { return this.attrs.id; }
  set id(value) { this.attrs.id = value; }
  getAttribute(name) { return this.attrs[name] ?? null; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  removeAttribute(name) { delete this.attrs[name]; }
  matches(selector) {
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    if (selector.startsWith('.')) return (this.attrs.class || '').split(' ').includes(selector.slice(1));
    const match = selector.match(/^([\w-]*)\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if (match) return (!match[1] || this.tagName === match[1]) && Object.hasOwn(this.attrs, match[2]) && (match[3] === undefined || this.attrs[match[2]] === match[3]);
    return this.tagName === selector;
  }
  closest(selectors) { for (let current = this; current; current = current.parentElement) if (selectors.split(',').some(selector => current.matches(selector.trim()))) return current; return null; }
  click() { this.dispatchEvent({ type: 'click', target: this }); }
  after(element) { this.document.elements.push(element); element.document = this.document; }
  remove() { this.document.elements = this.document.elements.filter(element => element !== this); }
}
function languageFixture({ url = 'https://udosignature.com/', preferred = ['ko'], fetcher } = {}) {
  const doc = new Events();
  doc.documentElement = { lang: 'ko' }; doc.body = new Element('body');
  doc.title = '우도 배시간 · 성산항·종달항 배시간표와 운항 확인 | 우도 시그니처';
  const group = new Element('div', { class: 'language-bar', role: 'group', 'aria-label': '언어 선택', translate: 'no' });
  const buttons = ['ko', ...languages].map(locale => new Element('button', { 'data-locale': locale, 'aria-pressed': String(locale === 'ko') }));
  for (const button of buttons) button.parentElement = group;
  const title = new Element('h1');
  const node = { textContent: '우도 배시간', parentElement: title, isConnected: true };
  const alt = new Element('img', { alt: '우도의 항구와 푸른 해안' });
  const links = ['/timetable/', '/about/?from=footer#source', '/#island-map', '/brands/', '/admin/', 'https://guide.udosignature.com/', 'tel:0647825670'].map(href => new Element('a', { href }));
  doc.elements = [group, ...buttons, title, alt, ...links, new Element('p', { id: 'language-feedback' })];
  for (const element of doc.elements) element.document = doc;
  doc.querySelectorAll = selectors => doc.elements.filter(element => selectors.split(',').some(selector => element.matches(selector.trim())));
  doc.querySelector = selector => doc.querySelectorAll(selector)[0] ?? null;
  doc.getElementById = id => doc.elements.find(element => element.id === id) ?? null;
  doc.createElement = tag => new Element(tag);
  doc.createTreeWalker = () => { let index = -1; return { currentNode: null, nextNode() { this.currentNode = [node][++index]; return !!this.currentNode; } }; };
  const location = new URL(url); const events = new Events(); const calls = [];
  const context = { document: doc, location, navigator: { languages: preferred }, URL, URLSearchParams, NodeFilter: { SHOW_TEXT: 4 },
    CustomEvent: class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } },
    history: { replaceState(_state, _title, next) { location.href = new URL(next, location).href; } },
    addEventListener: events.addEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events),
    fetch: async (url, options) => { calls.push({ url, options }); return fetcher ? fetcher(url, options) : { ok: true, json: async () => catalogs[url.includes('common') ? 0 : 1] }; }
  };
  context.window = context; vm.createContext(context); vm.runInContext(languageScript, context);
  return { context, doc, buttons, group, node, alt, links, location, calls, choose: locale => buttons.find(button => button.dataset.locale === locale).click() };
}

test('each language changes content, title, alt, control names, URL and route links without account or storage access', async () => {
  const f = languageFixture(); await settle();
  for (const locale of languages) {
    f.choose(locale); await settle();
    assert.equal(f.doc.documentElement.lang, locale);
    assert.equal(f.node.textContent, dictionary['우도 배시간'][locale]);
    assert.equal(f.alt.getAttribute('alt'), dictionary['우도의 항구와 푸른 해안'][locale]);
    assert.equal(f.group.getAttribute('aria-label'), dictionary['언어 선택'][locale]);
    assert.equal(f.doc.title, dictionary['우도 배시간 · 성산항·종달항 배시간표와 운항 확인 | 우도 시그니처'][locale]);
    assert.equal(f.location.searchParams.get('lang'), locale);
    const article = new URL(f.links[1].getAttribute('href'), f.location);
    assert.equal(article.searchParams.get('lang'), locale); assert.equal(article.searchParams.get('from'), 'footer'); assert.equal(article.hash, '#source');
    assert.equal(new URL(f.links[2].getAttribute('href'), f.location).hash, '#island-map');
    assert.equal(f.buttons.filter(button => button.getAttribute('aria-pressed') === 'true').length, 1);
  }
  assert.equal(f.calls.length, 2, 'catalogs should be reused across selections');
  assert.ok(f.calls.every(call => call.options.credentials === 'omit'));
  assert.equal(f.links[3].getAttribute('href'), '/brands/');
  assert.equal(f.links[4].getAttribute('href'), '/admin/');
  assert.equal(f.links[5].getAttribute('href'), 'https://guide.udosignature.com/');
  assert.equal(f.links[6].getAttribute('href'), 'tel:0647825670');
});

test('an explicit Korean selection survives navigation and reload on an English-language device', async () => {
  const f = languageFixture({ url: 'https://udosignature.com/?lang=en', preferred: ['en-US'] }); await settle();
  f.choose('ko'); await settle();
  assert.equal(f.doc.documentElement.lang, 'ko');
  assert.equal(f.node.textContent, '우도 배시간');
  assert.equal(f.location.searchParams.get('lang'), 'ko');
  const target = new URL(f.links[0].getAttribute('href'), f.location);
  assert.equal(target.searchParams.get('lang'), 'ko');
  const next = languageFixture({ url: target.href, preferred: ['en-US'] }); await settle();
  assert.equal(next.doc.documentElement.lang, 'ko');
  assert.equal(next.calls.length, 0, 'a Korean page needs no language downloads');
});

test('URL language outranks browser language and missing catalogs remain retryable', async () => {
  const f = languageFixture({ url: 'https://udosignature.com/?lang=ja', preferred: ['en-US'] }); await settle();
  assert.equal(f.doc.documentElement.lang, 'ja');
  let fail = true;
  const broken = languageFixture({ fetcher: async url => fail ? { ok: false } : { ok: true, json: async () => catalogs[url.includes('common') ? 0 : 1] } }); await settle();
  broken.choose('en'); await settle();
  assert.equal(broken.doc.documentElement.lang, 'ko');
  assert.equal(broken.doc.getElementById('language-error')?.getAttribute('role'), 'alert');
  assert.ok(broken.buttons.every(button => button.getAttribute('aria-busy') === null));
  fail = false; broken.choose('en'); await settle();
  assert.equal(broken.doc.documentElement.lang, 'en');
  assert.equal(broken.doc.getElementById('language-error'), null);
});

test('a slower language download cannot overwrite the visitor’s later Korean choice', async () => {
  const pending = [];
  const f = languageFixture({ fetcher: url => new Promise(resolve => pending.push(() => resolve({ ok: true, json: async () => catalogs[url.includes('common') ? 0 : 1] }))) });
  await settle(); f.choose('en'); f.choose('ko');
  for (const resolve of pending) resolve(); await settle();
  assert.equal(f.doc.documentElement.lang, 'ko');
  assert.equal(f.node.textContent, '우도 배시간');
  assert.ok(f.buttons.every(button => button.getAttribute('aria-busy') === null));
});

test('a language change immediately translates service refresh while the operator memo stays explicitly original text', async () => {
  const epoch = Date.parse('2026-10-24T10:30:00+09:00');
  const elements = Object.fromEntries(['status', 'date', 'label', 'message', 'checked', 'source', 'refresh', 'last'].map(key => [key, new Element('div', { id: 'service-' + key })]));
  const doc = new Events(); doc.hidden = false; doc.getElementById = id => elements[id.replace('service-', '')];
  const memo = '하우목동항 확인: <img src=x onerror=alert(1)>';
  const record = { status: 'normal', date: koreanDate(epoch), serviceDayStart: koreanDayStart(epoch), memo, updatedAt: epoch, updatedByUID: ADMIN_UID };
  const previousTranslate = globalThis.udoTranslate;
  const controller = createFerryStatusController({ document: doc, now: () => epoch, fetch: async () => ({ ok: true, json: async () => record }), setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {} });
  try {
    globalThis.udoTranslate = text => text;
    controller.start(); await controller.refresh();
    globalThis.udoTranslate = text => dictionary[text]?.en ?? text;
    doc.dispatchEvent({ type: 'udo:languagechange' });
    assert.equal(elements.refresh.textContent, dictionary['운항 안내 다시 확인'].en);
    assert.equal(elements.label.textContent, dictionary['운영자 확인 · 정상'].en);
    assert.ok(elements.message.textContent.includes(dictionary['운영자 메모 (원문)'].en));
    assert.ok(elements.message.textContent.includes(memo));
  } finally { controller.stop(); if (previousTranslate === undefined) delete globalThis.udoTranslate; else globalThis.udoTranslate = previousTranslate; }
});

// Parse the built pages with Python's standard HTML parser. This checks actual
// published text/anchors, independently of the JavaScript's text traversal.
const parsed = spawnSync('python3', ['-c', String.raw`
import json,re
from pathlib import Path
from html.parser import HTMLParser
class Page(HTMLParser):
 def __init__(self): super().__init__(); self.stack=[]; self.text=[]; self.links=[]; self.ids=[]
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs); inherited=any(x[1] for x in self.stack)
  excluded=inherited or tag in ('script','style') or attrs.get('translate')=='no' or attrs.get('id')=='coco-road-map' or 'data-map-dialog' in attrs
  if 'id' in attrs:self.ids.append(attrs['id'])
  if tag=='a' and 'href' in attrs:self.links.append(attrs['href'])
  if not excluded:
   for name in ('alt','aria-label','title'):
    value=attrs.get(name,'').strip()
    if re.search('[가-힣]',value):self.text.append(value)
  if tag not in ('img','br','meta','link','input','hr','source','area','embed','wbr'):self.stack.append((tag,excluded))
 def handle_endtag(self,tag):
  for i in range(len(self.stack)-1,-1,-1):
   if self.stack[i][0]==tag:self.stack=self.stack[:i];break
 def handle_data(self,value):
  value=value.strip()
  if not any(x[1] for x in self.stack) and re.search('[가-힣]',value):self.text.append(value)
result={}
for p in Path('docs').rglob('*.html'):
 page=Page();page.feed(p.read_text());result[str(p.relative_to('docs'))]={'text':page.text,'links':page.links,'ids':page.ids}
print(json.dumps(result,ensure_ascii=False))
`], { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
assert.equal(parsed.status, 0, parsed.stderr);
const pages = JSON.parse(parsed.stdout);
const routes = ['index.html', ...['timetable', 'fares', 'vehicle', 'weather', 'seongsan-port', 'jongdal-port', 'about'].map(route => route + '/index.html')];

test('all eight published ferry pages have translations for their body text, title and accessible names', () => {
  for (const route of routes) for (const text of pages[route].text) assert.ok(dictionary[text], route + ': missing translation for ' + text);
});

test('published navigation and local fragment links resolve to real pages and targets', () => {
  for (const route of routes) {
    const origin = new URL(route === 'index.html' ? '/' : '/' + route.replace(/index\.html$/, ''), 'https://udosignature.com');
    for (const href of pages[route].links) {
      const url = new URL(href, origin);
      if (url.origin !== origin.origin || !/^https?:$/.test(url.protocol)) continue;
      const destination = decodeURIComponent(url.pathname.slice(1));
      const file = destination.endsWith('/') || !destination ? destination + 'index.html' : destination;
      if (!file.endsWith('.html')) continue;
      assert.ok(pages[file], route + ': broken local page ' + href);
      if (url.hash) assert.ok(pages[file].ids.includes(decodeURIComponent(url.hash.slice(1))), route + ': broken fragment ' + href);
    }
  }
});

function travelFixture({ reducedMotion = false } = {}) {
  const doc = new Events();
  const select = new Element('select', { id: 'month-select' });
  const hint = new Element('p', { id: 'month-hint' });
  const last = new Element('strong', { id: 'season-last' });
  const rows = ['1,2,11,12', '3,10', '4,9', '5,6,7,8'].map(months => {
    const row = new Element('tr', { 'data-months': months }); row.selected = false;
    row.classList = { toggle(_name, selected) { row.selected = selected; } }; return row;
  });
  const track = new Element('div', { id: 'vehicle-track' });
  track.children = [{ offsetLeft: 18 }, { offsetLeft: 282 }, { offsetLeft: 546 }];
  track.clientWidth = 300; track.scrollLeft = 0;
  track.scrollTo = options => { track.lastScroll = options; track.scrollLeft = options.left; track.dispatchEvent({ type: 'scroll' }); };
  track.scrollBy = options => track.scrollTo({ ...options, left: track.scrollLeft + options.left });
  const buttons = ['0', '1', '2'].map(target => new Element('button', { 'data-vehicle-target': target }));
  const links = ['home', 'time', 'map', 'local', 'icecream'].map(name => new Element('a', { 'data-nav': name }));
  const elements = [select, hint, last, track, ...rows, ...buttons];
  doc.querySelectorAll = selector => selector === '.bottom-nav a' ? links : elements.filter(element => element.matches(selector));
  doc.querySelector = selector => doc.querySelectorAll(selector)[0] ?? null;
  const events = new Events();
  // 00:30 in Korea on 1 November, while UTC is still in October.
  class FixedDate extends Date { static now() { return Date.parse('2026-10-31T15:30:00Z'); } }
  const context = { document: doc, location: new URL('https://udosignature.com/'), Date: FixedDate,
    matchMedia: () => ({ matches: reducedMotion }), addEventListener: events.addEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events), udoTranslate: value => dictionary[value]?.en ?? value };
  context.window = context; vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(publicRoot, 'main.js'), 'utf8'), context);
  return { doc, context, select, hint, last, rows, track, buttons, links };
}

test('the month control uses Korea’s month and updates the selected reference timetable without implying live service', () => {
  const f = travelFixture();
  assert.equal(f.select.value, '11');
  assert.equal(f.last.textContent, '17:00');
  assert.deepEqual(f.rows.map(row => row.selected), [true, false, false, false]);
  f.select.value = '5'; f.select.dispatchEvent({ type: 'change' });
  assert.equal(f.last.textContent, '18:30');
  assert.deepEqual(f.rows.map(row => row.selected), [false, false, false, true]);
  assert.equal(f.hint.textContent, dictionary['월별 참고 시간입니다. 당일 변경 여부를 확인하세요.'].en);
});

test('rental choices work by button and keyboard with reduced motion, and hash navigation updates the active destination', () => {
  const f = travelFixture({ reducedMotion: true });
  f.buttons[1].click();
  assert.equal(f.track.scrollLeft, 264);
  assert.notEqual(f.track.lastScroll.behavior, 'smooth');
  assert.equal(f.buttons[1].getAttribute('aria-pressed'), 'true');
  let prevented = false;
  f.track.dispatchEvent({ type: 'keydown', key: 'ArrowRight', preventDefault() { prevented = true; } });
  assert.ok(prevented); assert.ok(f.track.scrollLeft > 264);
  f.context.location.hash = '#island-map'; f.context.dispatchEvent({ type: 'hashchange' });
  assert.equal(f.links.find(link => link.dataset.nav === 'map').getAttribute('aria-current'), 'location');
  assert.equal(f.links.filter(link => link.getAttribute('aria-current')).length, 1);
});
