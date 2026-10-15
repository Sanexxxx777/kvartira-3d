    // Extra furniture types. Local axes: back at -z, front +z, y up.
    case 'hang1': case 'hang2': {
      const two = f.type === 'hang2', rm = chrome(), pm = woodM('#efe6d8'), led = glowMat('#fff4dc', '#ffdca0', 1.1);
      const cols = ['#2f3a4a','#e9e4da','#8a7a66','#c9d3dc','#5b6b5a','#d8c3a5','#3d3a34','#b4a08a','#a9b6c4','#7b5b4a'];
      (two ? [2.0, 1.0] : [2.0]).forEach(yr => {
        g.add(rod([-w/2 + .01, yr, 0], [w/2 - .01, yr, 0], .0125, rm));
        const glen = two ? .9 : 1.45;                                   // garment length below the rod
        for (let x = -w/2 + .05; x < w/2 - .04; x += .045 + R()*.03){
          const L = Math.min(glen*(.75 + R()*.3), yr - .08), gw = Math.min(d - .08, .42 + R()*.05), th = .018 + R()*.02;
          g.add(rod([x, yr - .03, 0], [x, yr + .02, 0], .002, rm), box(.012, .018, gw, rm, x, yr - .07, 0));
          g.add(rbox(th, L - .07, gw, fabric(cols[Math.floor(R()*cols.length)]), x, yr - L, 0, .008));
        }
      });
      if (two) g.add(rod([0, 1.0, 0], [0, H, 0], .008, rm));             // mid hanger to the ceiling
      else g.add(box(.018, 2.1, d, pm, w/2 - .009, 0, 0), box(.012, 2.06, .012, led, w/2 - .009, .02, d/2 - .006));   // divider + vertical LED
      break;
    }
    case 'oshelf': {
      const wm = woodM(c), t = .018, h = 2.1, led = glowMat('#fff4dc', '#ffdca0', 1.1), cols = ['#e9e4da','#c9d3dc','#8a7a66','#d8c3a5','#5b6b5a','#f3efe6','#2f3a4a'];
      g.add(box(t, h, d, wm, -w/2 + t/2), box(t, h, d, wm, w/2 - t/2));
      (f.led === 'both' ? [-1, 1] : f.led === 'plus' ? [1] : f.led === 'minus' ? [-1] : []).forEach(s => g.add(box(.012, h - .04, .012, led, s*(w/2 - t/2), .02, d/2 - .006)));
      [.08, .35, .62, .89, 1.16, 1.43, 1.7].forEach((y, i) => {
        g.add(box(w - 2*t, t, d - .01, wm, 0, y, .005));
        if (i < 2){ const bw = (w - 2*t - .03)/2; [-1, 1].forEach(s => g.add(rbox(bw, .2, d - .04, fabric('#cdbfa9'), s*(bw/2 + .007), y + t, .01, .02))); return; }   // baskets
        let x = -w/2 + t + .02;
        while (x < w/2 - t - .2){ const sw = .24 + R()*.06, n = 3 + Math.floor(R()*4); for (let k = 0; k < n; k++) g.add(rbox(sw, .044, d - .06, fabric(cols[Math.floor(R()*cols.length)]), x + sw/2, y + t + k*.045, .01, .012)); x += sw + .03; }
      });
      break;
    }
    case 'chest': {
      const cm = mat(c, {roughness:.55}), wm = woodM('#d8c3a5'), t = .018, led = glowMat('#fff4dc', '#ffdca0', 1.1), sd = .35, sz = bz + sd/2;
      g.add(box(w - .02, .06, d - .04, '#4a4641', 0, 0, -.02), box(w, .82, d - .02, cm, 0, .06, -.01));
      fronts(g, -w/2, .06, w, .8, d/2 - .02, 1, 4, cm, 'edge');
      g.add(rbox(w + .01, .025, d, wm, 0, .88, 0, .006));               // top = folding surface
      [-1, 1].forEach(s => g.add(box(t, 2.1 - .905, sd, wm, s*(w/2 - t/2), .905, sz)));
      g.add(box(.012, 2.1 - .93, .012, led, -w/2 + .006, .92, bz + sd - .006));   // LED on the side facing the rods
      [1.16, 1.43, 1.7].forEach(y => {
        g.add(box(w - 2*t, t, sd - .01, wm, 0, y, sz + .005));
        let x = -w/2 + t + .02;
        while (x < w/2 - t - .2){ const sw = .24 + R()*.05, n = 3 + Math.floor(R()*3); for (let k = 0; k < n; k++) g.add(rbox(sw, .044, sd - .05, fabric(['#e9e4da','#c9d3dc','#8a7a66','#d8c3a5','#2f3a4a'][Math.floor(R()*5)]), x + sw/2, y + t + k*.045, sz + .005, .012)); x += sw + .03; }
      });
      break;
    }
    case 'topbox': {
      if (opt.cut < 2.1) break;                                         // cut view: hide what hangs above the cut
      const cm = mat(c, {roughness:.55}), y0 = 2.1, h = Math.max(.2, H - y0 - .005);
      g.add(box(w, h, d - .02, cm, 0, y0, -.01));
      fronts(g, -w/2, y0, w, h, d/2 - .02, Math.max(1, Math.round(w/.55)), 1, cm, 'none');
      break;
    }
    case 'hooks': {
      const bm = blackMetal();
      g.add(box(w, .06, .022, woodM('#d8c3a5'), 0, 1.67, bz + .011));
      for (let k = 0; k < 4; k++){                                      // L-hooks: stub out from the rail, tip up
        const x = -w/2 + w*(k + .5)/4;
        g.add(rod([x, 1.69, bz + .022], [x, 1.69, bz + .075], .005, bm), rod([x, 1.69, bz + .075], [x, 1.725, bz + .085], .005, bm));
      }
      break;
    }
    case 'boiler': {
      const bm = mat(c, {roughness:.35}), y0 = 1.0, h = .74;
      g.add(rbox(w, h, d - .01, bm, 0, y0, -.005, .02));
      g.add(box(w*.6, .12, .004, '#2a2c2e', 0, y0 + h - .2, d/2 - .006), box(.08, .03, .002, screenMat('#2f8f7a'), -w*.12, y0 + h - .16, d/2 - .003));
      [-.12, -.04, .04, .12].forEach(x => g.add(rod([x, y0, 0], [x, .55, 0], .011, metal())));
      break;
    }
    case 'washdry': {
      const lo = buildFurniture({...f, type:'washer', cx:OX, cy:OY, rot:0}), hi = buildFurniture({...f, type:'dryer', cx:OX, cy:OY, rot:0});
      hi.position.y = .87; g.add(lo, hi);
      break;
    }
    case 'tallcab': {
      // props: ht (mm, capped by the ceiling), hd ('bar'|'edge'|'none'), rows (horizontal door joints)
      const cm = mat(c, {roughness:.55}), h = f.ht ? Math.min(M(f.ht), H) : 2.4;
      g.add(box(w - .02, .08, d - .06, '#4a4641', 0, 0, -.03), box(w, h - .08, d - .02, cm, 0, .08, -.01));
      fronts(g, -w/2, .08, w, h - .1, d/2 - .02, Math.max(1, Math.round(w/.5)), f.rows || 1, cm, f.hd || 'bar', 1.05);
      break;
    }
    case 'epanel': {
      g.add(rbox(w, .5, d, mat('#f2f3f1', {roughness:.4}), 0, 1.5, 0, .01), box(w*.7, .03, .003, '#9aa0a5', 0, 1.9, d/2 + .001));
      break;
    }
    case 'curtain': {
      // rail in the ceiling niche + sheer over the full width + two gathered panels at the ends; pleats = slats turned ±30°
      const top = H - .06, pleat = (x0, x1, z, m) => {
        const n = Math.max(3, Math.round((x1 - x0)/.06)), sw = (x1 - x0)/n;
        for (let i = 0; i < n; i++){ const s = box(sw*1.18, top - .02, .008, m, x0 + sw*(i + .5), .02, z); s.rotation.y = i % 2 ? .55 : -.55; g.add(s); }
      };
      g.add(box(w, .04, .06, mat('#d9d4cb'), 0, top, bz + .05));
      if (f.sheer !== false) pleat(-w/2, w/2, bz + .06, mat('#fbfaf6', {roughness:.9, transparent:true, opacity:.55, side:THREE.DoubleSide}));
      const pw = w*(f.open ?? .22), cm = mat(c, {roughness:.95, side:THREE.DoubleSide});
      pleat(-w/2, -w/2 + pw, bz + .13, cm); pleat(w/2 - pw, w/2, bz + .13, cm);
      break;
    }
    case 'art': {
      // frame + canvas; height ht and bottom y0 in mm as item props (defaults: 3:4, centred at 1.5 m)
      const ht = M(f.ht || f.w*.75), y0 = M(f.y0 ?? (1500 - (f.ht || f.w*.75)/2)), iw = w - .06, ih = ht - .06;
      g.add(box(w, ht, .03, woodM(f.frame || '#2b2724'), 0, y0, bz + .015), box(iw, ih, .004, mat(c, {roughness:.85}), 0, y0 + .03, bz + .032));
      g.add(box(iw*.42, ih*.5, .002, mat(f.c2 || darker(c, .7), {roughness:.9}), -iw*.16, y0 + .03 + ih*.18, bz + .035));
      break;
    }
    case 'mirror': {
      const ht = M(f.ht || 1000), y0 = M(f.y0 ?? 400);
      if (f.shape === 'oval'){   // frameless pebble mirror with a soft glow around the edge
        const disc = (r, m, z) => { const o = new THREE.Mesh(new THREE.CircleGeometry(.5, 64), m); o.scale.set(w + r, ht + r, 1); o.position.set(0, y0 + ht/2, z); return o; };
        g.add(disc(.05, glowMat('#fff4dc', '#ffdca0', .6), bz + .006), disc(0, mirror(), bz + .02));
        break;
      }
      g.add(rbox(w, ht, .02, woodM(f.frame || '#d8c3a5'), 0, y0, bz + .01, .01), box(w - .03, ht - .03, .003, mirror(), 0, y0 + .015, bz + .022));
      break;
    }
    case 'glassblock': {
      // separate blocks (~190 mm, laid vertically: taller than wide) over a thin light grout sheet in the middle
      const ht = M(f.ht || 2000), n = Math.max(1, Math.round(w/.1)), m = Math.max(1, Math.round(ht/.19)), bw = w/n, bh = ht/m;
      const gm = mat('#d6e6ea', {roughness:.25, metalness:.05, transparent:true, opacity:.78});
      g.add(box(w, ht, .006, mat('#ecebe6', {roughness:.9}), 0, 0, 0));
      // one instanced mesh, no shadows: 140 separate transparent blocks stalled software rendering
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(bw - .008, bh - .008, d), gm, n*m), mx = new THREE.Matrix4();
      for (let i = 0, k = 0; i < n; i++) for (let j = 0; j < m; j++, k++) im.setMatrixAt(k, mx.makeTranslation(-w/2 + bw*(i + .5), bh*(j + .5), 0));
      g.add(im);
      break;
    }
    case 'floatcab': {
      // wall-hung cabinet, handleless; props: ht, y0 (mm), rows, hd, top (worktop colour)
      const cm = mat(c, {roughness:.55}), ht = M(f.ht || 400), y0 = M(f.y0 ?? 350);
      g.add(box(w, ht, d - .02, cm, 0, y0, -.01));
      fronts(g, -w/2, y0, w, ht, d/2 - .02, Math.max(1, Math.round(w/.6)), f.rows || 1, cm, f.hd || 'edge');
      if (f.top) g.add(rbox(w + .01, .03, d + .01, mat(f.top, {roughness:.25}), 0, y0 + ht, 0, .006));
      break;
    }
    case 'drawers': {
      // dresser on slim metal legs, 2 columns × 3 drawers, no handles; props: ht, legs (mm), humid (humidifier on top)
      const cm = mat(c, {roughness:.6}), lh = M(f.legs ?? 150), ht = M(f.ht || 800);
      legs(g, w, d, lh, mat(c, {roughness:.4, metalness:.6}), .03, .008);
      g.add(box(w, ht - lh, d - .02, cm, 0, lh, -.01), box(w + .01, .02, d, cm, 0, ht, 0));
      fronts(g, -w/2, lh + .01, w, ht - lh - .02, d/2 - .02, 2, 3, cm, 'edge');
      if (f.humid) g.add(cyl(.1, .11, .36, mat('#f4f4f2', {roughness:.3}), w*.3, ht + .02, 0, 32));
      break;
    }
    case 'odesk': {
      // oak desk: transparent acrylic leg at the left end, drawer pedestal on the right, monitor shifted right, soundbar
      const tm = woodM(c), pw = Math.min(.6, w*.38), acr = mat('#e8f1f2', {roughness:.08, transparent:true, opacity:.45}), mx = w*.12;
      g.add(rbox(w, .03, d, tm, 0, .72, 0, .006));
      g.add(box(.03, .72, d*.8, acr, -w/2 + .08, 0, 0), box(.2, .02, d*.8, acr, -w/2 + .08, 0, 0));
      g.add(box(pw, .7, d - .02, tm, w/2 - pw/2, .02, -.01)); fronts(g, w/2 - pw, .02, pw, .7, d/2 - .02, 1, 3, tm, 'edge');
      g.add(box(.3, .06, .2, '#d7d7d9', mx, .75, bz + .14), box(.62, .37, .02, mat('#c9cbce', {metalness:.6, roughness:.3}), mx, .84, bz + .14), box(.6, .34, .002, screenMat('#1f2b3a'), mx, .855, bz + .151));
      g.add(rbox(.5, .05, .08, '#1b1b1c', mx, .75, bz + .29, .02));
      break;
    }
    case 'gbox': {
      // plain block: podium, installation box, bench; props ht, y0 (mm)
      g.add(box(w, M(f.ht || 1000), d, mat(c, {roughness:.8}), 0, M(f.y0 || 0), 0));
      break;
    }
    case 'niche': {
      // box to the ceiling with an open niche facing front; props nw, nh, ny0 (mm), back (tile colour); 4 shelves
      const cm = mat(c, {roughness:.7}), nw = M(f.nw || 500), nh = M(f.nh || 1100), ny = M(f.ny0 || 1000), nd = Math.min(.15, d - .03), sw = (w - nw)/2;
      g.add(box(w, ny, d, cm, 0, 0, 0), box(w, H - ny - nh, d, cm, 0, ny + nh, 0), box(sw, nh, d, cm, -(nw + sw)/2, ny, 0), box(sw, nh, d, cm, (nw + sw)/2, ny, 0));
      g.add(box(nw, nh, d - nd, cm, 0, ny, -nd/2), box(nw, nh, .004, mat(f.back || '#7d7a52', {roughness:.25}), 0, ny, d/2 - nd + .002));
      for (let k = 1; k <= 4; k++) g.add(box(nw, .012, nd, mat('#f2efe9', {roughness:.3}), 0, ny + nh*k/5, d/2 - nd/2));
      break;
    }
    case 'towelrail': {
      const wm = mat(c, {roughness:.35, metalness:.4}), ht = M(f.ht || 1400), y0 = M(f.y0 || 300), z = bz + .05;
      [-1, 1].forEach(s => g.add(rod([s*(w/2 - .02), y0, z], [s*(w/2 - .02), y0 + ht, z], .014, wm)));
      for (let y = y0 + .05; y < y0 + ht - .02; y += .11) g.add(rod([-w/2 + .02, y, z], [w/2 - .02, y, z], .009, wm));
      break;
    }
    case 'rainshower': {
      const sm = mat(c, {roughness:.35, metalness:.7});
      g.add(cyl(w/2, w/2, .012, sm, 0, H - .045, 0, 40), rod([0, H - .035, 0], [0, H, 0], .012, sm));
      break;
    }
