# Genera il sito pubblico statico (italiano, inglese, spagnolo, tedesco).
#
#   python3 sito/build.py          -> versione di prova in public/ (servita dall'app su Railway)
#   python3 sito/build.py --prod   -> versione per anfibiasub.it in dist-hostgator/ (da caricare su HostGator)
#
import os, sys, shutil, html, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from contenuti import *  # noqa
from testi_pagine import TX
from testi_extra import SOS, GB_TITLE, QUOTE, CALL
from fasi_servizi import FASI_LABEL, FASI_TITLE, FASI_GEN, FASI_LEAD
from schede_attrezzatura import SCHEDE, SCHEDE_POS, SCHEDE_UI, FONTI
from porto_loano import PORTO_CENTER, PORTO_TITLE, PORTO_LEAD, PORTO_MORE, PORTO_PUNTI
import json as _json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROD = '--prod' in sys.argv
OUT = os.path.join(ROOT, 'dist-hostgator' if PROD else 'public')
SITE_URL = 'https://www.anfibiasub.it'
# Indirizzo dell'area clienti: in prova sta sullo stesso server, online sul sottodominio
AREA = 'https://clienti.anfibiasub.it/area/login' if PROD else '/area/login'

# ---------------- app installabile (pulsante "Installa l'app" in home) ----------------
APP_NAME = 'Anfibiasub'   # nome dell'app sul telefono: cambialo qui quando cambia il nome del sito
INST = {
    'btn': {'it': "Installa l'app", 'en': 'Install the app', 'es': 'Instalar la app', 'de': 'App installieren'},
    'title': {'it': "Metti l'app sulla schermata Home", 'en': 'Add the app to your Home Screen', 'es': 'Añade la app a la pantalla de inicio', 'de': 'App zum Home-Bildschirm hinzufügen'},
    's1': {'it': 'Tocca <b>Condividi</b> nella barra di Safari (se non lo vedi, tocca prima <b>···</b>)',
           'en': "Tap <b>Share</b> in the Safari bar (if you can't see it, tap <b>···</b> first)",
           'es': 'Toca <b>Compartir</b> en la barra de Safari (si no lo ves, toca antes <b>···</b>)',
           'de': 'Tippe in der Safari-Leiste auf <b>Teilen</b> (falls nicht sichtbar, zuerst auf <b>···</b>)'},
    's2': {'it': 'Scorri e scegli <b>Aggiungi alla schermata Home</b>, poi <b>Aggiungi</b>',
           'en': 'Scroll and choose <b>Add to Home Screen</b>, then <b>Add</b>',
           'es': 'Desplázate y elige <b>Añadir a pantalla de inicio</b>, luego <b>Añadir</b>',
           'de': 'Nach unten scrollen, <b>Zum Home-Bildschirm</b> wählen, dann <b>Hinzufügen</b>'},
    's3': {'it': "Apri l'app dall'icona: sito, area clienti e la tua barca a portata di tocco",
           'en': 'Open the app from the icon: website, customer area and your boat one tap away',
           'es': 'Abre la app desde el icono: web, área de clientes y tu barco a un toque',
           'de': 'App über das Symbol öffnen: Website, Kundenbereich und dein Boot mit einem Tipp'},
    'note': {'it': 'È gratis e non occupa spazio.', 'en': "It's free and takes no space.", 'es': 'Es gratis y no ocupa espacio.', 'de': 'Kostenlos und braucht keinen Speicherplatz.'},
    'ok': {'it': 'Ho capito', 'en': 'Got it', 'es': 'Entendido', 'de': 'Verstanden'},
}
INST_ICON = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M12 7v7M9 11l3 3 3-3M10 18h4"/></svg>'


def inst_btn(lang):
    return f'<button class="inst-btn" type="button" id="inst-btn" hidden>{INST_ICON}<span class="inst-l">{INST["btn"][lang]}</span><span class="inst-s" aria-hidden="true">App</span></button>\n'


def inst_guide(lang):
    T = {k: v[lang] for k, v in INST.items()}
    share = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 10H6v11h12V10h-2"/><path d="M12 3v12M8.5 6.5 12 3l3.5 3.5"/></svg>'
    plus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><path d="M12 8v8M8 12h8"/></svg>'
    return f'''<div id="inst-guide" class="ig" hidden role="dialog" aria-modal="true" aria-labelledby="ig-t">
<div class="ig-box">
<h2 id="ig-t">{T["title"]}</h2>
<ol class="ig-steps">
<li><span class="ig-ico">{share}</span><span>{T["s1"]}</span></li>
<li><span class="ig-ico">{plus}</span><span>{T["s2"]}</span></li>
<li><span class="ig-ico ig-app"><img src="/icona-192.png" alt="" width="40" height="40"></span><span>{T["s3"]}</span></li>
</ol>
<p class="ig-note">{T["note"]}</p>
<button class="btn ig-ok" type="button" data-ig-close>{T["ok"]}</button>
</div>
<div class="ig-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M6 13l6 6 6-6"/></svg></div>
</div>
'''


def inst_manifests():
    # percorsi relativi al dominio: se il sito cambia indirizzo il manifest resta valido
    # (chi ha installato l'app dal vecchio dominio dovrà reinstallarla dal nuovo)
    for lang in LANGS:
        with open(os.path.join(OUT, f'sito-{lang}.webmanifest'), 'w', encoding='utf-8') as f:
            _json.dump({'id': '/', 'name': APP_NAME, 'short_name': APP_NAME, 'start_url': url('home', lang), 'scope': '/', 'display': 'standalone', 'lang': lang,
                        'background_color': '#050E1A', 'theme_color': '#050E1A',
                        'icons': [{'src': '/icona-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any maskable'},
                                  {'src': '/icona-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any maskable'}]}, f, ensure_ascii=False)

e = html.escape
import hashlib
_A = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets')
import re as _re
_IMG = os.path.join(_A, 'img')
_IMGV = {}
def imgv(m):
    # aggiunge ?v=<impronta> agli indirizzi /img/...: se cambio un'immagine col nome uguale, i telefoni non tengono la vecchia in cache
    n = m.group(1)
    if n not in _IMGV:
        f = os.path.join(_IMG, n)
        _IMGV[n] = hashlib.md5(open(f, 'rb').read()).hexdigest()[:6] if os.path.isfile(f) else ''
    return f'/img/{n}?v={_IMGV[n]}' if _IMGV[n] else m.group(0)
def bust(t):
    return _re.sub(r'/img/([\w./-]+?\.(?:webp|png|jpe?g|svg|gif))(?![\w?])', imgv, t)
VER = hashlib.md5(b''.join(open(os.path.join(_A, f), 'rb').read() for f in ('css/style.css', 'js/main.js', 'js/utilita.js'))
                  + b''.join(open(os.path.join(_IMG, f), 'rb').read() for f in sorted(os.listdir(_IMG)) if os.path.isfile(os.path.join(_IMG, f)))).hexdigest()[:8]
