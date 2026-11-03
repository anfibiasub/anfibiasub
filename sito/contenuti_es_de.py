# Testi in spagnolo (es) e tedesco (de) dei contenuti del sito.
# Struttura: stesso id usato in contenuti.py. Per cambiare un testo modificalo qui e rilancia  python3 sito/build.py

UI_ES_DE = {
    'es': {
        'nav': [('home', 'Inicio'), ('servizi', 'Servicios'), ('lavori', 'Trabajos realizados'), ('utilita', 'Utilidades'), ('chi', 'Quiénes somos'), ('contatti', 'Contacto')],
        'area': 'Área de clientes', 'quote': 'Pedir presupuesto', 'skip': 'Ir al contenido',
        'menu_open': 'Abrir el menú', 'tagline': 'TRABAJOS MARÍTIMOS SUBACUÁTICOS', 'more': 'Ver más',
        'all_services': 'Todos los servicios', 'all_works': 'Todos los trabajos', 'call_now': 'LLÁMANOS',
        'foot_about': 'Trabajos marítimos subacuáticos.<br>Base operativa: puerto de Loano (SV), Italia.',
        'office': 'Oficina', 'site': 'WEB', 'privacy': 'Privacidad y cookies', 'no_cookie': 'Sin cookies de seguimiento',
        'wa': 'Escríbenos por WhatsApp', 'need': '¿Necesitas una intervención?', 'need_lead': 'Escríbenos por WhatsApp: respondemos en el día.',
        'lang_label': 'Idioma',
    },
    'de': {
        'nav': [('home', 'Start'), ('servizi', 'Leistungen'), ('lavori', 'Referenzen'), ('utilita', 'Nützliches'), ('chi', 'Über uns'), ('contatti', 'Kontakt')],
        'area': 'Kundenbereich', 'quote': 'Angebot anfordern', 'skip': 'Zum Inhalt',
        'menu_open': 'Menü öffnen', 'tagline': 'MARITIME UNTERWASSERARBEITEN', 'more': 'Mehr erfahren',
        'all_services': 'Alle Leistungen', 'all_works': 'Alle Referenzen', 'call_now': 'JETZT ANRUFEN',
        'foot_about': 'Maritime Unterwasserarbeiten.<br>Einsatzbasis: Hafen von Loano (SV), Italien.',
        'office': 'Büro', 'site': 'WEBSITE', 'privacy': 'Datenschutz und Cookies', 'no_cookie': 'Keine Tracking-Cookies',
        'wa': 'Schreiben Sie uns auf WhatsApp', 'need': 'Brauchen Sie einen Einsatz?', 'need_lead': 'Schreiben Sie uns auf WhatsApp: Wir antworten noch am selben Tag.',
        'lang_label': 'Sprache',
    },
}

