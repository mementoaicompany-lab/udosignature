"""Dependency-free static build. Edit src/, site.config.json and assets/, then python3 build.py."""
from pathlib import Path
import json,html,shutil,hashlib
from map_builder import render_map
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
def asset_url(name):return url(name)+'?v='+hashlib.sha256((ROOT/name).read_bytes()).hexdigest()[:12]
def booking(label='가격·예약 확인',placement='content',vehicle=''):
 return f'<a class="btn" href="{esc(C["bookingUrl"])}" target="_blank" rel="noopener noreferrer" data-event="booking_click" data-placement="{placement}" data-vehicle="{vehicle}">{label} <span aria-hidden="true">↗</span></a>'
def photo(name,alt,lazy=True,cls=''):
 return f'<img src="{url("assets/"+name+"-960.webp")}" srcset="{url("assets/"+name+"-480.webp")} 480w, {url("assets/"+name+"-960.webp")} 960w" sizes="(max-width:760px) calc(100vw - 36px), 580px" width="960" height="{dict(coast=539,beach=1440,biyang=640)[name]}" alt="{alt}" loading="{"lazy" if lazy else "eager"}" {"fetchpriority=high" if not lazy else ""} class="{cls}">'
def vehicle_photo(name,alt,lazy=True):
 width,height={'coco':(985,900),'fami':(1200,800),'open':(1061,900)}[name]
 return f'<div class="vehicle-photo vehicle-{name}"><img src="{url("assets/"+name+"-illustration.webp")}" width="{width}" height="{height}" alt="{esc(alt)}" loading="{"lazy" if lazy else "eager"}" {"fetchpriority=high" if not lazy else ""}></div>'
def couple_photo(lazy=True):
 return f'<img src="{url("assets/couple-coast-1280.webp")}" srcset="{url("assets/couple-coast-640.webp")} 640w, {url("assets/couple-coast-1280.webp")} 1280w" sizes="(max-width:760px) calc(100vw - 36px), 640px" width="1280" height="853" alt="우도 바닷가에서 헬멧을 쓰고 각자 전기스쿠터를 타는 코코나라 캐릭터 일러스트" loading="{"lazy" if lazy else "eager"}" {"fetchpriority=high" if not lazy else ""}>'
def faq(items):
 return '<section class="section wrap"><div class="faq"><p class="eyebrow">GOOD TO KNOW</p><h2>예약 전, 궁금한 것들</h2>'+''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q,a in items)+'</div></section>'
def location():
 return f'<section class="wrap section"><div class="location"><div><p class="eyebrow">START AT HAUMOKDONG</p><h2>우도 하우목동항에서 만나요.</h2><p>코코나라는 하우목동항에 있습니다.<br>승선 전 목적지가 하우목동항인지 확인해 주세요.</p></div><div class="actions"><a class="btn secondary" href="{C["mapUrl"]}" target="_blank" rel="noopener noreferrer" data-event="map_click">매장 위치 보기 ↗</a><a class="text-link" href="{url("udo-ferry/")}" data-event="content_click">배시간·오시는 길</a></div></div></section>'
def conditions():
 return f'''<section class="section wrap" id="conditions"><p class="eyebrow">BEFORE YOU BOOK</p><h2>예약 전에 이용조건을 확인해 주세요.</h2><div class="condition-summary"><strong>2종 보통 이상 운전면허</strong><strong>만 21세 이상</strong></div><p class="section-intro">위 두 조건과 차량별 신체 기준을 모두 확인해 주세요. 현재 코코나라 고객 안내의 이용 제한은 다음과 같습니다.</p><div class="two-grid" style="margin-top:28px"><div class="info-panel"><h3>공통 이용 제한</h3><ul class="condition-list"><li>임산부, 신체 장애 또는 보행이 불편하신 고객</li><li>만 65세 이상 또는 만 21세 미만 고객</li><li>음주 또는 숙취 상태인 고객</li><li>운전 중 급발진, 브레이크·액셀 혼동 경험이 있는 고객</li><li>유아 동반 고객</li></ul><p class="fine">기존 안내상 동반 탑승도 제한됩니다. 위 조건에 해당하면 현장 이용이 거부되며 당일 취소로 간주될 수 있으니 예약 전 문의해 주세요.</p></div><div class="info-panel"><h3>출발 전 확인할 것</h3><ul class="condition-list"><li>차종별 운전 경험과 체중·신장 기준 확인</li><li>현장 사용 안내와 연습 후 출발</li><li>해안도로로만 운행, 마을 내부 진입 금지</li><li>평지에 주차하고 사이드브레이크 잠금</li><li>당일 반납 마감과 배편 확인</li></ul><a class="text-link" href="{C['inquiryUrl']}" target="_blank" rel="noopener noreferrer" data-event="inquiry_click">예약 전 톡톡 문의 ↗</a></div></div></section>'''
