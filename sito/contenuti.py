# Testi del sito Anfibiasub in italiano (it) e inglese (en).
# Per cambiare un testo: modificalo qui e rilancia  python3 sito/build.py

TEL_F = '+393470119832'
TEL_S = '+393470387290'
WA = 'https://wa.me/393470119832'
MAIL = 'termoclino@libero.it'

LANGS = ['it', 'en', 'es', 'de']
LANG_NAMES = {'it': 'Italiano', 'en': 'English', 'es': 'Español', 'de': 'Deutsch'}

# Pagine: chiave -> file per lingua
PAGES = {
    'home':     {'it': 'index.html',     'en': 'en/index.html',    'es': 'es/index.html',      'de': 'de/index.html'},
    'chi':      {'it': 'chi-siamo.html', 'en': 'en/about.html',    'es': 'es/quienes-somos.html', 'de': 'de/ueber-uns.html'},
    'servizi':  {'it': 'servizi.html',   'en': 'en/services.html', 'es': 'es/servicios.html',  'de': 'de/leistungen.html'},
    'lavori':   {'it': 'lavori.html',    'en': 'en/works.html',    'es': 'es/trabajos.html',   'de': 'de/referenzen.html'},
    'utilita':  {'it': 'utilita.html',   'en': 'en/tools.html',    'es': 'es/utilidades.html', 'de': 'de/nuetzliches.html'},
    'contatti': {'it': 'contatti.html',  'en': 'en/contact.html',  'es': 'es/contacto.html',   'de': 'de/kontakt.html'},
    'privacy':  {'it': 'privacy.html',   'en': 'en/privacy.html',  'es': 'es/privacidad.html', 'de': 'de/datenschutz.html'},
}

UI = {
    'it': {
        'nav': [('home', 'Home'), ('servizi', 'Servizi'), ('lavori', 'Lavori eseguiti'), ('utilita', 'Utilità'), ('chi', 'Chi siamo'), ('contatti', 'Contatti')],
        'area': 'Area clienti', 'quote': 'Richiedi un preventivo', 'skip': 'Vai al contenuto',
        'menu_open': 'Apri il menu', 'tagline': 'LAVORI MARITTIMI SUBACQUEI', 'more': 'Scopri',
        'all_services': 'Tutti i servizi', 'all_works': 'Tutti i lavori', 'call_now': 'CHIAMA ORA',
        'foot_about': 'Lavori marittimi subacquei.<br>Base operativa: porto di Loano (SV).',
        'office': 'Ufficio', 'site': 'SITO', 'privacy': 'Privacy e cookie', 'no_cookie': 'Nessun cookie di profilazione',
        'wa': 'Scrivici su WhatsApp', 'need': 'Serve un intervento?', 'need_lead': 'Scrivici su WhatsApp: ti rispondiamo in giornata.',
        'lang_label': 'Lingua',
    },
    'en': {
        'nav': [('home', 'Home'), ('servizi', 'Services'), ('lavori', 'Our work'), ('utilita', 'Tools'), ('chi', 'About us'), ('contatti', 'Contact')],
        'area': 'Customer area', 'quote': 'Request a quote', 'skip': 'Skip to content',
        'menu_open': 'Open menu', 'tagline': 'UNDERWATER MARINE WORKS', 'more': 'Learn more',
        'all_services': 'All services', 'all_works': 'All projects', 'call_now': 'CALL NOW',
        'foot_about': 'Underwater marine works.<br>Operating base: Loano harbour (SV), Italy.',
        'office': 'Office', 'site': 'WEBSITE', 'privacy': 'Privacy and cookies', 'no_cookie': 'No tracking cookies',
        'wa': 'Message us on WhatsApp', 'need': 'Need a job done?', 'need_lead': 'Message us on WhatsApp: we reply the same day.',
        'lang_label': 'Language',
    },
}

