// Esportazione Excel di tutto l'archivio: clienti, barche, interventi, anodi, richieste.
// Si scarica dalla gestione e parte allegata all'email di controllo mensile (backup).
// Le foto non sono incluse: restano nel database.
const ExcelJS = require('exceljs');
const { all } = require('./db');

// date (AAAA-MM-GG) così come sono; orari convertiti all'ora italiana (Excel non conosce i fusi)
const d = (v) => (v ? new Date(v) : null);
function ts(v) {
  if (!v) return null;
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date(v)).map((x) => [x.type, x.value]));
  return new Date(Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute));
}
const yn = (v) => (v ? 'sì' : 'no');

function sheet(wb, name, columns, rows) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = columns.map(([header, key, width, fmt]) => ({ header, key, width: width || 16, style: fmt ? { numFmt: fmt } : {} }));
  ws.addRows(rows);
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D2238' } };
  head.alignment = { vertical: 'middle' };
  head.height = 22;
  if (rows.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  return ws;
}

const DATE = 'dd/mm/yyyy';
const DATETIME = 'dd/mm/yyyy hh:mm';

async function buildExcel() {
  const [users, boats, cleanings, anodes, requests] = await Promise.all([
    all(`SELECT u.*, (SELECT count(*) FROM boats b WHERE b.owner_id=u.id)::int AS n_barche
         FROM users u WHERE u.role='client' ORDER BY lower(u.name), u.id`),
    all(`SELECT b.*, u.name AS cliente, u.email AS cliente_email, u.phone AS cliente_tel
         FROM boats b JOIN users u ON u.id=b.owner_id ORDER BY lower(b.nome), b.id`),
    all(`SELECT c.*, b.nome AS barca, u.name AS cliente,
           (SELECT count(*) FROM photos p WHERE p.cleaning_id=c.id)::int AS n_foto
         FROM cleanings c JOIN boats b ON b.id=c.boat_id JOIN users u ON u.id=b.owner_id
         ORDER BY c.data DESC, c.id DESC`),
    all(`SELECT a.*, b.nome AS barca, u.name AS cliente
         FROM anodes a JOIN boats b ON b.id=a.boat_id JOIN users u ON u.id=b.owner_id
         ORDER BY lower(b.nome), a.id`),
    all(`SELECT r.*, b.nome AS barca, u.name AS cliente, u.email AS cliente_email, u.phone AS cliente_tel
         FROM requests r LEFT JOIN boats b ON b.id=r.boat_id LEFT JOIN users u ON u.id=r.user_id
         ORDER BY r.created_at DESC`),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Anfibiasub';
  wb.created = new Date();

  sheet(wb, 'Clienti', [
    ['N.', 'id', 6], ['Nome', 'name', 26], ['Email', 'email', 30], ['Telefono', 'phone', 16], ['Lingua', 'lang', 8],
    ['Barche', 'n_barche', 8], ['Attivo', 'attivo', 8], ['Ultimo accesso', 'last_login', 17, DATETIME], ['Creato il', 'created_at', 12, DATE],
  ], users.map((u) => ({ ...u, attivo: yn(u.active), last_login: ts(u.last_login), created_at: ts(u.created_at) })));

  sheet(wb, 'Barche', [
    ['N.', 'id', 6], ['Barca', 'nome', 22], ['Cliente', 'cliente', 24], ['Email cliente', 'cliente_email', 28], ['Tel. cliente', 'cliente_tel', 15],
    ['Tipo', 'tipo', 11], ['Targa', 'targa', 12], ['Matricola', 'matricola', 14], ['Codice scafo', 'codice_scafo', 16],
    ['Bandiera', 'bandiera', 11], ['Ufficio iscrizione', 'ufficio_reg', 16], ['Lunghezza', 'lunghezza', 10], ['Utilizzo', 'utilizzo', 12],
    ['Cantiere / modello', 'cantiere_modello', 22], ['Anno', 'anno', 7], ['Materiale', 'materiale', 12],
    ['Motore', 'motore_modello', 20], ['N. serie motore', 'motore_serie', 16], ['Potenza', 'potenza', 10], ['Carburante', 'carburante', 11], ['Serbatoi', 'serbatoi', 11],
    ['Armatore', 'armatore_nome', 22], ['Cell. armatore', 'armatore_cell', 15], ['Email armatore', 'armatore_email', 26],
    ['Scadenza assicurazione', 'scad_assicurazione', 13, DATE], ['Licenza RTF', 'licenza_rtf', 13], ['MMSI', 'mmsi', 12], ['Call sign', 'call_sign', 11],
    ['Porto', 'porto', 12], ['Posto barca', 'posto_barca', 12], ['Latitudine', 'lat', 11], ['Longitudine', 'lng', 11],
    ['Prossima pulizia', 'prox_pulizia', 13, DATE], ['Note interne', 'note_admin', 40], ['Creata il', 'created_at', 12, DATE],
  ], boats.map((b) => ({ ...b, scad_assicurazione: d(b.scad_assicurazione), prox_pulizia: d(b.prox_pulizia), created_at: ts(b.created_at) })));

  sheet(wb, 'Interventi', [
    ['Data', 'data', 12, DATE], ['Barca', 'barca', 22], ['Cliente', 'cliente', 24], ['Tipo', 'tipo', 22],
    ['Note per il cliente', 'note', 50], ['Foto', 'n_foto', 7], ['Email inviata', 'avvisato', 12],
  ], cleanings.map((c) => ({ ...c, data: d(c.data), avvisato: yn(c.notified) })));

  sheet(wb, 'Anodi', [
    ['Barca', 'barca', 22], ['Cliente', 'cliente', 24], ['Posizione', 'posizione', 18], ['Codice', 'codice', 14], ['Dati', 'dati', 20],
    ['Montato il', 'data_montaggio', 12, DATE], ['Avviso il', 'data_alert', 12, DATE], ['Note', 'note', 36], ['Aggiornato da', 'updated_by', 13],
  ], anodes.map((a) => ({ ...a, data_montaggio: d(a.data_montaggio), data_alert: d(a.data_alert) })));

  sheet(wb, 'Richieste', [
    ['Data', 'created_at', 17, DATETIME], ['Barca', 'barca', 22], ['Cliente', 'cliente', 24], ['Email', 'cliente_email', 28], ['Telefono', 'cliente_tel', 15], ['Motivo', 'motivo', 50],
  ], requests.map((r) => ({ ...r, created_at: ts(r.created_at) })));

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' }); // AAAA-MM-GG
  return { buffer, filename: `anfibiasub-archivio-${today}.xlsx`, counts: { clienti: users.length, barche: boats.length, interventi: cleanings.length, anodi: anodes.length } };
}

module.exports = { buildExcel };
