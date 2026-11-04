// Pulsante "Installa l'app" in home.
// Android / PC (Chrome, Edge, Samsung): finestra di installazione del browser con un tocco.
// iPhone / iPad: Safari non lo permette, quindi si apre una guida illustrata (Condividi → Aggiungi alla schermata Home).
(function () {
  var btn = document.getElementById('inst-btn');
  var guide = document.getElementById('inst-guide');
  if (!btn) return;
  var installed = navigator.standalone === true ||
    matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)').matches;
  if (installed) return;
  var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

  if (ios) {
    if (!guide) return;
    btn.hidden = false;
    btn.addEventListener('click', function () { guide.hidden = false; });
    guide.addEventListener('click', function (e) {
      if (e.target === guide || e.target.closest('[data-ig-close]')) guide.hidden = true;
    });
    return;
  }

  var ask = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();            // niente barra automatica: uso il mio pulsante
    ask = e;
    btn.hidden = false;
  });
  btn.addEventListener('click', function () {
    if (!ask) return;
    ask.prompt();
    ask.userChoice.then(function () { ask = null; btn.hidden = true; }, function () {});
  });
  window.addEventListener('appinstalled', function () { ask = null; btn.hidden = true; });
})();