SERVIZI = [
    dict(id='pulizia-eliche', img='pulizia-eliche',
         it=dict(t='Pulizia eliche', short='Disincrostiamo eliche di ogni dimensione in acqua, senza mettere a secco barca o nave.',
                 body=['Dopo anni di prove abbiamo messo a punto un metodo per pulire e disincrostare eliche di qualsiasi dimensione direttamente in acqua. Niente alaggio, niente cantiere: i costi si dimezzano.',
                       'Alghe e piccoli molluschi sull\'opera viva frenano la barca: si perde velocità, sale il consumo e il motore lavora sotto sforzo, fino a fumare. Come la prevenzione dal dentista, la manutenzione regolare costa poco e si ripaga subito in carburante risparmiato.',
                       'Il nostro sistema riduce la fatica dell\'operatore e non inquina l\'acqua del porto.']),
         en=dict(t='Propeller cleaning', short='We descale propellers of any size in the water, without hauling out your boat or ship.',
                 body=['After years of testing we developed a method to clean and descale propellers of any size directly in the water. No haul-out, no yard: costs are halved.',
                       'Algae and small shellfish on the underwater hull slow the boat down: you lose speed, burn more fuel and strain the engine. Like a visit to the dentist, regular maintenance costs little and pays for itself straight away in fuel savings.',
                       'Our system reduces the diver\'s effort and does not pollute the harbour water.'])),
    dict(id='carenaggi', img='carenaggi',
         it=dict(t='Carenaggi', short='Spugne morbide per la vela, più abrasive per il motore, macchinari dedicati per le navi.',
                 body=['Puliamo la carena in acqua scegliendo lo strumento in base allo scafo: spugne idonee per le barche a vela, spugne più abrasive per le barche a motore.',
                       'Per le navi usiamo macchinari specifici ad assetto variabile, che lavorano su grandi superfici in tempi ridotti.']),
         en=dict(t='Hull cleaning', short='Soft pads for sailboats, more abrasive ones for motorboats, dedicated machines for ships.',
                 body=['We clean the hull in the water, choosing the tool for each hull: suitable pads for sailboats, more abrasive pads for motorboats.',
                       'For ships we use dedicated variable-trim machines that cover large surfaces quickly.'])),
    dict(id='anodi', img='sostituzione-anodi',
         it=dict(t='Sostituzione anodi', short='Controllo e cambio di zinchi e anodi su assi, piedi poppieri, flap e condotte sommerse.',
                 body=['Gli anodi sacrificali proteggono eliche, assi e parti metalliche dalle correnti galvaniche. Quando sono consumati, è il metallo della barca a corrodersi.',
                       'Li controlliamo, fotografiamo e sostituiamo in acqua. Con l\'area clienti ritrovi la data di montaggio e un promemoria per il controllo successivo.']),
         en=dict(t='Anode replacement', short='Inspection and replacement of zincs and anodes on shafts, sterndrives, trim tabs and subsea pipes.',
                 body=['Sacrificial anodes protect propellers, shafts and metal parts from galvanic corrosion. Once they are used up, it is your boat\'s metal that corrodes.',
                       'We check, photograph and replace them in the water. In the customer area you find the fitting date and a reminder for the next check.'])),
    dict(id='edili', img='porto-loano',
         it=dict(t='Lavori edili', short='Spianamenti, posa di blocchi prefabbricati, getti di calcestruzzo, sacchettamenti e demolizioni.',
                 body=['Abbiamo costruito le parti sommerse di tre porti turistici di grandi dimensioni. Sul fondale prepariamo spianamenti in ghiaia sui basamenti realizzati dalla gru.',
                       'Sopra posiamo blocchi prefabbricati in cemento armato da 3 x 2 metri con precisione al millimetro: dal fondo guidiamo il gruista con il telefono subacqueo, perché lui il blocco immerso non lo vede.',
                       'Eseguiamo getti di cemento sott\'acqua, sia nei porti in costruzione sia su moli erosi dal mare, sacchettamenti e demolizioni con martelli pneumatici o esplosivo.']),
         en=dict(t='Civil works', short='Seabed levelling, laying of precast blocks, underwater concrete pours, sandbagging and demolition.',
                 body=['We built the underwater sections of three large marinas. On the seabed we level gravel beds over the foundations placed by the crane.',
                       'On top we lay precast reinforced-concrete blocks of 3 x 2 metres with millimetre accuracy: from the bottom we guide the crane operator by underwater telephone, since he cannot see the submerged block.',
                       'We pour concrete underwater, both in new harbours and on piers eroded by the sea, and carry out sandbagging and demolition with pneumatic hammers or explosives.'])),
    dict(id='metalmeccanica', img='saldature',
         it=dict(t='Metalmeccanica', short='Tagli e saldature in immersione, carpenteria in ferro, tubazioni, chiusura falle.',
                 body=['Eseguiamo tagli e saldature subacquee di ogni tipo, con l\'esperienza maturata nella costruzione di scivoli di varo e bancali.',
                       'Siamo specializzati nel taglio subacqueo dei metalli e nella carpenteria in ferro. Realizziamo reti fognarie e tubazioni con posa e flangiatura.',
                       'Ci occupiamo anche di manutenzione: fissaggio di anodi e zinchi, chiusura di falle, aggiunta di manicotti.']),
         en=dict(t='Metalwork', short='Underwater cutting and welding, steel fabrication, pipework, leak sealing.',
                 body=['We carry out underwater cutting and welding of every kind, drawing on our experience building launching ramps and cradles.',
                       'We specialise in underwater metal cutting and steel fabrication. We build sewer lines and pipework, including laying and flanging.',
                       'We also handle maintenance: fitting anodes and zincs, sealing leaks, adding repair sleeves.'])),
    dict(id='recuperi', img='recuperi',
         it=dict(t='Recuperi', short='Oggetti persi in mare: palloni di sollevamento per i pezzi piccoli, pontone per quelli grandi.',
                 body=['Recuperiamo oggetti persi in mare. Per quelli di dimensioni contenute usiamo palloni di sollevamento a paracadute; per quelli più pesanti interveniamo con il pontone.']),
         en=dict(t='Salvage and recovery', short='Objects lost at sea: lift bags for small items, a pontoon for large ones.',
                 body=['We recover objects lost at sea. For smaller items we use parachute lift bags; for heavier ones we work from our pontoon.'])),
    dict(id='alaggi', img='alaggi',
         it=dict(t='Alaggi e vari', short='Alaggio e varo di imbarcazioni anche di grandi dimensioni, con travel lift o altri mezzi.',
                 body=['Eseguiamo alaggi e vari di imbarcazioni di grandi dimensioni con l\'ausilio del travel lift o di altri mezzi.',
                       'Li eseguiamo in qualsiasi porto o cantiere: il sub in acqua controlla il posizionamento delle fasce sotto lo scafo.']),
         en=dict(t='Haul-outs and launches', short='Haul-out and launch of boats of any size, with travel lift or other equipment.',
                 body=['We haul out and launch large boats using a travel lift or other equipment.',
                       'We do them in any harbour or shipyard: the diver in the water checks the position of the slings under the hull.'])),
    dict(id='foto-video', img='tubazioni-sommerse',
         it=dict(t='Foto e videoriprese', short='Riprese digitali per armatori e periti, ispezioni di condotte con ROV filoguidato.',
                 body=['Realizziamo foto e video subacquei in digitale, nel formato che preferisci, e te li inviamo via email.',
                       'Con un ROV filoguidato di piccole dimensioni ispezioniamo l\'interno e l\'esterno delle tubazioni sommerse, anche a grandi profondità.']),
         en=dict(t='Photo and video', short='Digital footage for owners and surveyors, pipeline inspections with a tethered ROV.',
                 body=['We shoot underwater photos and video in digital format, in the format you prefer, and send them by email.',
                       'With a small tethered ROV we inspect the inside and outside of subsea pipes, even at great depth.'])),
    dict(id='reti-anti-medusa', img='reti-anti-medusa',
         it=dict(t='Reti anti medusa', short='Sistema Medusa Protect per proteggere le zone di balneazione da meduse e residui galleggianti.',
                 body=['Installiamo il sistema Medusa Protect: una rete a micro-maglia che tiene lontane le meduse e filtra in superficie schiume, oli e residui galleggianti.',
                       'Il sistema di stralli la mantiene verticale anche con correnti e onde forti, riducendo le sollecitazioni e allungandone la durata. È progettata perché nessun bagnante possa impigliarsi.',
                       'È facile da montare, smontare, riparare e stoccare, e aiuta a ottenere la Bandiera Blu.']),
         en=dict(t='Anti-jellyfish nets', short='The Medusa Protect system keeps jellyfish and floating debris away from bathing areas.',
                 body=['We install the Medusa Protect system: a micro-mesh net that keeps jellyfish away and filters foam, oil and floating debris at the surface.',
                       'Its stay system keeps the net upright even in strong currents and waves, reducing loads and extending its life. It is designed so that no swimmer can get caught.',
                       'It is easy to install, remove, repair and store, and helps beaches earn the Blue Flag.'])),
    dict(id='progettazioni', img='porto-varazze',
         it=dict(t='Progettazioni', short='Progetti di opere marittime con ingegneri e geometri specializzati.',
                 body=['Per la progettazione di lavori marittimi e subacquei collaboriamo con ingegneri e geometri liberi professionisti specializzati nel settore, che conosciamo da anni di cantieri fatti insieme.']),
         en=dict(t='Design and engineering', short='Marine works designed with specialised engineers and surveyors.',
                 body=['For the design of marine and underwater works we team up with independent engineers and surveyors specialised in the field, people we have known through years of joint projects.'])),
]

