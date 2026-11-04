// ABYSS — Il relitto dimenticato. Motore principale e macchina a stati.
import * as THREE from '../vendor/three/three.module.min.js';
import { CFG, CODE, bearing } from './config.js';
import { t as tr, L as TX } from './i18n.js';
import { addCaustics, makeBeam, CAUSTIC } from './look.js';
import { makeTextures, logbookPage } from './textures.js';
import { buildWorld, collideWorld } from './world.js';
import { buildWreck, makeHelmet } from './wreck.js';
import { buildArtifacts } from './artifacts.js';
import { buildLandmarks, modelsReady } from './landmarks.js';
import { buildFish } from './fish.js';
import { buildShark, buildBabyShark } from './shark.js';
import { buildAds, buildStatues, buildServiceSigns } from './ads.js';
import { buildLiftBags, buildPlane, buildGate, buildViewModels, createSpear, buildDeco } from './extras.js';
import { createControls } from './controls.js';
import { createSolids } from './solid.js';
import { createAudio } from './audio.js';
import { initInstall } from './install.js';

const $ = (s) => document.querySelector(s);
const root = $('#abyss');
const canvas = $('#ab-c');
const mobile = matchMedia('(pointer: coarse)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const Q = { mobile, particles: mobile ? 1600 : 4200, tex: mobile ? 256 : 512, shadows: !mobile };

// ---------------- stato ----------------
// phase: 1 = tre reperti e botola, 2 = botola aperta (entrare nella camera), 3 = giornale letto (cercare il cofanetto),
// 4 = cofanetto aperto (andare al cancello e sparare al lucchetto), 5 = cancello aperto (attraversarlo), 6 = Missione 1 finita
const S = { state: 'INTRO', prev: null, t: 0, phase: 1, air: 220, reserveSaid: false, found: [], hatchSeen: false, reached: false, torch: false, torchTouched: false, panel: null, inspect: null, seq: null, fpsN: 0, fpsT: 0, hintT: 0, inK: 0, wasIn: false };
const setState = (s) => { S.prev = S.state; S.state = s; root.dataset.state = s; };

// ---------------- renderer ----------------
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
} catch (e) {
  $('#ab-start').textContent = tr('nowebgl');
  $('#ab-nowebgl').hidden = false;
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = Q.shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x1f6f8c, 0.03);
scene.background = new THREE.Color(0x1f6f8c);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 260);
scene.add(camera);

// riflessi ambientali per i metalli (gradiente acqua, niente immagini esterne)
{
  const envScene = new THREE.Scene();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: 'varying vec3 v; void main(){ v = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'varying vec3 v; void main(){ float h = normalize(v).y; vec3 c = mix(vec3(.01,.03,.05), vec3(.25,.6,.75), smoothstep(-.2,.9,h)); c += vec3(.9,1.,1.)*smoothstep(.93,1.,h)*2.; gl_FragColor = vec4(c,1.); }',
  }));
  envScene.add(sky);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(envScene, 0.02).texture;
  pm.dispose();
}

const hemi = new THREE.HemisphereLight(0x6fc8e8, 0x0b1a22, 1.2);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xbfefff, 1.5);
sun.position.set(10, 40, 6); scene.add(sun);

// torcia: vera luce che illumina le geometrie
const torch = new THREE.SpotLight(0xeaf4ff, 0, CFG.torch.range, CFG.torch.angle, 0.6, 1.4);
torch.castShadow = Q.shadows;
torch.shadow.mapSize.set(1024, 1024);
torch.shadow.camera.near = 0.3; torch.shadow.camera.far = CFG.torch.range;
torch.shadow.bias = -0.0008; torch.shadow.normalBias = 0.03;
scene.add(torch, torch.target);
const TORCH_I = 10;
// fascio della torcia visibile nell'acqua
const beam = makeBeam(CFG.torch.angle, CFG.torch.range);
camera.add(beam); beam.position.set(0.18, -0.15, 0);
// pellicola: vignettatura e grana leggera da videocamera subacquea (solo CSS, nessun costo per la grafica 3D)
{
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const im = g.createImageData(128, 128);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  const f = document.createElement('div'); f.className = 'ab-film'; f.setAttribute('aria-hidden', 'true');
  f.style.setProperty('--grain', `url(${c.toDataURL()})`);
  canvas.after(f);
}

