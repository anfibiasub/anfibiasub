// Controllo automatico di tutto il sito (sito pubblico, area clienti, gestione) su telefono, tablet e PC.
// Serve il server acceso con un database vuoto o di prova. Crea da solo clienti, barche, interventi e foto finti.
//
//   BASE=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... node test/controllo.js
//   MOTORI=chromium,webkit   -> Chrome/Android e Safari/iPhone (webkit va installato: npx playwright install webkit)
//
// Esce con codice 1 se trova problemi: pagine che sbordano, elementi fuori schermo o sovrapposti, campi più larghi
// del loro riquadro, immagini rotte, errori JavaScript o del server, schede dello storico che non si aprono.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { chromium, webkit, devices } = require('playwright');

const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/$/, '');
const ADMIN = { email: process.env.ADMIN_EMAIL, pw: process.env.ADMIN_PASSWORD };
const MOTORI = (process.env.MOTORI || 'chromium').split(',').map((s) => s.trim()).filter(Boolean);
const OUT = process.env.OUT || path.join(__dirname, 'risultati');
const ROOT = path.join(__dirname, '..');
const IGNORA = process.env.IGNORA ? new RegExp(process.env.IGNORA) : null; // indirizzi da non segnalare (solo per prove locali)
const SCHERMATE = process.env.SCHERMATE === '1';

const DISPOSITIVI = [
  ['telefono piccolo (iPhone SE)', devices['iPhone SE']],
  ['telefono (iPhone 13)', devices['iPhone 13']],
  ['telefono Android (Pixel 7)', devices['Pixel 7']],
  ['tablet verticale (iPad)', devices['iPad (gen 7)']],
  ['tablet orizzontale (iPad)', devices['iPad (gen 7) landscape']],
  ['PC', { viewport: { width: 1440, height: 900 } }],
];

const problemi = []; // { gravita: 'errore'|'avviso', pagina, dispositivo, motore, cosa }
const segnala = (gravita, ctx, cosa) => problemi.push({ gravita, ...ctx, cosa });

// ---------------------------------------------------------------- dati di prova
async function fotoFinte(dir, n) {
  fs.mkdirSync(dir, { recursive: true });
  const files = [];
  for (let i = 0; i < n; i++) {
    const f = path.join(dir, `foto-${i}.jpg`);
    await sharp({ create: { width: 1200, height: 900, channels: 3, background: { r: 30 + i * 20, g: 110, b: 150 } } }).jpeg().toFile(f);
    files.push(f);
  }
  return files;
}

async function login(ctx, email, pw) {
  const p = await ctx.newPage();
  await p.goto(BASE + '/area/login');
  await p.fill('input[name=email]', email);
  await p.fill('input[name=password]', pw);
  await Promise.all([p.waitForNavigation(), p.click('form button[type=submit], form .btn')]);
  return p;
}