INST_V = hashlib.md5(b''.join(open(os.path.join(_A, f), 'rb').read() for f in ('css/installa.css', 'js/installa.js'))).hexdigest()[:8]
ARROW = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
WA_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>'
CHEVRON = '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>'
Q_ICON = lambda d: f'<svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{d}</svg>'  # noqa: E731
QI_AREA = Q_ICON('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>')
QI_METEO = Q_ICON('<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h16a3 3 0 1 1-3 3"/><path d="M3 16h7"/>')
PIN = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.6"/></svg>'
# Utilità: chiave inglese
QI_UTIL = Q_ICON('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8V20h3.2l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.5-.6-.6-2.5z"/>')
QI_GPS = Q_ICON('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.6"/>')
BEACON = '<span class="beacon" aria-hidden="true"><span class="bc-ray"></span><span class="bc-dome"></span><span class="bc-base"></span></span>'
MENU = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'


# voce di menu del minigioco ABYSS (pagina in ogni lingua del sito)
# tasto del gioco nella pagina Utilità (solo cellulare): titolo, sottotitolo, pulsante
GAME_CARD = {'it': ('Gioco 3D', 'Il relitto dimenticato', 'GIOCA'),
             'en': ('3D game', 'The forgotten wreck', 'PLAY'),
             'es': ('Juego 3D', 'El pecio olvidado', 'JUGAR'),
             'de': ('3D-Spiel', 'Das vergessene Wrack', 'SPIELEN')}
GAME_LABEL = {'it': 'ABYSS · il gioco 3D', 'en': 'ABYSS · 3D game', 'es': 'ABYSS · juego 3D', 'de': 'ABYSS · 3D-Spiel'}


def abyss_url(lang):
    # pagina del gioco ABYSS nella lingua scelta
    return '/abyss.html' if lang == 'it' else f'/{lang}/abyss.html'


def url(key, lang, anchor=''):
    f = PAGES[key][lang]
    f = '/' + (f[:-len('index.html')] if f.endswith('index.html') else f)
    return f + (('#' + anchor) if anchor else '')


def tx(lang, key):
    return TX[key][lang]


def area_url(lang):
    return AREA + ('' if lang == 'it' else f'?lang={lang}')


def flag(code, w=22):
    return f'<img class="flag" src="/img/flags/{code}.svg" alt="" width="{w}" height="{round(w * 2 / 3)}">'


def header(cur, lang, overlay):
    U = UI[lang]
    subs = {
        'servizi': ('all_srv', [(x['id'], x[lang]['t']) for x in SERVIZI]),
        'lavori': ('all_lav', [(x['id'], x[lang]['toc']) for x in LAVORI]),
        'utilita': ('all_uti', [(a, t[lang]) for a, t in UTIL]),
    }
    links = ''
    for k, t in U['nav']:
        cur_attr = ' aria-current="page"' if k == cur else ''
        if k not in subs:
            links += f'<a href="{url(k, lang)}"{cur_attr}>{t}</a>'
            continue
        all_key, sub = subs[k]
        items = f'<a class="dd-all" href="{url(k, lang)}">{tx(lang, all_key)}</a>' + ''.join(f'<a href="{url(k, lang, a)}">{e(b)}</a>' for a, b in sub)
        if k == 'utilita':
            items += f'<a class="dd-game" href="{abyss_url(lang)}">{GAME_LABEL[lang]}</a>'
        links += (f'<div class="dd"><button class="dd-btn" type="button" aria-expanded="false" aria-haspopup="true"{cur_attr.replace("page", "true")}>{t}{CHEVRON}</button>'
                  f'<div class="dd-menu">{items}</div></div>')
    cur_l = ' aria-current="true"'
    langs = ''.join(f'<a href="{url(cur, l)}" lang="{l}" hreflang="{l}"{cur_l if l == lang else ""}>{flag(l)}{LANG_NAMES[l]}</a>' for l in LANGS)
    lang_dd = (f'<div class="dd dd-lang"><button class="dd-btn" type="button" aria-expanded="false" aria-haspopup="true" aria-label="{U["lang_label"]}: {LANG_NAMES[lang]}">'
               f'{flag(lang)}{lang.upper()}{CHEVRON}</button><div class="dd-menu">{langs}</div></div>')
    return f'''<a class="skip" href="#main">{U["skip"]}</a>
<header class="site-header{'' if overlay else ' solid'}">
<div class="wrap nav-row">
<a class="logo" href="{url('home', lang)}" aria-label="Anfibiasub, home">
<img class="logo-img" src="/img/logo-libero-160.webp" alt="" width="64" height="64">
<span class="logo-txt"><span class="logo-name">ANFIBIA<span class="hl">SUB</span></span><span class="logo-sub">{U["tagline"]}</span></span>
</a>
{inst_btn(lang) if cur == 'home' else ''}<a class="btn nav-cta" data-quote href="{url('contatti', lang)}">{U["quote"]}</a>
<button class="menu-btn" type="button" aria-label="{U["menu_open"]}" aria-expanded="false" aria-controls="nav">{MENU}</button>
<nav class="nav" id="nav" aria-label="Menu">
{links}
<a class="nav-lock" href="{area_url(lang)}">{LOCK}{U["area"]}</a>
{lang_dd}
<button class="nav-sos" type="button" data-sos>{PIN}{SOS[lang]["btn"]}</button>
<a class="btn nav-btn-mob" data-quote href="{url('contatti', lang)}">{U["quote"]}</a>
</nav>
</div>
<nav class="quick wrap" aria-label="{U['area']}">
<a class="q-tile q-area" href="{area_url(lang)}">{QI_AREA}<strong>{tx(lang, 'q_area')[0]}</strong><span>{tx(lang, 'q_area')[1]}</span></a>
<a class="q-tile q-help" href="{WA}" target="_blank" rel="noopener">{WA_ICON}<strong>{tx(lang, 'q_help')[0]}</strong><span>{tx(lang, 'q_help')[1]}</span></a>
<a class="q-tile" href="{url('utilita', lang)}">{QI_UTIL}<strong>{tx(lang, 'q_util')[0]}</strong><span>{tx(lang, 'q_util')[1]}</span></a>
<button class="q-tile q-sos" type="button" data-sos>{QI_GPS}<strong>{SOS[lang]["btn"]}</strong></button>
</nav>
</header>'''


DEPTH_LABEL = {'it': 'PROFONDITÀ', 'en': 'DEPTH', 'es': 'PROFUNDIDAD', 'de': 'TIEFE'}


SHALLOW = {'chi', 'contatti'}  # pagine corte: discesa fino a 30 m, senza relitto
FIXED = {'contatti'}  # pagina troppo corta: il sub resta fermo a 1 m, l'acqua si muove sempre