// ---------------- costruzione del mondo ----------------
const tex = makeTextures(Q.tex, renderer.capabilities.getMaxAnisotropy());
const photos = [];
// texture fotografiche/IA opzionali: sostituiscono l'immagine di quelle generate, i materiali restano gli stessi
{
  const map = { sabbia: tex.sand, roccia: tex.rock, ruggine: tex.rust, legno: tex.wood, terracotta: tex.clay };
  // superfici fotografiche (Poly Haven, CC0): colore + rilievo; finché non arrivano restano quelle generate
  const suf = mobile ? '_m' : '';
  for (const k in CFG.textures) {
    if (!CFG.textures[k] || !map[k]) continue;
    for (const [slot, ch] of [['map', 'c'], ['normalMap', 'n']]) {
      const t = map[k][slot]; if (!t) continue;
      const im = new Image();
      photos.push(new Promise((ok) => { im.onload = () => { t.dispose(); t.image = im; t.needsUpdate = true; ok(); }; im.onerror = ok; }));
      im.src = new URL(`./tex/${CFG.textures[k]}_${ch}${suf}.jpg?v=1`, import.meta.url).href;
    }
  }
}
const wreck = buildWreck(scene, tex);
const shipInv = new THREE.Matrix4().copy(wreck.ship.matrixWorld).invert();
const avoid = (x, z, r) => {
  for (const k in CFG.places) { const p = CFG.places[k]; if (Math.hypot(x - p.x, z - p.z) < 13 + r) return true; }   // i luoghi hanno rocce proprie
  for (const st of CFG.statues) if (Math.hypot(x - st.x, z - st.z) < 3 + r) return true;
  for (const sg of CFG.serviceSigns) if (Math.hypot(x - sg.x, z - sg.z) < 3 + r) return true;
  for (const lb of CFG.liftBags) if (Math.hypot(x - lb.x, z - lb.z) < 1.5 + r) return true;
  for (const d of CFG.deco.items) for (const c of d.copies || [d]) if (Math.hypot(x - c.x, z - c.z) < (d.m === 'albatross' ? 11 : d.m === 'car' ? 4 : 2) + r) return true;
  if (Math.hypot(x - CFG.plane.x, z - CFG.plane.z) < 6 + r) return true;
  { const gx = Math.cos(CFG.gate.ang) * CFG.gate.r, gz = Math.sin(CFG.gate.ang) * CFG.gate.r; if (Math.hypot(x - gx, z - gz) < 4 + r) return true;
    const along = x * Math.cos(CFG.gate.ang) + z * Math.sin(CFG.gate.ang), across = -x * Math.sin(CFG.gate.ang) + z * Math.cos(CFG.gate.ang);
    if (along > CFG.gate.r - 3 && Math.abs(across) < 4 + r) return true; }
  if (Math.hypot(x - CFG.ads.x, z - CFG.ads.z) < 3 + r || Math.hypot(x - CFG.ads.bx, z - CFG.ads.bz) < 2.5 + r) return true;
  const l = new THREE.Vector3(x, CFG.seabed, z).applyMatrix4(shipInv);
  if (l.x > -14 - r && l.x < 16 + r && Math.abs(l.z) < 5.5 + r) return true;            // impronta del relitto
  if (Math.hypot(x - CFG.line.bx, z - CFG.line.bz) < 2 + r) return true;                 // corpo morto
  if (wreck.anchorPos.distanceTo(new THREE.Vector3(x, wreck.anchorPos.y, z)) < 2.2 + r) return true;
  return false;
};
const world = buildWorld(scene, tex, Q, avoid);
const spots = buildLandmarks(scene, world, tex);
const arts = buildArtifacts(scene, wreck, tex, spots);
const fish = buildFish(scene, Q); world.updaters.push(fish);
const shark = buildShark(scene);
const baby = buildBabyShark(scene);   // squaletto che gira per la mappa e ogni 2/4 minuti attacca
const _sdir = new THREE.Vector3(), _noz = new THREE.Vector3(), _bub = new THREE.Vector3(), _mz = new THREE.Vector3(), _sd = new THREE.Vector3();
// aria: 220 bar per 50 minuti; il getto d'aria contro lo squalo consuma il 2% al secondo
const AIR = { max: 220, rate: 220 / (50 * 60), blast: 220 * 0.02, reserve: 50 };
buildStatues(scene, world, tex, CFG.statues, makeHelmet);
const adsReady = buildAds(scene, wreck, tex, CFG.ads);
// palloni di sollevamento (quello del cantiere + altri sparsi), aereo vicino al relitto, cancello della Missione 2
let bags = null;
const bagsReady = adsReady.then((o) => { bags = buildLiftBags(scene, tex, CFG.liftBags, o && o.pallone); });
const planeReady = buildPlane(scene, world, tex, CFG.plane);
let turtle = null;
const decoReady = buildDeco(scene, world, CFG.deco).then((d) => { world.updaters.push((dt, t) => d.update(dt, t)); turtle = d.turtle || null; });
let gate = null;
const gateReady = buildGate(scene, world, tex, CFG.gate, { title: tr('gate_t'), sub: tr('gate_s') }).then((g) => { gate = g.userData.gate; });
// in prima persona: mano con l'erogatore (getto d'aria) e fiocina; arpione
const VM = buildViewModels(camera);
const spear = createSpear(scene);
const solids = createSolids();
{ // animali: capsule lungo il corpo (si muovono, la forma esatta non serve)
  const ax = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3();
  const cap = (g, half, r) => () => { if (!g || !g.visible) return null; ax.set(0, 0, 1).applyQuaternion(g.quaternion); A.copy(g.position).addScaledVector(ax, -half); B.copy(g.position).addScaledVector(ax, half); return { a: A, b: B, r }; };
  solids.addShape(cap(shark.group, 1.0, 0.45));
  solids.addShape(cap(baby.group, 0.35, 0.16));
  solids.addShape(() => turtle ? cap(turtle, 0.35, 0.4)() : null);
}
const signsReady = buildServiceSigns(scene, world, tex, CFG.serviceSigns, TX.srv || [], TX.srv_head || '');
// rotta e distanza scritte nel giornale di bordo: calcolate dalla posizione vera di poppa e arco
const LOG = (() => { const a = wreck.sternWorld(), b = arts.casket.home.pos; return { deg: bearing(a, b), m: Math.hypot(b.x - a.x, b.z - a.z) }; })();

// ---------------- giocatore ----------------
const P = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: 0, tyaw: 0, tpitch: 0 };
function resetPlayer() {
  P.pos.set(CFG.start.x, CFG.start.y, CFG.start.z); P.vel.set(0, 0, 0);
  P.yaw = P.tyaw = CFG.start.yaw; P.pitch = P.tpitch = CFG.start.pitch;
}
resetPlayer();

const audio = createAudio();

// ---------------- statistiche anonime delle partite (nessun cookie, nessun dato personale) ----------------
// Il gioco manda al server: inizio, un aggiornamento al minuto e la fine della partita, con durata, fase raggiunta,
// esito, morti, lingua e tipo di dispositivo. Le partite fatte col trucco di prova sono segnate e si possono escludere.
const stats = (() => {
  const url = (root.dataset.api || '').replace(/voto$/, 'partita');
  let id = null, sec = 0, sent = 0, last = performance.now(), esito = '', ended = false, prova = false;
  const morti = { squalo: 0, aria: 0, pallone: 0 };
  const post = (ev) => {
    if (!id || !url) return;
    const body = JSON.stringify({ id, ev, sec: Math.round(sec), fase: S.phase, reperti: S.found.length, esito, morti, lingua: document.documentElement.lang, dev: controls.touch ? 'telefono' : 'pc', prova });
    try { fetch(url, { method: 'POST', body, keepalive: true, mode: 'no-cors', credentials: 'omit' }).catch(() => {}); } catch (_) { /* niente */ }
  };
  const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  return {
    start() { id = newId(); sec = 0; sent = 0; esito = ''; ended = false; prova = false; morti.squalo = morti.aria = morti.pallone = 0; post('start'); },
    // tempo vero (orologio), contato solo mentre si gioca con la pagina in primo piano
    tick(active) { const now = performance.now(), d = Math.min(5, (now - last) / 1000); last = now; if (!id || !active || document.hidden) return; sec += d; if (sec - sent >= 60) { sent = sec; post('ping'); } },
    death(r) { if (!id) return; if (morti[r] !== undefined) morti[r]++; esito = r; post('ping'); },
    test() { prova = true; post('ping'); },
    end(e) { if (!id || ended) return; ended = true; if (e) esito = e; post('end'); },
    flush() { if (id) post('ping'); },
    get id() { return id; },
  };
})();
const controls = createControls(canvas, root, {
  escape() {
    if (S.state === 'DEAD') return;
    if (S.panel) { closePanel(); return; }
    if (S.state === 'PAUSED') resume(); else if (canPause()) pause();
  },
  interact() { if (S.state === 'EXPLORATION' || S.state === 'DESCENT') interact(); },
  fire() { fire(); },
  torch() { toggleTorch(); },
  inventory() { if (S.panel === 'inv') closePanel(); else if (canPause()) { openPanel('inv'); controls.enabled = false; } },
  unlocked() { if (!S.panel && canPause() && !S.seq) pause(); },
  lockChange(l) { root.classList.toggle('is-locked', l); },
});
const canPause = () => ['DESCENT', 'EXPLORATION'].includes(S.state);