async function preparaDati(browser) {
  const ctx = await browser.newContext();
  const p = await login(ctx, ADMIN.email, ADMIN.pw);
  if (!p.url().includes('/admin')) throw new Error('Accesso admin non riuscito: controlla ADMIN_EMAIL e ADMIN_PASSWORD');
  const foto = await fotoFinte(path.join(OUT, 'foto'), 8);

  async function nuovoCliente(v) {
    await p.goto(BASE + '/admin/clienti/nuovo');
    for (const [k, val] of Object.entries(v)) {
      const el = p.locator(`[name=${k}]`).first();
      if ((await el.evaluate((e) => e.tagName)) === 'SELECT') await el.selectOption(val); else await el.fill(val);
    }
    const nessuno = p.locator('input[name=invia][value=""], input[name=invia][value="0"]').first();
    if (await nessuno.count()) await nessuno.check().catch(() => {});
    await Promise.all([p.waitForNavigation(), p.click('main form button[type=submit]')]);
    const pw = (await p.locator('.cred').nth(2).textContent()).trim();
    const boatHref = await p.locator('a[href^="/admin/barca/"]').first().getAttribute('href');
    return { pw, boatId: Number(boatHref.split('/').pop()) };
  }
  const tag = Date.now().toString(36);
  const A = { email: `mario.${tag}@prova.it`, lang: 'it' };
  Object.assign(A, await nuovoCliente({ name: 'Mario Rossi Bianchi Verdi', email: A.email, phone: '3331234567', lang: 'it', nome: 'Stella del Mare Ammiraglia Grande', targa: 'SV1234 · K 7', posto_barca: 'Molo 3 posto 27' }));
  const B = { email: `john.${tag}@prova.it`, lang: 'en' };
  Object.assign(B, await nuovoCliente({ name: 'John Smith', email: B.email, phone: '', lang: 'en', nome: 'Sea Breeze', targa: 'GE99', posto_barca: '' }));

  // 12 interventi (più di 10, così si vede "Carica altri 10"), con foto prima e dopo
  const tipi = ['Pulizia eliche', 'Carena + eliche', 'Pulizia carena', 'Sostituzione anodi'];
  for (const [cli, quanti] of [[A, 12], [B, 2]]) {
    for (let i = 0; i < quanti; i++) {
      await p.goto(`${BASE}/admin/barca/${cli.boatId}?tab=interventi`);
      const f = p.locator('form[action$="/pulizia"]').first();
      const d = new Date(Date.UTC(2026, 9, 28 - i * 2)).toISOString().slice(0, 10);
      await f.locator('input[name=data]').fill(d);
      await f.locator('input[name=tipo]').fill(tipi[i % tipi.length]);
      if (i % 3 !== 2) await f.locator('input[name=foto_prima]').setInputFiles(foto.slice(0, 2 + (i % 5)));
      if (i % 2 === 0) await f.locator('input[name=foto_dopo]').setInputFiles(foto.slice(5, 8));
      await f.locator('textarea[name=note]').fill(i === 0 ? 'Eliche molto incrostate, pulite e lucidate. Controllato anche l\'asse e il piede poppiero.' : '');
      const nessuno = f.locator('input[name=avvisa][value=""]');
      if (await nessuno.count()) await nessuno.check();
      await Promise.all([p.waitForNavigation(), f.locator('button[type=submit]').first().click()]);
    }
    // un anodo con foto
    await p.goto(`${BASE}/admin/barca/${cli.boatId}?tab=anodi`);
    const fa = p.locator('form[action$="/anodi"]').first();
    if (await fa.count()) {
      await fa.locator('[name=posizione]').fill('Elica');
      await fa.locator('[name=codice]').fill('456');
      await fa.locator('[name=dati]').fill('Ogiva 6 fori');
      await fa.locator('[name=data_montaggio]').fill('2026-11-05');
      await fa.locator('[name=data_alert]').fill('2027-01-01');
      await fa.locator('[name=foto]').setInputFiles(foto.slice(0, 1));
      await Promise.all([p.waitForNavigation(), fa.locator('button[type=submit]').first().click()]);
    }
  }
  await p.goto(`${BASE}/admin/barca/${A.boatId}?tab=interventi`);
  const share = await p.locator('a[href^="/area/condividi/"]').first().getAttribute('href');
  const adminState = await ctx.storageState();
  await ctx.close();

  // primo accesso dei clienti: cambiano la password provvisoria
  for (const cli of [A, B]) {
    const c = await browser.newContext();
    const q = await login(c, cli.email, cli.pw);
    const nuova = 'Prova-' + tag + '-1';
    await q.goto(BASE + '/area/profilo');
    await q.fill('input[name=current]', cli.pw);
    await q.fill('input[name=p1]', nuova);
    await q.fill('input[name=p2]', nuova);
    await Promise.all([q.waitForNavigation(), q.locator('form[action$="/profilo/password"] button[type=submit]').click()]);
    cli.state = await c.storageState();
    await c.close();
  }
  return { adminState, A, B, share };
}