SERVIZI_ES_DE = {
    'pulizia-eliche': dict(
        es=dict(t='Limpieza de hélices', short='Desincrustamos hélices de cualquier tamaño en el agua, sin varar el barco ni el buque.',
                body=['Tras años de pruebas hemos desarrollado un método para limpiar y desincrustar hélices de cualquier tamaño directamente en el agua. Sin varada y sin astillero: los costes se reducen a la mitad.',
                      'Las algas y los pequeños moluscos en la obra viva frenan el barco: se pierde velocidad, aumenta el consumo y el motor trabaja forzado. Como la prevención en el dentista, el mantenimiento regular cuesta poco y se amortiza enseguida con el combustible ahorrado.',
                      'Nuestro sistema reduce el esfuerzo del buzo y no contamina el agua del puerto.']),
        de=dict(t='Propellerreinigung', short='Wir entfernen Bewuchs an Propellern jeder Größe im Wasser, ohne Boot oder Schiff aus dem Wasser zu holen.',
                body=['Nach jahrelanger Entwicklung reinigen wir Propeller jeder Größe direkt im Wasser. Kein Kranen, keine Werft: Die Kosten halbieren sich.',
                      'Algen und kleine Muscheln am Unterwasserschiff bremsen das Boot: Es verliert an Geschwindigkeit, verbraucht mehr Kraftstoff und der Motor wird stärker belastet. Wie die Vorsorge beim Zahnarzt kostet regelmäßige Pflege wenig und macht sich durch den gesparten Kraftstoff sofort bezahlt.',
                      'Unser Verfahren entlastet den Taucher und verschmutzt das Hafenwasser nicht.'])),
    'carenaggi': dict(
        es=dict(t='Limpieza de cascos', short='Esponjas suaves para veleros, más abrasivas para barcos a motor, máquinas específicas para buques.',
                body=['Limpiamos el casco en el agua eligiendo la herramienta según la embarcación: esponjas adecuadas para veleros y esponjas más abrasivas para barcos a motor.',
                      'Para los buques usamos máquinas específicas de asiento variable que trabajan grandes superficies en poco tiempo.']),
        de=dict(t='Rumpfreinigung', short='Weiche Pads für Segelboote, stärkere für Motorboote, Spezialmaschinen für Schiffe.',
                body=['Wir reinigen den Rumpf im Wasser und wählen das Werkzeug passend zum Boot: geeignete Pads für Segelboote, stärker abrasive für Motorboote.',
                      'Bei Schiffen setzen wir spezielle Maschinen mit verstellbarer Neigung ein, die große Flächen in kurzer Zeit bearbeiten.'])),
    'anodi': dict(
        es=dict(t='Sustitución de ánodos', short='Control y cambio de zincs y ánodos en ejes, colas, flaps y tuberías sumergidas.',
                body=['Los ánodos de sacrificio protegen hélices, ejes y piezas metálicas de la corrosión galvánica. Cuando se consumen, es el metal del barco el que se corroe.',
                      'Los revisamos, fotografiamos y sustituimos en el agua. En el área de clientes encuentras la fecha de montaje y un recordatorio para la siguiente revisión.']),
        de=dict(t='Anodenwechsel', short='Kontrolle und Austausch von Zink- und Opferanoden an Wellen, Z-Antrieben, Trimmklappen und Unterwasserleitungen.',
                body=['Opferanoden schützen Propeller, Wellen und Metallteile vor galvanischer Korrosion. Sind sie verbraucht, korrodiert das Metall des Bootes.',
                      'Wir prüfen, fotografieren und tauschen sie im Wasser. Im Kundenbereich finden Sie das Einbaudatum und eine Erinnerung für die nächste Kontrolle.'])),
    'edili': dict(
        es=dict(t='Obras civiles', short='Nivelaciones, colocación de bloques prefabricados, hormigonado, sacos y demoliciones.',
                body=['Hemos construido las partes sumergidas de tres grandes puertos deportivos. En el fondo preparamos nivelaciones de grava sobre las bases colocadas por la grúa.',
                      'Encima colocamos bloques prefabricados de hormigón armado de 3 x 2 metros con precisión milimétrica: desde el fondo guiamos al gruista con el teléfono subacuático, porque él no ve el bloque sumergido.',
                      'Realizamos hormigonados bajo el agua, tanto en puertos en construcción como en muelles erosionados por el mar, ensacados y demoliciones con martillos neumáticos o explosivos.']),
        de=dict(t='Bauarbeiten', short='Planieren, Verlegen von Fertigteilblöcken, Unterwasserbetonage, Sandsäcke und Abbrucharbeiten.',
                body=['Wir haben die Unterwasserbereiche von drei großen Yachthäfen gebaut. Am Grund planieren wir Schotterbetten auf den vom Kran gesetzten Fundamenten.',
                      'Darauf verlegen wir Stahlbeton-Fertigteilblöcke von 3 x 2 Metern millimetergenau: Vom Grund aus leiten wir den Kranführer per Unterwassertelefon, denn er sieht den Block unter Wasser nicht.',
                      'Wir betonieren unter Wasser, in neuen Häfen ebenso wie an vom Meer ausgewaschenen Molen, setzen Sandsäcke und führen Abbrucharbeiten mit Presslufthämmern oder Sprengstoff aus.'])),
    'metalmeccanica': dict(
        es=dict(t='Metalmecánica', short='Cortes y soldaduras bajo el agua, carpintería metálica, tuberías, cierre de vías de agua.',
                body=['Realizamos cortes y soldaduras subacuáticas de todo tipo, con la experiencia adquirida en la construcción de rampas de botadura y cunas.',
                      'Estamos especializados en el corte subacuático de metales y en la carpintería metálica. Construimos redes de saneamiento y tuberías con colocación y embridado.',
                      'También nos ocupamos del mantenimiento: fijación de ánodos y zincs, cierre de vías de agua, colocación de manguitos.']),
        de=dict(t='Metallbau', short='Schneiden und Schweißen unter Wasser, Stahlbau, Rohrleitungen, Abdichten von Lecks.',
                body=['Wir führen Unterwasser-Schneid- und Schweißarbeiten aller Art aus, mit der Erfahrung aus dem Bau von Slipanlagen und Lagerböcken.',
                      'Wir sind auf das Unterwasserschneiden von Metall und den Stahlbau spezialisiert. Wir bauen Abwasser- und Rohrleitungen einschließlich Verlegung und Flanschen.',
                      'Auch die Wartung übernehmen wir: Montage von Anoden und Zinkanoden, Abdichten von Lecks, Setzen von Reparaturmuffen.'])),
    'recuperi': dict(
        es=dict(t='Recuperaciones', short='Objetos perdidos en el mar: globos de elevación para piezas pequeñas, pontón para las grandes.',
                body=['Recuperamos objetos perdidos en el mar. Para los de tamaño reducido usamos globos de elevación tipo paracaídas; para los más pesados intervenimos con el pontón.']),
        de=dict(t='Bergungen', short='Im Meer verlorene Gegenstände: Hebesäcke für kleine Teile, Ponton für große.',
                body=['Wir bergen im Meer verlorene Gegenstände. Für kleinere Teile verwenden wir Fallschirm-Hebesäcke, für schwerere arbeiten wir vom Ponton aus.'])),
    'alaggi': dict(
        es=dict(t='Varadas y botaduras', short='Varada y botadura de embarcaciones, también de gran tamaño, con travel lift u otros medios.',
                body=['Realizamos varadas y botaduras de embarcaciones de gran tamaño con travel lift u otros medios.',
                      'En el astillero W. Service del puerto de Savona trabajamos de forma continua: el buzo en el agua controla la posición de las cinchas bajo el casco.']),
        de=dict(t='Kranen und Einwassern', short='Aus- und Einwassern auch großer Boote mit Travellift oder anderen Mitteln.',
                body=['Wir holen große Boote mit Travellift oder anderen Mitteln aus dem Wasser und setzen sie wieder ein.',
                      'In der Werft W. Service im Hafen von Savona arbeiten wir regelmäßig: Der Taucher im Wasser kontrolliert die Lage der Gurte unter dem Rumpf.'])),
    'foto-video': dict(
        es=dict(t='Fotos y vídeos', short='Grabaciones digitales para armadores y peritos, inspección de tuberías con ROV filoguiado.',
                body=['Realizamos fotos y vídeos subacuáticos en digital, en el formato que prefieras, y te los enviamos por email.',
                      'Con un pequeño ROV filoguiado inspeccionamos el interior y el exterior de las tuberías sumergidas, incluso a gran profundidad.']),
        de=dict(t='Fotos und Videos', short='Digitale Aufnahmen für Eigner und Gutachter, Rohrinspektionen mit kabelgeführtem ROV.',
                body=['Wir erstellen digitale Unterwasserfotos und -videos im gewünschten Format und senden sie Ihnen per E-Mail.',
                      'Mit einem kleinen kabelgeführten ROV inspizieren wir Unterwasserleitungen innen und außen, auch in großer Tiefe.'])),
    'reti-anti-medusa': dict(
        es=dict(t='Redes antimedusas', short='Sistema Medusa Protect para proteger las zonas de baño de medusas y residuos flotantes.',
                body=['Instalamos el sistema Medusa Protect: una red de micromalla que mantiene alejadas las medusas y filtra en superficie espumas, aceites y residuos flotantes.',
                      'Su sistema de vientos la mantiene vertical incluso con corrientes y olas fuertes, reduciendo las cargas y alargando su vida útil. Está diseñada para que ningún bañista pueda quedar enganchado.',
                      'Es fácil de montar, desmontar, reparar y almacenar, y ayuda a obtener la Bandera Azul.']),
        de=dict(t='Quallenschutznetze', short='Das System Medusa Protect schützt Badezonen vor Quallen und Treibgut.',
                body=['Wir installieren das System Medusa Protect: ein feinmaschiges Netz, das Quallen fernhält und Schaum, Öl und Treibgut an der Oberfläche zurückhält.',
                      'Ein Abspannsystem hält das Netz auch bei starker Strömung und Welle senkrecht, verringert die Belastung und verlängert die Lebensdauer. Es ist so konstruiert, dass sich kein Badegast darin verfangen kann.',
                      'Es lässt sich leicht montieren, abbauen, reparieren und lagern und hilft bei der Vergabe der Blauen Flagge.'])),
    'progettazioni': dict(
        es=dict(t='Proyectos', short='Proyectos de obras marítimas con ingenieros y aparejadores especializados.',
                body=['Para el diseño de obras marítimas y subacuáticas colaboramos con ingenieros y aparejadores independientes especializados en el sector, a los que conocemos tras años de trabajos conjuntos.']),
        de=dict(t='Planung', short='Planung maritimer Bauwerke mit spezialisierten Ingenieuren und Vermessern.',
                body=['Für die Planung maritimer und Unterwasser-Bauwerke arbeiten wir mit freiberuflichen, auf den Bereich spezialisierten Ingenieuren und Vermessern zusammen, die wir aus jahrelangen gemeinsamen Projekten kennen.'])),
}