def price(route):
 keys=['fami','open'] if route=='udo-electric-car/' else ['coco']
 label='우도 전기차' if route=='udo-electric-car/' else '우도 스쿠터·전기스쿠터'
 rows=''
 for key in keys:
  v=C['pricing']['vehicles'][key]
  benefit=f'<strong>{v["discount"]:,}원</strong><br>한정 수량 조기예약' if v['discount'] else '별도 할인 없음'
  rows+=f'<tr><th scope="row">{v["name"]} · {v["seats"]}인승</th><td>{v["regular"]:,}원</td><td>{benefit}</td></tr>'
 return f'''<section class="rental-prices" id="booking"><p class="eyebrow">PRICE & RESERVATION</p><h2>{label} 가격과 예약 방법</h2><div class="table-scroll"><table class="comparison"><caption>코코나라 대여 요금 · {C['pricing']['checkedAt']} 운영자 확인</caption><thead><tr><th scope="col">차종</th><th scope="col">정상가</th><th scope="col">예약 혜택</th></tr></thead><tbody>{rows}</tbody></table></div><p><strong>이용시간: {C['pricing']['rentalPeriod']}합니다.</strong> 하루의 반납 마감이 정해져 있으므로 24시간 이용 상품이 아닙니다. 출항이 단축되면 반납시간도 확인해 주세요.</p>{'<p class="notice">'+C['pricing']['discountTerms']+' 정확한 적용 여부는 네이버 예약 옵션에서 확인해 주세요.</p>' if 'fami' in keys else ''}<div class="steps"><div class="step"><div><h3>이용할 차종과 조건 확인</h3><p>인원, 운전면허, 나이와 차종별 신체 기준을 먼저 확인하세요. 렌트할 차량이 맞는지 사진만으로 판단하지 마세요.</p></div></div><div class="step"><div><h3>네이버 상품에서 이용일·옵션 선택</h3><p>방문할 날짜와 차종을 선택하고 표시되는 결제금액·잔여 옵션을 확인하세요. 선택한 상품의 포함사항과 추가 비용 조건도 읽어주세요.</p></div></div><div class="step"><div><h3>배편·취소 조건 확인 후 예약</h3><p><a class="text-link" href="{url('udo-ferry/')}">당일 배시간·반납 기준</a>과 <a class="text-link" href="{url('guide/#refund')}">취소·환불 안내</a>를 확인한 뒤 결제하세요. 출발 전 하우목동항행인지 확인해 주세요.</p></div></div></div><div class="actions">{booking('네이버 가격·예약 확인','price') }<a class="btn secondary" href="{C['inquiryUrl']}" target="_blank" rel="noopener noreferrer" data-event="inquiry_click">예약 전 문의 ↗</a></div><p class="fine">요금·예약 옵션은 변경될 수 있습니다. 결제 전 예약 상품에 표시되는 최종 조건을 확인해 주세요.</p></section>'''

def inline_price(model):
 v=C['pricing']['vehicles'][model]
 if v['discount']:return f'<p class="rate-inline"><span>정상가 {v["regular"]:,}원</span><br><strong>조기예약 {v["discount"]:,}원</strong><small>한정 수량 · 할인 옵션 확인</small></p>'
 return f'<p class="rate-inline"><strong>정상가 {v["regular"]:,}원</strong><small>당일 반납 마감까지 이용</small></p>'