def depth_bg(lang, key=''):
    """Sfondo da PC: dalla superficie al relitto mentre si scorre, con profondimetro digitale 0-50 m."""
    return f'''<div class="abyss-bg{' is-shallow' if key in SHALLOW else ''}{' is-fixed' if key in FIXED else ''}" aria-hidden="true" data-max="{30 if key in SHALLOW else 50}">{'' if key == 'home' else '<video class="ab-surf" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>'}<i class="ab-l"></i><i class="ab-r">{'' if key in SHALLOW else '<video class="ab-rel" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>'}</i><span class="ab-veil"></span></div>
<span class="dv-line" aria-hidden="true"></span><div class="diver" aria-hidden="true"><span class="dv-hose"></span><span class="dv-bub"></span><span class="dv-rope"></span><span class="dv-rope2"></span><img src="/img/sub-ots.webp" alt="" width="602" height="1672" loading="lazy"><video class="dv-v dv-giro" muted playsinline preload="none" aria-hidden="true" tabindex="-1"></video><video class="dv-v dv-okv" muted playsinline preload="none" aria-hidden="true" tabindex="-1"></video><span class="dv-lamp"></span><span class="dv-scr"><b data-depth>0.0</b><small>m</small></span></div>'''


def sos_dialog(lang):
    S = SOS[lang]
    return f'''<dialog class="sos-dlg" id="sos-dlg" aria-labelledby="sos-t" data-searching="{e(S['searching'])}" data-nopos="{e(S['nopos'])}" data-acc="{e(S['acc'])}">
<div class="sos-head">{PIN}<h2 id="sos-t">{S['title']}</h2></div>
<p>{S['text']}</p>
<div class="sos-pos"><span>{S['pos']}</span><strong data-sos-pos>{S['searching']}</strong></div>
<div class="sos-btns">
<a class="sos-go" data-sos-to="393470119832" href="https://wa.me/393470119832" target="_blank" rel="noopener">{WA_ICON}{S['to_f']}</a>
<a class="sos-go" data-sos-to="393470387290" href="https://wa.me/393470387290" target="_blank" rel="noopener">{WA_ICON}{S['to_s']}</a>
<button class="sos-no" type="button" data-sos-close>{S['cancel']}</button>
</div>
</dialog>'''


def quote_dialog(lang):
    Q = QUOTE[lang]
    opts = ''.join(f'<option value="{e(x["it"]["t"])}">{x[lang]["t"]}</option>' for x in SERVIZI) + f'<option value="Altro">{Q["other"]}</option>'
    return f'''<dialog class="sos-dlg q-dlg" id="q-dlg" aria-labelledby="q-t">
<div class="sos-head q-head"><h2 id="q-t">{Q['title']}</h2></div>
<p>{Q['text']}</p>
<form class="q-form" novalidate>
<label>{Q['name']} *<input name="nome" required autocomplete="name" maxlength="80"></label>
<label>{Q['service']} *<select name="servizio" required><option value="">{Q['choose']}</option>{opts}</select></label>
<div class="q-2"><label>{Q['boat']}<input name="barca" placeholder="{e(Q['boat_ph'])}" maxlength="80"></label>
<label>{Q['place']}<input name="posto" placeholder="{e(Q['place_ph'])}" maxlength="80"></label></div>
<label>{Q['desc']}<textarea name="descrizione" rows="3" placeholder="{e(Q['desc_ph'])}" maxlength="600"></textarea></label>
<label class="q-date">{Q['date']}<input name="data" type="date"></label>
<small class="q-req">* {Q['req']}</small>
</form>
<div class="sos-btns">
<a class="sos-go" data-q-to="393470119832" href="https://wa.me/393470119832" target="_blank" rel="noopener">{WA_ICON}{Q['to_f']}</a>
<a class="sos-go" data-q-to="393470387290" href="https://wa.me/393470387290" target="_blank" rel="noopener">{WA_ICON}{Q['to_s']}</a>
<button class="sos-no" type="button" data-q-close>{Q['cancel']}</button>
</div>
</dialog>'''


def call_dialog(lang):
    C = CALL[lang]
    row = lambda n, tel, num: f'''<div class="c-row"><div><span>{n}</span><a href="tel:{tel}">{num}</a></div><a class="c-wa" href="https://wa.me/{tel.lstrip('+')}" target="_blank" rel="noopener" aria-label="{C['wa']} {n}">{WA_ICON}</a></div>'''
    return f'''<dialog class="sos-dlg q-dlg c-dlg" id="c-dlg" aria-labelledby="c-t">
<div class="sos-head q-head"><h2 id="c-t">{C['title']}</h2></div>
<p>{C['text']}</p>
{row('Francesco', TEL_F, ('' if lang == 'it' else '+39 ') + '347 011 9832')}
{row('Simone', TEL_S, ('' if lang == 'it' else '+39 ') + '347 038 7290')}
<div class="sos-btns"><button class="sos-no" type="button" data-c-close>{C['close']}</button></div>
</dialog>'''


def footer(lang):
    U = UI[lang]
    return f'''<footer class="site-footer">
<div class="wrap">
<div class="foot-grid">
<div class="foot-brand">
<img src="/img/logo-libero-160.webp" alt="Anfibiasub" width="80" height="80" loading="lazy">
<p>{U["foot_about"]}</p>
</div>
<div>
<h3>ANFIBIASUB</h3>
<p>Via Dufour 23, Carcare (SV)</p>
<p><a href="mailto:{MAIL}">{MAIL}</a></p>
</div>
<div class="foot-tel">
<div><h3>FRANCESCO</h3><p><a href="tel:{TEL_F}">347 011 9832</a></p></div>
<div><h3>SIMONE</h3><p><a href="tel:{TEL_S}">347 038 7290</a></p></div>
</div>
<div class="foot-links">
<h3>{U["site"]}</h3>
<p><a href="{url('servizi', lang)}">{dict(U['nav'])['servizi']}</a></p>
<p><a href="{url('lavori', lang)}">{dict(U['nav'])['lavori']}</a></p>
<p><a href="{url('utilita', lang)}">{dict(U['nav'])['utilita']}</a></p>
<p><a href="{area_url(lang)}">{U["area"]}</a></p>
</div>
</div>
<div class="foot-bottom"><span>© Anfibiasub · P.I. 01326660097</span><span class="foot-by"><img src="/img/logo-it.webp" alt="By Ivano Taccucci" width="70" height="33" loading="lazy"></span><a href="{url('privacy', lang)}">{U["privacy"]}</a></div>
</div>
</footer>
<a class="wa" href="{WA}" target="_blank" rel="noopener" aria-label="{U["wa"]}">{WA_ICON}</a>
{sos_dialog(lang)}
{quote_dialog(lang)}
{call_dialog(lang)}
<script src="/js/main.js?v={VER}"></script>'''


