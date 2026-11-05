// Pagina Utilità: meteomare Loano (Open-Meteo) e marcatore GPS (OpenStreetMap).
// Tutto avviene nel browser: nessun dato viene salvato.
(function () {
  var LOANO = [44.1286, 8.2589];

  // ---------- METEO ----------
  var box = document.querySelector('[data-meteo]');
  if (box && box.offsetParent !== null) {
    var lang = box.getAttribute('data-lang') || 'it';
    var TT = {
      it: { now: 'Adesso a Loano', next: 'Prossimi giorni', wind: 'Vento', from: 'da', sea: 'Mare', air: 'Aria', water: 'Acqua', gusts: 'raffiche', force: 'Forza', upd: 'Aggiornato alle', na: 'Dati meteo non disponibili in questo momento.',
            days: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'], today: 'Oggi', dir: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'],
            bf: ['calma', 'bava di vento', 'brezza leggera', 'brezza tesa', 'vento moderato', 'vento teso', 'vento fresco', 'vento forte', 'burrasca', 'burrasca forte', 'tempesta', 'fortunale', 'uragano'],
            wx: ['sereno', 'poco nuvoloso', 'nuvoloso', 'nebbia', 'pioviggine', 'pioggia', 'neve', 'temporale'],
            sea_s: [[0.1, 'calmo'], [0.5, 'quasi calmo'], [1.25, 'poco mosso'], [2.5, 'mosso'], [4, 'molto mosso'], [6, 'agitato'], [99, 'grosso']] },
      en: { now: 'Now in Loano', next: 'Next days', wind: 'Wind', from: 'from', sea: 'Sea', air: 'Air', water: 'Water', gusts: 'gusts', force: 'Force', upd: 'Updated at', na: 'Weather data not available right now.',
            days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], today: 'Today', dir: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
            bf: ['calm', 'light air', 'light breeze', 'gentle breeze', 'moderate breeze', 'fresh breeze', 'strong breeze', 'near gale', 'gale', 'strong gale', 'storm', 'violent storm', 'hurricane'],
            wx: ['clear', 'partly cloudy', 'cloudy', 'fog', 'drizzle', 'rain', 'snow', 'thunderstorm'],
            sea_s: [[0.1, 'calm'], [0.5, 'smooth'], [1.25, 'slight'], [2.5, 'moderate'], [4, 'rough'], [6, 'very rough'], [99, 'high']] },
      es: { now: 'Ahora en Loano', next: 'Próximos días', wind: 'Viento', from: 'del', sea: 'Mar', air: 'Aire', water: 'Agua', gusts: 'rachas', force: 'Fuerza', upd: 'Actualizado a las', na: 'Datos meteorológicos no disponibles en este momento.',
            days: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], today: 'Hoy', dir: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'],
            bf: ['calma', 'ventolina', 'flojito', 'flojo', 'bonancible', 'fresquito', 'fresco', 'frescachón', 'temporal', 'temporal fuerte', 'temporal duro', 'temporal muy duro', 'temporal huracanado'],
            wx: ['despejado', 'poco nuboso', 'nuboso', 'niebla', 'llovizna', 'lluvia', 'nieve', 'tormenta'],
            sea_s: [[0.1, 'calma'], [0.5, 'rizada'], [1.25, 'marejadilla'], [2.5, 'marejada'], [4, 'fuerte marejada'], [6, 'gruesa'], [99, 'muy gruesa']] },
      de: { now: 'Jetzt in Loano', next: 'Nächste Tage', wind: 'Wind', from: 'aus', sea: 'See', air: 'Luft', water: 'Wasser', gusts: 'Böen', force: 'Stärke', upd: 'Aktualisiert um', na: 'Wetterdaten derzeit nicht verfügbar.',
            days: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], today: 'Heute', dir: ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'],
            bf: ['Windstille', 'leiser Zug', 'leichte Brise', 'schwache Brise', 'mäßige Brise', 'frische Brise', 'starker Wind', 'steifer Wind', 'stürmischer Wind', 'Sturm', 'schwerer Sturm', 'orkanartiger Sturm', 'Orkan'],
            wx: ['klar', 'leicht bewölkt', 'bewölkt', 'Nebel', 'Niesel', 'Regen', 'Schnee', 'Gewitter'],
            sea_s: [[0.1, 'ruhig'], [0.5, 'schwach bewegt'], [1.25, 'leicht bewegt'], [2.5, 'mäßig bewegt'], [4, 'grob'], [6, 'sehr grob'], [99, 'hoch']] },
    };
    var T = TT[lang] || TT.it;
    var dir = function (d) { return d == null ? '' : T.dir[Math.round(d / 45) % 8]; };
    var num = function (v, n) { var s = v.toFixed(n); return lang === 'en' ? s : s.replace('.', ','); };
    var stato = function (h) { for (var i = 0; i < T.sea_s.length; i++) if (h <= T.sea_s[i][0]) return T.sea_s[i][1]; return ''; };
    var BFK = [1, 4, 7, 11, 17, 22, 28, 34, 41, 48, 56, 64];
    var bft = function (kn) { var i = 0; while (i < BFK.length && kn >= BFK[i]) i++; return i; };
    var lvl = function (kn) { return kn < 12 ? 'ok' : kn < 20 ? 'mid' : kn < 28 ? 'hi' : 'max'; };
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

    // gruppo del codice meteo WMO: 0 sereno, 1 poco nuvoloso, 2 nuvoloso, 3 nebbia, 4 pioviggine, 5 pioggia, 6 neve, 7 temporale
    var wg = function (c) { return c === 0 ? 0 : c <= 2 ? 1 : c === 3 ? 2 : c <= 48 ? 3 : c <= 57 ? 4 : c <= 67 || (c >= 80 && c <= 82) ? 5 : c <= 77 || c === 85 || c === 86 ? 6 : 7; };
    var SUN = '<circle cx="12" cy="12" r="4.2" fill="#FFC542" stroke="none"/><g stroke="#FFC542"><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></g>';
    var CLOUD = function (x) { return '<path d="M7 18.5h10a3.8 3.8 0 0 0 .5-7.6A5.5 5.5 0 0 0 7 11.2a3.7 3.7 0 0 0 0 7.3z" fill="' + (x || '#C9D8E3') + '" stroke="none"/>'; };
    var ICONS = [
      SUN,
      '<g transform="translate(-3 -3) scale(.8)">' + SUN + '</g>' + CLOUD(),
      CLOUD('#9FB3C4'),
      CLOUD('#9FB3C4') + '<path d="M4 21h16M6 23h12" stroke="#9FB3C4"/>',
      CLOUD('#9FB3C4') + '<path d="M9 21v1M13 21v1M17 21v1" stroke="#22B8F0"/>',
      CLOUD('#7F95A8') + '<path d="M8 20.5l-1 2.5M12 20.5l-1 2.5M16 20.5l-1 2.5" stroke="#22B8F0"/>',
      CLOUD('#C9D8E3') + '<path d="M8 21.5h.01M12 22.5h.01M16 21.5h.01" stroke="#fff" stroke-width="2.6"/>',
      CLOUD('#5F7487') + '<path d="M12.5 17l-2 4h3l-2 3" stroke="#FFC542" stroke-width="1.8"/>'
    ];
    var wicon = function (c, size) { var g = wg(c); return '<svg class="mt-wx" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" aria-label="' + esc(T.wx[g]) + '" role="img">' + ICONS[g] + '</svg>'; };
    // freccia: la direzione meteo indica da dove arriva il vento, la freccia punta dove soffia
    var arrow = function (deg, size) { return '<svg class="mt-arr" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(' + ((deg + 180) % 360) + 'deg)"><path d="M12 3l5 9h-3.5v9h-3v-9H7z" fill="currentColor"/></svg>'; };
    var W = 'https://api.open-meteo.com/v1/forecast?latitude=44.1286&longitude=8.2589&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&wind_speed_unit=kn&timezone=Europe%2FRome&forecast_days=6';
    var M = 'https://marine-api.open-meteo.com/v1/marine?latitude=44.11&longitude=8.29&current=wave_height,sea_surface_temperature&daily=wave_height_max&timezone=Europe%2FRome&forecast_days=6';
    var get = function (u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); };

    // posizioni nell'immagine meteo-mare.webp (2172 x 724 px), in percentuale
    var W0 = 2172, H0 = 724;
    var at = function (x, y, r) { return 'left:' + (x / W0 * 100).toFixed(2) + '%;top:' + (y / H0 * 100).toFixed(2) + '%;width:' + (r * 2 / W0 * 100).toFixed(2) + '%;height:' + (r * 2 / H0 * 100).toFixed(2) + '%'; };
    var BUB = { wind: [1087, 320, 108], sea: [928, 488, 88], air: [1245, 484, 88] };
    var STONES = [[650, 247, 54], [650, 365, 54], [649, 488, 54], [1524, 245, 54], [1524, 362, 54], [1524, 482, 54]];

    Promise.all([get(W), get(M).catch(function () { return null; })]).then(function (res) {
      var w = res[0], m = res[1], c = w.current;
      var wave = m && m.current ? m.current.wave_height : null;
      var sst = m && m.current ? m.current.sea_surface_temperature : null;
      var kn = c.wind_speed_10m, b = bft(kn);
      var time = (c.time || '').slice(11, 16);
      var title = box.getAttribute('data-title') || '';
      var bub = function (k, html) { var p = BUB[k]; return '<div class="mb-bub mb-' + k + '" style="' + at(p[0], p[1], p[2]) + '"><div>' + html + '</div></div>'; };
      var html =
        '<div class="mb-plaque" style="left:50.2%;top:17%">' + esc(title) + '</div>' +
        bub('wind', '<span class="mb-v lv-' + lvl(kn) + '">' + arrow(c.wind_direction_10m, 14) + Math.round(kn) + '<small> kn ' + dir(c.wind_direction_10m) + '</small></span>' +
          '<span class="mb-s">' + T.gusts + ' ' + Math.round(c.wind_gusts_10m) + ' kn</span><span class="mb-s mb-x">' + T.force + ' ' + b + ' · ' + esc(T.bf[b]) + '</span><span class="mb-l">' + T.wind + '</span>') +
        bub('sea', '<span class="mb-v">' + (wave != null ? num(wave, 1) + '<small> m</small>' : '—') + '</span><span class="mb-s">' + (wave != null ? esc(stato(wave)) : '') + '</span><span class="mb-l">' + T.sea + '</span>') +
        bub('air', '<span class="mb-v">' + Math.round(c.temperature_2m) + '°' + (sst != null ? '<small> / ' + Math.round(sst) + '°</small>' : '') + '</span>' +
          '<span class="mb-s">' + esc(T.wx[wg(c.weather_code)]) + '</span><span class="mb-l">' + T.air + (sst != null ? ' · ' + T.water : '') + '</span>');
      (w.daily.time || []).slice(0, 6).forEach(function (d, i) {
        var dt = new Date(d + 'T12:00:00');
        var wv = m && m.daily ? m.daily.wave_height_max[i] : null;
        var dk = w.daily.wind_speed_10m_max[i], p = STONES[i];
        html += '<div class="mb-stone" style="' + at(p[0], p[1], p[2]) + '" title="' + Math.round(w.daily.temperature_2m_max[i]) + '°/' + Math.round(w.daily.temperature_2m_min[i]) + '° · ' + Math.round(dk) + ' kn ' + dir(w.daily.wind_direction_10m_dominant[i]) + ' · ' + T.gusts + ' ' + Math.round(w.daily.wind_gusts_10m_max[i]) + ' kn' + (wv != null ? ' · ' + T.sea + ' ' + num(wv, 1) + ' m' : '') + '"><div>' +
          '<b>' + (i === 0 ? T.today : T.days[dt.getDay()] + ' ' + dt.getDate()) + '</b>' +
          '<span class="mb-t">' + wicon(w.daily.weather_code[i], 16) + Math.round(w.daily.temperature_2m_max[i]) + '°</span>' +
          '<span class="mb-k lv-' + lvl(dk) + '">' + arrow(w.daily.wind_direction_10m_dominant[i], 11) + Math.round(dk) + ' kn</span>' +
          '</div></div>';
      });
      box.innerHTML = '<div class="mb-frame"><div class="mb-art">' + html + '</div>' +
        (time ? '<p class="mb-upd">' + T.now + ' · ' + T.upd + ' ' + time + '</p>' : '') + '</div>';
    }).catch(function () { box.insertAdjacentHTML('beforeend', '<p class="hint">' + esc(T.na) + '</p>'); });
  }

  // ---------- GIORNI BUONI PER LAVORARE IN ACQUA ----------
  // Ogni ora dalle 6 alle 18: verde = onda <= 0,5 m e vento <= 12 kn (raffiche <= 20);
  // giallo = onda <= 0,9 m e vento <= 17 kn; rosso = oltre, o temporale.
  var gbox = document.querySelector('[data-giorni]');
  // da cellulare la sezione è nascosta: non scarico nemmeno le previsioni
  if (gbox && gbox.offsetParent !== null) {
    var gl = gbox.getAttribute('data-lang') || 'it';
    var GT = {
      it: { v: { g: 'Ottimo per lavorare in acqua', y: 'Si lavora solo in alcune ore', r: 'Mare mosso: meglio rimandare', x: 'Giornata finita' }, best: 'ore migliori', wave: 'Onda', wind: 'Vento',
            leg: ['Ottimo', 'Alcune ore', 'Mosso'], book: 'Prenota con', no: 'Giorno sconsigliato', today: 'Oggi', days: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
            note: 'Indicazione automatica dalle previsioni: la decisione finale è sempre di Anfibiasub.', na: 'Previsioni non disponibili in questo momento.' },
      en: { v: { g: 'Great for work in the water', y: 'Work possible only at some hours', r: 'Rough sea: better postpone', x: 'Day over' }, best: 'best hours', wave: 'Waves', wind: 'Wind',
            leg: ['Great', 'Some hours', 'Rough'], book: 'Book with', no: 'Not recommended', today: 'Today', days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            note: 'Automatic indication from the forecast: the final decision is always Anfibiasub\'s.', na: 'Forecast not available right now.' },
      es: { v: { g: 'Ideal para trabajar en el agua', y: 'Se trabaja solo algunas horas', r: 'Mar movido: mejor aplazar', x: 'Día terminado' }, best: 'mejores horas', wave: 'Ola', wind: 'Viento',
            leg: ['Ideal', 'Algunas horas', 'Movido'], book: 'Reservar con', no: 'Día desaconsejado', today: 'Hoy', days: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
            note: 'Indicación automática según la previsión: la decisión final es siempre de Anfibiasub.', na: 'Previsión no disponible en este momento.' },
      de: { v: { g: 'Ideal für Arbeiten im Wasser', y: 'Arbeiten nur zu einigen Stunden', r: 'Bewegte See: besser verschieben', x: 'Tag vorbei' }, best: 'beste Stunden', wave: 'Welle', wind: 'Wind',
            leg: ['Ideal', 'Einige Stunden', 'Bewegt'], book: 'Buchen bei', no: 'Nicht empfohlen', today: 'Heute', days: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
            note: 'Automatische Angabe aus der Vorhersage: Die Entscheidung trifft immer Anfibiasub.', na: 'Vorhersage derzeit nicht verfügbar.' },
    };
    var G = GT[gl] || GT.it;
    var IT_DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
    var IT_MON = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
    var PEOPLE = [['Francesco', '393470119832'], ['Simone', '393470387290']];
    var gnum = function (v) { var s = v.toFixed(1); return gl === 'en' ? s : s.replace('.', ','); };
    var gesc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var gget = function (u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); };
    var GW = 'https://api.open-meteo.com/v1/forecast?latitude=44.1286&longitude=8.2589&hourly=wind_speed_10m,wind_gusts_10m,weather_code&wind_speed_unit=kn&timezone=Europe%2FRome&forecast_days=7';
    var GM = 'https://marine-api.open-meteo.com/v1/marine?latitude=44.11&longitude=8.29&hourly=wave_height&timezone=Europe%2FRome&forecast_days=7';
    var H1 = 6, H2 = 18;
    var hc = function (h) {
      if (h.code >= 95) return 'r';
      var wv = h.wave == null ? 0 : h.wave;
      if (wv <= 0.5 && h.wind <= 12 && h.gust <= 20) return 'g';
      if (wv <= 0.9 && h.wind <= 17) return 'y';
      return 'r';
    };
    Promise.all([gget(GW), gget(GM).catch(function () { return null; })]).then(function (res) {
      var w = res[0].hourly, m = res[1] && res[1].hourly ? res[1].hourly : null;
      var waveAt = {};
      if (m) m.time.forEach(function (t, i) { waveAt[t] = m.wave_height[i]; });
      var now = new Date(), byDay = {}, order = [];
      w.time.forEach(function (t, i) {
        var hr = +t.slice(11, 13);
        if (hr < H1 || hr > H2) return;
        var d = t.slice(0, 10);
        if (!byDay[d]) { byDay[d] = []; order.push(d); }
        var past = new Date(t + ':00') < new Date(now.getTime() - 3600000);
        byDay[d].push({ h: hr, wind: w.wind_speed_10m[i], gust: w.wind_gusts_10m[i], code: w.weather_code[i], wave: waveAt[t] != null ? waveAt[t] : null, past: past });
      });
      var days = order.slice(0, 7).map(function (d, i) {
        var hs = byDay[d], live = hs.filter(function (h) { return !h.past; });
        hs.forEach(function (h) { h.c = h.past ? 'x' : hc(h); });
        var ng = live.filter(function (h) { return h.c === 'g'; }).length, ny = live.filter(function (h) { return h.c === 'y'; }).length;
        var c = !live.length ? 'x' : ng >= 8 || (ng && ng === live.length) ? 'g' : ng >= 3 || ng + ny >= 6 ? 'y' : 'r';
        var run = function (ok) { var bs = 0, bl = 0, cs = 0, cl = 0; hs.forEach(function (h, k) { if (ok(h.c)) { if (!cl) cs = k; cl++; if (cl > bl) { bl = cl; bs = cs; } } else cl = 0; }); return bl ? [hs[bs].h, hs[bs + bl - 1].h + 1] : null; };
        var best = run(function (x) { return x === 'g'; }) || run(function (x) { return x === 'g' || x === 'y'; });
        var src = live.length ? live : hs;
        var mx = function (k) { var v = null; src.forEach(function (h) { if (h[k] != null && (v == null || h[k] > v)) v = h[k]; }); return v; };
        var dt = new Date(d + 'T12:00:00');
        return { d: d, dt: dt, i: i, hs: hs, c: c, best: c === 'r' || c === 'x' ? null : best, wave: mx('wave'), wind: mx('wind'),
                 lab: i === 0 ? G.today : G.days[dt.getDay()] + ' ' + dt.getDate() };
      });
      var sel = 0;
      for (var k = 0; k < days.length; k++) if (days[k].c === 'g') { sel = k; break; }
      if (days[sel].c === 'x' && days[1]) sel = 1;

      var dayBtn = function (D, k) {
        return '<button type="button" class="gb-day' + (k === sel ? ' is-sel' : '') + '" data-k="' + k + '"><b>' + gesc(D.lab) + '</b><i class="gb-dot c-' + D.c + '"></i>' +
          '<small>' + (D.wave != null ? gnum(D.wave) + ' m · ' : '') + Math.round(D.wind) + ' kn</small></button>';
      };
      var books = function (D) {
        if (D.c === 'r' || D.c === 'x') return '<span class="gb-no">' + G.no + '</span>';
        var when = IT_DAYS[D.dt.getDay()] + ' ' + D.dt.getDate() + ' ' + IT_MON[D.dt.getMonth()];
        var msg = 'Ciao, vorrei prenotare un intervento per ' + when + (D.best ? ' (ore migliori ' + D.best[0] + '-' + D.best[1] + ')' : '') + '.';
        return PEOPLE.map(function (p) { return '<a class="gb-book" href="https://wa.me/' + p[1] + '?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener">' + G.book + ' ' + p[0] + '</a>'; }).join('');
      };
      var detail = function (D) {
        var bar = D.hs.map(function (h) { return '<i class="c-' + h.c + '" title="' + h.h + ':00"></i>'; }).join('');
        return '<div class="gb-v c-' + D.c + '">' + G.v[D.c] + (D.best ? ' · <span>' + G.best + ' ' + D.best[0] + '–' + D.best[1] + '</span>' : '') + '</div>' +
          '<div class="gb-bar">' + bar + '</div><div class="gb-hl"><span>' + H1 + ':00</span><span>12:00</span><span>' + H2 + ':00</span></div>';
      };
      var render = function () {
        var D = days[sel];
        gbox.innerHTML = '<div class="gb-frame"><div class="gb-art"><div class="gb-in">' +
          '<div class="gb-top"><h3 class="gb-title">' + gesc(gbox.getAttribute('data-title') || '') + '</h3>' +
          '<div class="gb-leg"><span class="c-g">' + G.leg[0] + '</span><span class="c-y">' + G.leg[1] + '</span><span class="c-r">' + G.leg[2] + '</span></div></div>' +
          '<div class="gb-days">' + days.map(dayBtn).join('') + '</div>' +
          '<div class="gb-det"><div class="gb-info">' + detail(D) + '</div><div class="gb-btns">' + books(D) + '</div></div>' +
          '</div></div><p class="mb-upd">' + G.note + '</p></div>' +
          '<div class="gb-btns-m">' + books(D) + '</div>';
        Array.prototype.forEach.call(gbox.querySelectorAll('.gb-day'), function (b) {
          b.addEventListener('click', function () { sel = +b.getAttribute('data-k'); render(); var nb = gbox.querySelector('.gb-day.is-sel'); if (nb) nb.focus({ preventScroll: true }); });
        });
      };
      render();
    }).catch(function () { gbox.insertAdjacentHTML('beforeend', '<p class="hint">' + G.na + '</p>'); });
  }

  // ---------- MARCATORE GPS ----------
  var el = document.querySelector('[data-gps]');
  if (el && window.L) {
    var l2 = el.getAttribute('data-lang') || 'it';
    var MYPOS = { it: 'La mia posizione: ', en: 'My position: ', es: 'Mi posición: ', de: 'Meine Position: ' }[l2];
    var map = L.map(el, { scrollWheelZoom: false }).setView(LOANO, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    var icon = L.divIcon({ className: '', html: '<svg width="36" height="36" viewBox="0 0 24 24" fill="#FF8A3D" stroke="#050E1A" stroke-width="1"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>', iconSize: [36, 36], iconAnchor: [18, 34] });
    var marker = null, cur = null;
    var coords = document.querySelector('[data-gps-coords]');
    var links = document.querySelectorAll('[data-gps-link]');
    var copy = document.querySelector('[data-gps-copy]');

    function fmt(v, pos, neg) {
      var a = Math.abs(v), d = Math.floor(a), mm = (a - d) * 60;
      return d + '° ' + mm.toFixed(3) + "' " + (v >= 0 ? pos : neg);
    }
    function set(p) {
      cur = p;
      if (marker) marker.setLatLng(p); else marker = L.marker(p, { icon: icon, draggable: true }).addTo(map).on('dragend', function () { set(marker.getLatLng()); });
      var lat = p.lat.toFixed(6), lng = p.lng.toFixed(6);
      coords.textContent = lat + ', ' + lng + '   ·   ' + fmt(p.lat, 'N', 'S') + '  ' + fmt(p.lng, 'E', 'W');
      var g = 'https://www.google.com/maps?q=' + lat + ',' + lng;
      links.forEach(function (a) {
        var k = a.getAttribute('data-gps-link');
        a.href = k === 'gmaps' ? g : k === 'gearth' ? 'https://earth.google.com/web/search/' + lat + ',' + lng : 'https://wa.me/?text=' + encodeURIComponent(MYPOS + g);
        a.classList.remove('is-off');
      });
      copy.classList.remove('is-off');
    }
    map.on('click', function (e) { set(e.latlng); });

    var loc = document.querySelector('[data-gps-locate]');
    loc.addEventListener('click', function () {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(function (pos) {
        var p = L.latLng(pos.coords.latitude, pos.coords.longitude);
        map.setView(p, 17); set(p);
      }, function (err) { coords.textContent = err.message; }, { enableHighAccuracy: true, timeout: 15000 });
    });

    copy.addEventListener('click', function () {
      if (!cur) return;
      var t = cur.lat.toFixed(6) + ', ' + cur.lng.toFixed(6), old = copy.textContent;
      var done = function () { copy.textContent = copy.getAttribute('data-done'); setTimeout(function () { copy.textContent = old; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () { prompt('', t); }); else prompt('', t);
    });
  }
})();

// ---------- MAPPA DEL PORTO DI LOANO: punti dei lavori Anfibiasub ----------
(function () {
  var el = document.querySelector('[data-porto]');
  if (!el || !window.L) return;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var punti = [];
  try { punti = JSON.parse(el.getAttribute('data-punti') || '[]'); } catch (e) { return; }
  var c = (el.getAttribute('data-center') || '44.1334,8.266').split(',').map(Number);
  var more = el.getAttribute('data-more') || '';
  var edit = /[?&]modifica\b/.test(location.search);
  var map = L.map(el, { scrollWheelZoom: false, tap: true }).setView(c, 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
  var list = document.querySelector('[data-porto-list]');
  var out = document.querySelector('[data-porto-edit]');
  var markers = [];
  function showCoords() {
    if (!out) return;
    out.hidden = false;
    out.textContent = markers.map(function (m, i) { var p = m.getLatLng(); return punti[i].id + ': [' + p.lat.toFixed(5) + ', ' + p.lng.toFixed(5) + ']'; }).join('   ');
  }
  punti.forEach(function (pt, i) {
    var icon = L.divIcon({ className: 'porto-pin', html: '<span>' + (i + 1) + '</span>', iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -16] });
    var m = L.marker(pt.p, { icon: icon, draggable: edit, title: pt.t }).addTo(map);
    m.bindPopup('<div class="porto-pop"><img src="' + esc(pt.img) + '" alt="" loading="lazy"><b>' + (i + 1) + '. ' + esc(pt.t) + '</b><p>' + esc(pt.d) + '</p>' +
      '<a href="' + esc(pt.u) + '">' + esc(more) + ' →</a></div>', { maxWidth: 260, minWidth: 220 });
    if (edit) m.on('dragend', showCoords);
    markers.push(m);
    if (list) {
      var li = document.createElement('li');
      li.innerHTML = '<button type="button"><span>' + (i + 1) + '</span>' + esc(pt.t) + '</button>';
      li.querySelector('button').addEventListener('click', function () {
        map.setView(pt.p, Math.max(map.getZoom(), 16), { animate: true });
        m.openPopup();
        if (window.innerWidth < 1024) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      list.appendChild(li);
    }
  });
  if (markers.length) map.fitBounds(L.featureGroup(markers).getBounds().pad(0.35));
  if (edit) showCoords();
})();
