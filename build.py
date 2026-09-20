"""Dependency-free static build. Edit src/, site.config.json and assets/, then python3 build.py."""
from pathlib import Path
import json,html,shutil
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parent
C=json.loads((ROOT/'site.config.json').read_text())
BASE=C['baseUrl'].rstrip('/')+'/'
PATH=urlparse(BASE).path
D=ROOT/'docs'
D.mkdir(exist_ok=True)
# Rebuild only this project's generated assets; removed source images must not survive deployment.
if (D/'assets').exists():shutil.rmtree(D/'assets')
shutil.copytree(ROOT/'assets',D/'assets')
def esc(s):return html.escape(str(s),quote=True)
def url(p=''):return PATH+p.lstrip('/')
def link(p):return url(p)
def booking(label='가격·예약 확인',placement='content',vehicle=''):
 return f'<a class="btn" href="{esc(C["bookingUrl"])}" target="_blank" rel="noopener noreferrer" data-event="booking_click" data-placement="{placement}" data-vehicle="{vehicle}">{label} <span aria-hidden="true">↗</span></a>'
def photo(name,alt,lazy=True,cls=''):
 return f'<img src="{url("assets/"+name+"-960.webp")}" srcset="{url("assets/"+name+"-480.webp")} 480w, {url("assets/"+name+"-960.webp")} 960w" sizes="(max-width:760px) calc(100vw - 36px), 580px" width="960" height="540" alt="{alt}" loading="{"lazy" if lazy else "eager"}" {"fetchpriority=high" if not lazy else ""} class="{cls}">'
def vehicle_photo(name,alt,lazy=True):
 width,height={'coco':(985,900),'fami':(1200,800),'open':(1061,900)}[name]
 return f'<div class="vehicle-photo vehicle-{name}"><img src="{url("assets/"+name+"-illustration.webp")}" width="{width}" height="{height}" alt="{esc(alt)}" loading="{"lazy" if lazy else "eager"}" {"fetchpriority=high" if not lazy else ""}></div>'
def couple_photo(lazy=True):
 return f'<img src="{url("assets/couple-coast-1280.webp")}" srcset="{url("assets/couple-coast-640.webp")} 640w, {url("assets/couple-coast-1280.webp")} 1280w" sizes="(max-width:760px) calc(100vw - 36px), 640px" width="1280" height="853" alt="우도 바닷가에서 헬멧을 쓰고 각자 전기스쿠터를 타는 코코나라 캐릭터 일러스트" loading="{"lazy" if lazy else "eager"}" {"fetchpriority=high" if not lazy else ""}>'
def faq(items):
 return '<section class="section wrap"><div class="faq"><p class="eyebrow">GOOD TO KNOW</p><h2>예약 전, 궁금한 것들</h2>'+''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q,a in items)+'</div></section>'
def location():
 return f'<section class="wrap section"><div class="location"><div><p class="eyebrow">START AT HAUMOKDONG</p><h2>우도 하우목동항에서 만나요.</h2><p>코코나라는 하우목동항에 있습니다.<br>승선 전 목적지가 하우목동항인지 확인해 주세요.</p></div><div class="actions"><a class="btn secondary" href="{C["mapUrl"]}" target="_blank" rel="noopener noreferrer" data-event="map_click">매장 위치 보기 ↗</a><a class="text-link" href="{C["guideUrl"]}" data-event="guide_click">배시간·오시는 길</a></div></div></section>'
