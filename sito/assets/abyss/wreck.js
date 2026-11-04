// Relitto: vecchio cargo in legno e ferro, inclinato sul fondale.
// Geometria generata via codice (costole, fasciame, ponte, cabina, ancora, catena, botola, camera nascosta).
import * as THREE from '../vendor/three/three.module.min.js';
import { mergeGeometries } from '../vendor/three/BufferGeometryUtils.js';
import { noise2, rng } from './noise.js';
import { heightAt } from './world.js';
import { dialTex, symbolPlate, logbookTex } from './textures.js';
import { CFG } from './config.js';

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
  for (const m of [woodM, rustM]) { m.castShadow = m.receiveShadow = true; m.userData.noSolid = true; ship.add(m); }   // lo scafo ha la sua collisione

  // ---- interno della nave sotto la botola: stiva, corridoio, cabine e la cabina del capitano ----
  // Le stanze sono scatole (coordinate locali) separate da paratie sottili; le porte sono scatole che
  // attraversano le paratie. Ci si muove solo dentro l'unione di stanze e porte.
  const Y0 = HY - 2.3, YC = HY - 0.3, HOLE = HATCH.r - 0.06, RL = CFG.swim.radius / S;
  const box3 = (x0, x1, y0, y1, z0, z1) => ({ min: new THREE.Vector3(x0, y0, z0), max: new THREE.Vector3(x1, y1, z1) });
  const ROOMS = {
    A: [3.2, 5.6, -1.6, 1.6],            // stiva sotto la botola (scafandro)
    C: [-7.2, 3.1, -0.5, 0.5],           // corridoio centrale (crollato a metà)
    P1: [0.7, 3.1, 0.6, 1.6], P2: [-2.6, 0.6, 0.6, 1.6], P3: [-5.0, -2.7, 0.6, 1.6], P4: [-7.2, -5.1, 0.6, 1.6],
    S1: [0.7, 3.1, -1.6, -0.6], S2: [-2.6, 0.6, -1.6, -0.6], S3: [-5.0, -2.7, -1.6, -0.6], S4: [-7.2, -5.1, -1.6, -0.6],
    K1: [-9.6, -7.3, -1.5, 0.1],         // cabina del capitano: ufficio
    K2: [-9.6, -7.3, 0.2, 1.5],          // alcova del capitano: il leggio
  };
  // porte: asse della paratia ('x' = paratia perpendicolare a x), posizione, tratto lungo la paratia, altezza
  const DOORS = [
    ['x', 3.15, -0.5, 0.5, 1.75],
    ['z', 0.55, 1.5, 2.4, 1.6], ['z', -0.55, 1.2, 2.1, 1.6],
    ['z', 0.55, -0.6, 0.3, 1.6], ['z', -0.55, -1.9, -1.0, 1.6],
    ['x', -2.65, 0.85, 1.55, 1.25],      // paratia sfondata tra due cabine
    ['z', 0.55, -4.6, -3.7, 1.6], ['z', -0.55, -4.2, -3.3, 1.6],
    ['z', 0.55, -6.6, -5.7, 1.6], ['z', -0.55, -6.0, -5.2, 1.6],
    ['x', -7.25, -1.5, -0.8, 1.2],       // paratia sfondata verso la cabina del capitano
    ['z', 0.15, -8.2, -7.4, 1.6],        // passaggio verso l'alcova
  ];
  const free = [];
  for (const [k, [x0, x1, z0, z1]] of Object.entries(ROOMS)) {
    if (k === 'C') { free.push(box3(-2.2, x1, Y0, YC, z0, z1), box3(x0, -3.0, Y0, YC, z0, z1)); continue; }   // macerie a metà corridoio
    free.push(box3(x0, x1, Y0, YC, z0, z1));
  }
  const DD = 0.05 + RL + 0.3;
  for (const [ax, at, a0, a1, h] of DOORS) free.push(ax === 'x' ? box3(at - DD, at + DD, Y0, Y0 + h, a0, a1) : box3(a0, a1, Y0, Y0 + h, at - DD, at + DD));
  free.push(box3(HATCH.x - 0.5, HATCH.x + 0.5, Y0, HY + 0.3, -0.5, 0.5));   // pozzo della botola

  const chamber = new THREE.Group(); chamber.name = 'chamber';   // dentro la nave niente caustiche (è sotto il ponte)
  {
    const k = 1 / S;   // oggetti a grandezza reale
    const wallM = new THREE.MeshStandardMaterial({ map: tex.wood.map, normalMap: tex.wood.normalMap, roughness: 1, side: THREE.DoubleSide, color: 0x7d7364, emissive: 0x6a6258, emissiveMap: tex.wood.map, emissiveIntensity: 1.5 });
    const floorM = new THREE.MeshStandardMaterial({ map: tex.sand.map, normalMap: tex.sand.normalMap, roughness: 1, side: THREE.DoubleSide, color: 0x9a907a, emissive: 0x5a5648, emissiveMap: tex.sand.map, emissiveIntensity: 1.4 });
    const wallG = [], floorG = [], furnG = [], ironG = [];
    // parete piana con aperture: u lungo la parete, v in altezza
    const panel = (ax, c, u0, u1, v0, v1, holes, arr) => {
      // aperture rettangolari: la parete è fatta a strisce (piena tra le porte, architrave sopra ogni porta)
      const rect = holes.filter((h) => h.length === 4).map(([h0, h1, , hv1]) => [Math.max(u0, h0), Math.min(u1, h1), hv1]).filter(([a, b]) => b > a).sort((p, q) => p[0] - q[0]);
      if (rect.length) {
        let cur = u0;
        for (const [a, b, top] of rect) {
          if (a > cur + 1e-3) panel(ax, c, cur, a, v0, v1, [], arr);
          if (top < v1 - 1e-3) panel(ax, c, a, b, top, v1, [], arr);
          cur = Math.max(cur, b);
        }
        if (u1 > cur + 1e-3) panel(ax, c, cur, u1, v0, v1, [], arr);
        return;
      }
      const sh = new THREE.Shape(); sh.moveTo(u0, v0); sh.lineTo(u1, v0); sh.lineTo(u1, v1); sh.lineTo(u0, v1); sh.closePath();
      for (const hl of holes) { const p = new THREE.Path(); p.absarc(hl[0], hl[1], hl[2], 0, Math.PI * 2, true); sh.holes.push(p); }
      const g = new THREE.ShapeGeometry(sh, 24);
      const pos = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i), v = pos.getY(i);
        uv.setXY(i, u * 0.55, v * 1.6);
        if (ax === 'x') pos.setXYZ(i, c, v, u); else if (ax === 'z') pos.setXYZ(i, u, v, c); else pos.setXYZ(i, u, c, v);
      }
      g.computeVertexNormals(); arr.push(g);
    };
    const holesOn = (ax, c) => DOORS.filter(([dx, at]) => dx === ax && Math.abs(at - c) < 0.07).map(([, , a0, a1, h]) => [a0, a1, Y0 - 0.01, Y0 + h]);
    for (const [key, [x0, x1, z0, z1]] of Object.entries(ROOMS)) {
      panel('x', x0, z0, z1, Y0, YC, holesOn('x', x0), wallG);
      panel('x', x1, z0, z1, Y0, YC, holesOn('x', x1), wallG);
      panel('z', z0, x0, x1, Y0, YC, holesOn('z', z0), wallG);
      panel('z', z1, x0, x1, Y0, YC, holesOn('z', z1), wallG);
      panel('y', Y0, x0, x1, z0, z1, [], floorG);
      panel('y', YC, x0, x1, z0, z1, key === 'A' ? [[HATCH.x, 0, HOLE + 0.02]] : [], wallG);
    }
    // pavimento sotto le porte (lo spessore della paratia); i lati e l'architrave li fa il telaio
    for (const [ax, at, a0, a1] of DOORS) {
      if (ax === 'x') panel('y', Y0, at - 0.06, at + 0.06, a0, a1, [], floorG); else panel('y', Y0, a0, a1, at - 0.06, at + 0.06, [], floorG);
    }
    // pozzo della botola: tubo dal soffitto della stiva al ponte
    { const t = new THREE.CylinderGeometry(HOLE + 0.02, HOLE + 0.02, HY + 0.08 - YC, 32, 1, true); t.translate(HATCH.x, (YC + HY + 0.08) / 2, 0); wallG.push(t); }
    // mobili e detriti (unità locali)
    const B = (x, y, z, w, h, d, ry = 0, arr = furnG, rz = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry); g.translate(x, y, z); arr.push(g); };
    const crate = (x, z, s, ry, y = Y0) => B(x, y + s * 0.4, z, s, s * 0.8, s * 0.9, ry);
    const barrel = (x, z, lying, ry = 0) => { const g = new THREE.CylinderGeometry(0.2, 0.2, 0.55, 14); if (lying) g.rotateZ(Math.PI / 2); g.rotateY(ry); g.translate(x, Y0 + (lying ? 0.2 : 0.275), z); ironG.push(g); };
    // stiva A: casse
    crate(3.7, 1.2, 0.5, 0.3); crate(3.6, -1.2, 0.45, -0.4); crate(5.2, 1.25, 0.4, 0.8); barrel(5.2, -1.2, false);
    // P1: cuccette dell'equipaggio
    for (const xx of [1.0, 2.0]) { B(xx + 0.4, Y0 + 0.35, 1.3, 0.9, 0.06, 0.55); B(xx + 0.4, Y0 + 1.05, 1.3, 0.9, 0.06, 0.55); B(xx - 0.02, Y0 + 0.75, 1.55, 0.06, 1.5, 0.06); }
    // S1: magazzino
    crate(1.0, -1.25, 0.5, 0.2); crate(1.05, -1.2, 0.38, 0.9, Y0 + 0.4); crate(2.7, -1.2, 0.5, -0.3); barrel(1.9, -1.35, true, 0.2);
    // P2: cambusa con tavolo
    B(-1.2, Y0 + 0.55, 1.1, 1.2, 0.06, 0.6); for (const [dx, dz] of [[-0.5, -0.22], [0.5, -0.22], [-0.5, 0.22], [0.5, 0.22]]) B(-1.2 + dx, Y0 + 0.27, 1.1 + dz, 0.06, 0.55, 0.06);
    barrel(-2.2, 1.3, false); barrel(0.2, 1.35, true, 1.2);
    // S2: vicolo cieco pieno di casse
    crate(-0.2, -1.1, 0.55, 0.1); crate(-1.4, -1.25, 0.5, 0.6); crate(-2.2, -1.1, 0.5, -0.2); crate(-1.4, -1.2, 0.4, 0.2, Y0 + 0.4);
    // P3: amache e cime
    barrel(-3.2, 1.3, true, 0.4); crate(-4.5, 1.2, 0.45, 0.5);
    // S3: barili
    barrel(-3.1, -1.25, false); barrel(-3.5, -1.3, false); barrel(-4.6, -1.0, true, 0.9);
    // P4: pozzo delle catene
    { const g = new THREE.TorusGeometry(0.3, 0.08, 8, 20).rotateX(Math.PI / 2); g.translate(-6.4, Y0 + 0.1, 1.15); ironG.push(g); const g2 = g.clone().translate(0, 0.13, 0); ironG.push(g2); }
    // S4: tavole crollate davanti alla paratia sfondata
    B(-6.9, Y0 + 0.5, -0.75, 1.2, 0.05, 0.25, 0.2, furnG, 0.7); B(-6.6, Y0 + 0.15, -1.2, 1.0, 0.05, 0.25, -0.5, furnG, 0.15); crate(-5.6, -1.25, 0.45, 0.3);
    // corridoio: crollo di travi e casse che blocca il passaggio
    for (let i = 0; i < 6; i++) B(-2.6 + (i % 3 - 1) * 0.22, Y0 + 0.9, -0.3 + i * 0.12, 0.12, 2.3, 0.1, 0, furnG, (i % 2 ? 0.55 : -0.5));
    crate(-2.6, -0.2, 0.55, 0.4); crate(-2.55, 0.25, 0.45, -0.3); crate(-2.6, 0.0, 0.4, 0.8, Y0 + 0.45);
    B(-2.6, Y0 + 1.3, 0, 0.12, 0.12, 1.0, 0, ironG); B(-2.7, Y0 + 1.7, 0.05, 0.14, 0.14, 1.0, 0.3, ironG);
    // fondo del corridoio: porta della cabina sbarrata con assi
    B(-7.15, Y0 + 0.8, 0, 0.05, 1.6, 0.8); for (const yy of [0.4, 0.9, 1.35]) B(-7.08, Y0 + yy, 0, 0.05, 0.12, 1.0, 0, furnG, 0);
    // K1: scrivania, sedia rovesciata, baule
    B(-8.9, Y0 + 0.45, -1.15, 0.9, 0.06, 0.5); B(-8.9, Y0 + 0.22, -1.15, 0.85, 0.44, 0.04); crate(-9.3, -0.3, 0.45, 0.2);
    B(-8.3, Y0 + 0.15, -0.6, 0.3, 0.05, 0.3, 0.6, furnG, 1.2);
    // K2: cuccetta del capitano e scaffale
    B(-8.3, Y0 + 0.3, 1.25, 1.6, 0.25, 0.45); B(-9.55, Y0 + 0.9, 0.85, 0.06, 1.6, 1.2);
    // il leggio con il giornale di bordo, nell'angolo dell'alcova
    const lect = new THREE.Group(); lect.position.set(-9.15, Y0, 0.95); lect.rotation.y = 1.9; lect.scale.setScalar(k);
    { const lw = new THREE.MeshStandardMaterial({ map: tex.wood.map, color: 0x8a6040, roughness: 0.9, emissive: 0x6b4a30, emissiveMap: tex.wood.map, emissiveIntensity: 1.2 });
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.4), lw); foot.position.y = 0.03; lect.add(foot);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.08), lw); post.position.y = 0.55; lect.add(post);
      const top = new THREE.Group(); top.position.y = 1.08; top.rotation.x = 0.38; lect.add(top);
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.42), lw); top.add(board);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.03), lw); lip.position.set(0, 0.03, 0.2); top.add(lip);
      lect.userData.top = top; }
    chamber.add(lect);
    // scafandro nella stiva
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * k, 0.36 * k, 0.75 * k, 16), rust); stand.position.set(HATCH.x + 0.3, Y0 + 0.375 * k, -0.25); chamber.add(stand);
    const helmet = makeHelmet(brass); helmet.scale.setScalar(k);
    helmet.position.set(HATCH.x + 0.3, Y0 + 0.75 * k, -0.25); helmet.rotation.y = -0.9;
    chamber.add(helmet);
    // giornale di bordo aperto sul leggio
    const book = new THREE.Group(); book.position.set(0, 0.015, 0);
    const cover = new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: 0.9 });
    const pageM = new THREE.MeshStandardMaterial({ map: logbookTex(), roughness: 1 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 0.32), cover); base.position.y = 0.01; book.add(base);
    for (const sx of [-1, 1]) { const pg = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.025, 0.3), [cover, cover, pageM, cover, cover, cover]); pg.position.set(sx * 0.113, 0.03, 0); pg.rotation.z = sx * -0.06; book.add(pg); }
    lect.userData.top.add(book);
    const nf = (arr) => arr.map((g) => { const n = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(a)) n.deleteAttribute(a); return n; });
    const mk = (arr, m) => { const me = new THREE.Mesh(mergeGeometries(nf(arr)), m); me.receiveShadow = true; chamber.add(me); return me; };
    mk(wallG, wallM).userData.noSolid = true; mk(floorG, floorM).userData.noSolid = true;   // pareti e pavimenti: collisione a stanze
    mk(furnG, wallM); mk(ironG, rust);   // mobili, casse, barili, crollo: solidi
    // telai metallici chiari intorno a ogni passaggio (si vedono anche al buio) e anta aperta accanto
    const frameG = [], leafG = [];
    for (const [ax, at, a0, a1, h] of DOORS) {
      const broken = h < 1.5, T = 0.09, D = 0.26, yt = Y0 + h;
      const put = (u, v, w, hh, d) => { const g = new THREE.BoxGeometry(ax === 'x' ? d : w, hh, ax === 'x' ? w : d); g.translate(ax === 'x' ? at : u, v, ax === 'x' ? u : at); frameG.push(g); };
      put(a0 - T / 2, Y0 + h / 2, T, h + T, D); put(a1 + T / 2, Y0 + h / 2, T, h + T, D);
      put((a0 + a1) / 2, yt + T / 2, a1 - a0 + 2 * T, T, D);
      put((a0 + a1) / 2, Y0 + 0.02, a1 - a0 - 0.01, 0.03, D - 0.01);
      if (broken) {   // paratia sfondata: schegge di tavole intorno al buco
        for (let i = 0; i < 4; i++) { const g = new THREE.BoxGeometry(ax === 'x' ? 0.04 : 0.1, R(0.25, 0.5), ax === 'x' ? 0.1 : 0.04); g.rotateX(ax === 'x' ? R(-0.6, 0.6) : 0); g.rotateZ(ax === 'z' ? R(-0.6, 0.6) : 0); const u = a0 + (i + 0.5) * (a1 - a0) / 4; g.translate(ax === 'x' ? at : u, yt + 0.12, ax === 'x' ? u : at); leafG.push(g); }
        continue;
      }
      // anta aperta del tutto, appoggiata alla paratia di fianco al passaggio, dentro una stanza (mai nel corridoio)
      const w = a1 - a0, inRoom = (u0, u1, c) => Object.entries(ROOMS).some(([kk, [x0, x1, z0, z1]]) => kk !== 'C' && (ax === 'z' ? (u0 >= x0 && u1 <= x1 && c > z0 && c < z1) : (u0 >= z0 && u1 <= z1 && c > x0 && c < x1)));
      let done = false;
      for (const sd of [1, -1]) for (const [u0, u1] of [[a0 - w - 0.1, a0 - 0.1], [a1 + 0.1, a1 + w + 0.1]]) {
        const c = at + sd * 0.12; if (done || !inRoom(u0, u1, c)) continue;
        const g = new THREE.BoxGeometry(ax === 'z' ? w - 0.04 : 0.04, h - 0.06, ax === 'z' ? 0.04 : w - 0.04);
        g.translate(ax === 'z' ? (u0 + u1) / 2 : c, Y0 + 0.03 + (h - 0.06) / 2, ax === 'z' ? c : (u0 + u1) / 2); leafG.push(g); done = true;
      }
      // maniglia d'ottone sul telaio
      const hd = new THREE.BoxGeometry(0.05, 0.14, 0.05); hd.translate(ax === 'x' ? at : a1 + 0.05, Y0 + 0.9, ax === 'x' ? a1 + 0.05 : at); frameG.push(hd);
    }
    const frameM = new THREE.MeshStandardMaterial({ map: tex.rust.map, normalMap: tex.rust.normalMap, color: 0xd8a368, roughness: 0.7, metalness: 0.3, emissive: 0xa8713a, emissiveMap: tex.rust.map, emissiveIntensity: 1.6 });
    mk(frameG, frameM); mk(leafG, wallM);

    const light = new THREE.PointLight(0xffd59a, 0, 7, 1.6); light.position.set(HATCH.x, Y0 + 1.6, 0.2); chamber.add(light);
    // un filo di luce dall'oblò della cabina del capitano: si intravede il leggio
    const glow = new THREE.PointLight(0x9fd8e6, 0, 4, 1.4); glow.position.set(-8.6, Y0 + 1.6, 0.9); chamber.add(glow);
    chamber.userData = { light, glow, helmet, book, floorY: Y0 };
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
    hatch.userData = { dials, latches, lid, noSolid: true };
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
  const HS = HATCH.size, TOP = HY + 0.46;
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
  const insideLocal = (q) => free.some((b) => q.x > b.min.x - 0.25 && q.x < b.max.x + 0.25 && q.y > b.min.y - 0.25 && q.y < b.max.y + 0.25 && q.z > b.min.z - 0.25 && q.z < b.max.z + 0.25);
  const _q = new THREE.Vector3();
  function collide(p, rw) {
    const r = rw / S;
    lp.copy(p).applyMatrix4(inv);
    const dh = Math.hypot(lp.x - HATCH.x, lp.z);
    // nel pozzo della botola aperta: solo il bordo tondo
    if (state.open && lp.y >= HY - 0.02 && lp.y < TOP + r && dh < HOLE) {
      if (dh > HOLE - r) { const k = (HOLE - r) / dh; lp.x = HATCH.x + (lp.x - HATCH.x) * k; lp.z *= k; }
      p.copy(lp.applyMatrix4(ship.matrixWorld));
      return;
    }
    // dentro la nave: ci si muove solo nell'unione di stanze, porte e pozzo
    if (state.open && insideLocal(lp)) {
      let bx = 0, by = 0, bz = 0, bd = 1e9;
      for (const b of free) {
        const cx = b.max.x - b.min.x > 2 * r ? clamp(lp.x, b.min.x + r, b.max.x - r) : (b.min.x + b.max.x) / 2;
        const cy = b.max.y - b.min.y > 2 * r ? clamp(lp.y, b.min.y + r, b.max.y - r) : (b.min.y + b.max.y) / 2;
        const cz = b.max.z - b.min.z > 2 * r ? clamp(lp.z, b.min.z + r, b.max.z - r) : (b.min.z + b.max.z) / 2;
        const d = (cx - lp.x) ** 2 + (cy - lp.y) ** 2 + (cz - lp.z) ** 2;
        if (d < bd) { bd = d; bx = cx; by = cy; bz = cz; }
      }
      lp.set(bx, by, bz);
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
    inside: (p) => state.open && insideLocal(_q.copy(p).applyMatrix4(inv)),
    hatchWorld: () => toW(HATCH.x, HY + 0.5, 0),
    chamberWorld: () => toW(HATCH.x, HY - 1.4, 0),
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
