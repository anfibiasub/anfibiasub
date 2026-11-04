# Testi fissi delle pagine del sito, in 4 lingue.
# Ogni voce: {'it': ..., 'en': ..., 'es': ..., 'de': ...}

TX = {
    # --- generici
    'intro': {'it': 'Introduzione', 'en': 'Introduction', 'es': 'Introducción', 'de': 'Einleitung'},
    'all_srv': {'it': 'Tutti i servizi', 'en': 'All services', 'es': 'Todos los servicios', 'de': 'Alle Leistungen'},
    'all_lav': {'it': 'Tutti i lavori', 'en': 'All projects', 'es': 'Todos los trabajos', 'de': 'Alle Referenzen'},
    'all_uti': {'it': 'Tutte le utilità', 'en': 'All tools', 'es': 'Todas las utilidades', 'de': 'Alle Hilfsmittel'},

    # --- home
    'hero_alt': {'it': 'Operatore subacqueo guida un blocco di cemento calato dalla gru sul fondale', 'en': 'Diver guiding a concrete block lowered by a crane onto the seabed',
                 'es': 'Buzo guiando un bloque de hormigón bajado por la grúa al fondo', 'de': 'Taucher führt einen vom Kran abgesenkten Betonblock auf den Meeresgrund'},
    'hero_kicker_m': {'it': 'LAVORI SUBACQUEI', 'en': 'UNDERWATER WORKS', 'es': 'TRABAJOS SUBACUÁTICOS', 'de': 'UNTERWASSERARBEITEN'},
    'hero_kicker': {'it': 'LAVORI MARITTIMI SUBACQUEI · PORTO DI LOANO', 'en': 'UNDERWATER MARINE WORKS · LOANO HARBOUR',
                    'es': 'TRABAJOS MARÍTIMOS SUBACUÁTICOS · PUERTO DE LOANO', 'de': 'MARITIME UNTERWASSERARBEITEN · HAFEN LOANO'},
    'hero_h1': {'it': '<span class="fit">IL VALORE DELL\'ESPERIENZA,</span><span class="fit hl">SOTTO LA SUPERFICIE</span>',
                'en': '<span class="fit">THE VALUE OF EXPERIENCE,</span><span class="fit hl">BELOW THE SURFACE</span>',
                'es': '<span class="fit">EL VALOR DE LA EXPERIENCIA,</span><span class="fit hl">BAJO LA SUPERFICIE</span>',
                'de': '<span class="fit">DER WERT DER ERFAHRUNG,</span><span class="fit hl">UNTER DER OBERFLÄCHE</span>'},
    'hero_lead': {'it': 'Operiamo dal porto di Loano: lavori edili e metalmeccanici subacquei, recuperi in mare, pulizia eliche e carene, foto e video sott\'acqua. Serietà, professionalità e competenza.',
                  'en': 'We work out of Loano harbour on the Italian Riviera: underwater civil and metal works, recoveries at sea, propeller and hull cleaning, underwater photo and video. Reliable, professional, skilled.',
                  'es': 'Trabajamos desde el puerto de Loano, en la Riviera italiana: obras civiles y metalmecánicas subacuáticas, recuperaciones en el mar, limpieza de hélices y cascos, fotos y vídeos subacuáticos. Seriedad, profesionalidad y competencia.',
                  'de': 'Wir arbeiten vom Hafen Loano an der Italienischen Riviera aus: Bau- und Metallarbeiten unter Wasser, Bergungen auf See, Propeller- und Rumpfreinigung, Unterwasserfotos und -videos. Zuverlässig, professionell, kompetent.'},
    'hero_cta': {'it': 'SCOPRI I NOSTRI SERVIZI', 'en': 'SEE OUR SERVICES', 'es': 'DESCUBRE NUESTROS SERVICIOS', 'de': 'UNSERE LEISTUNGEN'},
    'badges': {'it': [('O.T.S. qualificati', 'brevetti IANTD, ANIS, Croce Rossa'), ('In acqua', 'niente cantiere, costi dimezzati'), ('3 porti costruiti', 'Loano, Varazze, Arenzano'), ('Foto e video', 'ogni intervento documentato')],
               'en': [('Qualified divers', 'IANTD, ANIS, Red Cross certified'), ('In the water', 'no haul-out, half the cost'), ('3 marinas built', 'Loano, Varazze, Arenzano'), ('Photo and video', 'every job documented')],
               'es': [('Buzos cualificados', 'títulos IANTD, ANIS, Cruz Roja'), ('En el agua', 'sin astillero, mitad de coste'), ('3 puertos construidos', 'Loano, Varazze, Arenzano'), ('Fotos y vídeo', 'cada intervención documentada')],
               'de': [('Qualifizierte Taucher', 'IANTD, ANIS, Rotes Kreuz'), ('Im Wasser', 'kein Kranen, halbe Kosten'), ('3 Häfen gebaut', 'Loano, Varazze, Arenzano'), ('Foto und Video', 'jeder Einsatz dokumentiert')]},
    'srv_eyebrow': {'it': 'I nostri servizi', 'en': 'Our services', 'es': 'Nuestros servicios', 'de': 'Unsere Leistungen'},
    'srv_h2': {'it': 'Soluzioni subacquee<br><span class="hl">per ogni scafo</span>', 'en': 'Underwater solutions<br><span class="hl">for every hull</span>',
               'es': 'Soluciones subacuáticas<br><span class="hl">para cada casco</span>', 'de': 'Unterwasserlösungen<br><span class="hl">für jeden Rumpf</span>'},
    'srv_lead': {'it': 'Dalla barca da diporto alla nave, dal pontile al porto intero.', 'en': 'From pleasure boats to ships, from a single pontoon to an entire marina.',
                 'es': 'Del barco de recreo al buque, del pantalán al puerto entero.', 'de': 'Vom Freizeitboot bis zum Schiff, vom Steg bis zum ganzen Hafen.'},
    'fam_h2': {'it': 'Una famiglia<br><span class="hl">che lavora sott\'acqua</span>', 'en': 'A family<br><span class="hl">that works underwater</span>',
               'es': 'Una familia<br><span class="hl">que trabaja bajo el agua</span>', 'de': 'Eine Familie,<br><span class="hl">die unter Wasser arbeitet</span>'},
    'fam_lead': {'it': 'Due operatori tecnici subacquei della famiglia Cuvato, con anni di immersioni professionali e brevetti tecnici e di soccorso.',
                 'en': 'Two commercial divers from the Cuvato family, with years of professional diving and technical and rescue certifications.',
                 'es': 'Dos buzos profesionales de la familia Cuvato, con años de buceo profesional y títulos técnicos y de salvamento.',
                 'de': 'Zwei Berufstaucher der Familie Cuvato mit langjähriger Erfahrung im Berufstauchen sowie technischen und Rettungs-Zertifikaten.'},
    'lav_h2': {'it': 'Opere che stanno<br><span class="hl">sotto il livello del mare</span>', 'en': 'Structures that sit<br><span class="hl">below sea level</span>',
               'es': 'Obras que están<br><span class="hl">bajo el nivel del mar</span>', 'de': 'Bauwerke<br><span class="hl">unter dem Meeresspiegel</span>'},
    'area_eyebrow': {'it': 'Novità · Area clienti', 'en': 'New · Customer area', 'es': 'Novedad · Área de clientes', 'de': 'Neu · Kundenbereich'},
    'area_h2': {'it': 'La tua barca,<br><span class="hl">sempre sotto controllo</span>', 'en': 'Your boat,<br><span class="hl">always under control</span>',
                'es': 'Tu barco,<br><span class="hl">siempre bajo control</span>', 'de': 'Ihr Boot,<br><span class="hl">immer im Blick</span>'},
    'area_lead': {'it': 'Accedi con la tua password e trovi tutto in un posto: scheda della barca, storico delle pulizie con le foto dei nostri sub, registro anodi e promemoria via email.',
                  'en': 'Sign in with your password and find everything in one place: boat details, cleaning history with photos from our divers, anode log and email reminders.',
                  'es': 'Entra con tu contraseña y encuentra todo en un solo lugar: ficha del barco, historial de limpiezas con las fotos de nuestros buzos, registro de ánodos y recordatorios por email.',
                  'de': 'Melden Sie sich mit Ihrem Passwort an und finden Sie alles an einem Ort: Bootsdatenblatt, Reinigungsverlauf mit Fotos unserer Taucher, Anodenprotokoll und E-Mail-Erinnerungen.'},
    'area_cta': {'it': 'Accedi all\'area clienti', 'en': 'Sign in to the customer area', 'es': 'Entra en el área de clientes', 'de': 'Zum Kundenbereich'},
    'home_title': {'it': 'Lavori marittimi subacquei a Loano', 'en': 'Underwater marine works in Loano, Italy', 'es': 'Trabajos marítimos subacuáticos en Loano, Italia', 'de': 'Maritime Unterwasserarbeiten in Loano, Italien'},
    'home_desc': {'it': 'Pulizia eliche e carene, sostituzione anodi, lavori edili e metalmeccanici subacquei, recuperi in mare. Porto di Loano (SV).',
                  'en': 'Propeller and hull cleaning, anode replacement, underwater civil and metal works, salvage at sea. Loano harbour, Italian Riviera.',
                  'es': 'Limpieza de hélices y cascos, sustitución de ánodos, obras civiles y metalmecánicas subacuáticas, recuperaciones en el mar. Puerto de Loano, Riviera italiana.',
                  'de': 'Propeller- und Rumpfreinigung, Anodenwechsel, Bau- und Metallarbeiten unter Wasser, Bergungen auf See. Hafen Loano, Italienische Riviera.'},

    # --- servizi
    'srv_page_h1': {'it': 'Cosa facciamo<br><span class="hl">sott\'acqua</span>', 'en': 'What we do<br><span class="hl">underwater</span>',
                    'es': 'Lo que hacemos<br><span class="hl">bajo el agua</span>', 'de': 'Was wir<br><span class="hl">unter Wasser tun</span>'},
    'srv_page_lead': {'it': 'Dieci servizi, un solo interlocutore: dalla pulizia dell\'elica alla costruzione di un porto.', 'en': 'Ten services, one contact: from cleaning a propeller to building a marina.',
                      'es': 'Diez servicios, un solo interlocutor: de la limpieza de una hélice a la construcción de un puerto.', 'de': 'Zehn Leistungen, ein Ansprechpartner: von der Propellerreinigung bis zum Hafenbau.'},
    'srv_desc': {'it': 'Pulizia eliche, carenaggi, sostituzione anodi, lavori edili e metalmeccanici subacquei, recuperi, alaggi, foto e video, reti anti medusa.',
                 'en': 'Propeller cleaning, hull cleaning, anode replacement, underwater civil and metal works, salvage, haul-outs, photo and video, anti-jellyfish nets.',
                 'es': 'Limpieza de hélices y cascos, sustitución de ánodos, obras civiles y metalmecánicas subacuáticas, recuperaciones, varadas, fotos y vídeos, redes antimedusas.',
                 'de': 'Propeller- und Rumpfreinigung, Anodenwechsel, Bau- und Metallarbeiten unter Wasser, Bergungen, Kranen, Fotos und Videos, Quallenschutznetze.'},
    # --- lavori
    'lav_page_lead': {'it': 'Porti turistici, scivoli di varo, condotte, ormeggi. In Liguria, in Francia e all\'estero.', 'en': 'Marinas, launching ramps, pipelines, moorings. In Liguria, in France and abroad.',
                      'es': 'Puertos deportivos, rampas de botadura, tuberías, amarres. En Liguria, en Francia y en el extranjero.', 'de': 'Yachthäfen, Slipanlagen, Leitungen, Liegeplätze. In Ligurien, Frankreich und im Ausland.'},
    'lav_desc': {'it': 'Porti di Loano, Varazze e Arenzano, scivolo di varo a Pietra Ligure, impianti Azimut, Antibes, condotte sommerse, Malta e Algeria.',
                 'en': 'Loano, Varazze and Arenzano marinas, launching ramp in Pietra Ligure, Azimut moorings, Antibes, subsea pipelines, Malta and Algeria.',
                 'es': 'Puertos de Loano, Varazze y Arenzano, rampa de botadura en Pietra Ligure, instalaciones Azimut, Antibes, tuberías sumergidas, Malta y Argelia.',
                 'de': 'Häfen Loano, Varazze und Arenzano, Slipanlage in Pietra Ligure, Azimut-Anlagen, Antibes, Unterwasserleitungen, Malta und Algerien.'},
    # --- chi siamo
    'chi_lead': {'it': 'La nostra ditta ha sede nel porto di Loano, da cui operiamo principalmente. Ci contraddistinguono serietà, professionalità e competenza.',
                 'en': 'Our company is based in Loano harbour, where most of our work starts. We stand for reliability, professionalism and skill.',
                 'es': 'Nuestra empresa tiene su sede en el puerto de Loano, desde donde operamos principalmente. Nos distinguen la seriedad, la profesionalidad y la competencia.',
                 'de': 'Unser Betrieb hat seinen Sitz im Hafen von Loano, von dem aus wir hauptsächlich arbeiten. Uns zeichnen Zuverlässigkeit, Professionalität und Kompetenz aus.'},
    'mezzi_eyebrow': {'it': 'Mezzi e attrezzatura', 'en': 'Vessels and equipment', 'es': 'Medios y equipamiento', 'de': 'Fahrzeuge und Ausrüstung'},
    'mezzi_h2': {'it': 'Attrezzatura propria,<br><span class="hl">adattata a ogni lavoro</span>', 'en': 'Our own equipment,<br><span class="hl">adapted to every job</span>',
                 'es': 'Equipamiento propio,<br><span class="hl">adaptado a cada trabajo</span>', 'de': 'Eigene Ausrüstung,<br><span class="hl">für jeden Auftrag angepasst</span>'},
    'mezzi_lead': {'it': 'Siamo attrezzati per i lavori in corso e pronti ad adeguare l\'attrezzatura alle esigenze di ogni cantiere.', 'en': 'We are equipped for ongoing works and ready to adapt our gear to the needs of each project.',
                   'es': 'Estamos equipados para los trabajos en curso y dispuestos a adaptar el equipamiento a las necesidades de cada obra.', 'de': 'Wir sind für laufende Arbeiten ausgerüstet und passen unsere Ausrüstung den Anforderungen jeder Baustelle an.'},
    'chi_desc': {'it': 'Francesco e Simone Cuvato: operatori tecnici subacquei. Mezzi e attrezzatura propria.',
                 'en': 'Francesco and Simone Cuvato: commercial divers. Our own vessels and equipment.',
                 'es': 'Francesco y Simone Cuvato: buzos profesionales. Medios y equipamiento propios.',
                 'de': 'Francesco und Simone Cuvato: Berufstaucher. Eigene Fahrzeuge und Ausrüstung.'},
    # --- contatti
    'con_h1': {'it': 'Parliamone<br><span class="hl">prima di immergerci</span>', 'en': 'Let\'s talk<br><span class="hl">before we dive in</span>',
               'es': 'Hablemos<br><span class="hl">antes de sumergirnos</span>', 'de': 'Sprechen wir,<br><span class="hl">bevor wir abtauchen</span>'},
    'con_lead': {'it': 'Scrivici su WhatsApp, chiamaci o mandaci una email. Base operativa al porto di Loano.', 'en': 'Message us on WhatsApp, call or email us. Operating base in Loano harbour.',
                 'es': 'Escríbenos por WhatsApp, llámanos o mándanos un email. Base operativa en el puerto de Loano.', 'de': 'Schreiben Sie uns auf WhatsApp, rufen Sie an oder senden Sie eine E-Mail. Einsatzbasis im Hafen Loano.'},
    'con_wa': {'it': 'Il modo più veloce per un preventivo: mandaci una foto e due righe.', 'en': 'The fastest way to get a quote: send us a photo and a few words.',
               'es': 'La forma más rápida de pedir presupuesto: mándanos una foto y dos líneas.', 'de': 'Der schnellste Weg zum Angebot: Schicken Sie uns ein Foto und ein paar Zeilen.'},
    'con_open': {'it': 'Apri la chat', 'en': 'Open the chat', 'es': 'Abrir el chat', 'de': 'Chat öffnen'},
    'con_where': {'it': 'Ci trovi al porto di Loano (SV).', 'en': 'You will find us in Loano harbour (SV), Italy.', 'es': 'Nos encontrarás en el puerto de Loano (SV), Italia.', 'de': 'Sie finden uns im Hafen von Loano (SV), Italien.'},
    'con_maps': {'it': 'Apri in Google Maps', 'en': 'Open in Google Maps', 'es': 'Abrir en Google Maps', 'de': 'In Google Maps öffnen'},
    'con_desc': {'it': 'Contatta Anfibiasub: Francesco Cuvato 347 011 9832, Simone Cuvato 347 038 7290, WhatsApp. Porto di Loano (SV).',
                 'en': 'Contact Anfibiasub: Francesco Cuvato +39 347 011 9832, Simone Cuvato +39 347 038 7290, WhatsApp. Loano harbour, Italy.',
                 'es': 'Contacta con Anfibiasub: Francesco Cuvato +39 347 011 9832, Simone Cuvato +39 347 038 7290, WhatsApp. Puerto de Loano, Italia.',
                 'de': 'Kontakt Anfibiasub: Francesco Cuvato +39 347 011 9832, Simone Cuvato +39 347 038 7290, WhatsApp. Hafen Loano, Italien.'},
    # --- privacy
    'priv_lead': {'it': 'Come trattiamo i dati di chi visita il sito e dei nostri clienti.', 'en': 'How we handle the data of website visitors and customers.',
                  'es': 'Cómo tratamos los datos de los visitantes de la web y de nuestros clientes.', 'de': 'Wie wir mit den Daten von Website-Besuchern und Kunden umgehen.'},
    'priv_desc': {'it': 'Informativa privacy e cookie del sito Anfibiasub.', 'en': 'Anfibiasub privacy and cookie policy.', 'es': 'Política de privacidad y cookies de Anfibiasub.', 'de': 'Datenschutz- und Cookie-Hinweise von Anfibiasub.'},
    'priv_upd': {'it': 'Aggiornata il', 'en': 'Last updated', 'es': 'Actualizada el', 'de': 'Stand:'},
    'priv_body': {
        'it': '''<h2>Titolare del trattamento</h2><p>Anfibiasub, P.I. 01326660097, Via Dufour 23, Carcare (SV). Email: termoclino@libero.it.</p>
<h2>Sito pubblico</h2><p>Le pagine del sito non usano moduli di contatto, cookie di profilazione o strumenti di statistica di terzi. Caratteri tipografici, icone e librerie sono ospitati sul nostro server. Gli unici collegamenti a servizi esterni sono quelli per il meteo e la mappa, descritti più sotto. Se ci scrivi via email, telefono o WhatsApp usiamo i tuoi dati solo per risponderti e preparare il preventivo.</p>
<h2>Gioco ABYSS</h2><p>Il gioco ABYSS non usa cookie. Per sapere quante persone giocano e fin dove arrivano, durante la partita il gioco invia al nostro server dati anonimi: durata, fase raggiunta, esito, lingua e tipo di dispositivo (computer o telefono). Non salviamo nome, email né indirizzo IP, e questi dati non permettono di risalire a chi ha giocato. Le risposte facoltative al sondaggio di fine partita (voto e commento) sono conservate allo stesso modo, in forma anonima.</p>
<h2>Area clienti</h2><p>Per i clienti che ricevono un accesso conserviamo: nome, email, telefono, i dati dell'imbarcazione inseriti dal cliente, gli interventi eseguiti con le relative foto e il registro anodi. Servono a gestire le manutenzioni e a inviare i promemoria richiesti. L'area usa un solo cookie tecnico, necessario per restare collegati. I dati sono conservati su server nell'Unione Europea e non vengono ceduti a terzi; le email di servizio sono inviate tramite un fornitore europeo.</p>
<p>Le foto di un intervento sono visibili solo al cliente, salvo che sia lui a condividerle con il link apposito.</p>
<h2>Servizi esterni</h2><p>I link a WhatsApp e Google Maps aprono servizi di terze parti, che applicano le proprie informative. Nella home e nella pagina Utilità il riquadro meteo chiede i dati direttamente a Open-Meteo (open-meteo.com, Svizzera); nella pagina Utilità la mappa carica le cartine da OpenStreetMap (openstreetmap.org). Per farlo il tuo browser si collega ai loro server, che ricevono il tuo indirizzo IP e i dati tecnici del browser, come per qualsiasi sito visitato. Non installano cookie e non usano questi dati per profilarti. Le richieste meteo contengono solo le coordinate fisse del porto di Loano. La posizione che segni sulla mappa resta nel tuo browser e non viene salvata né inviata a noi o a terzi.</p>
<h2>I tuoi diritti</h2><p>Puoi chiedere in ogni momento accesso, rettifica o cancellazione dei tuoi dati scrivendo all'indirizzo email indicato sopra. Puoi anche presentare reclamo al Garante per la protezione dei dati personali.</p>''',
        'en': '''<h2>Data controller</h2><p>Anfibiasub, VAT IT01326660097, Via Dufour 23, Carcare (SV), Italy. Email: termoclino@libero.it.</p>
<h2>Public website</h2><p>The website pages use no contact forms, tracking cookies or third-party analytics. Fonts, icons and libraries are hosted on our own server. The only connections to external services are those for the weather and the map, described below. If you contact us by email, phone or WhatsApp, we use your details only to reply and prepare a quote.</p>
<h2>ABYSS game</h2><p>The ABYSS game uses no cookies. To know how many people play and how far they get, during a game it sends anonymous data to our server: duration, stage reached, outcome, language and device type (computer or phone). We do not store names, email or IP addresses, and this data cannot be traced back to the player. Optional answers to the end-of-game survey (rating and comment) are kept in the same anonymous way.</p>
<h2>Customer area</h2><p>For customers who receive an account we store: name, email, phone, the boat details entered by the customer, the jobs carried out with their photos and the anode log. We use them to manage maintenance and send the reminders requested. The area uses a single technical cookie, needed to stay signed in. Data is stored on servers in the European Union and is not shared with third parties; service emails are sent through a European provider.</p>
<p>Job photos are visible only to the customer, unless the customer shares them through the dedicated link.</p>
<h2>Third-party services</h2><p>Links to WhatsApp and Google Maps open third-party services with their own privacy policies. On the home page and the Tools page the weather box requests data directly from Open-Meteo (open-meteo.com, Switzerland); on the Tools page the map loads its tiles from OpenStreetMap (openstreetmap.org). To do so your browser connects to their servers, which receive your IP address and technical browser data, as with any website you visit. They set no cookies and do not use this data to profile you. Weather requests contain only the fixed coordinates of Loano harbour. The position you mark on the map stays in your browser and is never saved or sent to us or anyone else.</p>
<h2>Your rights</h2><p>You can ask at any time to access, correct or delete your data by writing to the email address above. You may also lodge a complaint with the Italian Data Protection Authority (Garante).</p>''',
        'es': '''<h2>Responsable del tratamiento</h2><p>Anfibiasub, IVA IT01326660097, Via Dufour 23, Carcare (SV), Italia. Email: termoclino@libero.it.</p>
<h2>Web pública</h2><p>Las páginas de la web no usan formularios de contacto, cookies de seguimiento ni herramientas de estadística de terceros. Las fuentes tipográficas, los iconos y las librerías están alojados en nuestro servidor. Las únicas conexiones con servicios externos son las del tiempo y el mapa, descritas más abajo. Si nos escribes por email, teléfono o WhatsApp, usamos tus datos solo para responderte y preparar el presupuesto.</p>
<h2>Juego ABYSS</h2><p>El juego ABYSS no usa cookies. Para saber cuántas personas juegan y hasta dónde llegan, durante la partida el juego envía a nuestro servidor datos anónimos: duración, fase alcanzada, resultado, idioma y tipo de dispositivo (ordenador o teléfono). No guardamos nombre, email ni dirección IP, y estos datos no permiten saber quién ha jugado. Las respuestas opcionales a la encuesta de fin de partida (valoración y comentario) se conservan del mismo modo, de forma anónima.</p>
<h2>Área de clientes</h2><p>Para los clientes que reciben un acceso conservamos: nombre, email, teléfono, los datos de la embarcación introducidos por el cliente, las intervenciones realizadas con sus fotos y el registro de ánodos. Sirven para gestionar el mantenimiento y enviar los recordatorios solicitados. El área usa una sola cookie técnica, necesaria para mantener la sesión. Los datos se guardan en servidores de la Unión Europea y no se ceden a terceros; los emails de servicio se envían a través de un proveedor europeo.</p>
<p>Las fotos de una intervención solo son visibles para el cliente, salvo que él mismo las comparta con el enlace correspondiente.</p>
<h2>Servicios externos</h2><p>Los enlaces a WhatsApp y Google Maps abren servicios de terceros con sus propias políticas de privacidad. En la página de inicio y en Utilidades el recuadro del tiempo pide los datos directamente a Open-Meteo (open-meteo.com, Suiza); en Utilidades el mapa carga sus cartografías desde OpenStreetMap (openstreetmap.org). Para ello tu navegador se conecta a sus servidores, que reciben tu dirección IP y los datos técnicos del navegador, como con cualquier web que visitas. No instalan cookies ni usan estos datos para crear perfiles. Las consultas del tiempo solo contienen las coordenadas fijas del puerto de Loano. La posición que marcas en el mapa permanece en tu navegador y nunca se guarda ni se envía a nosotros ni a terceros.</p>
<h2>Tus derechos</h2><p>Puedes solicitar en cualquier momento el acceso, la rectificación o la supresión de tus datos escribiendo a la dirección de email indicada. También puedes presentar una reclamación ante la autoridad italiana de protección de datos (Garante).</p>''',
        'de': '''<h2>Verantwortlicher</h2><p>Anfibiasub, USt-IdNr. IT01326660097, Via Dufour 23, Carcare (SV), Italien. E-Mail: termoclino@libero.it.</p>
<h2>Öffentliche Website</h2><p>Die Seiten der Website verwenden keine Kontaktformulare, keine Tracking-Cookies und keine Statistik-Tools von Drittanbietern. Schriften, Symbole und Bibliotheken liegen auf unserem eigenen Server. Die einzigen Verbindungen zu externen Diensten sind die für Wetter und Karte, die weiter unten beschrieben werden. Wenn Sie uns per E-Mail, Telefon oder WhatsApp kontaktieren, verwenden wir Ihre Daten nur, um zu antworten und ein Angebot zu erstellen.</p>
<h2>Spiel ABYSS</h2><p>Das Spiel ABYSS verwendet keine Cookies. Um zu wissen, wie viele Menschen spielen und wie weit sie kommen, sendet das Spiel während einer Partie anonyme Daten an unseren Server: Dauer, erreichte Phase, Ergebnis, Sprache und Gerätetyp (Computer oder Telefon). Wir speichern weder Namen noch E-Mail-Adresse noch IP-Adresse, und diese Daten lassen keinen Rückschluss auf die spielende Person zu. Freiwillige Antworten auf die Umfrage am Spielende (Bewertung und Kommentar) werden auf die gleiche Weise anonym gespeichert.</p>
<h2>Kundenbereich</h2><p>Für Kunden mit Zugang speichern wir: Name, E-Mail, Telefon, die vom Kunden eingegebenen Bootsdaten, die durchgeführten Einsätze mit Fotos und das Anodenprotokoll. Sie dienen der Wartungsverwaltung und dem Versand der gewünschten Erinnerungen. Der Bereich verwendet nur ein technisches Cookie, das für die Anmeldung nötig ist. Die Daten werden auf Servern in der Europäischen Union gespeichert und nicht an Dritte weitergegeben; Service-E-Mails werden über einen europäischen Anbieter versendet.</p>
<p>Einsatzfotos sind nur für den Kunden sichtbar, es sei denn, er teilt sie selbst über den entsprechenden Link.</p>
<h2>Externe Dienste</h2><p>Links zu WhatsApp und Google Maps öffnen Dienste Dritter mit eigenen Datenschutzhinweisen. Auf der Startseite und der Seite Nützliches ruft das Wetterfeld die Daten direkt bei Open-Meteo ab (open-meteo.com, Schweiz); auf der Seite Nützliches lädt die Karte ihre Kacheln von OpenStreetMap (openstreetmap.org). Dazu verbindet sich Ihr Browser mit deren Servern, die Ihre IP-Adresse und technische Browserdaten erhalten, wie bei jeder besuchten Website. Sie setzen keine Cookies und nutzen diese Daten nicht zur Profilbildung. Die Wetterabfragen enthalten nur die festen Koordinaten des Hafens von Loano. Die Position, die Sie auf der Karte markieren, bleibt in Ihrem Browser und wird weder gespeichert noch an uns oder Dritte gesendet.</p>
<h2>Ihre Rechte</h2><p>Sie können jederzeit Auskunft, Berichtigung oder Löschung Ihrer Daten verlangen, indem Sie an die oben genannte E-Mail-Adresse schreiben. Sie können außerdem Beschwerde bei der italienischen Datenschutzbehörde (Garante) einlegen.</p>'''},

    # --- utilità
    'uti_h1': {'it': 'Strumenti utili<br><span class="hl">per chi va per mare</span>', 'en': 'Handy tools<br><span class="hl">for life at sea</span>',
               'es': 'Herramientas útiles<br><span class="hl">para quien sale al mar</span>', 'de': 'Nützliche Hilfsmittel<br><span class="hl">für alle auf See</span>'},
    'uti_lead': {'it': 'Meteo e webcam di Loano, un marcatore GPS da condividere e le tabelle di vento, cime, cavi e catene che usiamo anche noi in cantiere.',
                 'en': 'Loano weather and webcam, a shareable GPS marker, and the wind, rope, wire and chain tables we use on our own jobs.',
                 'es': 'Meteo y webcam de Loano, un marcador GPS para compartir y las tablas de viento, cabos, cables y cadenas que usamos también en nuestras obras.',
                 'de': 'Wetter und Webcam Loano, eine teilbare GPS-Markierung und die Tabellen zu Wind, Tauwerk, Seilen und Ketten, die wir selbst auf der Baustelle nutzen.'},
    'uti_desc': {'it': 'Meteomare e webcam di Loano, marcatore GPS da condividere, scala Beaufort e carichi di rottura di cime, cavi e catene.',
                 'en': 'Loano marine weather and webcam, shareable GPS marker, Beaufort scale and breaking loads of ropes, wire and chains.',
                 'es': 'Meteo marina y webcam de Loano, marcador GPS para compartir, escala Beaufort y cargas de rotura de cabos, cables y cadenas.',
                 'de': 'Seewetter und Webcam Loano, teilbare GPS-Markierung, Beaufortskala und Bruchlasten von Tauwerk, Seilen und Ketten.'},
    'meteo_loading': {'it': 'Caricamento dati meteo…', 'en': 'Loading weather data…', 'es': 'Cargando datos meteorológicos…', 'de': 'Wetterdaten werden geladen…'},
    'meteo_note': {'it': 'Dati Open-Meteo per il tratto di mare davanti a Loano. Sono previsioni: prima di uscire controlla sempre il bollettino ufficiale.',
                   'en': 'Open-Meteo data for the sea off Loano. These are forecasts: always check the official bulletin before going out.',
                   'es': 'Datos de Open-Meteo para el mar frente a Loano. Son previsiones: antes de salir consulta siempre el boletín oficial.',
                   'de': 'Open-Meteo-Daten für das Meer vor Loano. Es sind Vorhersagen: Prüfen Sie vor dem Auslaufen immer den offiziellen Seewetterbericht.'},
    'cam_title': {'it': 'Guarda il porto e il mare di Loano in diretta', 'en': 'See Loano harbour and sea live', 'es': 'Mira el puerto y el mar de Loano en directo', 'de': 'Hafen und Meer von Loano live sehen'},
    'cam_sub': {'it': 'Si apre la pagina delle webcam di Loano', 'en': 'Opens the Loano webcams page', 'es': 'Se abre la página de las webcams de Loano', 'de': 'Öffnet die Webcam-Seite von Loano'},
    'gps_lead': {'it': 'Tocca la mappa per mettere il marcatore, oppure usa la posizione del telefono. Poi condividi il punto. Non salviamo nulla: la posizione resta sul tuo dispositivo.',
                 'en': 'Tap the map to drop the marker, or use your phone location. Then share the point. Nothing is saved: the position stays on your device.',
                 'es': 'Toca el mapa para colocar el marcador o usa la ubicación del teléfono. Después comparte el punto. No guardamos nada: la posición se queda en tu dispositivo.',
                 'de': 'Tippen Sie auf die Karte, um die Markierung zu setzen, oder nutzen Sie den Standort Ihres Telefons. Dann teilen Sie den Punkt. Wir speichern nichts: Die Position bleibt auf Ihrem Gerät.'},
    'gps_none': {'it': 'Nessun punto selezionato', 'en': 'No point selected', 'es': 'Ningún punto seleccionado', 'de': 'Kein Punkt ausgewählt'},
    'gps_locate': {'it': 'Usa la mia posizione', 'en': 'Use my location', 'es': 'Usar mi ubicación', 'de': 'Meinen Standort verwenden'},
    'gps_wa': {'it': 'Condividi su WhatsApp', 'en': 'Share on WhatsApp', 'es': 'Compartir por WhatsApp', 'de': 'Per WhatsApp teilen'},
    'gps_copy': {'it': 'Copia coordinate', 'en': 'Copy coordinates', 'es': 'Copiar coordenadas', 'de': 'Koordinaten kopieren'},
    'copied': {'it': 'Copiato', 'en': 'Copied', 'es': 'Copiado', 'de': 'Kopiert'},
    'tbl_note': {'it': 'Valori indicativi, riportati dalle tabelle tecniche di riferimento. Per un carico reale chiedi sempre i dati certificati del produttore.',
                 'en': 'Indicative values taken from reference technical tables. For a real load always ask for the manufacturer\'s certified data.',
                 'es': 'Valores orientativos tomados de las tablas técnicas de referencia. Para una carga real pide siempre los datos certificados del fabricante.',
                 'de': 'Richtwerte aus technischen Referenztabellen. Für eine tatsächliche Last immer die zertifizierten Herstellerangaben anfordern.'},
    'bf_cols': {'it': ['Forza', 'Denominazione', 'km/h', 'Nodi', 'Stato del mare'], 'en': ['Force', 'Description', 'km/h', 'Knots', 'Sea state'],
                'es': ['Fuerza', 'Denominación', 'km/h', 'Nudos', 'Estado del mar'], 'de': ['Stärke', 'Bezeichnung', 'km/h', 'Knoten', 'Seegang']},
    'bf_cap': {'it': 'Scala Beaufort: forza del vento ed effetto sul mare', 'en': 'Beaufort scale: wind force and effect on the sea',
               'es': 'Escala Beaufort: fuerza del viento y efecto en el mar', 'de': 'Beaufortskala: Windstärke und Auswirkung auf die See'},
    'rope_cols': {'it': ['Canapa', 'Polipr.'], 'en': ['Hemp', 'Polyprop.'], 'es': ['Cáñamo', 'Polipr.'], 'de': ['Hanf', 'Polyprop.']},
    'rope_cap': {'it': 'Cime piane a tre legnoli o trecciate a otto legnoli. Colonne 2-5: carico di rottura (kg). Colonne 6-9: carico massimo di lavoro (kg).',
                 'en': 'Three-strand laid or eight-strand plaited ropes. Columns 2-5: breaking load (kg). Columns 6-9: maximum working load (kg).',
                 'es': 'Cabos colchados de tres cordones o trenzados de ocho cordones. Columnas 2-5: carga de rotura (kg). Columnas 6-9: carga máxima de trabajo (kg).',
                 'de': 'Dreischäftig geschlagenes oder achtschäftig geflochtenes Tauwerk. Spalten 2-5: Bruchlast (kg). Spalten 6-9: maximale Arbeitslast (kg).'},
    'wire_cols': {'it': ['Peso g/m', 'Carico di rottura kg'], 'en': ['Weight g/m', 'Breaking load kg'], 'es': ['Peso g/m', 'Carga de rotura kg'], 'de': ['Gewicht g/m', 'Bruchlast kg']},
    'wire_cap': {'it': 'Cavi in acciaio a sei legnoli', 'en': 'Six-strand steel wire rope', 'es': 'Cables de acero de seis cordones', 'de': 'Sechslitzige Stahlseile'},
    'chain_cols': {'it': ['Calibro mm', 'Maglia mm', 'Peso kg/m', 'Rottura t', 'Sicurezza t'], 'en': ['Size mm', 'Link mm', 'Weight kg/m', 'Breaking t', 'Safe load t'],
                   'es': ['Calibre mm', 'Eslabón mm', 'Peso kg/m', 'Rotura t', 'Seguridad t'], 'de': ['Nenngröße mm', 'Glied mm', 'Gewicht kg/m', 'Bruch t', 'Sicher t']},
    'chain_cap': {'it': 'Catene di ferro con traversino: dimensioni medie delle maglie comuni, peso e carichi', 'en': 'Stud-link iron chain: average common-link size, weight and loads',
                  'es': 'Cadenas de hierro con contrete: dimensiones medias de los eslabones, peso y cargas', 'de': 'Stegketten aus Eisen: mittlere Gliedmaße, Gewicht und Lasten'},
    'anchor_join': {'it': 'Maniglia d\'unione', 'en': 'Joining shackle', 'es': 'Grillete de unión', 'de': 'Verbindungsschäkel'},
    'anchor_cap': {'it': 'Catene a maglie con traversino per ancore. CP = carico di prova, CR = carico di rottura (kg), per grado 1-1b, 2 e 3. Ultime due colonne: peso minimo di una lunghezza di catena di 27,5 m (kg). Il grado 3 non è previsto sotto i 40 mm.',
                   'en': 'Stud-link anchor chain. CP = proof load, CR = breaking load (kg), for grade 1-1b, 2 and 3. Last two columns: minimum weight of one 27.5 m length of chain (kg). Grade 3 is not available below 40 mm.',
                   'es': 'Cadenas de ancla con contrete. CP = carga de prueba, CR = carga de rotura (kg), para grado 1-1b, 2 y 3. Últimas dos columnas: peso mínimo de un tramo de cadena de 27,5 m (kg). El grado 3 no existe por debajo de 40 mm.',
                   'de': 'Stegketten für Anker. CP = Prüflast, CR = Bruchlast (kg), für Güte 1-1b, 2 und 3. Letzte zwei Spalten: Mindestgewicht einer Kettenlänge von 27,5 m (kg). Güte 3 gibt es nicht unter 40 mm.'},
    # pulsanti rapidi in home (solo cellulare)
    'q_area': {'it': ('Accedi', 'Area clienti'), 'en': ('Log in', 'Customer area'), 'es': ('Acceder', 'Área de clientes'), 'de': ('Anmelden', 'Kundenbereich')},
    'q_help': {'it': ('Assistenza', 'Chat WhatsApp'), 'en': ('Support', 'WhatsApp chat'), 'es': ('Asistencia', 'Chat de WhatsApp'), 'de': ('Hilfe', 'WhatsApp-Chat')},
    'q_meteo': {'it': ('Meteo', 'Vento e mare a Loano'), 'en': ('Weather', 'Wind and sea in Loano'), 'es': ('Tiempo', 'Viento y mar en Loano'), 'de': ('Wetter', 'Wind und See in Loano')},
    'q_util': {'it': ('Utilità', 'Meteo, webcam, tabelle'), 'en': ('Tools', 'Weather, webcam, tables'), 'es': ('Utilidades', 'Meteo, webcam, tablas'), 'de': ('Nützliches', 'Wetter, Webcam, Tabellen')},
    'q_gps': {'it': ('Posizione', 'Marcatore GPS'), 'en': ('Position', 'GPS marker'), 'es': ('Posición', 'Marcador GPS'), 'de': ('Position', 'GPS-Markierung')},
}