def page(key, lang, title, desc, body, overlay=False, og='porto-loano'):
    extra_head = '<link rel="stylesheet" href="/vendor/leaflet/leaflet.css">\n' if key == 'utilita' else ''
    if key == 'home':
        extra_head += f'<link rel="manifest" href="/sito-{lang}.webmanifest">\n<link rel="stylesheet" href="/css/installa.css?v={INST_V}">\n'
    extra_js = (f'<script src="/vendor/leaflet/leaflet.js"></script>\n<script src="/js/utilita.js?v={VER}"></script>\n' if key == 'utilita'
                else f'<script src="/js/utilita.js?v={VER}"></script>\n' if key == 'home' else '')
    fname = PAGES[key][lang]
    alternates = ''.join(f'<link rel="alternate" hreflang="{l}" href="{SITE_URL + url(key, l)}">\n' for l in LANGS)
    locale = {'it': 'it_IT', 'en': 'en_GB', 'es': 'es_ES', 'de': 'de_DE'}[lang]
    robots = '' if PROD else '<meta name="robots" content="noindex, nofollow">\n'
    doc = f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Anfibiasub</title>
<meta name="description" content="{e(desc)}">
{robots}<link rel="canonical" href="{SITE_URL + url(key, lang)}">
{alternates}<link rel="alternate" hreflang="x-default" href="{SITE_URL + url(key, 'it')}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{SITE_URL}/img/{og}.webp">
<meta property="og:locale" content="{locale}">
<meta name="theme-color" content="#050E1A">
<link rel="icon" href="/favicon.png?v=3" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3">
<link rel="preload" href="/fonts/montserrat-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/style.css?v={VER}">
{extra_head}</head>
<body>
{depth_bg(lang, key)}
{header(key, lang, overlay)}
<main id="main">
{body}
</main>
{footer(lang)}
{inst_guide(lang) + f'<script src="/js/installa.js?v={INST_V}"></script>' + chr(10) if key == 'home' else ''}{extra_js}</body>
</html>
'''
    path = os.path.join(OUT, fname)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(bust(doc))


# ---------------- blocchi ----------------
def svc_card(s, lang):
    x = s[lang]
    pos = f' style="object-position:{s["pos"]}"' if s.get('pos') else ''
    return f'''<a class="card" href="{url('servizi', lang, s["id"])}">
<img src="/img/{s["img"]}-sm.webp" alt="" width="800" height="533" loading="lazy"{pos}>
<span class="card-body">
<span class="card-title">{e(x["t"]).upper()}</span>
<span class="card-text">{e(x["short"])}</span>
<span class="card-more">{UI[lang]["more"]} {ARROW}</span>
</span>
</a>'''


def job_card(l, lang):
    x = l[lang]
    return f'''<a class="card job" href="{url('lavori', lang, l["id"])}">
<img src="/img/{l["img"]}-sm.webp" alt="" width="800" height="533" loading="lazy">
<span class="card-body">
<span class="card-place">{e(x["luogo"])}</span>
<span class="card-title">{e(x["t"])}</span>
<span class="card-text">{e(x["d"])}</span>
<span class="card-more">{UI[lang]["more"]} {ARROW}</span>
</span>
</a>'''


def team_html(lang):
    out = ''
    for p in TEAM:
        x = p[lang]
        lis = ''.join(f'<li>{e(b)}</li>' for b in x['b'])
        out += f'''<div class="person">
<div class="person-head"><span class="avatar" aria-hidden="true">{p["ini"]}</span>
<span class="p-id"><strong class="p-name">{e(p["n"])}</strong><span class="p-role">{e(x["r"])}</span></span></div>
<ul>{lis}</ul>
</div>'''
    return out


def mezzi_html(lang):
    """Elenco mezzi e attrezzatura: le voci con scheda tecnica diventano pulsanti che la aprono."""
    INFO = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>'
    cols = ''
    for ci, (t, vs) in enumerate(MEZZI[lang]):
        lis = ''
        for vi, v in enumerate(vs):
            k = SCHEDE_POS.get((ci, vi))
            if k:
                lis += f'<li><button class="sch-btn" type="button" data-sch="{k}">{e(v)}{INFO}</button></li>'
            else:
                lis += f'<li>{e(v)}</li>'
        cols += f'<div class="tool-col"><h3>{t.upper()}</h3><ul class="list">{lis}</ul></div>'
    return cols


def schede_dialog(lang):
    U = SCHEDE_UI[lang]
    bodies = ''
    for k, d in SCHEDE.items():
        fun, imp, car = d[lang]
        fonti = ''.join(f'<li><a href="{FONTI[f][1]}" target="_blank" rel="noopener">{e(FONTI[f][0])}</a></li>' for f in d['fonti'])
        foto = f'<img class="sch-img" src="/img/{d["img"]}.webp" alt="" loading="lazy">' if d.get('img') else ''
        bodies += (f'<div class="sch-body" data-sch-body="{k}" hidden>{foto}'
                   f'<h3>{U["fun"]}</h3><p>{e(fun)}</p><h3>{U["imp"]}</h3><p>{e(imp)}</p>'
                   f'<h3>{U["car"]}</h3><ul class="rim-list">{"".join(f"<li>{e(c)}</li>" for c in car)}</ul>'
                   + '</div>')  # fonti tolte dalle schede (ottobre 2026)
    return (f'<dialog class="sch-dlg" id="sch-dlg" aria-labelledby="sch-t"><div class="sch-head"><h2 id="sch-t" data-sch-title></h2>'
            f'<button class="sch-x" type="button" data-sch-close aria-label="{U["close"]}">×</button></div>{bodies}</dialog>')


def moduli_html(lang):
    return ''.join(f'<div class="module"><strong>{e(a)}</strong><span>{e(b)}</span></div>' for a, b in MODULI[lang])


def cta(lang):
    U = UI[lang]
    return f'<section class="section band"><div class="wrap split"><div><h2 class="h2">{U["need"]}</h2><p class="lead">{U["need_lead"]}</p></div><div style="display:flex;flex-wrap:wrap;gap:12px"><a class="btn" href="{WA}" target="_blank" rel="noopener">{U["wa"]}</a></div></div></section>'


def tool_h2(t, lang):
    # titolo di sezione della pagina Utilità come il resto del sito: scritta piccola sopra, ultima parola azzurra
    if ': ' in t:
        a, b = t.split(': ', 1)
        h = f'{a}<br><span class="hl">{b}</span>'
    else:
        a, _, b = t.rpartition(' ')
        h = f'{a} <span class="hl">{b}</span>' if a else t
    return f'<p class="eyebrow">{tx(lang, "q_util")[0]}</p><h2 class="h2">{h}</h2>'


def phero(img, eyebrow, h1, lead):
    return f'''<section class="page-hero">
