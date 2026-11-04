// Paesaggio sonoro procedurale (nessun file audio): mare ovattato, respiro, bolle, metallo
export function createAudio() {
  const A = { ctx: null, on: true, ready: false };
  let master, amb, ambF;

  const noiseBuf = (ctx, sec, brown) => {
    const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return b;
  };

  A.init = () => {
    if (A.ctx) { A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = A.ctx = new AC();
    master = ctx.createGain(); master.gain.value = A.on ? 0.9 : 0; master.connect(ctx.destination);
    A.white = noiseBuf(ctx, 2, false);
    // mare ovattato
    const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx, 6, true); src.loop = true;
    ambF = ctx.createBiquadFilter(); ambF.type = 'lowpass'; ambF.frequency.value = 380;
    amb = ctx.createGain(); amb.gain.value = 0.5;
    src.connect(ambF).connect(amb).connect(master); src.start();
    // lento ondeggiare del rumore
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 0.18; lfo.connect(lg).connect(amb.gain); lfo.start();
    A.ready = true;
  };

  // pagina nascosta: il suono si ferma; tornando si riprende. Uscendo dal gioco si spegne del tutto.
  A.sleep = () => { if (A.ctx && A.ctx.state === 'running') A.ctx.suspend().catch(() => {}); };
  A.wake = () => { if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume().catch(() => {}); };
  A.stop = () => { if (!A.ctx) return; try { if (master) master.gain.value = 0; A.ctx.close(); } catch (_) { /* niente */ } A.ctx = null; A.ready = false; };
  A.setOn = (v) => { A.on = v; if (master) master.gain.setTargetAtTime(v ? 0.9 : 0, A.ctx.currentTime, 0.1); };
  A.depth = (d) => { if (!A.ready) return; ambF.frequency.setTargetAtTime(520 - d * 9, A.ctx.currentTime, 0.5); };

  const noiseHit = (dur, f, q, gain, type = 'bandpass', attack = 0.02) => {
    if (!A.ready) return;
    const c = A.ctx, t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = A.white;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl).connect(g).connect(master); s.start(t); s.stop(t + dur + 0.05);
    return { fl, t };
  };
  const tone = (f, dur, gain, type = 'sine', t0 = 0, slide = 0) => {
    if (!A.ready) return;
    const c = A.ctx, t = c.currentTime + t0;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
  };

  A.inhale = () => { const h = noiseHit(1.5, 1400, 0.8, 0.07, 'bandpass', 0.6); if (h) h.fl.frequency.linearRampToValueAtTime(2200, h.t + 1.2); };
  A.exhale = () => {
    noiseHit(1.3, 500, 0.7, 0.09, 'bandpass', 0.1);
    for (let i = 0; i < 14; i++) tone(260 + Math.random() * 700, 0.06 + Math.random() * 0.08, 0.04, 'sine', 0.15 + Math.random() * 1.1, 1.6 + Math.random());
  };
  A.torch = () => { tone(1800, 0.05, 0.08, 'square'); noiseHit(0.08, 3000, 2, 0.1); };
  A.ping = () => { [523, 1307, 2210, 3180].forEach((f, i) => tone(f, 1.6 - i * 0.3, 0.07 / (i + 1), 'sine')); };
  A.pickup = () => { A.ping(); tone(392, 0.9, 0.05, 'triangle', 0.15); tone(587, 1.2, 0.04, 'triangle', 0.3); };
  A.click = () => { noiseHit(0.05, 2500, 3, 0.12); tone(900, 0.04, 0.05, 'square'); };
  A.clunk = () => { noiseHit(0.35, 180, 1.5, 0.35, 'lowpass', 0.005); tone(110, 0.4, 0.15, 'triangle', 0, 0.6); tone(1450, 0.3, 0.03, 'sine', 0.02); };
  A.creak = () => {
    if (!A.ready) return;
    noiseHit(3.2, 90, 0.7, 0.5, 'lowpass', 0.4);
    for (let i = 0; i < 6; i++) tone(70 + Math.random() * 60, 0.5, 0.06, 'sawtooth', i * 0.35, 0.7);
    for (let i = 0; i < 30; i++) tone(200 + Math.random() * 900, 0.08, 0.04, 'sine', 1 + Math.random() * 2, 2);
  };
  A.finale = () => { [196, 247, 294, 392].forEach((f, i) => tone(f, 6, 0.045, 'sine', i * 0.4)); [784, 988].forEach((f, i) => tone(f, 4, 0.015, 'sine', 1.5 + i * 0.5)); };
  // getto d'aria dalla bombola (continuo finché si tiene premuto)
  let hiss = null;
  A.hissOn = () => {
    if (!A.ready || hiss) return;
    const c = A.ctx, s = c.createBufferSource(); s.buffer = A.white; s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.6;
    const g = c.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(0.32, c.currentTime + 0.08);
    s.connect(f).connect(g).connect(master); s.start(); hiss = { s, g };
  };
  A.hissOff = () => { if (!hiss) return; const c = A.ctx; hiss.g.gain.linearRampToValueAtTime(0, c.currentTime + 0.15); hiss.s.stop(c.currentTime + 0.2); hiss = null; };
  // pericolo: due note basse che si ripetono (stile documentario, non arcade)
  A.danger = () => { [0, 0.6, 1.2, 1.8].forEach((t, i) => tone(i % 2 ? 98 : 92, 0.5, 0.12, 'triangle', t)); };
  A.hit = () => { noiseHit(0.8, 120, 0.8, 0.6, 'lowpass', 0.005); tone(60, 1.2, 0.2, 'sawtooth', 0, 0.5); };
  // fiocina: scatto secco degli elastici
  A.shot = () => { noiseHit(0.12, 1800, 1.2, 0.35, 'bandpass', 0.003); tone(240, 0.18, 0.12, 'triangle', 0, 0.5); };
  // pallone che esplode: tonfo profondo e gorgoglio di bolle
  A.boom = () => {
    noiseHit(2.2, 70, 0.6, 1.0, 'lowpass', 0.004); tone(42, 1.8, 0.35, 'sine', 0, 0.6);
    for (let i = 0; i < 40; i++) tone(180 + Math.random() * 800, 0.08 + Math.random() * 0.1, 0.05, 'sine', 0.1 + Math.random() * 1.6, 1.8 + Math.random());
  };
  return A;
}
