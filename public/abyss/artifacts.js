// I reperti: modelli 3D generati (sostituibili con GLB), posizionati nei luoghi lontani dal relitto
import * as THREE from '../vendor/three/three.module.min.js';
import { compassCard, plateTex, tagTex } from './textures.js?v=1b0317d2';
import { CFG } from './config.js?v=1b0317d2';

function glintTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,240,200,1)'); r.addColorStop(0.15, 'rgba(255,220,150,0.6)'); r.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(255,240,210,0.9)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(64, 8); g.lineTo(64, 120); g.moveTo(8, 64); g.lineTo(120, 64); g.stroke();
  return new THREE.CanvasTexture(c);
}

function makeCompass(brass) {
  const g = new THREE.Group();
  const prof = [[0, 0], [0.13, 0], [0.15, 0.02], [0.155, 0.07], [0.14, 0.085], [0.125, 0.07], [0.12, 0.03], [0, 0.03]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 40), brass));
  const card = new THREE.Mesh(new THREE.CircleGeometry(0.118, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: compassCard(CFG.artifacts[0].digit), roughness: 0.7 }));
  card.position.y = 0.045; g.add(card);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.125, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9fc6cc, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.1 }));
  glass.position.y = 0.07; g.add(glass);
  const gimbal = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.012, 8, 40), brass); gimbal.rotation.x = Math.PI / 2 + 0.3; gimbal.position.y = 0.04; g.add(gimbal);
  return g;
}

function makePlate(brass, rust) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.05, 0.85, 6, 1, 4), rust);
  const p = hull.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + Math.sin(p.getX(i) * 2) * 0.05 + p.getZ(i) * p.getZ(i) * 0.08);
  hull.geometry.computeVertexNormals(); g.add(hull);
  const face = new THREE.MeshStandardMaterial({ map: plateTex(CFG.artifacts[1].digit), metalness: 0.85, roughness: 0.45 });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.28), [brass, brass, face, brass, brass, brass]);
  plate.position.set(0.1, 0.06, -0.05); g.add(plate);
  for (const [x, z] of [[-0.09, -0.17], [0.29, -0.17], [-0.09, 0.07], [0.29, 0.07]]) { const r = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), brass); r.position.set(x, 0.072, z); g.add(r); }
  return g;
}

function makeKey(brass) {
  const g = new THREE.Group();
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.016, 10, 28), brass); bow.rotation.x = Math.PI / 2; bow.position.x = -0.18; g.add(bow);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.3, 12).rotateZ(Math.PI / 2), brass); shaft.position.x = 0.02; g.add(shaft);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 12).rotateZ(Math.PI / 2), brass); collar.position.x = -0.1; g.add(collar);
  for (const [x, h] of [[0.12, 0.05], [0.155, 0.035]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.01, h), brass); b.position.set(x, 0, h / 2 + 0.01); g.add(b); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 6, 16), brass); ring.position.set(-0.24, 0, 0.02); ring.rotation.x = Math.PI / 2; g.add(ring);
  const tag = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tagTex(CFG.artifacts[2].digit), metalness: 0.8, roughness: 0.45 }));
  tag.position.set(-0.29, 0.004, 0.06); g.add(tag);
  g.scale.setScalar(1.25);
  return g;
}

function makeCasket(wood, brass) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.3), wood); body.position.y = 0.11; g.add(body);
  const lid = new THREE.Group(); lid.position.set(0, 0.22, -0.15); g.add(lid);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.07, 0.31), wood); top.position.set(0, 0.035, 0.155); lid.add(top);
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.02, 0.04), brass); band.position.set(0, 0.075, 0.155); lid.add(band);
  for (const x of [-0.2, 0.2]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.235, 0.31), brass); b.position.set(x, 0.11, 0); g.add(b); }
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.02), brass); lock.position.set(0, 0.17, 0.155); g.add(lock);
  g.userData.lid = lid;
  return g;
}

export function buildArtifacts(scene, wreck, tex, spots) {
  const brass = wreck.materials.brass.clone();
  brass.envMapIntensity = 0.45;                 // ottone opaco e ossidato: niente "luccichio da videogioco"
  const wood = new THREE.MeshStandardMaterial({ map: tex.wood.map, normalMap: tex.wood.normalMap, roughness: 0.9, color: 0x8a7a68 });
  const sandM = new THREE.MeshStandardMaterial({ map: tex.sand.map, normalMap: tex.sand.normalMap, roughness: 1 });
  const glint = glintTex();
  const list = [];
  const place = (def, obj, spot, hitR) => {
    obj.position.copy(spot.pos); obj.rotation.copy(spot.rot);
    obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(obj);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glint, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    sp.scale.setScalar(0.22); sp.position.copy(spot.pos).add(new THREE.Vector3(0, 0.08, 0)); scene.add(sp);
    const a = { ...def, obj, glint: sp, hitR, home: { pos: spot.pos.clone(), rot: spot.rot.clone(), scale: obj.scale.x }, center: spot.pos.clone().add(new THREE.Vector3(0, 0.08, 0)), taken: false, extra: spot.extra || [] };
    list.push(a);
    return a;
  };
  const def = (id) => CFG.artifacts.find((x) => x.id === id);

  // bussola: in fondo alla grotta, mezza sepolta
  place(def('bussola'), makeCompass(brass), spots.bussola, 0.5);
  { const a = list[list.length - 1]; const m = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 10).scale(1.3, 0.4, 0.9), sandM); m.position.copy(a.home.pos).add(new THREE.Vector3(0.1, 0.0, 0.06)); scene.add(m); a.extra.push(m); }
  // targhetta: accanto all'elicottero affondato
  place(def('targhetta'), makePlate(brass, wreck.materials.rust), spots.targhetta, 0.7);
  // chiave: tra le anfore, coperta in parte da un coccio
  place(def('chiave'), makeKey(brass), spots.chiave, 0.45);
  { const a = list[list.length - 1]; const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8).scale(1.6, 0.35, 1), sandM); m.position.copy(a.home.pos).add(new THREE.Vector3(0.14, 0.0, 0.05)); scene.add(m); a.extra.push(m); }
  // cofanetto del capitano (seconda missione): sotto l'arco di roccia
  const casket = place({ ...CFG.casket, final: true }, makeCasket(wood, brass), spots.cofanetto, 0.6);

  return {
    list, brass, casket,
    reset() {
      for (const a of list) {
        a.taken = false; a.obj.visible = true; a.obj.position.copy(a.home.pos); a.obj.rotation.copy(a.home.rot); a.obj.scale.setScalar(a.home.scale);
        if (a.obj.parent !== scene) scene.attach(a.obj);
        a.obj.position.copy(a.home.pos); a.obj.rotation.copy(a.home.rot);
        if (a.obj.userData.lid) a.obj.userData.lid.rotation.x = 0;
        a.extra.forEach((m) => { m.visible = true; });
      }
    },
  };
}