<img src="/img/{img}.webp" alt="">
<div class="wrap">
<p class="eyebrow">{eyebrow}</p>
<h1>{h1}</h1>
<p class="lead">{lead}</p>
</div>
</section>'''


FASE_ICONS = [  # valutazione, preparazione, attrezzatura, esecuzione, controllo, documentazione
    '<path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/><path d="M20 20l-4-4"/>',
    '<path d="M9 4h6v3H9z"/><path d="M7 5H5v15h14V5h-2"/><path d="M8.5 12l2.2 2.2L15.5 10"/>',
    '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"/>',
    '<circle cx="12" cy="9" r="5"/><path d="M8 13.5V20h8v-6.5"/><circle cx="12" cy="9" r="2.2"/>',
    '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    '<path d="M3 8h3l2-3h8l2 3h3v11H3z"/><circle cx="12" cy="13" r="3.5"/>',
]


def fasi_html(lang):
    steps = ''.join(
        f'<li><span class="fs-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ic}</svg></span>'
        f'<span class="fs-n">{i + 1}</span><b>{e(lab)}</b><span class="fs-t">{e(txt)}</span></li>'
        for i, (ic, lab, txt) in enumerate(zip(FASE_ICONS, FASI_LABEL[lang], FASI_GEN[lang])))
    return (f'<section class="fasi" id="come-lavoriamo"><p class="eyebrow">{FASI_TITLE[lang]}</p>'
            f'<p class="lead fasi-lead">{FASI_LEAD[lang]}</p><ol class="fasi-list">{steps}</ol></section>')


def detail(item, x, place=None, paras=None, fasi=''):
    pos = f' style="object-position:{item["pos"]}"' if item.get('pos') else ''
    ps = ''.join(f'<p>{e(p)}</p>' for p in (paras or [x['d']]))
    pl = f'<span class="card-place">{e(place)}</span>' if place else ''
    return f'''<article class="detail" id="{item["id"]}">
<div class="detail-img"><img src="/img/{item["img"]}.webp" alt="" width="1536" height="1024" loading="lazy"{pos}></div>
<div>{pl}<h2>{e(x["t"])}</h2>{ps}</div>
{fasi}</article>'''


B_ICONS = [
    '<svg viewBox="0 0 24 24" fill="none" stroke="#3CC6F5" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="#3CC6F5" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="#3CC6F5" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M2 8c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 13c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 18c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="#3CC6F5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h3l2-3h8l2 3h3v11H3z"/><circle cx="12" cy="13" r="3.5"/></svg>',
]


def build_lang(lang):
    U = UI[lang]
    N = dict(U['nav'])
    T = lambda k: tx(lang, k)  # noqa: E731

    # HOME
    badges = ''.join(f'<div class="badge">{ic}<span><strong>{a}</strong><br><span>{b}</span></span></div>' for ic, (a, b) in zip(B_ICONS, T('badges')))
    home = f'''<section class="hero" aria-label="{T('intro')}">
<img class="hero-img" src="/img/porto-loano.webp" alt="{T('hero_alt')}" fetchpriority="high">
<video class="hero-vid" muted loop playsinline autoplay preload="auto" poster="/img/superficie-3.webp" aria-hidden="true" tabindex="-1"><source src="/img/superficie-3.mp4" type="video/mp4"><source src="/img/superficie-3.webm" type="video/webm"></video>
<div class="wrap hero-body">
<p class="hero-kicker"><span class="kick-d">{T('hero_kicker')}</span><span class="kick-m">{T('hero_kicker_m')}</span></p>
<h1>{T('hero_h1')}</h1>
<p class="hero-lead">{'. <br class="br-pc">'.join(T('hero_lead').rsplit('. ', 1))}</p>
<div class="hero-cta"><a class="hc-q" data-quote href="{url('contatti', lang)}">{U['quote']}</a><a class="hc-c" data-call href="tel:{TEL_F}">{U['call_now'].capitalize()}</a></div>
<div class="badges">{badges}</div>
</div>
</section>

<section class="section m-srv" id="servizi" aria-labelledby="srv-t">
<div class="wrap">
<div class="sec-head">
<div>
<p class="eyebrow">{T('srv_eyebrow')}</p>
<h2 class="h2" id="srv-t">{T('srv_h2')}</h2>
<p class="lead">{T('srv_lead')}</p>
</div>
<a class="btn btn-ghost" href="{url('servizi', lang)}">{U['all_services']} {ARROW}</a>
</div>
<div class="g3">{''.join(svc_card(s, lang) for s in SERVIZI[:6])}</div>
</div>
</section>

<section class="m-meteo" aria-label="{dict(UTIL)['meteo'][lang]}"><div class="wrap">
<div class="meteo" data-meteo data-lang="{lang}" data-title="{dict(UTIL)['meteo'][lang]}"><div class="mb-frame"><div class="mb-art"></div></div></div>
</div></section>

<section class="section band m-hide" aria-labelledby="chi-t">
<div class="wrap">
<p class="eyebrow">{N['chi']}</p>
<h2 class="h2" id="chi-t">{T('fam_h2')}</h2>
<p class="lead" style="margin-bottom:40px">{T('fam_lead')}</p>
<div class="team-grid">{team_html(lang)}</div>
</div>
</section>

<section class="section m-lav" aria-labelledby="lav-t">
<div class="wrap">
<div class="sec-head">
<div>
<p class="eyebrow">{N['lavori']}</p>
<h2 class="h2" id="lav-t">{T('lav_h2')}</h2>
</div>
<a class="btn btn-ghost" href="{url('lavori', lang)}">{U['all_works'].format(n=len(LAVORI))} {ARROW}</a>
</div>
<div class="g3">{''.join(job_card(l, lang) for l in LAVORI[:6])}</div>
</div>
</section>

<div class="m-ok" aria-hidden="true"><video muted loop playsinline preload="none" poster="/img/sub-mobile-3.webp" width="540" height="720"></video></div>

