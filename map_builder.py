"""Render a crawlable map from the supplied OSM geometry and place references."""
from pathlib import Path
from html import escape
import json,math
ROOT=Path(__file__).resolve().parent

def render_map(prefix):
 d=json.loads((ROOT/'content/map.json').read_text())
 points=[]
 def collect(x):
  if isinstance(x[0],(int,float)):points.append(x)
  else:
   for child in x:collect(child)
 for f in d['land']['features']:collect(f['geometry']['coordinates'])
 lon0=min(x[0] for x in points);lon1=max(x[0] for x in points);lat0=min(x[1] for x in points);lat1=max(x[1] for x in points)
 cos=math.cos(math.radians((lat0+lat1)/2));scale=min(620/((lon1-lon0)*cos),540/(lat1-lat0));sx=scale*cos;sy=scale
 ox=(700-(lon1-lon0)*sx)/2;oy=(620-(lat1-lat0)*sy)/2
 def xy(p):return ((p[0]-lon0)*sx+ox,(lat1-p[1])*sy+oy)
 def line(coords,close=False):return 'M'+'L'.join(f'{xy(p)[0]:.2f},{xy(p)[1]:.2f}' for p in coords)+('Z' if close else '')
 def geom(g):
  t=g['type'];c=g['coordinates']
  if t=='Polygon':return ''.join(line(r,True) for r in c)
  if t=='MultiPolygon':return ''.join(line(r,True) for poly in c for r in poly)
  if t=='LineString':return line(c)
  if t=='MultiLineString':return ''.join(line(r) for r in c)
  return ''
 paths=''.join(f'<path class="map-land" d="{geom(f["geometry"])}"/>' for f in d['land']['features'])
 paths+=''.join(f'<path class="map-road" d="{geom(f["geometry"])}"/>' for f in d['roads']['features'])
 paths+=f'<path class="map-route" d="{geom(d["route"])}"/>'
 pins='';tabs='';cards=''
 for i,p in enumerate(d['places'],1):
  x,y=xy([p['lon'],p['lat']]);key='spot-'+p['id'];name=escape(p['name'])
  pins+=f'<a href="#{key}" data-spot="{key}" aria-label="{name} 안내 보기"><circle class="map-pin" cx="{x:.2f}" cy="{y:.2f}" r="17"/><text class="map-number" x="{x:.2f}" y="{y+5:.2f}" text-anchor="middle">{i}</text></a>'
  tabs+=f'<a href="#{key}" data-spot="{key}"><span>{i:02}</span> {name}</a>'
  cards+=f'<article id="{key}" data-spot-card><img src="{prefix}assets/{p["image"]}" alt="{name} 위치 또는 풍경 안내" loading="lazy" width="{p["width"]}" height="{p["height"]}"><div><p class="eyebrow">STOP {i:02}</p><h3 tabindex="-1">{name}</h3><p>{escape(p["description"])}</p><a class="text-link" href="{prefix}{p["link"]}">{p["linkLabel"]} →</a></div></article>'
 return f'''<section class="section wrap" id="map"><div class="section-head"><div><p class="eyebrow">PICK YOUR STOPS</p><h2>지도에서 골라보는 우도 한 바퀴.</h2><p>번호나 장소 이름을 누르면 사진과 안내를 볼 수 있어요.</p></div></div><div data-travel-map><div class="travel-map-layout"><div class="map-panel"><svg viewBox="0 0 700 620" aria-labelledby="map-title map-desc" data-lon0="{lon0}" data-lat1="{lat1}" data-scale-x="{sx}" data-scale-y="{sy}" data-offset-x="{ox}" data-offset-y="{oy}"><title id="map-title">우도 해안도로와 주요 여행지 지도</title><desc id="map-desc">하우목동항 코코나라에서 출발해 해안도로를 따라 여행지를 둘러보는 참고 지도입니다.</desc>{paths}{pins}<text x="35" y="45" class="map-north">N ↑</text></svg><div class="map-tools"><button class="btn secondary" data-location hidden>내 위치 표시</button><span data-location-message>위치는 내 기기에만 표시하며 저장하지 않습니다.</span></div><p class="credits">지도 데이터: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap 기여자</a> · {d['sourceDate']} 자료. 위치 참고용이며 실시간 길안내가 아닙니다.</p></div><div class="map-content"><nav class="spot-tabs" aria-label="지도 장소 선택">{tabs}</nav><div class="spot-cards">{cards}</div></div></div></div><p class="fine">해안도로로만 운행해 주세요. 내비게이션이 마을 안쪽을 안내하더라도 매장에서 안내받은 운행 범위를 우선합니다.</p></section>'''
