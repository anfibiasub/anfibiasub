// Invio email tramite Brevo (API HTTP: Railway blocca l'SMTP in uscita).
// Senza BREVO_API_KEY le email non partono: vengono solo registrate nel log.
const { q } = require('./db');

const enabled = () => process.env.MAIL_DRY === '1' || Boolean(process.env.BREVO_API_KEY && process.env.MAIL_FROM);

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Corpo email nello stile del sito
function layout(title, paragraphs, button, lang = 'it') {
  const footer = require('./i18n').t(lang).m_footer;
  const ps = paragraphs.map((p) => `<p style="margin:0 0 14px;color:#C9D8E3;font-size:15px;line-height:1.6">${p}</p>`).join('');
  const btn = button
    ? `<p style="margin:24px 0 0"><a href="${esc(button.url)}" style="display:inline-block;background:#1FB4EE;color:#03263F;text-decoration:none;font-weight:600;border-radius:24px;padding:13px 24px;font-size:14px">${esc(button.label)}</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#050E1A;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050E1A;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0D2238;border:1px solid #1B3D5C;border-radius:14px">
<tr><td style="padding:26px 28px 6px;font-weight:800;font-size:20px;letter-spacing:1px;color:#fff">ANFIBIA<span style="color:#3CC6F5">SUB</span></td></tr>
<tr><td style="padding:10px 28px 28px"><h1 style="margin:0 0 16px;color:#fff;font-size:22px">${esc(title)}</h1>${ps}${btn}</td></tr>
</table>
<p style="color:#6F8798;font-size:12px;margin:16px 0 0">${esc(footer)}</p>
</td></tr></table></body></html>`;
}

// "a@x.it; b@y.it" -> ['a@x.it', 'b@y.it'] (anche con la virgola)
const splitMails = (s) => String(s || '').split(/[;,\s]+/).map((x) => x.trim()).filter((x) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x));

// attachments: [{ name: 'file.xlsx', content: Buffer }]
async function send(to, subject, html, attachments = []) {
  const list = splitMails(to);
  if (!list.length) return false;
  to = list.join('; ');
  if (process.env.MAIL_DRY === '1') { // solo per le prove in locale: non invia, registra nel log
    await q('INSERT INTO mail_log(to_email, subject, ok, info) VALUES ($1,$2,true,$3)', [to, subject, 'DRY ' + (attachments.length ? `[allegati: ${attachments.map((a) => a.name).join(', ')}] ` : '') + html.slice(0, 2000)]);
    return true;
  }
  if (!enabled()) {
    console.log(`[email non inviata: Brevo non configurato] a=${to} oggetto="${subject}"`);
    await q('INSERT INTO mail_log(to_email, subject, ok, info) VALUES ($1,$2,false,$3)', [to, subject, 'Brevo non configurato']);
    return false;
  }
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: process.env.MAIL_FROM, name: process.env.MAIL_FROM_NAME || 'Anfibiasub' },
        to: list.map((email) => ({ email })),
        subject,
        htmlContent: html,
        ...(attachments.length ? { attachment: attachments.map((a) => ({ name: a.name, content: a.content.toString('base64') })) } : {}),
      }),
    });
    const info = res.ok ? 'ok' : `HTTP ${res.status} ${(await res.text()).slice(0, 300)}`;
    await q('INSERT INTO mail_log(to_email, subject, ok, info) VALUES ($1,$2,$3,$4)', [to, subject, res.ok, info]);
    return res.ok;
  } catch (e) {
    await q('INSERT INTO mail_log(to_email, subject, ok, info) VALUES ($1,$2,false,$3)', [to, subject, String(e).slice(0, 300)]);
    return false;
  }
}

module.exports = { send, layout, enabled, esc, splitMails };
