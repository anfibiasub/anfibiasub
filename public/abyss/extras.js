// Oggetti in più del mondo e del sub:
// - palloni di sollevamento (anche esplosivi se colpiti dalla fiocina)
// - aereo affondato vicino al relitto, con ANFIBIASUB su un'ala e Tak4Fly sull'altra
// - ponte di sabbia sul bordo del mondo con cancello chiuso "Missione 2"
// - mano con l'erogatore (getto d'aria) e fiocina, visti in prima persona, con l'arpione che vola
import * as THREE from '../vendor/three/three.module.min.js';
import { heightAt } from './world.js?v=8b59fd59';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';

const NAVY = '#071D30', CYAN = '#3CC6F5', ICE = '#DCEFF5';

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function wordmark(g, x, y, size, align = 'left', a1 = ICE, a2 = CYAN) {
  g.font = `800 ${size}px Montserrat, Arial, sans-serif`; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  const a = g.measureText('ANFIBIA').width, b = g.measureText('SUB').width;
  const x0 = align === 'center' ? x - (a + b) / 2 : x;
  g.fillStyle = a1; g.fillText('ANFIBIA', x0, y); g.fillStyle = a2; g.fillText('SUB', x0 + a, y);
}
function grime(g, w, h, k = 1, a = 0.18) {
  for (let i = 0; i < w * h / 600 * k; i++) { g.fillStyle = `rgba(${40 + Math.random() * 40},${60 + Math.random() * 40},${50 + Math.random() * 30},${Math.random() * a})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 5, 0, 7); g.fill(); }
}
const loadImg = (src) => new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = src; });
const shade = (o) => o.traverse((m) => { if (m.isMesh) m.castShadow = m.receiveShadow = true; });

// ======================================================================================
// PALLONE DI SOLLEVAMENTO (giallo, ANFIBIASUB): il gruppo ha l'origine al centro del pallone
// ======================================================================================
let bagMat = null;
export function makeLiftBag(tex, L = 3.2) {
  if (!bagMat) {
    const t2 = canvasTex(1024, 512, (g, w, h) => {
      g.fillStyle = '#e3ad1a'; g.fillRect(0, 0, w, h);
      g.font = '800 54px Montserrat, Arial'; g.textAlign = 'center';
      for (let k = 0; k < 3; k++) { g.fillStyle = NAVY; g.fillText('ANFIBIASUB', k * 341 + 170, h * 0.55); }
      g.fillStyle = 'rgba(0,0,0,.22)'; for (let k = 0; k < 8; k++) g.fillRect(k * 128, 0, 3, h);
      grime(g, w, h, 0.5);
    });
    bagMat = new THREE.MeshStandardMaterial({ map: t2, roughness: 0.55 });
  }
  const g = new THREE.Group(), bagPart = new THREE.Group(); g.add(bagPart);
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.75, 32, 20).scale(1, 1.35, 1), bagMat); bagPart.add(bag);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 24, 1, true), bagMat); cone.position.y = -1.1; cone.rotation.x = Math.PI; bagPart.add(cone);
  const rope = new THREE.MeshStandardMaterial({ color: 0xd8d0b8, roughness: 1 });
  for (const [dx, dz] of [[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.25], [0.3, 0.25]]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, L, 5), rope);
    c.position.set(dx / 2, -1.35 - L / 2, dz / 2); c.rotation.set(dz * 0.2, 0, -dx * 0.2); bagPart.add(c);
  }
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.6), new THREE.MeshStandardMaterial({ map: tex.rust.map, normalMap: tex.rust.normalMap, roughness: 0.9, metalness: 0.5 }));
  crate.position.y = -1.35 - L - 0.25; g.add(crate);
  g.userData = { bagPart, crate, L, h0: 1.35 + L + 0.5 };
  shade(g);
  return g;
}

// tutti i palloni del mondo (quello del cantiere + quelli sparsi); esplodono se colpiti dalla fiocina
export function buildLiftBags(scene, tex, spots, extra) {
  const list = [];
  const add = (g) => { list.push({ g, alive: true, base: g.position.clone(), ph: Math.random() * 6 }); };
  if (extra) add(extra);
  for (const s of spots) {
    const g = makeLiftBag(tex, s.L);
    g.position.set(s.x, heightAt(s.x, s.z) + g.userData.h0, s.z); g.rotation.y = s.rot || 0;
    scene.add(g); add(g);
  }
  const center = (b, out) => out.copy(b.g.position);
  return {
    list,
    center,
    update(t) { for (const b of list) if (b.alive) { b.g.position.y = b.base.y + Math.sin(t * 0.5 + b.ph) * 0.06; b.g.rotation.z = Math.sin(t * 0.33 + b.ph) * 0.03; } },
    // il primo pallone vivo colpito da un segmento (a -> b)
    hit(a, b) {
      const ab = new THREE.Vector3().subVectors(b, a), len = ab.length(); if (len < 1e-6) return null; ab.divideScalar(len);
      const c = new THREE.Vector3(), d = new THREE.Vector3();
      for (const x of list) {
        if (!x.alive) continue;
        center(x, c); d.subVectors(c, a); const k = Math.max(0, Math.min(len, d.dot(ab)));
        d.copy(a).addScaledVector(ab, k).sub(c); d.y /= 1.35;   // il pallone è un ellissoide alto
        if (d.length() < 0.85) return x;
      }
      return null;
    },
    pop(x) { x.alive = false; x.g.userData.bagPart.visible = false; },
    reset() { for (const x of list) { x.alive = true; x.g.userData.bagPart.visible = true; } },
  };
}

// ======================================================================================
// AEREO AFFONDATO vicino al relitto: ultraleggero ad ala alta (modello vero), giallo come quello di Ivano;
// su un'ala ANFIBIASUB con il logo, sull'altra Tak4Fly con il simbolo di TikTok
// ======================================================================================
export async function buildPlane(scene, world, tex, P) {
  try { await document.fonts.load('800 40px Montserrat'); } catch (_) { /* font di riserva */ }
  const logo = await loadImg('/img/logo-casco.png?v=c85f74');
  const tiktok = P.tiktok ? await loadImg(new URL('./tex/' + P.tiktok, import.meta.url).href) : null;
  // il modello vero: "Super Guepard 912" di helijah (Sketchfab, CC BY 4.0), ripitturato giallo come l'aereo di Ivano.
  // Nel file il muso guarda -x e le ali stanno lungo z: lo giro in modo che il muso guardi +z e lo centro sull'origine.
  const g = new THREE.Group();
  const inner = new THREE.Group(); inner.rotation.y = Math.PI / 2; inner.position.set(4.9, 0, 3); g.add(inner);
  const gl = await new GLTFLoader().loadAsync(new URL('./models/guepard.gltf?v=1', import.meta.url).href);
  gl.scene.traverse((o) => { if (o.isMesh) { const m = o.material; if (m.map) { m.roughness = 0.6; m.metalness = 0.1; } } });
  inner.add(gl.scene);
  g.updateMatrixWorld(true);
  // dove sta la superficie superiore delle ali (per appoggiarci sopra le scritte)
  const ray = new THREE.Raycaster(), hits = (x) => {
    const ys = [];
    for (let z = -2; z <= 2; z += 0.05) { ray.set(new THREE.Vector3(x, 10, z), new THREE.Vector3(0, -1, 0)); const h = ray.intersectObject(gl.scene, true)[0]; if (h && h.point.y > 1.5) ys.push([z, h.point.y]); }
    if (!ys.length) return { z: 0, y: 2.3 };
    return { z: (ys[0][0] + ys[ys.length - 1][0]) / 2, y: Math.max(...ys.map((v) => v[1])) };
  };
  const wingTop = { '-1': hits(-2.6), '1': hits(2.6) };

  // scritte sopra l'ala (decalcomanie sbiadite dal mare): a sinistra ANFIBIASUB, a destra Tak4Fly
  const decal = (draw) => {
    const t = canvasTex(1024, 300, (c, w, h) => { draw(c, w, h); c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 600; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * 0.45})`; c.beginPath(); c.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 6, 0, 7); c.fill(); } });
    return new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
  };
  const panelBg = (c, h) => { c.fillStyle = 'rgba(7,29,48,.88)'; c.beginPath(); c.roundRect(300, h / 2 - 82, 700, 164, 26); c.fill(); };
  const badge = (c, h, drawIn) => { c.save(); c.translate(150, h / 2); c.beginPath(); c.arc(0, 0, 128, 0, 7); c.fillStyle = 'rgba(7,29,48,.9)'; c.fill(); drawIn(c); c.lineWidth = 9; c.strokeStyle = ICE; c.beginPath(); c.arc(0, 0, 128, 0, 7); c.stroke(); c.restore(); };
  const leftM = decal((c, w, h) => {
    badge(c, h, (cc) => { if (logo) { cc.save(); cc.beginPath(); cc.arc(0, 0, 122, 0, 7); cc.clip(); cc.drawImage(logo, -122, -122, 244, 244); cc.restore(); } });
    panelBg(c, h); wordmark(c, 650, h / 2 + 36, 100, 'center');
  });
  const rightM = decal((c, w, h) => {
    // simbolo di TikTok: si usa solo il file ufficiale messo da Ivano in abyss/tex/ (CFG.plane.tiktok), non lo disegno io;
    // se manca, nel tondo resta un piccolo aereo
    badge(c, h, (cc) => {
      if (tiktok) { cc.save(); cc.beginPath(); cc.arc(0, 0, 122, 0, 7); cc.clip(); const k = 170 / Math.max(tiktok.width, tiktok.height); cc.drawImage(tiktok, -tiktok.width * k / 2, -tiktok.height * k / 2, tiktok.width * k, tiktok.height * k); cc.restore(); return; }
      cc.fillStyle = ICE;
      cc.beginPath(); cc.moveTo(-60, 18); cc.quadraticCurveTo(-70, -12, -40, -18); cc.lineTo(10, -18); cc.lineTo(80, -2); cc.lineTo(80, 8); cc.lineTo(-10, 22); cc.closePath(); cc.fill();
      cc.fillRect(-55, -30, 95, 12);
      cc.beginPath(); cc.moveTo(60, -2); cc.lineTo(78, -42); cc.lineTo(92, -42); cc.lineTo(86, 2); cc.closePath(); cc.fill();
      cc.fillRect(-74, -40, 6, 68);
      cc.beginPath(); cc.arc(-30, 42, 13, 0, 7); cc.arc(20, 42, 13, 0, 7); cc.fill();
      cc.fillRect(-32, 18, 4, 18); cc.fillRect(18, 18, 4, 18);
    });
    panelBg(c, h);
    c.font = '800 112px Montserrat, Arial'; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    const a = c.measureText('Tak').width, b = c.measureText('4').width, d = c.measureText('Fly').width, x0 = 650 - (a + b + d) / 2, y = h / 2 + 38;
    c.fillStyle = ICE; c.fillText('Tak', x0, y); c.fillStyle = CYAN; c.fillText('4', x0 + a, y); c.fillStyle = ICE; c.fillText('Fly', x0 + a + b, y);
  });
  for (const [s, m] of [[-1, leftM], [1, rightM]]) {
    const w = wingTop[String(s)];
    const p = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 0.92), m);
    p.rotation.x = -Math.PI / 2; p.rotation.z = Math.PI;   // il testo si legge guardando l'ala da dietro, verso il muso
    p.position.set(s * 2.6, w.y + 0.015, w.z); g.add(p);
  }

  // adagiato sul fondo: ruote affondate nella sabbia, un po' inclinato
  const x = P.x, z = P.z, b = heightAt(x, z);
  g.position.set(x, b - 0.15, z); g.rotation.set(0.04, P.rot, -0.05);
  shade(g); scene.add(g);
  g.updateMatrixWorld(true);
  const col = (lx, ly, lz, sx, sy, sz) => world.colliders.push({ c: g.localToWorld(new THREE.Vector3(lx, ly, lz)), s: new THREE.Vector3(sx, sy, sz), rot: P.rot });
  const wz = (wingTop['-1'].z + wingTop['1'].z) / 2, wy = (wingTop['-1'].y + wingTop['1'].y) / 2;
  col(0, 1.0, 0, 0.6, 0.95, 3.0);
  for (const s of [-1, 1]) for (const d of [1.4, 3.6]) col(s * d, wy - 0.05, wz, 1.15, 0.15, 0.75);
  return g;
}

