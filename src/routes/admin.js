// Pannello Anfibiasub: clienti, barche, interventi, anodi, impostazioni.
const express = require('express');
const bcrypt = require('bcryptjs');
const { q, one, all, settings } = require('../db');
const { requireAdmin, flash, token, tempPassword } = require('../auth');
const { loadBoat } = require('../boatdata');
const { GROUPS, TIPI, fromBody } = require('../boatfields');
const { upload, saveMany } = require('../photos');
// foto dell'intervento: due campi separati, prima e dopo ('foto' = vecchio campo unico, va in prima)
const jobPhotos = upload.fields([{ name: 'foto_prima', maxCount: 40 }, { name: 'foto_dopo', maxCount: 40 }, { name: 'foto', maxCount: 40 }]);
async function saveJobPhotos(files, boatId, cleaningId) {
  const f = files || {};
  return (await saveMany(f.foto_prima, { boatId, cleaningId, fase: 'prima' }))
    + (await saveMany(f.foto, { boatId, cleaningId, fase: 'prima' }))
    + (await saveMany(f.foto_dopo, { boatId, cleaningId, fase: 'dopo' }));
}
const { send, layout, enabled: mailEnabled, esc, splitMails } = require('../mail');
const { cleaningStatus, anodesStatus } = require('../status');
const { t, fill, fmtDate, LANGS } = require('../i18n');
const { waLink } = require('../wa');
const accessi = require('../accessi');

