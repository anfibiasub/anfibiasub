// Texture PBR generate al volo (albedo, normal, roughness/metalness).
// Sono il ripiego finché non ci sono texture fotografiche/modelli GLB definitivi.
import * as THREE from '../vendor/three/three.module.min.js';
import { tileFbm } from './noise.js?v=8b59fd59';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

function field(size, fn) {
  const f = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) f[y * size + x] = fn(x / size, y / size);
  return f;
}

function canvasTex(size, fill, srgb, aniso) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  fill(img.data);
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function normalTex(h, size, strength, aniso) {
  return canvasTex(size, (d) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const l = h[y * size + ((x - 1 + size) % size)], r = h[y * size + ((x + 1) % size)];
      const u = h[((y - 1 + size) % size) * size + x], dn = h[((y + 1) % size) * size + x];
      let nx = (l - r) * strength, ny = (u - dn) * strength, nz = 1;
      const len = Math.hypot(nx, ny, nz); nx /= len; ny /= len; nz /= len;
      const i = (y * size + x) * 4;
      d[i] = (nx * 0.5 + 0.5) * 255; d[i + 1] = (ny * 0.5 + 0.5) * 255; d[i + 2] = (nz * 0.5 + 0.5) * 255; d[i + 3] = 255;
    }
  }, false, aniso);
}

// colore per pixel: fn(i, x, y) -> [r,g,b] (0-255)
function colorTex(size, fn, aniso, srgb = true) {
  return canvasTex(size, (d) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = y * size + x, c = fn(i, x / size, y / size);
      d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255;
    }
  }, srgb, aniso);
}

