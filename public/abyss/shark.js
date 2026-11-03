// Squalo guardiano del fossato (oltre il bordo della scarpata).
// Modello 3D costruito per sezioni: corpo affusolato, pinne vere (dorsali, pettorali, pelviche, anale, caudale eterocerca),
// fessure branchiali, occhi; colori a controombreggiatura (dorso grigio-blu, ventre bianco); nuoto ondulato nel vertex shader.
import * as THREE from '../vendor/three/three.module.min.js';
import { mergeGeometries } from '../vendor/three/BufferGeometryUtils.js';
import { CFG, onBridge } from './config.js?v=fa0fbacd';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';
import { heightAt } from './world.js?v=fa0fbacd';

const L = 3.1;                 // lunghezza (m)
const TOP = new THREE.Color(0x3d4c58), BELLY = new THREE.Color(0xe4e8ea), FIN = new THREE.Color(0x34424d);

// profilo: u = 0 coda (attacco della caudale) -> 1 muso. h = mezza altezza, w = mezza larghezza (in metri)
function prof(u) {
  const s = Math.min(1, Math.max(0, u));
  const tailStalk = 0.045, max = 0.27;
  let h;
  if (s < 0.62) { const k = s / 0.62; h = tailStalk + (max - tailStalk) * Math.pow(Math.sin(k * Math.PI / 2), 1.6); }
  else { const k = (s - 0.62) / 0.38; h = max * Math.sqrt(Math.max(0, 1 - Math.pow(k, 2.2))); }
  const w = h * (s > 0.85 ? 0.95 : 0.82);
  const dy = (s > 0.8 ? -(s - 0.8) * 0.12 : 0) + (s < 0.25 ? (0.25 - s) * 0.05 : 0);   // muso un po' basso, peduncolo che sale
  return { h, w, dy };
}

function loftBody() {
  const N = 48, M = 24, pos = [], col = [], idx = [];
  const c = new THREE.Color();
  for (let i = 0; i <= N; i++) {
    const u = i / N, p = prof(u), z = (u - 0.5) * L;
    for (let j = 0; j <= M; j++) {
      const a = (j / M) * Math.PI * 2, sa = Math.sin(a);
      const y = sa * p.h * (sa < 0 ? 0.82 : 1) + p.dy;                   // ventre più piatto
      pos.push(Math.cos(a) * p.w, y, z);
      const t = Math.min(1, Math.max(0, (sa * 0.5 + 0.5 - 0.32) / 0.3));  // linea netta tra dorso e ventre
      c.copy(BELLY).lerp(TOP, t * t * (3 - 2 * t)); col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g.toNonIndexed();
}

// pinna da una sagoma 2D (x avanti/indietro, y altezza), estrusa sottile e smussata
function fin(points, thick, color, place) {
  const sh = new THREE.Shape(); sh.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.length === 4) sh.quadraticCurveTo(p[0], p[1], p[2], p[3]); else sh.lineTo(p[0], p[1]);
  }
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.45, bevelSize: thick * 0.6, bevelSegments: 2, curveSegments: 10 });
  g.translate(0, 0, -thick / 2);
  g.rotateY(-Math.PI / 2);         // la sagoma (x,y) diventa (z,y): verticale, lungo l'asse del corpo
  place(g);
  g.deleteAttribute('uv');
  const n = g.attributes.position.count, cc = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { cc[i * 3] = color.r; cc[i * 3 + 1] = color.g; cc[i * 3 + 2] = color.b; }
  g.setAttribute('color', new THREE.BufferAttribute(cc, 3));
  return g.index ? g.toNonIndexed() : g;
}

