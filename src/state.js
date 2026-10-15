function validDemolished(ids){ return Array.isArray(ids) ? ids.filter(id => /^w\d+$/.test(id) && ['n','low'].includes(WALLS[+id.slice(1)]?.[4])) : []; }
function validMeasures(ms){
  const point = p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Math.abs(p.x) <= 100000 && Math.abs(p.y) <= 100000;
  return Array.isArray(ms) ? ms.slice(0,1000).filter(m => m && point(m.a) && point(m.b)) : [];
}
function load(){
  try { const s = JSON.parse(localStorage.getItem(STORE)); if (s && Array.isArray(s.furniture)) return fixState(s); } catch(e) {}
  return null;
}
function fixState(s){
  const rooms = {};
  ROOMS.forEach(r => { const saved = s.rooms?.[r.id]; rooms[r.id] = {name:typeof saved?.name === 'string' && saved.name.length <= 200 ? saved.name : r.name, mat:MATERIAL_IDS.includes(saved?.mat) ? saved.mat : r.mat}; });
  const furniture = validatePlan({...PLAN,furniture:s.furniture}).furniture.map(f => ({...f,color:f.color || typeColor(f.type)}));
  return {furniture,rooms,demolished:validDemolished(s.demolished),measures:validMeasures(s.measures)};
}