export function makeTextures(size, aniso) {
  const T = {};

  // ---------- sabbia e sedimento ----------
  {
    const n = field(size, (u, v) => tileFbm(u * 8, v * 8, 8, 5));
    const w = field(size, (u, v) => tileFbm(u * 3 + 7, v * 3, 3, 3));
    const g = field(size, (u, v) => tileFbm(u * 64, v * 64, 64, 2));
    const h = new Float32Array(size * size);
    for (let i = 0; i < h.length; i++) {
      const v = Math.floor(i / size) / size;
      const rip = Math.sin((v * 7 + w[i] * 1.6) * Math.PI * 2) * 0.5 + 0.5;
      h[i] = rip * 0.35 + n[i] * 0.5 + g[i] * 0.15;
    }
    T.sand = {
      map: colorTex(size, (i) => {
        const k = 0.72 + n[i] * 0.45 + (h[i] - 0.5) * 0.25;
        const speck = g[i] > 0.8 ? 1.12 : g[i] < 0.2 ? 0.88 : 1;
        return [92 * k * speck, 86 * k * speck, 72 * k * speck].map((c) => clamp(c, 0, 255));
      }, aniso),
      normalMap: normalTex(h, size, 3.2, aniso),
    };
  }

  // ---------- roccia con concrezioni (coralligeno) ----------
  {
    const n = field(size, (u, v) => tileFbm(u * 6, v * 6, 6, 6));
    const m = field(size, (u, v) => tileFbm(u * 4 + 3, v * 4, 4, 4));
    const s = field(size, (u, v) => tileFbm(u * 32, v * 32, 32, 2));
    T.rock = {
      map: colorTex(size, (i) => {
        const base = 0.55 + n[i] * 0.6;
        let c = [92 * base, 88 * base, 80 * base];
        const algae = smooth(0.52, 0.68, m[i]);
        c = c.map((x, j) => mix(x, [52, 78, 62][j] * (0.7 + s[i] * 0.6), algae * 0.85));
        const pink = smooth(0.70, 0.78, s[i]) * (1 - algae);
        c = c.map((x, j) => mix(x, [150, 92, 104][j], pink * 0.7));
        return c.map((x) => clamp(x, 0, 255));
      }, aniso),
    };
    const hh = new Float32Array(size * size);
    for (let i = 0; i < hh.length; i++) hh[i] = n[i] * 0.8 + s[i] * 0.3;
    T.rock.normalMap = normalTex(hh, size, 4, aniso);
    T.rock.map.repeat.set(3, 2); T.rock.normalMap.repeat.set(3, 2);
  }

  // ---------- ferro arrugginito con incrostazioni ----------
  {
    const n = field(size, (u, v) => tileFbm(u * 5, v * 5, 5, 6));
    const p = field(size, (u, v) => tileFbm(u * 14 + 9, v * 14, 14, 4));
    const e = field(size, (u, v) => tileFbm(u * 3 + 1, v * 3 + 5, 3, 4));
    const h = new Float32Array(size * size);
    for (let i = 0; i < h.length; i++) h[i] = n[i] * 0.6 + smooth(0.55, 0.7, p[i]) * 0.5 + smooth(0.6, 0.75, e[i]) * 0.35;
    T.rust = {
      map: colorTex(size, (i) => {
        let c = [112, 68, 43].map((x) => x * (0.55 + n[i] * 0.7));             // ruggine #70442B
        c = c.map((x, j) => mix(x, [150, 78, 34][j], smooth(0.62, 0.8, p[i]) * 0.6)); // ruggine viva
        c = c.map((x, j) => mix(x, [26, 22, 20][j], smooth(0.5, 0.25, n[i]) * 0.7));  // ferro scuro
        const enc = smooth(0.58, 0.72, e[i]);
        c = c.map((x, j) => mix(x, [53, 87, 79][j] * (0.8 + p[i] * 0.6), enc * 0.8)); // verde ossidato / alghe
        const shell = smooth(0.82, 0.9, p[i]) * enc;
        c = c.map((x, j) => mix(x, [170, 165, 150][j], shell * 0.7));
        return c.map((x) => clamp(x, 0, 255));
      }, aniso),
      normalMap: normalTex(h, size, 5, aniso),
      orm: colorTex(size, (i) => {
        const enc = smooth(0.58, 0.72, e[i]);
        const r = clamp(0.75 + n[i] * 0.25 + enc * 0.2) * 255;
        const m = clamp(0.55 - smooth(0.55, 0.75, p[i]) * 0.4 - enc * 0.5) * 255;
        return [255, r, m];
      }, aniso, false),
    };
  }

  // ---------- legno marcio ----------
  {
    const grain = field(size, (u, v) => tileFbm(u * 2, v * 48, 2, 4));
    const k = field(size, (u, v) => tileFbm(u * 6 + 4, v * 6, 6, 5));
    const a = field(size, (u, v) => tileFbm(u * 10, v * 10 + 2, 10, 3));
    const h = new Float32Array(size * size);
    for (let i = 0; i < h.length; i++) h[i] = grain[i] * 0.7 + k[i] * 0.5 - smooth(0.6, 0.75, k[i]) * 0.5;
    T.wood = {
      map: colorTex(size, (i) => {
        const g = 0.55 + grain[i] * 0.6;
        let c = [70 * g, 56 * g, 44 * g];
        c = c.map((x, j) => mix(x, [26, 22, 20][j], smooth(0.62, 0.78, k[i]) * 0.8));  // marcio
        c = c.map((x, j) => mix(x, [56, 74, 58][j], smooth(0.56, 0.7, a[i]) * 0.7));  // patina algale
        return c.map((x) => clamp(x, 0, 255));
      }, aniso),
      normalMap: normalTex(h, size, 4, aniso),
    };
  }

  // ---------- ottone antico con patina ----------
  {
    const n = field(size, (u, v) => tileFbm(u * 6, v * 6, 6, 5));
    const p = field(size, (u, v) => tileFbm(u * 9 + 2, v * 9, 9, 5));
    const pat = (i) => smooth(0.5, 0.66, p[i]);
    T.brass = {
      map: colorTex(size, (i) => {
        let c = [176, 141, 87].map((x) => x * (0.75 + n[i] * 0.45));  // ottone #B08D57
        c = c.map((x, j) => mix(x, [60, 44, 30][j], smooth(0.45, 0.25, n[i]) * 0.6)); // brunitura
        c = c.map((x, j) => mix(x, [62, 112, 96][j] * (0.8 + n[i] * 0.4), pat(i) * 0.85)); // verderame
        return c.map((x) => clamp(x, 0, 255));
      }, aniso),
      orm: colorTex(size, (i) => [255, clamp(0.32 + pat(i) * 0.55 + n[i] * 0.1) * 255, clamp(1 - pat(i) * 0.85) * 255], aniso, false),
    };
  }

  // ---------- terracotta (anfore) con concrezioni ----------
  {
    const n = field(size, (u, v) => tileFbm(u * 6, v * 6, 6, 5));
    const e = field(size, (u, v) => tileFbm(u * 4 + 2, v * 4 + 7, 4, 4));
    const h = new Float32Array(size * size);
    for (let i = 0; i < h.length; i++) h[i] = n[i] * 0.5 + smooth(0.55, 0.7, e[i]) * 0.6;
    T.clay = {
      map: colorTex(size, (i) => {
        let c = [150, 92, 60].map((x) => x * (0.6 + n[i] * 0.55));
        const enc = smooth(0.55, 0.72, e[i]);
        c = c.map((x, j) => mix(x, [120, 118, 104][j] * (0.8 + n[i] * 0.4), enc * 0.8));     // concrezioni calcaree
        c = c.map((x, j) => mix(x, [60, 82, 64][j], smooth(0.75, 0.85, e[i]) * 0.6));        // alghe
        return c.map((x) => clamp(x, 0, 255));
      }, aniso),
      normalMap: normalTex(h, size, 4, aniso),
    };
  }

  // ---------- fasci di luce (gradiente verticale) ----------
  {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const gx = g.createLinearGradient(0, 0, 64, 0);
    gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 64, 256);
    T.ray = new THREE.CanvasTexture(c);
  }
  return T;
}

