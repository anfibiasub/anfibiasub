// Area clienti: ogni cliente vede e modifica SOLO le proprie barche.
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { q, one, all, settings } = require('../db');
const { requireUser, flash, token } = require('../auth');
const { loadBoat } = require('../boatdata');
const { GROUPS, TIPI, fromBody } = require('../boatfields');
const { upload, saveMany, sendPhoto } = require('../photos');
const { send, layout, enabled: mailEnabled, esc } = require('../mail');
const { t: tr, fill, LANGS } = require('../i18n');

const r = express.Router();
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const dateOrNull = (v) => (DATE.test(v || '') ? v : null);
const clip = (v, n = 200) => String(v ?? '').trim().slice(0, n);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => res.status(429).render('app/login', { error: res.locals.L.too_many, email: req.body?.email || '' }),
});

// ---------- accesso ----------
r.get('/', (req, res) => res.redirect(res.locals.user ? (res.locals.user.role === 'admin' ? '/admin' : '/area/home') : '/area/login'));

r.get('/login', (req, res) => {
  if (res.locals.user) return res.redirect('/area');
  res.render('app/login', { error: null, email: '' });
});

r.post('/login', loginLimiter, async (req, res) => {
  const email = clip(req.body.email).toLowerCase();
  const u = await one('SELECT * FROM users WHERE lower(email)=$1 AND active', [email]);
  const ok = u && (await bcrypt.compare(String(req.body.password || ''), u.password_hash));
  if (!ok) return res.status(401).render('app/login', { error: res.locals.L.bad_login, email });
  if (!u.email_verified) { // registrato ma non ancora confermato: rimandiamo il link
    if (mailEnabled()) await sendVerify(req, u);
    return res.status(403).render('app/login', { error: res.locals.L.reg_unverified + ' ' + res.locals.L.reg_resent, email });
  }
  req.session.regenerate(async (err) => {
    if (err) throw err;
    req.session.uid = u.id;
    await q('UPDATE users SET last_login=now() WHERE id=$1', [u.id]);
    res.redirect(u.role === 'admin' ? '/admin' : '/area/home');
  });
});

