// Testi della guida (solo italiano, su richiesta). Ogni sezione si può ascoltare con la voce.
// 'p' = paragrafi, 'li' = elenco puntato (facoltativo).

const CLIENTE = [
  {
    t: 'Entrare nell\'area clienti',
    p: ['Email e password te le manda Anfibiasub, via email o su WhatsApp.',
      'Al primo accesso il sito ti chiede di scegliere una password tua, di almeno otto caratteri.',
      'Se dimentichi la password, nella pagina di accesso tocca "Password dimenticata?", scrivi la tua email e ricevi un link per sceglierne una nuova.'],
  },
  {
    t: 'La pagina iniziale',
    p: ['In alto trovi il nome della tua barca. Se hai più barche, scegli quella che ti interessa dall\'elenco in alto.',
      'Il riquadro Manutenzione mostra due semafori, uno per la pulizia e uno per gli anodi.'],
    li: ['Verde: tutto regolare.', 'Giallo: è consigliato un controllo.', 'Rosso: serve un intervento.', 'Grigio: non ci sono ancora dati.'],
    p2: ['Il riquadro Scheda imbarcazione mostra la scadenza dell\'assicurazione e quanto è completa la scheda.'],
  },
  {
    t: 'Pulizie e foto',
    p: ['Nella pagina Manutenzione trovi tutti gli interventi fatti da Anfibiasub, con la data, le note e le foto scattate sott\'acqua.',
      'Tocca una foto per vederla grande.',
      'Con "Condividi su WhatsApp" o "Copia link" puoi mandare le foto di un intervento a chi vuoi, per esempio al perito o al cantiere. Chi riceve il link vede solo le foto di quell\'intervento, non il resto della tua area.'],
  },
  {
    t: 'Promemoria per la prossima pulizia',
    p: ['Sempre in Manutenzione, scegli una data in "Avvisami per il prossimo intervento il" e tocca "Salva avviso".',
      'Quel giorno ricevi un\'email con il pulsante per prenotare su WhatsApp. Anche Anfibiasub riceve l\'avviso.',
      'Se cambi idea, tocca "Togli avviso".'],
  },
  {
    t: 'Il registro degli anodi',
    p: ['Il registro anodi lo gestisci tu. Tocca "Aggiungi anodo" e compila:'],
    li: ['dove è montato, per esempio asse, piede poppiero o flap;', 'codice e dati dell\'anodo;', 'data di montaggio;', 'una data di avviso, se vuoi ricevere un\'email per ricontrollarlo;', 'eventuali foto.'],
    p2: ['Puoi modificare o eliminare ogni anodo. Quando Anfibiasub sostituisce un anodo aggiorna anche lui il registro, e vedi la scritta "aggiornato da Anfibiasub".',
      'Il semaforo degli anodi diventa giallo e poi rosso con il passare dei mesi dal montaggio, oppure quando arriva la data di avviso che hai scelto.'],
  },
  {
    t: 'La scheda dell\'imbarcazione',
    p: ['In Scheda imbarcazione inserisci i dati della barca: tipo, nome, matricola, bandiera, misure, motori, proprietario, assicurazione, licenza radio, MMSI, nominativo e posto barca.',
      'Compila quello che sai e tocca "Salva": puoi completarla quando vuoi.',
      'Se inserisci la scadenza dell\'assicurazione, ricevi un\'email di promemoria trenta giorni prima.'],
  },
  {
    t: 'Chiedere un intervento',
    p: ['Nella pagina iniziale tocca il pulsante verde "Richiedi intervento su WhatsApp".',
      'Si apre WhatsApp con un messaggio già pronto con il nome della tua barca: aggiungi cosa ti serve e invia.'],
  },
  {
    t: 'Profilo e uscita',
    p: ['Toccando il tuo nome in alto apri il profilo: puoi cambiare nome, telefono, lingua delle email e password.',
      'Per uscire tocca "Esci". Se usi un telefono o un computer non tuo, esci sempre alla fine.'],
  },
];

