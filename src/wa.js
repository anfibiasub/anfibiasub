// WhatsApp "con un tocco": prepara il link wa.me con numero del cliente e messaggio già scritto.
// Non invia nulla da solo: apre WhatsApp sul telefono di chi è in gestione, basta premere Invia.

// Numero in formato internazionale senza + (es. 393471234567). Vuoto se non valido.
function waNumber(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length >= 9 && d.length <= 10 && d[0] === '3') d = '39' + d; // cellulare italiano senza prefisso
  return d.length >= 8 && d.length <= 15 ? d : '';
}

function waLink(phone, text) {
  const n = waNumber(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : '';
}

module.exports = { waNumber, waLink };
