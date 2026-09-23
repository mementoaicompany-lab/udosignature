"""Visible editorial Q&A and structured data, built from one source of truth."""
from html import escape

def faq_html(items):
    if not items:
        return ''
    return '<section class="wrap section seo-questions"><h2>여행 전에 자주 묻는 질문</h2>' + ''.join(
        '<details><summary>'+escape(q)+'</summary><p>'+escape(a)+'</p></details>' for q,a in items
    ) + '</section>'

def enrich(graph, config, route, page, editorial):
    base=config['baseUrl']; theme=config.get('theme','coconara')
    website=next(x for x in graph if x['@type']=='WebSite')
    website['alternateName']=config.get('alternateName',config.get('name','코코나라'))
    webpage=next(x for x in graph if x['@type']=='WebPage')
    webpage['dateModified']=page.get('updatedAt',webpage['dateModified'])
    if theme=='coconara':
        business=graph[0]
        business.update({'@type':'LocalBusiness','alternateName':'우도 코코나라',
            'logo':base+'assets/coconara-symbol.svg','image':base+'assets/couple-coast-1280.webp',
            'hasMap':'https://map.naver.com/p/entry/place/1159900207'})
    if theme=='signature':
        website['publisher']={'@id':base+'#organization'}
    if theme=='dalkom':
        website['publisher']={'@id':base+'#shop'}
        if route=='menu/':
            graph.append({'@type':'Menu','@id':base+'menu/#menu','name':'달콤아재 아이스크림 메뉴',
                'url':base+'menu/','hasMenuSection':{'@type':'MenuSection','name':'수제 아이스크림',
                'hasMenuItem':[{'@type':'MenuItem','name':name,'offers':{'@type':'Offer','price':'6500','priceCurrency':'KRW'}}
                for name in ['우도땅콩 아이스크림','한라봉 아이스크림']]}})
    if theme=='travel' and route=='places/':
        graph.append({'@type':'ItemList','name':'우도 가볼만한곳','itemListElement':[
            {'@type':'ListItem','position':i+1,'name':name,'url':base+'places/#'+anchor}
            for i,(name,anchor) in enumerate([('하고수동해수욕장','hagosudong'),('우도 비양도','biyang'),
                ('검멀레해변','geommeolle'),('서빈백사','seobin'),('망루등대','mangru'),('훈데르트바서파크','art')])]})
    questions=editorial.get(route,{}).get('faq',[])
    if questions:
        # This describes visible content; it is not a promise of a search rich result.
        graph.append({'@type':'FAQPage','@id':base+route+'#questions','mainEntity':[
            {'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a}} for q,a in questions]})
    return graph