LAVORI = [
    dict(id='porto-loano', img='porto-loano', it=dict(luogo='Loano (SV)', t='Parti sommerse del porto', toc='Porto di Loano', d='Spianamenti, posa dei blocchi prefabbricati, catenarie con i rispettivi ormeggi, demolizioni di ferro e cemento sommerso.'),
         en=dict(luogo='Loano (SV)', t='Underwater sections of the marina', toc='Loano marina', d='Seabed levelling, laying of precast blocks, mooring chains with their moorings, demolition of submerged steel and concrete.')),
    dict(id='pietra-ligure', img='pietra-ligure', it=dict(luogo='Pietra Ligure (SV)', t='Scivolo di varo, Cantieri Navali Rodriquez', toc='Scivolo di varo, Pietra Ligure', d='Scivolo subacqueo per il varo di traghetti destinati alla Penisola Iberica, assemblato e saldato sott\'acqua.'),
         en=dict(luogo='Pietra Ligure (SV)', t='Launching ramp, Rodriquez shipyard', toc='Launching ramp, Pietra Ligure', d='Underwater ramp for launching ferries built for the Iberian Peninsula, assembled and welded underwater.')),
    dict(id='porto-varazze', img='porto-varazze', it=dict(luogo='Varazze (SV)', t='Parti sommerse del porto', toc='Porto di Varazze', d='Spianamento del fondale, posa dei blocchi in cemento prefabbricati, demolizioni di ferro e cemento sommerso.'),
         en=dict(luogo='Varazze (SV)', t='Underwater sections of the marina', toc='Varazze marina', d='Seabed levelling, laying of precast concrete blocks, demolition of submerged steel and concrete.')),
    dict(id='porto-arenzano', img='porto-arenzano', it=dict(luogo='Arenzano (GE)', t='Parti sommerse del porto', toc='Porto di Arenzano', d='Dallo spianamento alla posa dei blocchi prefabbricati, fino alle demolizioni di strutture sommerse.'),
         en=dict(luogo='Arenzano (GE)', t='Underwater sections of the marina', toc='Arenzano marina', d='From seabed levelling to laying precast blocks and demolishing submerged structures.')),
    dict(id='azimut', img='azimut', it=dict(luogo='Cantieri Azimut', t='Trasferimento dell\'impianto sommerso', toc='Cantieri Azimut', d='Smontaggio e rimontaggio in un altro sito di ormeggi e pontili galleggianti.'),
         en=dict(luogo='Azimut shipyards', t='Relocation of the underwater mooring system', toc='Azimut shipyards', d='Removal and reinstallation of moorings and floating pontoons at a new site.')),
    dict(id='antibes', img='antibes', it=dict(luogo='Antibes (Francia)', t='Solarium e reti anti medusa', toc='Antibes', d='Costruzione di un solarium e installazione delle reti di protezione per la zona di balneazione.'),
         en=dict(luogo='Antibes (France)', t='Sun deck and anti-jellyfish nets', toc='Antibes', d='Construction of a sun deck and installation of protective nets for the bathing area.')),
    dict(id='reti-anti-medusa', img='reti-anti-medusa', it=dict(luogo='Liguria e Costa Azzurra', t='Reti anti medusa', toc='Reti anti medusa', d='Posa del sistema Medusa Protect a protezione delle spiagge.'),
         en=dict(luogo='Liguria and French Riviera', t='Anti-jellyfish nets', toc='Anti-jellyfish nets', d='Installation of the Medusa Protect system to protect beaches.')),
    dict(id='tubazioni-sommerse', img='tubazioni-sommerse', it=dict(luogo='Liguria', t='Posa e riparazione di tubazioni sommerse', toc='Tubazioni sommerse', d='Ispezioni con ROV e videocamera, riparazioni con manicotti e fasce, sostituzione di zinchi e anodi sulle condotte.'),
         en=dict(luogo='Liguria', t='Subsea pipe laying and repair', toc='Subsea pipes', d='ROV and camera surveys, repairs with sleeves and clamps, replacement of zincs and anodes on pipelines.')),
    dict(id='saldature', img='saldature', it=dict(luogo='Porti e cantieri', t='Saldature subacquee', toc='Saldature', d='Saldature in immersione su strutture portuali, scivoli e scafi.'),
         en=dict(luogo='Harbours and shipyards', t='Underwater welding', toc='Welding', d='Underwater welding on harbour structures, ramps and hulls.')),
    dict(id='spianamenti', img='spianamenti', it=dict(luogo='Porti liguri', t='Spianamenti e vasche di decantazione', toc='Spianamenti', d='Spianamento subacqueo del fondale e posa delle vasche di decantazione.'),
         en=dict(luogo='Ligurian harbours', t='Seabed levelling and settling tanks', toc='Seabed levelling', d='Underwater levelling of the seabed and placement of settling tanks.')),
    dict(id='demolizioni', img='demolizioni', it=dict(luogo='Porti liguri', t='Demolizioni subacquee', toc='Demolizioni', d='Taglio e demolizione di strutture sommerse in ferro e calcestruzzo.'),
         en=dict(luogo='Ligurian harbours', t='Underwater demolition', toc='Demolition', d='Cutting and demolition of submerged steel and concrete structures.')),
    dict(id='catenarie', img='catenarie', it=dict(luogo='Porti turistici', t='Catenarie e ormeggi', toc='Catenarie', d='Posa delle catenarie sul fondale e collegamento degli ormeggi.'),
         en=dict(luogo='Marinas', t='Mooring chains', toc='Mooring chains', d='Laying of ground chains on the seabed and connection of the moorings.')),
    dict(id='alaggi', img='alaggi', it=dict(luogo='Savona, W. Service', t='Alaggi e vari', toc='Alaggi', d='Alaggi e vari di imbarcazioni di grandi dimensioni con travel lift.'),
         en=dict(luogo='Savona, W. Service', t='Haul-outs and launches', toc='Haul-outs', d='Haul-outs and launches of large boats with a travel lift.')),
    dict(id='sostituzione-anodi', img='sostituzione-anodi', it=dict(luogo='Porto di Loano', t='Sostituzione anodi', toc='Sostituzione anodi', d='Controllo e sostituzione di anodi sacrificali su assi, piedi poppieri e condotte.'),
         en=dict(luogo='Loano harbour', t='Anode replacement', toc='Anode replacement', d='Inspection and replacement of sacrificial anodes on shafts, sterndrives and pipelines.')),
    dict(id='malta', img='malta', it=dict(luogo='Malta', t='Lavori subacquei a Malta', toc='Malta', d='Interventi subacquei all\'estero, a Malta.'),
         en=dict(luogo='Malta', t='Underwater works in Malta', toc='Malta', d='Underwater works abroad, in Malta.')),
    dict(id='algeria', img='algeria', it=dict(luogo='Algeria', t='Lavori subacquei in Algeria', toc='Algeria', d='Interventi subacquei all\'estero, in Algeria.'),
         en=dict(luogo='Algeria', t='Underwater works in Algeria', toc='Algeria', d='Underwater works abroad, in Algeria.')),
]