def conditions():
 return f'''<section class="section wrap" id="conditions"><p class="eyebrow">BEFORE YOU BOOK</p><h2>예약 전에 이용조건을 확인해 주세요.</h2><div class="condition-summary"><strong>2종 보통 이상 운전면허</strong><strong>만 21세 이상</strong></div><p class="section-intro">위 두 조건과 차량별 신체 기준을 모두 확인해 주세요. 현재 코코나라 고객 안내의 이용 제한은 다음과 같습니다.</p><div class="two-grid" style="margin-top:28px"><div class="info-panel"><h3>공통 이용 제한</h3><ul class="condition-list"><li>임산부, 신체 장애 또는 보행이 불편하신 고객</li><li>만 65세 이상 또는 만 21세 미만 고객</li><li>음주 또는 숙취 상태인 고객</li><li>운전 중 급발진, 브레이크·액셀 혼동 경험이 있는 고객</li><li>유아 동반 고객</li></ul><p class="fine">기존 안내상 동반 탑승도 제한됩니다. 위 조건에 해당하면 현장 이용이 거부되며 당일 취소로 간주될 수 있으니 예약 전 문의해 주세요.</p></div><div class="info-panel"><h3>출발 전 확인할 것</h3><ul class="condition-list"><li>차종별 운전 경험과 체중·신장 기준 확인</li><li>현장 사용 안내와 연습 후 출발</li><li>해안도로로만 운행, 마을 내부 진입 금지</li><li>평지에 주차하고 사이드브레이크 잠금</li><li>당일 반납 마감과 배편 확인</li></ul><a class="text-link" href="{C['inquiryUrl']}" target="_blank" rel="noopener noreferrer" data-event="inquiry_click">예약 전 톡톡 문의 ↗</a></div></div></section>'''
def price():
 return f'<div class="price-box" id="booking"><div><h3>이용일의 가격과 예약 옵션을 확인하세요.</h3><p>차종·이용일에 따른 판매가격과 잔여 옵션은 네이버 예약 상품에서 안내합니다.<br>이용조건을 확인한 뒤 원하는 차량을 선택해 주세요.</p></div>{booking()}</div>'
