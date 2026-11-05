const fs = require('fs');
const path = require('path');
const { Pool, types } = require('pg');

// Le date (DATE) restano stringhe 'YYYY-MM-DD': niente sorprese di fuso orario.
types.setTypeParser(1082, (v) => v);

if (!process.env.DATABASE_URL) {
  console.error('Manca DATABASE_URL. Su Railway aggiungi un database Postgres al progetto.');
  process.exit(1);
}

const local = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: local || process.env.PGSSL === 'off' ? false : { rejectUnauthorized: false },
  max: 10,
});

const q = (text, params) => pool.query(text, params);
const one = async (text, params) => (await pool.query(text, params)).rows[0] || null;
const all = async (text, params) => (await pool.query(text, params)).rows;

const DEFAULT_SETTINGS = {
  webcam_url: 'https://www.windfinder.com/webcams/loano',
  whatsapp: '393470119832',
  admin_email: 'termoclino@libero.it',
  controllo_email: 'ivano.taccucci@libero.it',
  pulizia_giallo_mesi: '6',
  pulizia_rosso_mesi: '12',
  anodi_giallo_mesi: '10',
  anodi_rosso_mesi: '12',
};

async function migrate() {
  await q(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    await q('INSERT INTO settings(key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING', [k, v]);
  }
  // Una sola volta: il creatore del sito appare come "Creator", l'account di Francesco come "Anfibiasub"
  if (!(await one("SELECT 1 FROM settings WHERE key='nomi_admin_v1'"))) {
    await q("UPDATE users SET name='Creator' WHERE role='admin' AND lower(email)='ivano.taccucci@libero.it'");
    await q("UPDATE users SET name='Anfibiasub' WHERE role='admin' AND lower(email)='termoclino@libero.it'");
    await q("INSERT INTO settings(key, value) VALUES ('nomi_admin_v1','1') ON CONFLICT (key) DO NOTHING");
  }
  await require('./accessi').seed();
}

async function settings() {
  const rows = await all('SELECT key, value FROM settings');
  const s = { ...DEFAULT_SETTINGS };
  for (const r of rows) s[r.key] = r.value;
  return s;
}

module.exports = { pool, q, one, all, migrate, settings };
