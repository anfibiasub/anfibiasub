// Relitto: vecchio cargo in legno e ferro, inclinato sul fondale.
// Geometria generata via codice (costole, fasciame, ponte, cabina, ancora, catena, botola, camera nascosta).
import * as THREE from '../vendor/three/three.module.min.js';
import { mergeGeometries } from '../vendor/three/BufferGeometryUtils.js';
import { noise2, rng } from './noise.js?v=fa0fbacd';
import { heightAt } from './world.js?v=fa0fbacd';
import { dialTex, symbolPlate, logbookTex } from './textures.js?v=fa0fbacd';
import { CFG } from './config.js?v=fa0fbacd';

const rand = rng(31);
const R = (a, b) => a + (b - a) * rand();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- forma dello scafo (coordinate locali: x prua+, y su, z traverso) ----
const XS = -12, XB = 13.2;
const keelY = (x) => (x > 8.5 ? (x - 8.5) ** 2 * 0.2 : x < -10 ? (-10 - x) ** 2 * 0.25 : 0);
const deckY = (x) => 4.2 + 0.0045 * x * x;
const beam = (x) => Math.max(0.06, 3.3 * (x > 0 ? 1 - Math.pow(Math.min(1, x / XB), 2.2) : 1 - Math.pow(-x / 15, 3)));
const halfW = (x, h) => beam(x) * Math.pow(clamp((h - keelY(x)) / (deckY(x) - keelY(x)), 0, 1), 0.42);
const hullPt = (x, v, s) => { const h = keelY(x) + v * (deckY(x) - keelY(x)); return new THREE.Vector3(x, h, s * halfW(x, h)); };

export const HATCH = { x: 4.2, size: 1.2, r: 0.78 };
const CABIN = { x0: -11, x1: -7.6, z: 1.7, h: 2.2 };
const COLLAPSE = [1e9, 1e9];   // niente più ponte crollato: il ponte è integro
// lato alto (dopo lo sbandamento) = z negativo: lì lo scafo è squarciato
// lo scafo è integro: l'unico accesso all'interno è la botola (scopo della prima parte del gioco)
const breach = () => false;

function boxBetween(a, b, w, t, up, extra) {
  // box allungato da a a b, con l'asse "w" lungo up
  const tl = new THREE.Vector3().subVectors(b, a); const len = tl.length(); tl.normalize();
  const n = new THREE.Vector3().crossVectors(tl, up).normalize();
  const tv = new THREE.Vector3().crossVectors(n, tl).normalize();
  const g = new THREE.BoxGeometry(len + 0.04, w, t);
  const m = new THREE.Matrix4().makeBasis(tl, tv, n);
  if (extra) m.premultiply(extra);
  m.setPosition(new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5));
  g.applyMatrix4(m);
  return g;
}