// ---------------- interfaccia ----------------
const ui = {
  depth: $('#ab-depth b'), count: $('#ab-count'), prompt: $('#ab-prompt'), msg: $('#ab-msg'), hint: $('#ab-hint'),
  veil: $('#ab-veil'), start: $('#ab-start'), bar: $('#ab-bar'), needle: $('.ab-man-needle'), obj: $('#ab-obj'), gauge: $('.ab-gauge'), strip: $('.ab-comp-strip'), hdg: $('#ab-hdg'), gateMk: $('.ab-comp-gate'),
};
// bussola da polso: striscia con i punti cardinali (2 px per grado, ripetuta)
{
  const cl = TX.compass || ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const lab = { 0: cl[0], 45: cl[1], 90: cl[2], 135: cl[3], 180: cl[4], 225: cl[5], 270: cl[6], 315: cl[7] };
  let h = '';
  for (let k = -1; k <= 1; k++) for (let d = 0; d < 360; d += 15) h += `<i style="left:${(d + k * 360) * 2}px"${lab[d] ? ' class="c"' : ''}>${lab[d] || ''}</i>`;
  ui.strip.innerHTML = h;
}
function objective() {
  const txt = S.phase === 1 ? (S.found.length < 3 ? tr('obj1', { n: S.found.length }) : tr('obj2'))
    : S.phase === 2 ? tr('obj3') : S.phase === 3 ? tr('obj4') : S.phase === 4 ? tr('obj6') : S.phase === 5 ? tr('obj7') : tr('obj5');
  ui.obj.textContent = txt;
}
let msgTimer = 0;
function toast(text, ms = 3600, cls = '') {
  ui.msg.textContent = text; ui.msg.className = 'ab-msg on ' + cls;
  clearTimeout(msgTimer); msgTimer = setTimeout(() => { ui.msg.className = 'ab-msg ' + cls; }, ms);
}
function updCount() {
  ui.count.textContent = `${S.found.length}/3`;
  root.querySelectorAll('.ab-count2').forEach((el) => { el.textContent = `${S.found.length}/3`; });
  root.querySelectorAll('.ab-slot').forEach((el, i) => {
    const a = CFG.artifacts[i], f = S.found.includes(a.id);
    el.classList.toggle('full', f);
    el.innerHTML = f ? `<img src="${a.img}" alt=""><b>${a.name}</b><span>${a.clue}</span>` : `<i></i><b>${tr('slot', { n: i + 1 })}</b><span>${tr('notfound')}</span>`;
  });
  root.querySelectorAll('[data-logbtn]').forEach((el) => { el.hidden = S.phase < 3; });
  objective();
  root.querySelectorAll('[data-clues]').forEach((el) => {
    el.innerHTML = S.found.length ? CFG.artifacts.filter((a) => S.found.includes(a.id)).map((a) => `<li>${a.clue}</li>`).join('') : `<li>${tr('noclues')}</li>`;
  });
}

function openPanel(name) {
  S.panel = name; controls.reset(); controls.release();
  root.querySelectorAll('.ab-panel').forEach((p) => { p.hidden = p.dataset.panel !== name; });
  const p = root.querySelector(`[data-panel="${name}"]`);
  const f = p && p.querySelector('button, [tabindex]'); if (f) setTimeout(() => { f.focus({ preventScroll: true }); p.scrollTop = 0; const bx = p.querySelector('.ab-box'); if (bx) bx.scrollTop = 0; }, 30);
}
function closePanel() {
  root.querySelectorAll('.ab-panel').forEach((p) => { p.hidden = true; });
  const was = S.panel; S.panel = null;
  if (was === 'pause') resume();
  else if (was === 'inv' || was === 'log') {
    if (was === 'log' && S.phase === 2) { S.phase = 3; updCount(); toast(tr('bearing', { deg: Math.round(LOG.deg) }), 6000); }
    if (S.state === 'READING') setState('EXPLORATION');
    controls.enabled = true; relock();
  }
}
function relock() {
  if (controls.touch || !canvas.requestPointerLock) return;
  try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (_) { /* il browser può rifiutare */ }
}
function pause() { if (!canPause()) return; setState('PAUSED'); controls.enabled = false; controls.reset(); controls.release(); openPanel('pause'); S.panel = 'pause'; }
function resume() {
  root.querySelectorAll('.ab-panel').forEach((p) => { p.hidden = true; });
  S.panel = null;
  if (S.state === 'PAUSED') { setState(S.prev === 'PAUSED' ? 'EXPLORATION' : S.prev); }
  controls.enabled = true; relock();
}

root.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (act === 'resume') resume();
  else if (act === 'close') closePanel();
  else if (act === 'pause') { if (S.state === 'PAUSED') resume(); else pause(); }
  else if (act === 'inv') { if (S.panel === 'inv') closePanel(); else if (canPause()) { openPanel('inv'); controls.enabled = false; } }
  else if (act === 'audio') { audio.setOn(!audio.on); root.classList.toggle('muted', !audio.on); }
  else if (act === 'torch') toggleTorch();
  else if (act === 'fire') fire();
  else if (act === 'interact') interact();
  else if (act === 'restart') restart();
  else if (act === 'continue') continueExploring();
  else if (act === 'log') openLog();
  else if (act === 'exit') { stats.end('uscita'); audio.stop(); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (_) { /* niente */ } location.href = '/'; }
  else if (act === 'dial-up' || act === 'dial-dn') {
    const i = +b.dataset.i; dial[i] = (dial[i] + (act === 'dial-up' ? 1 : 9)) % 10; drawDials(); audio.click(); $('#ab-lockfb').textContent = '';
  } else if (act === 'confirm') confirmCode();
});

// ---------------- torcia ----------------
function toggleTorch(force) {
  const v = typeof force === 'boolean' ? force : !S.torch;
  if (v === S.torch) return;
  S.torch = v; if (typeof force !== 'boolean') S.torchTouched = true;
  root.classList.toggle('torch-on', v);
  audio.torch();
}

// ---------------- fiocina (dopo il cofanetto) ----------------
function fire() {
  if (!S.gun || S.state !== 'EXPLORATION' || VM.reload > 0 || spear.on) return;
  camera.getWorldDirection(_sd);
  VM.muzzle(_mz); spear.fire(_mz, _sd);
  VM.setGunReady(false); VM.reload = 1.4; VM.recoil = 1;
  audio.shot(); world.bubbles.burst(_mz, 10, 0.08);
}
// pallone colpito: esplode; entro 3 metri l'onda d'urto è mortale
function explode(b) {
  bags.pop(b);
  const c = b.g.position.clone();
  world.bubbles.burst(c, 260, 1.5); audio.boom(); S.shake = 1;
  const d = camera.position.distanceTo(c);
  if (d < 3) setTimeout(() => die('pallone'), 250);
  else if (d < 12) S.shake = 1.4;
}
const segDist = (a, b, p) => { const ab = _bub.subVectors(b, a), l2 = ab.lengthSq(); const k = l2 > 0 ? Math.max(0, Math.min(1, _noz.subVectors(p, a).dot(ab) / l2)) : 0; return _noz.copy(a).addScaledVector(ab, k).distanceTo(p); };

// ---------------- avvio ----------------
function ready() {
  ui.start.disabled = false;
  ui.start.textContent = tr('start');
  root.classList.add('is-ready');
}
// iPhone: Safari non permette di nascondere la barra degli indirizzi; da icona sulla Home il gioco va a schermo intero
if (/iPhone|iPod/.test(navigator.userAgent) && !navigator.standalone) {
  const t = $('.ab-ios'); if (t) t.hidden = false;
  // Safari iPhone: la barra si riduce solo se la pagina scorre. Rendo la pagina un po' più alta dello schermo
  // (il gioco resta fisso): scorrendo verso l'alto la barra si riduce a una striscia e resta così durante il gioco.
  // solo sulla schermata iniziale la pagina ha un po' di spazio da scorrere: scorrendo, Safari riduce da solo
  // le proprie barre (non le tocchiamo noi) e il gioco si adatta subito alla nuova area (vedi resize).
  document.documentElement.classList.add('ios-scroll');
}
initInstall();
function goFullscreen() {
  const el = document.documentElement, f = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!f || document.fullscreenElement) return;
  try { const pr = f.call(el, { navigationUI: 'hide' }); if (pr && pr.then) pr.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (_) { /* niente */ } }).catch(() => {}); } catch (_) { /* il browser può rifiutare */ }
}
ui.start.addEventListener('click', () => {
  if (S.state !== 'INTRO') return;
  if (controls.touch) goFullscreen();
  audio.init();
  stats.start();
  setState('DIVE');
  root.classList.add('is-diving');
  // transizione: l'immagine si scurisce e "scende", poi si è in acqua
  setTimeout(() => {
    $('#ab-intro').hidden = true;
    startDescent();
    ui.veil.classList.remove('on');
  }, reduced ? 200 : 1600);
  ui.veil.classList.add('on');
});

