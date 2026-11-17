# ANFIBIASUB — istruzioni per Claude (leggere PRIMA di toccare qualsiasi cosa)

Sta anche su GitHub (repository privato): niente password qui dentro, le password stanno solo nel pannello Accessi.
Aggiornato al 17/11/2026.

---

## 0. Regole di lavoro con Ivano (obbligatorie)

1. **Rispondi sempre in italiano**, diretto e conciso, senza premesse inutili.
2. **La cartella sul PC è sempre la versione ultima e vera**: `C:\Users\TaccucciI\Documents\anfibiasub`.
   Scrivi i file modificati direttamente lì (non zip, non file da scaricare e copiare).
3. **Ogni modifica va fatta in TUTTE e 4 le lingue**: italiano, inglese, spagnolo, tedesco (IT/EN/ES/DE). Anche il gioco ABYSS.
4. **Dopo aver modificato i sorgenti, rigenera tu i file di `public/`** (vedi §3) e scrivi sul PC anche quelli.
   Non dire a Ivano di lanciare `build.py`.
5. Prima di processi lunghi, o di modifiche alla grafica del sito o a parti importanti (database, login, email, dominio):
   **spiega cosa vuoi fare e i rischi, e chiedi il permesso**. Per la grafica mostra prima cosa vuoi fare.
6. Alla fine dai **solo i comandi git "come al solito"**. Eventuali avvisi (file da cancellare, cose da controllare)
   vanno scritti **PRIMA** dei comandi, non dopo:
   ```
   cd $HOME\Documents\anfibiasub
   git add .
   git commit -m "descrizione breve"
   git push
   ```
   Ivano fa i push in sequenza, tutti: **non chiedere se ha già fatto il push**.
7. Non inventare voci di menu di Railway (es. "Redeploy" per lui non esiste): per rilanciare si fa un push.
8. Procedure guidate (account, Railway, Cloudflare...): una sola istruzione per volta, con calma.
9. Non legare il codice al nome o al dominio attuale: il sito potrebbe cambiare nome e server
   (es. `APP_NAME` in `sito/build.py`, percorsi relativi nei manifest).