LAVORI_ES_DE = {
    'porto-loano': dict(es=dict(luogo='Loano (SV)', t='Partes sumergidas del puerto', toc='Puerto de Loano', d='Nivelaciones, colocación de bloques prefabricados, cadenas madre con sus amarres, demolición de hierro y hormigón sumergidos.'),
                        de=dict(luogo='Loano (SV)', t='Unterwasserbereiche des Hafens', toc='Hafen Loano', d='Planieren, Verlegen von Fertigteilblöcken, Grundketten mit Festmachern, Abbruch von Stahl und Beton unter Wasser.')),
    'pietra-ligure': dict(es=dict(luogo='Pietra Ligure (SV)', t='Rampa de botadura, astilleros Rodriquez', toc='Rampa de botadura, Pietra Ligure', d='Rampa subacuática para la botadura de transbordadores destinados a la Península Ibérica, montada y soldada bajo el agua.'),
                          de=dict(luogo='Pietra Ligure (SV)', t='Slipanlage, Werft Rodriquez', toc='Slipanlage, Pietra Ligure', d='Unterwasser-Slipanlage für den Stapellauf von Fähren für die Iberische Halbinsel, unter Wasser montiert und geschweißt.')),
    'porto-varazze': dict(es=dict(luogo='Varazze (SV)', t='Partes sumergidas del puerto', toc='Puerto de Varazze', d='Nivelación del fondo, colocación de bloques prefabricados de hormigón, demolición de hierro y hormigón sumergidos.'),
                          de=dict(luogo='Varazze (SV)', t='Unterwasserbereiche des Hafens', toc='Hafen Varazze', d='Planieren des Grundes, Verlegen von Beton-Fertigteilblöcken, Abbruch von Stahl und Beton unter Wasser.')),
    'porto-arenzano': dict(es=dict(luogo='Arenzano (GE)', t='Partes sumergidas del puerto', toc='Puerto de Arenzano', d='Desde la nivelación hasta la colocación de bloques prefabricados y la demolición de estructuras sumergidas.'),
                           de=dict(luogo='Arenzano (GE)', t='Unterwasserbereiche des Hafens', toc='Hafen Arenzano', d='Vom Planieren über das Verlegen von Fertigteilblöcken bis zum Abbruch von Unterwasserbauwerken.')),
    'azimut': dict(es=dict(luogo='Astilleros Azimut', t='Traslado de la instalación sumergida', toc='Astilleros Azimut', d='Desmontaje y nuevo montaje en otro emplazamiento de amarres y pantalanes flotantes.'),
                   de=dict(luogo='Werften Azimut', t='Verlegung der Unterwasseranlage', toc='Werften Azimut', d='Abbau und Wiederaufbau von Liegeplätzen und Schwimmstegen an einem neuen Standort.')),
    'antibes': dict(es=dict(luogo='Antibes (Francia)', t='Solárium y redes antimedusas', toc='Antibes', d='Construcción de un solárium e instalación de redes de protección para la zona de baño.'),
                    de=dict(luogo='Antibes (Frankreich)', t='Sonnendeck und Quallenschutznetze', toc='Antibes', d='Bau eines Sonnendecks und Installation von Schutznetzen für den Badebereich.')),
    'reti-anti-medusa': dict(es=dict(luogo='Liguria y Costa Azul', t='Redes antimedusas', toc='Redes antimedusas', d='Instalación del sistema Medusa Protect para proteger las playas.'),
                             de=dict(luogo='Ligurien und Côte d’Azur', t='Quallenschutznetze', toc='Quallenschutznetze', d='Installation des Systems Medusa Protect zum Schutz der Strände.')),
    'tubazioni-sommerse': dict(es=dict(luogo='Liguria', t='Colocación y reparación de tuberías sumergidas', toc='Tuberías sumergidas', d='Inspecciones con ROV y cámara, reparaciones con manguitos y abrazaderas, sustitución de zincs y ánodos en las tuberías.'),
                               de=dict(luogo='Ligurien', t='Verlegung und Reparatur von Unterwasserleitungen', toc='Unterwasserleitungen', d='Inspektionen mit ROV und Kamera, Reparaturen mit Muffen und Schellen, Austausch von Zink- und Opferanoden an Leitungen.')),
    'saldature': dict(es=dict(luogo='Puertos y astilleros', t='Soldaduras subacuáticas', toc='Soldaduras', d='Soldaduras bajo el agua en estructuras portuarias, rampas y cascos.'),
                      de=dict(luogo='Häfen und Werften', t='Unterwasserschweißen', toc='Schweißarbeiten', d='Schweißarbeiten unter Wasser an Hafenbauwerken, Slipanlagen und Rümpfen.')),
    'spianamenti': dict(es=dict(luogo='Puertos de Liguria', t='Nivelaciones y tanques de decantación', toc='Nivelaciones', d='Nivelación subacuática del fondo y colocación de tanques de decantación.'),
                        de=dict(luogo='Ligurische Häfen', t='Planieren und Absetzbecken', toc='Planieren', d='Planieren des Meeresgrundes und Setzen von Absetzbecken.')),
    'demolizioni': dict(es=dict(luogo='Puertos de Liguria', t='Demoliciones subacuáticas', toc='Demoliciones', d='Corte y demolición de estructuras sumergidas de hierro y hormigón.'),
                        de=dict(luogo='Ligurische Häfen', t='Unterwasser-Abbruch', toc='Abbruch', d='Schneiden und Abbruch von Unterwasserbauwerken aus Stahl und Beton.')),
    'catenarie': dict(es=dict(luogo='Puertos deportivos', t='Cadenas madre y amarres', toc='Cadenas madre', d='Colocación de las cadenas madre en el fondo y conexión de los amarres.'),
                      de=dict(luogo='Yachthäfen', t='Grundketten und Festmacher', toc='Grundketten', d='Verlegen der Grundketten am Meeresgrund und Anschluss der Festmacher.')),
    'alaggi': dict(es=dict(luogo='Savona, W. Service', t='Varadas y botaduras', toc='Varadas', d='Varadas y botaduras de embarcaciones de gran tamaño con travel lift.'),
                   de=dict(luogo='Savona, W. Service', t='Kranen und Einwassern', toc='Kranen', d='Aus- und Einwassern großer Boote mit dem Travellift.')),
    'sostituzione-anodi': dict(es=dict(luogo='Puerto de Loano', t='Sustitución de ánodos', toc='Sustitución de ánodos', d='Control y sustitución de ánodos de sacrificio en ejes, colas y tuberías.'),
                               de=dict(luogo='Hafen Loano', t='Anodenwechsel', toc='Anodenwechsel', d='Kontrolle und Austausch von Opferanoden an Wellen, Z-Antrieben und Leitungen.')),
    'malta': dict(es=dict(luogo='Malta', t='Trabajos subacuáticos en Malta', toc='Malta', d='Intervenciones subacuáticas en el extranjero, en Malta.'),
                  de=dict(luogo='Malta', t='Unterwasserarbeiten auf Malta', toc='Malta', d='Unterwassereinsätze im Ausland, auf Malta.')),
    'algeria': dict(es=dict(luogo='Argelia', t='Trabajos subacuáticos en Argelia', toc='Argelia', d='Intervenciones subacuáticas en el extranjero, en Argelia.'),
                    de=dict(luogo='Algerien', t='Unterwasserarbeiten in Algerien', toc='Algerien', d='Unterwassereinsätze im Ausland, in Algerien.')),
}

