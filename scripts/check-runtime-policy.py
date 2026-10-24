"""Mutation checks: the administrator exception must not authorize broader writes."""
from pathlib import Path
from html.parser import HTMLParser
import json
from runtime_policy import runtime_errors

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs'
manifest = json.loads((ROOT / 'pages.json').read_text())


class Scripts(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.urls = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script' and attrs.get('src'):
            self.urls.append(attrs['src'])


scripts = {file.relative_to(DOCS).as_posix(): file.read_text()
           for file in [*DOCS.rglob('*.js'), *DOCS.rglob('*.mjs')]}
pages = []
for route, info in manifest.items():
    path = DOCS / route if route.endswith('.html') else DOCS / route / 'index.html'
    pages.append({'route': route, 'admin': info.get('admin', False), 'noindex': info.get('noindex', False),
                  'scripts': Scripts(path.read_text()).urls})
assert not runtime_errors(scripts, pages), runtime_errors(scripts, pages)

if 'admin.js' in scripts:
    mutations = [
        ('admin.js', "database.ref('ferryStatus')", "database.ref('otherBusinessData')"),
        ('admin.js', "ferryRef = database.ref('ferryStatus')", "ferryRef = database.ref('ferryStatus').child('unapproved')"),
        ('admin.js', 'ref: ferryRef', 'ref: otherRef'),
        ('admin.js', 'Persistence.NONE', 'Persistence.LOCAL'),
        ('admin-core.mjs', 'await ref.set(payload)', 'await ref.update(payload)'),
        ('admin-core.mjs', 'if (!isAllowedAdmin(auth, authReady))', 'if (false)'),
        ('admin-core.mjs', 'auth?.currentUser?.uid === ADMIN_UID', 'auth?.currentUser?.uid !== ADMIN_UID'),
        ('admin-core.mjs', 'if (!connected || !timeReady)', 'if (false)'),
    ]
    for file, before, after in mutations:
        assert before in scripts[file], (file, before)
        changed = {**scripts, file: scripts[file].replace(before, after)}
        assert runtime_errors(changed, pages), f'Policy accepted mutation: {file}: {after}'
    for name, code in [('admin/extra.js', 'firebase.database().ref("other").set({});'),
                       ('extra.js', 'fetch("/anything", {method: "POST"});'),
                       ('extra.js', 'ref.set({unapproved: true});')]:
        assert runtime_errors({**scripts, name: code}, pages), f'Policy accepted extra write: {name}'
    assert runtime_errors(scripts, pages + [{'route': 'public/', 'admin': False, 'scripts': ['/admin.js']}]), 'Public direct admin entry accepted'
    changed = {**scripts, 'public-test.js': 'import "./admin-core.mjs";'}
    assert runtime_errors(changed, pages + [{'route': 'public/', 'admin': False, 'scripts': ['/public-test.js']}]), 'Public transitive admin import accepted'
    assert runtime_errors(scripts, [page for page in pages if not page['admin']]), 'Unattached admin module accepted'
print('PASS: runtime policy rejects alternate data paths, writes, persistence, missing guards and public admin imports')