def ride_scene(model='couple',eager=False):
 names={'couple':'코코 1인승, 각자 한 대씩','coco':'코코 · 1인승 스쿠터','fami':'파미 · 2인승 전기차','open':'오픈카 · 2인승'}
 if model=='couple':
  art=couple_photo(not eager)
  for x,y,w,h in [(16.2,75.6,5.2,9.6),(41.8,78.6,8,13.5),(55.6,75.8,5.2,9.6),(81.5,78.8,8,13.5)]:
   art+=f'<span class="wheel-crop" aria-hidden="true" style="left:{x}%;top:{y}%;width:{w}%;height:{h}%"><i style="background-size:{10000/w}% {10000/h}%;background-position:{(x-w/2)/(100-w)*100}% {(y-h/2)/(100-h)*100}%"></i></span>'
 else:
  w,h={'coco':(985,900),'fami':(1200,800),'open':(1061,900)}[model]
  art=f'<div class="coast-layer" aria-hidden="true"></div><img class="rider" src="{url("assets/"+model+"-illustration.webp")}" width="{w}" height="{h}" loading="{"eager" if eager else "lazy"}" alt="{names[model]} 주행 캐릭터 일러스트">'
 return f'<figure class="ride-figure"><div class="ride-scene ride-{model}" data-motion><div class="ride-art">{art}</div><div class="moving-road" aria-hidden="true"></div><span class="ride-label">{names[model]}</span><button type="button" class="motion-toggle" aria-pressed="false" hidden>움직임 멈추기</button></div><figcaption>코코나라 캐릭터 일러스트 · 실제 차량의 외형·색상과 다를 수 있습니다.</figcaption></figure>'

def explore(route):
 items=[('udo/','01','처음 가는 제주도 우도','우도 여행 준비하기'),('udo-scooter/','02','한 사람에 한 대','코코 전기스쿠터 살펴보기'),('udo-electric-car/','03','둘이 함께하는 여행','파미·오픈카 비교하기'),('partners/','04','먹고, 걷고, 쉬어가기','협력업체 혜택 살펴보기'),('udo-course/','05','어디서 멈춰볼까요?','우도 지도·여행코스 보기'),('udo-ferry/','06','여행의 시작과 마무리','배시간·반납시간 확인하기')]
 return '<section class="section wrap explore"><div class="section-head"><div><p class="eyebrow">STAY A LITTLE LONGER</p><h2>우도 여행, 조금 더 둘러보세요.</h2></div></div><div class="explore-grid">'+''.join(f'<a class="explore-link" href="{url(r)}" data-event="content_click" data-placement="related"><span>{n}</span><small>{lead}</small><strong>{label} →</strong></a>' for r,n,lead,label in items if r!=route)+'</div></section>'

