-- Schema Anfibiasub Boat Care. Idempotente: si può rieseguire a ogni avvio.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client','admin')),
  lang          TEXT NOT NULL DEFAULT 'it',
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  reset_token   TEXT,
  reset_expires TIMESTAMPTZ,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS boats (
  id                SERIAL PRIMARY KEY,
  owner_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo              TEXT NOT NULL DEFAULT 'motore',
  nome              TEXT NOT NULL DEFAULT '',
  targa             TEXT NOT NULL DEFAULT '',
  matricola         TEXT NOT NULL DEFAULT '',
  codice_scafo      TEXT NOT NULL DEFAULT '',
  bandiera          TEXT NOT NULL DEFAULT '',
  ufficio_reg       TEXT NOT NULL DEFAULT '',
  lunghezza         TEXT NOT NULL DEFAULT '',
  utilizzo          TEXT NOT NULL DEFAULT '',
  cantiere_modello  TEXT NOT NULL DEFAULT '',
  anno              TEXT NOT NULL DEFAULT '',
  materiale         TEXT NOT NULL DEFAULT '',
  motore_modello    TEXT NOT NULL DEFAULT '',
  motore_serie      TEXT NOT NULL DEFAULT '',
  potenza           TEXT NOT NULL DEFAULT '',
  carburante        TEXT NOT NULL DEFAULT '',
  serbatoi          TEXT NOT NULL DEFAULT '',
  armatore_nome     TEXT NOT NULL DEFAULT '',
  armatore_cell     TEXT NOT NULL DEFAULT '',
  armatore_email    TEXT NOT NULL DEFAULT '',
  scad_assicurazione DATE,
  licenza_rtf       TEXT NOT NULL DEFAULT '',
  mmsi              TEXT NOT NULL DEFAULT '',
  call_sign         TEXT NOT NULL DEFAULT '',
  porto             TEXT NOT NULL DEFAULT 'Loano',
  posto_barca       TEXT NOT NULL DEFAULT '',
  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,
  pos_updated       TIMESTAMPTZ,
  prox_pulizia      DATE,
  prox_pulizia_sent BOOLEAN NOT NULL DEFAULT FALSE,
  assic_alert_sent  BOOLEAN NOT NULL DEFAULT FALSE,
  note_admin        TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS boats_owner_idx ON boats(owner_id);

CREATE TABLE IF NOT EXISTS cleanings (
  id          SERIAL PRIMARY KEY,
  boat_id     INTEGER NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  data        DATE NOT NULL,
  tipo        TEXT NOT NULL DEFAULT '',
  note        TEXT NOT NULL DEFAULT '',
  share_token TEXT NOT NULL UNIQUE,
  notified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cleanings_boat_idx ON cleanings(boat_id, data DESC);

CREATE TABLE IF NOT EXISTS anodes (
  id             SERIAL PRIMARY KEY,
  boat_id        INTEGER NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  posizione      TEXT NOT NULL DEFAULT '',
  codice         TEXT NOT NULL DEFAULT '',
  dati           TEXT NOT NULL DEFAULT '',
  data_montaggio DATE,
  data_alert     DATE,
  alert_sent     BOOLEAN NOT NULL DEFAULT FALSE,
  note           TEXT NOT NULL DEFAULT '',
  updated_by     TEXT NOT NULL DEFAULT 'client',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS anodes_boat_idx ON anodes(boat_id);

CREATE TABLE IF NOT EXISTS photos (
  id          SERIAL PRIMARY KEY,
  boat_id     INTEGER NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  cleaning_id INTEGER REFERENCES cleanings(id) ON DELETE CASCADE,
  anode_id    INTEGER REFERENCES anodes(id) ON DELETE CASCADE,
  data        BYTEA NOT NULL,
  thumb       BYTEA NOT NULL,
  width       INTEGER,
  height      INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photos_cleaning_idx ON photos(cleaning_id);
CREATE INDEX IF NOT EXISTS photos_anode_idx ON photos(anode_id);

CREATE TABLE IF NOT EXISTS requests (
  id         SERIAL PRIMARY KEY,
  boat_id    INTEGER REFERENCES boats(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  motivo     TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mail_log (
  id         SERIAL PRIMARY KEY,
  to_email   TEXT NOT NULL,
  subject    TEXT NOT NULL,
  ok         BOOLEAN NOT NULL,
  info       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lingue ammesse (aggiornabile su database già esistenti)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_lang_check;
ALTER TABLE users ADD CONSTRAINT users_lang_check CHECK (lang IN ('it','en','es','de'));

-- Registrazione autonoma con verifica dell'email (gli utenti già esistenti risultano verificati)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS self_registered BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS users_verify_token ON users(verify_token);

-- Sondaggio di fine partita del gioco ABYSS
CREATE TABLE IF NOT EXISTS abyss_feedback (
  id         SERIAL PRIMARY KEY,
  altra      BOOLEAN NOT NULL,
  voto       SMALLINT NOT NULL DEFAULT 0,
  commento   TEXT NOT NULL DEFAULT '',
  ua         TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Statistiche anonime del gioco ABYSS: una riga per partita (nessun dato personale, niente IP)
CREATE TABLE IF NOT EXISTS abyss_partite (
  id            TEXT PRIMARY KEY,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  secondi       INT NOT NULL DEFAULT 0,
  fase          SMALLINT NOT NULL DEFAULT 1,
  reperti       SMALLINT NOT NULL DEFAULT 0,
  esito         TEXT NOT NULL DEFAULT '',
  morti_squalo  SMALLINT NOT NULL DEFAULT 0,
  morti_aria    SMALLINT NOT NULL DEFAULT 0,
  morti_pallone SMALLINT NOT NULL DEFAULT 0,
  lingua        TEXT NOT NULL DEFAULT '',
  dispositivo   TEXT NOT NULL DEFAULT '',
  prova         BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS abyss_partite_started ON abyss_partite(started_at);
ALTER TABLE abyss_feedback ADD COLUMN IF NOT EXISTS partita TEXT;

-- Accessi: siti e password per gestire il sito (password cifrate dall'applicazione)
CREATE TABLE IF NOT EXISTS accessi (
  id           SERIAL PRIMARY KEY,
  servizio     TEXT NOT NULL,
  url          TEXT NOT NULL DEFAULT '',
  utente       TEXT NOT NULL DEFAULT '',
  password_enc TEXT NOT NULL DEFAULT '',
  note         TEXT NOT NULL DEFAULT '',
  ordine       INT NOT NULL DEFAULT 0,
  updated_by   TEXT NOT NULL DEFAULT '',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
