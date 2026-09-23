"""Notify Naver about this project's published, indexable URLs. Never submits sibling sites."""
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime,timezone
import argparse,json,re,subprocess,tempfile,sys
ROOT=Path(__file__).resolve().parents[1]
def request(url,*,payload=None):
 cmd=['curl','--silent','--show-error','--max-time','30','--write-out','\n%{http_code}',url]
 with tempfile.TemporaryDirectory() as td:
  if payload is not None:
   p=Path(td)/'request.json';p.write_text(json.dumps(payload),encoding='utf-8')
   cmd+=['--request','POST','--header','Content-Type: application/json; charset=utf-8','--data-binary','@'+str(p)]
  r=subprocess.run(cmd,capture_output=True,check=True)
 body,status=r.stdout.rsplit(b'\n',1)
 return int(status),body

def main():
 args=argparse.ArgumentParser(description=__doc__);args.add_argument('--submit',action='store_true');args.add_argument('--output',type=Path);a=args.parse_args()
 c=json.loads((ROOT/'site.config.json').read_text());pages=json.loads((ROOT/('seo.pages.json' if (ROOT/'seo.pages.json').exists() else 'pages.json')).read_text())
 base=c['baseUrl'];key=c['indexNowKey'];u=urlparse(base)
 if base!='https://udosignature.com/':raise SystemExit('Review this script before changing the domain.')
 if not re.fullmatch(r'[a-fA-F0-9-]{8,128}',key):raise SystemExit('Invalid IndexNow proof.')
 urls=[base+r for r,p in pages.items() if not p.get('noindex') and not p.get('redirect') and not c.get('private')]
 key_url=base+key+'.txt'
 for target in urls:
  v=urlparse(target)
  if v.scheme!='https' or v.netloc!=u.netloc or not v.path.startswith(u.path):raise SystemExit('URL outside this independent project.')
 report={'time':datetime.now(timezone.utc).isoformat(),'endpoint':'https://searchadvisor.naver.com/indexnow','urlCount':len(urls),'urls':urls,'submitted':False}
 if a.submit:
  status,body=request(key_url)
  if status!=200 or body.decode('utf-8')!=key:raise SystemExit('Publish and verify the proof file before notifying Naver.')
  # Ensure the deployed pages exactly match this reviewed build before announcing them.
  for route,p in pages.items():
   if p.get('noindex') or p.get('redirect') or c.get('private'):continue
   status,body=request(base+route)
   local=ROOT/'docs'/route/'index.html'
   if status!=200 or body!=local.read_bytes():raise SystemExit('Published page differs: '+base+route)
  status,body=request(report['endpoint'],payload={'host':u.netloc,'key':key,'keyLocation':key_url,'urlList':urls})
  report.update(submitted=True,httpStatus=status,response=body.decode('utf-8',errors='replace')[:1000],meaning={200:'URL notification succeeded; indexing is not guaranteed.',202:'URLs received; proof validation pending.'}.get(status,'Submission did not succeed; inspect the response.'))
 if a.output:a.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report,ensure_ascii=False,indent=2))
 if a.submit and report['httpStatus'] not in (200,202):return 1
 return 0
if __name__=='__main__':sys.exit(main())