function sharkGeometry() {
  const parts = [];
  const body = loftBody(); body.deleteAttribute('uv'); parts.push(body);
  const zAt = (u) => (u - 0.5) * L;
  const darkBelly = FIN.clone().lerp(BELLY, 0.25);
  // prima dorsale: alta, falcata
  parts.push(fin([[0.3, 0], [0.18, 0.3, -0.06, 0.5], [-0.1, 0.48], [-0.06, 0.3, -0.16, 0]], 0.035, FIN, (g) => g.translate(0, prof(0.62).h + prof(0.62).dy - 0.03, zAt(0.6))));
  // seconda dorsale, piccola
  parts.push(fin([[0.08, 0], [0.02, 0.12], [-0.06, 0.1], [-0.08, 0]], 0.02, FIN, (g) => g.translate(0, prof(0.24).h + prof(0.24).dy - 0.01, zAt(0.24))));
  // pinna anale
  parts.push(fin([[0.07, 0], [0.0, -0.11], [-0.07, -0.1], [-0.07, 0]], 0.02, darkBelly, (g) => g.translate(0, -prof(0.22).h * 0.82 + prof(0.22).dy + 0.01, zAt(0.22))));
  // caudale eterocerca: lobo superiore lungo, inferiore corto
  parts.push(fin([[0.06, 0.02], [-0.18, 0.28, -0.52, 0.62], [-0.46, 0.5], [-0.3, 0.2, -0.22, 0.04], [-0.38, -0.2], [-0.4, -0.3], [-0.12, -0.08], [0.06, -0.03]], 0.03, FIN, (g) => g.translate(0, prof(0).dy + 0.01, zAt(0.02))));
  // pettorali e pelviche (orizzontali, inclinate verso il basso)
  for (const s of [-1, 1]) {
    const pec = fin([[0.16, 0], [0.0, -0.04], [-0.32, -0.5, -0.38, -0.56], [-0.3, -0.42], [-0.12, -0.1]], 0.03, FIN, (g) => {
      g.rotateZ(s * (Math.PI / 2 - 0.55));
      g.translate(s * prof(0.7).w * 0.8, -prof(0.7).h * 0.45 + prof(0.7).dy, zAt(0.7));
    });
    parts.push(pec);
    parts.push(fin([[0.06, 0], [-0.1, -0.12], [-0.14, -0.1], [-0.08, 0]], 0.02, FIN, (g) => {
      g.rotateZ(s * (Math.PI / 2 - 0.7)); g.translate(s * prof(0.36).w * 0.6, -prof(0.36).h * 0.65 + prof(0.36).dy, zAt(0.36));
    }));
  }
  // fessure branchiali e occhi
  const dark = new THREE.Color(0x111619);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 5; k++) {
      const u = 0.74 + k * 0.022, p = prof(u);
      const g = new THREE.BoxGeometry(0.008, p.h * 0.75, 0.012); g.translate(s * p.w * 0.97, p.dy - p.h * 0.05, zAt(u));
      g.deleteAttribute('uv');
      const n = g.attributes.position.count, cc = new Float32Array(n * 3).fill(0); for (let i = 0; i < n; i++) { cc[i * 3] = dark.r; cc[i * 3 + 1] = dark.g; cc[i * 3 + 2] = dark.b; }
      g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); parts.push(g.toNonIndexed());
    }
    const pe = prof(0.9), eye = new THREE.SphereGeometry(0.026, 12, 8); eye.translate(s * pe.w * 0.93, pe.dy + pe.h * 0.22, zAt(0.9));
    eye.deleteAttribute('uv');
    const n = eye.attributes.position.count, cc = new Float32Array(n * 3); for (let i = 0; i < n; i++) { cc[i * 3] = 0.02; cc[i * 3 + 1] = 0.02; cc[i * 3 + 2] = 0.025; }
    eye.setAttribute('color', new THREE.BufferAttribute(cc, 3)); parts.push(eye.toNonIndexed());
  }
  // bocca: linea scura sotto il muso
  { const p = prof(0.88); const g = new THREE.TorusGeometry(p.w * 0.75, 0.01, 4, 16, Math.PI); g.rotateX(Math.PI / 2); g.translate(0, p.dy - p.h * 0.6, zAt(0.86)); g.deleteAttribute('uv');
    const n = g.attributes.position.count, cc = new Float32Array(n * 3).fill(0.05); g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); parts.push(g.index ? g.toNonIndexed() : g); }
  for (const p of parts) for (const k of Object.keys(p.attributes)) if (!['position', 'normal', 'color'].includes(k)) p.deleteAttribute(k);
  const g = mergeGeometries(parts);
  g.computeVertexNormals();
  return g;
}

