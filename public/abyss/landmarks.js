// Luoghi dei reperti, lontani dal relitto: grotta, elicottero affondato, campo di anfore, arco di roccia.
// Restituisce i punti in cui appoggiare i reperti (spots).
import * as THREE from '../vendor/three/three.module.min.js';
import { heightAt } from './world.js?v=54d20f2c';
import { rng } from './noise.js?v=54d20f2c';
import { CFG } from './config.js?v=54d20f2c';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';

const loader = new GLTFLoader();
export const modelsReady = [];   // modelli 3D in caricamento: il gioco parte quando sono pronti

const rand = rng(53);
const R = (a, b) => a + (b - a) * rand();

export function buildLandmarks(scene, world, tex) {
  const P = CFG.places, spots = {};
  const rock = (x, y, z, sx, sy, sz, rot = R(0, 6), k = Math.floor(rand() * world.rockBases.length), collide = true) => {
    const m = new THREE.Mesh(world.rockBases[k], world.rockMat);
    m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.y = rot;
    m.castShadow = m.receiveShadow = true; scene.add(m);
    if (collide) world.colliders.push({ c: m.position.clone(), s: new THREE.Vector3(sx, sy, sz).multiplyScalar(0.9), rot });
    return m;
  };
  const sandM = new THREE.MeshStandardMaterial({ map: tex.sand.map, normalMap: tex.sand.normalMap, roughness: 1 });
  const wood = new THREE.MeshStandardMaterial({ map: tex.wood.map, normalMap: tex.wood.normalMap, roughness: 0.95, side: THREE.DoubleSide });
  const clay = new THREE.MeshStandardMaterial({ map: tex.clay.map, normalMap: tex.clay.normalMap, roughness: 0.9, side: THREE.DoubleSide });

  // ---------------- GROTTA (apertura verso est, verso il relitto) ----------------
  {
    const { x, z } = P.grotta, b = heightAt(x, z);
    rock(x - 3.6, b + 1.2, z, 2.2, 3.4, 4.8, 0, 2);            // parete di fondo
    rock(x - 0.2, b + 1.1, z - 3.3, 4.2, 3.0, 1.7, 0.05, 4);   // parete nord
    rock(x - 0.2, b + 1.1, z + 3.3, 4.2, 3.0, 1.7, -0.05, 5);  // parete sud
    rock(x - 0.6, b + 3.6, z, 4.6, 1.3, 4.9, 0.1, 1);          // volta
    // massa rocciosa intorno, per far sembrare la grotta scavata in uno scoglio
    rock(x - 7, b + 1.5, z - 2, 4.5, 5.2, 6, 0.4, 3); rock(x - 4, b + 3.5, z + 5.5, 4, 4, 3.5, 1, 6); rock(x - 4, b + 3.5, z - 5.5, 4.2, 4.2, 3.2, 2, 0);
    rock(x - 2.5, b + 5.2, z, 4, 1.8, 4.5, 0.6, 3, false);
    for (let i = 0; i < 12; i++) { const a = R(0, 6.3), d = R(7, 12); rock(x + Math.cos(a) * d - 3, b + R(-0.2, 0.6), z + Math.sin(a) * d, R(0.6, 2), R(0.5, 1.5), R(0.6, 2)); }
    // sassi sul fondo della grotta
    for (let i = 0; i < 6; i++) rock(x + R(-1.3, 1.5), b - 0.1, z + R(-1.4, 1.4), R(0.12, 0.3), R(0.1, 0.2), R(0.12, 0.3), R(0, 6), Math.floor(R(0, 6.9)), false);
    spots.bussola = { pos: new THREE.Vector3(x - 1.0, b - 0.02, z + 0.7), rot: new THREE.Euler(0.3, 0.5, 0.1) };
  }

  // ---------------- ELICOTTERO AFFONDATO (al posto del vecchio peschereccio) ----------------
  // modello 3D vero (fotogrammetria di un relitto reale): "Helicopter Wreck" di divertom80, Sketchfab, licenza CC BY 4.0
  {
    const { x, z } = P.peschereccio, b = heightAt(x, z), yaw = 2.1;
    const g = new THREE.Group(); g.position.set(x, b - 0.05, z); g.rotation.set(0.03, yaw, -0.06); scene.add(g);   // un po' adagiato sul fianco
    const S = 0.137;   // il modello è lungo ~91 unità: così è lungo 12,5 m
    // il modello ha l'asse in diagonale: lo giro in modo che la cabina guardi verso -x e la coda verso +x,
    // e lo sposto in modo che il centro della cabina (in basso) cada nell'origine del gruppo
    const inner = new THREE.Group(); inner.rotation.y = -0.778; inner.scale.setScalar(S); g.add(inner);
    const off = new THREE.Vector3(-14, 6.85, 23).applyEuler(inner.rotation).multiplyScalar(S);
    inner.position.copy(off).negate();
    modelsReady.push(loader.loadAsync(new URL('./models/heli.gltf?v=1', import.meta.url).href).then((gl) => {
      gl.scene.traverse((o) => {
        if (!o.isMesh) return;
        const old = o.material;
        o.material = new THREE.MeshStandardMaterial({ map: old.map, roughness: 0.95, metalness: 0.1, side: THREE.DoubleSide });
        o.castShadow = o.receiveShadow = true;
      });
      inner.add(gl.scene);
    }).catch(() => {}));
    // ingombri: cabina e trave di coda
    const box = (lx, ly, hx, hy, hz) => world.colliders.push({ c: g.localToWorld(new THREE.Vector3(lx, ly, 0.2)), s: new THREE.Vector3(hx, hy, hz), rot: yaw });
    g.updateMatrixWorld(true);
    box(-0.55, 0.95, 2.55, 0.95, 0.85); box(5.7, 2.0, 3.7, 0.4, 0.35);
    for (let i = 0; i < 8; i++) { const a = R(0, 6.3), d = R(7, 11); rock(x + Math.cos(a) * d, b, z + Math.sin(a) * d, R(0.6, 1.6), R(0.5, 1.2), R(0.6, 1.6)); }
    // la targhetta: sulla sabbia accanto al portellone della cabina, mezza nascosta dal rottame
    const sp = g.localToWorld(new THREE.Vector3(-0.8, 0, -1.35)); sp.y = heightAt(sp.x, sp.z) + 0.12;
    spots.targhetta = { pos: sp, rot: new THREE.Euler(-0.15, yaw + 0.4, 0.1) };
  }

  // ---------------- CAMPO DI ANFORE ----------------
  {
    const { x, z } = P.anfore;
    const prof = [[0, -0.62], [0.05, -0.55], [0.12, -0.35], [0.17, -0.1], [0.18, 0.12], [0.15, 0.27], [0.07, 0.34], [0.055, 0.42], [0.055, 0.56], [0.075, 0.6], [0.06, 0.62]].map(([r, y]) => new THREE.Vector2(r, y));
    const whole = new THREE.LatheGeometry(prof, 18);
    const broken = new THREE.LatheGeometry(prof, 18, 0.4, Math.PI * 1.25);
    const handle = new THREE.TorusGeometry(0.09, 0.022, 6, 12, Math.PI);
    const place = (px, pz, isBroken) => {
      const y = heightAt(px, pz), yaw = R(0, 6.3);
      const a = new THREE.Group(); a.position.set(px, y + R(0.02, 0.12), pz); a.rotation.set(0, yaw, Math.PI / 2 + R(-0.25, 0.25)); scene.add(a);
      const m = new THREE.Mesh(isBroken ? broken : whole, clay); m.castShadow = m.receiveShadow = true; a.add(m);
      if (!isBroken) for (const s of [-1, 1]) { const h = new THREE.Mesh(handle, clay); h.position.set(s * 0.07, 0.42, 0); h.rotation.set(0, s > 0 ? 0 : Math.PI, Math.PI / 2); a.add(h); }
      world.colliders.push({ c: a.position.clone(), s: new THREE.Vector3(0.55, 0.2, 0.2), rot: yaw });
    };
    for (let i = 0; i < 38; i++) { const r = Math.sqrt(rand()) * 8, an = R(0, 6.3); place(x + Math.cos(an) * r, z + Math.sin(an) * r, rand() < 0.3); }
    // cocci
    const shard = new THREE.LatheGeometry(prof.slice(2, 6), 6, 0, 1.1);
    for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(shard, clay); const px = x + R(-8, 8), pz = z + R(-8, 8); m.position.set(px, heightAt(px, pz) + 0.05, pz); m.rotation.set(R(-1.5, 1.5), R(0, 6), R(-1.5, 1.5)); scene.add(m); }
    for (let i = 0; i < 5; i++) { const a = R(0, 6.3), d = R(9, 13); rock(x + Math.cos(a) * d, heightAt(x, z), z + Math.sin(a) * d, R(1, 2.5), R(0.6, 1.3), R(1, 2.5)); }
    const kp = new THREE.Vector3(x + 1.6, 0, z + 1.1); kp.y = heightAt(kp.x, kp.z) + 0.02;
    spots.chiave = { pos: kp, rot: new THREE.Euler(0, 2.2, 0) };
    // un'anfora rotta sopra la chiave, che la nasconde in parte
    const cover = new THREE.Mesh(broken, clay); cover.position.copy(kp).add(new THREE.Vector3(-0.25, 0.12, -0.05)); cover.rotation.set(0, 0.6, Math.PI / 2 + 0.15); scene.add(cover);
  }

  // ---------------- ARCO DI ROCCIA sul bordo della scarpata ----------------
  {
    const { x, z } = P.arco, b = heightAt(x, z);
    const rad = new THREE.Vector3(x, 0, z).normalize(), tan = new THREE.Vector3(-rad.z, 0, rad.x);
    const rot = Math.atan2(tan.x, tan.z);
    const pl = (s) => new THREE.Vector3(x, 0, z).addScaledVector(tan, s * 2.9);
    const a1 = pl(-1), a2 = pl(1);
    rock(a1.x, b + 1.6, a1.z, 1.5, 3.6, 1.7, rot, 2); rock(a2.x, b + 1.6, a2.z, 1.6, 3.8, 1.5, rot, 4);
    rock(x, b + 4.6, z, 1.6, 1.2, 4.6, rot, 1);                         // architrave
    rock(x - rad.x * 2.5, b + 0.2, z - rad.z * 2.5, 1.2, 0.6, 1.4);
    for (let i = 0; i < 6; i++) { const s = R(-1, 1) * 7; const pp = new THREE.Vector3(x, 0, z).addScaledVector(tan, s).addScaledVector(rad, R(-2, 1)); rock(pp.x, heightAt(pp.x, pp.z), pp.z, R(0.8, 2), R(0.6, 1.5), R(0.8, 2)); }
    const cp = new THREE.Vector3(x, 0, z).addScaledVector(rad, 0.4); cp.y = heightAt(cp.x, cp.z) + 0.05;
    spots.cofanetto = { pos: cp, rot: new THREE.Euler(0.08, rot + 0.3, -0.05) };
    const mound = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10).scale(1.4, 0.3, 1), sandM); mound.position.copy(cp).add(new THREE.Vector3(0.25, -0.02, 0.1)); scene.add(mound);
    spots.cofanetto.extra = [mound];
  }
  return spots;
}