// ======================================================================================
// PONTE DI SABBIA sul bordo del mondo, chiuso da un cancello: "MISSIONE 2 · A PRESTO"
// ======================================================================================
export async function buildGate(scene, world, tex, P, texts) {
  try { await document.fonts.load('800 40px Montserrat'); await document.fonts.load('600 20px Montserrat'); } catch (_) { /* font di riserva */ }
  const logo = await loadImg('/img/logo-casco.png?v=c85f74');
  const ang = P.ang, dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang)), side = new THREE.Vector3(-dir.z, 0, dir.x);
  const yaw = Math.atan2(-dir.z, dir.x);    // gruppo con l'asse +x verso il largo
  const r0 = P.r, gx = dir.x * r0, gz = dir.z * r0, b = heightAt(gx, gz);
  const g = new THREE.Group(); g.position.set(gx, b, gz); g.rotation.y = yaw; scene.add(g);

  // il ponte: striscia di terra stretta (2,6 m) che parte dal fondale e attraversa l'abisso oltre la scarpata;
  // i fianchi scendono ripidi nel blu. Il cancello sta in fondo, alla fine del ponte, e blocca il passaggio.
  const len = P.len;
  const sand = new THREE.MeshStandardMaterial({ map: tex.sand.map, normalMap: tex.sand.normalMap, roughness: 1 });
  const rockM = new THREE.MeshStandardMaterial({ map: tex.rock.map, normalMap: tex.rock.normalMap, roughness: 1, color: 0x9a968c });
  const sec = new THREE.Shape(); sec.moveTo(-1.3, 0); sec.quadraticCurveTo(0, 0.25, 1.3, 0); sec.lineTo(2.2, -3); sec.lineTo(3.6, -30); sec.lineTo(-3.6, -30); sec.lineTo(-2.2, -3); sec.closePath();
  const ridge = new THREE.ExtrudeGeometry(sec, { depth: len + 6, bevelEnabled: false, steps: Math.round(len) }).rotateY(Math.PI / 2).translate(-4, 0, 0);
  // irregolarità dei fianchi, come roccia franata
  const pa = ridge.attributes.position;
  for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); if (y < -0.2) { const x = pa.getX(i); pa.setZ(i, pa.getZ(i) * (1 + Math.sin(x * 1.3 + y * 0.7) * 0.12 + Math.sin(x * 3.1 - y) * 0.06)); } }
  ridge.computeVertexNormals();
  const uv = ridge.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, pa.getX(i) / 2, pa.getZ(i) / 2 + pa.getY(i) / 2);
  // sopra sabbia, sui fianchi roccia: due materiali sulla stessa forma (faccia superiore = gruppo 0 dell'estrusione)
  const deck = new THREE.Mesh(ridge, [rockM, rockM]); deck.position.y = 0.02; deck.receiveShadow = deck.castShadow = true; g.add(deck);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(len + 6, 2.5, Math.round(len + 6), 2).rotateX(-Math.PI / 2).translate(len / 2 - 1, 0.2, 0), sand);
  { const tp = top.geometry.attributes.position; for (let i = 0; i < tp.count; i++) { const z = tp.getZ(i); tp.setY(i, 0.2 - z * z * 0.06 + Math.sin(tp.getX(i) * 1.7) * 0.03); } top.geometry.computeVertexNormals(); }
  top.receiveShadow = true; g.add(top);
  // sassi sul bordo del ponte
  for (let i = 0; i < 14; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.25, 0), rockM); const sd = Math.random() < 0.5 ? -1 : 1; r.position.set(-2 + Math.random() * (len + 3), 0.05, sd * (1.1 + Math.random() * 0.3)); r.rotation.set(Math.random() * 3, Math.random() * 3, 0); r.scale.y = 0.6; g.add(r); }
  const gt = new THREE.Group(); gt.position.x = len; g.add(gt);   // il cancello, in fondo al ponte

  // cancello: due pilastri in pietra, due ante a sbarre in ferro arrugginito chiuse da una catena
  const stone = new THREE.MeshStandardMaterial({ map: tex.rock.map, normalMap: tex.rock.normalMap, color: 0xa29d92, roughness: 1 });
  const iron = new THREE.MeshStandardMaterial({ map: tex.rust.map, normalMap: tex.rust.normalMap, roughness: 0.85, metalness: 0.6 });
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.2, 0.7), stone); p.position.set(0, 1.6, s * 1.6); gt.add(p);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.2, 0.85), stone); cap.position.set(0, 3.3, s * 1.6); gt.add(cap);
  }
  const leaves = [];
  for (const s of [-1, 1]) {
    const leaf = new THREE.Group(); leaf.position.set(0, 0, s * 1.25); gt.add(leaf); leaves.push([leaf, s]);
    for (const y of [0.25, 1.4, 2.6]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.2), iron); r.position.set(0, y, -s * 0.6); leaf.add(r); }
    for (let k = 0; k < 5; k++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.75, 6), iron); r.position.set(0, 1.42, -s * (0.1 + k * 0.23)); leaf.add(r); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 6), iron); tip.position.set(0, 2.86, -s * (0.1 + k * 0.23)); leaf.add(tip); }
  }
  // catena e lucchetto al centro
  const chain = new THREE.Group(); gt.add(chain);
  for (let k = 0; k < 7; k++) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 5, 10), iron); l.position.set(0.06, 1.75 - k * 0.09, (k % 2 ? 0.03 : -0.03)); l.rotation.set(0, k % 2 ? Math.PI / 2 : 0, 0); chain.add(l); }
  // il lucchetto (bersaglio della fiocina): un po' più grande, in ottone, con l'arco
  const brassM = new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.85, roughness: 0.4, emissive: 0x1a1206 });
  const lock = new THREE.Group(); lock.position.set(-0.02, 1.02, 0); chain.add(lock);
  lock.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.2), brassM));
  { const sh = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 6, 14, Math.PI), iron); sh.position.y = 0.11; sh.rotation.y = Math.PI / 2; lock.add(sh); }

  // cartello appeso alle sbarre: MISSIONE 2 · A PRESTO (nella lingua del gioco)
  const sign = canvasTex(1024, 640, (c, w, h) => {
    c.fillStyle = NAVY; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(220,239,245,.55)'; c.lineWidth = 8; c.strokeRect(26, 26, w - 52, h - 52);
    c.textAlign = 'center'; c.fillStyle = CYAN; c.font = '800 150px Montserrat, Arial'; c.fillText(texts.title, w / 2, 260);
    c.fillStyle = ICE; c.font = '600 72px Montserrat, Arial'; c.fillText(texts.sub, w / 2, 380);
    c.fillStyle = CYAN; c.fillRect(140, 450, w - 280, 5);
    wordmark(c, w / 2, 560, 64, 'center');
    grime(c, w, h, 2.2, 0.22);
  });
  const sm = new THREE.MeshStandardMaterial({ map: sign, roughness: 0.8, metalness: 0.05, color: 0xc3ccd0 });
  const back = new THREE.MeshStandardMaterial({ color: 0x40494d, roughness: 0.8 });
  // facce del box: +x, -x, +y, -y, +z, -z; la -x guarda verso il centro del mondo, da dove arriva il sub
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.9, 1.4), [back, sm, back, back, back, back]);
  panel.position.set(-0.08, 2.0, 0); panel.rotation.x = 0.03; gt.add(panel);

  // targa in ottone ANFIBIASUB sul pilastro sinistro
  const brass = canvasTex(512, 512, (c, w, h) => {
    const lg = c.createLinearGradient(0, 0, w, h); lg.addColorStop(0, '#b8925a'); lg.addColorStop(1, '#7a5d35');
    c.fillStyle = lg; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(40,26,10,.8)'; c.lineWidth = 10; c.strokeRect(20, 20, w - 40, h - 40);
    if (logo) { c.save(); c.globalAlpha = 0.9; c.beginPath(); c.arc(w / 2, 190, 120, 0, 7); c.clip(); c.drawImage(logo, w / 2 - 120, 70, 240, 240); c.restore(); }
    c.fillStyle = 'rgba(40,26,10,.95)'; c.textAlign = 'center'; c.font = '800 72px Montserrat, Arial'; c.fillText('ANFIBIASUB', w / 2, 400);
    c.font = '600 26px Montserrat, Arial'; c.fillText('LAVORI SUBACQUEI', w / 2, 450);
    for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(50,${90 + Math.random() * 40},70,${Math.random() * 0.3})`; c.beginPath(); c.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 0, 7); c.fill(); }
  });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), new THREE.MeshStandardMaterial({ map: brass, metalness: 0.75, roughness: 0.45 }));
  plate.position.set(-0.36, 1.9, -1.6); plate.rotation.y = -Math.PI / 2; gt.add(plate);

  shade(g);
  g.updateMatrixWorld(true);
  // il ponte si percorre (pavimento fatto di ellissoidi lungo la cresta); il cancello in fondo non si attraversa
  for (let x = -2; x <= len + 1; x += 2) world.colliders.push({ c: g.localToWorld(new THREE.Vector3(x, -1.25, 0)), s: new THREE.Vector3(1.6, 1.45, 1.35), rot: yaw, keep: true });
  const gateCols = [-1, 0, 1].map((s) => ({ c: g.localToWorld(new THREE.Vector3(len, 1.5, s * 1.1)), s: new THREE.Vector3(0.45, 1.7, 0.8), rot: yaw, keep: true }));
  gateCols.forEach((c) => world.colliders.push(c));
  // apertura: il lucchetto salta (colpito dall'arpione), la catena cade, le ante si aprono verso il largo, il cartello cade
  const G = { open: false, t: 0, panel0: panel.position.clone() };
  const lockW = new THREE.Vector3();
  g.userData.gate = {
    lockPos: () => lock.getWorldPosition(lockW),
    isOpen: () => G.open,
    open() {
      if (G.open) return; G.open = true; G.t = 0;
      gateCols.forEach((c) => { const i = world.colliders.indexOf(c); if (i >= 0) world.colliders.splice(i, 1); });
    },
    update(dt) {
      if (!G.open || G.t > 4) return; G.t += dt;
      const k = Math.min(1, G.t / 2.5), e = 1 - Math.pow(1 - k, 3);
      leaves.forEach(([leaf, s]) => { leaf.rotation.y = -s * 1.45 * e; });
      chain.position.y = -Math.min(1, G.t / 0.8) * 1.0; chain.rotation.z = Math.min(1, G.t) * 0.6;
      panel.position.set(G.panel0.x - e * 0.5, G.panel0.y - e * 1.75, G.panel0.z); panel.rotation.z = e * 1.2;
    },
    // il sub ha passato il cancello?
    crossed(p) { const c = Math.cos(ang), s2 = Math.sin(ang); const along = p.x * c + p.z * s2, across = -p.x * s2 + p.z * c; return G.open && along > r0 + len + 0.6 && Math.abs(across) < 3; },
    reset() {
      G.open = false; G.t = 0; leaves.forEach(([leaf]) => { leaf.rotation.y = 0; }); chain.position.y = 0; chain.rotation.z = 0;
      panel.position.copy(G.panel0); panel.rotation.set(0.03, 0, 0);
      gateCols.forEach((c) => { if (!world.colliders.includes(c)) world.colliders.push(c); });
    },
  };
  return g;
}

// ======================================================================================
// IN PRIMA PERSONA: mano guantata con l'erogatore (getto d'aria) e fiocina
// ======================================================================================
// materiale "matcap": la mano e la fiocina non dipendono dalle luci della scena (la torcia da vicino le bruciava)
let MC = {};
function matcapTex(shine) {
  const k = Math.round(shine * 10); if (MC[k]) return MC[k];
  const t = canvasTex(256, 256, (c, w, h) => {
    const g = c.createRadialGradient(w * 0.38, h * 0.3, 4, w / 2, h / 2, w / 2);
    g.addColorStop(0, `rgb(${200 + 55 * shine},${200 + 55 * shine},${200 + 55 * shine})`);
    g.addColorStop(0.18 + 0.2 * (1 - shine), 'rgb(150,155,160)'); g.addColorStop(0.75, 'rgb(70,78,86)'); g.addColorStop(1, 'rgb(20,28,36)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  return (MC[k] = t);
}
const mc = (color, shine) => { const m = new THREE.MeshMatcapMaterial({ matcap: matcapTex(shine), color }); m.fog = false; m.userData.noCaustics = true; return m; };

export function buildViewModels(camera) {
  const glove = mc(0x3a3f45, 0.35), seam = mc(0x50575d, 0.3), black = mc(0x2a2e32, 0.8), chrome = mc(0xd5dde0, 1), yellow = mc(0xe0ab18, 0.7);

  // ---- mano sinistra con il secondo stadio (octopus giallo) tenuto davanti: il pollice preme il pulsante di spurgo ----
  const hand = new THREE.Group(); camera.add(hand);
  const reg = new THREE.Group(); hand.add(reg);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.04, 28).rotateX(Math.PI / 2), black); reg.add(body);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.006, 8, 28), yellow); ring.position.z = -0.02; reg.add(ring);
  const purge = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.038, 0.012, 24).rotateX(Math.PI / 2), black); purge.position.z = -0.026; reg.add(purge);
  for (let k = 0; k < 4; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.004, 0.004), seam); r.position.set(0, -0.015 + k * 0.01, -0.033); reg.add(r); }
  const tee = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.03), black); tee.position.set(0, -0.045, 0.004); reg.add(tee);
  const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.03, 12).rotateX(Math.PI / 2), black); mouth.position.set(0, 0, 0.032); reg.add(mouth);
  const swivel = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.03, 10), chrome); swivel.position.set(0.05, 0, 0.004); swivel.rotation.z = Math.PI / 2; reg.add(swivel);
  // frusta gialla che scende verso la bombola
  const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.065, 0, 0.004), new THREE.Vector3(0.12, -0.04, 0.05), new THREE.Vector3(0.14, -0.2, 0.12), new THREE.Vector3(0.1, -0.45, 0.2)]), 20, 0.009, 8), yellow); reg.add(hose);
  // guanto: dorso, dita intorno al corpo, pollice sul pulsante
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 10).scale(1, 0.42, 1.1), glove); palm.position.set(-0.035, -0.035, 0.03); palm.rotation.set(0.2, 0, 0.9); hand.add(palm);
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.04, 0.11, 14), glove); cuff.position.set(-0.062, -0.075, 0.075); cuff.rotation.set(0.9, 0, 0.6); hand.add(cuff);
  for (let k = 0; k < 4; k++) {
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.0105, 0.045, 4, 8), glove);
    const a = -0.9 + k * 0.42;
    f.position.set(Math.cos(a) * 0.05 + 0.005, Math.sin(a) * 0.05 - 0.005, 0.006 - k * 0.002); f.rotation.z = a; hand.add(f);
  }
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.05, 4, 8), glove); hand.add(thumb);
  const thumbUp = () => { thumb.position.set(-0.012, 0.012, -0.05); thumb.rotation.set(1.3, 0, -0.5); };
  thumbUp();
  hand.visible = false;

  // ---- fiocina (arbalete): fusto in alluminio, impugnatura, elastici, asta con la punta ----
  const gun = new THREE.Group(); camera.add(gun);
  const alu = mc(0x7d868b, 0.9), rub = mc(0x9a4220, 0.4), steel = mc(0xc9d2d6, 1);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.85, 14).rotateX(Math.PI / 2), alu); barrel.position.z = -0.42; gun.add(barrel);
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.06, 14).rotateX(Math.PI / 2), black); muzzle.position.z = -0.86; gun.add(muzzle);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.05), black); grip.position.set(0, -0.07, 0.02); grip.rotation.x = -0.25; gun.add(grip);
  const trig = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.03, 0.012), steel); trig.position.set(0, -0.03, -0.03); gun.add(trig);
  const butt = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.035, 0.12), black); butt.position.set(0, -0.005, 0.07); gun.add(butt);
  const spear = new THREE.Group(); gun.add(spear);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 1.0, 6).rotateX(Math.PI / 2), steel); shaft.position.set(0, 0.022, -0.5); spear.add(shaft);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.05, 8).rotateX(-Math.PI / 2), steel); tip.position.set(0, 0.022, -1.02); spear.add(tip);
  const bands = [];
  for (const s of [-1, 1]) {
    const band = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.016, 0.0, -0.84), new THREE.Vector3(s * 0.03, 0.015, -0.55), new THREE.Vector3(s * 0.012, 0.024, -0.3)]), 12, 0.006, 6), rub);
    gun.add(band); bands.push(band);
  }
  const slack = []; for (const s of [-1, 1]) { const band = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.006, 6, 12, Math.PI), rub); band.position.set(s * 0.02, 0, -0.84); band.rotation.set(0, Math.PI / 2, s * 0.5); band.visible = false; gun.add(band); slack.push(band); }
  gun.visible = false;

  const V = { hand, gun, k: 0, gk: 0, reload: 0, recoil: 0, pressed: false };
  const tmp = new THREE.Vector3();
  // posizione dell'uscita delle bolle (fronte dell'erogatore) in coordinate del mondo
  V.nozzle = (out) => reg.localToWorld(out.set(0, 0, -0.04));
  V.muzzle = (out) => gun.localToWorld(out.set(0, 0.022, -1.0));
  V.setGunReady = (v) => { spear.visible = v; bands.forEach((b) => { b.visible = v; }); slack.forEach((b) => { b.visible = !v; }); };
  V.update = (dt, t, blasting, hasGun, aspect) => {
    // la mano entra dal basso quando si preme il getto d'aria
    V.k += ((blasting ? 1 : 0) - V.k) * Math.min(1, dt * 10);
    hand.visible = V.k > 0.02;
    const nx = Math.min(1, aspect / 1.6);    // sullo schermo stretto la tengo più al centro
    const sx = hasGun ? -0.13 * nx : 0.1 * nx;
    hand.position.set(sx, -0.085 - (1 - V.k) * 0.25 + Math.sin(t * 14) * 0.002 * V.k, -0.3);
    hand.rotation.set(0.35, -0.75, (hasGun ? 1 : -1) * 0.25);
    if (blasting) { thumb.position.set(-0.008, 0.006, -0.042); thumb.rotation.set(1.45, 0, -0.45); } else thumbUp();
    // fiocina a destra, sempre in mano dopo la missione
    gun.visible = hasGun;
    if (hasGun) {
      V.gk = Math.min(1, V.gk + dt * 2);
      V.recoil = Math.max(0, V.recoil - dt * 4);
      gun.position.set(0.17 * nx, -0.2 - (1 - V.gk) * 0.3 + Math.sin(t * 1.1) * 0.004, -0.12 + V.recoil * 0.06);
      gun.rotation.set(0.04 + V.recoil * 0.15, -0.03, 0);
      if (V.reload > 0) { V.reload -= dt; if (V.reload <= 0) V.setGunReady(true); }
    } else V.gk = 0;
    return tmp;
  };
  return V;
}

// arpione: vola dritto, rallenta, e si pianta nel fondale; colpisce palloni e squalo
export function createSpear(scene) {
  const steel = new THREE.MeshStandardMaterial({ color: 0xb8c1c5, roughness: 0.3, metalness: 1 }); steel.userData.noCaustics = true;
  const m = new THREE.Group();
  { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.2, 6).rotateX(Math.PI / 2), steel); m.add(s); const t = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.09, 8).rotateX(-Math.PI / 2), steel); t.position.z = -0.64; m.add(t); }
  m.visible = false; m.userData.noSolid = true; scene.add(m);
  const S = { m, on: false, stuck: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3(), dist: 0 };
  const prev = new THREE.Vector3();
  S.fire = (from, dir) => { S.on = true; S.stuck = 0; S.dist = 0; S.pos.copy(from); S.vel.copy(dir).multiplyScalar(24); m.visible = true; m.position.copy(from); m.lookAt(from.clone().sub(dir)); };
  // onHit(prev, pos) -> true se ha colpito qualcosa e l'arpione si ferma
  S.update = (dt, onHit) => {
    if (S.stuck > 0) { S.stuck -= dt; if (S.stuck <= 0) { m.visible = false; } return; }
    if (!S.on) return;
    prev.copy(S.pos);
    S.vel.multiplyScalar(Math.exp(-dt * 0.9)); S.vel.y -= dt * 0.6;
    S.pos.addScaledVector(S.vel, dt); S.dist += S.vel.length() * dt;
    m.position.copy(S.pos); m.lookAt(S.pos.clone().sub(S.vel));
    if (onHit(prev, S.pos)) { S.on = false; S.stuck = 0.01; m.visible = false; return; }
    const ground = heightAt(S.pos.x, S.pos.z);
    if (S.pos.y < ground + 0.05) { S.pos.y = ground + 0.05; m.position.copy(S.pos); S.on = false; S.stuck = 8; return; }
    if (S.dist > 32 || S.vel.length() < 2) { S.on = false; S.stuck = 0.01; m.visible = false; }
  };
  S.clear = () => { S.on = false; S.stuck = 0; m.visible = false; };
  return S;
}


// gorgonie vere sulle rocce: il modello ha 4 ventagli (arancio, viola, bianco, giallo); ognuno diventa un InstancedMesh
// e su ogni roccia ne metto uno solo, a turno, così il costo resta basso anche sul telefono
function addGorgonians(scene, model, spots) {
  model.updateMatrixWorld(true);
  const fans = [];
  model.traverse((o) => {
    if (!o.isMesh) return;
    // il modello è quantizzato (interi normalizzati): prima lo riporto a float, se no la trasformazione lo deforma
    const g = new THREE.BufferGeometry();
    for (const [name, a] of Object.entries(o.geometry.attributes)) {
      const n = a.count, k = a.itemSize, f = new Float32Array(n * k);
      for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) f[i * k + j] = a.getComponent(i, j);
      g.setAttribute(name, new THREE.BufferAttribute(f, k));
    }
    if (o.geometry.index) g.setIndex(o.geometry.index.clone());
    g.applyMatrix4(o.matrixWorld);
    g.computeBoundingBox(); const bb = g.boundingBox, c = bb.getCenter(new THREE.Vector3()), h = bb.max.y - bb.min.y;
    g.translate(-c.x, -bb.min.y, -c.z); g.scale(1 / h, 1 / h, 1 / h);          // base nell'origine, alto 1
    const m = o.material.clone(); m.side = THREE.DoubleSide;
    fans.push({ g, m });
  });
  if (!fans.length) return;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();
  fans.forEach((f, k) => {
    const mine = spots.filter((_, i) => i % fans.length === k);
    const im = new THREE.InstancedMesh(f.g, f.m, mine.length);
    mine.forEach((sp, i) => { M.compose(P.set(sp.x, sp.y, sp.z), Q.setFromEuler(E.set(sp.tx, sp.rot, sp.tz)), S.setScalar(sp.s)); im.setMatrixAt(i, M); });
    im.castShadow = true; im.frustumCulled = false; scene.add(im);
  });
}

// ======================================================================================
// MODELLI VERI SUL FONDALE (Sketchfab, CC BY 4.0): idrovolante Albatross vicino alle anfore, auto affondata,
// gorgonie, ancora, cannone, cassa; tartaruga che nuota intorno al relitto
// ======================================================================================
export async function buildDeco(scene, world, D) {
  const loader = new GLTFLoader();
  const load = (n) => loader.loadAsync(new URL(`./models/${n}.gltf?v=1`, import.meta.url).href);
  const out = { update: () => {} };
  // oggetto appoggiato: c = centro del modello nel file (x, y del fondo, z), s = scala, sink = quanto affonda nella sabbia
  const place = (gl, d) => {
    const g = new THREE.Group(), inner = gl;
    inner.position.set(-d.c[0] * d.s, -d.c[1] * d.s, -d.c[2] * d.s); inner.scale.setScalar(d.s);
    g.add(inner);
    g.position.set(d.x, heightAt(d.x, d.z) - (d.sink || 0), d.z); g.rotation.set(d.rx || 0, d.rot || 0, d.rz || 0);
    inner.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; const m = o.material; if (m) { m.side = THREE.DoubleSide; if (m.map) m.map.anisotropy = 4; } } });
    scene.add(g);
    if (d.col) world.colliders.push({ c: new THREE.Vector3(d.x, heightAt(d.x, d.z) + d.col[1], d.z), s: new THREE.Vector3(d.col[0], d.col[1], d.col[2]), rot: d.rot || 0 });
    return g;
  };
  const jobs = [];
  for (const d of D.items) jobs.push(load(d.m).then((gl) => {
    if (d.m === 'coral' && world.gorgSpots) addGorgonians(scene, gl.scene, world.gorgSpots);
    if (d.copies) { for (const c of d.copies) place(gl.scene.clone(true), { ...d, ...c }); } else place(gl.scene, d);
  }).catch((e) => console.warn('ABYSS modello', d.m, e && e.message)));
  // tartaruga: nuota in cerchio intorno al relitto, sale e scende piano
  jobs.push(load('turtle').then((gl) => {
    const g = new THREE.Group(); gl.scene.scale.setScalar(1.1); gl.scene.position.set(0, -0.15, 0); g.add(gl.scene); g.userData.noSolid = true; out.turtle = g;
    gl.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    scene.add(g);
    const mixer = gl.animations.length ? new THREE.AnimationMixer(gl.scene) : null;
    if (mixer) { const a = mixer.clipAction(gl.animations[0]); a.timeScale = 0.35; a.play(); }
    const T = D.turtle; let ang = 0;
    out.update = (dt, t) => {
      if (mixer) mixer.update(dt);
      ang += dt * T.speed / T.r;
      const x = T.x + Math.cos(ang) * T.r, z = T.z + Math.sin(ang) * T.r * 0.8;
      const y = Math.max(heightAt(x, z) + 2, T.y + Math.sin(t * 0.13) * 2.5);
      g.position.set(x, y, z);
      g.rotation.set(Math.sin(t * 0.13) * 0.1, Math.atan2(-Math.sin(ang), Math.cos(ang) * 0.8) + 0, Math.sin(t * 0.7) * 0.05);
    };
  }).catch(() => {}));
  await Promise.all(jobs);
  return out;
}
