function preparePlan(){
  if (!inited) return;
  if (opt.mode === 'walk') setMode('orbit');
  fly = null; Object.keys(keys).forEach(k => keys[k] = false);
}
function replacePlan(){
  opt.cut = H; sigArch = sigFurn = sigLabels = ''; selKey = null;
  if (!inited) return;
  syncCutBtns(); sync(true); if (active) setPose(isoWhole());
}