PAGES=json.loads((ROOT/'seo.pages.json').read_text())
def render(route,p):
 canonical=BASE+route
 navitems=[('','홈'),('udo-scooter/','스쿠터'),('udo-electric-car/','전기차'),('partners/','협력업체'),('udo/','우도 여행'),('udo-ferry/','배시간'),('guide/','이용안내')]
 nav=''.join(f'<a href="{url(r)}" data-event="content_click" data-placement="category" {"aria-current=page" if r==route or (r=="udo/" and route=="udo-course/") else ""}>{label}</a>' for r,label in navitems)
 b=C['business'];business=''.join(f'<div><dt>{label}</dt><dd>{esc(b.get(k) or "확인 중")}</dd></div>' for k,label in [('name','상호'),('representative','대표자'),('registrationNumber','사업자등록번호'),('address','사업장 주소'),('phone','문의 연락처'),('mailOrderNumber','통신판매업 신고번호')])
 schema=[{'@type':'Organization','@id':BASE+'#organization','name':'코코나라','url':BASE,'sameAs':C['sameAs']},{'@type':'WebSite','@id':BASE+'#website','name':'코코나라 우도 전기차·스쿠터','url':BASE,'inLanguage':'ko-KR','publisher':{'@id':BASE+'#organization'}},{'@type':'WebPage','@id':canonical+'#webpage','url':canonical,'name':p['title'],'description':p['description'],'inLanguage':'ko-KR','isPartOf':{'@id':BASE+'#website'},'dateModified':p['updatedAt'],'publisher':{'@id':BASE+'#organization'}}]
 if route in ['udo-electric-car/','udo-scooter/']:
  models=['fami','open'] if route=='udo-electric-car/' else ['coco']
  offers=[{'@type':'Offer','name':C['pricing']['vehicles'][m]['name']+' 정상가 대여','price':C['pricing']['vehicles'][m]['regular'],'priceCurrency':'KRW','url':C['bookingUrl'],'itemOffered':{'@type':'Service','name':C['pricing']['vehicles'][m]['name']+' 대여','description':C['pricing']['rentalPeriod']}} for m in models]
  schema.append({'@type':'Service','name':'코코나라 '+p['label']+' 대여','url':canonical,'provider':{'@id':BASE+'#organization'},'areaServed':{'@type':'Place','name':'우도'},'hasOfferCatalog':{'@type':'OfferCatalog','name':'정상 대여 요금','itemListElement':offers}})
 if route and not p.get('noindex'):schema.append({'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'코코나라','item':BASE},{'@type':'ListItem','position':2,'name':p['label'],'item':canonical}]})
 body=(ROOT/'src'/p['file']).read_text()
 if '{{TRAVEL_MAP}}' in body:body=body.replace('{{TRAVEL_MAP}}',render_map(PATH))
 replacements={'BASE':PATH,'BOOKING':booking(),'GUIDE':C['guideUrl'],'INQUIRY':C['inquiryUrl'],'LOCATION':location(),'CONDITIONS':conditions(),'PRICE':price(route),'RIDE':ride_scene('couple',True),'EXPLORE':explore(route)}
 for k,v in replacements.items():body=body.replace('{{'+k+'}}',v)
 for model in ['coco','fami','open']:
  body=body.replace('{{PRICE_'+model.upper()+'}}',inline_price(model))
  body=body.replace('{{REGULAR_'+model.upper()+'}}',f"{C['pricing']['vehicles'][model]['regular']:,}원")
  body=body.replace('{{DISCOUNT_'+model.upper()+'}}',f"{C['pricing']['vehicles'][model]['discount'] or C['pricing']['vehicles'][model]['regular']:,}원")
 for name,alt in [('coast','우도 하우목동항 주변 해안과 푸른 바다'),('beach','우도 하고수동해수욕장의 바다와 해안'),('biyang','우도 비양도의 해안 풍경')]:
  body=body.replace('{{PHOTO_'+name.upper()+'}}',photo(name,alt,not(route in ['udo-course/','udo/'] and name=='coast')))
 for model in ['coco','fami','open']:
  body=body.replace('{{VEHICLE_'+model.upper()+'}}',ride_scene(model,route=={'coco':'udo-scooter/','fami':'udo-electric-car/','open':None}[model]))
 verification=f'<meta name="naver-site-verification" content="{esc(C["naverVerification"])}">' if C['naverVerification'] else ''
 extras=''
 if route in ['', 'udo-ferry/']:extras+=f'<meta name="udosignature-ferry-source" content="{esc(C["ferrySource"])}">'
 if route in ['', 'udo-ferry/']:extras+=f'<script src="{asset_url("assets/ferry.js")}" defer></script>'
 if route=='udo-course/':extras+=f'<script src="{asset_url("assets/travel-map.js")}" defer></script>'
 header=f'<div class="customer-bar">하우목동항에서 시작하는, 우리다운 우도 여행 <a href="{url("guide/")}">예약 고객 이용안내 →</a></div><header class="site-header"><div class="wrap brand-row"><a class="logo" href="{url()}" aria-label="코코나라 홈"><span class="logo-mark" aria-hidden="true">c</span><span>코코나라<small>COCONARA · UDO</small></span></a><div class="header-actions"><a href="{url("guide/#languages")}" lang="en">Languages</a>{booking("예약하기","header")}</div></div><nav class="wrap category-nav" aria-label="주 메뉴">{nav}</nav></header>'
 footer=f'<section class="closing"><div class="wrap"><p class="eyebrow">SEE YOU IN UDO</p><h2>우도에서의 좋은 하루,<br>코코나라와 함께.</h2><p>나에게 맞는 차량을 고르고, 여행의 혜택까지 챙겨보세요.</p>{booking("가격·예약 확인","closing")}</div></section><footer class="site-footer"><div class="wrap"><div class="footer-top"><div><a class="logo" href="{url()}">코코나라</a><p>우도 하우목동항 전기차·전기스쿠터 대여</p></div><div class="footer-links"><a href="{url("guide/")}">이용안내</a><a href="{C["guideUrl"]}" data-event="guide_click">기존 고객 안내 홈페이지 ↗</a><a href="{C["inquiryUrl"]}" target="_blank" rel="noopener noreferrer" data-event="inquiry_click">네이버 톡톡 문의 ↗</a></div></div><dl class="business">{business}</dl><div class="copyright"><span>© 코코나라 · udosignature는 코코나라의 홈페이지 프로젝트입니다.</span><span>운영시간: {esc(b["openingHours"] or "예약 전 문의")}</span></div></div></footer><div class="mobile-cta" aria-label="빠른 예약"><a class="btn secondary" href="{url("#vehicles") if route=="" else "#booking" if route in ["udo-electric-car/","udo-scooter/"] else url("udo-ferry/")}">{"차량 비교" if route=="" else "요금·조건" if route in ["udo-electric-car/","udo-scooter/"] else "배시간 확인"}</a>{booking("가격·예약","mobile")}</div>'
 return f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{esc(p['title'])}</title><meta name="description" content="{esc(p['description'])}"><meta name="robots" content="{'noindex, follow' if p.get('noindex') else 'index, follow, max-image-preview:large'}"><link rel="canonical" href="{canonical}"><meta property="og:type" content="website"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="코코나라"><meta property="og:title" content="{esc(p['title'])}"><meta property="og:description" content="{esc(p['description'])}"><meta property="og:url" content="{canonical}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="{esc(p['title'])}"><meta name="twitter:description" content="{esc(p['description'])}"><meta name="theme-color" content="#f7c2d4">{verification}<link rel="icon" href="{url('assets/favicon.svg')}" type="image/svg+xml"><link rel="stylesheet" href="{asset_url('assets/site.css')}"><script src="{asset_url('assets/site.js')}" defer></script>{extras}<script type="application/ld+json">{json.dumps({'@context':'https://schema.org','@graph':schema},ensure_ascii=False).replace('<',chr(92)+'u003c')}</script></head><body data-page="{route or 'home'}"><a class="skip" href="#main">본문 바로가기</a>{header}<main id="main">{body}</main>{explore(route) if route!='404.html' else ''}{footer}</body></html>'''
for route,p in PAGES.items():
 target=D/route if route.endswith('.html') else D/route/'index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(render(route,p))
urls=[(BASE+r,p['updatedAt']) for r,p in PAGES.items() if not p.get('noindex')]
(D/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+esc(u)+'</loc><lastmod>'+date+'</lastmod></url>' for u,date in urls)+'</urlset>\n')
(D/'robots.txt').write_text('# Project-path copy. Crawlers use origin /robots.txt; see README.\nUser-agent: *\nAllow: /\nSitemap: '+BASE+'sitemap.xml\n')
# IndexNow proof is scoped to this project path; it grants no repository or database access.
key=C.get('indexNowKey')
if key:
 import re
 assert re.fullmatch(r'[a-fA-F0-9-]{8,128}',key)
 (D/(key+'.txt')).write_text(key,encoding='utf-8')
(D/'.nojekyll').touch()
assert not (D/'CNAME').exists()
print('Built',len(PAGES),'static HTML pages for',BASE)
