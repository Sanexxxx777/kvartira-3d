// Run the patched builder and camera hook with recording primitives, not WebGL.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const data=html.slice(html.indexOf('// The embedded plan'),html.indexOf('const MATS ='));
const builder=html.slice(html.indexOf('const FURNITURE_MM ='),html.indexOf('/* ======================= 建筑'));
class V {constructor(x=0,y=0,z=0){this.set(x,y,z);}set(x,y,z){Object.assign(this,{x,y,z});return this;}}
class G {constructor(...args){this.args=args;}}
class O {constructor(geometry,material){Object.assign(this,{geometry,material,children:[],position:new V(),rotation:new V(),scale:new V(1,1,1),userData:{}});}add(...o){this.children.push(...o);}}
class Instanced extends O {constructor(g,m,count){super(g,m);this.count=count;this.matrices=[];}setMatrixAt(k,m){this.matrices[k]=[...m.xyz];}}
class Matrix {makeTranslation(...xyz){this.xyz=xyz;return this;}}
const THREE={Group:O,Mesh:O,CircleGeometry:G,BoxGeometry:G,SphereGeometry:G,TorusGeometry:G,Vector3:V,InstancedMesh:Instanced,Matrix4:Matrix,DoubleSide:2};
const calls=[];
const material=(color,props={})=>({color,...props});
const c={assert,console,THREE,Instanced,calls,rng:()=>()=>.5,mat:material,woodM:material,glowMat:material,fabric:material,mirror:material,chrome:material,ceramic:material,metal:material,blackMetal:material,screenMat:material,darker:c=>c,lighter:c=>c,rot:o=>o,sh:o=>o};
for(const name of ['box','rbox','rod','cyl','tube','shell','lathe'])c[name]=(...args)=>{const o=new O(new G(...args));o.kind=name;calls.push(o);return o;};
for(const name of ['fronts','legs'])c[name]=(...args)=>calls.push({kind:name,args});
vm.createContext(c);
vm.runInContext(data+`
const M=v=>v/1000,wx=x=>(x-OX)/1000,wz=z=>(z-OY)/1000,opt={cut:H};
const make=(type,props={})=>({type,name:type,cx:1000,cy:2000,w:1200,d:400,rot:90,color:'#d1af86',...props});
`+builder,c);
vm.runInContext(`
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,a+' != '+b);
const f=make('floatcab',{ht:.42,y0:.31,lift:.12,rows:2,hd:'none',top:'#eeeedf'}),before=JSON.stringify(f);
const cab=buildFurniture(f);close(cab.children[0].geometry.args[1],.42);close(cab.children[0].geometry.args[5],.31);
close(cab.position.y,.12);close(cab.position.x,wx(1000));close(cab.position.z,wz(2000));close(cab.rotation.y,-Math.PI/2);
const front=calls.find(o=>o.kind==='fronts');assert.equal(front.args[7],2);assert.equal(front.args[9],'none');
close(cab.children[1].geometry.args[5],.73);assert.equal(cab.children[1].geometry.args[3].color,'#eeeedf');
buildFurniture(f);assert.equal(JSON.stringify(f),before,'Rendering must not mutate JSON/state units');
calls.length=0;const dresser=buildFurniture(make('drawers',{ht:.85,legs:.17,humid:true}));
close(calls.find(o=>o.kind==='legs').args[3],.17);close(dresser.children[0].geometry.args[1],.68);
assert.equal(dresser.children.at(-1).kind,'cyl');
const block=buildFurniture(make('gbox',{ht:.08,y0:.2,lift:.11}));close(block.children[0].geometry.args[1],.08);close(block.children[0].geometry.args[5],.2);close(block.position.y,.11);
const niche=buildFurniture(make('niche',{nw:500,nh:.9,ny0:1.1,back:'#778a75'}));
close(niche.children[4].geometry.args[0],.5);close(niche.children[4].geometry.args[1],.9);close(niche.children[4].geometry.args[5],1.1);
close(niche.children[1].geometry.args[1],.5);assert.equal(niche.children[5].geometry.args[3].color,'#778a75');assert.equal(niche.children.length,10);
const towel=buildFurniture(make('towelrail',{ht:1.2,y0:.4}));close(towel.children[0].geometry.args[0][1],.4);close(towel.children[0].geometry.args[1][1],1.6);
const rain=buildFurniture(make('rainshower',{w:300,d:300}));close(rain.children[0].geometry.args[0],.15);close(rain.children[0].geometry.args[5],H-.045);
assert.ok(buildFurniture(make('odesk')).children.length>5);
const tall=buildFurniture(make('tallcab',{ht:3,rows:3,hd:'edge'}));close(tall.children[1].geometry.args[1]+.08,H);
const oval=buildFurniture(make('mirror',{w:500,ht:.9,y0:1.1,shape:'oval'}));assert.equal(oval.children.length,2);close(oval.children[1].scale.x,.5);close(oval.children[1].scale.y,.9);close(oval.children[1].position.y,1.55);
const vanity=buildFurniture(make('vanity')),noMirror=buildFurniture(make('vanity',{mirror:false}));
assert.equal(noMirror.children.length,vanity.children.length-2,'Separate oval replaces the built-in vanity mirror');
const glass=buildFurniture(make('glassblock',{w:800,ht:1.9})),inst=glass.children.find(o=>o instanceof Instanced);
assert.equal(inst.count,80);assert.equal(inst.matrices.length,80);close(inst.matrices[79][1],1.805);
const hanger=buildFurniture(make('hang2'));assert.ok(hanger.children.some(o=>o.kind==='rod'&&o.geometry.args[1][1]===H));
assert.ok(buildFurniture(make('hooks')).children.length>4);
// Composite child models inherit mm props but never inherit the parent's lift.
const stackInput=make('washdry',{w:600,d:600,lift:.08}),stack=buildFurniture(stackInput);
close(stack.position.y,.08);close(stack.children[0].position.y,0);close(stack.children[1].position.y,.87);assert.equal(stackInput.lift,.08);
console.log('PASS: new/changed furniture geometry paths; metre/mm boundaries; podium/composite lift; nonmutation; oval mirror; ceiling cap; instanced glass (recording stubs, not WebGL).');
`,c);
const api=html.slice(html.indexOf('window.View3D = {'),html.indexOf('\n',html.indexOf('window.View3D = {')));
vm.runInContext(`
const window={},enter=()=>{},exit=()=>{},relang=()=>{},preparePlan=()=>{},replacePlan=()=>{},sync=()=>{},shot=()=>{},groundAt=()=>{},flyToRoom=()=>{};
let active=false,anim=false,lastFlight=null;
const pose=(target,eye)=>({target,eye}),flyTo=(p,duration)=>lastFlight={...p,duration};
`+api+`
window.View3D.look(1000,2000,1.6,3000,4000,1.1);assert.equal(lastFlight,null);
active=true;window.View3D.look(1000,2000,1.6,3000,4000,1.1);
assert.equal(lastFlight.eye.x,wx(1000));assert.equal(lastFlight.eye.z,wz(2000));assert.equal(lastFlight.eye.y,1.6);
assert.equal(lastFlight.target.x,wx(3000));assert.equal(lastFlight.target.z,wz(4000));assert.equal(lastFlight.target.y,1.1);assert.equal(lastFlight.duration,10);
console.log('PASS: View3D.look public hook; active guard; plan/height coordinates and 10 ms transition.');
`,c);