// ---------- simboli e incisioni (disegnati, non fotografie) ----------
export function drawRose(g, cx, cy, r, col) {
  g.save(); g.translate(cx, cy); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = r * 0.05;
  for (let k = 0; k < 8; k++) {
    const L = k % 2 ? r * 0.55 : r;
    g.rotate(Math.PI / 4);
    g.beginPath(); g.moveTo(0, -L); g.lineTo(r * 0.12, 0); g.lineTo(0, r * 0.12); g.lineTo(-r * 0.12, 0); g.closePath();
    k % 2 ? g.stroke() : g.fill();
  }
  g.beginPath(); g.arc(0, 0, r * 0.72, 0, Math.PI * 2); g.stroke();
  g.restore();
}
export function drawAnchor(g, cx, cy, r, col) {
  g.save(); g.translate(cx, cy); g.strokeStyle = col; g.lineWidth = r * 0.13; g.lineCap = 'round';
  g.beginPath(); g.arc(0, -r * 0.78, r * 0.17, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(0, -r * 0.6); g.lineTo(0, r * 0.85); g.stroke();
  g.beginPath(); g.moveTo(-r * 0.45, -r * 0.35); g.lineTo(r * 0.45, -r * 0.35); g.stroke();
  g.beginPath(); g.arc(0, r * 0.2, r * 0.68, Math.PI * 0.12, Math.PI * 0.88); g.stroke();
  g.restore();
}
export function drawKey(g, cx, cy, r, col) {
  g.save(); g.translate(cx, cy); g.rotate(-Math.PI / 4); g.strokeStyle = col; g.lineWidth = r * 0.13; g.lineCap = 'round';
  g.beginPath(); g.arc(-r * 0.55, 0, r * 0.3, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(-r * 0.25, 0); g.lineTo(r * 0.85, 0); g.stroke();
  g.beginPath(); g.moveTo(r * 0.55, 0); g.lineTo(r * 0.55, r * 0.3); g.moveTo(r * 0.78, 0); g.lineTo(r * 0.78, r * 0.25); g.stroke();
  g.restore();
}
export const SYMBOLS = { rosa: drawRose, ancora: drawAnchor, chiave: drawKey };

function engraved(g, fn) {
  // incisione: ombra scura spostata + luce, così sembra scavata nel metallo
  g.save(); g.translate(2, 2); fn('rgba(20,12,4,0.85)'); g.restore();
  fn('rgba(40,26,10,0.95)');
}

export function symbolCanvas(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// quadrante della bussola con la cifra incisa
export function compassCard(digit) {
  return symbolCanvas(512, 512, (g) => {
    const r = g.createRadialGradient(256, 256, 40, 256, 256, 256);
    r.addColorStop(0, '#b9ab8a'); r.addColorStop(0.8, '#8c7d5e'); r.addColorStop(1, '#3c3426');
    g.fillStyle = r; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${40 + Math.random() * 40},${50 + Math.random() * 40},30,${Math.random() * 0.25})`; g.fillRect(Math.random() * 512, Math.random() * 512, 3, 3); }
    g.strokeStyle = '#2b2418'; g.lineWidth = 3;
    for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2, L = k % 8 ? 14 : 30; g.beginPath(); g.moveTo(256 + Math.cos(a) * 232, 256 + Math.sin(a) * 232); g.lineTo(256 + Math.cos(a) * (232 - L), 256 + Math.sin(a) * (232 - L)); g.stroke(); }
    drawRose(g, 256, 256, 170, '#2b2418');
    g.fillStyle = '#2b2418'; g.font = 'bold 44px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('N', 256, 46);
    g.fillStyle = '#7a1d12'; g.font = 'bold 120px Georgia, serif'; g.fillText(String(digit), 256, 262);
  });
}

// targhetta in ottone: ancora + cifra
export function plateTex(digit) {
  return symbolCanvas(768, 512, (g) => {
    const lg = g.createLinearGradient(0, 0, 768, 512); lg.addColorStop(0, '#a8844e'); lg.addColorStop(1, '#6f5532');
    g.fillStyle = lg; g.fillRect(0, 0, 768, 512);
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${40 + Math.random() * 30},${90 + Math.random() * 40},${70 + Math.random() * 30},${Math.random() * 0.35})`; const s = 2 + Math.random() * 10; g.beginPath(); g.arc(Math.random() * 768, Math.random() * 512, s, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(40,26,10,0.8)'; g.lineWidth = 8; g.strokeRect(36, 36, 696, 440);
    [[60, 60], [708, 60], [60, 452], [708, 452]].forEach(([x, y]) => { g.fillStyle = '#4a3a22'; g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); g.fillStyle = '#c9a56a'; g.beginPath(); g.arc(x - 4, y - 4, 6, 0, 7); g.fill(); });
    engraved(g, (c) => drawAnchor(g, 230, 256, 150, c));
    engraved(g, (c) => { g.fillStyle = c; g.font = 'bold 260px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(digit), 530, 270); });
  });
}

// targhetta legata alla chiave
export function tagTex(digit) {
  return symbolCanvas(256, 256, (g) => {
    g.fillStyle = '#9b7a48'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(50,100,80,${Math.random() * 0.4})`; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 6, 0, 7); g.fill(); }
    engraved(g, (c) => drawKey(g, 80, 128, 62, c));
    engraved(g, (c) => { g.fillStyle = c; g.font = 'bold 120px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(digit), 180, 136); });
  });
}

// rullo numerato 0-9 per le ghiere della botola
export function dialTex() {
  // cifre 0-9 intorno alla circonferenza del rullo
  return symbolCanvas(1024, 128, (g) => {
    g.fillStyle = '#8d6d3f'; g.fillRect(0, 0, 1024, 128);
    for (let k = 0; k < 10; k++) {
      g.fillStyle = 'rgba(30,20,8,0.35)'; g.fillRect(k * 102.4, 0, 3, 128);
      g.fillStyle = '#2a1d0c'; g.font = 'bold 76px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.save(); g.translate(k * 102.4 + 51, 64); g.rotate(-Math.PI / 2); g.fillText(String(k), 0, 4); g.restore();
    }
  });
}

export function symbolPlate(name) {
  return symbolCanvas(256, 256, (g) => {
    g.fillStyle = '#a58451'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(50,100,80,${Math.random() * 0.35})`; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 5, 0, 7); g.fill(); }
    engraved(g, (c) => SYMBOLS[name](g, 128, 128, 88, c));
  });
}

// ---- giornale di bordo ----
function parchment(g, w, h) {
  const r = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
  r.addColorStop(0, '#d9c9a3'); r.addColorStop(0.7, '#bfa878'); r.addColorStop(1, '#7d6643');
  g.fillStyle = r; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h / 250; i++) { g.fillStyle = `rgba(${90 + Math.random() * 40},${70 + Math.random() * 30},40,${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3); }
  for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(70,60,40,${0.05 + Math.random() * 0.08})`; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 20 + Math.random() * 60, 15 + Math.random() * 40, Math.random() * 3, 0, 7); g.fill(); }
}
// pagina piccola (texture sul libro nella camera): solo righe di scrittura e uno schizzo
export function logbookTex() {
  return symbolCanvas(256, 360, (g, w, h) => {
    parchment(g, w, h);
    g.strokeStyle = 'rgba(40,28,15,0.75)'; g.lineWidth = 1.4;
    for (let y = 30; y < 170; y += 12) { g.beginPath(); let x = 18; g.moveTo(x, y); while (x < w - 20) { x += 4 + Math.random() * 6; g.lineTo(x, y + Math.random() * 3 - 1.5); } g.stroke(); }
    g.lineWidth = 2; g.beginPath(); g.moveTo(40, 320); g.lineTo(80, 210); g.lineTo(100, 210); g.lineTo(110, 320); g.moveTo(150, 320); g.lineTo(160, 205); g.lineTo(185, 205); g.lineTo(215, 320); g.moveTo(70, 210); g.quadraticCurveTo(135, 170, 195, 205); g.stroke();
  });
}
// pagina grande leggibile, con la rotta vera calcolata dal gioco
export function logbookPage(deg, meters, portrait, text) {
  const c = document.createElement('canvas'); c.width = 1200; c.height = 820;
  const g = c.getContext('2d'); parchment(g, 1200, 820);
  g.strokeStyle = 'rgba(60,40,20,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(600, 30); g.lineTo(600, 790); g.stroke();
  const ink = '#2b1c0e';
  g.fillStyle = ink;
  // testo nella lingua della pagina (13 righe: 10 di diario, 2 con rotta e distanza, l'etichetta "il blu")
  const T = text || ['', '', '', '', '', '', '', '', '', '', '{deg}', '{m}', ''];
  const fill = (str, x, y, font, size) => { let sz = size; do { g.font = `${font} ${sz}px Georgia, serif`; sz -= 1; } while (g.measureText(str).width > 510 && sz > 18); g.fillText(str, x, y); };
  T.slice(0, 10).forEach((t, i) => fill(t, 60, 100 + i * 52, 'italic', 34));
  const v = (str) => str.replace('{deg}', Math.round(deg)).replace('{m}', Math.round(meters / 5) * 5);
  fill(v(T[10]), 60, 670, 'italic bold', 38);
  fill(v(T[11]), 60, 722, 'italic bold', 38);
  // schizzo dell'arco
  g.strokeStyle = ink; g.lineWidth = 4; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(700, 560); g.lineTo(745, 330); g.lineTo(790, 320); g.lineTo(805, 560);
  g.moveTo(900, 560); g.lineTo(915, 315); g.lineTo(965, 325); g.lineTo(1010, 560);
  g.moveTo(735, 335); g.bezierCurveTo(800, 250, 900, 250, 975, 330); g.moveTo(745, 300); g.bezierCurveTo(820, 210, 900, 215, 985, 300); g.stroke();
  g.setLineDash([10, 10]); g.beginPath(); g.moveTo(640, 600); g.lineTo(1150, 600); g.lineTo(1150, 720); g.stroke(); g.setLineDash([]);
  g.font = 'italic 26px Georgia, serif'; g.fillText(T[12] || '', 1060, 760);
  // X del cofanetto
  g.lineWidth = 6; g.strokeStyle = '#7a1d12'; g.beginPath(); g.moveTo(835, 520); g.lineTo(870, 555); g.moveTo(870, 520); g.lineTo(835, 555); g.stroke();
  // rosa con la rotta
  g.strokeStyle = ink; g.lineWidth = 3; drawRose(g, 1040, 140, 80, ink);
  g.save(); g.translate(1040, 140); g.rotate(deg * Math.PI / 180); g.strokeStyle = '#7a1d12'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -110); g.lineTo(-10, -92); g.moveTo(0, -110); g.lineTo(10, -92); g.stroke(); g.restore();
  g.fillStyle = ink; g.font = 'bold 28px Georgia, serif'; g.fillText('N', 1030, 40);
  if (portrait) {   // su telefono in verticale: le due pagine una sotto l'altra, così il testo resta leggibile
    const c2 = document.createElement('canvas'); c2.width = 600; c2.height = 1640;
    const g2 = c2.getContext('2d'); g2.drawImage(c, 0, 0, 600, 820, 0, 0, 600, 820); g2.drawImage(c, 600, 0, 600, 820, 0, 820, 600, 820);
    return c2.toDataURL('image/jpeg', 0.85);
  }
  return c.toDataURL('image/jpeg', 0.85);
}
