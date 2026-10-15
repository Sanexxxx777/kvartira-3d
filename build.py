#!/usr/bin/env python3
"""Reproducible, dependency-free patches against the pinned upstream page."""
import argparse
import hashlib
import json
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parent
ap = argparse.ArgumentParser(description='Build the single-file planner with a plan embedded as its default.')
ap.add_argument('--plan', default=str(ROOT/'plans/khrushchev-gi-3k.json'), help='plan JSON to embed (default: the demo flat)')
ap.add_argument('--out', default=str(ROOT/'index.html'), help='output HTML (default: index.html)')
args = ap.parse_args()
UPSTREAM_SHA256 = '66432359c7043ca35f2318c33a4b81bcb179df968d0e94b235d323881d2ca353'
raw = (ROOT/'vendor/floorplan-3d.upstream.html').read_bytes()
assert hashlib.sha256(raw).hexdigest() == UPSTREAM_SHA256, 'Upstream SHA256 mismatch; review patches before updating the pin.'
html = raw.decode()
patches = []
def source(name): return (ROOT/'src'/name).read_text()
def module(name): return (ROOT/'modules'/name).read_text()
def patch(old, new, label):
    global html
    assert old and html.count(old) == 1, f'{label}: expected exactly one upstream anchor; found {html.count(old)}'
    html = html.replace(old,new,1); patches.append(label)
def section(start,end,new,label):
    assert html.count(start) == html.count(end) == 1, f'{label}: section anchors changed'
    a,b = html.index(start),html.index(end)
    assert a < b, label
    patch(html[a:b],new,label)
