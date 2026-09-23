"""Static HTML builder for one independent Udo Signature brand. Python stdlib only."""
from pathlib import Path
from urllib.parse import urlparse
from html import escape
import json,shutil,re,hashlib
R=Path(__file__).resolve().parent; C=json.loads((R/'site.config.json').read_text()); P=json.loads((R/'pages.json').read_text()); D=R/'docs'; BASE=C['baseUrl']; PREFIX=urlparse(BASE).path
if D.exists():shutil.rmtree(D)
D.mkdir();shutil.copytree(R/'assets',D/'assets')
def e(s):return escape(str(s),quote=True)
def rel(s=''):return PREFIX+s.lstrip('/')
def asset(s):return rel('assets/'+s)
def link(href,label,cls='btn'):return f'<a class="{cls}" href="{href}">{label}</a>'
FAMILY=[('우도 시그니처','https://udosignature.com/'),('우도여행','https://udo.udosignature.com/'),('코코나라','https://coconara.udosignature.com/'),('달콤아재','https://dalkom-aje.udosignature.com/'),('우도씨앗 · 준비중','https://udopeanut.udosignature.com/'),('우도 키에키 · 준비중','https://udocafe.udosignature.com/')]
navs={'signature':[('','홈'),('#brands','우리의 브랜드'),('about/','브랜드 이야기')],'travel':[('','홈·지도'),('places/','가볼만한곳'),('course/','여행코스'),('ferry/','배시간·가는 법')],'dalkom':[('','홈'),('menu/','아이스크림'),('story/','달콤한 이야기'),('visit/','오시는 길')],'peanut':[('','우도씨앗'),('#story','브랜드 이야기'),('#news','오픈 소식')],'cafe':[('','HOME / 우도 키에키'),('#mood','SPACE / 공간'),('#coffee','COFFEE / 커피'),('#opening','COMING SOON / 오픈 안내')]}
nav=''.join(link(rel(r),label,'nav-link') for r,label in navs[C['theme']])
family=''.join(link(u,n,'family-link') for n,u in FAMILY)
def photograph(name,alt,eager=False,cls=''):
 dims={'coast-960.webp':(960,539),'beach-960.webp':(960,1440),'biyang-960.webp':(960,640),'dalkom.webp':(900,877),'couple-coast-1280.webp':(1280,853),'geommeolle.webp':(480,600),'seobin.webp':(900,600),'mangru.webp':(900,506),'hundert.webp':(1100,733),'dal_2.jpg':(1856,1330),'dal_4.jpg':(1462,1774)}
 w,h=dims[name];return f'<img class="{cls}" src="{asset(name)}" width="{w}" height="{h}" alt="{e(alt)}" loading="{"eager" if eager else "lazy"}" {"fetchpriority=high" if eager else ""}>'
