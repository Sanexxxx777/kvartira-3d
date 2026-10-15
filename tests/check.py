#!/usr/bin/env python3
"""Offline build, syntax, data and focused runtime checks. No npm packages."""
import hashlib
import json
import re
import subprocess
import tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def run(*args): subprocess.run(args,cwd=ROOT,check=True)
run('python3','build.py')
html=(ROOT/'index.html').read_text()
before=hashlib.sha256(html.encode()).hexdigest()
run('python3','build.py')
assert hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()==before,'Build is not deterministic'
scripts=re.findall(r'<script([^>]*)>(.*?)</script>',html,re.S)
with tempfile.TemporaryDirectory(prefix='.check-',dir=ROOT) as tmp:
    for i,(attrs,code) in enumerate(scripts):
        if 'importmap' in attrs: json.loads(code); continue
        name=Path(tmp)/f'script-{i}.{ "mjs" if "module" in attrs else "js"}'
        name.write_text(code); run('node','--check',str(name))
    data=(ROOT/'src/plan-data.js').read_text().replace('__DEFAULT_PLAN__',json.dumps(json.loads((ROOT/'plans/khrushchev-gi-3k.json').read_text()))).replace('__FURNITURE_TYPES__',json.dumps(sorted(set(re.findall(r"case '([^']+)'",html[html.index('function buildFurniture'):html.index('function clearGroup')])))))
    test=Path(tmp)/'data-test.cjs'; test.write_text(data+'\n'+(ROOT/'tests/data.cjs').read_text());run('node',str(test))
# Every literal tr() call and static label must have a Russian source entry.
ru=json.loads((ROOT/'src/ru.json').read_text()); lit=r'''(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)'''
missing=[]
for m in re.finditer(r'\btr\(\s*('+lit+r')\s*,\s*('+lit+r')\s*\)',html):
    en=m[2][1:-1]
    if en not in ru and en.replace('\\n','\n') not in ru: missing.append(en)
assert not missing,'Missing translations: '+repr(missing)
# Both original files and reusable snippets must remain present verbatim.
for name in ['types_2d.js','types_3d.js','lights.js','lights_2d.js']:
    assert (ROOT/'modules'/name).read_text() in html,name
assert 'e.key.toLowerCase()' not in html
assert 'confirm(' not in html
assert 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js' in html
assert '[[10270,800,10510,2600]' not in html
run('node','tests/app.cjs')
run('node','tests/architecture.cjs')
run('node','tests/furniture.cjs')
# A local-only browser fixture disables the CDN module, preserving the exact 2D script.
offline=re.sub(r'<script type="importmap">.*?</script>','',html,flags=re.S)
offline=re.sub(r'<script type="module">.*?</script>','<!-- 3D deliberately disabled: offline 2D test fixture. -->',offline,flags=re.S)
(ROOT/'tests/offline.html').write_text(offline)
print('PASS: deterministic build; inline script syntax; plan validation; dimension/height/state cases; translation coverage; unchanged modules. Offline browser fixture: tests/offline.html')
