"""Check static SEO, subpath assets, links and isolation using the standard library."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,unquote
import json,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'docs';C=json.loads((ROOT/'site.config.json').read_text());base=C['baseUrl'];prefix=urlparse(base).path
class Page(HTMLParser):
 def __init__(self,s):super().__init__();self.tags=[];self.ids=set();self.feed(s)
 def handle_starttag(self,t,a):
  a=dict(a);self.tags.append((t,a))
  if 'id' in a:self.ids.add(a['id'])
pages={p:Page(p.read_text()) for p in D.rglob('*.html')}
titles=[];descriptions=[];errors=[];assets=set();links=0
for path,page in pages.items():
 s=path.read_text();name=str(path.relative_to(D));route='' if name=='index.html' else name.removesuffix('index.html')
 def check(cond,msg):
  if not cond:errors.append(name+': '+msg)
 check(s.count('<h1>')==1,'exactly one H1');check(len([1 for t,a in page.tags if 'id' in a])==len(page.ids),'duplicate element IDs');check('{{' not in s,'unresolved template')
 import re
 title=re.search(r'<title>(.*?)</title>',s).group(1);titles.append(title)
 desc=[a.get('content') for t,a in page.tags if t=='meta' and a.get('name')=='description'];check(len(desc)==1,'description');descriptions+=desc
 robots=[a.get('content','') for t,a in page.tags if t=='meta' and a.get('name')=='robots'];check(len(robots)==1,'robots meta')
 check(('noindex' in robots[0])==(route in ['guide/','404.html']),'index policy')
 canonical=[a.get('href') for t,a in page.tags if t=='link' and a.get('rel')=='canonical'];check(canonical==[base+route],'canonical mismatch')
 for payload in re.findall(r'<script type="application/ld\+json">(.*?)</script>',s):check(json.loads(payload).get('@context')=='https://schema.org','schema')
 for t,a in page.tags:
  if t=='img':check(bool(a.get('alt')) and a.get('width') and a.get('height'),'image alt/dimensions')
  if t=='a' and a.get('target')=='_blank':check('noopener' in a.get('rel',''),'new-tab security')
  refs=[a[k] for k in ('src','href') if k in a]
  if a.get('srcset'):refs += [item.strip().split()[0] for item in a['srcset'].split(',')]
  for ref in refs:
   u=urlparse(ref)
   if u.scheme or u.netloc:continue
   links+=1
   if not u.path:target=path
   else:
    check(u.path.startswith(prefix),'incorrect Pages subpath: '+ref)
    target=D/unquote(u.path.removeprefix(prefix))
    if u.path.endswith('/'):target=target/'index.html'
   check(target.is_file(),'missing local reference: '+ref)
   if u.fragment and target in pages:check(unquote(u.fragment) in pages[target].ids,'missing anchor: '+ref)
   if t in ['img','script','link'] and target.is_file():assets.add(target)
 for forbidden in ['firebase-app','firebase-auth','firebase-database-compat','관리자 모드','사진 추가','맛집 추가']:
  check(forbidden not in s,'legacy artifact '+forbidden)
check(len(titles)==len(set(titles)),'duplicate titles');check(len(descriptions)==len(set(descriptions)),'duplicate descriptions')
sm=ET.parse(D/'sitemap.xml');locs=[e.text for e in sm.findall('.//{*}loc')]
check(locs==[base,base+'udo-electric-car/',base+'udo-scooter/',base+'udo-course/',base+'partners/',base+'udo-ferry/'],'sitemap exact routes')
for name in ['coco.webp','fami.webp','open.webp']:
 check(not (D/'assets'/name).exists(),'obsolete vehicle photo: '+name)
 check(not (ROOT/'assets'/name).exists(),'obsolete source vehicle photo: '+name)
metadata=json.loads((ROOT/'seo.pages.json').read_text())
for route,p in metadata.items():
 from datetime import date
 check(date.fromisoformat(p['updatedAt'])<=date.today(),'future content date')
check(len(sm.findall('.//{*}lastmod'))==6,'sitemap modification dates')
check(not (ROOT/'.openai').exists(),'Sites deployment config copied');check(not (D/'CNAME').exists(),'custom domain unexpectedly set')
check((ROOT/'.git').is_dir(),'missing independent Git repository')
ferry=(ROOT/'assets/ferry.js').read_text()
check("method:'GET'" in ferry and "credentials:'omit'" in ferry,'ferry read-only GET')
for p in (D/'assets').glob('*.js'):
 for token in ['firebase.initializeApp','firebase.database','firebase.auth','.setItem(','method:\'POST\'','method:\'PUT\'','method:\'PATCH\'','method:\'DELETE\'']:
  check(token not in p.read_text(),'forbidden write/auth code '+token)
report={'pages':len(pages),'localReferences':links,'uniqueAssets':len(assets),'indexedPages':len(locs),'errors':errors,'totalPublicBytes':sum(p.stat().st_size for p in D.rglob('*') if p.is_file())}
print(json.dumps(report,ensure_ascii=False,indent=2))
if errors:raise SystemExit(1)