// ---------- registrazione autonoma con conferma dell'email ----------
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TERMINI = require('../termini');
const PRIVACY_TXT = require('../privacy_testi.json');
const appBase = (req) => (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

async function sendVerify(req, u) {
  const tk = token();
  await q("UPDATE users SET verify_token=$1, verify_expires=now() + interval '24 hours' WHERE id=$2", [tk, u.id]);
  const M = tr(u.lang);
  return send(u.email, M.m_ver_subj, layout(M.m_ver_title,
    [fill(M.m_ver_p1, { name: esc(u.name) }), M.m_ver_p2, `<span style="color:#7d8b99">${M.m_ver_ignore}</span>`],
    { label: M.m_ver_btn, url: `${appBase(req)}/area/verifica/${tk}` }, u.lang));
}
const regView = (res, error, v = {}) => res.render('app/register', { error, v, termini: TERMINI[res.locals.lang] || '', privacy: PRIVACY_TXT[res.locals.lang] || '', mailOn: mailEnabled() });

r.get('/registrati', (req, res) => {
  if (res.locals.user) return res.redirect('/area');
  regView(res, null);
});
r.post('/registrati', loginLimiter, async (req, res) => {
  const L = res.locals.L;
  const v = { name: clip(req.body.name), email: clip(req.body.email).toLowerCase(), phone: clip(req.body.phone, 40), boat: clip(req.body.boat) };
  if (!mailEnabled()) return regView(res, L.reg_nomail, v);
  if (!v.name || !v.email || !v.phone || !v.boat) return regView(res, L.reg_err_fields, v);
  if (!EMAIL.test(v.email)) return regView(res, L.reg_err_email, v);
  const pw = String(req.body.password || '');
  if (pw.length < 8 || pw !== String(req.body.password2 || '')) return regView(res, L.reg_err_pw, v);
  if (req.body.accept !== 'on') return regView(res, L.reg_err_terms, v);
  const hash = await bcrypt.hash(pw, 12);
  const old = await one('SELECT * FROM users WHERE lower(email)=$1', [v.email]);
  let u;
  if (old && old.email_verified) return regView(res, L.reg_err_exists, v);
  if (old) { // registrazione già iniziata ma mai confermata: aggiorniamo i dati
    u = await one(`UPDATE users SET name=$1, phone=$2, password_hash=$3, lang=$4, terms_accepted_at=now() WHERE id=$5 RETURNING *`,
      [v.name, v.phone, hash, res.locals.lang, old.id]);
    await q('UPDATE boats SET nome=$1 WHERE owner_id=$2 AND id=(SELECT min(id) FROM boats WHERE owner_id=$2)', [v.boat, u.id]);
  } else {
    u = await one(`INSERT INTO users(email, password_hash, name, phone, role, lang, must_change_password, email_verified, self_registered, terms_accepted_at)
      VALUES ($1,$2,$3,$4,'client',$5,false,false,true,now()) RETURNING *`, [v.email, hash, v.name, v.phone, res.locals.lang]);
    await q('INSERT INTO boats(owner_id, nome) VALUES ($1,$2)', [u.id, v.boat]);
  }
  const sent = await sendVerify(req, u);
  if (!sent) return regView(res, L.error, v);
  res.render('app/registered', { email: v.email, resent: false });
});
r.post('/registrati/reinvia', loginLimiter, async (req, res) => {
  const email = clip(req.body.email).toLowerCase();
  const u = await one('SELECT * FROM users WHERE lower(email)=$1 AND NOT email_verified AND active', [email]);
  if (u && mailEnabled()) await sendVerify(req, u);
  res.render('app/registered', { email, resent: true });
});
r.get('/verifica/:tk', async (req, res) => {
  if (res.locals.user) return res.redirect('/area');
  const u = await one(`UPDATE users SET email_verified=true, verify_token=NULL, verify_expires=NULL
    WHERE verify_token=$1 AND verify_expires > now() AND NOT email_verified RETURNING *`, [String(req.params.tk)]);
  if (!u) return res.status(400).render('app/login', { error: res.locals.L.reg_bad_link, email: '' });
  const s = await settings();
  const b = await one('SELECT nome FROM boats WHERE owner_id=$1 ORDER BY id LIMIT 1', [u.id]);
  send(s.admin_email, `[Nuovo cliente registrato] ${u.name}`, layout('Nuovo cliente registrato',
    [`Nome: ${esc(u.name)}`, `Email: ${esc(u.email)}`, `Cellulare: ${esc(u.phone)}`, `Barca: ${esc(b ? b.nome : '')}`],
    { label: 'Apri la gestione', url: `${appBase(req)}/admin` })).catch(() => {});
  req.session.regenerate((err) => {
    if (err) throw err;
    req.session.uid = u.id;
    req.session.lang = u.lang;
    flash(req, 'ok', tr(u.lang).reg_ok);
    q('UPDATE users SET last_login=now() WHERE id=$1', [u.id]).then(() => res.redirect('/area/home'));
  });
});
r.get('/termini', (req, res) => res.render('app/termini', { termini: TERMINI[res.locals.lang] || '', privacy: PRIVACY_TXT[res.locals.lang] || '' }));

r.post('/logout', (req, res) => req.session.destroy(() => res.redirect('/area/login')));

r.get('/password', (req, res) => res.render('app/forgot', { done: false }));
r.post('/password', loginLimiter, async (req, res) => {
  if (!mailEnabled()) return res.render('app/forgot', { done: res.locals.L.forgot_nomail });
  const u = await one('SELECT * FROM users WHERE lower(email)=$1 AND active', [clip(req.body.email).toLowerCase()]);
  if (u) {
    const tk = token();
    await q("UPDATE users SET reset_token=$1, reset_expires=now() + interval '2 hours' WHERE id=$2", [tk, u.id]);
    const base = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const M = tr(u.lang);
    await send(u.email, M.m_reset_subj,
      layout(M.m_reset_title, [M.m_reset_p1, M.m_reset_p2], { label: M.m_reset_btn, url: `${base}/area/reset/${tk}` }, u.lang));
  }
  res.render('app/forgot', { done: res.locals.L.forgot_sent });
});

r.get('/reset/:tk', async (req, res) => {
  const u = await one('SELECT id FROM users WHERE reset_token=$1 AND reset_expires > now()', [req.params.tk]);
  res.render('app/reset', { valid: Boolean(u), error: null });
});
r.post('/reset/:tk', async (req, res) => {
  const L = res.locals.L;
  const u = await one('SELECT id FROM users WHERE reset_token=$1 AND reset_expires > now()', [req.params.tk]);
  if (!u) return res.render('app/reset', { valid: false, error: null });
  const p1 = String(req.body.p1 || ''), p2 = String(req.body.p2 || '');
  if (p1.length < 8) return res.render('app/reset', { valid: true, error: L.pw_short });
  if (p1 !== p2) return res.render('app/reset', { valid: true, error: L.pw_mismatch });
  await q('UPDATE users SET password_hash=$1, reset_token=NULL, reset_expires=NULL, must_change_password=false WHERE id=$2', [await bcrypt.hash(p1, 12), u.id]);
  flash(req, 'ok', L.pw_changed);
  res.redirect('/area/login');
});

// Foto condivise via WhatsApp: link pubblico non indovinabile, solo quell'intervento
r.get('/condividi/:tk', async (req, res) => {
  const c = await one('SELECT c.*, b.nome FROM cleanings c JOIN boats b ON b.id=c.boat_id WHERE c.share_token=$1', [req.params.tk]);
  if (!c) return res.status(404).render('error', { code: 404, message: res.locals.L.not_found });
  const photos = await all('SELECT id, fase FROM photos WHERE cleaning_id=$1 ORDER BY id', [c.id]);
  c.prima = photos.filter((p) => p.fase !== 'dopo').map((p) => p.id);
  c.dopo = photos.filter((p) => p.fase === 'dopo').map((p) => p.id);
  res.render('app/shared', { c, photos });
});
r.get('/condividi/:tk/foto/:id', async (req, res) => {
  const p = await one(`SELECT p.data, p.thumb FROM photos p JOIN cleanings c ON c.id=p.cleaning_id
    WHERE c.share_token=$1 AND p.id=$2`, [req.params.tk, Number(req.params.id) || 0]);
  if (!p) return res.sendStatus(404);
  sendPhoto(res, p, req.query.t === '1' ? 'thumb' : 'big');
});

// ---------- da qui serve l'accesso ----------
r.use(requireUser);

// Barca corrente: sempre tra quelle del cliente loggato
r.use(async (req, res, next) => {
  if (res.locals.user.role === 'admin') return next();
  const boats = await all('SELECT id, nome FROM boats WHERE owner_id=$1 ORDER BY id', [res.locals.user.id]);
  res.locals.boats = boats;
  const want = Number(req.query.barca) || req.session.boatId;
  const cur = boats.find((b) => b.id === want) || boats[0] || null;
  req.session.boatId = cur ? cur.id : null;
  res.locals.boatId = req.session.boatId;
  res.locals.settings = await settings();
  next();
});

function needBoat(req, res, next) {
  if (res.locals.user.role === 'admin') return res.redirect('/admin');
  if (!res.locals.boatId) return res.render('app/noboat');
  next();
}

r.get('/home', needBoat, async (req, res) => {
  const d = await loadBoat(res.locals.boatId);
  res.render('app/home', { d });
});

r.get('/scheda', needBoat, async (req, res) => {
  const d = await loadBoat(res.locals.boatId);
  res.render('app/scheda', { d, GROUPS, TIPI, action: '/area/scheda' });
});
r.post('/scheda', needBoat, async (req, res) => {
  const v = fromBody(req.body);
  const cols = Object.keys(v);
  const old = await one('SELECT scad_assicurazione FROM boats WHERE id=$1 AND owner_id=$2', [res.locals.boatId, res.locals.user.id]);
  const resetAss = old && old.scad_assicurazione !== v.scad_assicurazione;
  await q(`UPDATE boats SET ${cols.map((c, i) => `${c}=$${i + 1}`).join(', ')}, updated_at=now()${resetAss ? ', assic_alert_sent=false' : ''}
    WHERE id=$${cols.length + 1} AND owner_id=$${cols.length + 2}`, [...cols.map((c) => v[c]), res.locals.boatId, res.locals.user.id]);
  flash(req, 'ok', res.locals.L.saved);
  res.redirect('/area/scheda');
});

r.get('/manutenzione', needBoat, async (req, res) => {
  const d = await loadBoat(res.locals.boatId);
  res.render('app/manutenzione', { d, base: '/area', canEditCleanings: false });
});

r.post('/promemoria', needBoat, async (req, res) => {
  const v = req.body.remove ? null : dateOrNull(req.body.data);
  await q('UPDATE boats SET prox_pulizia=$1, prox_pulizia_sent=false WHERE id=$2 AND owner_id=$3', [v, res.locals.boatId, res.locals.user.id]);
  flash(req, 'ok', res.locals.L.saved);
  res.redirect('/area/manutenzione#pulizia');
});

// Anodi: gestiti dal cliente
const anodeVals = (b) => [clip(b.posizione), clip(b.codice), clip(b.dati), dateOrNull(b.data_montaggio), dateOrNull(b.data_alert), clip(b.note, 1000)];

r.post('/anodi', needBoat, upload.array('foto', 5), async (req, res) => {
  const a = await one(`INSERT INTO anodes(boat_id, posizione, codice, dati, data_montaggio, data_alert, note, updated_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,'client') RETURNING id`, [res.locals.boatId, ...anodeVals(req.body)]);
  await saveMany(req.files, { boatId: res.locals.boatId, anodeId: a.id });
  flash(req, 'ok', res.locals.L.saved);
  res.redirect('/area/manutenzione#anodi');
});

r.post('/anodi/:id', needBoat, upload.array('foto', 5), async (req, res) => {
  const a = await one('SELECT * FROM anodes WHERE id=$1 AND boat_id=$2', [Number(req.params.id) || 0, res.locals.boatId]);
  if (!a) return res.sendStatus(404);
  const v = anodeVals(req.body);
  const alertChanged = (a.data_alert || null) !== v[4];
  await q(`UPDATE anodes SET posizione=$1, codice=$2, dati=$3, data_montaggio=$4, data_alert=$5, note=$6, updated_by='client', updated_at=now()
    ${alertChanged ? ', alert_sent=false' : ''} WHERE id=$7`, [...v, a.id]);
  await saveMany(req.files, { boatId: res.locals.boatId, anodeId: a.id });
  flash(req, 'ok', res.locals.L.saved);
  res.redirect('/area/manutenzione#anodo-' + a.id);
});

r.post('/anodi/:id/elimina', needBoat, async (req, res) => {
  await q('DELETE FROM anodes WHERE id=$1 AND boat_id=$2', [Number(req.params.id) || 0, res.locals.boatId]);
  res.redirect('/area/manutenzione#anodi');
});

r.post('/foto/:id/elimina', needBoat, async (req, res) => {
  // il cliente può togliere solo le foto dei suoi anodi, non quelle degli interventi
  await q('DELETE FROM photos WHERE id=$1 AND boat_id=$2 AND anode_id IS NOT NULL', [Number(req.params.id) || 0, res.locals.boatId]);
  res.redirect('/area/manutenzione#anodi');
});

// Richiesta intervento: la registriamo e apriamo WhatsApp
r.get('/richiesta', needBoat, async (req, res) => {
  const b = await one('SELECT nome, targa FROM boats WHERE id=$1', [res.locals.boatId]);
  await q('INSERT INTO requests(boat_id, user_id, motivo) VALUES ($1,$2,$3)', [res.locals.boatId, res.locals.user.id, clip(req.query.motivo || 'intervento')]);
  const txt = fill(res.locals.L.wa_request, { boat: b.nome + (b.targa ? ' (' + b.targa + ')' : '') });
  res.redirect(`https://wa.me/${res.locals.settings.whatsapp}?text=${encodeURIComponent(txt)}`);
});

r.get('/foto/:id', async (req, res) => {
  const p = res.locals.user.role === 'admin'
    ? await one('SELECT data, thumb FROM photos WHERE id=$1', [Number(req.params.id) || 0])
    : await one('SELECT p.data, p.thumb FROM photos p JOIN boats b ON b.id=p.boat_id WHERE p.id=$1 AND b.owner_id=$2', [Number(req.params.id) || 0, res.locals.user.id]);
  if (!p) return res.sendStatus(404);
  sendPhoto(res, p, req.query.t === '1' ? 'thumb' : 'big');
});

r.get('/guida', (req, res) => res.render('guida', { G: require('../guida').CLIENTE, titolo: 'Guida all\'area clienti', intro: 'Come usare la tua area personale. Tocca "Ascolta" per sentire una sezione, oppure ascolta tutta la guida dall\'inizio.' }));
r.get('/profilo', (req, res) => res.render('app/profilo', { error: null }));
r.post('/profilo', async (req, res) => {
  const lang = LANGS.includes(req.body.lang) ? req.body.lang : 'it';
  await q('UPDATE users SET name=$1, phone=$2, lang=$3 WHERE id=$4', [clip(req.body.name), clip(req.body.phone), lang, res.locals.user.id]);
  flash(req, 'ok', tr(lang).saved);
  res.redirect('/area/profilo');
});
r.post('/profilo/password', async (req, res) => {
  const L = res.locals.L;
  const u = await one('SELECT password_hash FROM users WHERE id=$1', [res.locals.user.id]);
  const p1 = String(req.body.p1 || ''), p2 = String(req.body.p2 || '');
  let error = null;
  if (!(await bcrypt.compare(String(req.body.current || ''), u.password_hash))) error = L.pw_wrong;
  else if (p1.length < 8) error = L.pw_short;
  else if (p1 !== p2) error = L.pw_mismatch;
  if (error) return res.status(400).render('app/profilo', { error });
  await q('UPDATE users SET password_hash=$1, must_change_password=false WHERE id=$2', [await bcrypt.hash(p1, 12), res.locals.user.id]);
  flash(req, 'ok', L.pw_changed);
  res.redirect(res.locals.user.role === 'admin' ? '/admin' : '/area/home');
});

module.exports = r;
