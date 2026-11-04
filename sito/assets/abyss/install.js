// Pulsante "Installa ABYSS" sulla schermata iniziale.
// Android / PC (Chrome, Edge, Samsung): finestra di installazione del browser con un tocco.
// iPhone / iPad: Safari non lo permette, quindi mostro una guida illustrata (Condividi → Aggiungi alla schermata Home).
export function initInstall() {
  const btn = document.getElementById('ab-install');
  const guide = document.getElementById('ab-iosguide');
  if (!btn) return;
  const installed = navigator.standalone === true ||
    matchMedia('(display-mode: fullscreen), (display-mode: standalone), (display-mode: minimal-ui)').matches;
  if (installed) return;

  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  let prompt = null;

  if (ios && guide) {
    btn.hidden = false;
    const open = (v) => { guide.hidden = !v; };
    btn.addEventListener('click', () => open(true));
    guide.addEventListener('click', (e) => { if (e.target === guide || e.target.closest('[data-ig-close]')) open(false); });
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();          // niente barra automatica del browser: uso il mio pulsante
    prompt = e;
    btn.hidden = false;
  });
  btn.addEventListener('click', async () => {
    if (!prompt) return;
    prompt.prompt();
    try { await prompt.userChoice; } catch (_) { /* niente */ }
    prompt = null;
    btn.hidden = true;
  });
  window.addEventListener('appinstalled', () => { btn.hidden = true; prompt = null; });
}