const r = express.Router();
r.use(requireAdmin);
r.use(async (req, res, next) => { res.locals.settings = await settings(); res.locals.mailOn = mailEnabled(); next(); });

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const dateOrNull = (v) => (DATE.test(v || '') ? v : null);
const clip = (v, n = 200) => String(v ?? '').trim().slice(0, n);
const id = (v) => Number(v) || 0;
const base = (req) => (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
const clientPhone = (u, b) => u.phone || (b && b.armatore_cell) || '';

// Messaggio WhatsApp per un intervento, nella lingua del cliente, con il link alle foto
function jobWa(req, u, b, c) {
  const L = t(u.lang);
  const text = fill(L.wa_job, {
    name: u.name, boat: b.nome, date: fmtDate(c.data, u.lang), what: c.tipo ? ` · ${c.tipo}` : '',
    note: c.note ? `\n${c.note}` : '', url: `${base(req)}/condividi/${c.share_token}`,
  });
  return waLink(clientPhone(u, b), text);
}

async function credentialsMail(req, u, pw) {
  const M = t(u.lang);
  return send(u.email, M.m_cred_subj, layout(M.m_cred_title,
    [fill(M.m_cred_intro, { name: esc(u.name) }), `${esc(M.email)}: <b>${esc(u.email)}</b><br>${esc(M.password)}: <b>${esc(pw)}</b>`, M.m_cred_first],
    { label: M.m_signin, url: base(req) + '/area/login' }, u.lang));
}

function credWa(req, u, pw, b) {
  return waLink(clientPhone(u, b), fill(t(u.lang).wa_cred, { url: base(req) + '/area/login', email: u.email, pw }));
}

// ---------- elenco ----------
r.get('/', async (req, res) => {
  const s = res.locals.settings;
  const boats = await all(`SELECT b.id, b.nome, b.targa, b.tipo, b.posto_barca, b.prox_pulizia, u.id AS uid, u.name, u.email, u.phone, u.active, u.last_login,
    (SELECT max(data) FROM cleanings c WHERE c.boat_id=b.id) AS last_clean
    FROM boats b JOIN users u ON u.id=b.owner_id ORDER BY lower(b.nome)`);
  const anodes = await all('SELECT boat_id, data_montaggio, data_alert FROM anodes');
  for (const b of boats) {
    b.cst = cleaningStatus(b.last_clean, s);
    b.ast = anodesStatus(anodes.filter((a) => a.boat_id === b.id), s);
  }
  const noBoat = await all(`SELECT u.* FROM users u WHERE u.role='client' AND NOT EXISTS (SELECT 1 FROM boats b WHERE b.owner_id=u.id) ORDER BY u.name`);
  const reqs = await all(`SELECT r.*, b.nome, u.name FROM requests r LEFT JOIN boats b ON b.id=r.boat_id LEFT JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC LIMIT 8`);
  const f = clip(req.query.f).toLowerCase();
  const list = f ? boats.filter((b) => [b.nome, b.targa, b.name, b.email].join(' ').toLowerCase().includes(f)) : boats;
  res.render('admin/index', { boats: list, all: boats, noBoat, reqs, f });
});

// ---------- nuovo cliente ----------
r.get('/clienti/nuovo', (req, res) => res.render('admin/nuovo', { error: null, v: {} }));
r.post('/clienti/nuovo', async (req, res) => {
  const v = { name: clip(req.body.name), email: clip(req.body.email).toLowerCase(), phone: clip(req.body.phone), lang: LANGS.includes(req.body.lang) ? req.body.lang : 'it', nome: clip(req.body.nome), targa: clip(req.body.targa), tipo: TIPI.includes(req.body.tipo) ? req.body.tipo : 'motore', posto_barca: clip(req.body.posto_barca) };
  if (!v.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email) || !v.nome) return res.status(400).render('admin/nuovo', { error: 'Servono almeno nome del cliente, email valida e nome della barca.', v });
  if (await one('SELECT 1 FROM users WHERE lower(email)=$1', [v.email])) return res.status(400).render('admin/nuovo', { error: 'Esiste già un account con questa email.', v });
  const pw = tempPassword();
  const u = await one(`INSERT INTO users(email, password_hash, name, phone, lang, role, must_change_password) VALUES ($1,$2,$3,$4,$5,'client',true) RETURNING *`,
    [v.email, await bcrypt.hash(pw, 12), v.name, v.phone, v.lang]);
  const b = await one(`INSERT INTO boats(owner_id, nome, targa, tipo, posto_barca, armatore_nome, armatore_cell, armatore_email) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [u.id, v.nome, v.targa, v.tipo, v.posto_barca, v.name, v.phone, v.email]);
  const mailed = ['1', 'email', 'entrambi'].includes(req.body.invia) ? await credentialsMail(req, u, pw) : false;
  res.render('admin/credenziali', { u, pw, mailed, boatId: b.id, loginUrl: base(req) + '/area/login', wa: credWa(req, u, pw) });
});

// ---------- scheda barca (vista Anfibiasub) ----------
async function owned(boatId) { return one('SELECT b.*, u.id AS uid FROM boats b JOIN users u ON u.id=b.owner_id WHERE b.id=$1', [boatId]); }

r.get('/barca/:id', async (req, res) => {
  const d = await loadBoat(id(req.params.id));
  if (!d) return res.status(404).render('error', { code: 404, message: 'Barca non trovata.' });
  const owner = await one('SELECT * FROM users WHERE id=$1', [d.boat.owner_id]);
  const others = await all('SELECT id, nome FROM boats WHERE owner_id=$1 AND id<>$2', [owner.id, d.boat.id]);
  const reqs = await all('SELECT * FROM requests WHERE boat_id=$1 ORDER BY created_at DESC LIMIT 10', [d.boat.id]);
  for (const c of d.cleanings) c.wa = jobWa(req, owner, d.boat, c);
  const hasPhone = Boolean(waLink(clientPhone(owner, d.boat), 'x'));
  res.render('admin/barca', { d, owner, others, reqs, GROUPS, TIPI, hasPhone, tab: req.query.tab || 'interventi', newPw: null });
});

r.post('/barca/:id/pulizia', jobPhotos, async (req, res) => {
  const b = await owned(id(req.params.id));
  if (!b) return res.sendStatus(404);
  const data = dateOrNull(req.body.data) || new Date().toISOString().slice(0, 10);
  const c = await one('INSERT INTO cleanings(boat_id, data, tipo, note, share_token) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [b.id, data, clip(req.body.tipo), clip(req.body.note, 2000), token(18)]);
  const n = await saveJobPhotos(req.files, b.id, c.id);
  // un nuovo intervento azzera il promemoria del cliente già scaduto
  await q('UPDATE boats SET prox_pulizia = CASE WHEN prox_pulizia <= $2 THEN NULL ELSE prox_pulizia END WHERE id=$1', [b.id, data]);
  let msg = `Intervento salvato con ${n} foto.`;
  // avviso al cliente: 'email', 'wa', 'entrambi' oppure nessuno
  const avvisa = ['email', 'wa', 'entrambi'].includes(req.body.avvisa) ? req.body.avvisa : (req.body.notifica ? 'email' : '');
  const u = await one('SELECT * FROM users WHERE id=$1', [b.owner_id]);
  let wa = '';
  if (avvisa === 'email' || avvisa === 'entrambi') {
    const L = t(u.lang);
    const ok = await send(u.email, fill(L.m_job_subj, { boat: b.nome }), layout(L.m_job_title,
      [fill(L.m_job_intro, { name: esc(u.name), boat: esc(b.nome) }),
       `${fmtDate(data, u.lang)} · ${esc(c.tipo || L.cleaning)}${n ? ` · ${n} ${L.photos}` : ''}`,
       c.note ? esc(c.note) : ''].filter(Boolean),
      { label: L.m_job_btn, url: base(req) + '/area/manutenzione' }, u.lang));
    if (ok) { await q('UPDATE cleanings SET notified=true WHERE id=$1', [c.id]); msg += ' Email inviata al cliente.'; }
    else msg += mailEnabled() ? ' Email NON inviata: controlla il registro email.' : ' Email non inviata: Brevo non è ancora configurato.';
  }
  if (avvisa === 'wa' || avvisa === 'entrambi') {
    wa = jobWa(req, u, b, c);
    msg += wa ? ' Ora tocca il pulsante verde per mandarlo su WhatsApp.' : ' WhatsApp non preparato: il cliente non ha un numero di cellulare (aggiungilo nella scheda Cliente).';
  }
  flash(req, 'ok', msg);
  if (wa) req.session.flash.wa = wa;
  res.redirect(`/admin/barca/${b.id}?tab=interventi`);
});

r.post('/pulizia/:id', jobPhotos, async (req, res) => {
  const c = await one('SELECT * FROM cleanings WHERE id=$1', [id(req.params.id)]);
  if (!c) return res.sendStatus(404);
  await q('UPDATE cleanings SET data=$1, tipo=$2, note=$3 WHERE id=$4', [dateOrNull(req.body.data) || c.data, clip(req.body.tipo), clip(req.body.note, 2000), c.id]);
  const n = await saveJobPhotos(req.files, c.boat_id, c.id);
  flash(req, 'ok', `Intervento aggiornato${n ? `, aggiunte ${n} foto` : ''}.`);
  res.redirect(`/admin/barca/${c.boat_id}?tab=interventi#pulizia-${c.id}`);
});

r.post('/pulizia/:id/elimina', async (req, res) => {
  const c = await one('DELETE FROM cleanings WHERE id=$1 RETURNING boat_id', [id(req.params.id)]);
  flash(req, 'ok', 'Intervento eliminato.');
  res.redirect(c ? `/admin/barca/${c.boat_id}?tab=interventi` : '/admin');
});

r.post('/foto/:id/elimina', async (req, res) => {
  const p = await one('DELETE FROM photos WHERE id=$1 RETURNING boat_id, anode_id, cleaning_id', [id(req.params.id)]);
  res.redirect(p ? `/admin/barca/${p.boat_id}?tab=${p.anode_id ? 'anodi' : 'interventi'}${p.cleaning_id ? '#pulizia-' + p.cleaning_id : ''}` : '/admin');
});
// sceglie la foto di anteprima (prima o dopo) dell'intervento nello storico
r.post('/foto/:id/anteprima', async (req, res) => {
  const p = await one('SELECT id, boat_id, cleaning_id, fase FROM photos WHERE id=$1 AND cleaning_id IS NOT NULL', [id(req.params.id)]);
  if (!p) return res.redirect('/admin');
  await q(`UPDATE cleanings SET ${p.fase === 'dopo' ? 'cover_dopo' : 'cover_prima'}=$1 WHERE id=$2`, [p.id, p.cleaning_id]);
  flash(req, 'ok', 'Anteprima aggiornata.');
  res.redirect(`/admin/barca/${p.boat_id}?tab=interventi#pulizia-${p.cleaning_id}`);
});
// sposta una foto dell'intervento da "prima" a "dopo" o viceversa
r.post('/foto/:id/sposta', async (req, res) => {
  const p = await one("UPDATE photos SET fase = CASE WHEN fase='dopo' THEN 'prima' ELSE 'dopo' END WHERE id=$1 AND cleaning_id IS NOT NULL RETURNING boat_id, cleaning_id", [id(req.params.id)]);
  res.redirect(p ? `/admin/barca/${p.boat_id}?tab=interventi#pulizia-${p.cleaning_id}` : '/admin');
});

// anodi (anche Anfibiasub può gestirli)
const anodeVals = (b) => [clip(b.posizione), clip(b.codice), clip(b.dati), dateOrNull(b.data_montaggio), dateOrNull(b.data_alert), clip(b.note, 1000)];
r.post('/barca/:id/anodi', upload.array('foto', 5), async (req, res) => {
  const b = await owned(id(req.params.id));
  if (!b) return res.sendStatus(404);
  const a = await one(`INSERT INTO anodes(boat_id, posizione, codice, dati, data_montaggio, data_alert, note, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,'anfibiasub') RETURNING id`, [b.id, ...anodeVals(req.body)]);
  await saveMany(req.files, { boatId: b.id, anodeId: a.id });
  flash(req, 'ok', 'Anodo aggiunto.');
  res.redirect(`/admin/barca/${b.id}?tab=anodi`);
});
r.post('/anodi/:id', upload.array('foto', 5), async (req, res) => {
  const a = await one('SELECT * FROM anodes WHERE id=$1', [id(req.params.id)]);
  if (!a) return res.sendStatus(404);
  const v = anodeVals(req.body);
  await q(`UPDATE anodes SET posizione=$1, codice=$2, dati=$3, data_montaggio=$4, data_alert=$5, note=$6, updated_by='anfibiasub', updated_at=now()
    ${(a.data_alert || null) !== v[4] ? ', alert_sent=false' : ''} WHERE id=$7`, [...v, a.id]);
  await saveMany(req.files, { boatId: a.boat_id, anodeId: a.id });
  flash(req, 'ok', 'Anodo aggiornato.');
  res.redirect(`/admin/barca/${a.boat_id}?tab=anodi#anodo-${a.id}`);
});
r.post('/anodi/:id/elimina', async (req, res) => {
  const a = await one('DELETE FROM anodes WHERE id=$1 RETURNING boat_id', [id(req.params.id)]);
  res.redirect(a ? `/admin/barca/${a.boat_id}?tab=anodi` : '/admin');
});

r.post('/barca/:id/scheda', async (req, res) => {
  const b = await owned(id(req.params.id));
  if (!b) return res.sendStatus(404);
  const v = fromBody(req.body);
  const cols = Object.keys(v);
  await q(`UPDATE boats SET ${cols.map((c, i) => `${c}=$${i + 1}`).join(', ')}, updated_at=now() WHERE id=$${cols.length + 1}`, [...cols.map((c) => v[c]), b.id]);
  flash(req, 'ok', 'Scheda salvata.');
  res.redirect(`/admin/barca/${b.id}?tab=scheda`);
});

r.post('/barca/:id/note', async (req, res) => {
  await q('UPDATE boats SET note_admin=$1 WHERE id=$2', [clip(req.body.note_admin, 4000), id(req.params.id)]);
  flash(req, 'ok', 'Note salvate.');
  res.redirect(`/admin/barca/${id(req.params.id)}?tab=cliente`);
});

r.post('/barca/:id/elimina', async (req, res) => {
  if (req.body.conferma !== 'ELIMINA') { flash(req, 'err', 'Per eliminare scrivi ELIMINA nel campo di conferma.'); return res.redirect(`/admin/barca/${id(req.params.id)}?tab=cliente`); }
  await q('DELETE FROM boats WHERE id=$1', [id(req.params.id)]);
  flash(req, 'ok', 'Barca eliminata con tutti i suoi dati.');
  res.redirect('/admin');
});

// ---------- cliente ----------
r.post('/cliente/:id', async (req, res) => {
  const u = await one("SELECT * FROM users WHERE id=$1 AND role='client'", [id(req.params.id)]);
  if (!u) return res.sendStatus(404);
  const email = clip(req.body.email).toLowerCase();
  const back = clip(req.body.back) || '/admin';
  if (email !== u.email && await one('SELECT 1 FROM users WHERE lower(email)=$1', [email])) { flash(req, 'err', 'Email già usata da un altro account.'); return res.redirect(back); }
  await q('UPDATE users SET name=$1, email=$2, phone=$3, lang=$4, active=$5 WHERE id=$6',
    [clip(req.body.name), email, clip(req.body.phone), LANGS.includes(req.body.lang) ? req.body.lang : 'it', Boolean(req.body.active), u.id]);
  flash(req, 'ok', 'Cliente aggiornato.');
  res.redirect(back.startsWith('/admin') ? back : '/admin');
});

r.post('/cliente/:id/password', async (req, res) => {
  const u = await one("SELECT * FROM users WHERE id=$1 AND role='client'", [id(req.params.id)]);
  if (!u) return res.sendStatus(404);
  const pw = tempPassword();
  await q('UPDATE users SET password_hash=$1, must_change_password=true WHERE id=$2', [await bcrypt.hash(pw, 12), u.id]);
  const mailed = ['1', 'email', 'entrambi'].includes(req.body.invia) ? await credentialsMail(req, u, pw) : false;
  const boat = await one('SELECT id, armatore_cell FROM boats WHERE owner_id=$1 ORDER BY id LIMIT 1', [u.id]);
  res.render('admin/credenziali', { u, pw, mailed, boatId: boat?.id, loginUrl: base(req) + '/area/login', wa: credWa(req, u, pw, boat) });
});

r.post('/cliente/:id/barca', async (req, res) => {
  const u = await one("SELECT * FROM users WHERE id=$1 AND role='client'", [id(req.params.id)]);
  if (!u || !clip(req.body.nome)) return res.redirect('/admin');
  const b = await one(`INSERT INTO boats(owner_id, nome, targa, tipo, armatore_nome, armatore_cell, armatore_email) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [u.id, clip(req.body.nome), clip(req.body.targa), TIPI.includes(req.body.tipo) ? req.body.tipo : 'motore', u.name, u.phone, u.email]);
  flash(req, 'ok', 'Barca aggiunta.');
  res.redirect(`/admin/barca/${b.id}`);
});

// ---------- impostazioni ----------
r.get('/guida', (req, res) => res.render('guida', { G: require('../guida').GESTIONE, titolo: 'Guida alla gestione', intro: 'Come si usa la parte riservata ad Anfibiasub. Tocca "Ascolta" per sentire una sezione, oppure ascolta tutta la guida dall\'inizio.' }));

r.get('/impostazioni', async (req, res) => {
  const admins = await all("SELECT id, name, email, last_login FROM users WHERE role='admin' ORDER BY id");
  const mails = await all('SELECT * FROM mail_log ORDER BY created_at DESC LIMIT 15');
  res.render('admin/impostazioni', { admins, mails, adminPw: null, acc: await accessi.list() });
});
r.post('/impostazioni', async (req, res) => {
  const keys = ['webcam_url', 'whatsapp', 'admin_email', 'controllo_email', 'pulizia_giallo_mesi', 'pulizia_rosso_mesi', 'anodi_giallo_mesi', 'anodi_rosso_mesi'];
  for (const k of keys) {
    let v = clip(req.body[k], 500);
    if (k === 'whatsapp') v = v.replace(/\D/g, '');
    if (k === 'admin_email' || k === 'controllo_email') v = splitMails(v).join('; ');
    if (k.endsWith('_mesi')) v = String(Math.max(1, Math.min(60, Number(v) || 0)) || '');
    if (v) await q('INSERT INTO settings(key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value', [k, v]);
  }
  flash(req, 'ok', 'Impostazioni salvate.');
  res.redirect('/admin/impostazioni');
});
r.post('/impostazioni/admin', async (req, res) => {
  const email = clip(req.body.email).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || await one('SELECT 1 FROM users WHERE lower(email)=$1', [email])) {
    flash(req, 'err', 'Email non valida o già usata.'); return res.redirect('/admin/impostazioni');
  }
  const pw = tempPassword();
  await q("INSERT INTO users(email, password_hash, name, role, must_change_password) VALUES ($1,$2,$3,'admin',true)", [email, await bcrypt.hash(pw, 12), clip(req.body.name)]);
  const admins = await all("SELECT id, name, email, last_login FROM users WHERE role='admin' ORDER BY id");
  const mails = await all('SELECT * FROM mail_log ORDER BY created_at DESC LIMIT 15');
  res.render('admin/impostazioni', { admins, mails, adminPw: { email, pw }, acc: await accessi.list() });
});
r.post('/impostazioni/test-email', async (req, res) => {
  const ok = await send(res.locals.user.email, 'Prova email Anfibiasub', layout('Prova riuscita', ['Se leggi questo messaggio, l\'invio delle email funziona.']));
  flash(req, ok ? 'ok' : 'err', ok ? `Email di prova inviata a ${res.locals.user.email}.` : 'Invio non riuscito: guarda il registro qui sotto.');
  res.redirect('/admin/impostazioni');
});

r.post('/impostazioni/controllo', async (req, res) => {
  const ok = await require('../reminders').monthly(true);
  flash(req, ok ? 'ok' : 'err', ok ? 'Email di controllo mensile inviata.' : 'Invio non riuscito: guarda il registro email.');
  res.redirect('/admin/impostazioni#controllo');
});

// ---------- esportazione Excel di tutto l'archivio ----------
r.get('/export.xlsx', async (req, res) => {
  const x = await require('../export').buildExcel();
  res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.set('Content-Disposition', `attachment; filename="${x.filename}"`);
  res.set('Cache-Control', 'no-store');
  res.send(x.buffer);
});

// ---------- accessi (siti e password del sito) ----------
r.post('/accessi', async (req, res) => {
  const v = { servizio: clip(req.body.servizio, 80), url: clip(req.body.url, 300), utente: clip(req.body.utente, 200), password: clip(req.body.password, 300), note: clip(req.body.note, 1000) };
  if (!v.servizio) { flash(req, 'err', 'Scrivi almeno il nome del servizio.'); return res.redirect('/admin/impostazioni#accessi'); }
  const eid = id(req.body.id);
  if (eid) await accessi.update(eid, v, res.locals.user.name || res.locals.user.email);
  else await accessi.add(v, res.locals.user.name || res.locals.user.email);
  flash(req, 'ok', `Accesso "${v.servizio}" salvato.`);
  res.redirect('/admin/impostazioni#accessi');
});
r.post('/accessi/:id/elimina', async (req, res) => {
  await accessi.remove(id(req.params.id));
  flash(req, 'ok', 'Accesso eliminato.');
  res.redirect('/admin/impostazioni#accessi');
});

// ---------- statistiche del gioco ABYSS (dati anonimi) ----------
r.get('/abyss', async (req, res) => {
  const prova = req.query.prova === '1';
  const W = prova ? 'TRUE' : 'NOT prova';
  const TZ = "(started_at AT TIME ZONE 'Europe/Rome')::date";
  const oggi = "(now() AT TIME ZONE 'Europe/Rome')::date";
  const tot = await one(`SELECT count(*)::int AS tutte,
      count(*) FILTER (WHERE ${TZ} = ${oggi})::int AS oggi,
      count(*) FILTER (WHERE ${TZ} > ${oggi} - 7)::int AS sett,
      count(*) FILTER (WHERE ${TZ} > ${oggi} - 30)::int AS mese,
      coalesce(sum(secondi), 0)::int AS sec_tot,
      round(avg(secondi) FILTER (WHERE secondi >= 15))::int AS media,
      round(percentile_cont(0.5) WITHIN GROUP (ORDER BY secondi) FILTER (WHERE secondi >= 15))::int AS mediana,
      count(*) FILTER (WHERE reperti >= 1 OR fase >= 2)::int AS f1,
      count(*) FILTER (WHERE reperti >= 3 OR fase >= 2)::int AS f2,
      count(*) FILTER (WHERE fase >= 2)::int AS f3,
      count(*) FILTER (WHERE fase >= 3)::int AS f4,
      count(*) FILTER (WHERE fase >= 4)::int AS f5,
      count(*) FILTER (WHERE fase >= 5)::int AS f6,
      count(*) FILTER (WHERE fase >= 6)::int AS f7,
      coalesce(sum(morti_squalo), 0)::int AS squalo, coalesce(sum(morti_aria), 0)::int AS aria, coalesce(sum(morti_pallone), 0)::int AS pallone,
      count(*) FILTER (WHERE dispositivo = 'telefono')::int AS tel,
      count(*) FILTER (WHERE dispositivo = 'pc')::int AS pc,
      count(*) FILTER (WHERE prova)::int AS prove
    FROM abyss_partite WHERE ${W}`);
  const prove = (await one('SELECT count(*)::int AS n FROM abyss_partite WHERE prova')).n;
  const lingue = await all(`SELECT lingua, count(*)::int AS n FROM abyss_partite WHERE ${W} GROUP BY lingua ORDER BY n DESC`);
  const giorni = await all(`SELECT d::date AS giorno, coalesce(x.n, 0)::int AS n FROM generate_series(${oggi} - 29, ${oggi}, interval '1 day') d
    LEFT JOIN (SELECT ${TZ} AS g, count(*) AS n FROM abyss_partite WHERE ${W} GROUP BY 1) x ON x.g = d::date ORDER BY d`);
  const voti = await one(`SELECT count(*)::int AS n, count(*) FILTER (WHERE altra)::int AS si,
      round(avg(voto) FILTER (WHERE voto > 0), 1)::float AS media,
      count(*) FILTER (WHERE voto = 1)::int AS v1, count(*) FILTER (WHERE voto = 2)::int AS v2, count(*) FILTER (WHERE voto = 3)::int AS v3,
      count(*) FILTER (WHERE voto = 4)::int AS v4, count(*) FILTER (WHERE voto = 5)::int AS v5
    FROM abyss_feedback`);
  const commenti = await all("SELECT created_at, altra, voto, commento FROM abyss_feedback WHERE commento <> '' ORDER BY created_at DESC LIMIT 50");
  res.render('admin/abyss', { tot, prove, prova, lingue, giorni, voti, commenti });
});

module.exports = r;