TEAM_ES_DE = {
    'FC': dict(es=dict(r='Buzo profesional (O.T.S.)', b=['Instructor IANTD con mezclas de gases', 'Ayudante de instructor ANIS', 'Buzo operativo de la Cruz Roja Italiana', 'Salvamento y reanimación de la Cruz Roja']),
               de=dict(r='Berufstaucher (O.T.S.)', b=['IANTD-Ausbilder für Mischgastauchen', 'ANIS-Hilfsausbilder', 'Einsatztaucher des Italienischen Roten Kreuzes', 'Rettungsschwimmen und Wiederbelebung (Rotes Kreuz)'])),
    'SC': dict(es=dict(r='Buzo profesional (O.T.S.)', b=['Ayudante de instructor ANIS', 'Buzo operativo de la Cruz Roja Italiana', 'Salvamento y reanimación de la Cruz Roja']),
               de=dict(r='Berufstaucher (O.T.S.)', b=['ANIS-Hilfsausbilder', 'Einsatztaucher des Italienischen Roten Kreuzes', 'Rettungsschwimmen und Wiederbelebung (Rotes Kreuz)'])),
}

MEZZI_ES_DE = {
    'es': [('En el mar', ['Embarcación de trabajo Bianca Maria', 'Lancha de servicio Golondrina', 'Pontón motorizado', 'Neumática transportable de 8 plazas']),
           ('Inmersión', ['Cascos Morgan para inmersiones de más de 12 m', 'Teléfono subacuático', 'ROV filoguiado con cámara', 'Contenedor equipado de soporte vital', 'Compresores Coltri, también portátiles']),
           ('Trabajos', ['Motosoldadora y pinza de soldadura subacuática', 'Antorcha de corte subacuática', 'Perforadora neumática', 'Hidrolimpiadora de agua caliente e hidroarenadora', 'Draga y succionadora para excavaciones subacuáticas']),
           ('En tierra', ['Furgoneta Opel Combo', 'Toyota 4x4 para zonas de difícil acceso', 'Remolque de carretera para neumática y lancha', 'Contenedor almacén', 'GPS para posicionamiento por satélite'])],
    'de': [('Auf See', ['Arbeitsboot Bianca Maria', 'Dienstboot Golondrina', 'Motorponton', 'Transportables Schlauchboot für 8 Personen']),
           ('Tauchen', ['Morgan-Helme für Tauchgänge über 12 m', 'Unterwassertelefon', 'Kabelgeführtes ROV mit Kamera', 'Ausgerüsteter Container für Lebenserhaltung', 'Coltri-Kompressoren, auch tragbar']),
           ('Arbeitsgeräte', ['Schweißgenerator und Unterwasser-Schweißzange', 'Unterwasser-Schneidbrenner', 'Druckluft-Bohrhammer', 'Heißwasser-Hochdruckreiniger und Sandstrahler', 'Bagger und Saugpumpe für Unterwasseraushub']),
           ('An Land', ['Transporter Opel Combo', 'Toyota 4x4 für unwegsames Gelände', 'Straßenanhänger für Schlauchboot und Dienstboot', 'Lagercontainer', 'GPS für Satellitenpositionierung'])],
}

