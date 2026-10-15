const assert = require('node:assert/strict');
const p = validatePlan(DEFAULT_PLAN);
assert.equal(p.rooms.length,8);
const areaOf = poly => Math.abs(poly.reduce((a,v,i) => { const q=poly[(i+1)%poly.length];return a+v[0]*q[1]-q[0]*v[1];},0))/2e6;
for (const r of p.rooms){ assert.ok(Math.abs(areaOf(r.poly)-r.source_area)<.08, r.id); console.log(r.id,areaOf(r.poly).toFixed(4),'source',r.source_area); }
assert.equal(p.windows.length,p.furniture.filter(f=>f.type==='curtain').length);
assert.equal(H,2.5); assert.equal(OX,2795); assert.equal(OY,3883);
assert.equal(entryGeometry().x,-175);
assert.deepEqual(planExtents(p),{x0:-350,y0:-350,x1:5940,y1:8116});
assert.ok(p.furniture.some(f=>f.type==='washdry'));
const fail = edit => { const q=cloneData(p);edit(q);assert.throws(()=>validatePlan(q)); };
fail(q=>q.ceiling=NaN); fail(q=>q.windows[0][5]=5); fail(q=>q.windows[0][4]=2.4);
fail(q=>q.walls[0][2]=q.walls[0][0]); fail(q=>q.rooms[0].mat='missing');
fail(q=>q.rooms[0].id='__proto__'); fail(q=>q.rooms[1].id=q.rooms[0].id);
fail(q=>q.furniture[0].color='" onload="oops'); fail(q=>q.furniture[0].type='unknown');
fail(q=>q.doors[0].o=[1,1]); fail(q=>q.door_head=2.6); fail(q=>q.lights.push({k:'track',a:[0,0],b:[100,100]}));
fail(q=>q.furniture[0].id='bad"'); fail(q=>q.furniture[0].open=5);
// New module props survive validation in JSON units, including the ceiling cap.
const added=['floatcab','drawers','odesk','gbox','niche','towelrail','rainshower'];
const extras=cloneData(p);
extras.furniture=added.map((type,i)=>({type,id:'new-'+i,name:type,cx:500,cy:500,w:800,d:300,ht:type==='gbox'?.08:.8,lift:.12}));
Object.assign(extras.furniture[0],{y0:.35,rows:2,hd:'none',top:'#eeeedd'});
Object.assign(extras.furniture[1],{legs:.16,humid:true});
Object.assign(extras.furniture[4],{nw:450,nh:.9,ny0:1.1,back:'#778a75'});
extras.furniture.push({type:'tallcab',name:'Tall',cx:500,cy:500,w:600,d:600,ht:3,rows:3,hd:'edge'},
 {type:'mirror',name:'Oval',cx:500,cy:500,w:500,d:40,shape:'oval',ht:.9,y0:1.1});
extras.lights=[{k:'pendant',at:[500,500],h:1.9,style:'glass'},
 {k:'pendant',at:[500,500],h:1.9,style:'bar',len:1200,vert:true},
 {k:'sconce',at:[500,500],dir:[1,0],h:1.6,style:'spot'}];
const accepted=validatePlan(extras);
assert.equal(accepted.furniture[4].nw,450);assert.equal(accepted.furniture[4].nh,.9);
assert.equal(accepted.furniture[1].legs,.16);assert.equal(accepted.furniture[0].lift,.12);
assert.equal(accepted.lights[1].len,1200);assert.equal(accepted.furniture[7].ht,3);
const badExtra=edit=>{const q=cloneData(extras);edit(q);assert.throws(()=>validatePlan(q));};
for(const [key,value] of [['ht',800],['y0',350],['lift',120],['rows',1.5],['rows',0],['hd','knob'],['top','red'],['humid','yes'],['shape','triangle'],['mirror','false']]) badExtra(q=>q.furniture[0][key]=value);
badExtra(q=>q.furniture[1].legs=.8);badExtra(q=>q.furniture[4].nw=900);
badExtra(q=>q.furniture[4].nh=1.5);badExtra(q=>q.furniture[4].ny0=1000);
badExtra(q=>q.furniture[4].back='bad');badExtra(q=>q.furniture[4].d=20);
badExtra(q=>q.lights[0].style='spot');badExtra(q=>q.lights[2].style='glass');
badExtra(q=>q.lights[1].len=1.2);badExtra(q=>q.lights[1].vert='true');
badExtra(q=>q.lights.push({k:'spot',at:[0,0],style:'bar'}));
const q=cloneData(p);delete q.id;delete q.dims;const normalized=validatePlan(q);
assert.equal(normalized.id,validatePlan(q).id);bindPlan(normalized);
assert.equal(planDims().length,2);assert.deepEqual(planDims()[0].segs,[6290]);
q.name='Another plan';assert.notEqual(validatePlan(q).id,normalized.id);
const tiny={name:'Test',ceiling:3,walls:[[0,0,100,4000,'n']],rooms:[{id:'r',name:'R',poly:[[100,0],[2100,0],[2100,4000],[100,4000]],mat:'wood'}],furniture:[]};
bindPlan(validatePlan(tiny));assert.equal(H,3);assert.equal(OX,50);assert.equal(OY,2000);assert.equal(entryGeometry(),null);assert.equal(PLAN.door_head,2.1);
assert.equal(STORE,'kvartira-3d:v1:'+PLAN.id);
console.log('PASS: data validation, rejection cases, stable IDs, room areas, alternate plan, bounds, heights and dimension fallback.');