TEAM = [
    dict(ini='FC', n='Francesco Cuvato',
         it=dict(r='Operatore tecnico subacqueo', b=['Istruttore IANTD con utilizzo di miscele', 'Aiuto istruttore ANIS', 'Sommozzatore operativo Croce Rossa', 'Salvamento e tecniche di rianimazione CRI']),
         en=dict(r='Commercial diver (O.T.S.)', b=['IANTD instructor, mixed-gas diving', 'ANIS assistant instructor', 'Italian Red Cross operational diver', 'Red Cross lifesaving and resuscitation'])),
    dict(ini='SC', n='Simone Cuvato',
         it=dict(r='Operatore tecnico subacqueo', b=['Aiuto istruttore ANIS', 'Sommozzatore operativo Croce Rossa', 'Salvamento e tecniche di rianimazione CRI']),
         en=dict(r='Commercial diver (O.T.S.)', b=['ANIS assistant instructor', 'Italian Red Cross operational diver', 'Red Cross lifesaving and resuscitation'])),
]

MEZZI = {
    'it': [('In mare', ['Imbarcazione da lavoro Bianca Maria', 'Pilotina di servizio Golondrina', 'Motopontone', 'Gommone 8 posti trasportabile']),
           ('Immersione', ['Elmetti Morgan per immersioni oltre i 12 m', 'Telefono subacqueo', 'ROV filoguidato con videocamera', 'Container attrezzato per supporto vitale', 'Compressori Coltri, anche trasportabili']),
           ('Lavorazioni', ['Motosaldatrice e pinza da saldatura subacquea', 'Torcia da taglio metalli subacquea', 'Fioretto ad aria compressa', 'Idropulitrice ad acqua calda e idrosabbiatrice', 'Draga e sorbona per scavi subacquei']),
           ('A terra', ['Autocarro Opel Combo', 'Toyota 4x4 per località impervie', 'Carrello stradale per gommone e pilotina', 'Container magazzino', 'GPS per posizionamento satellitare'])],
    'en': [('At sea', ['Work boat Bianca Maria', 'Service launch Golondrina', 'Motorised pontoon', 'Transportable 8-seat RIB']),
           ('Diving', ['Morgan helmets for dives beyond 12 m', 'Underwater telephone', 'Tethered ROV with camera', 'Life-support container', 'Coltri compressors, portable too']),
           ('Work tools', ['Welding generator and underwater welding torch', 'Underwater metal-cutting torch', 'Pneumatic rock drill', 'Hot-water pressure washer and sandblaster', 'Dredge and suction pump for underwater digging']),
           ('On land', ['Opel Combo van', 'Toyota 4x4 for rough terrain', 'Road trailer for RIB and launch', 'Storage container', 'Satellite GPS positioning'])],
}