function startDescent() {
  setState('DESCENT');
  controls.enabled = true;
  root.classList.add('is-playing');
  toast(tr('descent'), 3200, 'big');
  S.hintT = 0;
  ui.hint.classList.add('on');
  setTimeout(() => ui.hint.classList.remove('on'), 16000);
}

// ---------------- interazione ----------------
const _v = new THREE.Vector3(), _d = new THREE.Vector3();
function target() {
  camera.getWorldDirection(_d);
  let best = null, bd = 1e9;
  const cands = arts.list.filter((a) => !a.taken).map((a) => ({ kind: 'art', a, c: a.center, r: a.hitR }));
  if (S.phase === 1) cands.push({ kind: 'hatch', c: wreck.hatchWorld(), r: 1.1 * wreck.S });
  if (S.phase >= 2) { cands.push({ kind: 'book', c: wreck.bookWorld(), r: 0.45 }); cands.push({ kind: 'helmet', c: wreck.helmetWorld().add(new THREE.Vector3(0, 0.35, 0)), r: 0.45 }); }
  for (const k of cands) {
    _v.subVectors(k.c, camera.position); const dist = _v.length();
    if (dist > CFG.interactDist + k.r) continue;
    const ang = _v.normalize().angleTo(_d);
    if (ang < Math.atan(k.r / dist) + 0.12 && dist < bd) { best = k; bd = dist; }
  }
  return best;
}
function interact() {
  const k = target(); if (!k) { fire(); return; }
  if (k.kind === 'art') {
    if (k.a.final && S.phase < 3) { toast(tr('casket_early'), 5000); audio.clunk(); return; }
    pickup(k.a);
  } else if (k.kind === 'book') openLog();
  else if (k.kind === 'helmet') toast(tr('helmet'), 4500);
  else if (k.kind === 'hatch') {
    if (wreck.hatch.userData.open) return;
    if (S.found.length < 3) { toast(tr('need_clues')); audio.clunk(); return; }
    setState('LOCK_PUZZLE'); controls.enabled = false; drawDials(); openPanel('lock');
  }
}

function openLog() {
  const img = $('#ab-logimg');
  const portrait = viewSize().h > viewSize().w;
  if (img.dataset.mode !== String(portrait)) { img.src = logbookPage(LOG.deg, LOG.m, portrait, TX.logpage); img.dataset.mode = String(portrait); }
  setState('READING'); controls.enabled = false; openPanel('log');
}

function pickup(a) {
  if (a.taken) return;
  a.taken = true; if (!a.final) S.found.push(a.id);
  a.glint.material.opacity = 0;
  (a.extra || []).forEach((m) => { m.visible = false; });
  audio.pickup();
  // breve animazione: il reperto si solleva davanti alla maschera e ruota
  camera.attach(a.obj);
  S.inspect = { a, t: 0, lp: a.obj.position.clone() };
  setState('INSPECT'); controls.enabled = false; controls.reset();
  setTimeout(() => {
    toast(a.found, a.final ? 9000 : 6500, 'card');
  }, 400);
  updCount();
}

// ---------------- enigma della botola ----------------
const dial = [0, 0, 0];
function drawDials() {
  root.querySelectorAll('.ab-dial b').forEach((el, i) => { el.textContent = dial[i]; });
}
function confirmCode() {
  if (dial.every((d, i) => d === CODE[i])) {
    closePanelSilently();
    audio.click();
    openHatch();
  } else {
    audio.clunk();
    const p = $('.ab-lockbox'); p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake');
    $('#ab-lockfb').textContent = tr('lock_wrong');
  }
}
function closePanelSilently() { root.querySelectorAll('.ab-panel').forEach((p) => { p.hidden = true; }); S.panel = null; }
// pannello chiuso senza risolvere -> si torna a esplorare
root.querySelector('[data-panel="lock"] [data-act="close"]').addEventListener('click', () => { setState('EXPLORATION'); controls.enabled = true; });

// ---------------- sequenze animate ----------------
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function openHatch() {
  setState('OPENING');
  controls.enabled = false; controls.reset(); controls.release();
  wreck.hatch.userData.open = true;
  const hw = wreck.hatchWorld(), K = wreck.S;
  const view = hw.clone().addScaledVector(wreck.side, 2.2 * K).addScaledVector(wreck.fwd, 1.8 * K); view.y += 1.6 * K;
  const top = hw.clone().addScaledVector(wreck.fwd, 0.45 * K).addScaledVector(wreck.side, 0.25 * K); top.y += 1.3 * K;
  const helm = wreck.helmetWorld();
  const camFrom = camera.position.clone();
  const lookFrom = camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(3));
  const { dials, latches, lid } = wreck.hatch.userData;
  const dial0 = dials.map((d) => d.rotation.x);
  S.seq = {
    t: 0,
    run(t) {
      // 0-1.6 s: la visuale si avvicina alla botola
      const a = ease(Math.min(1, t / 1.6));
      if (t < 5.2) { camera.position.lerpVectors(camFrom, view, a); camera.lookAt(new THREE.Vector3().lerpVectors(lookFrom, hw, a)); }
      // 1.4-2.4 s: le ghiere ruotano fino al codice
      const b = Math.min(1, Math.max(0, (t - 1.4) / 1.0));
      dials.forEach((d, i) => { d.rotation.x = dial0[i] + ease(b) * (Math.PI * 2 * (1 + CODE[i] / 10)); });
      // 2.4-3.0 s: i fermi scorrono verso l'esterno
      const c = Math.min(1, Math.max(0, (t - 2.4) / 0.6));
      latches.forEach((l) => { l.m.position.set(Math.cos(l.a) * (0.73 + 0.22 * c), 0.04, Math.sin(l.a) * (0.73 + 0.22 * c)); });
      if (t > 2.4 && !S.seq.k1) { S.seq.k1 = 1; audio.clunk(); }
      // 3.0-6.0 s: la botola si solleva e si apre
      const d = Math.min(1, Math.max(0, (t - 3.0) / 3.0));
      wreck.hatch.rotation.z = ease(d) * 2.95;   // si ribalta e si appoggia aperta sulla mastra
      wreck.hatch.position.y = wreck.HY + 0.46 + Math.sin(Math.min(1, d * 3) * Math.PI) * 0.04;
      if (t > 3.0 && !S.seq.k2) {
        S.seq.k2 = 1; audio.creak(); wreck.chamber.visible = true;
        world.bubbles.burst(hw, 90, 0.9); sediment.start(hw);
      }
      // la camera nascosta si illumina
      wreck.chamber.userData.light.intensity = Math.min(1, Math.max(0, (t - 3.6) / 3)) * 10;
      wreck.chamber.userData.glow.intensity = Math.min(1, Math.max(0, (t - 3.6) / 3)) * 2.5;
      // 5.2-9 s: la visuale scende sopra l'apertura e guarda lo scafandro
      if (t >= 5.2) {
        const e2 = ease(Math.min(1, (t - 5.2) / 3.4));
        camera.position.lerpVectors(view, top, e2);
        camera.lookAt(new THREE.Vector3().lerpVectors(hw, helm, e2));
      }
      if (t > 6.2 && !S.seq.k3) { S.seq.k3 = 1; audio.ping(); }
      if (t > 9.2) {
        S.seq = null; S.phase = 2; wreck.setOpen(true); updCount();
        continueExploring();
        toast(tr('hatch_open'), 8000);
      }
    },
  };
}

