// Collisioni con la forma vera degli oggetti: ogni mesh fissa o mobile del mondo diventa solida.
// Per ogni geometria si costruisce una volta un albero di volumi (BVH); a ogni fotogramma si cerca il punto
// della superficie più vicino al sub e, se è più vicino del raggio del sub, lo si spinge fuori.
import * as THREE from '../vendor/three/three.module.min.js';
import { MeshBVH } from '../vendor/three/three-mesh-bvh.module.min.js';

const _inv = new THREE.Matrix4(), _m = new THREE.Matrix4(), _lp = new THREE.Vector3(), _cp = new THREE.Vector3(), _d = new THREE.Vector3(), _c = new THREE.Vector3();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion();
const hit = { point: new THREE.Vector3(), distance: 0, faceIndex: 0 };

// geometria per le collisioni: posizioni in float (i modelli compressi usano interi normalizzati), BVH in cache
function bvhOf(g) {
  if (g.userData.bvh !== undefined) return g.userData.bvh;
  let bvh = null;
  try {
    const pa = g.attributes.position;
    if (!pa || pa.count < 3) { g.userData.bvh = null; return null; }
    // copia separata: il BVH riordina vertici e indici, la geometria disegnata non va mai toccata
    const f = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) { f[i * 3] = pa.getX(i); f[i * 3 + 1] = pa.getY(i); f[i * 3 + 2] = pa.getZ(i); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(f, 3));
    if (g.index) cg.setIndex(new THREE.BufferAttribute(g.index.array.slice(), 1));
    bvh = new MeshBVH(cg, { maxLeafSize: 10 });
  } catch (e) { bvh = null; }
  g.userData.bvh = bvh;
  return bvh;
}

const minScale = (m) => { m.decompose(_a, _q, _s); return Math.max(1e-4, Math.min(Math.abs(_s.x), Math.abs(_s.y), Math.abs(_s.z))); };

export function createSolids() {
  const items = [];   // { obj, inst (-1 = mesh normale), bvh, lc (centro locale), lr (raggio locale), wc, wr (solo istanze: fisse) }
  const shapes = [];  // capsule mobili (animali): () => { a, b, r }

  function skip(o) {
    for (let p = o; p; p = p.parent) { if (p.userData && p.userData.noSolid) return true; if (p.isCamera) return true; }
    return false;
  }

  // registra tutto ciò che c'è sotto root (salta ciò che è marcato noSolid, punti, sprite, mesh animate a scheletro, trasparenze)
  function add(root) {
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      if (!o.isMesh || o.isSkinnedMesh || skip(o)) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (mats.every((m) => m && (m.transparent && !m.alphaTest) || (m && m.depthWrite === false))) return;
      const g = o.geometry; if (!g || !g.attributes.position) return;
      if (!g.boundingSphere) g.computeBoundingSphere();
      const bvh = bvhOf(g); if (!bvh) return;
      const lc = g.boundingSphere.center.clone(), lr = g.boundingSphere.radius;
      if (o.isInstancedMesh) {
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, _m); _m.premultiply(o.matrixWorld);
          const wc = lc.clone().applyMatrix4(_m), wr = lr * _m.getMaxScaleOnAxis();
          if (wr > 80) continue;
          items.push({ obj: o, inst: i, bvh, lc, lr, wc, wr, M: _m.clone() });
        }
      } else {
        if (lr * o.matrixWorld.getMaxScaleOnAxis() > 80) return;   // fondale e superficie: hanno già le loro regole
        items.push({ obj: o, inst: -1, bvh, lc, lr });
      }
    });
  }
  function addShape(fn) { shapes.push(fn); }

  const visible = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };

  function pushOut(p, r) {
    let moved = false;
    for (const it of items) {
      let M;
      if (it.inst >= 0) {
        _d.subVectors(p, it.wc); if (_d.lengthSq() > (it.wr + r) ** 2) continue;
        M = it.M;
      } else {
        M = it.obj.matrixWorld;
        _c.copy(it.lc).applyMatrix4(M);
        const wr = it.lr * M.getMaxScaleOnAxis();
        if (p.distanceToSquared(_c) > (wr + r) ** 2) continue;
      }
      if (!visible(it.obj)) continue;
      _inv.copy(M).invert();
      _lp.copy(p).applyMatrix4(_inv);
      const lr = r / minScale(M);
      const h = it.bvh.closestPointToPoint(_lp, hit, 0, lr);
      if (!h) continue;
      _cp.copy(hit.point).applyMatrix4(M);
      _d.subVectors(p, _cp); const dist = _d.length();
      if (dist >= r) continue;
      if (dist < 1e-5) continue;
      p.copy(_cp).addScaledVector(_d, r / dist);
      moved = true;
    }
    for (const fn of shapes) {
      const s = fn(); if (!s) continue;
      _d.subVectors(s.b, s.a); const t = Math.max(0, Math.min(1, _c.subVectors(p, s.a).dot(_d) / Math.max(1e-6, _d.lengthSq())));
      _c.copy(s.a).addScaledVector(_d, t);
      const rr = s.r + r, dd = p.distanceTo(_c);
      if (dd < rr && dd > 1e-4) { p.sub(_c).multiplyScalar(rr / dd).add(_c); moved = true; }
    }
    return moved;
  }

  return {
    add, addShape, items,
    collide(p, r) { if (pushOut(p, r)) pushOut(p, r); },
  };
}