MODULI = {
    'it': [('Scheda imbarcazione', 'Dati barca, motore, documenti e scadenze, compilati da te'), ('Pulizia subacquea', 'Data dell\'ultimo intervento e foto dei nostri sub'),
           ('Registro anodi', 'Foto, codice, data di montaggio e promemoria'), ('Promemoria via email', 'Prossima pulizia, anodi, assicurazione'),
           ('Richiesta intervento', 'Un tocco e ci scrivi su WhatsApp'), ('Condivisione WhatsApp', 'Le foto degli interventi in un tocco')],
    'en': [('Boat details', 'Boat, engine, documents and expiry dates, filled in by you'), ('Underwater cleaning', 'Date of the last job and photos from our divers'),
           ('Anode log', 'Photo, code, fitting date and reminder'), ('Email reminders', 'Next cleaning, anodes, insurance'),
           ('Job request', 'One tap to message us on WhatsApp'), ('WhatsApp sharing', 'Job photos in one tap')],
}

# Sezioni della pagina Utilità (id, titolo IT, titolo EN), nell'ordine del menu
UTIL_SEZIONI = [
    ('meteo', 'Meteomare Loano', 'Loano marine weather'),
    ('webcam', 'Webcam Loano', 'Loano webcam'),
    ('gps', 'Marcatore GPS', 'GPS marker'),
    ('porto', 'Porto di Loano', 'Port of Loano'),
    ('vento', 'Scala del vento', 'Wind scale'),
    ('cime', 'Cime', 'Ropes'),
    ('cavi', 'Cavi in acciaio', 'Steel wire'),
    ('catene', 'Catene', 'Chains'),
]
# Link della webcam di Loano (cambialo qui quando il Comune pubblica quello ufficiale)
WEBCAM_URL = 'https://www.windfinder.com/webcams/loano'

