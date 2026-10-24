"""Importable static pages: preserve source HTML and inject deployment head metadata."""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
import re
import shutil

SOURCE_DIR = 'ferry-source'
PUBLIC_DIR = 'public'
MANAGED_ROOT = {'CNAME', '.nojekyll', 'robots.txt', 'sitemap.xml'}


class _Meta(HTMLParser):
    def __init__(self, tag):
        super().__init__()
        self.attrs = {}
        self.feed(tag)

    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'meta':
            self.attrs = dict(attrs)


def render_raw_page(root, page, config):
    source = (root / page['rawFile']).resolve()
    allowed = (root / SOURCE_DIR / 'html').resolve()
    if not source.is_relative_to(allowed):
        raise ValueError('rawFile must be inside ferry-source/html')
    content = source.read_text(encoding='utf-8')
    head = re.search(r'(<head\b[^>]*>)(.*?)(</head\s*>)', content, re.I | re.S)
    if not head:
        raise ValueError(f'Missing head in {page["rawFile"]}')
    managed = {'google-site-verification', 'naver-site-verification', 'robots'}

    def keep_meta(match):
        name = _Meta(match.group(0)).attrs.get('name', '').lower()
        return '' if name in managed else match.group(0)

    inner = re.sub(r'<meta\b[^>]*>', keep_meta, head.group(2), flags=re.I)
    robots = ('noindex,nofollow,noarchive' if page.get('admin')
              else 'noindex,nofollow' if config.get('private')
              else 'noindex,follow' if page.get('noindex')
              else 'index,follow,max-image-preview:large')
    tags = [f'<meta name="robots" content="{robots}">']
    for field, name in [('googleVerification', 'google-site-verification'),
                        ('naverVerification', 'naver-site-verification')]:
        if config.get(field):
            tags.append(f'<meta name="{name}" content="{escape(str(config[field]), quote=True)}">')
    replacement = head.group(1) + inner + ''.join(tags) + head.group(3)
    return content[:head.start()] + replacement + content[head.end():]


def copy_raw_public(root, destination):
    source = root / SOURCE_DIR / PUBLIC_DIR
    if not source.exists():
        return
    files = sorted(source.rglob('*'))
    # Check every collision before copying any public file.
    for item in files:
        if item.is_symlink():
            raise ValueError(f'Symlink is not a public asset: {item}')
        if not item.is_file():
            continue
        relative = item.relative_to(source)
        if len(relative.parts) == 1 and relative.name in MANAGED_ROOT:
            raise ValueError(f'Build-managed file in raw public assets: {relative}')
        target = destination / relative
        if target.exists() and (not target.is_file() or target.read_bytes() != item.read_bytes()):
            raise ValueError(f'Public asset conflicts with preserved brand asset: {relative}')
    for item in files:
        if item.is_file():
            target = destination / item.relative_to(source)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, target)
