"""Deployment checks: SEO, cross-page fragments, redirect targets, isolation and assets."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,unquote
import json,re,xml.etree.ElementTree as ET
R=Path(__file__).resolve().parents[1];D=R/'docs';C=json.loads((R/'site.config.json').read_text());BASE=C['baseUrl'];prefix=urlparse(BASE).path
meta=json.loads((R/('pages.json' if (R/'pages.json').exists() else 'seo.pages.json')).read_text());errors=[]
class Page(HTMLParser):
 def __init__(self,s):super().__init__();self.tags=[];self.ids=[];self.feed(s)
 def handle_starttag(self,t,attrs):
  a=dict(attrs);self.tags.append((t,a))
  if a.get('id'):self.ids.append(a['id'])
def check(test,message):
 if not test:errors.append(message)
files={p:Page(p.read_text()) for p in D.rglob('*.html')};titles=[];descs=[];refs=0
for route,m in meta.items():
 path=D/route if route.endswith('.html') else D/route/'index.html';check(path.exists(),'Missing route: '+route)
 if not path.exists():continue
 s=path.read_text();p=files[path];redirect=m.get('redirect');canonical=redirect or BASE+route
 check(len(re.findall(r'<h1(?:\s[^>]*)?>',s))==1,route+': H1')
 check('{{' not in s,route+': unresolved template');check(len(p.ids)==len(set(p.ids)),route+': duplicate ID')
 titles.append(re.search(r'<title>(.*?)</title>',s).group(1))
 desc=[a['content'] for t,a in p.tags if t=='meta' and a.get('name')=='description'];check(len(desc)==1,route+': description');descs+=desc if not redirect else []
 can=[a.get('href') for t,a in p.tags if t=='link' and a.get('rel')=='canonical'];check(can==[canonical],route+': canonical')
 robots=[a.get('content','') for t,a in p.tags if t=='meta' and a.get('name')=='robots'];check(len(robots)==1 and (('noindex' in robots[0])==bool(C.get('private') or m.get('noindex') or redirect)),route+': indexing policy')
 if redirect:check('location.replace' in s and 'http-equiv="refresh"' in s,route+': redirect fallback')
 else:
  schema=re.findall(r'<script type="application/ld\+json">(.*?)</script>',s);check(bool(schema),route+': structured data')
  for payload in schema:check(json.loads(payload).get('@context')=='https://schema.org',route+': schema JSON')
 for t,a in p.tags:
  if t=='img':check(bool(a.get('alt')) and bool(a.get('width')) and bool(a.get('height')),route+': image metadata')
  if t=='iframe':check(a.get('src')=='https://guide.udosignature.com/',route+': unauthorized iframe')
  links=[a[k] for k in ['href','src'] if a.get(k)]
  if a.get('srcset'):links += [v.strip().split()[0] for v in a['srcset'].split(',')]
  for href in links:
   u=urlparse(href)
   if u.scheme or u.netloc:continue
   refs+=1
   if not u.path:target=path
   else:
    check(u.path.startswith(prefix),route+': bad base path '+href)
    target=D/unquote(u.path.removeprefix(prefix))
    if u.path.endswith('/'):target=target/'index.html'
   check(target.is_file(),route+': broken local reference '+href)
   if u.fragment and target in files and 'http-equiv="refresh"' not in target.read_text():check(unquote(u.fragment) in files[target].ids,route+': missing anchor '+href)
 check('firebase-app' not in s and 'firebase-auth' not in s,route+': copied admin runtime')
check(len(titles)==len(set(titles)),'Duplicate page titles');check(len(descs)==len(set(descs)),'Duplicate page descriptions')
check(len(files)==len(meta),'Unexpected stale HTML files')
sm=[n.text for n in ET.parse(D/'sitemap.xml').findall('.//{*}loc')];expected=[BASE+r for r,m in meta.items() if not (m.get('noindex') or m.get('redirect') or C.get('private'))];check(sm==expected,'Sitemap exact routes')
if C.get('private'):
 check(not (D/'CNAME').exists(),'Private preview has CNAME');check('Disallow: /' in (D/'robots.txt').read_text(),'Private robots');check(not (R/'.github').exists(),'Private preview has deployment workflow')
else:check((D/'CNAME').read_text().strip()==urlparse(BASE).hostname,'Wrong deployment domain')
check(not (R/'.openai').exists(),'Unexpected Sites hosting configuration')
for f in (D/'assets').glob('*.js'):
 for token in ['firebase.initializeApp','firebase.database','firebase.auth','.setItem(','method:\'POST\'','method:\'PUT\'','method:\'PATCH\'','method:\'DELETE\'']:
  check(token not in f.read_text(),'Unapproved writes in '+f.name)
if (R/'assets/ferry.js').exists():check("method:'GET'" in (R/'assets/ferry.js').read_text(),'Ferry must remain read-only')
report=dict(site=C.get('project'),pages=len(files),indexed=len(sm),localReferences=refs,publicBytes=sum(f.stat().st_size for f in D.rglob('*') if f.is_file()),errors=errors)
import runpy
runpy.run_path(str(R/'scripts/check-seo.py'))
print(json.dumps(report,ensure_ascii=False,indent=2));raise SystemExit(bool(errors))
