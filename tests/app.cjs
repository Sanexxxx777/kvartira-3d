// Deliberately small DOM harness, not a substitute for a browser/rendering test.
const vm = require('node:vm'), fs = require('node:fs'), assert = require('node:assert/strict');
const html = fs.readFileSync('index.html','utf8'), script = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].find(m=>!m[1].trim())[2];
class Element {
  constructor(id=''){ this.id=id;this.dataset={};this.style={};this.listeners={};this.attrs={};this.children=[];this.value='';this.textContent='';this.innerHTML='';this.open=false;this.clientWidth=900;this.clientHeight=650;const s=new Set();this.classList={contains:x=>s.has(x),add:(...x)=>x.forEach(v=>s.add(v)),remove:(...x)=>x.forEach(v=>s.delete(v)),toggle:(x,v)=>{if(v===undefined)v=!s.has(x);v?s.add(x):s.delete(x);return v;}}; }
  setAttribute(k,v){this.attrs[k]=String(v);} getAttribute(k){return this.attrs[k];}
  addEventListener(k,fn,capture){(this.listeners[k]??=[]).push({fn,capture});}
  querySelector(){return new Element();} querySelectorAll(){return [];}
  replaceChildren(...c){this.children=c;} appendChild(c){this.children.push(c);return c;}
  getBoundingClientRect(){return {left:0,top:0,width:900,height:650,right:900,bottom:650};}
  createSVGPoint(){return {x:0,y:0,matrixTransform(){return {x:this.x,y:this.y};}};}
  getScreenCTM(){return {inverse(){return {};}};}
  setPointerCapture(id){this.pointer=id;}hasPointerCapture(id){return this.pointer===id;}releasePointerCapture(){this.pointer=null;}
  showModal(){this.open=true;}close(value=''){this.returnValue=value;this.open=false;for(const x of this.listeners.close??[])x.fn();}
  matches(){return false;}contains(){return false;}remove(){}click(){}observe(){}
}
const elements=new Map(), get=s=>{if(!elements.has(s))elements.set(s,new Element(s));return elements.get(s);};
const statics=[...html.matchAll(/<[^>]*\bdata-en="([^"]*)"[^>]*>([^<]*)/g)].map(m=>{const e=new Element();e.dataset.en=m[1];e.textContent=m[2];return e;});
const document={querySelector:s=>s==='dialog[open]'?[...elements.values()].find(e=>e.open):get(s),querySelectorAll:s=>s==='[data-en]'?statics:[],createElement:()=>new Element(),createElementNS:()=>new Element(),body:new Element(),documentElement:new Element(),listeners:{},addEventListener(k,fn,capture){(this.listeners[k]??=[]).push({fn,capture});}};
const memory=new Map(), localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};
const c={console,document,navigator:{language:'ru-RU'},localStorage,matchMedia:q=>({matches:false,addEventListener(){}}),ResizeObserver:class{observe(){}},setTimeout:()=>1,clearTimeout(){},addEventListener(){},URL,URLSearchParams,location:{search:''},Image:class{},Blob,devicePixelRatio:1,assert,Element,memory,get,fetch:()=>{throw Error('No network in tests');}};
c.window=c; vm.createContext(c);
vm.runInContext(script,c,{timeout:5000});
vm.runInContext(`
(async()=>{
assert.equal(LANG,'ru');assert.equal(document.documentElement.lang,'ru');
assert.equal(nm('Туалет'),'Туалет');assert.equal(nm('Кладовая'),'Кладовая');
assert.equal(nm('双人床'),'Двуспальная кровать');
for(const name of Object.values(NAMES_EN))assert.notEqual(ruText(name),name,'Untranslated built-in: '+name);
assert.match(overviewPanel(),/Клавиши/);assert.doesNotMatch(overviewPanel(),/Keyboard|Room Areas|Flooring Estimate/);
// Check the consumer panels, not only the price helper or translation table.
assert.match(overviewPanel(),/₽/);assert.match(overviewPanel(),/ориентировочно/);assert.doesNotMatch(overviewPanel(),/¥|CNY/);
assert.ok(roomPanel(ROOMS[0]).includes((4500).toLocaleString('ru-RU')+' ₽/m²'));assert.match(roomPanel(ROOMS[0]),/ориентировочно/);
const expectedTotal=ROOMS.reduce((sum,r)=>sum+area(r.poly)*FLOOR_RUB[state.rooms[r.id].mat]*1.05,0);
assert.ok(overviewPanel().includes(floorMoney(expectedTotal)));
for(const [id,m] of Object.entries(MATS)){assert.ok(FLOOR_RUB[id]>0);assert.equal(floorPrice(id),FLOOR_RUB[id]);}
for(const type of ['floatcab','drawers','odesk','gbox','niche','towelrail','rainshower']){
 const item=LIB.flatMap(c=>c.items).find(i=>i[0]===type);assert.ok(item,type);assert.notEqual(nm(item[1]),item[1]);
 assert.ok(furnSVG(type,item[2],item[3],item[4]).length>0);
}
assert.equal(tr('x','Added "Кресло" 500×600'),'Добавлено: «Кресло» 500×600');
assert.equal(tr('x','Wall area (2.5m ceiling, openings not deducted) ≈ 12.0 m²'),'Площадь стен (потолок 2.5 м, без вычета проёмов) ≈ 12.0 м²');
for(const f of state.furniture){ assert.equal(typeof furnSVG(f.type,f.w,f.d,f.color),'string'); }
const keyboard=document.listeners.keydown.find(x=>!x.capture).fn;
const key=(code,extra={})=>keyboard({code,key:'я',target:new Element(),preventDefault(){},...extra});
key('KeyM');assert.equal(ui.tool,'measure');key('KeyX');assert.equal(ui.tool,'demolish');key('KeyV');assert.equal(ui.tool,'select');
ui.sel={kind:'furn',id:state.furniture[0].id};const rotation=state.furniture[0].rot;
key('KeyR');assert.equal(state.furniture[0].rot,(rotation+90)%360);
key('KeyZ',{ctrlKey:true});assert.equal(state.furniture[0].rot,rotation);
const scale=view.s;key('Equal');assert.ok(view.s>scale);key('Minus');assert.ok(Math.abs(view.s-scale)<1e-10);
const original=fullPlan(), oldID=PLAN.id;
state.furniture[0].cx+=123;save();const stored=memory.get(STORE);
let p=cloneData(original);p.id='second-plan';p.ceiling=3;p.windows[0][4]=1.1;p.windows[0][5]=2.7;p.furniture=[];delete p.dims;
installPlan(validatePlan(p));assert.equal(H,3);assert.equal(state.furniture.length,0);assert.equal(planDims().length,2);assert.equal(undoStack.length,0);assert.equal(get('[data-full-cut]').dataset.cut,3);
assert.equal(memory.get('kvartira-3d:v1:'+oldID),stored);
installPlan(validatePlan(original),true);assert.equal(state.furniture[0].cx,JSON.parse(stored).furniture[0].cx);
const saved=JSON.stringify(fullPlan());
let pending=openPlanText(JSON.stringify(p));assert.ok(get('#planDialog').open);get('#planDialog').close('cancel');assert.equal(await pending,false);assert.equal(JSON.stringify(fullPlan()),saved);
pending=openPlanText(JSON.stringify(p));get('#planDialog').close('ok');assert.equal(await pending,true);assert.equal(PLAN.id,'second-plan');
// Full export retains architecture, per-window heights, lights and custom props.
installPlan(validatePlan(original));const out=validatePlan(fullPlan());assert.equal(out.furniture.find(f=>f.type==='art').ht,original.furniture.find(f=>f.type==='art').ht);
for(const type of ['floatcab','drawers','towelrail','washdry','gbox'])assert.deepEqual(out.furniture.find(f=>f.type===type),original.furniture.find(f=>f.type===type));
assert.deepEqual(out.lights,original.lights);
const propsPlan=cloneData(original);
propsPlan.furniture.push({type:'niche',name:'Shelved niche',cx:1000,cy:1000,w:800,d:200,color:'#e6ddce',nw:450,nh:.9,ny0:1.1,back:'#778a75',lift:.05});
propsPlan.lights.push({k:'pendant',at:[1000,1000],h:1.9,style:'bar',len:1400,vert:true});
installPlan(validatePlan(propsPlan));save();const restored=load();
assert.equal(restored.furniture.at(-1).nw,450);assert.equal(restored.furniture.at(-1).ny0,1.1);assert.equal(restored.furniture.at(-1).lift,.05);
const propsOut=validatePlan(fullPlan());assert.deepEqual(propsOut.furniture.at(-1),validatePlan(propsPlan).furniture.at(-1));assert.deepEqual(propsOut.lights.at(-1),propsPlan.lights.at(-1));
installPlan(validatePlan(original));
// A legacy furniture-only import still works, with validation and confirmation.
pending=openPlanText(JSON.stringify({furniture:[{type:'chair',name:'Chair',cx:1000,cy:1000,w:450,d:450,rot:0}]}));get('#planDialog').close('ok');await pending;assert.equal(state.furniture.length,1);assert.ok(state.furniture[0].color);
// Underlay calibration preserves its first anchor and survives a plan switch.
underlay={src:'data:image/png;base64,AA==',x:0,y:0,width:100,height:100,scale:10,opacity:.5,show:true};beginUnderlay('calibrate');
const down=svg.listeners.pointerdown.find(x=>x.capture).fn;
const event=(x,y,extra={})=>({clientX:x,clientY:y,button:0,pointerId:1,preventDefault(){},stopImmediatePropagation(){},...extra});
await down(event(100,100));pending=down(event(1100,100));assert.ok(get('#planDialog').open);get('#dialogInput').value='2000';get('#planDialog').close('ok');await pending;
assert.equal(underlay.scale,20);assert.equal(underlay.x,-100);assert.equal(underlay.y,-100);assert.equal(underlayMode,'');
const underlaySaved=JSON.stringify(underlay);installPlan(validatePlan(p));assert.equal(underlay,null);installPlan(validatePlan(original));assert.equal(JSON.stringify(underlay),underlaySaved);
// URL-plan dispatch uses a stub response; no socket or actual request is made.
let fetches=0;fetch=async path=>{fetches++;assert.equal(path,'plans/second-plan.json');return {ok:true,text:async()=>JSON.stringify(p)};};
location.search='?plan=https://example.invalid/plan.json';await loadQueryPlan();assert.equal(fetches,0);
location.search='?plan=plans/second-plan.json';await loadQueryPlan();assert.equal(fetches,1);assert.equal(PLAN.id,'second-plan');location.search='';
setLang('en');assert.equal(tr('x','Entry'),'Entry');setLang('zh');assert.equal(tr('入口','Entry'),'入口');assert.equal(nm('Single Bed'),'单人床');setLang('zht');assert.equal(tr('开门','Open'),'開門');setLang('ru');
installPlan(validatePlan(original));
for(const lang of ['en','zh','zht','ru']){
 setLang(lang);const overview=overviewPanel(),room=roomPanel(ROOMS[0]);
 if(lang==='en'||lang==='ru'){assert.match(overview,/₽/);assert.match(room,/₽/);assert.doesNotMatch(overview+room,/¥/);assert.equal(floorPrice('wood'),4500);}
 else {assert.match(overview,/¥/);assert.ok(room.includes('¥320/m²'));assert.doesNotMatch(overview+room,/₽/);assert.equal(floorPrice('wood'),320);}
}
console.log('PASS: full 2D script initialization; Russian strings; physical-key shortcuts; undo; full/legacy imports; confirmation cancellation; per-plan storage; export; underlay calibration and restoration; query-plan path/response; all four languages.');
})().catch(e=>{console.error(e);process.exitCode=1;});
`,Object.assign(c,{process}),{timeout:5000});