10. "Il cliente" = **Francesco** (ha pagato il sito ed è l'amministratore, account admin "Anfibiasub"),
    non un cliente dell'area Boat Care.

---

## 1. Che cos'è

Un'unica app Node.js che serve tre cose dallo stesso server:

| Parte | Indirizzo | Cosa fa |
|---|---|---|
| Sito pubblico | `https://www.anfibiasub.it/` (+ `/en/`, `/es/`, `/de/`) | Sito vetrina statico in 4 lingue, installabile come app (PWA) |
| Area clienti "Boat Care" | `/area/login` | Ogni cliente vede la sua barca: scheda, pulizie con foto prima/dopo, anodi, assicurazione, webcam/meteo Loano, GPS |
| Gestione (pannello admin) | `/admin` | Anfibiasub crea clienti, carica interventi e foto, avvisa i clienti, impostazioni, statistiche ABYSS, accessi |
| Gioco ABYSS | `/abyss.html`, `/en/abyss.html`, `/es/abyss.html`, `/de/abyss.html` | Minigioco 3D subacqueo (Three.js) "Il relitto dimenticato" |

Tecnologia: Node 20+, Express 5, EJS, PostgreSQL, sharp (foto compresse e salvate nel DB), Brevo (email via API),
node-edge-tts (voce della guida). Il sito pubblico è generato in Python (`sito/build.py`).

---

## 2. Dove sta online

| Cosa | Dove |
|---|---|
| Codice | GitHub `anfibiasub/anfibiasub` (ramo `main`; Ivano `takforce` è collaboratore). Remote del PC già impostato. |
| Server + database | Railway dei Cuvato, piano Hobby (paga Simone), servizio `anfibiasub` + Postgres |
| Dominio | `anfibiasub.it` su dominiofaidate.com (scade 31/08/2027), DNS su Cloudflare (Free) |
| DNS | `www` CNAME → Railway (DNS only); radice `anfibiasub.it` proxied con redirect a `https://www.anfibiasub.it/...` |
| Email | Brevo, mittente `anfibiaanfibia@gmail.com` |
| Password di tutti i servizi | nel sito stesso: **Gestione → Impostazioni → Accessi** (cifrate con `SESSION_SECRET`) |

**Pubblicare = `git push`**: Railway ricostruisce da solo in un paio di minuti.
Controllo automatico (`test/controllo.js` + `test/controllo.yml`): prova telefono/tablet/PC con Chrome e Safari.
Attenzione: sul PC la cartella `.github/workflows/` è **vuota** (17/11/2026), quindi su GitHub il controllo parte solo
se il file `controllo.yml` è già stato messo lì dal sito di GitHub. Verifica nella pagina Actions del repository prima di darlo per attivo.
Se attivo: quando fallisce GitHub manda una mail e il resoconto con le schermate è negli "Artifacts".

Variabili su Railway: `DATABASE_URL`, `SESSION_SECRET` (**mai cambiarla**: renderebbe illeggibili le password
del pannello Accessi), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `APP_URL=https://www.anfibiasub.it`, `BREVO_API_KEY`,
`MAIL_FROM`, `MAIL_FROM_NAME`, `NODE_ENV=production`, `TZ=Europe/Rome`.
Opzionali nel codice: `SITE_URL`, `SERVE_SITE=off` (solo area clienti), `MAIL_DRY=1` (email finte, per i test).

Il vecchio sito Joomla su HostGator è dismesso. I suoi vecchi indirizzi (`/it/...`) portano alle pagine nuove
tramite `src/redirects.json` (generato da `build.py`). Tutto ciò che parla di HostGator / `--prod` /
`dist-hostgator/` / `clienti.anfibiasub.it` è roba vecchia non più usata.

---

## 3. Struttura delle cartelle (cosa si modifica e cosa no)

```
anfibiasub/
├─ server.js              avvio Express: sicurezza (CSP), redirect, file statici, rotte, promemoria
├─ package.json           dipendenze; npm start
├─ sito/                  >>> SORGENTI DEL SITO PUBBLICO (Python) — si modifica QUI <<<
│  ├─ build.py            genera public/ (tutte le pagine, 4 lingue, manifest, sitemap, ABYSS)
│  ├─ contenuti.py        servizi, lavori, squadra, mezzi, tabelle (IT/EN) + WEBCAM_URL
│  ├─ contenuti_es_de.py  gli stessi contenuti in ES/DE
│  ├─ testi_pagine.py     titoli e frasi fisse delle pagine (4 lingue), testo privacy
│  ├─ testi_extra.py, fasi_servizi.py, lavori_testi.py, schede_attrezzatura.py, porto_loano.py
│  ├─ abyss_pagina.html   modello HTML della pagina del gioco
│  ├─ abyss_testi.py      testi del gioco (H = pagina, J = motore) in 4 lingue
│  └─ assets/             css, js, img, font, vendor (three, leaflet), abyss/ → copiati in public/
├─ public/                >>> GENERATO da build.py: NON modificare a mano <<< (ma va committato: Railway lo serve)
├─ src/                   >>> AREA CLIENTI + PANNELLO (Node) <<<
│  ├─ routes/area.js      rotte cliente (/area/...)
│  ├─ routes/admin.js     rotte gestione (/admin/...)
│  ├─ i18n.js             testi area clienti ed email (4 lingue)   ← ogni testo nuovo va in tutte e 4
│  ├─ i18n_reg.js         testi della registrazione
│  ├─ schema.sql          tabelle (users, boats, cleanings, anodes, photos, requests, settings, mail_log,
│  │                       abyss_feedback, abyss_partite, accessi) — eseguito a ogni avvio (CREATE IF NOT EXISTS)
│  ├─ db.js               connessione e migrazione
│  ├─ auth.js             sessioni, login, controllo origine (anti-CSRF)
│  ├─ mail.js             invio email con Brevo
│  ├─ reminders.js        promemoria automatici (ogni ora) + email mensile di controllo/backup
│  ├─ export.js           esportazione Excel / backup
│  ├─ photos.js           compressione foto con sharp
│  ├─ status.js           semafori (pulizia, anodi)
│  ├─ boatfields.js, boatdata.js   campi della scheda barca
│  ├─ accessi.js          pannello Accessi (password cifrate AES-256-GCM)
│  ├─ abyss.js            API del gioco: /api/abyss/partita e /api/abyss/voto (statistiche nel pannello, niente email)
│  ├─ guida.js + tts.js   Guida con lettura vocale (voci Edge; testi guida solo in italiano)
│  ├─ wa.js               link WhatsApp "con un tocco" (gratis, niente API a pagamento)
│  ├─ termini.js          termini di servizio
│  ├─ redirects.json      GENERATO da build.py
│  └─ privacy_testi.json  GENERATO da build.py
├─ views/                 pagine EJS: app/ (cliente), admin/ (gestione), partials/ (pezzi comuni)
├─ public/css/app.css, public/js/app.js   stile e script dell'area clienti (questi SÌ si modificano in public/)
├─ test/controllo.js      controllo automatico con Playwright
├─ scripts/crea-admin.js  npm run crea-admin -- email "Nome"
└─ video-ia/              video/immagini di lavoro per le IA (ignorato da git)
```

Attenzione: in `public/` ci sono due tipi di file.
- Quelli del **sito pubblico** (html, `css/style.css`, `js/main.js`, `js/utilita.js`, `abyss/`, img...) arrivano da `sito/` →
  si modificano in `sito/` (o `sito/assets/`) e poi si rigenera.
- Quelli dell'**area clienti** (`public/css/app.css`, `public/js/app.js`, `js/guida.js`, `js/skytts.js`, `js/register.js`)
  non esistono in `sito/assets/` → si modificano direttamente in `public/`.
  Prima di toccare un file in `public/` controlla se esiste lo stesso in `sito/assets/`: se esiste, modifica quello.

### Rigenerare il sito pubblico
```
python3 sito/build.py          # sito ONLINE in public/ (indicizzabile, con sitemap.xml)
```
(`--prova` = nascosto a Google; `--prod` = vecchia versione HostGator, non usare.)
Il collegamento al PC non ha un terminale: copia i file del progetto che servono nella sandbox,
lancia lì `build.py`, poi riscrivi sul PC **tutti** i file cambiati in `public/` e `src/redirects.json`, `src/privacy_testi.json`.
La cartella intera è grande (immagini, video, modelli 3D): copia solo ciò che serve; il collegamento non passa file oltre ~40 MB.

Versioni dei file: `server.js` calcola da solo `ASSET_V` per CSS/JS dell'area clienti; `build.py` aggiunge `?v=` ai file del sito
e del gioco. Non serve cambiare numeri di versione a mano.

### Sicurezza (CSP in server.js)
Script solo dal sito stesso (niente script inline, niente CDN). Connessioni esterne permesse solo a open-meteo.
Immagini esterne solo dalle mappe OpenStreetMap. Se aggiungi una risorsa esterna va aggiunta alla CSP, altrimenti non carica.
Modelli 3D: usare `.gltf` + `.bin` + `.jpg` separati (i `.glb` con texture incorporate non caricano per via della CSP).

---

## 4. Area clienti e pannello — funzioni principali

- **Nuovo cliente** (admin): nome, email, cellulare, barca → password provvisoria da mandare via email o WhatsApp;
  al primo accesso il cliente la cambia. Esiste anche la **registrazione autonoma** (`/area/registrati`) con conferma email (24 h).
- **Pulizie e foto**: data, tipo, foto prima/dopo (anche 30 insieme dal telefono), note, "Avvisa il cliente"
  (scelta Email / WhatsApp / entrambi). Storico a schede, 10 interventi e 8 foto per volta, ricerca per data (dal/al) e tipo.
- **Anodi**: registro tenuto dal cliente, anche l'admin può aggiornarlo.
- **Semafori** (modificabili in Impostazioni): pulizia verde ≤ 6 mesi, giallo ≤ 12, poi rosso;
  anodi verde ≤ 10 mesi dal montaggio, giallo ≤ 12, poi rosso (gialli anche alla data di avviso scelta dal cliente).
- **Impostazioni**: webcam Loano, numero WhatsApp, email per promemoria (più email separate da `;`), mesi dei semafori,
  email di prova, **Accessi** (siti e password per i Cuvato), esportazione Excel.
- **Promemoria automatici** (`reminders.js`): anodi, pulizie, assicurazione; email mensile di controllo + backup a Ivano.
- **Statistiche ABYSS**: partite e sondaggio di fine partita, solo nel pannello.
- **Guida** per clienti (`/area/guida`) e gestione (`/admin/guida`) con lettura vocale.
- Condivisione intervento: link `/condividi/<token>`.

Primo avvio con DB vuoto: viene creato l'admin da `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## 5. Gioco ABYSS (in breve)

- Codice: `sito/assets/abyss/` (main.js, config.js, world.js, wreck.js, landmarks.js, artifacts.js, fish.js, shark.js,
  ads.js, extras.js, look.js, textures.js, controls.js, audio.js, noise.js, solid.js, install.js, abyss.css, tex/, models/).
  Three.js in `sito/assets/vendor/three/`. Quasi tutti i parametri sono in `config.js` (`CFG`).
- Testi: `sito/abyss_testi.py` (4 lingue). Pagine generate da `build_abyss()` in `build.py`.
- Trama: torcia, relitto, 3 reperti (bussola nella grotta a ovest, targhetta vicino all'elicottero, chiave tra le anfore),
  botola → scafandro e giornale di bordo → rotta 213° → arco di roccia → cofanetto → fine. Dopo: bombole a 220 bar e fiocina.
  Ponte a est con cancello "MISSIONE 2 · A presto" (futura missione 2).
- Crediti CC BY dei modelli nella schermata finale. Funziona a schermo intero anche su iPhone Safari in orizzontale.
- Dettagli e storia: documenti del progetto Claude "Cuvato" (`claude/abyss-stato.md`, `claude/abyss-gioco-progetto.md`, ...).

---

## 6. App installabile

L'app è **il sito intero** (si apre sulla home), non solo il gioco. Pulsante "Installa l'app" in home sopra "Dove sono",
stessa larghezza, allineati a sinistra. Manifest `public/sito-<lingua>.webmanifest` generati da `build.py`
(nome in `APP_NAME`). ABYSS ha un suo manifest ma **nessun pulsante di installazione**.

---

## 7. Prova in locale (se serve)
```
npm install
DATABASE_URL=postgresql://utente:password@localhost/anfibiasub SESSION_SECRET=prova ADMIN_EMAIL=io@test.it ADMIN_PASSWORD=prova1234 MAIL_DRY=1 npm start
```
Controllo automatico: `BASE=http://localhost:3000 node test/controllo.js` (serve Playwright).

---

## 8. Cose da sapere / trappole

- In radice ci sono due cartelle vuote: `-Force` (creata per sbaglio da un comando PowerShell) e `.github/workflows/`.
  `-Force` (creata per sbaglio da un comando PowerShell): si può cancellare.
- Il `README.md` del repository è in parte vecchio (parla di HostGator e IT/EN): fa fede questo file.
- `SESSION_SECRET` non si cambia mai.
- `.gitignore` esclude `node_modules/`, `.env*`, `dist-hostgator/`, `__pycache__/`, `video-ia/`, `test/risultati/`.
- Testi nuovi dell'area clienti: aggiungere la chiave in **tutti e 4** i blocchi di `src/i18n.js` (it, en, es, de).
- Migrazione chiusa il 5/11/2026: il progetto è online e funzionante; ora si fanno solo modifiche e migliorie.
