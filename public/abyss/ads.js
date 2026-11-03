// Presenza di Anfibiasub nel mondo di gioco: elementi realistici di un vero cantiere subacqueo,
// niente cartelloni pubblicitari. Il marchio compare come comparirebbe su attrezzatura vera.
import * as THREE from '../vendor/three/three.module.min.js';
import { heightAt } from './world.js?v=1b0317d2';
import { makeLiftBag } from './extras.js?v=1b0317d2';

const NAVY = '#071D30', CYAN = '#3CC6F5', ICE = '#DCEFF5';

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function wordmark(g, x, y, size, align = 'left') {   // logotipo come nel sito: ANFIBIA chiaro + SUB ciano
  g.font = `800 ${size}px Montserrat, Arial, sans-serif`; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  const a = g.measureText('ANFIBIA').width, b = g.measureText('SUB').width;
  const x0 = align === 'center' ? x - (a + b) / 2 : x;
  g.fillStyle = ICE; g.fillText('ANFIBIA', x0, y); g.fillStyle = CYAN; g.fillText('SUB', x0 + a, y);
}
function grime(g, w, h, k = 1) {
  for (let i = 0; i < w * h / 600 * k; i++) { g.fillStyle = `rgba(${40 + Math.random() * 40},${60 + Math.random() * 40},${50 + Math.random() * 30},${Math.random() * 0.18})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 5, 0, 7); g.fill(); }
}

export async function buildAds(scene, wreck, tex, P) {
  try { await document.fonts.load('800 40px Montserrat'); await document.fonts.load('600 20px Montserrat'); } catch (_) { /* font di riserva */ }
  const logo = await new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = '/img/logo-casco.png?v=c85f74'; });
  const out = {};
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa6ab, metalness: 0.9, roughness: 0.45 });

  // ---------- A. Cartello di cantiere subacqueo (vicino al corpo morto della cima d'ormeggio) ----------
  {
    const t = canvasTex(1024, 640, (g, w, h) => {
      g.fillStyle = NAVY; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(220,239,245,.55)'; g.lineWidth = 6; g.strokeRect(22, 22, w - 44, h - 44);
      if (logo) { g.save(); g.beginPath(); g.arc(200, 250, 140, 0, 7); g.clip(); g.drawImage(logo, 60, 110, 280, 280); g.restore(); g.strokeStyle = CYAN; g.lineWidth = 5; g.beginPath(); g.arc(200, 250, 140, 0, 7); g.stroke(); }
      wordmark(g, 380, 230, 92);
      g.fillStyle = ICE; g.font = '600 34px Montserrat, Arial'; g.fillText('LAVORI SUBACQUEI', 384, 290);
      g.fillStyle = 'rgba(220,239,245,.7)'; g.font = '600 28px Montserrat, Arial'; g.fillText('PORTO DI LOANO', 384, 336);
      g.fillStyle = CYAN; g.fillRect(60, 440, w - 120, 4);
      g.fillStyle = ICE; g.font = '600 30px Montserrat, Arial'; g.fillText('CANTIERE SUBACQUEO · OPERATORI IN IMMERSIONE', 60, 500);
      g.fillStyle = 'rgba(220,239,245,.65)'; g.font = '600 28px Montserrat, Arial'; g.fillText('www.anfibiasub.it', 60, 560);
      grime(g, w, h, 3);
      for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${140 + Math.random() * 60},${130 + Math.random() * 40},110,${0.2 + Math.random() * 0.3})`; g.beginPath(); g.arc(Math.random() < 0.5 ? Math.random() * 60 : w - Math.random() * 60, Math.random() * h, 3 + Math.random() * 8, 0, 7); g.fill(); }
    });
    const face = new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, metalness: 0.05, color: 0xb8c2c6 });   // pannello verniciato opaco, un po' sporcato dal mare
    const g = new THREE.Group();
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.04), [steel, steel, steel, steel, face, steel]); panel.position.y = 1.35; g.add(panel);
    for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), steel); leg.position.set(s * 0.7, 0.8, -0.05); g.add(leg); }
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 0.6), new THREE.MeshStandardMaterial({ map: tex.rock.map, color: 0x9a9a90, roughness: 1 })); base.position.y = 0.12; g.add(base);
    const x = P.x, z = P.z; g.position.set(x, heightAt(x, z) - 0.05, z); g.rotation.y = P.rot;
    g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    scene.add(g); out.cartello = g;
  }

  // ---------- B. Pallone di sollevamento giallo (recupero in corso) sopra una cassa ----------
  {
    const g = makeLiftBag(tex, 3.2);
    const x = P.bx, z = P.bz; g.position.set(x, heightAt(x, z) + g.userData.h0, z);
    scene.add(g); out.pallone = g;
  }

  // ---------- C. Targa in ottone sul relitto: "rilevato e documentato da Anfibiasub" ----------
  {
    const t = canvasTex(1024, 512, (g, w, h) => {
      const lg = g.createLinearGradient(0, 0, w, h); lg.addColorStop(0, '#b8925a'); lg.addColorStop(1, '#7a5d35');
      g.fillStyle = lg; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(40,26,10,.8)'; g.lineWidth = 10; g.strokeRect(26, 26, w - 52, h - 52);
      [[60, 60], [w - 60, 60], [60, h - 60], [w - 60, h - 60]].forEach(([x, y]) => { g.fillStyle = '#4a3a22'; g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); });
      g.fillStyle = 'rgba(40,26,10,.95)'; g.textAlign = 'center';
      g.font = '600 34px Montserrat, Arial'; g.fillText('RELITTO RILEVATO E DOCUMENTATO DA', w / 2, 150);
      g.font = '800 96px Montserrat, Arial'; g.fillText('ANFIBIASUB', w / 2, 270);
      g.font = '600 32px Montserrat, Arial'; g.fillText('LAVORI SUBACQUEI · PORTO DI LOANO', w / 2, 340);
      g.font = 'italic 28px Georgia, serif'; g.fillText('Rispettate il relitto: guardate, non toccate.', w / 2, 420);
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(50,${90 + Math.random() * 40},70,${Math.random() * 0.3})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 7, 0, 7); g.fill(); }
    });
    const m = new THREE.MeshStandardMaterial({ map: t, metalness: 0.75, roughness: 0.45 });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), m);
    const pos = wreck.toW(...P.plaque), nrm = wreck.toW(P.plaque[0] + 1, P.plaque[1], P.plaque[2]).sub(pos).normalize();   // sulla parete di prua della cabina
    plate.position.copy(pos).addScaledVector(nrm, 0.1); plate.lookAt(plate.position.clone().add(nrm));
    scene.add(plate); out.targa = plate;
  }
  return out;
}