MODULI_ES_DE = {
    'es': [('Ficha de la embarcación', 'Datos del barco, motor, documentos y vencimientos, rellenados por ti'), ('Limpieza subacuática', 'Fecha de la última intervención y fotos de nuestros buzos'),
           ('Registro de ánodos', 'Foto, código, fecha de montaje y recordatorio'), ('Recordatorios por email', 'Próxima limpieza, ánodos, seguro'),
           ('Solicitud de intervención', 'Con un toque nos escribes por WhatsApp'), ('Compartir por WhatsApp', 'Las fotos de las intervenciones con un toque')],
    'de': [('Bootsdatenblatt', 'Boots-, Motor- und Dokumentendaten mit Fristen, von Ihnen gepflegt'), ('Unterwasserreinigung', 'Datum des letzten Einsatzes und Fotos unserer Taucher'),
           ('Anodenprotokoll', 'Foto, Code, Einbaudatum und Erinnerung'), ('E-Mail-Erinnerungen', 'Nächste Reinigung, Anoden, Versicherung'),
           ('Einsatz anfragen', 'Ein Tipp und Sie schreiben uns auf WhatsApp'), ('Teilen per WhatsApp', 'Einsatzfotos mit einem Tipp')],
}

UTIL_ES_DE = {
    'meteo': ('Meteo marina Loano', 'Seewetter Loano'),
    'webcam': ('Webcam Loano', 'Webcam Loano'),
    'gps': ('Marcador GPS', 'GPS-Markierung'),
    'porto': ('Puerto de Loano', 'Hafen Loano'),
    'vento': ('Escala del viento', 'Windskala'),
    'cime': ('Cabos', 'Tauwerk'),
    'cavi': ('Cables de acero', 'Stahlseile'),
    'catene': ('Cadenas', 'Ketten'),
}