# ---------------- UTILITÀ ----------------
# Scala Beaufort (valori standard WMO)
BEAUFORT = [
    (0, 'Calma', 'Calm', '0-1', '< 1', 'Mare a specchio.', 'Sea like a mirror.'),
    (1, 'Bava di vento', 'Light air', '1-5', '1-3', 'Piccole increspature, senza creste.', 'Small ripples, no crests.'),
    (2, 'Brezza leggera', 'Light breeze', '6-11', '4-6', 'Onde piccole e brevi, creste vetrose che non si rompono.', 'Small short wavelets, glassy crests that do not break.'),
    (3, 'Brezza tesa', 'Gentle breeze', '12-19', '7-10', 'Onde più marcate, creste che iniziano a rompersi, qualche pecorella.', 'Large wavelets, crests begin to break, scattered whitecaps.'),
    (4, 'Vento moderato', 'Moderate breeze', '20-28', '11-16', 'Onde più lunghe, pecorelle frequenti.', 'Longer small waves, frequent whitecaps.'),
    (5, 'Vento teso', 'Fresh breeze', '29-38', '17-21', 'Onde moderate e ben definite, molte pecorelle, qualche spruzzo.', 'Moderate, longer waves, many whitecaps, some spray.'),
    (6, 'Vento fresco', 'Strong breeze', '39-49', '22-27', 'Onde grandi, creste bianche estese, spruzzi.', 'Large waves, extensive white foam crests, some spray.'),
    (7, 'Vento forte', 'Near gale', '50-61', '28-33', 'Il mare si ingrossa, la schiuma delle creste si allunga in strisce nella direzione del vento.', 'Sea heaps up, foam from breaking waves blown in streaks along the wind.'),
    (8, 'Burrasca', 'Gale', '62-74', '34-40', 'Onde alte e lunghe, creste che si rompono in spruzzi, strisce di schiuma ben marcate.', 'Moderately high, long waves, crests break into spindrift, well-marked foam streaks.'),
    (9, 'Burrasca forte', 'Strong gale', '75-88', '41-47', 'Onde alte, dense strisce di schiuma, creste che si rovesciano, spruzzi che riducono la visibilità.', 'High waves, dense foam streaks, crests topple and roll over, spray reduces visibility.'),
    (10, 'Tempesta', 'Storm', '89-102', '48-55', 'Onde molto alte con lunghe creste frangenti, mare bianco di schiuma, visibilità ridotta.', 'Very high waves with long overhanging crests, sea white with foam, reduced visibility.'),
    (11, 'Fortunale', 'Violent storm', '103-117', '56-63', 'Onde eccezionalmente alte, mare coperto di schiuma, visibilità molto ridotta.', 'Exceptionally high waves, sea covered in foam, visibility seriously reduced.'),
    (12, 'Uragano', 'Hurricane', '≥ 118', '≥ 64', 'Aria piena di schiuma e spruzzi, mare completamente bianco, visibilità quasi nulla.', 'Air filled with foam and spray, sea completely white, visibility nearly zero.'),
]