<section class="section band m-hide" id="area" aria-labelledby="area-t">
<div class="wrap split">
<div>
<p class="eyebrow">{T('area_eyebrow')}</p>
<h2 class="h2" id="area-t">{T('area_h2')}</h2>
<p class="lead" style="margin-bottom:28px">{T('area_lead')}</p>
<a class="btn" href="{area_url(lang)}">{T('area_cta')} {ARROW}</a>
</div>
<div class="modules">{moduli_html(lang)}</div>
</div>
</section>'''
    page('home', lang, 'Anfibiasub · ' + T('home_title'), T('home_desc'), home, overlay=True)

    # SERVIZI
    srv = phero('saldature', N['servizi'], T('srv_page_h1'), T('srv_page_lead'))
    srv += '<div class="wrap">' + fasi_html(lang) + '<div>' + ''.join(detail(s, s[lang], paras=s[lang]['body']) for s in SERVIZI) + '</div></div>' + cta(lang)
    page('servizi', lang, N['servizi'] + ' · Anfibiasub', T('srv_desc'), srv, og='saldature')

    # LAVORI
    lav = phero('pietra-ligure', N['lavori'], T('lav_h2'), T('lav_page_lead'))
    lav += '<div class="wrap"><div>' + ''.join(detail(l, l[lang], l[lang]['luogo'], paras=l[lang].get('body')) for l in LAVORI) + '</div></div>' + cta(lang)
    page('lavori', lang, N['lavori'] + ' · Anfibiasub', T('lav_desc'), lav, og='pietra-ligure')

    # CHI SIAMO
    chi = phero('spianamenti', N['chi'], T('fam_h2'), T('chi_lead'))
    chi += f'<section class="section"><div class="wrap"><div class="team-grid">{team_html(lang)}</div></div></section>'
    chi += f'''<section class="section band" id="mezzi"><div class="wrap">
<p class="eyebrow">{T('mezzi_eyebrow')}</p>
<h2 class="h2">{T('mezzi_h2')}</h2>
<p class="lead" style="margin-bottom:10px">{T('mezzi_lead')}</p>
<p class="hint sch-hint">{SCHEDE_UI[lang]['hint']}</p>
<div class="g4">{mezzi_html(lang)}</div>
{schede_dialog(lang)}
</div></section>'''
    page('chi', lang, N['chi'] + ' · Anfibiasub', T('chi_desc'), chi, og='spianamenti')


    # UTILITÀ
    page('utilita', lang, N['utilita'] + ' · Anfibiasub', T('uti_desc'), utilita_html(lang), og='catenarie')

    # CONTATTI
    intl = lang != 'it'
    con = phero('catenarie', N['contatti'], T('con_h1'), T('con_lead'))
    con += f'''<section class="section"><div class="wrap">
<div class="contact-grid">
<div class="contact"><h2>Anfibiasub</h2><p style="color:var(--muted)">Via Dufour 23, Carcare (SV){', Italia' if lang == 'es' else ', Italien' if lang == 'de' else ', Italy' if intl else ''}</p><a href="mailto:{MAIL}">{MAIL}</a></div>
<div class="contact"><h2>Francesco Cuvato</h2><a class="big" href="tel:{TEL_F}">{'+39 ' if intl else ''}347 011 9832</a></div>
<div class="contact"><h2>Simone Cuvato</h2><a class="big" href="tel:{TEL_S}">{'+39 ' if intl else ''}347 038 7290</a></div>
<div class="contact"><h2>WhatsApp</h2><p style="color:var(--muted)">{T('con_wa')}</p><a class="btn" href="{WA}" target="_blank" rel="noopener" style="align-self:flex-start">{T('con_open')}</a></div>
</div>
<div style="margin-top:40px;display:flex;flex-wrap:wrap;gap:12px;align-items:center">
<p style="color:var(--muted)">{T('con_where')}</p>
<a class="btn btn-ghost" href="https://www.google.com/maps/search/?api=1&amp;query=Marina+di+Loano" target="_blank" rel="noopener">{T('con_maps')}</a>
</div>
</div></section>'''
    page('contatti', lang, N['contatti'] + ' · Anfibiasub', T('con_desc'), con, og='catenarie')

    # PRIVACY
    priv = phero('catenarie', 'Privacy', U['privacy'], T('priv_lead'))
    priv += f'<section class="section"><div class="wrap prose">{T("priv_body")}<p style="color:var(--dim)">{T("priv_upd")} {datetime.date.today().strftime("%d/%m/%Y")}</p></div></section>'
    page('privacy', lang, U['privacy'] + ' · Anfibiasub', T('priv_desc'), priv)


def fmt(n, lang='it'):
    if n is None:
        return '—'
    s = f'{n:,}'
    return s if lang == 'en' else s.replace(',', '.')


def utilita_html(lang):
    T = lambda k: tx(lang, k)  # noqa: E731
    title = dict(UTIL)
    h = phero('catenarie', dict(UI[lang]['nav'])['utilita'], T('uti_h1'), T('uti_lead'))
    note = f'<p class="hint" style="margin-top:12px">{T("tbl_note")}</p>'

    def table(head, rows, caption, cls=''):
        th = ''.join(f'<th scope="col">{x}</th>' for x in head)
        tr = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows)
        return f'<div class="tbl-scroll"><table class="data{cls}"><caption>{caption}</caption><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div>'

    dec = (lambda v: v.replace(',', '.')) if lang == 'en' else (lambda v: v)
    bf = table(T('bf_cols'), [(f'<b>{f}</b>', names[lang][0], kmh, kn, names[lang][1]) for f, kmh, kn, names in BEAUFORT4], T('bf_cap'), ' bf')
    hemp, poly = T('rope_cols')
    cime = table(['Ø mm', 'Manila', hemp, poly, 'Nylon', 'Manila', hemp, poly, 'Nylon'],
                 [(f'<b>{r[0]}</b>',) + tuple(fmt(x, lang) for x in r[1:]) for r in CIME], T('rope_cap'))
    cavi = table(['Ø mm'] + T('wire_cols'), [(f'<b>{dec(str(d))}</b>', fmt(g, lang), fmt(k, lang)) for d, g, k in CAVI], T('wire_cap'))
    cat = table(T('chain_cols'), [(f'<b>{a}</b>', b, dec(c), dec(d), dec(x)) for a, b, c, d, x in CATENE], T('chain_cap'))
    anc = table(['Ø mm', 'CP 1-1b', 'CR 1-1b', 'CP 2', 'CR 2', 'CP 3', 'CR 3', T('anchor_join'), 'Kenter'],
                [(f'<b>{r[0]}</b>',) + tuple(fmt(x, lang) for x in r[1:]) for r in CATENE_ANCORE], T('anchor_cap'))
    live = f'''<section class="tool-sec" id="meteo"><h2 class="vh">{title['meteo'][lang]}</h2>