// ---------- E. Statue del palombaro con l'ancora (come il logo), in bronzo, con ANFIBIASUB sull'ancora ----------
// Sono anche punti di riferimento: stanno lungo le rotte tra il relitto e i luoghi dei reperti.
export function buildStatues(scene, world, tex, spots, makeHelmet) {
  const bronze = new THREE.MeshStandardMaterial({ map: tex.brass.map, roughnessMap: tex.brass.orm, metalnessMap: tex.brass.orm, color: 0x9c8a6a, roughness: 1, metalness: 1, envMapIntensity: 0.6 });
  const suit = new THREE.MeshStandardMaterial({ map: tex.brass.map, color: 0x6d6250, roughness: 0.75, metalness: 0.55, envMapIntensity: 0.4 });
  const name = canvasTex(1024, 128, (g, w, h) => {
    g.fillStyle = '#8a7656'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(50,${100 + Math.random() * 40},80,${Math.random() * 0.35})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 0, 7); g.fill(); }
    g.font = '800 92px Montserrat, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(25,15,5,0.9)'; g.fillText('ANFIBIASUB', w / 2 + 3, h / 2 + 5);
    g.fillStyle = 'rgba(205,175,120,0.95)'; g.fillText('ANFIBIASUB', w / 2, h / 2);
  });
  const nameM = new THREE.MeshStandardMaterial({ map: name, metalness: 0.8, roughness: 0.45, envMapIntensity: 0.6 });
  const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 12);
  const limb = (g, a, b, r, m) => {   // capsula da a a b
    const d = new THREE.Vector3().subVectors(b, a), L = d.length();
    const mesh = new THREE.Mesh(cap(r, Math.max(0.01, L - r)), m);
    mesh.position.copy(a).addScaledVector(d, 0.5); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    g.add(mesh); return mesh;
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  function statue() {
    const g = new THREE.Group();
    // seduto su uno scoglio
    const seat = new THREE.Mesh(world.rockBases[3], world.rockMat); seat.scale.set(0.75, 0.55, 0.65); seat.position.set(0, 0.35, -0.15); g.add(seat);
    // tronco con giacca da palombaro
    const torso = new THREE.Mesh(cap(0.27, 0.42), suit); torso.scale.set(1.15, 1, 0.85); torso.position.set(0, 1.25, -0.1); torso.rotation.x = -0.12; g.add(torso);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.04, 8, 24), bronze); belt.rotation.x = Math.PI / 2; belt.position.set(0, 1.02, -0.08); belt.scale.set(1.12, 0.85, 1); g.add(belt);
    // elmo e corsaletto (lo stesso modello della camera nascosta, in bronzo)
    const h = makeHelmet(bronze); h.scale.setScalar(1.12); h.position.set(0, 1.5, -0.06); h.rotation.y = 0.35; g.add(h);
    // gambe piegate e scarponi
    for (const s of [-1, 1]) {
      const hip = V(s * 0.15, 0.95, 0), knee = V(s * 0.2, 1.0, 0.55), foot = V(s * 0.24, 0.12, 0.62);
      limb(g, hip, knee, 0.12, suit); limb(g, knee, foot, 0.1, suit);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.36), bronze); boot.position.copy(foot).add(V(0, -0.02, 0.08)); g.add(boot);
    }
    // ancora tenuta di traverso
    const anchor = new THREE.Group(); anchor.position.set(0.05, 0.95, 0.42); anchor.rotation.set(0.15, 0.25, -0.62); g.add(anchor);
    const shank = new THREE.Mesh(new THREE.BoxGeometry(0.17, 2.0, 0.08), [bronze, bronze, bronze, bronze, bronze, bronze]); anchor.add(shank);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.15).rotateZ(Math.PI / 2), nameM); plate.position.set(0, 0.05, 0.042); anchor.add(plate);
    const plate2 = plate.clone(); plate2.rotation.y = Math.PI; plate2.position.z = -0.042; anchor.add(plate2);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 8, 16), bronze); ring.position.y = 1.08; anchor.add(ring);
    const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 8), bronze); stock.rotation.x = Math.PI / 2; stock.position.y = 0.82; anchor.add(stock);
    const arms = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 8, 20, Math.PI * 0.8), bronze); arms.rotation.z = Math.PI + Math.PI * 0.1; arms.position.y = -0.55; anchor.add(arms);
    for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.36, 4).scale(1, 1, 0.3), bronze); f.position.set(s * 0.52, -0.33, 0); f.rotation.z = s * -0.55; anchor.add(f); }
    // braccia che stringono l'ancora
    const grip1 = V(0.05, 1.22, 0.52), grip2 = V(-0.18, 0.86, 0.48);
    limb(g, V(0.3, 1.45, -0.05), V(0.32, 1.1, 0.3), 0.09, suit); limb(g, V(0.32, 1.1, 0.3), grip1, 0.08, suit);
    limb(g, V(-0.3, 1.45, -0.05), V(-0.36, 1.02, 0.2), 0.09, suit); limb(g, V(-0.36, 1.02, 0.2), grip2, 0.08, suit);
    for (const p of [grip1, grip2]) { const gl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), bronze); gl.scale.set(1, 0.8, 1.2); gl.position.copy(p); g.add(gl); }
    // targa sul basamento
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.24, 0.05), nameM); base.position.set(0, 0.2, 0.42); base.rotation.x = -0.25; g.add(base);
    // tubo dell'aria dall'elmo al fondo
    const hose = new THREE.CatmullRomCurve3([V(0.12, 1.62, -0.3), V(0.35, 1.3, -0.6), V(0.5, 0.5, -0.8), V(0.7, 0.05, -1.2)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(hose, 24, 0.035, 6), suit));
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return g;
  }

  const proto = statue();
  const list = [];
  for (const s of spots) {
    const g = proto.clone();
    const y = heightAt(s.x, s.z);
    g.position.set(s.x, y - 0.12, s.z); g.rotation.y = s.rot; g.scale.setScalar(s.scale || 1.15);
    scene.add(g); list.push(g);
    world.colliders.push({ c: new THREE.Vector3(s.x, y + 0.9 * (s.scale || 1.15), s.z), s: new THREE.Vector3(0.8, 1.1, 0.8).multiplyScalar(s.scale || 1.15), rot: s.rot });
  }
  return list;
}