# Cime piane a tre legnoli o trecciate a otto legnoli (kg): diametro mm, rottura Manila/Canapa/Polipropilene/Nylon, lavoro idem
CIME = [
    (8, 480, 485, 960, 1350, 48, 48, 96, 112), (10, 635, 755, 1425, 2080, 70, 75, 158, 189), (12, 950, 1075, 2030, 3000, 105, 119, 225, 274),
    (14, 1280, 1450, 2790, 4100, 142, 160, 309, 374), (16, 1780, 1880, 3500, 5300, 223, 235, 438, 530), (18, 2130, 2380, 4450, 6700, 267, 298, 557, 670),
    (20, 2840, 2940, 5370, 8300, 405, 419, 766, 922), (22, 3400, 3540, 6500, 10000, 485, 505, 927, 1121), (24, 4060, 4175, 7600, 12000, 581, 598, 1088, 1338),
    (26, 4720, 4895, 8900, 13900, 675, 701, 1274, 1549), (28, 5330, 5675, 10100, 15800, 759, 808, 1444, 1760), (30, 6100, 6480, 11500, 17900, 869, 923, 1644, 1994),
    (32, 6860, 7320, 12800, 20000, 980, 1046, 1822, 2226), (36, 8640, 9070, 16100, 24800, 1234, 1296, 2293, 2760), (40, 10400, 10880, 19400, 30000, 1933, 1550, 2764, 3333),
    (44, 12700, 13565, 23400, 35800, 1809, 1933, 3334, 3977), (48, 14700, 15320, 27200, 42000, 2099, 2188, 3892, 4653), (52, 17300, 17575, 31500, 48800, 2470, 2509, 4507, 5407),
    (56, 19800, 20070, 36000, 56000, 2835, 2874, 5137, 6244), (60, 22600, 22680, 41200, 63800, 3236, 3247, 5879, 7113), (64, 25700, 25395, 46600, 72000, 3677, 3634, 6673, 7984),
    (68, 28700, 28065, 52000, 81000, 4106, 4016, 7446, 8982), (72, 32000, 31105, 58500, 90000, 4563, 4435, 8347, 9999), (76, 35600, 34080, 65000, 100000, 5076, 4859, 9275, 11110),
    (80, 39100, 37250, 72000, 110000, 5575, 5311, 10274, 12221), (88, 47200, 45000, 86400, 131000, 6730, 6417, 12303, 15811), (96, 55900, 53000, 102000, 154000, 7971, 7557, 14254, 18587),
]

# Cavi in acciaio a sei legnoli: diametro mm, peso g/m, carico di rottura kg
CAVI = [(3, 33, 500), (4, 55, 925), (5, 92, 1400), (6, 135, 2250), (7, 180, 3000), (8, 235, 4000), ('8,5', 265, 4700), (9, 300, 5250), (10, 370, 6500),
        (11, 455, 8000), (12, 530, 8850), (13, 620, 10500), (14, 720, 12000), (15, 820, 14000), (16, 940, 15400), (18, 1200, 20300), (19, 1310, 22600),
        (20, 1540, 25000), (22, 1780, 30400), (24, 2080, 36000), (26, 2450, 41500), (28, 2840, 47200), (30, 3290, 55500), (32, 3710, 62200),
        (34, 4170, 67800), (36, 4700, 76000), (40, 5800, 94250)]

# Catene di ferro con traversino: calibro mm, maglia (larghezza x lunghezza mm), peso kg/m, carico di rottura t, carico di sicurezza t
CATENE = [
    (13, '47 × 78', '3,390', '7,170', '1,024'), (14, '50 × 84', '4,198', '8,320', '1,188'), (15, '54 × 90', '5,009', '9,540', '1,363'), (16, '58 × 96', '5,500', '10,860', '1,551'),
    (17, '61 × 102', '6,925', '12,250', '1,750'), (18, '65 × 108', '7,008', '13,740', '1,963'), (19, '68 × 114', '7,700', '15,250', '2,178'), (20, '72 × 120', '8,550', '16,960', '2,423'),
    (21, '76 × 126', '9,040', '18,630', '2,661'), (22, '79 × 132', '10,180', '20,510', '2,930'), (23, '83 × 138', '11,170', '22,400', '3,200'), (24, '86 × 144', '12,010', '23,400', '3,343'),
    (25, '90 × 150', '12,820', '26,380', '3,770'), (26, '94 × 156', '14,040', '28,630', '4,090'), (27, '97 × 162', '15,010', '30,910', '4,701'), (28, '101 × 168', '16,050', '33,190', '4,741'),
    (29, '104 × 174', '17,140', '35,480', '5,068'), (30, '108 × 180', '17,960', '38,080', '5,443'), (31, '112 × 186', '19,580', '40,600', '5,828'), (32, '115 × 192', '20,900', '43,300', '6,185'),
    (33, '119 × 198', '22,110', '46,110', '6,587'), (34, '122 × 204', '23,460', '49,000', '7,000'), (35, '126 × 210', '24,850', '52,000', '7,428'), (36, '130 × 216', '26,930', '55,000', '7,857'),
    (37, '133 × 222', '27,240', '58,100', '8,300'), (38, '137 × 228', '29,210', '61,200', '8,743'), (39, '140 × 234', '30,760', '64,500', '9,214'), (40, '144 × 240', '32,550', '67,900', '9,700'),
    (41, '148 × 246', '34,220', '71,200', '10,171'), (42, '151 × 252', '35,460', '74,700', '10,671'), (43, '155 × 258', '37,400', '78,300', '11,135'), (44, '158 × 264', '39,620', '81,700', '11,671'),
    (45, '162 × 270', '41,660', '85,500', '12,214'), (46, '166 × 276', '43,660', '89,200', '12,743'), (47, '169 × 282', '45,400', '93,000', '13,285'), (48, '173 × 288', '47,500', '96,700', '13,814'),
    (49, '176 × 294', '50,000', '100,700', '14,385'), (50, '180 × 300', '52,040', '104,700', '14,957'),
]