const GESTIONE = [
  {
    t: 'Clienti e barche',
    p: ['La pagina "Clienti e barche" è l\'elenco di tutte le barche, con i semafori di pulizia e anodi.',
      'Usa la casella di ricerca per trovare una barca per nome, targa o cliente.',
      'In fondo trovi le ultime richieste arrivate dai clienti tramite il pulsante WhatsApp.'],
  },
  {
    t: 'Creare un nuovo cliente',
    p: ['Tocca "Nuovo cliente" e inserisci nome e cognome, email, cellulare, lingua e i dati principali della barca. Poi tocca "Crea cliente".',
      'Il sito genera una password provvisoria e ti mostra la pagina delle credenziali. Se le email sono attive le credenziali partono da sole; in ogni caso puoi mandarle con il pulsante "Invia su WhatsApp". La password provvisoria si vede solo in quel momento.',
      'Al primo accesso il cliente sceglie la sua password.'],
  },
  {
    t: 'Caricare un intervento con le foto',
    p: ['Apri la barca dall\'elenco. Nella scheda degli interventi compila data e tipo di lavoro, per esempio "Carena più eliche".',
      'In "Foto" puoi scegliere molte foto insieme direttamente dal telefono: il sito le riduce da solo.',
      'Aggiungi le note per il cliente e in "Avvisa il cliente" scegli Email, WhatsApp, Entrambi o Nessuno. Poi tocca "Salva intervento".',
      'Con Email il cliente riceve l\'avviso da solo. Con WhatsApp, dopo il salvataggio compare un pulsante verde "Invia su WhatsApp": toccalo e si apre WhatsApp con il numero del cliente e il messaggio già scritto nella sua lingua, con il link alle foto. Basta premere Invia.',
      'WhatsApp funziona solo se il cliente ha il cellulare salvato nella scheda Cliente. Nello storico ogni intervento ha anche il pulsante "Manda al cliente su WhatsApp" per rimandarlo.',
      'Ogni intervento si può modificare, aggiungere altre foto o eliminare.'],
  },
  {
    t: 'Anodi, scheda e dati del cliente',
    p: ['Nella stessa pagina della barca trovi anche il registro anodi, la scheda dell\'imbarcazione e i dati del cliente.',
      'Puoi aggiungere o correggere gli anodi quando li sostituisci: il cliente vede che sono stati aggiornati da Anfibiasub.',
      'Nei dati del cliente puoi cambiare email, cellulare e lingua, o impostare una nuova password se il cliente l\'ha persa.',
      'Le note interne le vede solo Anfibiasub. Da qui puoi anche aggiungere un\'altra barca allo stesso cliente.'],
  },
  {
    t: 'Impostazioni',
    p: ['In Impostazioni scegli il numero WhatsApp che riceve le richieste, l\'email che riceve i promemoria e dopo quanti mesi i semafori diventano gialli e rossi.',
      'Il riquadro "Email automatiche" dice se le email sono attive. Con "Manda un\'email di prova a me" controlli che arrivino.',
      'Il riquadro "Controllo mensile" manda ogni primo del mese un riepilogo all\'email indicata: se smette di arrivare, qualcosa non va.',
      'In fondo alla pagina c\'è il pannello "Accessi": tutti i siti e le password che servono per gestire il sito, come Railway, GitHub, Brevo e il dominio. Tocca "Mostra" per vedere una password e "Copia" per copiarla. Quando cambi una password, aggiornala anche qui.',
      'In "Amministratori" puoi aggiungere un\'altra persona che gestisce l\'area: riceve una password provvisoria.'],
  },
  {
    t: 'Email automatiche',
    p: ['Quando le email sono attive, il sito manda da solo:'],
    li: ['le credenziali ai nuovi clienti;', 'l\'avviso di nuovo intervento con le foto, se scegli Email o Entrambi;', 'il promemoria degli anodi alla data scelta;', 'il promemoria della prossima pulizia;', 'l\'avviso di scadenza dell\'assicurazione, trenta giorni prima.'],
    p2: ['Una copia dei promemoria arriva anche all\'email di Anfibiasub indicata nelle impostazioni.'],
  },
];

module.exports = { CLIENTE, GESTIONE };
