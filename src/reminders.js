// Promemoria automatici: controllo ogni ora, ogni avviso parte una sola volta.
const { q, one, all, settings } = require('./db');
const { send, layout, esc, enabled } = require('./mail');
const { t, fill, fmtDate } = require('./i18n');
const { todayStr } = require('./status');

const appUrl = () => (process.env.APP_URL || '').replace(/\/$/, '');

async function run() {
  // Senza Brevo non segniamo nulla come inviato: gli avvisi partiranno appena le email sono attive
  if (!enabled()) return;
  const s = await settings();
  const today = todayStr();

  // Anodi con data di avviso raggiunta
  const anodes = await all(`SELECT a.*, b.nome AS barca, u.email, u.lang, u.name FROM anodes a
    JOIN boats b ON b.id=a.boat_id JOIN users u ON u.id=b.owner_id
    WHERE a.data_alert IS NOT NULL AND a.data_alert <= $1 AND NOT a.alert_sent AND u.active`, [today]);
  for (const a of anodes) {
    const L = t(a.lang);
    const v = { name: esc(a.name), boat: esc(a.barca), anode: esc(a.posizione || a.codice) };
    await send(a.email, fill(L.m_anode_subj, { boat: a.barca }), layout(L.anodes, [fill(L.m_hello, v), fill(L.m_anode_p1, v), L.m_anode_p2], { label: L.area, url: appUrl() + '/area/manutenzione' }, a.lang));
    await send(s.admin_email, `[Promemoria anodi] ${a.barca}`, layout('Promemoria anodi', [`Cliente: ${esc(a.name)} (${esc(a.email)})`, `Barca: ${esc(a.barca)}`, `Anodo: ${esc(a.posizione)} ${esc(a.codice)}, avviso del ${fmtDate(a.data_alert)}`]));
    await q('UPDATE anodes SET alert_sent=true WHERE id=$1', [a.id]);
  }

  // Prossima pulizia impostata dal cliente
  const boats = await all(`SELECT b.*, u.email, u.lang, u.name FROM boats b JOIN users u ON u.id=b.owner_id
    WHERE b.prox_pulizia IS NOT NULL AND b.prox_pulizia <= $1 AND NOT b.prox_pulizia_sent AND u.active`, [today]);
  for (const b of boats) {
    const L = t(b.lang);
    const v = { name: esc(b.name), boat: esc(b.nome) };
    await send(b.email, fill(L.m_clean_subj, { boat: b.nome }), layout(L.cleaning, [fill(L.m_hello, v), fill(L.m_clean_p1, v), L.m_clean_p2],
      { label: L.request_wa, url: `https://wa.me/${s.whatsapp}?text=${encodeURIComponent(fill(L.wa_book, { boat: b.nome }))}` }, b.lang));
    await send(s.admin_email, `[Promemoria pulizia] ${b.nome}`, layout('Promemoria pulizia', [`Cliente: ${esc(b.name)} (${esc(b.email)})`, `Barca: ${esc(b.nome)}`, `Data scelta dal cliente: ${fmtDate(b.prox_pulizia)}`]));
    await q('UPDATE boats SET prox_pulizia_sent=true WHERE id=$1', [b.id]);
  }

  await monthly(false);

  // Assicurazione in scadenza entro 30 giorni
  const limit = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const ins = await all(`SELECT b.*, u.email, u.lang, u.name FROM boats b JOIN users u ON u.id=b.owner_id
    WHERE b.scad_assicurazione IS NOT NULL AND b.scad_assicurazione <= $1 AND b.scad_assicurazione >= $2 AND NOT b.assic_alert_sent AND u.active`, [limit, today]);
  for (const b of ins) {
    const L = t(b.lang);
    const v = { name: esc(b.name), boat: esc(b.nome), date: fmtDate(b.scad_assicurazione, b.lang) };
    await send(b.email, fill(L.m_ins_subj, { boat: b.nome }), layout(L.insurance, [fill(L.m_hello, v), fill(L.m_ins_p1, v)], { label: L.area, url: appUrl() + '/area/scheda' }, b.lang));
    await q('UPDATE boats SET assic_alert_sent=true WHERE id=$1', [b.id]);
  }
}

// Controllo mensile: il primo giorno di ogni mese manda un riepilogo a chi segue il sito.
// Serve anche a tenere viva la chiave Brevo, che scade dopo 90 giorni senza invii.
async function monthly(force) {
  const s = await settings();
  const to = s.controllo_email;
  const mese = todayStr().slice(0, 7);
  if (!to || (!force && s.controllo_mese === mese)) return false;
  const n = await one(`SELECT
      (SELECT count(*) FROM users WHERE role='client' AND active)::int AS clienti,
      (SELECT count(*) FROM boats)::int AS barche,
      (SELECT count(*) FROM cleanings WHERE created_at > now() - interval '30 days')::int AS interventi,
      (SELECT count(*) FROM users WHERE role='client' AND last_login > now() - interval '30 days')::int AS accessi_clienti,
      (SELECT count(*) FROM mail_log WHERE ok AND created_at > now() - interval '30 days')::int AS mail_ok,
      (SELECT count(*) FROM mail_log WHERE NOT ok AND created_at > now() - interval '30 days')::int AS mail_ko,
      (SELECT count(*) FROM accessi WHERE password_enc = '')::int AS senza_pw`);
  const errori = await all("SELECT created_at, to_email, info FROM mail_log WHERE NOT ok AND created_at > now() - interval '30 days' ORDER BY created_at DESC LIMIT 5");
  const righe = [
    `Il sito è acceso e le email partono: se leggi questo messaggio, Brevo funziona.`,
    `<b>Ultimi 30 giorni</b><br>Interventi caricati: ${n.interventi}<br>Clienti che sono entrati nell'area: ${n.accessi_clienti}<br>Email inviate: ${n.mail_ok} · non riuscite: ${n.mail_ko}`,
    `<b>Totale</b><br>Clienti attivi: ${n.clienti} · barche: ${n.barche}`,
  ];
  if (errori.length) righe.push('<b>Email non riuscite</b><br>' + errori.map((e) => `${esc(new Date(e.created_at).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' }))} · ${esc(e.to_email)} · ${esc(e.info)}`).join('<br>'));
  if (n.senza_pw) righe.push(`Nel pannello Accessi ci sono ${n.senza_pw} voci senza password: completale finché te le ricordi.`);
  // backup: tutto l'archivio in Excel, allegato
  const attachments = [];
  try {
    const x = await require('./export').buildExcel();
    attachments.push({ name: x.filename, content: x.buffer });
    righe.push(`<b>Backup</b><br>In allegato <b>${esc(x.filename)}</b>: tutti i clienti, le barche, gli interventi e gli anodi in Excel. Conservalo: se un giorno servisse, da lì si recupera tutto (le foto restano nel sito).`);
  } catch (e) {
    righe.push(`<b>Backup</b><br>Questo mese l'Excel non è stato creato (${esc(e.message)}): scaricalo a mano dalla gestione.`);
  }
  const ok = await send(to, `Controllo mensile sito Anfibiasub · ${mese}`, layout('Controllo mensile', righe, { label: 'Apri la gestione', url: appUrl() + '/admin/impostazioni' }), attachments);
  if (ok) await q("INSERT INTO settings(key,value) VALUES ('controllo_mese',$1) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value", [mese]);
  return ok;
}

function start() {
  const tick = () => run().catch((e) => console.error('Promemoria:', e.message));
  setTimeout(tick, 15 * 1000);
  setInterval(tick, 60 * 60 * 1000);
}

module.exports = { start, run, monthly };
