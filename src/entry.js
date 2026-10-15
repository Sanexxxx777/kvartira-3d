  const entry = entryGeometry();
  if (entry){
    const {x,y,dx,dy} = entry, a = Math.atan2(dy,dx)*180/Math.PI;
    s += `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-1100 0H-180M-380 -140L-180 0L-380 140" fill="none" stroke="#b5653a" stroke-width="2" vector-effect="non-scaling-stroke"/></g><text x="${x-dx*1100}" y="${y-dy*1100-160}" font-size="180" fill="#b5653a">${tr('入户','Entry')}</text>`;
  }