// ---------------------------------------------------------------- pagine
function pagineSito() {
  const pub = path.join(ROOT, 'public');
  const out = [];
  const walk = (d, rel) => {
    for (const f of fs.readdirSync(d)) {
      const full = path.join(d, f);
      if (fs.statSync(full).isDirectory()) { if (['en', 'es', 'de'].includes(f)) walk(full, rel + f + '/'); continue; }
      // come nei link del sito: senza .html, tranne quando esiste anche una cartella con lo stesso nome (es. abyss)
      const nomeSenza = f.replace(/\.html$/, '');
      if (f.endsWith('.html')) out.push('/' + rel + (f === 'index.html' ? '' : fs.existsSync(path.join(d, nomeSenza)) ? f : nomeSenza));
    }
  };
  walk(pub, '');
  return out.sort();
}

// ---------------------------------------------------------------- controlli dentro la pagina
function controlliPagina() {
  const vw = window.innerWidth;
  const out = [];
  const nome = (e) => {
    let s = e.tagName.toLowerCase();
    if (e.id) s += '#' + e.id;
    const cls = (typeof e.className === 'string' ? e.className : '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (cls.length) s += '.' + cls.join('.');
    const t = (e.innerText || e.value || e.getAttribute('aria-label') || e.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return t ? `${s} «${t}»` : s;
  };
  const visibile = (e) => {
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    for (let x = e; x && x !== document.body; x = x.parentElement) {
      const cs = getComputedStyle(x);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
      // dentro una scheda chiusa si vede solo la sua riga (summary), non il resto
      if (x.tagName === 'DETAILS' && !x.open && x !== e) {
        const s = x.querySelector(':scope > summary');
        if (!s || !s.contains(e)) return false;
      }
    }
    return true;
  };
  const tagliato = (e) => { // dentro un contenitore che scorre o taglia: non è un difetto
    for (let x = e.parentElement; x && x !== document.body; x = x.parentElement) {
      const cs = getComputedStyle(x);
      if (/(auto|scroll|hidden|clip)/.test(cs.overflowX) || cs.position === 'fixed') return true;
    }
    return false;
  };

  // 1) la pagina sborda in orizzontale
  const sw = document.documentElement.scrollWidth;
  if (sw > vw + 1) out.push(['errore', `la pagina è più larga dello schermo (${sw}px su ${vw}px)`]);

  // 2) elementi fuori dallo schermo
  const tutti = [...document.querySelectorAll('main *, header *, footer *, .site-header *, .app-header *')];
  const fuori = tutti.filter((e) => {
    if (!visibile(e) || tagliato(e)) return false;
    const r = e.getBoundingClientRect();
    return (r.right > vw + 2 || r.left < -2) && !e.closest('[aria-hidden=true]');
  });
  const radici = fuori.filter((e) => !fuori.includes(e.parentElement)).slice(0, 5);
  for (const e of radici) out.push(['errore', `esce dallo schermo: ${nome(e)}`]);

  // 3) campi più larghi del loro riquadro (il caso della data su iPhone)
  for (const e of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')) {
    if (!visibile(e)) continue;
    const p = e.parentElement.getBoundingClientRect(), r = e.getBoundingClientRect();
    if (r.right > p.right + 1.5 || r.left < p.left - 1.5) out.push(['errore', `campo più largo del suo riquadro: ${nome(e)} (${Math.round(r.width)}px in ${Math.round(p.width)}px)`]);
  }

  // 4) testi, pulsanti e campi sovrapposti
  const sel = 'h1,h2,h3,h4,label,button,a.btn,.btn,.chip,.chip-sm,.pill,input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea,summary,p,li,strong,.hint,.eyebrow';
  const fisso = (e) => { for (let x = e; x && x !== document.body; x = x.parentElement) { const ps = getComputedStyle(x).position; if (ps === 'fixed' || ps === 'sticky') return true; } return false; };
  const els = [...document.querySelectorAll(sel)].filter((e) => visibile(e) && !e.closest('svg') && !fisso(e));
  const rects = els.map((e) => e.getBoundingClientRect());
  let n = 0;
  for (let i = 0; i < els.length && n < 6; i++) {
    for (let j = i + 1; j < els.length && n < 6; j++) {
      const a = els[i], b = els[j];
      if (a.contains(b) || b.contains(a)) continue;
      const ra = rects[i], rb = rects[j];
      const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (w > 3 && h > 3 && w * h > 40) {
        // un'etichetta che contiene il campo o testo sopra un'immagine decorativa non conta
        if (a.tagName === 'LABEL' && a.control === b || b.tagName === 'LABEL' && b.control === a) continue;
        out.push(['errore', `sovrapposti: ${nome(a)} e ${nome(b)}`]); n++;
      }
    }
  }

  // 5) testi tagliati: la scritta non ci sta nel pulsante o nella casella e viene nascosta
  let tg = 0;
  for (const e of document.querySelectorAll('button, .btn, a, label, span, strong, h1, h2, h3, p, summary, .pill, .chip, td, th')) {
    if (tg >= 6 || !visibile(e) || !e.innerText || !e.innerText.trim()) continue;
    if ([...e.children].some((c) => c.innerText && c.innerText.trim())) continue; // solo l'elemento che contiene davvero il testo
    const cs = getComputedStyle(e);
    if (!/(hidden|clip)/.test(cs.overflowX) && cs.textOverflow !== 'ellipsis') continue;
    if (e.scrollWidth > e.clientWidth + 1) { out.push(['errore', `testo tagliato: ${nome(e)}`]); tg++; }
  }

  // 6) parole spezzate a metà nei titoli e nei pulsanti (es. "Manutenzion-e")
  const cv = document.createElement('canvas').getContext('2d');
  let ps = 0;
  for (const e of document.querySelectorAll('h1, h2, h3, .btn, button, .eyebrow, strong')) {
    if (ps >= 4 || !visibile(e) || !e.innerText) continue;
    const cs = getComputedStyle(e);
    cv.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    // per gli elementi in linea conta la larghezza del blocco che li contiene
    let box = e;
    while (box && getComputedStyle(box).display === 'inline') box = box.parentElement;
    const bcs = getComputedStyle(box);
    const largh = box.clientWidth - parseFloat(bcs.paddingLeft) - parseFloat(bcs.paddingRight);
    if (largh < 20) continue;
    const tt = cs.textTransform === 'uppercase' ? e.innerText.toUpperCase() : e.innerText;
    const ls = parseFloat(cs.letterSpacing) || 0;
    for (const w of tt.split(/\s+/)) {
      if (w.length < 4) continue;
      const lw = cv.measureText(w).width + ls * w.length;
      if (lw > largh + 2) { out.push(['errore', `parola spezzata a metà: «${w}» in ${nome(e)}`]); ps++; break; }
    }
  }

  // 7) immagini rotte
  for (const img of document.querySelectorAll('img')) {
    if (img.getAttribute('src') && img.complete && img.naturalWidth === 0 && visibile(img)) out.push(['errore', `immagine rotta: ${img.getAttribute('src')}`]);
  }

  // 8) pulsanti troppo piccoli da toccare (solo avviso)
  if (vw < 1024) {
    let k = 0;
    for (const e of document.querySelectorAll('main button, main .btn, main a.chip, main a.chip-sm, main summary, header button')) {
      if (!visibile(e)) continue;
      const r = e.getBoundingClientRect();
      if (r.height < 24 && k++ < 3) out.push(['avviso', `pulsante piccolo da toccare (${Math.round(r.height)}px): ${nome(e)}`]);
    }
  }
  return out;
}

async function visita(ctx, url, info) {
  const page = await ctx.newPage();
  const errori = [];
  page.on('pageerror', (e) => errori.push(['errore', 'errore JavaScript: ' + e.message.split('\n')[0]]));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errori.push(['avviso', 'console: ' + m.text().slice(0, 160)]); });
  page.on('response', (r) => {
    const u = r.url();
    if (u.startsWith(BASE) && r.status() >= 400 && !u.includes('/api/') && !(IGNORA && IGNORA.test(u))) errori.push(['errore', `il server risponde ${r.status()} per ${u.replace(BASE, '')}`]);
  });
  try {
    const res = await page.goto(BASE + url, { waitUntil: 'load', timeout: 45000 });
    if (res && res.status() >= 400) errori.push(['errore', `la pagina risponde ${res.status()}`]);
    await page.evaluate(async () => { // scorre fino in fondo per caricare le immagini "lazy"
      for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(400);
    for (const p of await page.evaluate(controlliPagina)) errori.push(p);
    if (SCHERMATE) {
      const dir = path.join(OUT, 'schermate', (info.motore + ' ' + info.dispositivo).replace(/[^\w]+/g, '_'));
      fs.mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: path.join(dir, (url.replace(/[^\w]+/g, '_') || 'home') + '.png'), fullPage: true });
    }
  } catch (e) {
    errori.push(['errore', 'la pagina non si carica: ' + e.message.split('\n')[0]]);
  }
  for (const [g, c] of errori) segnala(g, { pagina: url, ...info }, c);
  return page;
}

