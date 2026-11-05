// Accessi: siti e password che servono per gestire il sito (Railway, GitHub, Brevo, dominio...).
// Le password sono cifrate nel database (AES-256-GCM) con una chiave ricavata da SESSION_SECRET:
// se SESSION_SECRET cambia, le password salvate non si leggono più (vanno reinserite).
const crypto = require('crypto');
const { q, one, all } = require('./db');

const KEY = crypto.scryptSync(process.env.SESSION_SECRET || 'solo-sviluppo-locale', 'anfibiasub-accessi', 32);

function enc(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const data = Buffer.concat([c.update(String(text), 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString('base64')).join('.');
}

function dec(s) {
  if (!s) return '';
  try {
    const [iv, tag, data] = s.split('.').map((x) => Buffer.from(x, 'base64'));
    const d = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(data), d.final()]).toString('utf8');
  } catch {
    return null; // chiave cambiata: password non leggibile
  }
}

// Voci di partenza, create una sola volta (le password le inserisce chi gestisce)
const START = [
  { servizio: 'Railway (server del sito)', url: 'https://railway.com/dashboard', utente: '', note: 'Qui gira il sito con il database. Si entra con l\'account GitHub qui sotto. Piano Hobby: circa 5 $ al mese.' },
  { servizio: 'GitHub (codice del sito)', url: 'https://github.com/login', utente: '', note: 'Contiene il codice del sito. Serve anche per entrare in Railway.' },
  { servizio: 'Brevo (invio email)', url: 'https://app.brevo.com', utente: 'anfibiaanfibia@gmail.com', note: 'Manda le email del sito (gratis fino a 300 al giorno). Chiave API "railway-anfibiasub", salvata su Railway come BREVO_API_KEY. Account verificato con il cellulare.' },
  { servizio: 'Gmail mittente', url: 'https://mail.google.com', utente: 'anfibiaanfibia@gmail.com', note: 'Indirizzo da cui partono le email del sito.' },
  { servizio: 'Dominio anfibiasub.it', url: '', utente: '', note: 'Dove è registrato il dominio (gestione DNS, rinnovo annuale).' },
];

async function seed() {
  if (await one("SELECT 1 FROM settings WHERE key='accessi_v1'")) return;
  if (!(await one('SELECT 1 FROM accessi'))) {
    for (const [i, v] of START.entries()) {
      await q('INSERT INTO accessi(servizio, url, utente, password_enc, note, ordine, updated_by) VALUES ($1,$2,$3,\'\',$4,$5,\'Creator\')', [v.servizio, v.url, v.utente, v.note, i]);
    }
  }
  await q("INSERT INTO settings(key, value) VALUES ('accessi_v1','1') ON CONFLICT (key) DO NOTHING");
}

async function list() {
  const rows = await all('SELECT * FROM accessi ORDER BY ordine, lower(servizio), id');
  return rows.map((r) => {
    const pw = dec(r.password_enc);
    return { ...r, password: pw ?? '', broken: pw === null };
  });
}

async function add(v, who) {
  const max = await one('SELECT coalesce(max(ordine), 0) + 1 AS n FROM accessi');
  await q('INSERT INTO accessi(servizio, url, utente, password_enc, note, ordine, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [v.servizio, v.url, v.utente, enc(v.password), v.note, max.n, who]);
}

async function update(id, v, who) {
  await q('UPDATE accessi SET servizio=$1, url=$2, utente=$3, password_enc=$4, note=$5, updated_by=$6, updated_at=now() WHERE id=$7',
    [v.servizio, v.url, v.utente, enc(v.password), v.note, who, id]);
}

const remove = (id) => q('DELETE FROM accessi WHERE id=$1', [id]);

module.exports = { seed, list, add, update, remove };