# Catene a maglie con traversino per ancore: diametro, CP/CR grado 1-1b, grado 2, grado 3 (kg), peso 27,5 m con maniglia d'unione / Kenter (kg)
CATENE_ANCORE = [
    (14, 5880, 8400, 8400, 11770, None, None, 133, 130), (16, 7660, 10940, 10940, 15310, None, None, 164, 161), (19, 10740, 15340, 15340, 21470, None, None, 226, 222),
    (22, 14310, 20440, 20440, 28620, None, None, 298, 294), (26, 19840, 28340, 28340, 39670, None, None, 422, 417), (30, 26200, 37450, 37450, 52400, None, None, 566, 561),
    (34, 33400, 47700, 47700, 66800, None, None, 720, 710), (40, 45700, 65280, 65280, 91400, 91400, 130550, 995, 980), (46, 59700, 85300, 85300, 119450, 119450, 170650, 1295, 1275),
    (52, 75400, 107750, 107750, 150800, 150800, 215450, 1650, 1620), (58, 92700, 132400, 132400, 185350, 185350, 264800, 2050, 2005), (64, 111500, 159250, 159250, 222950, 222950, 318500, 2500, 2440),
    (70, 131700, 188150, 188150, 263400, 263400, 376300, 3010, 2935), (76, 153300, 219050, 219050, 306650, 306650, 438050, 3560, 3400), (84, 184150, 263050, 263050, 368250, 368250, 526100, 4360, 4230),
    (92, 217100, 310100, 310100, 434150, 434150, 620250, 5225, 5050), (100, 252000, 360000, 360000, 504000, 504000, 720000, 6140, 5915), (108, 288700, 412450, 412450, 577400, 577400, 824850, 7175, 6895),
    (114, 317300, 453300, 453300, 634600, 634600, 906600, 8020, 7700), (120, 346750, 495350, 495350, 693500, 693500, 990700, 8900, 8520), (130, 397490, 567840, 567840, 794980, 794980, 1135680, None, 10000),
    (142, 460710, 658150, 658150, 921410, 921410, 1316310, None, 11845), (152, 514940, 735630, 735630, 1029880, 1029880, 1471260, None, 13595),
]


# ---------------- spagnolo e tedesco ----------------
from contenuti_es_de import (UI_ES_DE, SERVIZI_ES_DE, LAVORI_ES_DE, TEAM_ES_DE, MEZZI_ES_DE,  # noqa: E402
                             MODULI_ES_DE, UTIL_ES_DE, BEAUFORT_ES_DE)
UI.update(UI_ES_DE)
for _s in SERVIZI:
    _s.update(SERVIZI_ES_DE[_s['id']])
for _l in LAVORI:
    _l.update(LAVORI_ES_DE[_l['id']])
from lavori_testi import LAV_TXT  # noqa: E402
for _l in LAVORI:
    for _lg, _v in LAV_TXT.get(_l['id'], {}).items():
        _l[_lg].update(_v)
for _p in TEAM:
    _p.update(TEAM_ES_DE[_p['ini']])
MEZZI.update(MEZZI_ES_DE)
MODULI.update(MODULI_ES_DE)
# Utilità: id -> titolo per lingua
UTIL = [(a, {'it': b, 'en': c, 'es': UTIL_ES_DE[a][0], 'de': UTIL_ES_DE[a][1]}) for a, b, c in UTIL_SEZIONI]
# Beaufort: forza, km/h, nodi, {lingua: (nome, stato del mare)}
BEAUFORT4 = [(f, kmh, kn, {'it': (a, s_it), 'en': (b, s_en), 'es': BEAUFORT_ES_DE['es'][f], 'de': BEAUFORT_ES_DE['de'][f]})
             for f, a, b, kmh, kn, s_it, s_en in BEAUFORT]