// ---------------- morte: aria finita o attacco dello squalo ----------------
function die(reason) {
  if (S.state === 'DEAD') return;
  setState('DEAD'); S.seq = null; S.inspect = null;
  stats.death(reason === 'squalo' ? 'squalo' : reason === 'pallone' ? 'pallone' : 'aria');
  controls.enabled = false; controls.reset(); controls.release(); audio.hissOff();
  root.classList.add('is-dead');
  const why = reason === 'squalo' ? 'shark' : reason === 'pallone' ? 'bag' : 'air';
  $('#ab-dead-t').textContent = tr('dead_' + why + '_t');
  $('#ab-dead-p').textContent = tr('dead_' + why + '_p');
  setTimeout(() => openPanel('dead'), reason === 'squalo' ? 900 : 400);
}

// cofanetto aperto: bombole ricaricate e fiocina; ora bisogna aprire il cancello del ponte (Missione 2) sparando al lucchetto
function reward() {
  S.air = AIR.max; S.reserveSaid = false;
  if (!S.gun) { S.gun = true; root.classList.add('has-gun'); VM.setGunReady(true); VM.reload = 0; }
  setState('EXPLORATION'); controls.enabled = true;
  toast(controls.touch ? tr('gun_touch') : tr('gun_pc'), 8000);
  setTimeout(() => { if (S.phase === 4) toast(tr('to_gate'), 9000); }, 8500);
}
// il lucchetto colpito: il cancello si apre
function gateOpened() {
  S.phase = 5; updCount(); audio.clunk(); audio.creak(); toast(tr('gate_open'), 5000);
}

function finish() {
  setState('COMPLETED');
  stats.end('completata');
  controls.release();
  root.classList.add('is-done');
  openPanel('end');
}

// trucco per le prove: digitando 123456789 sulla tastiera (anche nel pannello della botola) la botola si apre subito
{
  let typed = '';
  addEventListener('keydown', (e) => {
    if (!/^[0-9]$/.test(e.key)) { typed = ''; return; }
    typed = (typed + e.key).slice(-12);
    if (!(typed.endsWith('123456789') || typed.endsWith('1234563789'))) return;
    typed = '';
    if (S.phase !== 1 || !['EXPLORATION', 'LOCK_PUZZLE', 'DESCENT'].includes(S.state) || wreck.hatch.userData.open) return;
    closePanelSilently();
    for (const a of arts.list) if (!a.final && !a.taken) { a.taken = true; S.found.push(a.id); a.glint.material.opacity = 0; a.obj.visible = false; (a.extra || []).forEach((m) => { m.visible = false; }); }
    S.reached = true; updCount(); stats.test(); openHatch();
  });
}

function continueExploring() {
  closePanelSilently(); controls.reset();
  root.classList.remove('is-done');
  // il sub riparte da sopra la botola, guardando dentro
  P.pos.copy(camera.position); P.vel.set(0, 0, 0);
  const d = camera.getWorldDirection(new THREE.Vector3());
  P.yaw = P.tyaw = Math.atan2(-d.x, -d.z); P.pitch = P.tpitch = Math.asin(Math.max(-1, Math.min(1, d.y)));
  setState('EXPLORATION'); controls.enabled = true;
}

function restart() {
  stats.end('ricominciata'); stats.start();
  closePanelSilently();
  root.classList.remove('is-done');
  S.found = []; S.phase = 1; S.hatchSeen = false; S.reached = false; S.seq = null; S.inspect = null;
  S.air = AIR.max; S.reserveSaid = false; shark.reset(); baby.reset(); audio.hissOff(); root.classList.remove('is-dead');
  S.gun = false; root.classList.remove('has-gun'); if (gate) gate.reset(); spear.clear(); if (bags) bags.reset(); S.shake = 0;
  arts.reset(); wreck.setOpen(false);
  const { dials, latches } = wreck.hatch.userData;
  wreck.hatch.userData.open = false; wreck.hatch.rotation.z = 0; wreck.hatch.position.y = wreck.HY + 0.46;
  dials.forEach((d) => { d.rotation.x = 0; });
  latches.forEach((l) => l.m.position.set(Math.cos(l.a) * 0.73, 0.04, Math.sin(l.a) * 0.73));
  wreck.chamber.visible = false; wreck.chamber.userData.light.intensity = 0; wreck.chamber.userData.glow.intensity = 0;
  dial.fill(0); $('#ab-lockfb').textContent = '';
  world.bubbles.clear(); sediment.stop();
  resetPlayer(); toggleTorch(false); S.torchTouched = false;
  updCount();
  ui.veil.classList.add('on');
  setTimeout(() => { ui.veil.classList.remove('on'); startDescent(); }, 700);
}

// ---------------- sondaggio di fine partita ----------------
{
  const poll = { altra: null, voto: 0 }, box = $('#ab-poll'), msg = box.querySelector('.ab-poll-msg'), send = box.querySelector('[data-poll="send"]');
  box.addEventListener('click', async (e) => {
    const st = e.target.closest('[data-star]');
    if (st) { poll.voto = +st.dataset.star; box.querySelectorAll('[data-star]').forEach((b) => b.classList.toggle('on', +b.dataset.star <= poll.voto)); return; }
    const b = e.target.closest('[data-poll]'); if (!b) return;
    if (b.dataset.poll === 'si' || b.dataset.poll === 'no') {
      poll.altra = b.dataset.poll === 'si';
      box.querySelectorAll('.ab-poll-q button').forEach((x) => x.classList.toggle('picked', x === b));
      send.disabled = false; send.classList.add('ab-btn-main');
      return;
    }
    if (b.dataset.poll === 'send' && poll.altra !== null) {
      send.disabled = true; msg.textContent = tr('sending');
      try {
        const r = await fetch(root.dataset.api, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...poll, commento: $('#ab-poll-txt').value, partita: stats.id }) });
        if (!r.ok) throw new Error(r.status);
        box.classList.add('sent');
        msg.textContent = poll.altra ? tr('thanks_yes') : tr('thanks_no');
      } catch (_) { send.disabled = false; msg.textContent = tr('send_fail'); }
    }
  });
}

