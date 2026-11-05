# Anfibiasub: sito + area clienti

Un solo progetto per tre cose:

| Parte | Indirizzo in prova (Railway) | Indirizzo finale |
|---|---|---|
| Sito pubblico IT/EN | `https://<tuo-progetto>.up.railway.app/` | `https://www.anfibiasub.it` (HostGator) |
| Area clienti | `.../area/login` | `https://clienti.anfibiasub.it/area/login` |
| Gestione Anfibiasub | `.../admin` | `https://clienti.anfibiasub.it/admin` |

Tecnologia: Node.js 20+, Express, PostgreSQL. Le foto vengono compresse e salvate nel database.

---

## 1. Messa in prova su Railway

### 1.1 GitHub
1. Su github.com crea un repository **privato** chiamato `anfibiasub`.
2. Carica il contenuto di questa cartella (con GitHub Desktop: *Add existing repository* → *Publish*).
   La cartella `node_modules` non va caricata: è già esclusa da `.gitignore`.

### 1.2 Railway
1. railway.app → **New Project** → **Deploy from GitHub repo** → scegli `anfibiasub`.
2. Nello stesso progetto: **+ New** → **Database** → **PostgreSQL**.
3. Apri il servizio `anfibiasub` → **Variables** e aggiungi:

| Variabile | Valore |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway la suggerisce da solo) |
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | una frase lunga a caso, almeno 32 caratteri |
| `ADMIN_EMAIL` | l'email con cui entrerà Anfibiasub nella gestione |
| `ADMIN_PASSWORD` | una password di almeno 8 caratteri (cambiabile dopo) |
| `TZ` | `Europe/Rome` |

4. **Settings** → **Region**: scegli una regione europea (es. *EU West*). I dati dei clienti restano in Europa.
5. **Settings** → **Networking** → **Generate Domain**. Questo è il link di prova da mandare al cliente.

Al primo avvio il database si crea da solo, e viene creato l'amministratore con `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### 1.3 Email automatiche (Brevo, gratis fino a 300 email al giorno)
Senza questo passaggio tutto funziona, ma le email non partono (credenziali, nuovi interventi, promemoria anodi, pulizie e assicurazione). I promemoria restano in attesa e partono appena le email sono attive.

1. Crea un account su brevo.com.
2. **Senders & IP** → aggiungi e verifica il mittente (es. `info@anfibiasub.it` o l'email di Cuvato).
3. **SMTP & API** → **API Keys** → genera una chiave.
4. Su Railway aggiungi le variabili:

| Variabile | Valore |
|---|---|
| `BREVO_API_KEY` | la chiave appena creata |
| `MAIL_FROM` | il mittente verificato |
| `MAIL_FROM_NAME` | `Anfibiasub` |
| `APP_URL` | il link Railway, poi `https://clienti.anfibiasub.it` |

Con le email attive si apre anche la **registrazione autonoma** dei clienti (`/area/registrati`): il cliente conferma l'indirizzo con il link ricevuto via email (valido 24 ore) e poi entra. Anfibiasub riceve un'email per ogni nuovo cliente registrato. I Termini di servizio si scrivono in `src/termini.js`.

5. In **Gestione → Impostazioni** usa *Manda un'email di prova a me*.

---

## 2. Uso quotidiano (Anfibiasub)

1. **Nuovo cliente**: nome, email, cellulare, nome della barca. Viene generata una password provvisoria da mandare via email o WhatsApp. Al primo accesso il cliente sceglie la sua.
2. **Barca → Pulizie e foto**: data, tipo, foto direttamente dal telefono (anche 30 insieme), note. Con "Avvisa il cliente" parte l'email.
3. **Barca → Anodi**: il registro lo gestisce il cliente, ma Anfibiasub può aggiungere e correggere.
4. **Impostazioni**: link della webcam di Loano, numero WhatsApp, email per i promemoria, mesi dei semafori.

5. **Guida**: nel menu, sia per i clienti (`/area/guida`) sia per la gestione (`/admin/guida`). Ogni sezione si può ascoltare: la voce (Elsa, Isabella o Diego) è generata dal server con le voci neurali Microsoft Edge, come in SkyApp; se il server non risponde si usa la voce del telefono. I testi sono in `src/guida.js` (solo italiano).

Semafori (modificabili): pulizia verde fino a 6 mesi, giallo fino a 12, poi rosso. Anodi verde fino a 10 mesi dal montaggio, giallo fino a 12, poi rosso; diventano gialli anche quando arriva la data di avviso scelta dal cliente.

---

## 3. Come è messo online (dal 5/11/2026)

Tutto sta su account intestati ad Anfibiasub (le password sono nel pannello **Impostazioni → Accessi** del sito):

| Cosa | Dove |
|---|---|
| Codice | GitHub `anfibiasub/anfibiasub` (Ivano `takforce` è collaboratore) |
| Sito + area clienti + database | Railway, account dei Cuvato, piano Hobby, servizio `anfibiasub` + Postgres |
| Dominio `anfibiasub.it` | registrato su dominiofaidate.com (scadenza 31/08/2027), nameserver Cloudflare `ben.ns.cloudflare.com` / `surina.ns.cloudflare.com` |
| DNS | Cloudflare (piano Free): `www` CNAME → Railway (DNS only); `anfibiasub.it` proxied con regola "Redirect from root to WWW" → `https://www.anfibiasub.it/...` |
| Email del sito | Brevo, mittente `anfibiaanfibia@gmail.com` |

Variabili su Railway: `DATABASE_URL`, `SESSION_SECRET` (non cambiarla: cifra le password del pannello Accessi), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `APP_URL=https://www.anfibiasub.it`, `BREVO_API_KEY`, `MAIL_FROM`, `MAIL_FROM_NAME`, `NODE_ENV=production`, `TZ=Europe/Rome`.

Aggiornare il sito: `git push` sul repository → Railway pubblica da solo in un paio di minuti.
Il vecchio sito Joomla su HostGator è dismesso; i suoi vecchi indirizzi (`/it/...`) portano alle pagine nuove (`src/redirects.json`).
`python3 sito/build.py` genera il sito ONLINE (indicizzabile, con `sitemap.xml`); `--prova` lo nasconde a Google.

---

## 4. Modificare i testi del sito
Il sito è in 4 lingue (italiano, inglese, spagnolo, tedesco), con la tendina delle lingue nel menu.

| Cosa | File |
|---|---|
| Servizi, lavori, squadra, mezzi, tabelle (IT/EN) | `sito/contenuti.py` |
| Gli stessi contenuti in ES/DE | `sito/contenuti_es_de.py` |
| Titoli e frasi fisse delle pagine (4 lingue) | `sito/testi_pagine.py` |
| Area clienti ed email (4 lingue) | `src/i18n.js` |
| Link della webcam di Loano | `WEBCAM_URL` in `sito/contenuti.py` |

Dopo una modifica:

```
python3 sito/build.py          # aggiorna public/ (versione servita da Railway)
python3 sito/build.py --prod   # aggiorna dist-hostgator/ (versione per HostGator)
```

## 5. Sviluppo locale
```
npm install
DATABASE_URL=postgresql://utente:password@localhost/anfibiasub SESSION_SECRET=prova ADMIN_EMAIL=io@test.it ADMIN_PASSWORD=prova1234 npm start
```
Altro amministratore da riga di comando: `npm run crea-admin -- email@esempio.it "Nome"`.
