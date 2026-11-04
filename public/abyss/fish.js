// Pesci del Mediterraneo: corpo modellato in 3D + "pelle" vista di fianco.
// La pelle è disegnata dal codice; se in CFG.skins c'è un'immagine (PNG trasparente, pesce di profilo
// rivolto a DESTRA, che riempie il riquadro 2:1) viene usata quella, generata con l'IA.
import * as THREE from '../vendor/three/three.module.min.js';
import { mergeGeometries } from '../vendor/three/BufferGeometryUtils.js';
import { heightAt } from './world.js?v=cdb9eab5';
import { rng } from './noise.js?v=cdb9eab5';
import { CFG } from './config.js?v=cdb9eab5';

const rand = rng(77);
const R = (a, b) => a + (b - a) * rand();

// Forma di ogni specie in unità normalizzate: u = 0 punta della coda -> 1 muso; h = mezza altezza del corpo.
// HF = mezza altezza del riquadro (comprende pinne). Tutto è moltiplicato per la lunghezza totale.
const SPECIES = {
  castagnola: {   // Chromis chromis: piccola, scura, coda forcuta
    len: 0.13, wr: 0.36, HF: 0.26, body0: 0.2,
    prof: [[0.2, 0.035], [0.27, 0.05], [0.42, 0.15], [0.6, 0.19], [0.8, 0.16], [0.93, 0.09], [1, 0.03]],
    top: '#1d2a3a', mid: '#3b4a5c', belly: '#6d7c88', fin: '#24364a', tail: 'fork',
  },
  sarago: {       // Diplodus sargus: argento con fasce scure e macchia sulla coda
    len: 0.34, wr: 0.34, HF: 0.27, body0: 0.2,
    prof: [[0.2, 0.04], [0.27, 0.055], [0.42, 0.17], [0.6, 0.21], [0.8, 0.18], [0.93, 0.1], [1, 0.035]],
    top: '#5e6a71', mid: '#949ea3', belly: '#c3cacb', fin: '#8a9399', tail: 'fork', bands: 8, spot: true,
  },
  cernia: {       // Epinephelus marginatus: grossa, bruna, chiazze chiare, bocca grande
    len: 0.95, wr: 0.55, HF: 0.24, body0: 0.17,
    prof: [[0.17, 0.05], [0.25, 0.08], [0.4, 0.16], [0.6, 0.18], [0.8, 0.17], [0.93, 0.13], [1, 0.07]],
    top: '#3a2a20', mid: '#5b4433', belly: '#8a7660', fin: '#3d2c21', tail: 'round', blotch: true,
  },
};

function hb(sp, u) {
  const P = sp.prof;
  if (u <= P[0][0]) return P[0][1];
  for (let i = 1; i < P.length; i++) if (u <= P[i][0]) {
    const t = (u - P[i - 1][0]) / (P[i][0] - P[i - 1][0]), s = t * t * (3 - 2 * t);
    return P[i - 1][1] + (P[i][1] - P[i - 1][1]) * s;
  }
  return P[P.length - 1][1];
}

