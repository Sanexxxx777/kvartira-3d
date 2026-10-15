    // Extra furniture types: walk-in wardrobe parts, utility, decor.
    case 'hang1': case 'hang2': {
      let s = rc(x,y,w,d,c,'fill-opacity=".6"') + `<line x1="${x}" y1="0" x2="${x+w}" y2="0" stroke="#3d3a34" stroke-width="2.5" vector-effect="non-scaling-stroke"/>`;
      for (let k = x + 50; k < x + w - 30; k += t === 'hang2' ? 60 : 90) s += ln(k, -d*.38, k, d*.38, 'opacity=".35"');
      return s;
    }
    case 'oshelf': return rc(x,y,w,d,c) + ln(x+18,y,x+18,y+d) + ln(x+w-18,y,x+w-18,y+d) + ln(x,y+d*.5,x+w,y+d*.5,DASH);
    case 'chest': return rc(x,y,w,d,c) + ln(x,y+d-50,x+w,y+d-50) + ln(x,y+d*.3,x+w,y+d*.3,DASH);
    case 'topbox': return rc(x,y,w,d,'none','stroke-dasharray="12 8" opacity=".55"');
    case 'hooks': return rc(x,y,w,d,c) + [.125,.375,.625,.875].map(k => `<circle cx="${x+w*k}" cy="${y+d}" r="22" fill="#3d3a34"/>`).join('');
    case 'boiler': return rc(x,y,w,d,c,'rx="20"') + rc(x+w*.2,y+d*.6,w*.6,d*.2,'#5b5f63') + pa(`M${x+w*.25} ${y+d*.35}L${x+w*.4} ${y+d*.2}L${x+w*.55} ${y+d*.35}L${x+w*.7} ${y+d*.2}`);
    case 'tallcab': return rc(x,y,w,d,c) + ln(x,y,x+w,y+d) + ln(x+w,y,x,y+d);
    case 'epanel': return rc(x,y,w,d,'#dfe6ee');
    case 'curtain': { let p = `M${x} 0`; for (let k = x; k < x + w; k += 120) p += `Q${k + 60} ${k % 240 ? -d*.4 : d*.4} ${Math.min(k + 120, x + w)} 0`; return rc(x,y,w,d,'none','opacity=".35"') + pa(p, 'none', 'opacity=".8"'); }
    case 'art': case 'mirror': return rc(x,y,w,d,t === 'mirror' ? '#dfeaee' : c);
    case 'glassblock': { let s = rc(x,y,w,d,'#dbeaf0'); for (let k = x + 190; k < x + w - 20; k += 190) s += ln(k,y,k,y+d,'opacity=".5"'); return s; }
    case 'floatcab': return rc(x,y,w,d,c) + ln(x,y+d-40,x+w,y+d-40,DASH);
    case 'drawers': return rc(x,y,w,d,c) + ln(0,y,0,y+d) + ln(x,y+d-50,x+w,y+d-50);
    case 'roundcab': return ec(0,0,w/2,d/2,c) + ec(0,0,w/2-25,d/2-25,'none','opacity=".5"') + `<circle cx="0" cy="${d/2-45}" r="18" fill="#3d3a34" opacity=".6"/>`;
    case 'odesk': return rc(x,y,w,d,c,'rx="15"') + rc(x+w-Math.min(600,w*.38),y,Math.min(600,w*.38),d,shade(c,.9));
    case 'gbox': return rc(x,y,w,d,c,'opacity=".75"');
    case 'niche': return rc(x,y,w,d,c) + rc(-250,y+d-150,500,150,'#7d7a52');
    case 'towelrail': return rc(x,y,w,d,c);
    case 'rainshower': return ec(0,0,w/2,d/2,'#dfe3e6');