// ---------------- nube di sedimento all'apertura ----------------
const sediment = (() => {
  const N = 260, pos = new Float32Array(N * 3), vel = [];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = document.createElement('canvas'); dot.width = dot.height = 64;
  { const g2 = dot.getContext('2d'), r = g2.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g2.fillStyle = r; g2.fillRect(0, 0, 64, 64); }
  const m = new THREE.PointsMaterial({ color: 0xb9a98a, size: 0.16, map: new THREE.CanvasTexture(dot), transparent: true, opacity: 0, depthWrite: false });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts);
  let t = -1;
  return {
    start(c) { t = 0; for (let i = 0; i < N; i++) { pos.set([c.x, c.y - 0.2, c.z], i * 3); const a = Math.random() * 7, s = Math.random(); vel[i] = new THREE.Vector3(Math.cos(a) * s * 1.2, Math.random() * 1.4 + 0.2, Math.sin(a) * s * 1.2); } },
    stop() { t = -1; m.opacity = 0; },
    update(dt) {
      if (t < 0) return; t += dt;
      for (let i = 0; i < N; i++) { const v = vel[i]; v.multiplyScalar(Math.exp(-dt * 1.2)); v.y -= dt * 0.12; pos[i * 3] += v.x * dt; pos[i * 3 + 1] += v.y * dt; pos[i * 3 + 2] += v.z * dt; }
      g.attributes.position.needsUpdate = true;
      m.opacity = Math.min(0.32, t * 2) * Math.max(0, 1 - t / 14);
      if (t > 14) t = -1;
    },
  };
})();

// ---------------- ciclo principale ----------------
const clock = new THREE.Clock();
const fogShallow = new THREE.Color(0x1e6e9f), fogDeep = new THREE.Color(0x03101b), tmpC = new THREE.Color();
const fwd = new THREE.Vector3(), right = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), acc = new THREE.Vector3(), before = new THREE.Vector3();
let breath = 0, lastBreathPhase = -1;