for route,p in P.items():
 canonical=BASE+route
 if p.get('redirect'):
  target=p['redirect'];content=f'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(p["title"])}</title><meta name="description" content="{e(p["description"])}"><meta name="robots" content="noindex,follow"><link rel="canonical" href="{e(target)}"><meta http-equiv="refresh" content="0;url={e(target)}"></head><body><h1>{e(p["title"])}</h1><p>이 안내의 새 주소입니다.</p><a href="{e(target)}">새 홈페이지에서 계속 보기</a><script>location.replace({json.dumps(target)}+location.search+location.hash)</script></body></html>'
 else:
  body=(R/'src'/p['file']).read_text()
  for k,v in [('ROOT',PREFIX),('FAMILY',family)]:body=body.replace('{{'+k+'}}',v)
  body=re.sub(r'\{\{IMG:([^|}]+)\|([^|}]+)(?:\|(eager))?\}\}',lambda m:photograph(m[1],m[2],bool(m[3])),body)
  dims=json.loads((R/'image-sizes.json').read_text())
  def add_image_size(m):
   tag=m[0]
   if 'width=' in tag:return tag
   name=re.search(r'src="[^"]*/assets/([^"]+)"',tag)[1]
   w,h=dims[name]
   return tag[:-1]+f' width="{w}" height="{h}">'
  body=re.sub(r'<img\b[^>]*>',add_image_size,body)
  extra=''
  if '{{MAP}}' in body:
   from map_builder import render_map
   body=body.replace('{{MAP}}',render_map(PREFIX));extra+=f'<script src="{asset("travel-map.js")}" defer></script>'
  if '{{FERRY}}' in body:
   body=body.replace('{{FERRY}}',(R/'src/ferry-panel.html').read_text().replace('{{ROOT}}',PREFIX));extra+=f'<meta name="udosignature-ferry-source" content="https://coconara-52bc4-default-rtdb.firebaseio.com/ferryStatus.json"><script src="{asset("ferry.js")}" defer></script>'
  graph=[{'@type':'WebSite','@id':BASE+'#website','name':C['name'],'url':BASE,'inLanguage':'ko-KR'},{'@type':'WebPage','@id':canonical+'#webpage','url':canonical,'name':p['title'],'description':p['description'],'isPartOf':{'@id':BASE+'#website'},'dateModified':C.get('designUpdatedAt',C['checkedAt']),'inLanguage':'ko-KR'}]
  if C['theme']=='signature':graph.append({'@type':'Organization','@id':BASE+'#organization','name':'우도 시그니처','url':BASE,'logo':BASE+'assets/signature-logo.png','description':'우도의 여행과 로컬 브랜드를 소개하는 우도 시그니처.'})
  if C['theme']=='dalkom':graph.append({'@type':'IceCreamShop','@id':BASE+'#shop','name':'달콤아재','url':BASE,'image':BASE+'assets/dalkom.webp','telephone':'0507-1322-3829','address':{'@type':'PostalAddress','streetAddress':'우도면 우도해안길 810','addressLocality':'제주시','addressRegion':'제주특별자치도','addressCountry':'KR'},'sameAs':['https://map.naver.com/p/entry/place/1497457696','https://blog.naver.com/dalcomajae'],'hasMenu':BASE+'menu/'})
  if route and not p.get('noindex'):graph.append({'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':C['name'],'item':BASE},{'@type':'ListItem','position':2,'name':p['label'],'item':canonical}]})
  verification=f'<meta name="naver-site-verification" content="{C["naverVerification"]}">' if C.get('naverVerification') else ''
  noindex=p.get('noindex') or C['private'];robots='noindex,nofollow' if C['private'] else 'noindex,follow' if noindex else 'index,follow,max-image-preview:large'
  logo=f'<img src="{asset("signature-logo.png")}" width="328" height="196" alt="우도 시그니처">' if C['theme']=='signature' else f'<span class="wordmark">{C["name"]}<small>{dict(travel="UDO, YOUR WAY",dalkom="SWEET MOMENTS IN UDO",peanut="SMALL SEED, NEW STORY",cafe="A SLOW MOMENT")[C["theme"]]}</small></span>'
  top='비공개 디자인 시안 · 실제 오픈·메뉴·영업 정보가 아닙니다' if C['private'] else '우도에서 만나, 오래 기억되는 하루'
  mobile={'signature':('https://udo.udosignature.com/','우도 여행 시작하기'),'travel':(rel('#map') if route=='' else rel(),'우도 지도 보기'),'dalkom':('https://map.naver.com/p/entry/place/1497457696','달콤아재 찾아가기'),'peanut':('https://udosignature.com/','우도 시그니처 둘러보기'),'cafe':(rel('#opening'),'우도점 오픈 안내')}[C['theme']]
  business='<p>코코나라 · 대표 김경택 (공동사업자 김지원)<br>사업자등록번호 101-34-52349 · 통신판매업 제2020-제주우도-0011호<br>제주특별자치도 제주시 우도면 우목길 105 · <a href="tel:0507-1373-2359">0507-1373-2359</a></p>' if C['theme']=='signature' else '<p>달콤아재 · 제주특별자치도 제주시 우도면 우도해안길 810<br><a href="tel:0507-1322-3829">0507-1322-3829</a> · <a href="https://blog.naver.com/dalcomajae">브랜드 블로그 ↗</a></p>' if C['theme']=='dalkom' else ''
  contact='<a href="https://guide.udosignature.com/">코코나라 예약 고객 안내 ↗</a>' if C['theme'] in ['signature','travel'] else ''
  search=f'<form class="tour-search" action="{rel("places/")}" method="get" role="search"><input type="search" name="q" aria-label="우도 여행지 검색" placeholder="어떤 우도를 찾으세요?" maxlength="80"><button type="submit">검색</button></form>' if C['theme']=='travel' else ''
  content=f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(p['title'])}</title><meta name="description" content="{e(p['description'])}"><meta name="robots" content="{robots}"><link rel="canonical" href="{canonical}"><meta property="og:type" content="website"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="{C['name']}"><meta property="og:title" content="{e(p['title'])}"><meta property="og:description" content="{e(p['description'])}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{BASE}assets/{'dalkom.webp' if C['theme']=='dalkom' else 'kiekee-stand.webp' if C['theme']=='cafe' else 'coast-960.webp'}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#fffaf4">{verification}<link rel="icon" href="{asset('favicon.svg')}" type="image/svg+xml"><link rel="stylesheet" href="{asset('brand.css')}"><script src="{asset('brand.js')}" defer></script>{extra}<script type="application/ld+json">{json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False).replace('<',chr(92)+'u003c')}</script></head><body class="{C['theme']}" data-route="{e(route)}" data-site="{C['project']}"><a class="skip" href="#main">본문 바로가기</a><div class="topline"><span>{top}</span><a href="https://udosignature.com/">UDO SIGNATURE FAMILY ↗</a></div><header><div class="header-inner wrap"><a class="brand" href="{rel()}">{logo}</a>{search}<nav aria-label="주 메뉴">{nav}</nav><a class="header-cta" href="{mobile[0]}">{mobile[1]} ↗</a></div></header><main id="main">{body}</main><footer><div class="wrap footer-grid"><div><strong>{C['name']}</strong><p>우도의 풍경, 사람, 그리고 우리다운 순간.</p>{business}{contact}</div><div class="family"><p>OUR FAMILY</p>{family}</div></div><div class="wrap legal"><span>© {C['name']}</span><a href="{rel('privacy/')}">개인정보 안내</a><span>MADE OF MOMENTS, IN UDO.</span></div></footer><div class="mobile-bar">{link(mobile[0],mobile[1]+' ↗')}</div></body></html>'''
 target=D/route if route.endswith('.html') else D/route/'index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(content)
urls=[BASE+r for r,p in P.items() if not p.get('noindex') and not p.get('redirect') and not C['private']]
(D/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{e(u)}</loc><lastmod>{C.get('designUpdatedAt',C['checkedAt'])}</lastmod></url>' for u in urls)+'</urlset>')
(D/'robots.txt').write_text('User-agent: *\n'+('Disallow: /\n' if C['private'] else 'Allow: /\nSitemap: '+BASE+'sitemap.xml\n'))
(D/'.nojekyll').touch()
if C['domain']:(D/'CNAME').write_text(C['domain']+'\n')
print(f'{C["name"]}: {len(P)} pages / {len(urls)} indexed / {"PRIVATE LOCAL ONLY" if C["private"] else C["domain"]}')