// ---- pelle disegnata (stessa impaginazione richiesta alle immagini IA) ----
function drawSkin(sp) {
  const W = 512, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const X = (u) => u * W, Y = (y) => H / 2 - (y / sp.HF) * (H / 2);   // y normalizzato sulla lunghezza
  const body = new Path2D();
  body.moveTo(X(sp.body0), Y(0));
  for (let u = sp.body0; u <= 1.0001; u += 0.01) body.lineTo(X(u), Y(hb(sp, u)));
  for (let u = 1; u >= sp.body0 - 0.0001; u -= 0.01) body.lineTo(X(u), Y(-hb(sp, u) * 0.92));
  body.closePath();
  // pinne
  g.fillStyle = sp.fin; g.globalAlpha = 0.92;
  const tail = new Path2D(), h0 = hb(sp, sp.body0);
  if (sp.tail === 'fork') { tail.moveTo(X(sp.body0 + 0.03), Y(h0)); tail.lineTo(X(0.0), Y(sp.HF * 0.86)); tail.lineTo(X(0.09), Y(0)); tail.lineTo(X(0.0), Y(-sp.HF * 0.86)); tail.lineTo(X(sp.body0 + 0.03), Y(-h0)); }
  else { tail.moveTo(X(sp.body0 + 0.03), Y(h0)); tail.quadraticCurveTo(X(-0.04), Y(sp.HF * 0.9), X(0.0), Y(0)); tail.quadraticCurveTo(X(-0.04), Y(-sp.HF * 0.9), X(sp.body0 + 0.03), Y(-h0)); }
  tail.closePath(); g.fill(tail);
  const dors = new Path2D(); dors.moveTo(X(0.36), Y(hb(sp, 0.36) - 0.01));
  for (let u = 0.36; u <= 0.82; u += 0.03) dors.lineTo(X(u), Y(hb(sp, u) + 0.05 + 0.025 * Math.sin(u * 60)));
  dors.lineTo(X(0.84), Y(hb(sp, 0.84) - 0.01)); dors.closePath(); g.fill(dors);
  const anal = new Path2D(); anal.moveTo(X(0.32), Y(-hb(sp, 0.32) * 0.9)); anal.lineTo(X(0.4), Y(-hb(sp, 0.4) - 0.06)); anal.lineTo(X(0.5), Y(-hb(sp, 0.5) * 0.9)); anal.closePath(); g.fill(anal);
  g.globalAlpha = 1;
  // corpo: controombreggiatura (dorso scuro, ventre chiaro)
  g.save(); g.clip(body);
  const gr = g.createLinearGradient(0, Y(0.22), 0, Y(-0.2));
  gr.addColorStop(0, sp.top); gr.addColorStop(0.5, sp.mid); gr.addColorStop(1, sp.belly);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // squame
  g.globalAlpha = 0.12; g.strokeStyle = '#000';
  for (let x = 0; x < W; x += 7) for (let y = (x / 7) % 2 ? 3 : 0; y < H; y += 7) { g.beginPath(); g.arc(x, y, 4, 0.2, Math.PI - 0.2); g.stroke(); }
  g.globalAlpha = 1;
  if (sp.bands) for (let k = 0; k < sp.bands; k++) { const u = 0.36 + k * 0.06; g.fillStyle = k % 2 ? 'rgba(30,35,40,0.45)' : 'rgba(30,35,40,0.25)'; g.fillRect(X(u), 0, W * 0.018, H); }
  if (sp.blotch) for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(210,195,160,${0.15 + rand() * 0.25})`; g.beginPath(); g.ellipse(X(R(0.25, 0.9)), Y(R(-0.12, 0.15)), R(6, 16), R(4, 10), R(0, 3), 0, 7); g.fill(); }
  if (sp.spot) { g.fillStyle = 'rgba(15,15,18,0.85)'; g.beginPath(); g.ellipse(X(0.24), Y(0), 9, 12, 0, 0, 7); g.fill(); }
  // linea laterale
  g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 1.5; g.beginPath(); for (let u = 0.25; u < 0.9; u += 0.02) g.lineTo(X(u), Y(hb(sp, u) * 0.45)); g.stroke();
  g.restore();
  // opercolo e occhio
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; g.beginPath(); g.arc(X(0.86), Y(0), H * 0.16 * (hb(sp, 0.86) / sp.HF) * 2, -1.2, 1.2); g.stroke();
  const er = Math.max(4, H * 0.045 * (sp.len < 0.5 ? 1.4 : 1));
  g.fillStyle = '#c9b98a'; g.beginPath(); g.arc(X(0.93), Y(hb(sp, 0.93) * 0.3), er, 0, 7); g.fill();
  g.fillStyle = '#050505'; g.beginPath(); g.arc(X(0.93), Y(hb(sp, 0.93) * 0.3), er * 0.6, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(X(0.93) - er * 0.3, Y(hb(sp, 0.93) * 0.3) - er * 0.3, er * 0.2, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// ---- geometria: corpo "loft" + piano verticale per pinne e coda, con UV di profilo ----
function fishGeo(sp) {
  const L = sp.len, M = 12, N = 22, pos = [], uv = [], idx = [];
  const v = (y) => 0.5 + y / (2 * sp.HF * L);
  for (let i = 0; i <= N; i++) {
    const u = sp.body0 + (1 - sp.body0) * (i / N);
    const h = hb(sp, u) * L, w = h * sp.wr, z = (u - 0.5) * L;
    for (let j = 0; j <= M; j++) {
      const a = (j / M) * Math.PI * 2;
      const y = Math.sin(a) * h * (Math.sin(a) < 0 ? 0.92 : 1);
      pos.push(Math.cos(a) * w, y, z); uv.push(u, v(y));
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
    const a = i * (M + 1) + j, b = a + M + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  body.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  body.setIndex(idx); body.computeVertexNormals();
  // piano delle pinne (x = 0), copre tutto il riquadro: la trasparenza dell'immagine ritaglia la forma
  const fin = new THREE.BufferGeometry();
  const zh = L / 2, yh = sp.HF * L;
  fin.setAttribute('position', new THREE.Float32BufferAttribute([0, -yh, -zh, 0, -yh, zh, 0, yh, zh, 0, yh, -zh], 3));
  fin.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  fin.setAttribute('normal', new THREE.Float32BufferAttribute([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0], 3));
  fin.setIndex([0, 1, 2, 0, 2, 3]);
  return mergeGeometries([body.toNonIndexed(), fin.toNonIndexed()]);
}

export function buildFish(scene, q) {
  const time = { value: 0 };
  const loader = new THREE.TextureLoader();
  const groups = [];
  const mk = (kind, count, homes, opt) => {
    const sp = SPECIES[kind];
    let map = drawSkin(sp);
    const m = new THREE.MeshStandardMaterial({ map, alphaTest: 0.45, side: THREE.DoubleSide, roughness: kind === 'sarago' ? 0.45 : 0.65, metalness: kind === 'sarago' ? 0.3 : 0.05 });
    if (CFG.skins[kind]) loader.load(CFG.skins[kind], (t) => { t.colorSpace = THREE.SRGBColorSpace; m.map = t; m.needsUpdate = true; });
    const amp = sp.len * opt.wig;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = time;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        `#include <begin_vertex>
         float ph = float(gl_InstanceID) * 1.7;
         float tailw = smoothstep(${(sp.len * 0.25).toFixed(3)}, ${(-sp.len * 0.5).toFixed(3)}, position.z);
         transformed.x += sin(uTime * ${opt.freq.toFixed(2)} + ph + position.z * ${(9 / sp.len).toFixed(2)}) * ${amp.toFixed(4)} * (0.15 + tailw);`);
    };
    const im = new THREE.InstancedMesh(fishGeo(sp), m, count); im.frustumCulled = false; im.castShadow = kind === 'cernia';
    scene.add(im);
    const f = [];
    for (let i = 0; i < count; i++) {
      const h = homes[i % homes.length];
      f.push({ home: h, p: new THREE.Vector3(h.x + R(-3, 3), h.y + R(-1, 1), h.z + R(-3, 3)), v: new THREE.Vector3(R(-1, 1), 0, R(-1, 1)).multiplyScalar(0.3),
        off: new THREE.Vector3(R(-1, 1) * opt.spread, R(-0.4, 0.4) * opt.spread, R(-1, 1) * opt.spread), s: R(0.85, 1.2), ph: R(0, 7), q: new THREE.Quaternion() });
    }
    im.userData.noSolid = true;   // i pesci si scansano da soli (vedi update)
    groups.push({ im, f, opt, len: sp.len });
  };
  const H = (x, z, dy) => new THREE.Vector3(x, heightAt(x, z) + dy, z);
  const P = CFG.places;
  // castagnole: banchi sopra il relitto e sopra gli scogli
  mk('castagnola', q.mobile ? 90 : 170, [H(4, -2, 10), H(-12, 6, 8), H(18, -6, 8), H(P.anfore.x, P.anfore.z, 4), H(P.peschereccio.x, P.peschereccio.z, 5)], { speed: 0.9, spread: 2.8, freq: 14, wig: 0.09, roam: 4 });
  // saraghi: piccoli gruppi vicino al fondo
  mk('sarago', q.mobile ? 14 : 22, [H(22, -10, 1.4), H(-16, 12, 1.2), H(8, 18, 1), H(P.grotta.x + 6, P.grotta.z, 1.2), H(P.anfore.x + 5, P.anfore.z - 4, 1)], { speed: 0.7, spread: 2.2, freq: 9, wig: 0.08, roam: 6 });
  // cernie: una di guardia nella grotta, una sotto lo scafo del cargo
  mk('cernia', 2, [H(P.grotta.x - 1.4, P.grotta.z - 0.4, 0.9), H(-6, 9, 1.0)], { speed: 0.25, spread: 0.6, freq: 4, wig: 0.06, roam: 1.2, shy: true });

  const M = new THREE.Matrix4(), Qt = new THREE.Quaternion(), S = new THREE.Vector3(), tgt = new THREE.Vector3(), des = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), L = new THREE.Matrix4(), aw = new THREE.Vector3();
  const update = function (dt, t, cam) {
    time.value = t;
    for (const gr of groups) {
      const o = gr.opt;
      gr.f.forEach((f, i) => {
        const h = f.home;
        tgt.set(h.x + Math.sin(t * 0.07 + h.z + f.ph * 0.1) * o.roam, h.y + Math.sin(t * 0.13 + h.x) * 0.6, h.z + Math.cos(t * 0.06 + h.x) * o.roam).add(f.off);
        des.subVectors(tgt, f.p).multiplyScalar(0.35);
        const dc = f.p.distanceTo(cam.position), fear = o.shy ? 4 : 3;
        if (dc < fear) des.add(aw.copy(f.p).sub(cam.position).normalize().multiplyScalar((fear - dc) * (o.shy ? 0.8 : 1.6)));
        f.v.lerp(des, Math.min(1, dt * 0.9));
        const sp = f.v.length(), mx = o.speed * (dc < fear ? 2.2 : 1);
        if (sp > mx) f.v.multiplyScalar(mx / sp);
        f.p.addScaledVector(f.v, dt);
        const fl = heightAt(f.p.x, f.p.z) + 0.35; if (f.p.y < fl) f.p.y = fl;
        // nessun pesce attraversa il sub: resta sempre fuori dalla sua sagoma
        { const d = f.p.distanceTo(cam.position), md = 0.55 + gr.len * f.s * 0.5; if (d < md && d > 1e-4) f.p.sub(cam.position).multiplyScalar(md / d).add(cam.position); }
        if (f.v.lengthSq() > 1e-5) { L.lookAt(f.p, tgt.copy(f.p).sub(f.v), up); Qt.setFromRotationMatrix(L); f.q.slerp(Qt, Math.min(1, dt * 4)); }
        S.setScalar(f.s); M.compose(f.p, f.q, S); gr.im.setMatrixAt(i, M);
      });
      gr.im.instanceMatrix.needsUpdate = true;
    }
  };
  update.groups = groups;
  return update;
}
