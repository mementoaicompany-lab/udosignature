"""Check public verification, linked data consistency and crawlable editorial content."""
from pathlib import Path
from html.parser import HTMLParser
from html import unescape
import json,re
R=Path(__file__).resolve().parents[1];C=json.loads((R/'site.config.json').read_text())
P=json.loads((R/('seo.pages.json' if (R/'seo.pages.json').exists() else 'pages.json')).read_text())
E=json.loads((R/'seo.content.json').read_text());count=0
class Text(HTMLParser):
 def __init__(self,s):super().__init__();self.parts=[];self.skip=0;self.feed(s)
 def handle_starttag(self,t,a):
  if t in ['script','style']:self.skip+=1
 def handle_endtag(self,t):
  if t in ['script','style']:self.skip-=1
 def handle_data(self,d):
  if not self.skip:self.parts.append(d)
for route,p in P.items():
 if p.get('redirect'):continue
 f=R/'docs'/route if route.endswith('.html') else R/'docs'/route/'index.html'
 s=f.read_text();visible=' '.join(Text(s).parts)
 assert f'name="google-site-verification" content="{C["googleVerification"]}"' in s,route+' Google proof'
 assert f'name="naver-site-verification" content="{C["naverVerification"]}"' in s,route+' Naver proof'
 g=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',s)[1])['@graph']
 web=next(x for x in g if x['@type']=='WebPage');assert web['url']==C['baseUrl']+route
 assert web['name']==p['title'] and web['description']==p['description'],route+' snippet/schema drift'
 for q,a in E.get(route,{}).get('faq',[]):assert q in visible and a in visible,route+' hidden FAQ'
 for x in g:
  if x['@type']=='FAQPage':
   for q in x['mainEntity']:assert q['name'] in visible and q['acceptedAnswer']['text'] in visible,route+' FAQ drift'
 if C.get('theme') in ['peanut','cafe']:
  assert not any(x['@type'] in ['LocalBusiness','Product','Store','CafeOrCoffeeShop'] for x in g),'Unopened shop claims'
 assert 'name="keywords"' not in s,'Do not substitute keyword stuffing for useful content'
 count+=1
key=C['indexNowKey'];assert (R/'docs'/(key+'.txt')).read_text()==key
assert 'Sitemap: '+C['baseUrl']+'sitemap.xml' in (R/'docs/robots.txt').read_text()
print(f'SEO verification: {count} pages, visible FAQ parity, canonical graph, 2 search verification tags, IndexNow proof OK')