// interazioni sullo storico: apri una scheda, seleziona foto, filtri
async function provaStorico(page, url, info, admin) {
  const ctx = { pagina: url + ' (storico)', ...info };
  page.setDefaultTimeout(8000);
  try { await provaStorico2(page, ctx, admin); } catch (e) { segnala('errore', ctx, 'prova dello storico fallita: ' + e.message.split('\n')[0]); }
}
async function provaStorico2(page, ctx, admin) {
  const jobs = page.locator('[data-jobs] .job');
  if (!(await jobs.count())) return segnala('errore', ctx, 'lo storico non mostra nessun intervento');
  const primo = jobs.first();
  await primo.locator('summary').first().click();
  await page.waitForTimeout(200);
  if (!(await primo.evaluate((d) => d.open))) segnala('errore', ctx, 'toccando la scheda dell\'intervento non si apre');
  const corpo = primo.locator('.job-body');
  if (!(await corpo.isVisible())) segnala('errore', ctx, 'la scheda aperta non mostra le foto');
  for (const p of await page.evaluate(controlliPagina)) segnala(p[0], ctx, p[1]);
  const vis = await page.evaluate(() => [...document.querySelectorAll('[data-jobs] .job')].filter((j) => getComputedStyle(j).display !== 'none').length);
  if (vis > 10) segnala('errore', ctx, `si vedono ${vis} interventi invece di 10`);
  const piu = page.locator('[data-job-more]');
  if (await piu.count() && await piu.isVisible()) {
    await piu.click();
    const dopo = await page.evaluate(() => [...document.querySelectorAll('[data-jobs] .job')].filter((j) => getComputedStyle(j).display !== 'none').length);
    if (dopo <= vis) segnala('errore', ctx, '"Carica altri 10" non mostra altri interventi');
  }
  // ricerca per intervallo di date: si vedono esattamente gli interventi tra "dal" e "al"; senza date tornano tutti
  const da = page.locator('[data-job-from]'), al = page.locator('[data-job-to]');
  if (await da.count() && await al.count()) {
    const date = (await page.evaluate(() => [...document.querySelectorAll('[data-jobs] .job')].map((j) => j.getAttribute('data-date')))).sort();
    if (date.length >= 3) {
      const a = date[1], b = date[date.length - 2];
      await da.fill(a); await al.fill(b);
      const attesi = date.filter((d) => d >= a && d <= b).length;
      const visti = await page.evaluate(() => [...document.querySelectorAll('[data-jobs] .job')].filter((j) => getComputedStyle(j).display !== 'none').length);
      if (visti !== attesi) segnala('errore', ctx, `ricerca dal ${a} al ${b}: si vedono ${visti} interventi invece di ${attesi}`);
      for (const p of await page.evaluate(controlliPagina)) segnala(p[0], ctx, p[1]);
      await da.fill(''); await al.fill('');
      const tutti = await page.evaluate(() => [...document.querySelectorAll('[data-jobs] .job')].filter((j) => getComputedStyle(j).display !== 'none').length);
      if (tutti < Math.min(date.length, 10)) segnala('errore', ctx, 'tolte le date non tornano tutti gli interventi');
    }
  }
  if (admin) {
    const pick = primo.locator('.pd-pick').first();
    if (await pick.count()) {
      await pick.scrollIntoViewIfNeeded();
      const bb = await pick.boundingBox();
      await page.mouse.click(bb.x + bb.width * 0.5, bb.y + bb.height * 0.75); // tocco nella foto, lontano dalle icone
      const ok = await primo.evaluate((d) => [...d.querySelectorAll('button[name=azione]')].every((b) => !b.disabled));
      if (!ok) segnala('errore', ctx, 'selezionando una foto i pulsanti Sposta/Anteprima/Elimina restano spenti');
    }
  }
}