def safe_json(v): return json.dumps(v,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
plan = json.loads(Path(args.plan).read_text())
types = sorted(set(re.findall(r"case '([^']+)'",html[html.index('function buildFurniture'):html.index('function clearGroup')]+module('types_3d.js'))))
data = source('plan-data.js').replace('__DEFAULT_PLAN__',safe_json(plan)).replace('__FURNITURE_TYPES__',safe_json(types))
section('/* ============================================================\n *  户型数据','const MATS =',data+'\n','plan data')
patch('const typeColor =',source('library.js')+'\nconst typeColor =','module library')
section('function defaultFurniture()', 'function defaultState()', 'function defaultFurniture(){ return PLAN.furniture.map(f => ({...f,color:f.color || typeColor(f.type)})); }\n\n','default furniture')
patch('return {furniture:defaultFurniture(), rooms, demolished:[], measures:[]};',"return {furniture:defaultFurniture(), rooms, demolished:validDemolished(PLAN.editor?.demolished), measures:validMeasures(PLAN.editor?.measures)};",'default editor state')
section("const STORE = 'huxing-design-v1';",'const PX_MM =',source('state.js')+'\n','safe per-plan state')
patch("const PANES = 'huxing-panes';", "const PANES = () => STORE+':panes';", 'per-plan panes')
patch('localStorage.getItem(PANES)', 'localStorage.getItem(PANES())', 'load per-plan panes')
patch('localStorage.setItem(PANES,', 'localStorage.setItem(PANES(),', 'save per-plan panes')
patch("function save(){ try { localStorage.setItem(STORE, JSON.stringify(state)); } catch(e) {} }", "function save(){ try { localStorage.setItem(STORE, JSON.stringify(state)); } catch(e) { toast(tr('无法本地保存，请导出 JSON 备份。','Could not save locally. Export JSON to keep a backup.')); } }", 'storage failure feedback')
patch('const BOUNDS = {x:-1850, y:-1750, w:15600, h:14100};','// BOUNDS is derived by bindPlan().','bounds')
patch('    default: return rc(x,y,w,d,c);',module('types_2d.js')+"    case 'washdry': return furnSVG('washer',w,d,c);\n    default: return rc(x,y,w,d,c);",'2D module cases')
patch('function buildFurniture(f){', source('furniture-props.js')+'\nfunction buildFurniture(f){\n  f = moduleFurnitureProps(f);', 'furniture height adapter')
patch('g.position.set(wx(f.cx), 0, wz(f.cy));', 'g.position.set(wx(f.cx), M(f.lift || 0), wz(f.cy));', 'furniture podium lift')
patch("g.add(rbox(mw + .02, .82, .02, glowMat", "if (f.mirror !== false) g.add(rbox(mw + .02, .82, .02, glowMat", 'optional vanity mirror')
patch('    default: g.add(box(w, .8, d, c));',module('types_3d.js')+'    default: g.add(box(w, .8, d, c));','3D module cases')
section('  // 入户标识',"  $('#gOpen').innerHTML = s;",source('entry.js')+module('lights_2d.js'),'entry and 2D lights')
section('  g.innerHTML =\n    chain(true,-750',"  g.setAttribute('display', ui.layers.dims",'  g.innerHTML = planDims().map(d => chain(d.horiz,d.at,d.start,d.segs)).join(\'\');\n','dimension chains')
patch("  $('#subtitle').textContent = tr(`套内使用面积约 ${fmt(tot)} m² · 尺寸单位 mm · 原图比例 1:60`, `Net floor area ≈ ${fmt(tot)} m² · Units: mm · Original scale 1:60`);", "  $('.brand b').textContent = PLAN.name;\n  $('#subtitle').textContent = tr(`套内使用面积约 ${fmt(tot)} m² · 尺寸单位 mm`, `Net floor area ≈ ${fmt(tot)} m² · Units: mm`);",'plan heading')
patch("tr(`墙面面积（层高 2.8m，未扣门窗）约 ${fmt(perim(r.poly)*2.8,1)} m²`, `Wall area (2.8m ceiling, openings not deducted) ≈ ${fmt(perim(r.poly)*2.8,1)} m²`)","tr(`墙面面积（层高 ${H}m，未扣门窗）约 ${fmt(perim(r.poly)*H,1)} m²`, `Wall area (${H}m ceiling, openings not deducted) ≈ ${fmt(perim(r.poly)*H,1)} m²`)",'wall area height')
patch('function overviewPanel(){',source('flooring.js')+'\nfunction overviewPanel(){','flooring price helpers')
patch('a*MATS[m].price*1.05','a*floorPrice(m)*1.05','flooring subtotal price')
patch('¥${Math.round(c).toLocaleString()}','${floorMoney(c)}','flooring subtotal currency')
patch('¥${Math.round(cost).toLocaleString()}','${floorMoney(cost)}','flooring total currency')
patch('¥${m.price}/m²','${floorMoney(floorPrice(k))}/m²','flooring unit prices')
patch('¥${Math.round(a*MATS[st.mat].price*1.05).toLocaleString()}','${floorMoney(a*floorPrice(st.mat)*1.05)}','room estimate currency')
patch('<table>${matRows}</table>','<table>${matRows}</table><p class="muted">${floorNote()}</p>','flooring estimate note')
patch('<div class="mats">${mats}</div>','<div class="mats">${mats}</div><p class="muted">${floorNote()}</p>','room estimate note')
section('function clearLayout(){','/* 侧栏开合','/* clearLayout is provided by file-ui.js. */\n\n','in-page clear dialog')
# Use physical keys for all shortcuts, retaining upstream dispatch.
patch("const mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();", "const mod = e.metaKey || e.ctrlKey, k = ({BracketLeft:'[',BracketRight:']',Equal:'=',NumpadAdd:'+',Minus:'-',NumpadSubtract:'-'})[e.code] || e.code.replace(/^Key/,'').toLowerCase();",'physical shortcuts')
patch("  if (e.target.matches('input,select,textarea')) return;", "  if (e.target.matches('input,select,textarea') || document.querySelector('dialog[open]')) return;",'modal keyboard guard')
section("$('#exportJson').onclick =",'// 横竖屏切换', '// File handlers are installed by file-ui.js.\n','full-plan import export')
patch('const OX = 6000, OY = 5300, H = 2.8, FOV = 45;       // 户型中心放在世界原点，层高 2.8 m','const FOV = 45; // OX, OY and H come from the active plan.','3D origin')
patch('const opt = {cut:2.8,','const opt = {cut:H,','initial cut height')
patch('data-cut="2.8"','data-full-cut data-cut="'+str(plan['ceiling'])+'"','full-height control')
patch('function buildArch(){',module('lights.js')+'\nfunction buildArch(){','light builder')
section('    if (r.at){\n      const lamp =','  [...DOORS, ...SLIDES].forEach(d =>','  });\n  buildLights(top);\n','room lamps')
patch('clearGroup(archFloor); clearGroup(archUp); lampG.clear();','clearGroup(archFloor); clearGroup(archUp); clearGroup(lampG);','dispose old light geometry')
patch("[...DOORS.map(d => [d.rect, 2.1]), ...SLIDES.map(s => [s.rect, s.v ? 2.4 : 2.1]), [[10270,800,10510,2600], 2.4], [[10270,4260,10510,5740], 2.4]]", "[...DOORS, ...SLIDES].map(d => [d.rect, d.door_head ?? PLAN.door_head])",'lintels')
patch('const sill = i === 0 ? 1.4 : i >= 6 ? .45 : .9, head = 2.4;','const sill = r[4], head = r[5];','window heights')
patch('const pivot = new THREE.Group(), L = M(d.len), dh = Math.min(2.05, top);','const pivot = new THREE.Group(), L = M(d.len), dh = Math.min((d.door_head ?? PLAN.door_head)-.07, top);','door leaf clearance')
patch('door = {pivot, a0:ang(d.c), a1:ang(d.o), open:true}', 'door = {pivot, length:L, center:new THREE.Vector3(wx((d.rect[0]+d.rect[2])/2),dh/2,wz((d.rect[1]+d.rect[3])/2)), a0:ang(d.c), a1:ang(d.o), open:true}','door centre')
patch('SLIDES.forEach(({rect:[x0, y0, x1, y1], v}) => {','SLIDES.forEach(({rect:[x0, y0, x1, y1], v, door_head}) => {','slide head prop')
patch('ph = Math.min(v ? 2.4 : 2.1, top)','ph = Math.min((door_head ?? PLAN.door_head)-.07, top)','slide head')
patch('f = JSON.stringify(state.furniture), l =','f = JSON.stringify([state.furniture,opt.cut]), l =','rebuild topboxes at cut change')
patch('camera.position.set(wx(4200), 1.6, wz(8755)); camera.lookAt(wx(7000), 1.5, wz(8755));   // 入户门外',"const e = entryGeometry(), at = ROOMS.find(r => r.at)?.at || [OX,OY];\n    const x = e ? e.x-e.dx*600 : at[0], y = e ? e.y-e.dy*600 : at[1];\n    camera.position.set(wx(x), 1.6, wz(y)); camera.lookAt(wx(x+(e?.dx ?? 0)*1500), 1.5, wz(y+(e?.dy ?? -1)*1500));",'walk start')
patch('ex = px + Math.cos(a)*.9, ez = pz - Math.sin(a)*.9','ex = px + Math.cos(a)*d.length, ez = pz - Math.sin(a)*d.length','door collision length')
patch("if (opt.mode === 'walk' && e.code === 'KeyE'){ const h = pick(); if (h?.door && h.dist < 2.5) h.door.open = !h.door.open; }", "if (opt.mode === 'walk' && e.code === 'KeyE' && !e.repeat){\n    e.preventDefault(); const h = pick();\n    const nearest = h?.door ? (h.dist <= 2.5 ? h.door : null) : doors.filter(d => d.center.distanceTo(camera.position) <= 2.2).sort((a,b) => a.center.distanceToSquared(camera.position)-b.center.distanceToSquared(camera.position))[0];\n    if (nearest) nearest.open = !nearest.open;\n  }",'walk E fallback')
patch("if (!active || e.target.matches('input,select,textarea')) return;", "if (!active || e.target.matches('input,select,textarea') || document.querySelector('dialog[open]')) return;",'3D modal guard')
patch("addEventListener('keyup', e => keys[e.code] = false);", "addEventListener('keyup', e => keys[e.code] = false);\naddEventListener('blur', () => Object.keys(keys).forEach(k => keys[k] = false));",'clear walk keys on blur')
patch("$('#hint3d').textContent = HINT_ORBIT;", "$('#hint3d').textContent = HINT_ORBIT();",'exit walk hint')
patch('const isoWhole = () => pose(new THREE.Vector3(0, 0, 0), new THREE.Vector3(5.5, 15.5, 10));\nconst topWhole = () => pose(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 19, 1e-4));', "const homeDistance = () => Math.max(BOUNDS.h/1000,BOUNDS.w/1000/Math.max(.2,SW()/SH())) / (2*Math.tan(FOV*Math.PI/360));\nconst isoWhole = () => pose(new THREE.Vector3(), new THREE.Vector3(.3,.82,.49).normalize().multiplyScalar(homeDistance()*1.15));\nconst topWhole = () => pose(new THREE.Vector3(), new THREE.Vector3(0,homeDistance(),1e-4));",'camera extents')
patch('window.View3D = {enter, exit, relang,', source('replace-3d.js')+'\nwindow.View3D = {enter, exit, relang, preparePlan, replacePlan, look:(x,z,h,tx,tz,th) => active && flyTo(pose(new THREE.Vector3(wx(tx), th, wz(tz)), new THREE.Vector3(wx(x), h, wz(z))), 10),','3D plan replacement and tour hook')
patch('</style>',source('style.css')+'\n</style>','fork styles')
patch('</style>',source('go3d.css')+'\n</style>','3D button styles')
patch('<div id="fab"></div>','<div id="fab"></div>\n    <button id="go3d" type="button" title="3D (T)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/></svg><span data-en="View in 3D">3D 查看</span></button>','3D button')
patch("$('#exportPng').onclick = exportPNG;","$('#exportPng').onclick = exportPNG;\n$('#go3d').onclick = () => setView('3d');",'3D button action')
patch('<div id="toast"></div>','<div id="toast"></div>\n'+source('file-ui.html'),'in-page dialogs')
patch('<g id="gRooms"></g>','<g id="gUnderlay" pointer-events="none"></g>\n      <g id="gRooms"></g>','underlay layer')
patch('        <button class="btn danger" id="reset"','        <button class="btn" id="underlayBtn" data-en="Underlay…">底图…</button>\n        <button class="btn danger" id="reset"','underlay menu')
patch('      <button class="btn chip" data-lang="en" title="English">EN</button>','      <button class="btn chip" data-lang="en" title="English">EN</button>\n      <button class="btn chip" data-lang="ru" title="Русский">RU</button>','Russian language button')
patch("const LANG_KEY = 'huxing-lang';", "const LANG_KEY = 'kvartira-3d:language';",'language preference key')
patch("const LANGS = ['zh', 'zht', 'en'];", "const LANGS = ['zh', 'zht', 'en', 'ru'];",'Russian language option')
patch("let LANG = (() => { try { const l = localStorage.getItem(LANG_KEY); return LANGS.includes(l) ? l : 'zh'; } catch(e) { return 'zh'; } })();", "let LANG = (() => { const nl = (navigator.language || '').toLowerCase(); const fallback = nl.startsWith('ru') ? 'ru' : /^zh-(tw|hk|mo)|^zh-hant/.test(nl) ? 'zht' : nl.startsWith('zh') ? 'zh' : 'en'; try { const l = localStorage.getItem(LANG_KEY); return LANGS.includes(l) ? l : fallback; } catch(e) { return fallback; } })();",'browser-locale default: ru / zh / zh-Hant / else en')
# Compile template translations as literal pattern replacements, without eval.
ru=json.loads(source('ru.json')); plain={}; patterns=[]
def split_template(s):
    chunks=[]; expressions=[]; last=0; i=0
    while i < len(s):
        if s[i:i+2] != '${': i+=1; continue
        chunks.append(s[last:i]); start=i+2; i=start; depth=1
        while i < len(s) and depth:
            if s[i]=='{': depth+=1
            if s[i]=='}': depth-=1
            i+=1
        assert depth==0,s
        expressions.append(s[start:i-1]); last=i
    chunks.append(s[last:]); return chunks,expressions
for en,translated in ru.items():
    en=en.replace('\\n','\n'); chunks,expr=split_template(en)
    if not expr: plain[en]=translated; continue
    target,te=split_template(translated)
    assert all(e in expr for e in te),en
    tokens=[]
    for i,t in enumerate(target):
        tokens.append(t)
        if i<len(te): tokens.append(expr.index(te[i])+1)
    # JSON carries backslashes literally into new RegExp.
    pattern='^'+'(.*?)'.join(re.escape(c) for c in chunks)+'$'
    patterns.append([pattern,tokens])
i18n='const RU = '+safe_json(plain)+';\nconst RU_PATTERNS = '+safe_json(patterns)+'.map(([p,t]) => [new RegExp(p,"s"),t]);\n'+source('language.js')
patch("const tr = (zh, en) => LANG === 'en' ? en : LANG === 'zht' ? s2t(zh) : zh;",i18n,'Russian translator')
patch("const nm = s => LANG === 'en' ? (NAMES_EN[s] ?? s) : LANG === 'zht' ? s2t(s) : s;", "const NAMES_ZH = Object.fromEntries(Object.entries(NAMES_EN).map(([zh,en]) => [en,zh]));\nconst nm = s => { const en = NAMES_EN[s] ?? DEMO_EN[s] ?? s, zh = EXTRA_ZH[s] ?? NAMES_ZH[s] ?? s; return LANG === 'ru' ? (DEMO_EN[s] ? s : ruText(en)) : LANG === 'en' ? en : LANG === 'zht' ? s2t(zh) : zh; };",'localized names')
patch("{zh:'zh-CN', zht:'zh-TW', en:'en'}[LANG]", "{zh:'zh-CN', zht:'zh-TW', en:'en',ru:'ru'}[LANG]",'document language')
patch('fitView(); renderAll();\n</script>', 'fitView(); renderAll();\n'+source('file-ui.js')+'\n'+source('underlay.js')+'\nloadQueryPlan();\n</script>','file and underlay wiring')
# Each static label must have a Russian entry. Dynamic strings are checked by tests/check.py.
for text in re.findall(r'data-en(?:-title)?="([^"]*)"',html):
    assert text in ru, 'Missing Russian static text: '+text
Path(args.out).write_text(html)
print(f'Built {Path(args.out).name}: {len(html.encode()):,} bytes, {len(patches)} exact-once patches; upstream SHA256 verified.')
