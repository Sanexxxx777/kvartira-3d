let dialogResolve = null;
function askInPage(title, message, inputLabel=''){
  // One in-page decision at a time; no dependency on window.confirm/prompt.
  const dialog = $('#planDialog');
  if (dialog.open) return Promise.resolve(false);
  $('#planDialogTitle').textContent = title; $('#planDialogText').textContent = message;
  $('#dialogCancel').textContent = tr('取消','Cancel'); $('#dialogOK').textContent = tr('继续','Continue');
  $('#dialogInputLabel').hidden = !inputLabel; $('#dialogInputLabel').style.display = inputLabel ? '' : 'none';
  $('#dialogInputText').textContent = inputLabel; $('#dialogInput').value = ''; $('#dialogInput').required = !!inputLabel;
  dialog.returnValue = 'cancel'; dialog.showModal();
  return new Promise(resolve => { dialogResolve = resolve; });
}
$('#planDialog').addEventListener('close', () => {
  const resolve = dialogResolve; dialogResolve = null;
  resolve?.($('#planDialog').returnValue === 'ok' ? ($('#dialogInput').required ? Number($('#dialogInput').value) : true) : false);
});
function fullPlan(){
  const out = cloneData(PLAN);
  out.furniture = cloneData(state.furniture);
  out.rooms = out.rooms.map(r => ({...r,...state.rooms[r.id]}));
  out.editor = {demolished:cloneData(state.demolished),measures:cloneData(state.measures)};
  return out;
}
function installPlan(p, restore=false){
  save(); window.View3D?.preparePlan();
  bindPlan(p);
  Object.keys(panes).forEach(k => delete panes[k]);
  try { Object.assign(panes,JSON.parse(localStorage.getItem(PANES())) || {}); } catch(e) {}
  drawer(null); state = (restore && load()) || defaultState();
  ui.sel = null; ui.mA = null; ui.mCur = null; setTool('select');
  undoStack.length = redoStack.length = 0;
  document.querySelector('[data-full-cut]').dataset.cut = H;
  loadUnderlay(); renderOpenings(); renderDims(); fitView(); renderAll();
  window.View3D?.replacePlan(); save();
}
async function openPlanText(text){
  let p;
  try { if (text.length > 5000000) throw new Error('5 MB'); const input = JSON.parse(text);
    // Retain compatibility with upstream furniture-only exports.
    const legacy = input && !input.walls && Array.isArray(input.furniture);
    p = validatePlan(legacy ? {...fullPlan(), furniture:input.furniture, rooms:ROOMS.map(r => ({...r,...input.rooms?.[r.id]})), editor:{demolished:input.demolished,measures:input.measures}} : input); }
  catch (e){ await askInPage(tr('无法打开文件','Cannot open file'),tr('无效的平面图','Invalid plan')+': '+e.message); return false; }
  const ok = await askInPage(tr('打开平面图','Open plan'), tr('当前修改会保留在本机。导入文件将替换当前平面图，并清空撤销历史。','Current edits are saved in this browser. The file will replace the active plan and clear its undo history.')+'\n'+p.name);
  if (!ok) return false;
  while (switching) await new Promise(resolve => setTimeout(resolve,100));
  installPlan(p); toast(tr('方案已导入','Plan imported')); return true;
}
$('#exportJson').onclick = () => download(PLAN.id+'.json',new Blob([JSON.stringify(fullPlan(),null,2)],{type:'application/json'}));
$('#importJson').onclick = () => $('#fileIn').click();
$('#fileIn').onchange = async e => {
  const file = e.target.files[0]; e.target.value = ''; if (!file) return;
  try { await openPlanText(await file.text()); } catch(e){ toast(tr('无法读取文件','Could not read file')); }
};
$('#reset').onclick = async () => {
  if (await askInPage(tr('重置为默认方案','Reset to default'),tr('恢复为默认设计方案？（可撤销）','Reset to the default design? (undoable)'))){
    const b = snap(); state = defaultState(); ui.sel = null; commit(b); renderAll();
  }
};
async function clearLayout(){
  const n = state.furniture.length;
  if (!n) return toast(tr('当前没有布置任何家具','There is no furniture to clear'));
  if (!await askInPage(tr('清空布置','Clear layout'),tr(`确定清空全部 ${n} 件家具 / 家电吗？`, `Remove all ${n} furniture / appliance items?`))) return;
  ui.sel = null; mutate(() => state.furniture = []); toast(tr('已清空布置，可点「撤销」恢复','Layout cleared — Undo to restore'));
}
async function loadQueryPlan(){
  const path = new URLSearchParams(location.search).get('plan'); if (!path) return;
  // Only files in the local plans directory; never arbitrary URLs or traversal.
  if (!/^plans\/[A-Za-z0-9_-]+\.json$/.test(path)) return toast(tr('无效的平面图路径','Invalid plan path'));
  const initial = snap();
  try {
    const response = await fetch(path); if (!response.ok) throw new Error(response.status);
    const text = await response.text(); if (text.length > 5000000) throw new Error('5 MB');
    const p = validatePlan(JSON.parse(text));
    if (snap() !== initial && !await askInPage(tr('打开平面图','Open plan'),tr('当前修改会保留在本机。导入文件将替换当前平面图，并清空撤销历史。','Current edits are saved in this browser. The file will replace the active plan and clear its undo history.'))) return;
    while (switching) await new Promise(resolve => setTimeout(resolve,100));
    installPlan(p,true);
  } catch(e){ toast(tr('无法加载平面图，请通过本地 HTTP 服务打开页面或使用文件菜单。','Could not load plan. Use a local HTTP server or the File menu.')); }
}
