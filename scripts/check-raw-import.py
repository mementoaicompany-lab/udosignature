"""Regression checks for preserving brands, raw HTML, ownership metadata and admin privacy."""
from pathlib import Path
import contextlib
import importlib.util
import io
import json
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from raw_site import render_raw_page, copy_raw_public

spec = importlib.util.spec_from_file_location('import_ferry', ROOT / 'scripts/import-ferry-site.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

with tempfile.TemporaryDirectory() as temp:
    root = Path(temp) / 'repo'
    dist = Path(temp) / 'dist'
    root.mkdir()
    dist.mkdir()
    config = {'baseUrl': 'https://udosignature.com/', 'googleVerification': 'google-current',
              'naverVerification': 'naver-current', 'indexNowKey': '12345678'}
    original = {'': {'title': 'Original brand home'}, 'brands/': {'title': 'Preserved brands'},
                'about/': {'title': 'Original about'}}
    (root / 'site.config.json').write_text(json.dumps(config))
    (root / 'pages.json').write_text(json.dumps(original))

    def page(route, title='New ferry'):
        return ('<!doctype html><html lang="ko"><head><title>' + title + '</title>'
                '<meta name="description" content="Test content">'
                '<meta name="google-site-verification" content="stale">'
                '<meta name="robots" content="index,follow">'
                '<link rel="canonical" href="https://udosignature.com/' + route + '">'
                '</head><body><h1>실제 본문</h1><script>const preserved = "<meta name=robots>";</script></body></html>')

    (dist / 'index.html').write_text(page(''))
    (dist / 'admin').mkdir()
    (dist / 'admin/index.html').write_text(page('admin/', 'Admin'))
    (dist / 'styles.css').write_text('body { color: green; }')
    (dist / 'robots.txt').write_text('User-agent: *\nDisallow: /')
    (dist / 'CNAME').write_text('wrong.example')
    with contextlib.redirect_stdout(io.StringIO()):
        module.import_site(dist, root)
    pages = json.loads((root / 'pages.json').read_text())
    assert pages['brands/'] == original['brands/']
    assert pages['about/'] == original['about/']
    assert pages['admin/']['admin'] and pages['admin/']['noindex']
    raw = (dist / 'index.html').read_text()
    rendered = render_raw_page(root, pages[''], config)
    assert rendered.split('</head>', 1)[1] == raw.split('</head>', 1)[1], 'Raw body changed'
    assert 'content="stale"' not in rendered and 'content="google-current"' in rendered
    assert rendered.count('name="google-site-verification"') == 1
    assert 'content="naver-current"' in rendered
    assert 'noindex,nofollow' in render_raw_page(root, pages['admin/'], config)
    assert not (root / 'ferry-source/public/CNAME').exists()
    assert not (root / 'ferry-source/public/robots.txt').exists()
    docs = root / 'docs'
    docs.mkdir()
    copy_raw_public(root, docs)
    assert (docs / 'styles.css').read_text() == 'body { color: green; }'
    # Unchanged raw bytes retain their existing sitemap lastmod.
    pages['']['updatedAt'] = '2025-01-02'
    (root / 'pages.json').write_text(json.dumps(pages))
    # A second import removes stale imported routes but preserves original ones.
    (dist / 'admin/index.html').unlink()
    with contextlib.redirect_stdout(io.StringIO()):
        module.import_site(dist, root)
    pages = json.loads((root / 'pages.json').read_text())
    assert 'admin/' not in pages
    assert pages['']['updatedAt'] == '2025-01-02', 'Unchanged import changed lastmod'
    assert pages['about/'] == original['about/']
    assert json.loads((root / 'ferry-source/import.json').read_text())['replacedPages'][''] == original['']
    # A brand asset conflict must fail before updating imported input or pages.
    before = (root / 'pages.json').read_bytes()
    (root / 'assets').mkdir()
    (root / 'assets/brand.css').write_text('preserved brand')
    (dist / 'assets').mkdir()
    (dist / 'assets/brand.css').write_text('conflicting new style')
    try:
        module.import_site(dist, root)
        raise AssertionError('Asset conflict was accepted')
    except ValueError as error:
        assert 'conflicts' in str(error)
    assert (root / 'pages.json').read_bytes() == before
    assert (root / 'assets/brand.css').read_text() == 'preserved brand'

print('PASS: raw body preserved, ownership tags retained, admin excluded, repeated imports, assets collision protection')