export function buildWreck(scene, tex) {
  const ship = new THREE.Group();
  ship.rotation.order = 'YXZ';
  const S = CFG.shipScale;          // il cargo è costruito in unità "locali" e poi ingrandito
  ship.rotation.set(0.19, 0.42, -0.035);
  ship.scale.setScalar(S);
  ship.position.set(0, heightAt(0, 0) - 1.25 * S, 0);
  scene.add(ship);
  ship.updateMatrixWorld(true);

  const rust = new THREE.MeshStandardMaterial({ map: tex.rust.map, normalMap: tex.rust.normalMap, roughnessMap: tex.rust.orm, metalnessMap: tex.rust.orm, roughness: 1, metalness: 1 });
  const wood = new THREE.MeshStandardMaterial({ map: tex.wood.map, normalMap: tex.wood.normalMap, normalScale: new THREE.Vector2(1.3, 1.3), roughness: 0.95, metalness: 0 });
  const brass = new THREE.MeshStandardMaterial({ map: tex.brass.map, roughnessMap: tex.brass.orm, metalnessMap: tex.brass.orm, roughness: 1, metalness: 1, envMapIntensity: 1.2 });
  const woodG = [], rustG = [];

  // ---- costole metalliche ----
  for (let x = XS + 0.4; x < XB - 0.5; x += 1.05) {
    for (const s of [-1, 1]) {
      let top = 1;
      if (s === -1 && (breach(x, 0.6) || breach(x, 0.85)) && rand() < 0.55) top = R(0.35, 0.8);   // costola spezzata
      const pts = [];
      for (let k = 0; k <= 12; k++) { const v = (k / 12) * top; pts.push(hullPt(x, v, s * 0.985)); }
      if (top < 1) { const last = pts[pts.length - 1].clone(); last.z += s * 0.25; last.y -= 0.3; pts.push(last); }
      rustG.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.075, 5, false));
    }
  }
  // chiglia
  { const kp = []; for (let x = XS + 0.2; x <= 11.2; x += 0.5) kp.push(new THREE.Vector3(x, keelY(x) + 0.05, 0));
    rustG.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(kp), 60, 0.24, 6)); }
  // dritto di prua
  { const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; const x = 11 + t * 2.4; pts.push(new THREE.Vector3(x, keelY(Math.min(x, XB)) + t * 1.2, 0)); }
    pts.push(new THREE.Vector3(13.6, deckY(13) + 0.4, 0)); rustG.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.16, 6)); }

  // ---- fasciame (legno) e lamiere (ferro verso prua) ----
  const rows = 10;
  for (const s of [-1, 1]) for (let j = 0; j < rows; j++) {
    const v = (j + 0.5) / rows;
    const off = j % 2 ? 1.0 : 0;
    for (let xa = off ? XS : XS + off; xa < XB - 0.4; xa = (xa === XS && off) ? XS + off : xa + 2) {
      const xb = (xa === XS && off) ? XS + off : Math.min(xa + 2, XB - 0.35);   // fila sfalsata: tavola corta a poppa, così lo scafo è chiuso
      const xm = (xa + xb) / 2;
      if (s === -1 && breach(xm, v)) continue;
      const a = hullPt(xa, v, s), b = hullPt(xb, v, s);
      const up = hullPt(xm, Math.min(1, v + 0.02), s).sub(hullPt(xm, Math.max(0, v - 0.02), s)).normalize();
      const w = (deckY(xm) - keelY(xm)) / rows * 1.05;
      let extra = null;
      if (s === -1 && rand() < 0.12) {           // tavola staccata che pende
        extra = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), R(-0.25, 0.25));
      }
      const iron = xm > 8.6 && v < 0.7;
      (iron ? rustG : woodG).push(boxBetween(a, b, w, iron ? 0.05 : 0.08, up, extra));
    }
  }

  // ---- specchio di poppa (chiude lo scafo a poppa) ----
  {
    const sh = new THREE.Shape();
    for (let k = 0; k <= 16; k++) { const p = hullPt(XS, k / 16, 1); k ? sh.lineTo(p.z, p.y) : sh.moveTo(p.z, p.y); }
    for (let k = 16; k >= 0; k--) { const p = hullPt(XS, k / 16, -1); sh.lineTo(p.z, p.y); }
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false });
    g.rotateY(-Math.PI / 2); g.translate(XS + 0.02, 0, 0);
    woodG.push(g);
  }
  // ---- trincarino: tavola lungo il bordo del ponte, niente fessure tra ponte e murata ----
  for (const s of [-1, 1]) for (let xa = XS + 0.1; xa < XB - 0.6; xa += 1) {
    const xb = Math.min(xa + 1, XB - 0.5);
    const pa = new THREE.Vector3(xa, deckY(xa) + 0.03, s * (halfW(xa, deckY(xa)) - 0.18));
    const pb = new THREE.Vector3(xb, deckY(xb) + 0.03, s * (halfW(xb, deckY(xb)) - 0.18));
    woodG.push(boxBetween(pa, pb, 0.4, 0.08, new THREE.Vector3(0, 0, 1)));
  }

  // ---- ponte: bagli in ferro e tavolato deformato ----
  for (let x = XS + 0.9; x < XB - 1.5; x += 1.05) {
    const H = deckY(x), bw = halfW(x, H) * 0.97;
    if (Math.abs(x - HATCH.x) < HATCH.size + 0.15) continue;   // nessun baglio sopra la camera nascosta
    if (x > COLLAPSE[0] && x < COLLAPSE[1]) {
      if (rand() < 0.5) rustG.push(boxBetween(new THREE.Vector3(x, H - 0.15, -bw), new THREE.Vector3(x + R(-0.3, 0.3), H - R(0.8, 1.6), R(-0.5, 0.5)), 0.16, 0.12, new THREE.Vector3(1, 0, 0)));
      continue;
    }
    rustG.push(boxBetween(new THREE.Vector3(x, H - 0.14, -bw), new THREE.Vector3(x, H - 0.14, bw), 0.18, 0.13, new THREE.Vector3(1, 0, 0)));
  }
  const brk = [XS + 0.3, -10.8, -8.8, -6.8, -4.5, -2.2, -0.2, HATCH.x - HATCH.size, HATCH.x + HATCH.size, 7.4, 9.4, 11.4];
  for (let zr = -3.2; zr <= 3.2; zr += 0.32) {
    for (let i = 0; i < brk.length - 1; i++) {
      const xa = brk[i], xb = brk[i + 1], xm = (xa + xb) / 2;
      if (xm > COLLAPSE[0] && xm < COLLAPSE[1]) {
        if (rand() < 0.12 && Math.abs(zr) < 2.4) {  // qualche tavola spezzata che penzola nel crollo
          const ya = deckY(xa) - 0.02;
          woodG.push(boxBetween(new THREE.Vector3(xa, ya, zr), new THREE.Vector3(xa + R(0.6, 1.4), ya - R(0.6, 1.4), zr + R(-0.3, 0.3)), 0.28, 0.06, new THREE.Vector3(0, 0, 1)));
        }
        continue;
      }
      if (Math.abs(zr) < HATCH.size && xm > HATCH.x - HATCH.size && xm < HATCH.x + HATCH.size) continue;
      const lim = Math.min(halfW(xa, deckY(xa)), halfW(xb, deckY(xb))) - 0.12;
      if (Math.abs(zr) > lim) continue;
      const def = (x) => deckY(x) + 0.05 * Math.sin(x * 0.8 + zr * 2) + 0.02;
      woodG.push(boxBetween(new THREE.Vector3(xa, def(xa), zr), new THREE.Vector3(xb, def(xb), zr), 0.3, 0.06, new THREE.Vector3(0, 0, 1)));
    }
  }

  // ---- murate: candelieri e corrimano spezzato ----
  for (const s of [-1, 1]) {
    let prev = null;
    for (let x = -10.5; x < 11.5; x += 1.5) {
      const H = deckY(x), z = s * (halfW(x, H) - 0.05);
      if (s === -1 && x > -6 && x < 1 && rand() < 0.6) { prev = null; continue; }
      const top = new THREE.Vector3(x, H + 0.9, z);
      rustG.push(boxBetween(new THREE.Vector3(x, H, z), top, 0.05, 0.05, new THREE.Vector3(0, 0, 1)));
      if (prev && rand() < 0.8) rustG.push(new THREE.TubeGeometry(new THREE.LineCurve3(prev, top), 1, 0.03, 5));
      prev = top;
    }
  }

  // ---- cabina di poppa in rovina ----
  {
    const H = deckY(-9), { x0, x1, z, h } = CABIN;
    const wall = (a, b, wh, y0 = 0) => woodG.push(boxBetween(new THREE.Vector3(a[0], H + y0 + wh / 2, a[1]), new THREE.Vector3(b[0], H + y0 + wh / 2, b[1]), wh, 0.1, new THREE.Vector3(0, 1, 0)));
    // cabina chiusa: pareti piene, porta sbarrata (nessuna apertura sull'interno)
    wall([x1, -z], [x1, z], h);
    wall([x0, -z], [x0, z], h);
    wall([x0, z], [x1, z], h);
    wall([x0, -z], [x1, -z], h);
    // porta sbarrata: battente in ferro arrugginito appoggiato sulla parete
    rustG.push(new THREE.BoxGeometry(1.0, 1.6, 0.06).translate(x0 + 1.9, H + 0.8, -z - 0.08));
    for (const yy of [0.5, 1.2]) rustG.push(new THREE.BoxGeometry(1.25, 0.1, 0.08).translate(x0 + 1.9, H + yy, -z - 0.13));
    // tetto crollato a metà
    for (let k = 0; k < 7; k++) {
      const zz = -z + 0.25 + k * 0.5;
      if (k > 3) woodG.push(boxBetween(new THREE.Vector3(x0, H + h, zz), new THREE.Vector3(x1, H + h - (k - 3) * 0.25, zz), 0.46, 0.07, new THREE.Vector3(0, 0, 1)));
      else woodG.push(boxBetween(new THREE.Vector3(x0, H + h, zz), new THREE.Vector3(x1, H + h, zz), 0.46, 0.07, new THREE.Vector3(0, 0, 1)));
    }
  }

  // ---- albero spezzato, verricello, bitte ----
  {
    const H = deckY(1);
    rustG.push(new THREE.CylinderGeometry(0.2, 0.24, 1.6, 10).translate(1, H + 0.8, 0.4));
    const H2 = deckY(10.3);
    rustG.push(new THREE.CylinderGeometry(0.32, 0.32, 1.2, 14).rotateX(Math.PI / 2).translate(10.2, H2 + 0.45, 0));
    rustG.push(new THREE.BoxGeometry(0.9, 0.3, 1.6).translate(10.2, H2 + 0.15, 0));
    for (const zz of [-1.3, 1.3]) rustG.push(new THREE.CylinderGeometry(0.13, 0.15, 0.5, 10).translate(11.4, deckY(11.4) + 0.25, zz * 0.6));
  }

  // ---- mastra quadrata con botola circolare ----
  const HY = deckY(HATCH.x);
  {
    const S = HATCH.size, ch = 0.38;
    const side = (a, b) => rustG.push(boxBetween(new THREE.Vector3(...a), new THREE.Vector3(...b), ch, 0.12, new THREE.Vector3(0, 1, 0)));
    const y = HY + ch / 2;
    side([HATCH.x - S, y, -S], [HATCH.x + S, y, -S]); side([HATCH.x - S, y, S], [HATCH.x + S, y, S]);
    side([HATCH.x - S, y, -S], [HATCH.x - S, y, S]); side([HATCH.x + S, y, -S], [HATCH.x + S, y, S]);
    const sh = new THREE.Shape(); sh.moveTo(-S, -S); sh.lineTo(S, -S); sh.lineTo(S, S); sh.lineTo(-S, S); sh.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 0, HATCH.r - 0.06, 0, Math.PI * 2, true); sh.holes.push(hole);
    const top = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: false, curveSegments: 40 });
    top.rotateX(-Math.PI / 2).translate(HATCH.x, HY + ch, 0);
    const uv = top.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.4, uv.getY(i) * 0.4);
    rustG.push(top);
  }

  const woodM = new THREE.Mesh(mergeGeometries(woodG.map((g) => g.index ? g.toNonIndexed() : g)), wood);
  const rustM = new THREE.Mesh(mergeGeometries(rustG.map((g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k); return n; })), rust);
  for (const m of [woodM, rustM]) { m.castShadow = m.receiveShadow = true; ship.add(m); }

  // ---- camera nascosta sotto la botola ----
  const chamber = new THREE.Group(); chamber.name = 'chamber';   // dentro la camera niente caustiche (è sotto il ponte)
  {
    const w = 2.2, h = 2.3, y0 = HY - h;
    const wallM = new THREE.MeshStandardMaterial({ map: tex.wood.map, normalMap: tex.wood.normalMap, roughness: 1, side: THREE.DoubleSide, color: 0x9a8f80 });
    const floorM = new THREE.MeshStandardMaterial({ map: tex.sand.map, normalMap: tex.sand.normalMap, roughness: 1, color: 0xb0a690 });
    const p = (W, H) => new THREE.PlaneGeometry(W, H);
    const fl = new THREE.Mesh(p(w, w).rotateX(-Math.PI / 2), floorM); fl.position.set(HATCH.x, y0, 0);
    chamber.add(fl);
    [[0, w / 2, 0], [0, -w / 2, Math.PI], [w / 2, 0, -Math.PI / 2], [-w / 2, 0, Math.PI / 2]].forEach(([dx, dz, ry]) => {
      const m = new THREE.Mesh(p(w, h), wallM); m.position.set(HATCH.x + dx, y0 + h / 2, dz); m.rotation.y = ry; chamber.add(m);
    });
    // supporto e scafandro
    const k = 1 / S;   // scafandro, supporto e giornale a grandezza reale
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * k, 0.36 * k, 0.75 * k, 16), rust); stand.position.set(HATCH.x + 0.3, y0 + 0.375 * k, -0.25); chamber.add(stand);
    const helmet = makeHelmet(brass); helmet.scale.setScalar(k);
    helmet.position.set(HATCH.x + 0.3, y0 + 0.75 * k, -0.25); helmet.rotation.y = -0.9;
    chamber.add(helmet);
    // giornale di bordo aperto su una cassa, nell'angolo opposto
    const crateB = new THREE.Mesh(new THREE.BoxGeometry(0.7 * k, 0.55 * k, 0.55 * k), wallM); crateB.position.set(HATCH.x - 0.55, y0 + 0.275 * k, 0.55); crateB.rotation.y = 0.3; chamber.add(crateB);
    const book = new THREE.Group(); book.scale.setScalar(k); book.position.set(HATCH.x - 0.55, y0 + 0.555 * k, 0.55); book.rotation.y = 0.3 + Math.PI / 2;
    const cover = new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: 0.9 });
    const pageM = new THREE.MeshStandardMaterial({ map: logbookTex(), roughness: 1 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 0.32), cover); base.position.y = 0.01; book.add(base);
    for (const sx of [-1, 1]) { const pg = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.025, 0.3), [cover, cover, pageM, cover, cover, cover]); pg.position.set(sx * 0.113, 0.03, 0); pg.rotation.z = sx * -0.06; book.add(pg); }
    chamber.add(book);
    // casse e detriti
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(R(0.4, 0.6), R(0.3, 0.5), R(0.4, 0.6)), wallM); c.position.set(HATCH.x + R(-0.8, -0.4), y0 + 0.2, R(-0.7, 0.7)); c.rotation.y = R(0, 2); chamber.add(c); }
    const light = new THREE.PointLight(0xffd59a, 0, 7, 1.6); light.position.set(HATCH.x, y0 + 1.6, 0.2); chamber.add(light);
    chamber.userData = { light, helmet, book, floorY: y0 };
    chamber.visible = false;      // si rende visibile solo all'apertura (prima è chiusa e invisibile)
    ship.add(chamber);
  }

  // ---- botola girevole con meccanismo a tre ghiere ----
  const hatch = new THREE.Group();     // perno sulla cerniera
  const lid = new THREE.Group();
  {
    hatch.position.set(HATCH.x - HATCH.r, HY + 0.46, 0);
    lid.position.set(HATCH.r, 0, 0);
    hatch.add(lid);
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(HATCH.r, HATCH.r, 0.1, 48), rust); disk.castShadow = disk.receiveShadow = true; lid.add(disk);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(HATCH.r - 0.04, 0.035, 8, 48).rotateX(Math.PI / 2), rust); rim.position.y = 0.05; lid.add(rim);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.34), brass); base.position.y = 0.11; lid.add(base);
    const dmat = new THREE.MeshStandardMaterial({ map: dialTex(), metalness: 0.9, roughness: 0.35 });
    const dials = [];
    CFG.dials.forEach((sym, i) => {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.11, 20).rotateZ(Math.PI / 2), [dmat, brass, brass]);
      d.position.set(-0.18 + i * 0.18, 0.2, 0.04); lid.add(d); dials.push(d);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: symbolPlate(sym), metalness: 0.8, roughness: 0.4 }));
      plate.position.set(-0.18 + i * 0.18, 0.172, -0.11); lid.add(plate);
    });
    const latches = [];
    for (let k = 0; k < 3; k++) {
      const a = Math.PI / 2 + k * (Math.PI * 2 / 3);
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.1), rust);
      l.position.set(Math.cos(a) * (HATCH.r - 0.05), 0.04, Math.sin(a) * (HATCH.r - 0.05)); l.rotation.y = -a; lid.add(l);
      latches.push({ m: l, a });
    }
    // cerniera
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 10).rotateX(Math.PI / 2), rust); lid.add(hinge); hinge.position.set(-HATCH.r, 0, 0);
    hatch.userData = { dials, latches, lid };
    ship.add(hatch);
  }

  // ---- ancora e catena (in coordinate mondo) ----
  const toW = (x, y, z) => ship.localToWorld(new THREE.Vector3(x, y, z));
  const hawse = toW(12.2, deckY(12.2) - 0.5, -0.9);
  const fwd = toW(1, 0, 0).sub(toW(0, 0, 0)).normalize();
  const side = toW(0, 0, -1).sub(toW(0, 0, 0)).normalize();
  const anchorPos = hawse.clone().addScaledVector(fwd, 6.5 * S).addScaledVector(side, 2.2 * S);
  anchorPos.y = heightAt(anchorPos.x, anchorPos.z) + 0.2;
  const anchor = makeAnchor(rust); anchor.scale.setScalar(1.5);
  anchor.position.copy(anchorPos); anchor.rotation.order = 'YXZ'; anchor.rotation.set(Math.PI / 2 - 0.15, Math.atan2(fwd.x, fwd.z) + 0.8, 0);
  anchor.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  scene.add(anchor);
  const mid1 = hawse.clone().addScaledVector(fwd, 2.4 * S).addScaledVector(side, 0.6 * S); mid1.y = heightAt(mid1.x, mid1.z) + 0.1;
  const mid2 = hawse.clone().addScaledVector(fwd, 4.2 * S).addScaledVector(side, 2.6 * S); mid2.y = heightAt(mid2.x, mid2.z) + 0.1;
  const ring = anchorPos.clone().addScaledVector(fwd, -1.8).addScaledVector(side, 0.6); ring.y = heightAt(ring.x, ring.z) + 0.12;
  const chainCurve = new THREE.CatmullRomCurve3([hawse, hawse.clone().lerp(mid1, 0.5).setY((hawse.y + mid1.y) / 2 - 0.6), mid1, mid2, ring]);
  {
    const len = chainCurve.getLength(), step = 0.18, n = Math.floor(len / step);
    const lg = new THREE.TorusGeometry(0.105, 0.034, 6, 12).scale(1.35, 1, 1);
    const im = new THREE.InstancedMesh(lg, rust, n);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);
    for (let i = 0; i < n; i++) {
      const t = i / n, p = chainCurve.getPointAt(t), tg = chainCurve.getTangentAt(t);
      Q.setFromUnitVectors(X, tg); Q2.setFromAxisAngle(X, (i % 2) * Math.PI / 2 + 0.3); Q.multiply(Q2);
      M.compose(p, Q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, M);
    }
    im.castShadow = true; scene.add(im);
  }

  // ---- detriti dal lato squarciato: casse, barili, tavole ----
  const debris = [];
  {
    const add = (lx, lz, mk) => {
      const w = toW(lx, 0, lz); w.y = heightAt(w.x, w.z);
      const m = mk(); m.position.set(w.x, w.y + m.userData.h * 0.35, w.z); m.rotation.set(R(-0.3, 0.3), R(0, 6), R(-0.3, 0.3));
      m.castShadow = m.receiveShadow = true; scene.add(m); debris.push(m);
    };
    const crate = () => { const s = R(0.6, 1); const m = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.7, s * 0.8), wood); m.userData.h = s * 0.7; return m; };
    const barrel = () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 16), rust); m.rotation.z = Math.PI / 2; m.userData.h = 0.64; return m; };
    const plank = () => { const m = new THREE.Mesh(new THREE.BoxGeometry(R(1.5, 3), 0.06, 0.3), wood); m.userData.h = 0.1; return m; };
    [[-4, -6.2, crate], [-2.6, -7, crate], [-5.4, -7.6, barrel], [-1, -6.5, plank], [-3.2, -8.4, plank], [0.4, -7.4, barrel], [-6.8, -6, plank], [-8.6, -6.6, crate], [2, -6.8, plank], [-3.8, -9.8, barrel], [6.5, -7.2, plank], [-10.5, -5.2, crate]].forEach(([x, z, f]) => add(x, z, f));
  }

  // ---- albero caduto sul fondale ----
  const mastA = toW(-0.6, deckY(-0.6) + 0.2, -2.6), mastB = mastA.clone().addScaledVector(side, 6 * S).addScaledVector(fwd, -3 * S); mastB.y = heightAt(mastB.x, mastB.z) + 0.3;
  { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.17 * S, 0.22 * S, mastA.distanceTo(mastB), 12), wood); m.position.copy(mastA).lerp(mastB, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), mastB.clone().sub(mastA).normalize()); m.castShadow = true; scene.add(m); }

  // ---------- collisioni ----------
  const inv = new THREE.Matrix4().copy(ship.matrixWorld).invert();
  const lp = new THREE.Vector3();
  const capsules = [{ a: mastA, b: mastB, r: 0.22 * S }, { a: anchorPos.clone().addScaledVector(fwd, -1.2), b: anchorPos.clone().addScaledVector(fwd, 1.8), r: 0.5 }];
  const boxes = [
    { min: new THREE.Vector3(CABIN.x0, deckY(-9), -CABIN.z), max: new THREE.Vector3(CABIN.x1, deckY(-9) + CABIN.h + 0.1, CABIN.z) },

    { min: new THREE.Vector3(9.6, deckY(10), -0.9), max: new THREE.Vector3(10.8, deckY(10) + 0.8, 0.9) },
  ];
  const _c = new THREE.Vector3(), _ab = new THREE.Vector3();
  // mastra della botola: 4 pareti + piano superiore forato; la camera sotto si può visitare quando la botola è aperta
  const HS = HATCH.size, HOLE = HATCH.r - 0.06, Y0 = HY - 2.3, CW = 1.1, TOP = HY + 0.46;
  const coaming = [
    { min: new THREE.Vector3(HATCH.x - HS, HY, -HS), max: new THREE.Vector3(HATCH.x + HS, TOP, -HS + 0.12) },
    { min: new THREE.Vector3(HATCH.x - HS, HY, HS - 0.12), max: new THREE.Vector3(HATCH.x + HS, TOP, HS) },
    { min: new THREE.Vector3(HATCH.x - HS, HY, -HS), max: new THREE.Vector3(HATCH.x - HS + 0.12, TOP, HS) },
    { min: new THREE.Vector3(HATCH.x + HS - 0.12, HY, -HS), max: new THREE.Vector3(HATCH.x + HS, TOP, HS) },
  ];
  const pushBox = (b, r) => {
    if (lp.x > b.min.x - r && lp.x < b.max.x + r && lp.y > b.min.y - r && lp.y < b.max.y + r && lp.z > b.min.z - r && lp.z < b.max.z + r) {
      const d = [lp.x - (b.min.x - r), b.max.x + r - lp.x, lp.y - (b.min.y - r), b.max.y + r - lp.y, lp.z - (b.min.z - r), b.max.z + r - lp.z];
      const k = d.indexOf(Math.min(...d));
      if (k === 0) lp.x = b.min.x - r; else if (k === 1) lp.x = b.max.x + r; else if (k === 2) lp.y = b.min.y - r; else if (k === 3) lp.y = b.max.y + r; else if (k === 4) lp.z = b.min.z - r; else lp.z = b.max.z + r;
    }
  };
  const state = { open: false };
  function collide(p, rw) {
    const r = rw / S;
    lp.copy(p).applyMatrix4(inv);
    const dh = Math.hypot(lp.x - HATCH.x, lp.z);
    // dentro la camera nascosta o nel pozzo della botola aperta: solo le pareti della camera
    if (state.open && lp.y > Y0 - 0.2 && lp.y < TOP + r && ((lp.y < HY - 0.02 && Math.abs(lp.x - HATCH.x) < CW + 0.3 && Math.abs(lp.z) < CW + 0.3) || dh < HOLE)) {
      if (lp.y < HY - 0.02) {
        lp.x = clamp(lp.x, HATCH.x - CW + r, HATCH.x + CW - r); lp.z = clamp(lp.z, -CW + r, CW - r);
        if (lp.y < Y0 + r) lp.y = Y0 + r;
        // dalla camera si esce solo dal pozzo
        if (lp.y > HY - 0.02 - r && dh > HOLE - r) lp.y = HY - 0.02 - r;
      } else if (dh > HOLE - r) { const k = (HOLE - r) / dh; lp.x = HATCH.x + (lp.x - HATCH.x) * k; lp.z *= k; }
      p.copy(lp.applyMatrix4(ship.matrixWorld));
      return;
    }
    let x = lp.x;
    if (x > XS - r && x < XB + 0.6 + r) {
      const xc = clamp(x, XS, XB), y0 = keelY(xc), H = deckY(xc);
      if (lp.y < H + r && lp.y > y0 - 3) {
        const bb = halfW(xc, clamp(lp.y, y0, H)) + r;
        if (Math.abs(lp.z) < bb) {
          const up = H + r - lp.y, sd = bb - Math.abs(lp.z), ends = x > 0 ? XB + 0.6 + r - x : x - (XS - r);
          const m = Math.min(up, sd, ends);
          if (m === up) lp.y = H + r; else if (m === sd) lp.z = Math.sign(lp.z || 1) * bb; else lp.x = x > 0 ? XB + 0.6 + r : XS - r;
        }
      }
    }
    for (const b of boxes) pushBox(b, r);
    for (const b of coaming) pushBox(b, r);
    // piano della mastra: pieno se la botola è chiusa, forato al centro se è aperta
    if (Math.abs(lp.x - HATCH.x) < HS + r && Math.abs(lp.z) < HS + r && lp.y > HY && lp.y < TOP + r && (!state.open || dh > HOLE)) lp.y = TOP + r;
    p.copy(lp.applyMatrix4(ship.matrixWorld));
    for (const c of capsules) {
      _ab.subVectors(c.b, c.a); const t = clamp(_c.subVectors(p, c.a).dot(_ab) / _ab.lengthSq(), 0, 1);
      _c.copy(c.a).addScaledVector(_ab, t); const d = p.distanceTo(_c), rr = c.r + rw;
      if (d < rr && d > 1e-4) p.sub(_c).multiplyScalar(rr / d).add(_c);
    }
  }

  return {
    ship, hatch, chamber, collide, toW, fwd, side, anchorPos, chainCurve, debris, S, state,
    setOpen(v) { state.open = v; },
    hatchWorld: () => toW(HATCH.x, HY + 0.5, 0),
    chamberWorld: () => toW(HATCH.x, Y0 + 0.9, 0),
    bookWorld: () => chamber.userData.book.getWorldPosition(new THREE.Vector3()),
    sternWorld: () => toW(XS + 0.3, 0, 0),
    helmetWorld: () => chamber.userData.helmet.getWorldPosition(new THREE.Vector3()),
    materials: { rust, wood, brass },
    deckY, halfW, HY,
  };
}

