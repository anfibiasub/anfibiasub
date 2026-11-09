// Area clienti: piccoli comportamenti (niente script inline, per la sicurezza)
(function () {
  // Selettore barca
  document.querySelectorAll('[data-autosubmit]').forEach(function (el) {
    el.addEventListener('change', function () { el.form.submit(); });
  });

  // Conferma prima di eliminare
  document.querySelectorAll('form[data-confirm]').forEach(function (f) {
    f.addEventListener('submit', function (e) { if (!confirm(f.getAttribute('data-confirm'))) e.preventDefault(); });
  });

  var abs = function (u) { return new URL(u, location.origin).href; };

  // Copia link
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = abs(b.getAttribute('data-copy'));
      var done = function () { var t = b.textContent; b.textContent = b.getAttribute('data-done') || 'OK'; setTimeout(function () { b.textContent = t; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('', url); });
      else prompt('', url);
    });
  });

  // Accessi: mostra/nascondi password e copia testo
  document.querySelectorAll('[data-reveal]').forEach(function (b) {
    b.addEventListener('click', function () {
      var i = document.getElementById(b.getAttribute('data-reveal'));
      var show = i.type === 'password';
      i.type = show ? 'text' : 'password';
      b.textContent = show ? 'Nascondi' : 'Mostra';
    });
  });
  document.querySelectorAll('[data-copytext]').forEach(function (b) {
    b.addEventListener('click', function () {
      var el = document.getElementById(b.getAttribute('data-copytext'));
      var v = el.value !== undefined ? el.value : el.textContent;
      var done = function () { var t = b.textContent; b.textContent = 'Copiato'; setTimeout(function () { b.textContent = t; }, 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(v).then(done, function () { prompt('', v); });
      else prompt('', v);
    });
  });

  // Condividi: menu di condivisione del telefono, altrimenti WhatsApp con il link
  document.querySelectorAll('[data-share]').forEach(function (a) {
    var url = abs(a.getAttribute('data-url'));
    a.href = a.href + encodeURIComponent(url);
    a.addEventListener('click', function (e) {
      if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        e.preventDefault();
        navigator.share({ title: a.getAttribute('data-title') || 'Anfibiasub', url: url }).catch(function () {});
      }
    });
  });

  // Storico interventi: ricerca per intervallo di date (dal/al) e tipo, e "Carica altri 10"
  document.querySelectorAll('[data-jobs]').forEach(function (box) {
    var jobs = [].slice.call(box.querySelectorAll('.job'));
    var da = box.querySelector('[data-job-from]'), al = box.querySelector('[data-job-to]'), tipo = box.querySelector('[data-job-tipo]');
    var none = box.querySelector('[data-job-none]'), more = box.querySelector('[data-job-more]');
    function hidden() { return jobs.filter(function (j) { return j.classList.contains('job-more'); }); }
    function filter() {
      var a = da ? da.value : '', b = al ? al.value : '', t = tipo ? tipo.value : '';
      if (a && b && a > b) { var x = a; a = b; b = x; }               // date al contrario: le scambio
      if (da && al) { al.min = da.value || ''; da.max = al.value || ''; }
      var on = a || b || t, n = 0;
      jobs.forEach(function (j) {
        var d = j.getAttribute('data-date') || '';
        var ok = (!a || d >= a) && (!b || d <= b) && (!t || j.getAttribute('data-tipo') === t);
        if (on) { if (ok) { j.removeAttribute('data-off'); j.style.display = 'block'; n++; } else { j.setAttribute('data-off', ''); j.style.display = ''; } }
        else { j.removeAttribute('data-off'); j.style.display = ''; }
      });
      if (none) none.hidden = !on || n > 0;
      if (more) more.hidden = on || !hidden().length;
    }
    [da, al].forEach(function (q) { if (q) { q.addEventListener('input', filter); q.addEventListener('change', filter); } });
    if (tipo) tipo.addEventListener('change', filter);
    if (more) more.addEventListener('click', function () {
      hidden().slice(0, 10).forEach(function (j) { j.classList.remove('job-more'); });
      more.hidden = !hidden().length;
    });
    // dopo un salvataggio si torna su #pulizia-N: apro quell'intervento
    var h = location.hash && box.querySelector(location.hash.replace(/[^#\w-]/g, ''));
    if (h && h.classList.contains('job')) { h.classList.remove('job-more'); h.open = true; h.scrollIntoView({ block: 'start' }); }
  });

  // Foto di un intervento (admin): seleziona, poi un comando per tutte
  document.querySelectorAll('[data-pd]').forEach(function (f) {
    var boxes = [].slice.call(f.querySelectorAll('input[name=ids]'));
    var btns = [].slice.call(f.querySelectorAll('button[name=azione]'));
    var info = f.querySelector('[data-pd-count]');
    function upd() {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      btns.forEach(function (b) { b.disabled = !n; });
      boxes.forEach(function (b) { var fg = b.closest('.pd-fig'); if (fg) fg.classList.toggle('is-sel', b.checked); });
      if (info) info.textContent = n ? info.getAttribute('data-some').replace('{n}', n) : info.getAttribute('data-none');
    }
    boxes.forEach(function (b) { b.addEventListener('change', upd); });
    f.addEventListener('submit', function (e) {
      var s = e.submitter;
      if (s && s.getAttribute('data-ask') && !confirm(s.getAttribute('data-ask'))) e.preventDefault();
    });
    upd();
  });

  // Menu da telefono: si apre e si chiude con il pulsante "Menu"
  var mb = document.querySelector('[data-app-menu]'), mn = document.getElementById('app-nav');
  if (mb && mn) {
    mb.addEventListener('click', function () {
      var open = !mn.classList.contains('open');
      mn.classList.toggle('open', open);
      mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mn.classList.contains('open')) mb.click(); });
  }

  // Scelta foto: pulsante uguale agli altri e, sotto, quante foto sono state scelte
  var LG = (document.documentElement.lang || 'it').slice(0, 2);
  var FT = {
    it: ['Scegli foto', '1 foto scelta', '{n} foto scelte'], en: ['Choose photos', '1 photo chosen', '{n} photos chosen'],
    es: ['Elegir fotos', '1 foto elegida', '{n} fotos elegidas'], de: ['Fotos auswählen', '1 Foto ausgewählt', '{n} Fotos ausgewählt'],
  }[LG] || ['Scegli foto', '1 foto scelta', '{n} foto scelte'];
  document.querySelectorAll('input[type=file]').forEach(function (inp) {
    var box = document.createElement('span'); box.className = 'file-pick';
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-sm file-btn';
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="m21 17-5-5-8 8"/></svg><span></span>';
    b.querySelector('span').textContent = FT[0];
    var info = document.createElement('span'); info.className = 'file-info'; info.setAttribute('aria-live', 'polite');
    inp.classList.add('file-hidden'); inp.tabIndex = -1;
    inp.parentNode.insertBefore(box, inp.nextSibling); box.appendChild(b); box.appendChild(info);
    b.addEventListener('click', function () { inp.click(); });
    inp.addEventListener('change', function () {
      var n = inp.files ? inp.files.length : 0;
      info.textContent = n === 0 ? '' : n === 1 ? FT[1] : FT[2].replace('{n}', n);
    });
  });

  // Mappe (Leaflet + OpenStreetMap)
  if (window.L) {
    var LOANO = [44.1286, 8.2589];
    document.querySelectorAll('[data-map]').forEach(function (el) {
      var lat = parseFloat(el.getAttribute('data-lat')), lng = parseFloat(el.getAttribute('data-lng'));
      var has = !isNaN(lat) && !isNaN(lng);
      var stat = el.hasAttribute('data-static');
      var map = L.map(el, { zoomControl: !stat, dragging: !stat, scrollWheelZoom: false, attributionControl: true })
        .setView(has ? [lat, lng] : LOANO, has ? 17 : 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
      var icon = L.divIcon({ className: '', html: '<svg width="34" height="34" viewBox="0 0 24 24" fill="#FF8A3D" stroke="#050E1A" stroke-width="1"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>', iconSize: [34, 34], iconAnchor: [17, 32] });
      var marker = has ? L.marker([lat, lng], { icon: icon }).addTo(map) : null;
      if (!el.hasAttribute('data-edit')) return;
      var latIn = document.querySelector('[data-lat-input]'), lngIn = document.querySelector('[data-lng-input]');
      var coords = document.querySelector('[data-coords]'), save = document.querySelector('[data-save-pos]');
      function set(p) {
        if (marker) marker.setLatLng(p); else marker = L.marker(p, { icon: icon }).addTo(map);
        latIn.value = p.lat.toFixed(6); lngIn.value = p.lng.toFixed(6);
        coords.textContent = p.lat.toFixed(5) + ', ' + p.lng.toFixed(5);
        save.disabled = false;
      }
      map.on('click', function (e) { set(e.latlng); });
      var geo = document.querySelector('[data-geolocate]');
      if (geo) geo.addEventListener('click', function () {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(function (pos) {
          var p = L.latLng(pos.coords.latitude, pos.coords.longitude);
          map.setView(p, 18); set(p);
        }, function (err) { alert(err.message); }, { enableHighAccuracy: true, timeout: 15000 });
      });
    });
  }

  // Visore foto: tocchi una foto e si apre grande; frecce (o scorrimento col dito) per sfogliare, X per chiudere.
  // Sfoglia tutte le foto dello stesso intervento (Prima e Dopo, anche quelle in "Mostra tutte").
  (function () {
    var LBT = {
      it: ['Chiudi', 'Foto precedente', 'Foto successiva'], en: ['Close', 'Previous photo', 'Next photo'],
      es: ['Cerrar', 'Foto anterior', 'Foto siguiente'], de: ['Schließen', 'Vorheriges Foto', 'Nächstes Foto']
    }[(document.documentElement.lang || 'it').slice(0, 2)] || ['Chiudi', 'Foto precedente', 'Foto successiva'];
    var box, img, cap, list = [], at = 0, sx = null, sy = 0, aperto = false;
    function ico(d) { return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; }
    function crea() {
      box = document.createElement('div');
      box.className = 'lb'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.hidden = true;
      box.innerHTML = '<button type="button" class="lb-btn lb-x" aria-label="' + LBT[0] + '">' + ico('M6 6l12 12M18 6L6 18') + '</button>' +
        '<button type="button" class="lb-btn lb-prev" aria-label="' + LBT[1] + '">' + ico('M15 5l-7 7 7 7') + '</button>' +
        '<figure class="lb-fig"><img alt=""><figcaption class="lb-cap"></figcaption></figure>' +
        '<button type="button" class="lb-btn lb-next" aria-label="' + LBT[2] + '">' + ico('M9 5l7 7-7 7') + '</button>';
      document.body.appendChild(box);
      img = box.querySelector('img'); cap = box.querySelector('.lb-cap');
      box.querySelector('.lb-x').addEventListener('click', function () { chiudi(); });
      box.querySelector('.lb-prev').addEventListener('click', function () { vai(-1); });
      box.querySelector('.lb-next').addEventListener('click', function () { vai(1); });
      box.addEventListener('click', function (e) { if (e.target === box || e.target.classList.contains('lb-fig')) chiudi(); });
      box.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } else sx = null; }, { passive: true });
      box.addEventListener('touchend', function (e) {
        if (sx === null) return;
        var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) vai(dx < 0 ? 1 : -1);
        else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) chiudi();
      });
    }
    function mostra() {
      var a = list[at];
      img.src = a.getAttribute('href');
      img.alt = (a.querySelector('img') || {}).alt || '';
      cap.textContent = a.getAttribute('data-cap') || '';
      var multi = list.length > 1;
      box.querySelector('.lb-prev').hidden = !multi; box.querySelector('.lb-next').hidden = !multi;
      [at - 1, at + 1].forEach(function (k) { if (list[k]) { var p = new Image(); p.src = list[k].getAttribute('href'); } }); // precarica le vicine
    }
    function vai(d) { if (list.length < 2) return; at = (at + d + list.length) % list.length; mostra(); }
    function apri(a) {
      if (!box) crea();
      var g = a.closest('.pd') || a.closest('[data-lb-group]');
      list = g ? [].slice.call(g.querySelectorAll('a[data-lb]')) : [a];
      at = Math.max(0, list.indexOf(a));
      mostra(); box.hidden = false; aperto = true;
      document.documentElement.classList.add('lb-on');
      try { history.pushState({ lb: 1 }, ''); } catch (e) {}   // il tasto Indietro del telefono chiude il visore
      box.querySelector('.lb-x').focus({ preventScroll: true });
    }
    function chiudi(daIndietro) {
      if (!aperto) return;
      aperto = false; box.hidden = true; img.removeAttribute('src');
      document.documentElement.classList.remove('lb-on');
      if (!daIndietro && history.state && history.state.lb) history.back();
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-lb]');
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault(); apri(a);
    });
    window.addEventListener('popstate', function () { chiudi(true); });
    document.addEventListener('keydown', function (e) {
      if (!aperto) return;
      if (e.key === 'Escape') chiudi(); else if (e.key === 'ArrowRight') vai(1); else if (e.key === 'ArrowLeft') vai(-1);
    });
  })();
})();