// ---------------------------------------------------------------- avvio
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const engines = { chromium, webkit };
  const boot = await chromium.launch();
  console.log('Preparo i dati di prova…');
  const D = await preparaDati(boot);
  await boot.close();

  const pubbliche = pagineSito();
  const anonime = ['/area/login', '/area/registrati', '/area/password', '/area/termini', D.share];
  const cliente = ['/area/home', '/area/manutenzione', '/area/scheda', '/area/profilo', '/area/guida'];
  const admin = ['/admin', '/admin/clienti/nuovo', `/admin/barca/${D.A.boatId}?tab=interventi`, `/admin/barca/${D.A.boatId}?tab=anodi`,
    `/admin/barca/${D.A.boatId}?tab=scheda`, `/admin/barca/${D.A.boatId}?tab=cliente`, '/admin/impostazioni', '/admin/guida', '/admin/abyss'];

  for (const m of MOTORI) {
    const browser = await engines[m].launch();
    for (const [disp, dev] of DISPOSITIVI) {
      if (m === 'webkit' && dev.defaultBrowserType === 'chromium') continue;
      const info = { dispositivo: disp, motore: m === 'webkit' ? 'Safari (WebKit)' : 'Chrome' };
      const base = { ...dev }; delete base.defaultBrowserType;
      console.log(`${info.motore} · ${disp}`);
      const anon = await browser.newContext(base);
      for (const u of pubbliche.concat(anonime)) await (await visita(anon, u, info)).close();
      await anon.close();
      for (const cli of [D.A, D.B]) {
        const c = await browser.newContext({ ...base, storageState: cli.state });
        for (const u of cliente) {
          const p = await visita(c, u, { ...info, dispositivo: `${disp} · cliente ${cli.lang}` });
          if (u === '/area/manutenzione' && cli === D.A) await provaStorico(p, u, { ...info, dispositivo: `${disp} · cliente` }, false);
          await p.close();
        }
        await c.close();
      }
      const ac = await browser.newContext({ ...base, storageState: D.adminState });
      for (const u of admin) {
        const p = await visita(ac, u, info);
        if (u.includes('tab=interventi')) await provaStorico(p, u, info, true);
        await p.close();
      }
      await ac.close();
    }
    await browser.close();
  }

  // ---------------------------------------------------------------- resoconto
  const err = problemi.filter((p) => p.gravita === 'errore');
  const avv = problemi.filter((p) => p.gravita === 'avviso');
  const chiave = (p) => `${p.pagina}|${p.cosa}`;
  const gruppi = new Map();
  for (const p of problemi) {
    const k = chiave(p);
    if (!gruppi.has(k)) gruppi.set(k, { ...p, dove: new Set() });
    gruppi.get(k).dove.add(`${p.motore} · ${p.dispositivo}`);
  }
  let md = `# Controllo del sito\n\n${err.length ? '❌' : '✅'} ${new Set(err.map(chiave)).size} problemi, ${new Set(avv.map(chiave)).size} avvisi\n\n`;
  for (const g of ['errore', 'avviso']) {
    const lista = [...gruppi.values()].filter((p) => p.gravita === g);
    if (!lista.length) continue;
    md += `## ${g === 'errore' ? 'Problemi' : 'Avvisi'}\n\n`;
    for (const p of lista) md += `- **${p.pagina}** — ${p.cosa}  \n  _${[...p.dove].join('; ')}_\n`;
    md += '\n';
  }
  fs.writeFileSync(path.join(OUT, 'resoconto.md'), md);
  fs.writeFileSync(path.join(OUT, 'resoconto.json'), JSON.stringify([...gruppi.values()].map((p) => ({ ...p, dove: [...p.dove] })), null, 1));
  console.log('\n' + md);
  process.exit(err.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