function tick() {
  const raw = Math.min(clock.getDelta(), S.dtMax || 0.05);
  const paused = S.state === 'PAUSED' || document.hidden;
  const dt = paused ? 0 : raw;
  S.t += dt;
  const t = S.t;
  const playing = ['DESCENT', 'EXPLORATION'].includes(S.state);
  stats.tick(playing || S.state === 'READING' || S.state === 'LOCK_PUZZLE' || S.state === 'INSPECT' || S.state === 'OPENING');

  // --- movimento del sub ---
  if (!S.seq && S.state !== 'COMPLETED') {
    const l = controls.consumeLook();
    const sens = controls.touch ? 0.0042 : 0.0022;
    if (playing) { P.tyaw -= l.dx * sens; P.tpitch = Math.max(-1.45, Math.min(1.45, P.tpitch - l.dy * sens)); }
    if (playing && controls.stick) {   // joystick destro: gira e inclina in modo continuo
      const sx = controls.stick.x, sy = controls.stick.y;
      P.tyaw -= sx * Math.abs(sx) * 2.0 * dt; P.tpitch = Math.max(-1.45, Math.min(1.45, P.tpitch - sy * Math.abs(sy) * 1.35 * dt));
    }
    const k = 1 - Math.exp(-dt * 16);
    P.yaw += (P.tyaw - P.yaw) * k; P.pitch += (P.tpitch - P.pitch) * k;
    camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ');

    camera.getWorldDirection(fwd);
    right.crossVectors(fwd, UP).normalize();
    acc.set(0, 0, 0);
    if (playing) {
      const m = controls.move;
      acc.addScaledVector(fwd, m.f).addScaledVector(right, m.r).addScaledVector(UP, m.u);
      if (acc.lengthSq() > 1) acc.normalize();
      acc.multiplyScalar(CFG.swim.accel * (controls.fast ? CFG.swim.fast : 1));
      if (m.u === 0 && m.f === 0 && -P.pos.y < 22 && S.state === 'DESCENT') acc.y -= 0.25;   // leggermente negativo in discesa
      if (!S.hintDone && (m.f || m.r || m.u)) { S.hintDone = true; setTimeout(() => ui.hint.classList.remove('on'), 4000); }
    }
    P.vel.addScaledVector(acc, dt);
    P.vel.multiplyScalar(Math.exp(-CFG.swim.drag * dt));
    before.copy(P.pos).addScaledVector(P.vel, dt);
    P.pos.copy(before);
    collideWorld(world, P.pos, CFG.swim.radius);
    solids.collide(P.pos, CFG.swim.radius);          // ogni oggetto e animale ha la sua forma solida
    collideWorld(world, P.pos, CFG.swim.radius);
    wreck.collide(P.pos, CFG.swim.radius);
    const corr = before.sub(P.pos);                  // vettore della correzione (invertito)
    if (corr.lengthSq() > 1e-8) { corr.normalize(); const vn = P.vel.dot(corr); if (vn > 0) P.vel.addScaledVector(corr, -vn); }

    // galleggiamento e respiro
    breath = (t % 5.2) / 5.2;
    const bob = reduced ? 0 : Math.sin(t * 0.55) * 0.035 + Math.sin(breath * Math.PI * 2) * 0.025;
    camera.position.copy(P.pos); camera.position.y += bob;
    if (!reduced) camera.rotation.z = Math.sin(t * 0.37) * 0.012;
  }

  // --- inspection del reperto raccolto ---
  if (S.inspect) {
    const it = S.inspect; it.t += dt;
    const o = it.a.obj;
    const target = it.a.final ? new THREE.Vector3(0, -0.2, -0.9) : new THREE.Vector3(0, -0.06, -0.55);
    const k = ease(Math.min(1, it.t / 0.9));
    o.position.lerpVectors(it.lp, target, k);
    if (it.a.final) {
      o.rotation.y = 0.4 + Math.sin(it.t * 0.5) * 0.25; o.rotation.x = 0.35 * k; o.rotation.z = 0;
      const lid = o.userData.lid; if (lid) lid.rotation.x = -Math.min(1, Math.max(0, (it.t - 1.2) / 1.5)) * 1.9;
      if (it.t > 1.6 && !it.sfx) { it.sfx = 1; audio.finale(); }
      if (it.t > 7.5) { S.inspect = null; o.visible = false; scene.attach(o); S.phase = 4; updCount(); reward(); }
    } else {
      o.rotation.y += dt * 1.6; o.rotation.x = 0.6 * k;
    }
    if (!it.a.final && it.t > 2.6) {
      const s = Math.max(0, 1 - (it.t - 2.6) / 0.4); o.scale.setScalar(s * it.a.home.scale);
    }
    if (!it.a.final && it.t > 3.0) {
      o.visible = false; scene.attach(o); S.inspect = null;
      setState(S.reached ? 'EXPLORATION' : 'DESCENT'); controls.enabled = true;
      if (S.found.length === 3) setTimeout(() => toast(tr('all_found'), 5200), 6800);
      else setTimeout(() => toast(tr('count', { n: S.found.length }), 2600), 6800);
    }
  }

  if (S.seq) { S.seq.t += dt; S.seq.run(S.seq.t); }

  // --- profondità: colore, nebbia, luce ---
  const depth = Math.max(0, -camera.position.y);
  const dn = Math.min(1, depth / 30);
  tmpC.copy(fogShallow).lerp(fogDeep, Math.pow(dn, 0.65));
  scene.fog.color.copy(tmpC); scene.background.copy(tmpC);
  const lit = Math.pow(1 - dn, 1.6);
  scene.fog.density = 0.042 + dn * 0.024 + Math.max(0, depth - 30) * 0.0012;   // oltre i 30 m ancora più buio
  hemi.intensity = 1.1 * lit + 0.06;
  sun.intensity = 1.6 * lit * lit + 0.02;
  scene.environmentIntensity = 0.4 * lit + 0.05;
  world.surface.uniforms.uTime.value = t; world.surface.uniforms.uCam.value.copy(camera.position);
  CAUSTIC.uCaTime.value = t; CAUSTIC.uCaStr.value = 0.9 * lit + 0.2;
  beam.material.uniforms.uTime.value = t; beam.material.uniforms.uOn.value = Math.min(1, torch.intensity / TORCH_I);
  world.surface.uniforms.uFog.value.copy(tmpC); world.surface.uniforms.uDensity.value = scene.fog.density * 0.9;
  ui.depth.textContent = depth.toFixed(1).replace('.', TX.decimal || ',');
  ui.gauge.style.setProperty('--d', Math.min(1, depth / 50).toFixed(4));
  { const hd = ((Math.atan2(fwd.x, -fwd.z) * 180 / Math.PI) + 360) % 360; ui.strip.style.transform = `translateX(${-hd * 2}px)`; ui.hdg.textContent = String(Math.round(hd) % 360).padStart(3, '0') + '°'; }
  // segnale giallo sulla bussola: la direzione del cancello della Missione 2, finché non lo attraversi
  if (gate && (S.phase === 4 || S.phase === 5)) {
    const L = gate.lockPos(), bg = ((Math.atan2(L.x - P.pos.x, -(L.z - P.pos.z)) * 180 / Math.PI) + 360) % 360;
    const hd = ((Math.atan2(fwd.x, -fwd.z) * 180 / Math.PI) + 360) % 360, half = ui.gateMk.parentNode.clientWidth / 2 - 12;
    const dx = Math.max(-half, Math.min(half, (((bg - hd + 540) % 360) - 180) * 2));
    ui.gateMk.hidden = false; ui.gateMk.style.transform = `translateX(${dx}px)`;
  } else if (!ui.gateMk.hidden) ui.gateMk.hidden = true;
  audio.depth(depth);

  if (playing && !S.reached && depth > 23) {
    S.reached = true; setState('EXPLORATION'); toast(tr('started'), 3200, 'big');
  }
  if (!S.torchTouched && !S.torch && depth > CFG.torch.autoOnDepth && playing) toggleTorch(true);

  // --- torcia ---
  camera.getWorldDirection(fwd);
  const flick = reduced ? 1 : 1 + Math.sin(t * 23) * 0.012 + Math.sin(t * 7.3) * 0.015;
  // dentro la nave la torcia diventa molto più forte e larga, e si accende da sola entrando
  const inShip = playing && wreck.inside(P.pos);
  if (inShip && !S.wasIn && !S.torch) toggleTorch(true);
  S.wasIn = inShip;
  S.inK += ((inShip ? 1 : 0) - S.inK) * Math.min(1, dt * 3);
  torch.intensity = S.torch ? TORCH_I * (1 + (flick - 1) * (1 - S.inK)) * (1 + 3 * S.inK) : 0;   // dentro la nave niente tremolio
  torch.angle = CFG.torch.angle + 0.4 * S.inK; torch.penumbra = 0.6 + 0.3 * S.inK; torch.decay = 1.4 - 0.7 * S.inK;
  torch.position.copy(camera.position).addScaledVector(right, 0.18).addScaledVector(UP, -0.15);
  torch.target.position.copy(camera.position).addScaledVector(fwd, 10);
  world.particles.uniforms.uTime.value = t; world.particles.uniforms.uCam.value.copy(camera.position);
  world.particles.uniforms.uDir.value.copy(fwd); world.particles.uniforms.uTorch.value = S.torch ? 1 : 0;
  world.particles.uniforms.uAmb.value = 0.7 * (1 - dn) + 0.12;
  world.bubbles.mat.uniforms.uAmb.value = 0.9 * (1 - dn) + 0.35 + (S.torch ? 0.3 : 0);

  // --- bolle del respiro ---
  if (playing || S.state === 'INSPECT') {
    const ph = breath < 0.4 ? 0 : breath < 0.75 ? 1 : 2;
    if (ph !== lastBreathPhase) { lastBreathPhase = ph; if (ph === 0) audio.inhale(); if (ph === 1) audio.exhale(); }
    if (ph === 1 && Math.random() < 0.55) world.bubbles.emit(camera.position.clone().addScaledVector(fwd, 0.12).add(new THREE.Vector3(0, -0.12, 0)), 1);
  }

  // --- riflessi sui reperti e scoperta della botola ---
  for (const a of arts.list) {
    if (a.taken) continue;
    _v.subVectors(a.center, camera.position); const dist = _v.length();
    const cone = _v.normalize().dot(fwd);
    if (a.final && S.phase < 3) { a.glint.material.opacity = 0; continue; }
    const lit = S.torch && dist < 6.5 && cone > Math.cos(CFG.torch.angle * 0.55) ? 1 : 0;
    const tw = Math.pow(0.5 + 0.5 * Math.sin(t * 2.3 + (a.digit || 7)), 6);   // brevi bagliori, non un faro
    const want = lit * tw * 0.55 * Math.min(1, (6.5 - dist) / 3);
    a.glint.material.opacity += (want - a.glint.material.opacity) * Math.min(1, dt * 6);
  }
  if (playing && !S.hatchSeen) {
    const hw = wreck.hatchWorld(); _v.subVectors(hw, camera.position); const dist = _v.length();
    if (S.torch && dist < 9 && _v.normalize().dot(fwd) > 0.9) { S.hatchSeen = true; toast(tr('hatch_seen'), 6000); }
  }

  // --- suggerimento di interazione ---
  if (playing) {
    const k = target();
    if (k) {
      const what = k.kind === 'art' ? (k.a.final && S.phase < 3 ? tr('p_look') : tr('p_take', { name: k.a.name })) : k.kind === 'book' ? tr('p_book') : k.kind === 'helmet' ? tr('p_helmet') : (wreck.hatch.userData.open ? '' : tr('p_hatch'));
      ui.prompt.innerHTML = what ? `<kbd>${controls.touch ? '✋' : 'E'}</kbd> ${what}` : '';
      root.classList.toggle('can-act', !!what);
    } else { ui.prompt.innerHTML = ''; root.classList.remove('can-act'); }
  } else { root.classList.remove('can-act'); ui.prompt.innerHTML = ''; }

  for (const u of world.updaters) u(dt, t, camera);

  // --- aria nella bombola ---
  const breathing = ['DESCENT', 'EXPLORATION', 'INSPECT', 'READING', 'LOCK_PUZZLE', 'OPENING'].includes(S.state);
  if (breathing) {
    S.air -= AIR.rate * dt;
    if (controls.blast && playing && S.air > 0) {
      S.air -= AIR.blast * dt; audio.hissOn();
      // le bolle escono dall'erogatore tenuto in mano e partono in avanti
      VM.nozzle(_noz);
      for (let k = 0; k < 4; k++) world.bubbles.emit(_bub.copy(_noz).addScaledVector(fwd, 0.05 + Math.random() * (0.3 + VM.k * 0.6)), 1);
      if (shark.blast(camera.position, fwd)) { toast(tr('shark_gone'), 3500); }
      if (baby.blast(camera.position, fwd)) { toast(tr('baby_gone'), 3000); }
    } else audio.hissOff();
    if (!S.reserveSaid && S.air < AIR.reserve) { S.reserveSaid = true; toast(tr('reserve'), 4500); }
    if (S.air <= 0) { S.air = 0; die('aria'); }
  } else if (S.state !== 'DEAD') audio.hissOff();
  ui.bar.textContent = Math.ceil(S.air);
  ui.needle.style.transform = `rotate(${-135 + 270 * (S.air / AIR.max)}deg)`;
  root.classList.toggle('air-low', S.air < AIR.reserve);

  // --- squalo del fossato (attacca sempre da davanti: lo vedi arrivare) ---
  if (S.state !== 'DEAD') shark.update(dt, t, P.pos, {
    dir: camera.getWorldDirection(_sdir),
    warn() { audio.danger(); toast(controls.touch ? tr('shark_touch') : tr('shark_pc'), 5000); },
    charge() { audio.danger(); },
    hit() { audio.hit(); die('squalo'); },
  });
  sediment.update(dt);
  // squaletto: il tempo per il prossimo attacco scorre solo mentre si esplora
  if (S.state !== 'DEAD') baby.update(dt, t, P.pos, {
    dir: camera.getWorldDirection(_sdir), active: S.state === 'EXPLORATION' && !wreck.inside(P.pos),
    warn() { audio.danger(); toast(controls.touch ? tr('baby_touch') : tr('baby_pc'), 4500); },
    bite() { audio.hit(); S.air = Math.max(0, S.air - 20); S.shake = 0.9; toast(tr('baby_bite'), 4000); },
  });

  // --- mano con l'erogatore, fiocina, arpione, palloni ---
  VM.update(dt, t, !!(controls.blast && playing && S.air > 0), !!S.gun, camera.aspect);
  if (bags) bags.update(t);
  if (gate) { gate.update(dt); if (S.phase === 5 && S.state === 'EXPLORATION' && gate.crossed(P.pos)) { S.phase = 6; updCount(); finish(); } }
  spear.update(dt, (a, b) => {
    const x = bags && bags.hit(a, b); if (x) { explode(x); return true; }
    if (gate && !gate.isOpen() && segDist(a, b, gate.lockPos()) < 0.35) { gate.open(); gateOpened(); return true; }
    if (segDist(a, b, shark.group.position) < 1.3) { if (shark.scare()) toast(tr('shark_gone'), 3500); return true; }
    if (segDist(a, b, baby.group.position) < 0.7) { if (baby.scare()) toast(tr('baby_gone'), 3000); return true; }
    return false;
  });
  if (S.shake > 0) {
    S.shake = Math.max(0, S.shake - dt * 1.2);
    const k = S.shake * S.shake * 0.12;
    camera.position.x += (Math.random() - 0.5) * k; camera.position.y += (Math.random() - 0.5) * k; camera.position.z += (Math.random() - 0.5) * k;
  }

  if (S.state !== 'INTRO' && S.state !== 'DIVE') renderer.render(scene, camera);

  // --- qualità automatica: se gli fps sono bassi riduco risoluzione e ombre ---
  if (playing && S.fpsN >= 0) {
    S.fpsN++; S.fpsT += raw;
    if (S.fpsT > 4) {
      const fps = S.fpsN / S.fpsT;
      if (fps < 32) { renderer.setPixelRatio(1); torch.castShadow = false; renderer.shadowMap.enabled = false; }
      S.fpsN = -1;
    }
  }
  requestAnimationFrame(tick);
}

