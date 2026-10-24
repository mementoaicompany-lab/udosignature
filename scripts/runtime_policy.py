"""Source regression policy for one explicitly authorized ferry administrator.

This detects accidental scope expansion; Firebase server rules remain the authorization
boundary. It is not a JavaScript sandbox or a replacement for those rules.
"""
from urllib.parse import urlparse
import posixpath
import re

ADMIN_MODULES = {'admin.js', 'admin-core.mjs'}
FIREBASE_TOKENS = ('firebase.initializeApp', 'firebase.database', 'firebase.auth')
FORBIDDEN_ALWAYS = (
    (r'\.\s*setItem\s*\(', 'browser persistence'),
    (r'\bmethod\s*:\s*[\"\'](?:POST|PUT|PATCH|DELETE)[\"\']', 'HTTP mutation'),
)


def module_dependencies(name, code):
    dependencies = set()
    patterns = [r'\b(?:import|export)\s+[\s\S]*?\bfrom\s*[\"\']([^\"\']+)[\"\']',
                r'\bimport\s*(?:\(\s*)?[\"\']([^\"\']+)[\"\']']
    for pattern in patterns:
        for target in re.findall(pattern, code):
            if target.startswith('.'):
                dependencies.add(posixpath.normpath(posixpath.join(posixpath.dirname(name), target)))
            elif target.startswith('/'):
                dependencies.add(target.lstrip('/'))
    return dependencies


def runtime_errors(scripts, pages):
    """scripts maps deployed paths to code; pages carries admin flag and script URLs."""
    errors = []
    dependencies = {name: module_dependencies(name, code) for name, code in scripts.items()}
    admin_present = any(name in scripts for name in ADMIN_MODULES)
    admin_pages = [page for page in pages if page.get('admin')]

    def require(condition, message):
        if not condition:
            errors.append(message)

    def reachable(start):
        visited, pending = set(), list(start)
        while pending:
            current = pending.pop()
            if current not in visited:
                visited.add(current)
                pending.extend(dependencies.get(current, ()))
        return visited

    for page in pages:
        local = [urlparse(url).path.lstrip('/') for url in page['scripts']
                 if not urlparse(url).scheme and not urlparse(url).netloc]
        graph = reachable(local)
        if not page.get('admin'):
            require(not (graph & ADMIN_MODULES), page['route'] + ': public page reaches administrator module')
            require(not any('firebase-' in url for url in page['scripts']), page['route'] + ': public Firebase SDK')
        else:
            require(page.get('noindex'), page['route'] + ': admin must be noindex')
            require('admin.js' in graph, page['route'] + ': administrator entry missing')
            require(page['route'] == 'admin/', 'Unexpected administrator route')

    if admin_present:
        require(ADMIN_MODULES <= scripts.keys(), 'Administrator modules must be deployed together')
        require(len(admin_pages) == 1, 'Administrator modules need exactly one noindex admin page')
    for name, code in scripts.items():
        for pattern, label in FORBIDDEN_ALWAYS:
            require(not re.search(pattern, code, re.I), f'Unapproved {label} in {name}')
        if name not in ADMIN_MODULES:
            for token in FIREBASE_TOKENS:
                require(token not in code, f'Unapproved Firebase runtime in {name}')
            require(not re.search(r'\b(?:ref|ferryRef|database)\s*\.\s*(?:set|update|push|remove|transaction|setWithPriority|setPriority|onDisconnect)\s*\(', code),
                    f'Unapproved database write in {name}')
        if name != 'admin.js':
            require('admin-core.mjs' not in dependencies[name], f'Unexpected administrator core import in {name}')

    if not ADMIN_MODULES <= scripts.keys():
        return errors
    ui, core = scripts['admin.js'], scripts['admin-core.mjs']
    compact_ui, compact_core = re.sub(r'\s+', '', ui), re.sub(r'\s+', '', core)
    require(dependencies['admin.js'] == {'ferry-status-validator.mjs', 'admin-core.mjs'},
            'Administrator UI import scope changed')
    require(dependencies['admin-core.mjs'] == {'ferry-status-validator.mjs'},
            'Administrator core import scope changed')
    require("databaseURL:'https://coconara-52bc4-default-rtdb.firebaseio.com'" in compact_ui,
            'Administrator database project changed')
    refs = re.findall(r'\bdatabase\.ref\s*\(\s*([\"\'])(.*?)\1\s*\)', ui)
    paths = [path for _, path in refs]
    require(sorted(paths) == sorted(['ferryStatus', '.info/serverTimeOffset', '.info/connected'])
            and len(re.findall(r'\bdatabase\.ref\s*\(', ui)) == 3,
            'Administrator database references must stay on ferryStatus and two .info reads')
    assignments = re.findall(r'\bferryRef\s*=([^;]+)', ui)
    require(len(assignments) == 1 and re.sub(r'\s+', '', assignments[0]) in
            ("database.ref('ferryStatus')", 'database.ref("ferryStatus")'),
            'Administrator ferry reference is not fixed to ferryStatus')
    require('ref:ferryRef' in compact_ui and compact_ui.count('saveFerryOverride({') == 1,
            'Administrator save must use the fixed ferry reference exactly once')
    require('auth.setPersistence(firebase.auth.Auth.Persistence.NONE)' in compact_ui,
            'Administrator auth must remain in memory')
    require(not re.search(r'\.\s*(?:set|update|push|remove|transaction|setWithPriority|setPriority|onDisconnect|child|refFromURL)\s*\(', ui),
            'Administrator UI must delegate its only data write to the validated core')
    require('fetch(' not in compact_ui and 'XMLHttpRequest' not in ui,
            'Administrator UI must not add independent network writes')
    require(not re.search(r'\b(?:database|firebase)\s*[.\[]|\bref\s*\[', core),
            'Administrator core must not create alternate database references')
    calls = re.findall(r'\bref\s*\.\s*(\w+)\s*\(', core)
    require(calls == ['set'] and compact_core.count('awaitref.set(payload);') == 1,
            'Administrator core must have one acknowledged payload set only')
    require('if(!isAllowedAdmin(auth,authReady))' in compact_core,
            'Administrator save authorization guard missing')
    require('authReady&&auth?.currentUser?.uid===ADMIN_UID' in compact_core,
            'Administrator exact UID authorization changed')
    require('if(!connected||!timeReady)' in compact_core,
            'Administrator connection/server clock guard missing')
    require('buildFerryPayload(values,epoch,auth.currentUser.uid,serverTimestamp)' in compact_core
            and 'if(!validateFerryRecord(candidate,epoch).confirmed)' in compact_core,
            'Administrator payload schema validation missing')
    require("serverTimestamp['.sv']!=='timestamp'" in compact_core,
            'Administrator server timestamp requirement missing')
    require(compact_core.find('if(!isAllowedAdmin(auth,authReady))') < compact_core.find('awaitref.set(payload);'),
            'Administrator write precedes authorization')
    return errors