// ---- ancora ammiragliato ----
function makeAnchor(mat) {
  const g = new THREE.Group();
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.6, 10), mat); g.add(shank);
  const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.2, 8).rotateZ(Math.PI / 2), mat); stock.position.y = 1.05; stock.rotation.y = Math.PI / 2; g.add(stock);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 16), mat); ring.position.y = 1.45; g.add(ring);
  const arms = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.09, 8, 24, Math.PI * 0.85), mat); arms.rotation.z = Math.PI + Math.PI * 0.075; arms.position.y = -0.3; g.add(arms);
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 4).scale(1, 1, 0.25), mat);
    f.position.set(s * 0.9, -0.05, 0); f.rotation.z = s * -0.5; g.add(f);
  }
  return g;
}

// ---- scafandro da palombaro (tre oblò, griglia frontale, corsaletto bullonato) ----
export function makeHelmet(brass) {
  const g = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({ color: 0x0a1c22, metalness: 0.4, roughness: 0.06, envMapIntensity: 1.5 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.21, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.64), brass); dome.position.y = 0.38; g.add(dome);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.2, 0.09, 36), brass); neck.position.y = 0.3; g.add(neck);
  const nring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.022, 10, 40).rotateX(Math.PI / 2), brass); nring.position.y = 0.27; g.add(nring);
  const pts = [[0.2, 0.26], [0.24, 0.2], [0.31, 0.12], [0.36, 0.05], [0.38, 0.0], [0.37, -0.02]].map(([x, y]) => new THREE.Vector2(x, y));
  const cors = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), brass); g.add(cors);
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), brass); b.position.set(Math.cos(a) * 0.35, 0.03, Math.sin(a) * 0.35); g.add(b); }
  const port = (pos, dir, r) => {
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.24, 10, 32), brass); t.position.copy(pos); t.quaternion.copy(q); g.add(t);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(r, 28), glass); gl.position.copy(pos).addScaledVector(dir.clone().normalize(), -0.01); gl.quaternion.copy(q); g.add(gl);
    return { q, pos };
  };
  const f = port(new THREE.Vector3(0, 0.4, 0.205), new THREE.Vector3(0, 0, 1), 0.085);
  for (let k = -1; k <= 1; k++) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.17, 6), brass); bar.position.set(k * 0.04, 0.4, 0.215); g.add(bar); }
  port(new THREE.Vector3(0.2, 0.4, 0.05), new THREE.Vector3(1, 0, 0.2), 0.06);
  port(new THREE.Vector3(-0.2, 0.4, 0.05), new THREE.Vector3(-1, 0, 0.2), 0.06);
  port(new THREE.Vector3(0, 0.56, 0.13), new THREE.Vector3(0, 0.8, 0.6), 0.045);
  for (const s of [-1, 1]) { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.09, 12).rotateX(Math.PI / 2 - 0.4), brass); v.position.set(s * 0.09, 0.4, -0.2); g.add(v); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
