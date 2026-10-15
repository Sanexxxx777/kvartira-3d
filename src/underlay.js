let underlay = null, underlayMode = '', underlayPoints = [], underlayDrag = null;
const underlayKey = () => STORE+':underlay';
function loadUnderlay(){
  underlay = null; underlayMode = ''; underlayPoints = []; underlayDrag = null;
  try {
    const u = JSON.parse(localStorage.getItem(underlayKey()));
    if (u && /^data:image\/(png|jpeg|webp);base64,/.test(u.src) && [u.x,u.y,u.scale,u.width,u.height,u.opacity].every(Number.isFinite) && u.width > 0 && u.height > 0 && u.scale > 0 && u.opacity >= 0 && u.opacity <= 1) underlay = u;
  } catch(e) {}
  renderUnderlay();
}
function saveUnderlay(){
  try { localStorage.setItem(underlayKey(),JSON.stringify(underlay)); }
  catch(e){ toast(tr('本机存储已满，底图只保留到关闭页面。请使用更小的图片。','Browser storage is full. The underlay will last only until this page closes. Use a smaller image.')); }
}
function renderUnderlay(){
  const g = $('#gUnderlay'); g.replaceChildren();
  svg.classList.toggle('has-underlay',!!underlay?.show);
  if (underlay?.show){
    const img = document.createElementNS('http://www.w3.org/2000/svg','image');
    const u = underlay;
    Object.entries({href:u.src,x:u.x,y:u.y,width:u.width*u.scale,height:u.height*u.scale,opacity:u.opacity,preserveAspectRatio:'none'}).forEach(([k,v]) => img.setAttribute(k,v));
    g.appendChild(img);
    underlayPoints.forEach(p => {
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      Object.entries({cx:p.x,cy:p.y,r:7/view.s,fill:'#b5653a',stroke:'#fff','stroke-width':2/view.s}).forEach(([k,v]) => c.setAttribute(k,v)); g.appendChild(c);
    });
  }
  $('#underlayHint').hidden = !underlayMode;
  $('#underlayHint').textContent = underlayMode === 'calibrate'
    ? tr('点击底图上的两个点 · Esc 取消','Click two points on the image · Esc cancels')
    : tr('拖动移动底图 · Esc 完成','Drag to move the image · Esc finishes');
}
$('#underlayBtn').onclick = async () => {
  if (is3D()) await setView('2d');
  $('#underlayOpacity').value = underlay?.opacity ?? .5; $('#underlayShow').checked = underlay?.show ?? true;
  $('#underlayCalibrate').disabled = $('#underlayMove').disabled = !underlay;
  $('#underlayDialog').showModal();
};
$('#underlayClose').onclick = () => $('#underlayDialog').close();
$('#underlayOpacity').oninput = e => { if (underlay){ underlay.opacity = +e.target.value; renderUnderlay(); saveUnderlay(); } };
$('#underlayShow').onchange = e => { if (underlay){ underlay.show = e.target.checked; renderUnderlay(); saveUnderlay(); } };
$('#underlayFile').onchange = async e => {
  const file = e.target.files[0]; e.target.value = ''; if (!file) return;
  if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 3000000) return toast(tr('请使用不超过 3 MB 的 PNG、JPEG 或 WebP 图片。','Use a PNG, JPEG or WebP image up to 3 MB.'));
  const planID = PLAN.id;
  try {
    const src = await new Promise((resolve,reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
    const img = new Image(); img.src = src; await img.decode();
    if (PLAN.id !== planID) return;
    if (!img.naturalWidth || img.naturalWidth*img.naturalHeight > 40000000) throw new Error('size');
    const b = planExtents(PLAN);
    underlay = {src,x:0,y:0,width:img.naturalWidth,height:img.naturalHeight,scale:(b.x1-b.x0)/img.naturalWidth,opacity:.5,show:true};
    $('#underlayOpacity').value = .5; $('#underlayShow').checked = true;
    $('#underlayCalibrate').disabled = $('#underlayMove').disabled = false;
    renderUnderlay(); saveUnderlay();
  } catch(e){ toast(tr('无法读取图片','Could not read image')); }
};
function beginUnderlay(mode){
  if (!underlay) return; underlay.show = true; underlayMode = mode; underlayPoints = [];
  $('#underlayDialog').close(); renderUnderlay();
}
$('#underlayCalibrate').onclick = () => beginUnderlay('calibrate');
$('#underlayMove').onclick = () => beginUnderlay('move');
svg.addEventListener('pointerdown',async e => {
  if (is3D() || !underlay?.show || e.button !== 0 || (!underlayMode && !e.altKey)) return;
  e.preventDefault(); e.stopImmediatePropagation(); const p = toMM(e);
  if (underlayMode === 'calibrate'){
    if (underlayPoints.length >= 2) return;
    underlayPoints.push({x:p.x,y:p.y}); renderUnderlay();
    if (underlayPoints.length !== 2) return;
    const [a,b] = underlayPoints, measured = Math.hypot(b.x-a.x,b.y-a.y), u = underlay;
    if (measured*view.s < 8){ underlayPoints.pop(); return; }
    underlayMode = ''; renderUnderlay();
    const mm = await askInPage(tr('标定底图','Calibrate underlay'),tr('输入两点间的实际距离。','Enter the real distance between the two points.'),tr('距离 (mm)','Distance (mm)'));
    if (mm && Number.isFinite(mm) && mm > 0 && underlay === u){
      const factor = mm/measured;
      // Anchor the first clicked point, so calibration does not jump away.
      u.x = a.x-(a.x-u.x)*factor; u.y = a.y-(a.y-u.y)*factor; u.scale *= factor; saveUnderlay();
    }
    underlayPoints = []; renderUnderlay();
  } else {
    underlayDrag = {id:e.pointerId,start:p,x:underlay.x,y:underlay.y}; svg.setPointerCapture(e.pointerId);
  }
},true);
svg.addEventListener('pointermove',e => {
  if (!underlayDrag || e.pointerId !== underlayDrag.id) return;
  e.preventDefault(); e.stopImmediatePropagation(); const p = toMM(e);
  underlay.x = underlayDrag.x+p.x-underlayDrag.start.x; underlay.y = underlayDrag.y+p.y-underlayDrag.start.y; renderUnderlay();
},true);
for (const type of ['pointerup','pointercancel']) svg.addEventListener(type,e => {
  if (!underlayDrag || e.pointerId !== underlayDrag.id) return;
  e.stopImmediatePropagation(); underlayDrag = null;
  if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
  saveUnderlay();
},true);
document.addEventListener('keydown',e => {
  if (e.code !== 'Escape' || !underlayMode) return;
  e.preventDefault(); e.stopImmediatePropagation(); underlayMode = ''; underlayPoints = []; renderUnderlay();
},true);
loadUnderlay();
