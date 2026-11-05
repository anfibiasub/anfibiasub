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
})();