<a class="game-card" href="{abyss_url(lang)}"><span class="gc-k">{GAME_CARD[lang][0]}</span><strong class="gc-t">ABYSS</strong><span class="gc-s">{GAME_CARD[lang][1]}</span><span class="btn gc-b">{GAME_CARD[lang][2]} <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span></a>
<div class="meteo" data-meteo data-lang="{lang}" data-title="{title['meteo'][lang]}"><div class="mb-frame"><div class="mb-art"></div></div></div>
<div class="gb" data-giorni data-lang="{lang}" data-title="{GB_TITLE[lang]}"><div class="gb-frame"><div class="gb-art"></div></div></div>
</section>
<section class="tool-sec" id="webcam">{tool_h2(title['webcam'][lang], lang)}
<a class="cam-card" href="{WEBCAM_URL}" target="_blank" rel="noopener">
<img src="/img/webcam-loano.webp" alt="" loading="lazy"><span class="cam-live">LIVE</span>
<span class="cam-txt"><strong>{T('cam_title')}</strong><span>{T('cam_sub')} →</span></span>
</a>
</section>
<section class="tool-sec" id="gps">{tool_h2(title['gps'][lang], lang)}
<p class="lead" style="margin-bottom:18px">{T('gps_lead')}</p>
<div class="gps-map" data-gps data-lang="{lang}"></div>
<p class="hint gps-coords" data-gps-coords>{T('gps_none')}</p>
<div class="gps-actions">
<button class="btn btn-ghost" type="button" data-gps-locate>{T('gps_locate')}</button>
<a class="btn btn-ghost is-off" data-gps-link="gmaps" target="_blank" rel="noopener">Google Maps</a>
<a class="btn btn-ghost is-off" data-gps-link="gearth" target="_blank" rel="noopener">Google Earth</a>
<a class="btn is-off" data-gps-link="wa" target="_blank" rel="noopener">{T('gps_wa')}</a>
<button class="btn btn-ghost is-off" type="button" data-gps-copy data-done="{T('copied')}">{T('gps_copy')}</button>
</div>
</section>
<section class="tool-sec" id="porto">{tool_h2(PORTO_TITLE[lang], lang)}
<p class="lead" style="margin-bottom:18px">{PORTO_LEAD[lang]}</p>
<div class="porto-wrap"><div class="porto-map" data-porto data-center="{PORTO_CENTER[0]},{PORTO_CENTER[1]}" data-more="{PORTO_MORE[lang]}" data-punti="{e(_json.dumps([{'id': i, 'p': ll, 'img': '/img/' + im + '-sm.webp', 't': t[lang][0], 'd': t[lang][1], 'u': url(k, lang, an)} for i, ll, im, (k, an), t in PORTO_PUNTI], ensure_ascii=False))}"></div>
<ol class="porto-list" data-porto-list></ol></div>
<p class="hint" data-porto-edit hidden></p>
</section>'''
    h += f'''<div class="wrap">
{live}
<section class="tool-sec" id="vento">{tool_h2(title['vento'][lang], lang)}{bf}</section>
<section class="tool-sec" id="cime">{tool_h2(title['cime'][lang], lang)}{cime}{note}</section>
<section class="tool-sec" id="cavi">{tool_h2(title['cavi'][lang], lang)}{cavi}{note}</section>
<section class="tool-sec" id="catene">{tool_h2(title['catene'][lang], lang)}{cat}<div style="height:30px"></div>{anc}{note}</section>
</div>''' + cta(lang)
    return h


# ---------------- generazione ----------------
def copy_assets():
    src = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets')
    for name in os.listdir(src):
        s, d = os.path.join(src, name), os.path.join(OUT, name)
        if os.path.isdir(s):
            shutil.copytree(s, d, dirs_exist_ok=True)
        else:
            shutil.copy2(s, d)
    for rel in ('css/style.css', 'js/main.js', 'js/utilita.js'):
        d = os.path.join(OUT, rel)
        t = open(d, encoding='utf-8').read()
        open(d, 'w', encoding='utf-8').write(bust(t))


def old_redirects():
    # Reindirizzamenti dai vecchi indirizzi Joomla, così i link salvati e Google non portano a pagine vuote
    old = {
        '/it/': '/', '/it': '/', '/it/chi-siamo': '/chi-siamo.html', '/it/contatti': '/contatti.html',
        '/it/attrezzatura': '/chi-siamo.html#mezzi', '/it/rimorchiatore': '/',
        # pagina Rimorchiatore tolta (ottobre 2026)
        '/rimorchiatore.html': '/', '/rimorchiatore': '/', '/en/tug.html': '/en/', '/en/tug': '/en/',
        '/es/remolcador.html': '/es/', '/es/remolcador': '/es/', '/de/schlepper.html': '/de/', '/de/schlepper': '/de/',
        '/it/utilita/vento': '/utilita.html#vento', '/it/utilita/cime': '/utilita.html#cime', '/it/utilita/cavi': '/utilita.html#cavi', '/it/utilita/catene': '/utilita.html#catene',
    }
    svc = {'lavori-edili-subacquei': 'edili', 'metalmeccanica-subacquea': 'metalmeccanica', 'recuperi': 'recuperi', 'alaggi-e-vari': 'alaggi',
           'foto-e-videoriprese': 'foto-video', 'carenaggi': 'carenaggi', 'progettazioni': 'progettazioni', 'pulizia-e-rigenerazione-eliche': 'pulizia-eliche', 'reti-anti-medusa': 'reti-anti-medusa'}
    for k, v in svc.items():
        old[f'/it/servizi-marittimi/{k}'] = f'/servizi.html#{v}'
    lav = {'porto-di-loano': 'porto-loano', 'cantieri-navali-pietra-ligure': 'pietra-ligure', 'porto-di-varazze': 'porto-varazze', 'porto-di-arenzano': 'porto-arenzano',
           'saldature': 'saldature', 'azimut': 'azimut', 'antibes': 'antibes', 'reti-anti-medusa': 'reti-anti-medusa', 'alaggi': 'alaggi',
           'posa-e-riparazione-di-tubazioni-sommerse': 'tubazioni-sommerse', 'spianamenti': 'spianamenti', 'demolizioni': 'demolizioni', 'catenarie': 'catenarie',
           'algeria': 'algeria', 'malta': 'malta', 'sostituzione-anodi': 'sostituzione-anodi'}
    for k, v in lav.items():
        old[f'/it/lavori-eseguiti/{k}'] = f'/lavori.html#{v}'
    return old


def extras_prod():
    old = old_redirects()
    lines = ['# Anfibiasub - generato da sito/build.py --prod', 'Options -Indexes', 'DirectoryIndex index.html', '',
             '# HTTPS e www', 'RewriteEngine On', 'RewriteCond %{HTTPS} off', 'RewriteRule ^ https://www.anfibiasub.it%{REQUEST_URI} [L,R=301]',
             'RewriteCond %{HTTP_HOST} ^anfibiasub\\.it$ [NC]', 'RewriteRule ^ https://www.anfibiasub.it%{REQUEST_URI} [L,R=301]', '',
             '# Vecchi indirizzi del sito Joomla']
    for a, b in old.items():
        if a in ('/it/', '/en/'):
            lines.append(f'RewriteRule ^{a.strip("/")}/?$ {b} [L,R=301,NE]')
        elif a != '/it':
            lines.append(f'RewriteRule ^{a.lstrip("/")}/?$ {b} [L,R=301,NE]')
    lines += ['# Vecchie pagine inglesi che non esistono più', 'RewriteCond %{REQUEST_FILENAME} !-f', 'RewriteRule ^en/.+$ /en/ [L,R=301]', '', '# Area clienti', 'RewriteRule ^area(/.*)?$ https://clienti.anfibiasub.it/area$1 [L,R=302]', '',
              '# Cache', '<IfModule mod_expires.c>', 'ExpiresActive On', 'ExpiresByType image/webp "access plus 1 month"', 'ExpiresByType font/woff2 "access plus 1 year"',
              'ExpiresByType text/css "access plus 1 week"', 'ExpiresByType application/javascript "access plus 1 week"', 'ExpiresByType text/html "access plus 0 seconds"', '</IfModule>',
              '<IfModule mod_headers.c>', '<FilesMatch "\\.html$">', 'Header set Cache-Control "no-cache"', '</FilesMatch>', '</IfModule>', '',
              'ErrorDocument 404 /index.html']
    with open(os.path.join(OUT, '.htaccess'), 'w') as f:
        f.write('\n'.join(l for l in lines if l is not None) + '\n')
    with open(os.path.join(OUT, 'robots.txt'), 'w') as f:
        f.write(f'User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n')
    today = datetime.date.today().isoformat()
    urls = ''.join(f'<url><loc>{SITE_URL}{url(k, l)}</loc><lastmod>{today}</lastmod></url>' for k in PAGES for l in LANGS)
    with open(os.path.join(OUT, 'sitemap.xml'), 'w') as f:
        f.write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n')


# ---------------- ABYSS (minigioco 3D, in tutte le lingue del sito) ----------------
def build_abyss():
    src = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'abyss')
    files = sorted(f for f in os.listdir(src) if f.endswith(('.js', '.css')))
    h = hashlib.md5(b''.join(open(os.path.join(src, f), 'rb').read() for f in files)).hexdigest()[:8]
    # i moduli si importano tra loro: aggiungo ?v= a ogni import, così dopo un aggiornamento il browser non usa copie vecchie
    for f in files:
        if f.endswith('.js'):
            d = os.path.join(OUT, 'abyss', f)
            t = open(d, encoding='utf-8').read()
            t = _re.sub(r"from '\./([\w-]+\.js)'", lambda m: f"from './{m.group(1)}?v={h}'", t)
            open(d, 'w', encoding='utf-8').write(bust(t))
    tpl = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'abyss_pagina.html'), encoding='utf-8').read()
    from abyss_testi import H as AH, J as AJ
    # sondaggio di fine partita: online il sito sta su HostGator e l'API sull'area clienti
    api = 'https://clienti.anfibiasub.it/api/abyss/voto' if PROD else '/api/abyss/voto'
    robots = '' if PROD else '<meta name="robots" content="noindex, nofollow">\n'
    META = {'it': ('ABYSS · Il relitto dimenticato · Anfibiasub', 'ABYSS: esplorazione subacquea in 3D di un relitto sul fondale del Mediterraneo. Un minigioco di Anfibiasub.'),
            'en': ('ABYSS · The forgotten wreck · Anfibiasub', 'ABYSS: a 3D underwater exploration of a wreck on the Mediterranean seabed. A mini game by Anfibiasub.'),
            'es': ('ABYSS · El pecio olvidado · Anfibiasub', 'ABYSS: exploración submarina en 3D de un pecio en el fondo del Mediterráneo. Un minijuego de Anfibiasub.'),
            'de': ('ABYSS · Das vergessene Wrack · Anfibiasub', 'ABYSS: 3D-Unterwassererkundung eines Wracks auf dem Grund des Mittelmeers. Ein Minispiel von Anfibiasub.')}
    for lang in LANGS:
        path = abyss_url(lang)
        body = tpl.replace('{{API}}', api).replace('{{home}}', url('home', lang)).replace('{{contatti}}', url('contatti', lang)).replace('{{servizi}}', url('servizi', lang))
        body = _re.sub(r'\{\{(\w+)\}\}', lambda m: AH[m.group(1)][lang], body)
        jd = {k: v[lang] for k, v in AJ.items()}
        jd['srv'] = [[x[lang]['t'], x[lang]['short']] for x in SERVIZI]   # cartelli dei servizi sul fondale, come sul sito
        js = _json.dumps(jd, ensure_ascii=False).replace('</', '<\\/')
        man = f'abyss-{lang}.webmanifest'
        with open(os.path.join(OUT, man), 'w', encoding='utf-8') as f:
            _json.dump({'name': 'ABYSS · Anfibiasub', 'short_name': 'ABYSS', 'start_url': path, 'display': 'fullscreen', 'orientation': 'landscape', 'lang': lang,
                        'background_color': '#050E1A', 'theme_color': '#050E1A', 'icons': [{'src': '/apple-touch-icon.png', 'sizes': '180x180', 'type': 'image/png'}]}, f, ensure_ascii=False)
        alts = ''.join(f'<link rel="alternate" hreflang="{l}" href="{SITE_URL}{abyss_url(l)}">\n' for l in LANGS)
        doc = f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(META[lang][0])}</title>
<meta name="description" content="{e(META[lang][1])}">
{robots}<meta name="theme-color" content="#050E1A">
{alts}<link rel="manifest" href="/{man}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="ABYSS">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3">
<meta property="og:title" content="{e(META[lang][0])}">
<meta property="og:image" content="{SITE_URL}/img/abyss/intro.webp">
<link rel="icon" href="/favicon.png?v=3" type="image/png">
<link rel="stylesheet" href="/abyss/abyss.css?v={h}">
</head>
<body>
{body}
<script type="application/json" id="ab-i18n">{js}</script>
<script type="module" src="/abyss/main.js?v={h}"></script>
</body>
</html>
'''
        out = os.path.join(OUT, path.lstrip('/'))
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, 'w', encoding='utf-8') as f:
            f.write(bust(doc))

if __name__ == '__main__':
    if PROD and os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT, exist_ok=True)
    copy_assets()
    for lang in LANGS:
        build_lang(lang)
    build_abyss()
    inst_manifests()
    # l'area clienti mostra la stessa informativa privacy nella finestra "Termini e Privacy" della registrazione
    import json
    # vecchi indirizzi /it/... -> nuove pagine, usati dal server su Railway
    with open(os.path.join(ROOT, 'src', 'redirects.json'), 'w', encoding='utf-8') as f:
        _json.dump(old_redirects(), f, ensure_ascii=False, indent=0)
    with open(os.path.join(ROOT, 'src', 'privacy_testi.json'), 'w', encoding='utf-8') as f:
        json.dump({l: TX['priv_body'][l] for l in LANGS}, f, ensure_ascii=False, indent=1)
    if PROD:
        extras_prod()
    else:
        with open(os.path.join(OUT, 'robots.txt'), 'w') as f:
            f.write('User-agent: *\nDisallow: /\n')
    print(('PRODUZIONE' if PROD else 'PROVA') + ' ->', OUT)
