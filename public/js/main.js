// Menu principale e menu a tendina (si aprono cliccando sul nome)
(function () {
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (!nav) return;
  var mobile = function () { return window.matchMedia('(max-width: 1023px)').matches; };

  if (btn) btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  var dds = nav.querySelectorAll('.dd');
  function closeAll(except) {
    dds.forEach(function (d) {
      if (d !== except) { d.classList.remove('open'); d.querySelector('.dd-btn').setAttribute('aria-expanded', 'false'); }
    });
  }
  dds.forEach(function (d) {
    var b = d.querySelector('.dd-btn');
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !d.classList.contains('open');
      closeAll(d);
      d.classList.toggle('open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) closeAll(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });

  // Scelta una voce: chiudo la tendina (e sul telefono anche il menu)
  nav.addEventListener('click', function (e) {
    if (e.target.tagName !== 'A') return;
    closeAll();
    if (mobile() && btn) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  });
})();

// Titolo della home: ogni riga resta su una riga sola e si rimpicciolisce fino a stare nella larghezza
(function () {
  var h = document.querySelector('.hero h1');
  if (!h || !h.querySelector('.fit')) return;
  var MAX = 68;
  function fit() {
    h.style.fontSize = '';
    var cs = getComputedStyle(h.parentNode);
    var avail = h.parentNode.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var lines = h.querySelectorAll('.fit'), size = Math.min(MAX, parseFloat(getComputedStyle(h).fontSize) * 3);
    h.style.fontSize = size + 'px';
    var widest = 0;
    lines.forEach(function (l) { l.style.maxWidth = 'none'; widest = Math.max(widest, l.scrollWidth); });
    if (widest > avail) size = Math.floor(size * avail / widest * 0.99);
    h.style.fontSize = Math.min(MAX, size) + 'px';
    lines.forEach(function (l) { l.style.maxWidth = ''; });
  }
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('resize', fit);
})();


// ---------- "Dove sono" (ex SOS): finestra, posizione GPS e messaggio WhatsApp (non di emergenza) ----------
(function () {
  var dlg = document.getElementById('sos-dlg');
  if (!dlg) return;
  var posEl = dlg.querySelector('[data-sos-pos]');
  var links = dlg.querySelectorAll('[data-sos-to]');
  var run = 0;
  function setMsg(lat, lon, acc) {
    // niente emoji: su alcuni telefoni arrivano come simbolo rotto
    var t = lat != null
      ? 'Ciao, richiedo intervento in questa posizione:\nhttps://maps.google.com/?q=' + lat.toFixed(5) + ',' + lon.toFixed(5) + (acc ? '\n(precisione ' + Math.round(acc) + ' m)' : '')
      : 'Ciao, richiedo intervento. La posizione GPS non è disponibile, ti scrivo qui dove mi trovo:\n';
    Array.prototype.forEach.call(links, function (a) { a.href = 'https://wa.me/' + a.getAttribute('data-sos-to') + '?text=' + encodeURIComponent(t); });
  }
  function open() {
    var my = ++run;
    posEl.textContent = dlg.getAttribute('data-searching');
    posEl.classList.remove('is-off');
    setMsg(null);
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    if (!navigator.geolocation) { fail(); return; }
    navigator.geolocation.getCurrentPosition(function (p) {
      if (my !== run) return;
      var c = p.coords;
      posEl.textContent = c.latitude.toFixed(5) + ', ' + c.longitude.toFixed(5) + ' · ' + dlg.getAttribute('data-acc') + ' ±' + Math.round(c.accuracy) + ' m';
      setMsg(c.latitude, c.longitude, c.accuracy);
    }, function () { if (my === run) fail(); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
    function fail() { posEl.textContent = dlg.getAttribute('data-nopos'); posEl.classList.add('is-off'); }
  }
  function close() { run++; if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  Array.prototype.forEach.call(document.querySelectorAll('[data-sos]'), function (b) { b.addEventListener('click', open); });
  dlg.querySelector('[data-sos-close]').addEventListener('click', close);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  Array.prototype.forEach.call(links, function (a) { a.addEventListener('click', function () { setTimeout(close, 300); }); });
})();

// ---------- I video partono solo a pagina caricata: prima testi e foto, poi le animazioni ----------
window.__ready = false;
window.addEventListener('load', function () {
  setTimeout(function () { window.__ready = true; window.dispatchEvent(new Event('resize')); }, 300);
});

// ---------- Sfondo "discesa" da PC: superficie -> relitto, profondimetro 0-50 m ----------
(function () {
  var bg = document.querySelector('.abyss-bg');
  if (!bg || !window.matchMedia) return;
  var mq = window.matchMedia('(min-width:1024px)');
  var surf = bg.querySelector('.ab-surf'), sl = bg.querySelector('.ab-l'), sr = bg.querySelector('.ab-r'), veil = bg.querySelector('.ab-veil'), RATIO = 4515 / 821;
  var val = document.querySelector('[data-depth]'), bar = document.querySelector('[data-depth-bar]'), diver = document.querySelector('.diver'), line = document.querySelector('.dv-line');
  var MAX = +bg.getAttribute('data-max') || 50, shallow = bg.classList.contains('is-shallow'), fixed = bg.classList.contains('is-fixed'), ticking = false;
  function update() {
    ticking = false;
    if (!mq.matches) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = fixed ? 0 : (h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0); // Contatti: fermo a 1 m
    // due immagini verticali ai lati (0-50 m): scorrono dalla superficie al fondale insieme alla pagina
    if (sl && sr && veil) {
      var vw = window.innerWidth, vh = window.innerHeight, side = Math.max(0, (vw - veil.offsetWidth) / 2) + 48;
      var ih = Math.max(side * RATIO, vh * 2), iw = ih / RATIO;
      var y = -Math.round((ih - vh) * p * (shallow ? 0.6 : 1));
      sl.style.width = sr.style.width = Math.round(iw) + 'px';
      sl.style.height = sr.style.height = Math.round(ih) + 'px';
      sl.style.left = Math.round(side - iw) + 'px';
      sl.style.transform = sr.style.transform = 'translate3d(0,' + y + 'px,0)';
    }
    // pagine interne: in cima la superficie del mare si muove (stesso video della Home), poi sale via con la discesa
    if (surf) {
      if (!surf.src && window.__ready) { surf.poster = '/img/superficie-3.webp?v=0b132e'; surf.src = surf.canPlayType('video/mp4; codecs="avc1.42E01E"') ? '/img/superficie-3.mp4' : '/img/superficie-3.webm'; }
      var sy = fixed ? 0 : Math.round(-window.scrollY * 0.6);
      surf.style.transform = 'translate3d(0,' + sy + 'px,0)';
      var seen = sy + surf.offsetHeight > 0 && !document.hidden;
      if (seen && surf.paused && surf.src) { var pp = surf.play(); if (pp && pp.catch) pp.catch(function () {}); }
      else if (!seen && !surf.paused) surf.pause();
    }
    // profondità da 1 m (appena sotto la superficie) al massimo della pagina
    var depth = 1 + p * (MAX - 1);
    if (val) val.textContent = depth.toFixed(1);
    // dai 40 m in giù si accende la torcia sul casco
    if (diver) diver.style.setProperty('--lamp', Math.min(1, Math.max(0, (depth - 40) / 3)).toFixed(2));
    if (diver && diver.okAt) diver.okAt(depth);
    if (window.relittoAt) window.relittoAt(depth);
    if (bar) bar.style.height = (p * 100).toFixed(1) + '%';
    // il sub scende dall'alto (sotto l'header) fino in fondo allo schermo
    if (diver && diver.offsetHeight) {
      var top = 170, room = window.innerHeight - top - diver.offsetHeight - 16;
      diver.style.transform = 'translate(-50%,' + Math.round(top + Math.max(0, room) * p) + 'px)';
    }
    // la cima resta ferma: segue solo la posizione orizzontale del sub
    if (line && diver.offsetWidth) {
      var dr = diver.getBoundingClientRect(), lw = dr.width * 22 / 602;
      line.style.width = lw.toFixed(1) + 'px';
      line.style.left = (dr.left + dr.width * 546 / 602 - lw / 2).toFixed(1) + 'px';
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  if (mq.addEventListener) mq.addEventListener('change', req);
  window.addEventListener('load', req);
  update();
})();

// ---------- Bolle di scarico dell'OTS: escono dalle valvole sotto il mento, a ritmo di respiro ----------
(function () {
  return; // bolle tolte (ottobre 2026): sembravano finte
  var diver = document.querySelector('.diver');
  if (!diver || !window.matchMedia || !window.requestAnimationFrame) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var mq = window.matchMedia('(min-width:1700px)');
  var cv = document.createElement('canvas');
  cv.className = 'dv-canvas';
  cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  var cx = cv.getContext('2d');
  if (!cx) return;
  // valvola di scarico sotto il mento, in % dell'immagine del sub
  var VX = 0.495, VY = 0.262;
  var BREATH = 10, EXHALE = 1.5; // secondi: un ciclo di respiro e la durata dell'espirazione
  var bubbles = [], last = 0, t0 = 0, running = false, dpr = 1, W = 0, H = 0;

  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(0, Math.round((window.innerWidth - 1280) / 2 + 40));
    H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function spawn(r, scale) {
    var side = Math.random() < 0.5 ? -1 : 1;
    var big = Math.random() < 0.35;
    bubbles.push({
      x: r.left + r.width * (VX + (diver._hx || 0)) + side * r.width * (0.06 + Math.random() * 0.04),
      y: r.top + r.height * (VY + (diver._hy || 0)) + (Math.random() - 0.5) * 6,
      vx: side * (25 + Math.random() * 55) * scale,     // si allargano ai lati del casco
      vy: -(8 + Math.random() * 25) * scale,
      r: (big ? 5 + Math.random() * 6 : 1.5 + Math.random() * 3.5) * scale,
      w: Math.random() * 6.28, ws: 2 + Math.random() * 3,
      max: (110 + Math.random() * 90) * scale
    });
  }
  function draw(b) {
    var squash = b.r > 4 ? 0.62 : 0.9;                 // le bolle grandi sono schiacciate a "fungo"
    var x = b.x + Math.sin(b.w) * b.r * 0.35;
    cx.beginPath();
    cx.ellipse(x, b.y, b.r, b.r * squash, 0, 0, 6.2832);
    cx.fillStyle = 'rgba(184,237,250,0.10)';
    cx.fill();
    cx.lineWidth = Math.max(0.8, b.r * 0.12);
    cx.strokeStyle = 'rgba(200,240,255,0.75)';
    cx.stroke();
    cx.beginPath();
    cx.ellipse(x - b.r * 0.35, b.y - b.r * squash * 0.35, b.r * 0.28, b.r * squash * 0.2, -0.5, 0, 6.2832);
    cx.fillStyle = 'rgba(255,255,255,0.55)';
    cx.fill();
  }
  function frame(ts) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!t0) t0 = ts;
    var dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
    cx.clearRect(0, 0, W, H);
    var r = diver.getBoundingClientRect();
    if (!r.width) return;
    var scale = r.width / 200;
    // espirazione: sbuffo di bolle, poi pausa mentre inspira
    var phase = ((ts - t0) / 1000) % BREATH;
    if (phase < EXHALE) {
      var k = phase < 0.3 ? 60 : phase < 1 ? 38 : 14;   // più forte all'inizio dello sbuffo
      var n = k * dt + Math.random() * 0.5;
      while (n-- >= 1 && bubbles.length < 260) spawn(r, scale);
    }
    for (var i = bubbles.length - 1; i >= 0; i--) {
      var b = bubbles[i];
      b.vx *= Math.pow(0.18, dt);                          // la spinta laterale si smorza
      b.vy = Math.max(-b.max, b.vy - 160 * scale * dt);    // la spinta di galleggiamento le accelera verso l'alto
      b.x += b.vx * dt; b.y += b.vy * dt; b.w += b.ws * dt;
      b.r *= 1 + 0.04 * dt;                                // salendo si espandono un poco
      if (b.y < -30 || b.x < -30 || b.x > W + 30) { bubbles.splice(i, 1); continue; }
      draw(b);
    }
  }
  function check() {
    var on = mq.matches && !document.hidden && getComputedStyle(diver).display !== 'none';
    if (on && !running) { size(); running = true; last = 0; requestAnimationFrame(frame); }
    if (!on && running) { running = false; bubbles = []; cx.clearRect(0, 0, W, H); }
  }
  window.addEventListener('resize', function () { if (running) size(); check(); });
  document.addEventListener('visibilitychange', check);
  if (mq.addEventListener) mq.addEventListener('change', check);
  window.addEventListener('load', check);
  check();
})();

// ---------- Schede tecniche dell'attrezzatura (Chi siamo) ----------
(function () {
  var dlg = document.getElementById('sch-dlg');
  if (!dlg) return;
  var title = dlg.querySelector('[data-sch-title]');
  function open(btn) {
    var k = btn.getAttribute('data-sch');
    Array.prototype.forEach.call(dlg.querySelectorAll('[data-sch-body]'), function (b) { b.hidden = b.getAttribute('data-sch-body') !== k; });
    title.textContent = btn.textContent.trim();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  function close() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  Array.prototype.forEach.call(document.querySelectorAll('[data-sch]'), function (b) { b.addEventListener('click', function () { open(b); }); });
  dlg.querySelector('[data-sch-close]').addEventListener('click', close);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
})();

// ---------- Richiedi un preventivo: modulo in finestra -> WhatsApp precompilato ----------
(function () {
  var dlg = document.getElementById('q-dlg');
  if (!dlg || !dlg.showModal) return;   // senza <dialog> resta il link alla pagina Contatti
  var f = dlg.querySelector('form');
  function msg() {
    var v = function (n) { return (f.elements[n].value || '').trim(); };
    var t = 'Richiesta preventivo dal sito Anfibiasub\n\n';
    t += 'Nome: ' + v('nome') + '\nServizio: ' + v('servizio') + '\n';
    if (v('barca')) t += 'Barca: ' + v('barca') + '\n';
    if (v('posto')) t += 'Porto / posto barca: ' + v('posto') + '\n';
    if (v('data')) { var d = v('data').split('-'); t += 'Data preferita: ' + d[2] + '/' + d[1] + '/' + d[0] + '\n'; }
    if (v('descrizione')) t += '\n' + v('descrizione');
    return t;
  }
  function close() { dlg.close(); }
  Array.prototype.forEach.call(document.querySelectorAll('[data-quote]'), function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); dlg.showModal(); });
  });
  Array.prototype.forEach.call(dlg.querySelectorAll('[data-q-to]'), function (a) {
    a.addEventListener('click', function (e) {
      if (!f.checkValidity()) { e.preventDefault(); f.reportValidity(); return; }
      a.href = 'https://wa.me/' + a.getAttribute('data-q-to') + '?text=' + encodeURIComponent(msg());
      setTimeout(close, 300);
    });
  });
  dlg.querySelector('[data-q-close]').addEventListener('click', close);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
})();

// ---------- "Chiama ora" da PC: finestra con i numeri (sul cellulare resta la chiamata) ----------
(function () {
  var dlg = document.getElementById('c-dlg');
  if (!dlg || !dlg.showModal) return;
  var pc = window.matchMedia('(hover: hover) and (pointer: fine)');
  Array.prototype.forEach.call(document.querySelectorAll('[data-call]'), function (a) {
    a.addEventListener('click', function (e) { if (!pc.matches) return; e.preventDefault(); dlg.showModal(); });
  });
  function close() { dlg.close(); }
  dlg.querySelector('[data-c-close]').addEventListener('click', close);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
})();

// ---------- Sub da PC: video che galleggia in continuo; a 50 m, a fine giro, fa il segno OK ----------
(function () {
  var diver = document.querySelector('.diver');
  var vg = diver && diver.querySelector('.dv-giro'), vo = diver && diver.querySelector('.dv-okv');
  if (!vg || !vo || !vg.canPlayType) return;
  // Safari non mostra la trasparenza dei video webm: lì resta la foto ferma
  var safari = /^((?!chrome|chromium|android|edg).)*safari/i.test(navigator.userAgent);
  if (safari || !vg.canPlayType('video/webm; codecs="vp9"')) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var img = diver.querySelector('img'), line = document.querySelector('.dv-line');
  var D = null, started = false, cur = null, armed = true;
  // posizione di tubo, cima, schermo del polso e casco fotogramma per fotogramma (misurata sui video)
  function apply(rows, t) {
    if (!D || !rows) return;
    var r = rows[Math.min(rows.length - 1, Math.max(0, Math.round(t * 24)))];
    var w = diver.offsetWidth, h = img.offsetHeight, st = diver.style;
    st.setProperty('--hosex', (r[0] * w).toFixed(1) + 'px');
    st.setProperty('--sdx', (r[2] * w).toFixed(1) + 'px');
    st.setProperty('--sdy', (r[3] * h).toFixed(1) + 'px');
    st.setProperty('--sop', r[4]);
    st.setProperty('--hx', (r[5] * w).toFixed(1) + 'px');
    st.setProperty('--hy', (r[6] * h).toFixed(1) + 'px');
    diver._hx = r[5]; diver._hy = r[6];
    if (line) line.style.transform = 'translateX(' + (r[1] * w).toFixed(1) + 'px)';
  }
  function follow(v, key) {
    if (v.requestVideoFrameCallback) {
      var cb = function (now, m) { if (cur === v) apply(D && D[key], m.mediaTime); v.requestVideoFrameCallback(cb); };
      v.requestVideoFrameCallback(cb);
    } else {
      (function tick() { if (cur === v && !v.paused) apply(D && D[key], v.currentTime); requestAnimationFrame(tick); })();
    }
  }
  // il passaggio da un video all'altro avviene solo quando il nuovo ha già disegnato il primo fotogramma
  function whenFrame(v, cb) {
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(function () { cb(); });
    else v.addEventListener('playing', function h() { v.removeEventListener('playing', h); setTimeout(cb, 40); });
  }
  function show(v) {
    vg.classList.toggle('on', v === vg); vo.classList.toggle('on', v === vo);
    diver.classList.add('has-vid'); cur = v;
  }
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function start() {
    started = true;
    fetch('/js/sub-dati.json').then(function (r) { return r.json(); }).then(function (d) { D = d; }).catch(function () {});
    vg.loop = true; vg.preload = 'auto'; vg.src = '/img/sub-giro-a.webm';
    follow(vg, 'sub-giro-a'); follow(vo, 'sub-ok-a');
    whenFrame(vg, function () { show(vg); });
    play(vg);
  }
  // fine del giro con la richiesta di OK: parte il segno OK (stessa posa, nessuno stacco)
  vg.addEventListener('ended', function () {
    try { vo.currentTime = 0; } catch (e) {}
    whenFrame(vo, function () { show(vo); });
    play(vo);
  });
  vo.addEventListener('ended', function () {
    vg.loop = true;
    try { vg.currentTime = 0; } catch (e) {}
    whenFrame(vg, function () { show(vg); });
    play(vg);
  });
  diver.okAt = function (depth) {
    if (!diver.offsetWidth) { if (cur) cur.pause(); return; }
    if (!started) { if (window.__ready) start(); return; }
    if (cur && cur.paused && !cur.ended) play(cur);
    if (depth > 20 && !vo.src) { vo.preload = 'auto'; vo.src = '/img/sub-ok-a.webm'; } // il segno OK si scarica in anticipo
    if (depth < 45) armed = true;                       // risalito: al prossimo arrivo sul fondo lo rifà
    if (depth >= 49.9 && armed && cur === vg) {
      armed = false;
      if (vo.readyState >= 2) {                         // pronto: l'OK parte subito, senza aspettare la fine del giro
        vg.loop = true;
        try { vo.currentTime = 0; } catch (e) {}
        whenFrame(vo, function () { show(vo); vg.pause(); });
        play(vo);
      } else vg.loop = false;                           // non ancora scaricato: parte alla fine del giro
    }
  };
  document.addEventListener('visibilitychange', function () { if (document.hidden && cur) cur.pause(); else if (cur && diver.offsetWidth) play(cur); });
})();

// ---------- PC: in fondo alla discesa la luce si muove sul relitto ----------
(function () {
  var v = document.querySelector('.ab-rel');
  if (!v || !v.canPlayType) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var loaded = false;
  window.relittoAt = function (depth) {
    if (!v.offsetWidth) return;
    if (depth > 30 && !loaded) { loaded = true; v.preload = 'auto'; v.src = v.canPlayType('video/mp4; codecs="avc1.42E01E"') ? '/img/relitto-3.mp4' : '/img/relitto-3.webm'; }
    if (!loaded) return;
    if (depth > 36) { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
    else if (!v.paused) v.pause();
  };
})();

// ---------- Cellulare: in fondo alla home il sub fa OK ----------
// Il video si scarica in anticipo; parte appena la caviglia del sub entra nello schermo, direttamente dal punto
// in cui alza la mano (nel video l'OK arriva verso l'undicesimo secondo). Uscito dallo schermo si ferma e si riarma.
(function () {
  var box = document.querySelector('.m-ok'), v = box && box.querySelector('video');
  if (!v) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var OK_DA = 10.2;      // secondo del video da cui partire: un attimo prima che alzi la mano
  var CAVIGLIA = 0.8;    // altezza della caviglia nel riquadro (0 = sopra, 1 = sotto)
  var carico = false, partito = false;
  function carica() {
    if (carico) return; carico = true;
    v.preload = 'auto';
    v.src = v.canPlayType('video/mp4; codecs="avc1.42E01E"') ? '/img/sub-mobile-3.mp4' : '/img/sub-mobile-3.webm';
    v.addEventListener('loadedmetadata', function () { if (!partito) { try { v.currentTime = OK_DA; } catch (e) {} } }, { once: true });
    v.load();
  }
  function play() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function controlla() {
    if (!box.offsetWidth) return;
    var r = box.getBoundingClientRect(), h = innerHeight;
    if (r.top < h + 1500 && r.bottom > -1500) carica();                    // vicino: scarico il video
    var caviglia = r.top + r.height * CAVIGLIA;
    if (!partito && caviglia <= h && r.bottom > 0) {                        // la caviglia è nello schermo: via
      partito = true;
      try { v.currentTime = OK_DA; } catch (e) {}
      play();
    } else if (partito && (r.bottom < 0 || r.top > h)) {                    // uscito dallo schermo: fermo e riarmo
      partito = false; v.pause();
      try { v.currentTime = OK_DA; } catch (e) {}
    } else if (partito && v.paused) play();                                 // iPhone in risparmio energetico: riprova
  }
  var att = false;
  function presto() { if (!att) { att = true; requestAnimationFrame(function () { att = false; controlla(); }); } }
  window.addEventListener('scroll', presto, { passive: true });
  window.addEventListener('resize', presto, { passive: true });
  window.addEventListener('touchstart', presto, { passive: true });
  document.addEventListener('visibilitychange', function () { if (document.hidden) v.pause(); else presto(); });
  controlla();
})();

// ---------- Rifiniture: comparsa morbida dei riquadri e intestazione compatta quando si scende ----------
(function () {
  var head = document.querySelector('.site-header');
  if (head) {
    var on = false;
    var chk = function () { var s = window.scrollY > 60; if (s !== on) { on = s; head.classList.toggle('scrolled', s); } };
    window.addEventListener('scroll', chk, { passive: true }); chk();
  }
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els = document.querySelectorAll('.card,.person,.module,.contact,.fasi-list li,.tbl-scroll,.mb-frame,.gb-frame,.cam-card,.detail,.game-card');
  if (!els.length) return;
  document.documentElement.classList.add('rv-on');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (en.isIntersecting) {
        var el = en.target, sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.transitionDelay = Math.min(sib, 5) * 70 + 'ms';   // in fila uno dopo l'altro
        el.classList.add('in'); io.unobserve(el);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  Array.prototype.forEach.call(els, function (el) { el.classList.add('rv'); io.observe(el); });
})();