PAGES=json.loads((ROOT/'seo.pages.json').read_text())
def render(route,p):
 canonical=BASE+route
 nav=''.join(f'<a href="{url(r)}" {"aria-current=page" if r==route else ""}>{label}</a>' for r,label in [('udo-electric-car/','전기차'),('udo-scooter/','스쿠터'),('udo-course/','우도 여행')])
 nav+=f'<a href="{url("guide/")}" data-event="language_guide_click">고객·다국어 안내</a>'+booking('예약하기','header')
 b=C['business']; business=''.join(f'<div><dt>{label}</dt><dd>{esc(b.get(k) or "입력 필요")}</dd></div>' for k,label in [('name','상호'),('representative','대표자'),('registrationNumber','사업자등록번호'),('address','사업장 주소'),('phone','문의 연락처'),('mailOrderNumber','통신판매업 신고번호')])
 schema=[{'@type':'Organization','@id':BASE+'#organization','name':'코코나라','url':BASE,'sameAs':C['sameAs']},{'@type':'WebSite','@id':BASE+'#website','name':'코코나라 우도 전기차·스쿠터','url':BASE,'inLanguage':'ko-KR','publisher':{'@id':BASE+'#organization'}},{'@type':'WebPage','@id':canonical+'#webpage','url':canonical,'name':p['title'],'description':p['description'],'inLanguage':'ko-KR','isPartOf':{'@id':BASE+'#website'},'dateModified':p['updatedAt'],'publisher':{'@id':BASE+'#organization'}}]
 if route and not p.get('noindex'):schema.append({'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'코코나라','item':BASE},{'@type':'ListItem','position':2,'name':p['label'],'item':canonical}]})
 body=(ROOT/'src'/p['file']).read_text()
 replacements={'BASE':PATH,'BOOKING':booking(),'GUIDE':C['guideUrl'],'INQUIRY':C['inquiryUrl'],'COUPLE':couple_photo(route!=''),'LOCATION':location(),'CONDITIONS':conditions(),'PRICE':price()}
 for k,v in replacements.items():body=body.replace('{{'+k+'}}',v)
 for name,alt in [('coast','우도 하우목동항 주변 해안과 푸른 바다'),('beach','우도 하고수동해수욕장의 바다와 해안'),('biyang','우도 비양도의 해안 풍경')]:
  body=body.replace('{{PHOTO_'+name.upper()+'}}',photo(name,alt,route not in ['', 'udo-course/'] or name!='coast'))
 for name,alt in [('coco','1인승 코코 전기스쿠터를 타는 헬멧 쓴 캐릭터 일러스트'),('fami','2인승 파미 전기차와 탑승 캐릭터 일러스트'),('open','2인승 오픈카와 탑승 캐릭터 일러스트, 실제 신형은 핑크색')]:
  body=body.replace('{{VEHICLE_'+name.upper()+'}}',vehicle_photo(name,alt,not (route=='udo-electric-car/' and name=='fami') and not(route=='udo-scooter/' and name=='coco')))
 verification=f'<meta name="naver-site-verification" content="{esc(C["naverVerification"])}">' if C['naverVerification'] else ''
 return f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{esc(p['title'])}</title><meta name="description" content="{esc(p['description'])}"><meta name="robots" content="{'noindex, follow' if p.get('noindex') else 'index, follow, max-image-preview:large'}"><link rel="canonical" href="{canonical}"><meta property="og:type" content="website"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="코코나라"><meta property="og:title" content="{esc(p['title'])}"><meta property="og:description" content="{esc(p['description'])}"><meta property="og:url" content="{canonical}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="{esc(p['title'])}"><meta name="twitter:description" content="{esc(p['description'])}"><meta name="theme-color" content="#172d2a">{verification}<link rel="icon" href="{url('assets/favicon.svg')}" type="image/svg+xml"><link rel="stylesheet" href="{url('assets/site.css')}"><script src="{url('assets/site.js')}" defer></script><script type="application/ld+json">{json.dumps({'@context':'https://schema.org','@graph':schema},ensure_ascii=False).replace('<',chr(92)+'u003c')}</script></head><body data-page="{route or 'home'}"><a class="skip" href="#main">본문 바로가기</a><div class="customer-bar"><a href="{C['guideUrl']}" data-event="guide_click" data-placement="top">이미 예약하셨나요? <span>고객 안내 바로가기 →</span></a></div><header class="site-header"><div class="wrap nav-wrap"><a class="logo" href="{url()}" aria-label="코코나라 홈"><span class="logo-mark" aria-hidden="true">c</span><span>코코나라<small>COCONARA · UDO</small></span></a><button class="menu-toggle" aria-expanded="false" aria-controls="navigation">메뉴 ☰</button><nav class="nav-links" id="navigation" aria-label="주 메뉴">{nav}</nav></div></header><main id="main">{body}</main><section class="closing"><div class="wrap"><div><h2>나에게 맞는 한 대로, 우도를 만나세요.</h2><p>이용조건을 확인하고 네이버에서 예약하세요.</p></div>{booking('가격·예약 확인','closing')}</div></section><footer class="site-footer"><div class="wrap"><div class="footer-top"><div><a class="logo" href="{url()}">코코나라</a><p>우도 하우목동항 전기차·전기스쿠터 대여</p></div><div class="footer-links"><a href="{C['guideUrl']}" data-event="guide_click">예약 고객 안내</a><a href="{C['inquiryUrl']}" target="_blank" rel="noopener noreferrer" data-event="inquiry_click">네이버 톡톡 문의 ↗</a><a href="{url('guide/')}">다국어 안내</a></div></div><dl class="business">{business}</dl><div class="copyright"><span>© 코코나라. udosignature는 코코나라의 차량·여행 안내 프로젝트입니다.</span><span>운영시간: {esc(b['openingHours'] or '예약 전 문의')}</span></div></div></footer><div class="mobile-cta" aria-label="빠른 예약"><a class="btn secondary" href="{url('#vehicles') if route=='' else '#conditions' if route in ['udo-electric-car/','udo-scooter/'] else url('udo-electric-car/')}">{'차량 비교' if route=='' else '이용조건' if route in ['udo-electric-car/','udo-scooter/'] else '차량 보기'}</a>{booking('가격·예약','mobile')}</div></body></html>'''
for route,p in PAGES.items():
 if not (ROOT/'src'/p['file']).exists():continue
 target=D/route if route.endswith('.html') else D/route/'index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(render(route,p))
urls=[(BASE+r,p['updatedAt']) for r,p in PAGES.items() if not p.get('noindex') and (ROOT/'src'/p['file']).exists()]
(D/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+esc(u)+'</loc><lastmod>'+date+'</lastmod></url>' for u,date in urls)+'</urlset>\n')
(D/'robots.txt').write_text('# Project-path copy. Crawlers use origin /robots.txt; see README.\nUser-agent: *\nAllow: /\nSitemap: '+BASE+'sitemap.xml\n')
(D/'.nojekyll').touch()
assert not (D/'CNAME').exists()
print('Built',len(list(D.rglob('*.html'))),'static HTML pages for',BASE)
