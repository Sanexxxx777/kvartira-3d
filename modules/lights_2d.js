  // plan lights: red = spots/tracks, blue = pendants, green = sconces, violet dashed = ceiling LED
  const LS = (c, w = 1.2) => `stroke="${c}" stroke-width="${w}" vector-effect="non-scaling-stroke"`;
  LIGHTS.forEach(L => {
    if (L.k === 'spot') s += `<circle cx="${L.at[0]}" cy="${L.at[1]}" r="40" fill="#fff" ${LS('#c0392b')}/>`;
    else if (L.k === 'track') s += `<line x1="${L.a[0]}" y1="${L.a[1]}" x2="${L.b[0]}" y2="${L.b[1]}" ${LS('#c0392b', 3)} opacity=".8"/>`;
    else if (L.k === 'pendant') s += `<circle cx="${L.at[0]}" cy="${L.at[1]}" r="90" fill="#fff" ${LS('#2f5d9a', 1.5)}/><line x1="${L.at[0]-64}" y1="${L.at[1]+64}" x2="${L.at[0]+64}" y2="${L.at[1]-64}" ${LS('#2f5d9a', 1.5)}/>`;
    else if (L.k === 'sconce'){ const [x, y] = L.at, [dx, dy] = L.dir; s += `<path d="M${x+dy*90} ${y+dx*90}L${x+dx*120} ${y+dy*120}L${x-dy*90} ${y-dx*90}" fill="none" ${LS('#2e8b57', 2)}/>`; }
    else if (L.k === 'led') s += `<polyline points="${L.pts.map(p => p.join(',')).join(' ')}" fill="none" ${LS('#8e44ad', 1.5)} stroke-dasharray="6 4"/>`;
  });