# Scala Beaufort: (nome, stato del mare) per forza 0-12
BEAUFORT_ES_DE = {
    'es': [('Calma', 'Mar como un espejo.'), ('Ventolina', 'Pequeñas ondas, sin crestas.'), ('Flojito', 'Olas pequeñas y cortas, crestas vidriosas que no rompen.'),
           ('Flojo', 'Olas más marcadas, crestas que empiezan a romper, algunos borreguillos.'), ('Bonancible', 'Olas más largas, borreguillos frecuentes.'),
           ('Fresquito', 'Olas moderadas y bien definidas, muchos borreguillos, algunos rociones.'), ('Fresco', 'Olas grandes, crestas blancas extensas, rociones.'),
           ('Frescachón', 'La mar engruesa, la espuma de las crestas se alinea en franjas en la dirección del viento.'), ('Temporal', 'Olas altas y largas, crestas que rompen en rociones, franjas de espuma bien marcadas.'),
           ('Temporal fuerte', 'Olas altas, densas franjas de espuma, crestas que rompen, rociones que reducen la visibilidad.'),
           ('Temporal duro', 'Olas muy altas con largas crestas rompientes, mar blanca de espuma, visibilidad reducida.'),
           ('Temporal muy duro', 'Olas excepcionalmente altas, mar cubierta de espuma, visibilidad muy reducida.'), ('Huracán', 'Aire lleno de espuma y rociones, mar completamente blanca, visibilidad casi nula.')],
    'de': [('Windstille', 'Spiegelglatte See.'), ('Leiser Zug', 'Kleine Kräuselwellen ohne Schaumkämme.'), ('Leichte Brise', 'Kleine, kurze Wellen, glasige Kämme, die nicht brechen.'),
           ('Schwache Brise', 'Größere Wellen, Kämme beginnen zu brechen, vereinzelt Schaumköpfe.'), ('Mäßige Brise', 'Längere Wellen, häufig Schaumköpfe.'),
           ('Frische Brise', 'Mäßige, ausgeprägte Wellen, viele Schaumköpfe, etwas Gischt.'), ('Starker Wind', 'Große Wellen, ausgedehnte weiße Schaumkämme, Gischt.'),
           ('Steifer Wind', 'Die See türmt sich, Schaum legt sich in Streifen in Windrichtung.'), ('Stürmischer Wind', 'Hohe, lange Wellen, Kämme brechen in Gischt, deutliche Schaumstreifen.'),
           ('Sturm', 'Hohe Wellen, dichte Schaumstreifen, überbrechende Kämme, Gischt mindert die Sicht.'),
           ('Schwerer Sturm', 'Sehr hohe Wellen mit langen überbrechenden Kämmen, See weiß von Schaum, verminderte Sicht.'),
           ('Orkanartiger Sturm', 'Außergewöhnlich hohe Wellen, See mit Schaum bedeckt, stark verminderte Sicht.'), ('Orkan', 'Luft voller Schaum und Gischt, See vollständig weiß, kaum Sicht.')],
}