export function buildShark(scene) {
  const time = { value: 0 }, swim = { value: 1 };
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.05, envMapIntensity: 0.6 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = time; sh.uniforms.uSwim = swim;
    sh.vertexShader = 'uniform float uTime; uniform float uSwim;\n' + sh.vertexShader
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float back = clamp((${(L * 0.25).toFixed(2)} - position.z) / ${L.toFixed(2)}, 0., 1.2);   // 0 al muso, ~1 alla coda
        transformed.x += sin(uTime * 2.6 * uSwim - position.z * 2.2) * (0.02 + 0.22 * back * back) * uSwim;`);
  };
  const mesh = new THREE.Mesh(sharkGeometry(), mat);
  mesh.castShadow = true;
  const group = new THREE.Group(); group.add(mesh); scene.add(group);
  // modello vero animato: "Great White Shark" di Mateus Schwaab (Mehrus), Sketchfab, CC BY 4.0.
  // Nel file il muso guarda -z: lo giro (muso verso +z come lo squalo disegnato) e lo centro. Finché non è caricato resta quello disegnato.
  const anim = { mixer: null, swim: null, bite: null, biting: 0 };
  const ready = new GLTFLoader().loadAsync(new URL('./models/shark.gltf?v=1', import.meta.url).href).then((gl) => {
    const inner = new THREE.Group(); inner.rotation.y = Math.PI; inner.scale.setScalar(1.12);
    inner.position.set(-0.26 * 1.12, -0.45 * 1.12, -74.04 * 1.12);
    gl.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    inner.add(gl.scene); group.add(inner); mesh.visible = false;
    anim.mixer = new THREE.AnimationMixer(gl.scene);
    const clip = (n) => gl.animations.find((a) => a.name.endsWith(n));
    anim.swim = anim.mixer.clipAction(clip('|Swim') || gl.animations[0]); anim.swim.play();
    const b = clip('|Bite'); if (b) { anim.bite = anim.mixer.clipAction(b); anim.bite.setLoop(THREE.LoopOnce, 1); anim.bite.clampWhenFinished = false; }
  }).catch(() => {});

  // ---------- comportamento ----------
  // idle: pattuglia lontano nel blu; circle: gira intorno al sub; charge: attacca; flee: scappa; cooldown dopo la fuga.
  const S = { mode: 'idle', t: 0, cool: 0, pos: new THREE.Vector3(0, CFG.seabed - 14, CFG.limit + 20), vel: new THREE.Vector3(1, 0, 0), ang: 0 };
  const tmp = new THREE.Vector3(), des = new THREE.Vector3(), fw = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion();
  const steer = (target, speed, turn, dt) => {
    des.subVectors(target, S.pos); const d = des.length(); if (d > 1e-3) des.multiplyScalar(speed / d);
    S.vel.lerp(des, Math.min(1, dt * turn));
    S.pos.addScaledVector(S.vel, dt);
  };
  function reset() { anim.biting = 0; S.mode = 'idle'; S.t = 0; S.cool = 0; S.pos.set(0, CFG.seabed - 14, CFG.limit + 20); S.vel.set(1, 0, 0); }

  function update(dt, t, player, ev) {
    time.value = t; S.t += dt; if (S.cool > 0) S.cool -= dt;
    if (anim.mixer) { anim.swim.timeScale = 0.6 + swim.value * 0.7; anim.mixer.update(dt); }
    const pr = Math.hypot(player.x, player.z);
    const outside = pr > CFG.cliff && !onBridge(player.x, player.z);
    if (S.mode === 'idle') {
      // pattuglia lenta a cerchio, oltre il bordo e più in basso: una sagoma che si intravede nel blu
      S.ang += dt * 0.045;
      tmp.set(Math.cos(S.ang) * (CFG.limit + 18), CFG.seabed - 16 + Math.sin(t * 0.2) * 3, Math.sin(S.ang) * (CFG.limit + 18));
      steer(tmp, 2.2, 0.6, dt); swim.value = 0.8;
      if (outside && S.cool <= 0) {   // il sub ha superato il confine: arriva
        S.mode = 'circle'; S.t = 0;
        const out = tmp.set(player.x, 0, player.z).normalize();
        S.pos.set(player.x + out.x * 22, player.y - 6, player.z + out.z * 22);
        S.vel.set(-out.x, 0.1, -out.z).multiplyScalar(3);
        ev.warn();
      }
    } else if (S.mode === 'circle') {
      // si avvicina e ondeggia DAVANTI al sub (sempre nel campo visivo), sempre più vicino, poi attacca
      fw.set(ev.dir ? ev.dir.x : 0, 0, ev.dir ? ev.dir.z : -1); if (fw.lengthSq() < 1e-4) fw.set(0, 0, -1); fw.normalize();
      const r = Math.max(7, 13 - S.t * 0.9), a = Math.atan2(fw.z, fw.x) + Math.sin(S.t * 0.8) * 0.75;
      tmp.set(player.x + Math.cos(a) * r, player.y - 0.4 + Math.sin(S.t) * 0.8, player.z + Math.sin(a) * r);
      steer(tmp, 5, 1.3, dt); swim.value = 1.2;
      if (!outside && pr < CFG.cliff - 3) { S.mode = 'leave'; S.t = 0; }
      else if (S.t > 6.5) { S.mode = 'charge'; S.t = 0; S.go = false; anim.biting = 0; ev.charge(); }
    } else if (S.mode === 'charge') {
      // attacco sempre frontale: se non è davanti al sub, prima si porta davanti, poi carica dritto verso di lui
      fw.set(ev.dir ? ev.dir.x : 0, 0, ev.dir ? ev.dir.z : -1); if (fw.lengthSq() < 1e-4) fw.set(0, 0, -1); fw.normalize();
      tmp.set(S.pos.x - player.x, 0, S.pos.z - player.z); const dh = tmp.length(); const front = dh > 1e-3 ? tmp.multiplyScalar(1 / dh).dot(fw) : 1;
      if (S.go && front < 0.45) S.go = false;                         // il sub si è girato: torna davanti
      if (!S.go && front > 0.8) S.go = true;
      if (S.go) { steer(player, 6.2, 2.4, dt); swim.value = 1.9; }
      else { des.set(player.x + fw.x * 10, player.y - 0.3, player.z + fw.z * 10); steer(des, 8, 2, dt); swim.value = 1.9; }
      if (S.go && anim.bite && S.pos.distanceTo(player) < 4 && !anim.biting) { anim.biting = 1; anim.bite.reset().play(); }
      if (S.go && front > 0.3 && S.pos.distanceTo(player) < 1.25) { S.mode = 'leave'; S.t = 0; anim.biting = 0; ev.hit(); }
      else if (!outside && pr < CFG.cliff - 6 && S.t > 2) { S.mode = 'leave'; S.t = 0; }
    } else if (S.mode === 'flee' || S.mode === 'leave') {
      const out = tmp.set(S.pos.x, 0, S.pos.z).normalize();
      des.set(S.pos.x + out.x * 60, CFG.seabed - 20, S.pos.z + out.z * 60);
      steer(des, S.mode === 'flee' ? 8 : 3.5, 1.6, dt); swim.value = S.mode === 'flee' ? 2.2 : 1;
      if (S.t > (S.mode === 'flee' ? 7 : 10)) { S.mode = 'idle'; S.t = 0; S.ang = Math.atan2(S.pos.z, S.pos.x); }
    }
    // orientamento: il muso (+z) nella direzione del moto, con un leggero rollio nelle virate
    if (S.vel.lengthSq() > 1e-4) {
      M4.lookAt(S.pos, tmp.copy(S.pos).sub(S.vel), up); Q.setFromRotationMatrix(M4);
      group.quaternion.slerp(Q, Math.min(1, dt * 4));
    }
    group.position.copy(S.pos);
  }

  // getto d'aria dalla bombola: se lo squalo è davanti e vicino, scappa e non torna per 2 minuti
  function blast(player, dir) {
    if (S.mode !== 'circle' && S.mode !== 'charge') return false;
    tmp.subVectors(S.pos, player); const d = tmp.length();
    if (d < 10 && tmp.normalize().dot(dir) > 0.35) { S.mode = 'flee'; S.t = 0; S.cool = 120; S.vel.copy(tmp).multiplyScalar(6); return true; }
    return false;
  }
  // colpito dall'arpione: scappa come col getto d'aria (anche se è solo di passaggio)
  function scare() {
    if (S.mode === 'flee') return false;
    tmp.set(S.pos.x, 0, S.pos.z).normalize(); S.mode = 'flee'; S.t = 0; S.cool = 120; S.vel.copy(tmp).multiplyScalar(7); return true;
  }
  return { group, update, blast, scare, reset, state: S, ready };
}

// ---------------- squaletto (1/3 del grande): gira per la mappa e attacca a intervalli di 2, 4, 2, 4... minuti ----------------
// Arriva sempre da davanti. Col getto d'aria (o l'arpione) scappa; se morde non uccide: toglie 20 bar.
export function buildBabyShark(scene) {
  const group = new THREE.Group(); scene.add(group);
  const anim = { mixer: null, swim: null, bite: null };
  const SC = 1.12 / 3;
  const ready = new GLTFLoader().loadAsync(new URL('./models/shark.gltf?v=1', import.meta.url).href).then((gl) => {
    const inner = new THREE.Group(); inner.rotation.y = Math.PI; inner.scale.setScalar(SC);
    inner.position.set(-0.26 * SC, -0.45 * SC, -74.04 * SC);
    gl.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    inner.add(gl.scene); group.add(inner);
    anim.mixer = new THREE.AnimationMixer(gl.scene);
    const clip = (n) => gl.animations.find((a) => a.name.endsWith(n));
    anim.swim = anim.mixer.clipAction(clip('|Swim') || gl.animations[0]); anim.swim.play();
    const b = clip('|Bite'); if (b) { anim.bite = anim.mixer.clipAction(b); anim.bite.setLoop(THREE.LoopOnce, 1); }
  }).catch(() => {});

  const GAPS = [120, 240];   // secondi tra un attacco e l'altro: 2 minuti, poi 4, poi 2...
  const S = { mode: 'roam', t: 0, wait: GAPS[0], n: 0, go: false, biting: 0, pos: new THREE.Vector3(-20, CFG.seabed + 4, -10), vel: new THREE.Vector3(1, 0, 0), wp: new THREE.Vector3() };
  const tmp = new THREE.Vector3(), des = new THREE.Vector3(), fw = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion();
  const steer = (target, speed, turn, dt) => {
    des.subVectors(target, S.pos); const d = des.length(); if (d > 1e-3) des.multiplyScalar(speed / d);
    S.vel.lerp(des, Math.min(1, dt * turn)); S.pos.addScaledVector(S.vel, dt);
  };
  const newWp = () => { const a = Math.random() * 6.28, r = 15 + Math.random() * 45; S.wp.set(Math.cos(a) * r, CFG.seabed + 2.5 + Math.random() * 5, Math.sin(a) * r); };
  newWp();
  const next = () => { S.n++; S.wait = GAPS[S.n % 2]; S.mode = 'roam'; S.t = 0; S.go = false; S.biting = 0; newWp(); };
  function reset() { S.n = 0; S.wait = GAPS[0]; S.mode = 'roam'; S.t = 0; S.pos.set(-20, CFG.seabed + 4, -10); newWp(); }

  function update(dt, t, player, ev) {
    if (anim.mixer) { anim.swim.timeScale = S.mode === 'roam' ? 0.9 : 1.8; anim.mixer.update(dt); }
    S.t += dt;
    fw.set(ev.dir ? ev.dir.x : 0, 0, ev.dir ? ev.dir.z : -1); if (fw.lengthSq() < 1e-4) fw.set(0, 0, -1); fw.normalize();
    if (S.mode === 'roam' || S.mode === 'leave') {
      if (S.pos.distanceTo(S.wp) < 3) newWp();
      steer(S.wp, S.mode === 'leave' ? 4 : 1.6, 0.8, dt);
      if (S.mode === 'leave' && S.t > 6) { S.mode = 'roam'; S.t = 0; }
      if (ev.active) S.wait -= dt;
      if (S.mode === 'roam' && ev.active && S.wait <= 0) { S.mode = 'come'; S.t = 0; ev.warn(); }
    } else if (S.mode === 'come') {
      // arriva e si mette davanti al sub, a qualche metro
      des.set(player.x + fw.x * 6, player.y - 0.3, player.z + fw.z * 6);
      const dd = S.pos.distanceTo(des);
      steer(des, Math.min(6, 1 + dd * 1.2), 2.2, dt);
      if (dd < 3 || S.t > 12) { S.mode = 'charge'; S.t = 0; S.go = false; }
    } else if (S.mode === 'charge') {
      tmp.set(S.pos.x - player.x, 0, S.pos.z - player.z); const dh = tmp.length(); const front = dh > 1e-3 ? tmp.multiplyScalar(1 / dh).dot(fw) : 1;
      if (S.go && front < 0.45) S.go = false;
      if (!S.go && front > 0.8) S.go = true;
      if (S.go) steer(player, 4.5, 2.6, dt); else { des.set(player.x + fw.x * 5, player.y - 0.2, player.z + fw.z * 5); steer(des, 6, 2, dt); }
      if (S.go && anim.bite && !S.biting && S.pos.distanceTo(player) < 2.5) { S.biting = 1; anim.bite.reset().play(); }
      if (S.go && front > 0.3 && S.pos.distanceTo(player) < 0.8) { ev.bite(); next(); S.mode = 'leave'; }
      if (!ev.active) next();
    }
    S.pos.y = Math.max(S.pos.y, heightAt(S.pos.x, S.pos.z) + 0.8);
    const r = Math.hypot(S.pos.x, S.pos.z); if (r > CFG.cliff - 4) { S.pos.x *= (CFG.cliff - 4) / r; S.pos.z *= (CFG.cliff - 4) / r; }
    if (S.vel.lengthSq() > 1e-4) { M4.lookAt(S.pos, tmp.copy(S.pos).sub(S.vel), up); Q.setFromRotationMatrix(M4); group.quaternion.slerp(Q, Math.min(1, dt * 5)); }
    group.position.copy(S.pos);
  }
  const attacking = () => S.mode === 'come' || S.mode === 'charge';
  // getto d'aria: se è davanti e vicino scappa, e il prossimo attacco arriva dopo il solito intervallo
  function blast(player, dir) {
    if (!attacking()) return false;
    tmp.subVectors(S.pos, player); const d = tmp.length();
    if (d < 8 && tmp.normalize().dot(dir) > 0.35) { next(); S.mode = 'leave'; S.vel.copy(tmp).multiplyScalar(5); return true; }
    return false;
  }
  function scare() { if (!attacking()) return false; next(); S.mode = 'leave'; return true; }
  return { group, update, blast, scare, reset, state: S, ready };
}
