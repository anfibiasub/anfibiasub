// Gioco ABYSS: statistiche anonime delle partite e sondaggio di fine partita.
// POST /api/abyss/partita  { id, ev: start|ping|end, sec, fase, reperti, esito, morti:{squalo,aria,pallone}, lingua, dev, prova }
// POST /api/abyss/voto     { altra: true|false, voto: 1-5, commento: "...", partita }
// Tutto finisce nel database e si legge nella pagina Statistiche ABYSS del pannello (niente email).
// Nessun dato personale: niente nome, email o indirizzo IP salvati.
const express = require('express');
const rateLimit = require('express-rate-limit');
const { q } = require('./db');

const router = express.Router();
// il gioco può stare su www.anfibiasub.it (HostGator) e chiamare clienti.anfibiasub.it
const ORIGINS = new Set(['https://www.anfibiasub.it', 'https://anfibiasub.it']);
router.use((req, res, next) => {
  const o = req.get('origin');
  if (o && ORIGINS.has(o)) { res.set('Access-Control-Allow-Origin', o); res.set('Vary', 'Origin'); }
  if (req.method === 'OPTIONS') { res.set('Access-Control-Allow-Methods', 'POST'); res.set('Access-Control-Allow-Headers', 'content-type'); return res.sendStatus(204); }
  next();
});
const sameSite = (req) => { const o = req.get('origin'); try { return !o || ORIGINS.has(o) || new URL(o).host === req.get('host'); } catch (_) { return false; } };
// il gioco manda il corpo come testo (richiesta "semplice", funziona anche mentre la pagina si chiude)
const body = express.text({ type: () => true, limit: '4kb' });
const parse = (req) => {
  let b = req.body;
  // se un altro lettore ha già interpretato il testo come modulo, il JSON è finito nella prima chiave
  if (b && typeof b === 'object' && !Buffer.isBuffer(b)) { const k = Object.keys(b); if (k.length === 1 && k[0].startsWith('{') && b[k[0]] === '') b = k[0]; else return b; }
  try { return JSON.parse(String(b || '{}')); } catch (_) { return {}; }
};
const int = (v, a, b) => Math.max(a, Math.min(b, parseInt(v, 10) || 0));
const ESITI = new Set(['completata', 'squalo', 'aria', 'pallone', 'uscita', 'chiusa', 'ricominciata']);

const partLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false });
router.post('/partita', partLimit, body, async (req, res) => {
  if (!sameSite(req)) return res.status(403).end();
  const b = parse(req);
  const id = String(b.id || '');
  if (!/^[\w-]{8,64}$/.test(id)) return res.status(400).end();
  const m = b.morti || {};
  const v = [id, int(b.sec, 0, 4 * 3600), int(b.fase, 1, 6), int(b.reperti, 0, 3), ESITI.has(b.esito) ? b.esito : '',
    int(m.squalo, 0, 99), int(m.aria, 0, 99), int(m.pallone, 0, 99),
    ['it', 'en', 'es', 'de'].includes(b.lingua) ? b.lingua : '', b.dev === 'telefono' ? 'telefono' : 'pc', b.prova === true];
  try {
    await q(`INSERT INTO abyss_partite(id, secondi, fase, reperti, esito, morti_squalo, morti_aria, morti_pallone, lingua, dispositivo, prova)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (id) DO UPDATE SET last_at=now(),
        secondi=GREATEST(abyss_partite.secondi, EXCLUDED.secondi), fase=GREATEST(abyss_partite.fase, EXCLUDED.fase),
        reperti=GREATEST(abyss_partite.reperti, EXCLUDED.reperti),
        esito=CASE WHEN abyss_partite.esito='completata' THEN abyss_partite.esito WHEN EXCLUDED.esito<>'' THEN EXCLUDED.esito ELSE abyss_partite.esito END,
        morti_squalo=GREATEST(abyss_partite.morti_squalo, EXCLUDED.morti_squalo), morti_aria=GREATEST(abyss_partite.morti_aria, EXCLUDED.morti_aria),
        morti_pallone=GREATEST(abyss_partite.morti_pallone, EXCLUDED.morti_pallone), prova=abyss_partite.prova OR EXCLUDED.prova`, v);
    res.status(204).end();
  } catch (e) {
    console.error('abyss partita', e.message);
    res.status(500).end();
  }
});

const votoLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
router.post('/voto', votoLimit, express.json({ limit: '4kb' }), async (req, res) => {
  if (!sameSite(req)) return res.status(403).json({ ok: false });
  const b = req.body || {};
  const altra = b.altra === true;
  const voto = int(b.voto, 0, 5);
  const commento = String(b.commento || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 500);
  const partita = /^[\w-]{8,64}$/.test(String(b.partita || '')) ? String(b.partita) : null;
  try {
    await q('INSERT INTO abyss_feedback(altra, voto, commento, partita) VALUES ($1,$2,$3,$4)', [altra, voto, commento, partita]);
    res.json({ ok: true });
  } catch (e) {
    console.error('abyss voto', e.message);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;