// Dimensioni reali disponibili: su Safari iPhone l'altezza cambia quando le barre del browser
// si riducono o si espandono. Uso visualViewport (se c'è) e aggiorno solo dimensioni e proiezione:
// la scena non viene mai ricreata, quindi niente ricaricamenti né salti.
let vw = 0, vh = 0, rq = 0;
function viewSize() {
  const v = window.visualViewport;
  return { w: Math.round(v ? v.width : innerWidth), h: Math.round(v ? v.height : innerHeight) };
}
function resize() {
  rq = 0;
  const { w, h } = viewSize();
  if (w === vw && h === vh) return;
  vw = w; vh = h;
  root.style.setProperty('--abh', h + 'px');            // altezza del contenitore = area visibile reale
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  world.particles.uniforms.uPR.value = renderer.getPixelRatio() * h / 900;
  world.bubbles.mat.uniforms.uPR.value = renderer.getPixelRatio() * h / 900;
}
const queueResize = () => { if (!rq) rq = requestAnimationFrame(resize); };
addEventListener('resize', queueResize);
addEventListener('orientationchange', () => { queueResize(); setTimeout(queueResize, 350); setTimeout(queueResize, 800); });
if (window.visualViewport) { visualViewport.addEventListener('resize', queueResize); visualViewport.addEventListener('scroll', queueResize); }
// durante l'immersione la pagina non deve scorrere né ingrandirsi; i pannelli con testo lungo restano scorrevoli
document.addEventListener('touchmove', (e) => {
  if (['INTRO', 'DIVE'].includes(S.state) || e.target.closest('.ab-box, .ab-logbox')) return;
  e.preventDefault();
}, { passive: false });
['gesturestart', 'gesturechange'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));
resize();
updCount();

// compilo shader e carico le texture prima dell'avvio, così la discesa non scatta
camera.position.copy(P.pos); camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
torch.intensity = 1;
renderer.compile(scene, camera);
renderer.render(scene, camera);
torch.intensity = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (canPause()) pause(); audio.sleep(); stats.flush(); } else audio.wake();
});
// pagina chiusa o abbandonata: il suono si spegne subito e la partita risulta chiusa
addEventListener('pagehide', () => { audio.stop(); stats.end('chiusa'); });
// tornando indietro col browser la pagina riparte pulita (il suono era stato spento)
addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });
requestAnimationFrame(tick);
Promise.allSettled([adsReady, signsReady, bagsReady, planeReady, gateReady, shark.ready, baby.ready, decoReady, ...photos, ...modelsReady]).then(() => {
  const inChamber = (o) => { for (let p = o; p; p = p.parent) if (p.name === 'chamber') return true; return false; };
  addCaustics(scene, inChamber);
  // tutti gli oggetti diventano solidi con la loro forma vera; restano solo gli ellissoidi del ponte di terra e del cancello
  shark.group.userData.noSolid = true; baby.group.userData.noSolid = true;
  solids.add(scene);
  for (let i = world.colliders.length - 1; i >= 0; i--) if (!world.colliders[i].keep) world.colliders.splice(i, 1);
  renderer.compile(scene, camera); ready();
});

// per i test automatici (nessun effetto sul gioco)
window.__abyss = { solids, get gate() { return gate; }, baby, VM, spear, fire, controls, finish, get bags() { return bags; }, shark, die, fish, THREE, scene, S, P, CODE, LOG, wreck, arts, spots, camera, pickup, toast, openHatch, openLog, setPos: (x, y, z, yaw, pitch) => { P.pos.set(x, y, z); P.vel.set(0, 0, 0); if (yaw !== undefined) { P.yaw = P.tyaw = yaw; P.pitch = P.tpitch = pitch; } } };
