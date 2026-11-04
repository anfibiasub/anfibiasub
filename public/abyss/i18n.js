// Testi del gioco nella lingua della pagina (generati da sito/abyss_testi.py dentro la pagina).
import { CFG } from './config.js?v=5e15d4f6';

const el = document.getElementById('ab-i18n');
export const L = el ? JSON.parse(el.textContent) : {};
export const lang = document.documentElement.lang || 'it';
export const t = (k, v = {}) => String(L[k] ?? k).replace(/\{(\w+)\}/g, (m, n) => (n in v ? v[n] : m));

// nomi e descrizioni dei reperti nella lingua giusta
if (L.art) {
  for (const a of CFG.artifacts) { const x = L.art[a.id]; if (x) { a.name = x[0]; a.found = x[1]; a.clue = x[2]; } }
  const c = L.art.cofanetto; if (c) { CFG.casket.name = c[0]; CFG.casket.found = c[1]; }
}
