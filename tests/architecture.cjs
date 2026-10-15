// Executes the real architecture/light construction code with geometry recorders.
// This checks branching and dimensions, not WebGL appearance or Three.js compatibility.
const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const data=html.slice(html.indexOf('// The embedded plan'),html.indexOf('const MATS ='));
const lights=fs.readFileSync('modules/lights.js','utf8');
const architecture=html.slice(html.indexOf('function buildArch(){'),html.indexOf('function buildFurn(){'));
class V {constructor(x=0,y=0,z=0){this.set(x,y,z);}set(x,y,z){Object.assign(this,{x,y,z});return this;}distanceTo(v){return Math.sqrt(this.distanceToSquared(v));}distanceToSquared(v){return (this.x-v.x)**2+(this.y-v.y)**2+(this.z-v.z)**2;}}
class G {constructor(...args){this.args=args;}rotateX(){} }
class O {constructor(geometry,material){Object.assign(this,{geometry,material,children:[],position:new V(),rotation:new V(),scale:new V(1,1,1),userData:{},visible:true});}add(...o){this.children.push(...o);}clear(){this.children=[];}lookAt(...p){this.aim=p;} }
class P extends O {constructor(...a){super();this.isPointLight=true;this.args=a;} }
const THREE={Group:O,Mesh:O,PointLight:P,Vector3:V,ShapeGeometry:G,ExtrudeGeometry:G,MeshStandardMaterial:class{constructor(o){Object.assign(this,o);}},CylinderGeometry:G,TorusGeometry:G,CircleGeometry:G,SphereGeometry:G,BoxGeometry:G,DoubleSide:2};
const make=(...args)=>new O(new G(...args),{emissiveIntensity:undefined});
let keyHandler;
const context={assert,console,THREE,box:make,cyl:make,rod:make,lathe:make,mat:(c,o)=>({color:c,...o}),metal:()=>({}),floorMat:()=>({}),shapeOf:()=>({}),clearGroup:g=>g.clear(),applyGrow(){},addEventListener:(k,fn)=>{if(k==='keydown')keyHandler=fn;},document:{querySelector:()=>null}};
vm.createContext(context);
vm.runInContext(data+`
const wx=x=>(x-OX)/1000,wz=y=>(y-OY)/1000,M=v=>v/1000;
const archFloor=new THREE.Group(),archUp=new THREE.Group(),lampG=new THREE.Group(),doors=[],keys={};
let colliders=[],wallCalls=[],active=true,hit=null;
const camera={position:new THREE.Vector3()},pick=()=>hit;
let opt={cut:H,mode:'walk'},state={rooms:Object.fromEntries(ROOMS.map(r=>[r.id,{mat:r.mat}])),demolished:[]};
const glassMat={},frameMat={};
function wallBox(rect,bottom,top){if(top>bottom)wallCalls.push({rect,bottom,top});}
function applyLight(){for(const o of lampG.children)assert.ok(o.isPointLight || typeof o.material.emissiveIntensity==='number','Non-emissive housing in lampG');}
`+lights+architecture,context);
const start=html.indexOf("addEventListener('keydown', e => {\n  if (!active");
vm.runInContext(html.slice(start,html.indexOf("addEventListener('keyup'",start)),context);
context.keyHandler=e=>keyHandler(e);
vm.runInContext(`
buildArch();
assert.equal(doors.length,PLAN.doors.length);
for(let i=0;i<doors.length;i++){
 const d=doors[i],source=PLAN.doors[i];assert.equal(d.length,source.len/1000);
 assert.ok(d.pivot.children[0].geometry.args[1] <= (source.door_head ?? PLAN.door_head)-.07+1e-10);
 assert.equal(d.center.x,wx((source.rect[0]+source.rect[2])/2));
}
assert.equal(lampG.children.filter(o=>o.isPointLight).length,11);
// Both bar orientations, glass shade transparency and the spot lens direction.
const demoLights=LIGHTS;
for(const vert of [false,true]){
 LIGHTS=[{k:'pendant',at:[1000,2000],h:1.9,style:'bar',len:1400,vert}];archUp.clear();lampG.clear();buildLights(H);applyLight();
 const bar=archUp.children.find(o=>o.geometry.args[1]===.03);
 assert.equal(bar.geometry.args[0],vert?.035:1.4);assert.equal(bar.geometry.args[2],vert?1.4:.035);
 assert.equal(lampG.children.filter(o=>o.isPointLight).length,1);
}
LIGHTS=[{k:'pendant',at:[1000,2000],h:1.9,style:'glass'}];archUp.clear();lampG.clear();buildLights(H);applyLight();
assert.ok(archUp.children.some(o=>o.geometry.args[1]?.transparent===true&&o.geometry.args[1].opacity===.55));
LIGHTS=[{k:'sconce',at:[1000,2000],dir:[1,0],h:1.6,style:'spot'}];archUp.clear();lampG.clear();buildLights(H);applyLight();
assert.ok(lampG.children.some(o=>o.aim?.[0]===wx(1000)+.5&&o.aim[1]===1.1));
LIGHTS=demoLights;
assert.ok(wallCalls.some(c=>c.rect===WINS[0]&&c.bottom===0&&c.top===.85));
assert.ok(wallCalls.some(c=>c.rect===WINS[0]&&c.bottom===2.2&&c.top===2.5));
assert.ok(wallCalls.some(c=>c.rect===DOORS[0].rect&&c.bottom===2.1));
// Rebuild with a different ceiling, window and door head; no index-based exceptions.
PLAN.ceiling=3;H=3;PLAN.door_head=2.4;WINS[0][4]=1.1;WINS[0][5]=2.7;opt.cut=3;wallCalls=[];buildArch();
assert.ok(wallCalls.some(c=>c.rect===WINS[0]&&c.bottom===2.7&&c.top===3));
assert.equal(doors[0].pivot.children[0].geometry.args[1],2.4-.07);
opt.cut=1.2;buildArch();assert.ok(doors.every(d=>d.pivot.children[0].geometry.args[1]<=1.2));
const first=doors[0];camera.position.set(first.center.x,first.center.y,first.center.z);hit=null;
const ev={code:'KeyE',repeat:false,target:{matches:()=>false},preventDefault(){}};
let was=first.open;keyHandler(ev);assert.equal(first.open,!was,'nearest fallback');
was=first.open;keyHandler({...ev,repeat:true});assert.equal(first.open,was,'no auto-repeat');
hit={door:doors[1],dist:1};was=doors[1].open;keyHandler(ev);assert.equal(doors[1].open,!was,'crosshair wins');
hit=null;camera.position.set(100,1.6,100);was=doors.map(d=>d.open).join();keyHandler(ev);assert.equal(doors.map(d=>d.open).join(),was,'out of range');
console.log('PASS: architecture/light construction paths; window sill/head and lintels; leaf clearance; cut heights; lampG contract; physical E, nearest/crosshair priority, distance and repeat guards (recording stubs, not WebGL).');
`,context);
