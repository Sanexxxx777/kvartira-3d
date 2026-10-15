// The embedded plan and imported plans use the same validated contract.
const DEFAULT_PLAN = __DEFAULT_PLAN__;
const MATERIAL_IDS = ['wood','walnut','tile800','tile600','marble','antislip','terrazzo','carpet'];
const FURNITURE_TYPES = __FURNITURE_TYPES__;
const cloneData = value => JSON.parse(JSON.stringify(value));
function validatePlan(input){
  const p = cloneData(input), fail = path => { throw new Error(path); };
  const num = (n, lo=-100000, hi=100000) => typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi;
  const str = s => typeof s === 'string' && s.length > 0 && s.length <= 200;
  const point = a => Array.isArray(a) && a.length === 2 && a.every(v => num(v));
  const rect = a => Array.isArray(a) && a.length >= 4 && a.slice(0,4).every(v => num(v)) && a[2] > a[0] && a[3] > a[1];
  const list = (key, max, required=false) => { if (!required && p[key] === undefined) p[key] = []; if (!Array.isArray(p[key]) || p[key].length > max) fail(key); };
  if (!p || typeof p !== 'object' || !str(p.name)) fail('name');
  if (!num(p.ceiling, 2.2, 6)) fail('ceiling (2.2–6 m)');
  if (p.id !== undefined && (typeof p.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(p.id))) fail('id');
  if (p.door_head === undefined) p.door_head = 2.1;
  if (!num(p.door_head, 1.8, p.ceiling)) fail('door_head');
  list('walls',2000,true); list('windows',300); list('doors',300); list('slides',300); list('rooms',200,true); list('lights',300); list('furniture',1000);
  if (!p.walls.length || !p.rooms.length) fail('walls / rooms');
  p.walls.forEach((w,i) => { if (!rect(w) || w.length !== 5 || !['b','e','n','low'].includes(w[4])) fail('walls['+i+']'); });
  p.windows.forEach((w,i) => { if (!rect(w) || w.length !== 6 || !num(w[4],0,p.ceiling) || !num(w[5],w[4]+.05,p.ceiling)) fail('windows['+i+']'); });
  p.doors.forEach((d,i) => {
    if (!d || !str(d.name) || !rect(d.rect) || !point(d.h) || !point(d.c) || !point(d.o) || !num(d.len,300,3000)) fail('doors['+i+']');
    const axis = v => v.every(n => [-1,0,1].includes(n)) && Math.abs(v[0])+Math.abs(v[1]) === 1;
    if (!axis(d.c) || !axis(d.o) || d.c[0]*d.o[0]+d.c[1]*d.o[1] !== 0 || (d.door_head !== undefined && !num(d.door_head,1.8,p.ceiling))) fail('doors['+i+'].direction / door_head');
  });
  p.slides.forEach((d,i) => { if (!d || !rect(d.rect) || typeof d.v !== 'boolean' || (d.door_head !== undefined && !num(d.door_head,1.8,p.ceiling))) fail('slides['+i+']'); });
  const ids = new Set();
  p.rooms.forEach((r,i) => {
    if (!r || typeof r.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(r.id) || ['__proto__','constructor','prototype'].includes(r.id) || ids.has(r.id) || !str(r.name) || !MATERIAL_IDS.includes(r.mat) || !Array.isArray(r.poly) || r.poly.length < 3 || r.poly.length > 200 || !r.poly.every(point) || (r.at !== undefined && !point(r.at))) fail('rooms['+i+']');
    ids.add(r.id);
    const signed = r.poly.reduce((a,v,j) => { const q = r.poly[(j+1)%r.poly.length]; return a+v[0]*q[1]-q[0]*v[1]; },0);
    if (Math.abs(signed) < 10000) fail('rooms['+i+'].poly');
  });
  p.lights.forEach((l,i) => {
    if (!l || !['spot','pl','track','pendant','sconce','led'].includes(l.k)) fail('lights['+i+']');
    if (['spot','pl','pendant','sconce'].includes(l.k) && !point(l.at)) fail('lights['+i+'].at');
    if (['pendant','sconce'].includes(l.k) && !num(l.h,.2,p.ceiling-.2)) fail('lights['+i+'].h');
    if (l.style !== undefined && !(l.k === 'pendant' ? ['glass','bar'] : l.k === 'sconce' ? ['spot'] : []).includes(l.style)) fail('lights['+i+'].style');
    if (l.len !== undefined && (l.k !== 'pendant' || l.style !== 'bar' || !num(l.len,50,15000))) fail('lights['+i+'].len');
    if (l.vert !== undefined && (l.k !== 'pendant' || l.style !== 'bar' || typeof l.vert !== 'boolean')) fail('lights['+i+'].vert');
    const segment = (a,b) => point(a) && point(b) && (a[0] === b[0] || a[1] === b[1]) && Math.hypot(b[0]-a[0],b[1]-a[1]) >= 20;
    if (l.k === 'track' && !segment(l.a,l.b)) fail('lights['+i+'].a / b');
    if (l.k === 'sconce' && (!point(l.dir) || Math.abs(Math.hypot(...l.dir)-1) > .001)) fail('lights['+i+'].dir');
    if (l.k === 'led' && (!Array.isArray(l.pts) || l.pts.length < 2 || l.pts.length > 100 || !l.pts.every(point) || l.pts.slice(1).some((v,j) => !segment(l.pts[j],v)))) fail('lights['+i+'].pts');
  });
  const fids = new Set(), color = s => typeof s === 'string' && /^#[0-9a-f]{6}$/i.test(s);
  p.furniture.forEach((f,i) => {
    if (!f || !FURNITURE_TYPES.includes(f.type) || !str(f.name) || !num(f.cx) || !num(f.cy) || !num(f.w,50,15000) || !num(f.d,20,15000)) fail('furniture['+i+']');
    f.rot ??= 0; if (!num(f.rot,-36000,36000)) fail('furniture['+i+'].rot');
    f.id ??= 'item-'+i;
    if (typeof f.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(f.id) || fids.has(f.id)) fail('furniture['+i+'].id'); fids.add(f.id);
    for (const key of ['color','frame','c2','top','back']) if (f[key] !== undefined && !color(f[key])) fail('furniture['+i+'].'+key);
    if (f.led !== undefined && !['both','plus','minus'].includes(f.led)) fail('furniture['+i+'].led');
    if (f.sheer !== undefined && typeof f.sheer !== 'boolean') fail('furniture['+i+'].sheer');
    if (f.open !== undefined && !num(f.open,0,.5)) fail('furniture['+i+'].open');
    if (f.ht !== undefined && !num(f.ht,f.type === 'gbox' ? .01 : .1,f.type === 'tallcab' ? 6 : p.ceiling)) fail('furniture['+i+'].ht');
    for (const key of ['y0','lift','legs','ny0']) if (f[key] !== undefined && !num(f[key],0,p.ceiling)) fail('furniture['+i+'].'+key);
    if (f.nh !== undefined && !num(f.nh,.1,p.ceiling)) fail('furniture['+i+'].nh');
    if (f.nw !== undefined && !num(f.nw,50,f.w)) fail('furniture['+i+'].nw');
    if (f.rows !== undefined && (!Number.isInteger(f.rows) || !num(f.rows,1,20))) fail('furniture['+i+'].rows');
    if (f.hd !== undefined && !['bar','edge','none'].includes(f.hd)) fail('furniture['+i+'].hd');
    if (f.shape !== undefined && !['oval','rect'].includes(f.shape)) fail('furniture['+i+'].shape');
    if (f.humid !== undefined && typeof f.humid !== 'boolean') fail('furniture['+i+'].humid');
    if (f.mirror !== undefined && typeof f.mirror !== 'boolean') fail('furniture['+i+'].mirror');
    if (f.type === 'drawers' && (f.legs ?? .15) >= (f.ht ?? .8)-.02) fail('furniture['+i+'].legs / ht');
    // Respect the supplied niche module's defaults (zero ny0 also means 1 m).
    if (f.type === 'niche' && ((f.nw ?? 500) >= f.w || f.d <= 30 || (f.nh ?? 1.1)+(f.ny0 || 1) >= p.ceiling)) fail('furniture['+i+'].niche dimensions');
  });
  if (p.dims !== undefined){
    list('dims',100);
    p.dims.forEach((d,i) => { if (!d || typeof d.horiz !== 'boolean' || !num(d.at) || !num(d.start) || !Array.isArray(d.segs) || !d.segs.length || d.segs.length > 100 || !d.segs.every(v => num(v,1,200000))) fail('dims['+i+']'); });
  }
  if (!p.id){
    // Stable for the same source, independent of property order and furniture edits.
    const identity = JSON.stringify([p.name,p.ceiling,p.walls,p.rooms.map(r => [r.id,r.poly])]);
    let hash = 2166136261; for (const c of identity) hash = Math.imul(hash ^ c.charCodeAt(0),16777619);
    p.id = 'plan-'+(hash>>>0).toString(16);
  }
  return p;
}
function planExtents(p){
  const xs = p.walls.flatMap(w => [w[0],w[2]]), ys = p.walls.flatMap(w => [w[1],w[3]]);
  return {x0:Math.min(...xs), y0:Math.min(...ys), x1:Math.max(...xs), y1:Math.max(...ys)};
}
let PLAN = validatePlan(DEFAULT_PLAN);
let WALLS, WINS, DOORS, SLIDES, ROOMS, LIGHTS, BOUNDS, OX, OY, H, STORE;
function bindPlan(p){
  PLAN = p; WALLS = p.walls; WINS = p.windows; DOORS = p.doors; SLIDES = p.slides; ROOMS = p.rooms; LIGHTS = p.lights;
  const b = planExtents(p); OX = (b.x0+b.x1)/2; OY = (b.y0+b.y1)/2; H = p.ceiling;
  BOUNDS = {x:b.x0-1400,y:b.y0-1400,w:b.x1-b.x0+2800,h:b.y1-b.y0+2800};
  STORE = 'kvartira-3d:v1:'+p.id;
}
bindPlan(PLAN);
function planDims(){
  const b = planExtents(PLAN);
  return PLAN.dims ?? [{horiz:true,at:b.y0-700,start:b.x0,segs:[b.x1-b.x0]}, {horiz:false,at:b.x1+700,start:b.y0,segs:[b.y1-b.y0]}];
}
function entryGeometry(){
  const d = DOORS.find(d => d.entry); if (!d) return null;
  return {x:(d.rect[0]+d.rect[2])/2,y:(d.rect[1]+d.rect[3])/2,dx:d.o[0],dy:d.o[1]};
}
