#!/usr/bin/env python3
"""Import a finished static ferry dist as reproducible input. Does not build or deploy."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import argparse
from datetime import datetime, timedelta, timezone
import json
import re
import shutil
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from raw_site import SOURCE_DIR, MANAGED_ROOT


class PageInfo(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.title = ''
        self.in_title = False
        self.description = None
        self.canonical = None
        self.robots = ''
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title':
            self.in_title = True
        if tag == 'meta':
            name = attrs.get('name', '').lower()
            if name == 'description':
                self.description = attrs.get('content', '')
            if name == 'robots':
                self.robots += ',' + attrs.get('content', '')
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href')

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def import_site(dist, root=ROOT):
    dist = dist.resolve()
    if not (dist / 'index.html').is_file():
        raise ValueError('dist must contain index.html')
    config = json.loads((root / 'site.config.json').read_text())
    current = json.loads((root / 'pages.json').read_text())
    source_dir = root / SOURCE_DIR
    old_manifest_path = source_dir / 'import.json'
    old_manifest = json.loads(old_manifest_path.read_text()) if old_manifest_path.exists() else {}
    pages = {r: p for r, p in current.items() if not p.get('rawFile', '').startswith(SOURCE_DIR + '/')}
    for route, entry in old_manifest.get('replacedPages', {}).items():
        pages.setdefault(route, entry)
    replaced, imported, files = {}, [], []
    public_exts = {'.css', '.js', '.mjs', '.json', '.svg', '.webp', '.png', '.jpg',
                   '.jpeg', '.gif', '.ico', '.avif', '.woff', '.woff2', '.ttf', '.txt', '.xml'}
    for file in sorted(dist.rglob('*')):
        if file.is_symlink():
            raise ValueError(f'Symlink rejected: {file.relative_to(dist)}')
        if not file.is_file():
            continue
        rel = file.relative_to(dist)
        if len(rel.parts) == 1 and rel.name in MANAGED_ROOT:
            continue
        if any(part.startswith('.') for part in rel.parts):
            raise ValueError(f'Hidden file rejected: {rel}')
        if file.suffix.lower() == '.html':
            route = '' if str(rel) == 'index.html' else str(rel.parent) + '/' if rel.name == 'index.html' else str(rel)
            info = PageInfo(file.read_text(encoding='utf-8'))
            if not info.title.strip() or not info.description:
                raise ValueError(f'Page needs title and description: {rel}')
            if info.canonical != config['baseUrl'] + route:
                raise ValueError(f'Canonical mismatch for {rel}: {info.canonical}')
            if route in {'brands/', 'brands/story/'}:
                raise ValueError(f'Imported page would replace preserved brand content: {route}')
            admin = route == 'admin/' or route.startswith('admin/')
            noindex = admin or route == '404.html' or 'noindex' in info.robots.lower()
            if route in pages:
                replaced[route] = pages[route]
            page = {'title': info.title.strip(), 'description': info.description,
                    'label': info.title.split('|')[0].strip(),
                    'rawFile': f'{SOURCE_DIR}/html/{rel.as_posix()}',
                    'updatedAt': datetime.now(timezone(timedelta(hours=9))).date().isoformat()}
            if noindex:
                page['noindex'] = True
            if admin:
                page['admin'] = True
            previous = current.get(route, {})
            old_source = root / previous.get('rawFile', '__missing_raw_source__')
            if previous.get('rawFile', '').startswith(SOURCE_DIR + '/') and old_source.is_file():
                if old_source.read_bytes() == file.read_bytes() and previous.get('updatedAt'):
                    page['updatedAt'] = previous['updatedAt']
            pages[route] = page
            imported.append(route)
            files.append((file, Path('html') / rel))
        else:
            if file.suffix.lower() not in public_exts:
                raise ValueError(f'Unsupported public file: {rel}')
            # Retain current host's IndexNow proof rather than an imported key.
            if len(rel.parts) == 1 and rel.name == str(config.get('indexNowKey')) + '.txt':
                continue
            if rel.parts[0] == 'assets':
                preserved = root / rel
                if preserved.exists() and preserved.read_bytes() != file.read_bytes():
                    raise ValueError(f'Asset name conflicts with preserved site: {rel}')
            files.append((file, Path('public') / rel))
    manifest = {'schemaVersion': 1, 'source': str(dist), 'routes': imported,
                'replacedPages': replaced, 'files': len(files)}
    # Stage all reads and validation first. Existing input is replaced only after success.
    with tempfile.TemporaryDirectory(prefix='ferry-import-', dir=root.parent) as temp:
        staged = Path(temp) / SOURCE_DIR
        staged.mkdir()
        for source, relative in files:
            target = staged / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        (staged / 'import.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        if source_dir.exists():
            shutil.rmtree(source_dir)
        shutil.move(str(staged), source_dir)
        (root / 'pages.json').write_text(json.dumps(pages, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'importedPages': len(imported), 'totalPages': len(pages),
                      'publicFiles': len(files) - len(imported), 'source': str(dist)}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('dist', type=Path, help='Finished udo-ferry/dist directory')
    args = parser.parse_args()
    try:
        import_site(args.dist)
    except (ValueError, OSError, json.JSONDecodeError) as error:
        parser.exit(1, f'Import failed: {error}\n')
