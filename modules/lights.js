/* lights from the plan LIGHTS array; replaces the upstream one-disc-per-room lamp.
   lampG gets only emissive meshes and point lights (applyLight touches material.emissiveIntensity of every non-light child);
   dark housings (rails, cords, shades, rings) go to archUp. */
function buildLights(top){
  const ceil = top >= H, blk = mat('#1d1d1f', {roughness:.5, metalness:.3});
  const glow = () => new THREE.MeshStandardMaterial({color:'#fff', emissive:'#fff0d2', emissiveIntensity:.3});
  const lit = (m, vis) => { m.visible = vis; lampG.add(m); };
  const dark = (m, vis) => { m.visible = vis; archUp.add(m); };
  const pl = (x, y, z, d) => { const p = new THREE.PointLight(0xffd9a8, 0, d, 1.8); p.position.set(x, y, z); lampG.add(p); };
  LIGHTS.forEach(L => {
    if (L.k === 'spot'){
      const x = wx(L.at[0]), z = wz(L.at[1]), m = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .01, 20), glow());
      m.position.set(x, H - .005, z); lit(m, ceil);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.042, .006, 8, 24), mat('#e8e6e1')); ring.rotation.x = Math.PI/2; ring.position.set(x, H - .004, z); dark(ring, ceil);
    } else if (L.k === 'pl'){
      pl(wx(L.at[0]), H - .3, wz(L.at[1]), 4.5);
    } else if (L.k === 'track'){
      const [x0, y0] = L.a, [x1, y1] = L.b, len = M(Math.hypot(x1 - x0, y1 - y0)), hz = Math.abs(x1 - x0) >= Math.abs(y1 - y0), cx = wx((x0 + x1)/2), cz = wz((y0 + y1)/2);
      dark(box(hz ? len : .035, .035, hz ? .035 : len, blk, cx, H - .035, cz), ceil);
      const n = Math.max(2, Math.round(len/.8));
      for (let i = 0; i < n; i++){
        const t = -len/2 + len*(i + .5)/n, px = cx + (hz ? t : 0), pz = cz + (hz ? 0 : t);
        dark(cyl(.03, .03, .1, blk, px, H - .14, pz, 16), ceil);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(.024, 16), glow()); lens.rotation.x = Math.PI/2; lens.position.set(px, H - .141, pz); lit(lens, ceil);
      }
      pl(cx, H - .3, cz, 5.5);
    } else if (L.k === 'pendant'){
      const px = wx(L.at[0]), pz = wz(L.at[1]), hb = L.h;
      if (L.style === 'bar'){                                        // linear LED bar on two cords, along x unless rot
        const len = M(L.len || 1200), hz = !L.vert;
        [-1, 1].forEach(s => dark(rod([px + (hz ? s*len*.4 : 0), hb + .03, pz + (hz ? 0 : s*len*.4)], [px + (hz ? s*len*.4 : 0), H, pz + (hz ? 0 : s*len*.4)], .002, blk), ceil));
        dark(box(hz ? len : .035, .03, hz ? .035 : len, blk, px, hb, pz), true);
        const s = new THREE.Mesh(new THREE.BoxGeometry(hz ? len - .02 : .02, .004, hz ? .02 : len - .02), glow()); s.position.set(px, hb - .002, pz); lit(s, true);
        pl(px, hb - .1, pz, 3.5);
        return;
      }
      dark(rod([px, hb + .16, pz], [px, H, pz], .003, blk), ceil);
      const shade = L.style === 'glass' ? mat('#e9e4da', {roughness:.35, transparent:true, opacity:.55, side:THREE.DoubleSide}) : mat('#2b2b2d', {roughness:.6, side:THREE.DoubleSide});
      dark(lathe(L.style === 'glass' ? [[.11, 0], [.1, .08], [.06, .14], [.02, .17]] : [[.14, 0], [.07, .12], [.02, .16]], shade, px, hb, pz, 32), true);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.04, 16, 12), glow()); bulb.position.set(px, hb + .05, pz); lit(bulb, true);
      pl(px, hb - .05, pz, 4);
    } else if (L.k === 'sconce'){
      // wall plate + short arm + open shade facing up; the glowing part is the inner disc of the shade
      const [dx, dz] = L.dir, wx0 = wx(L.at[0]), wz0 = wz(L.at[1]);
      const g = new THREE.Group(); g.position.set(wx0, 0, wz0); g.rotation.y = Math.atan2(dx, dz);   // local +z points out of the wall
      const plate = cyl(.05, .05, .012, blk, 0, 0, 0, 24); plate.rotation.x = Math.PI/2; plate.position.set(0, L.h, .006);
      if (L.style === 'spot'){                                       // small black swivel spot aimed down and out
        const head = cyl(.03, .03, .11, blk, 0, 0, 0, 20); head.rotation.x = Math.PI/2 + .6; head.position.set(0, L.h - .03, .09);
        g.add(plate, rod([0, L.h, .01], [0, L.h - .02, .07], .006, blk), head); dark(g, true);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(.024, 16), glow()); lens.position.set(wx0 + dx*.13, L.h - .07, wz0 + dz*.13); lens.lookAt(wx0 + dx*.5, L.h - .5, wz0 + dz*.5); lit(lens, true);
        pl(wx0 + dx*.2, L.h - .1, wz0 + dz*.2, 2.5);
        return;
      }
      g.add(plate, rod([0, L.h, .01], [0, L.h, .13], .006, blk), lathe([[.035, 0], [.07, .1]], mat('#efe8dc', {roughness:.7, side:THREE.DoubleSide}), 0, L.h - .03, .15, 28));
      dark(g, true);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(.06, 24), glow()); disc.rotation.x = -Math.PI/2; disc.position.set(wx0 + dx*.15, L.h + .06, wz0 + dz*.15); lit(disc, true);
      pl(wx0 + dx*.2, L.h + .1, wz0 + dz*.2, 3);
    } else if (L.k === 'led'){
      for (let i = 0; i + 1 < L.pts.length; i++){
        const [x0, y0] = L.pts[i], [x1, y1] = L.pts[i + 1], hz = Math.abs(x1 - x0) >= Math.abs(y1 - y0), len = M(Math.hypot(x1 - x0, y1 - y0));
        const s = new THREE.Mesh(new THREE.BoxGeometry(hz ? len : .02, .015, hz ? .02 : len), glow());
        s.position.set(wx((x0 + x1)/2), H - .012, wz((y0 + y1)/2)); lit(s, ceil);
      }
    }
  });
}

