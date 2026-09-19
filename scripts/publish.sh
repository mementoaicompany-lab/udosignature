#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
EXPECTED='https://github.com/mementoaicompany-lab/udosignature.git'
[ "$(git remote get-url origin)" = "$EXPECTED" ] || { echo 'Refusing: wrong remote'; exit 1; }
[ "$(git remote get-url --push origin)" = "$EXPECTED" ] || { echo 'Refusing: wrong push remote'; exit 1; }
python3 -c 'import json; assert json.load(open("site.config.json"))["baseUrl"] == "https://mementoaicompany-lab.github.io/udosignature/"'
python3 build.py
python3 scripts/check.py
[ -z "$(git status --porcelain)" ] || { echo 'Review and commit changes before publishing.'; exit 1; }
git push origin main