// ---------- F. Cartelli dei servizi sul fondale, lontani dal relitto (testi come sul sito, nella lingua della pagina) ----------
function wrap(g, text, maxW) {
  const words = String(text).split(/\s+/), lines = []; let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}
export async function buildServiceSigns(scene, world, tex, spots, services, head) {
  if (!services.length || !spots.length) return [];
  try { await document.fonts.load('800 40px Montserrat'); await document.fonts.load('600 20px Montserrat'); } catch (_) { /* font di riserva */ }
  const logo = await new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = '/img/logo-casco.png?v=c85f74'; });
  const steel = new THREE.MeshStandardMaterial({ color: 0x8f9a9f, metalness: 0.9, roughness: 0.5 });
  const baseM = new THREE.MeshStandardMaterial({ map: tex.rock.map, color: 0x9a9a90, roughness: 1 });
  const list = [];
  spots.forEach((p, i) => {
    const sv = services[i % services.length];
    const t = canvasTex(1024, 640, (g, w, h) => {
      g.fillStyle = NAVY; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(220,239,245,.5)'; g.lineWidth = 6; g.strokeRect(22, 22, w - 44, h - 44);
      // intestazione: logo + ANFIBIASUB + tipo di lavori
      if (logo) { g.save(); g.beginPath(); g.arc(112, 112, 58, 0, 7); g.clip(); g.drawImage(logo, 54, 54, 116, 116); g.restore(); g.strokeStyle = CYAN; g.lineWidth = 4; g.beginPath(); g.arc(112, 112, 58, 0, 7); g.stroke(); }
      wordmark(g, 196, 120, 56);
      g.fillStyle = 'rgba(220,239,245,.7)'; g.font = '600 24px Montserrat, Arial'; g.textAlign = 'left'; g.fillText(head, 198, 156);
      g.fillStyle = CYAN; g.fillRect(60, 200, w - 120, 4);
      // servizio
      g.fillStyle = ICE; g.font = '800 64px Montserrat, Arial';
      const title = wrap(g, sv[0].toUpperCase(), w - 120).slice(0, 2);
      title.forEach((l, k) => g.fillText(l, 60, 282 + k * 70));
      g.fillStyle = 'rgba(220,239,245,.82)'; g.font = '600 30px Montserrat, Arial';
      const y0 = 282 + title.length * 70 + 4;
      wrap(g, sv[1], w - 120).slice(0, 3).forEach((l, k) => g.fillText(l, 60, y0 + k * 40));
      g.fillStyle = CYAN; g.font = '600 30px Montserrat, Arial'; g.fillText('www.anfibiasub.it', 60, h - 50);
      grime(g, w, h, 2.5);
    });
    const face = new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, metalness: 0.05, color: 0xb8c2c6 });
    const g = new THREE.Group();
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 0.05), [steel, steel, steel, steel, face, steel]); panel.position.y = 1.75; panel.rotation.x = -0.08; g.add(panel);
    for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 8), steel); leg.position.set(s * 1.05, 1.05, -0.06); g.add(leg); }
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.28, 0.7), baseM); base.position.y = 0.12; g.add(base);
    const y = heightAt(p.x, p.z);
    g.position.set(p.x, y - 0.06, p.z);
    g.rotation.y = p.rot ?? Math.atan2(-p.x, -p.z);     // rivolto verso il relitto
    g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    scene.add(g); list.push(g);
    world.colliders.push({ c: new THREE.Vector3(p.x, y + 1.2, p.z), s: new THREE.Vector3(1.35, 1.3, 0.35), rot: g.rotation.y });
  });
  return list;
}
