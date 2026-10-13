// ================================================================ LE GRAND QUIZ (format série)
// Tout le minutage vient de timeline.js (TL.quiz) : la voix est posée d'abord, l'image suit.
// Hôtes : Prune (la kangourou, c'est elle qui parle) et Tilou (le koala). 4 cartes A/B/C/D, 5 s pour réfléchir.
const QD = TL.data, QZ = TL.quiz, NQ = QZ.length;
const EMO = '"Noto Color Emoji"';
const CARD = { w: 470, h: 262, x: [52, 558], y: [660, 948] };
const CCOL = [['#FF9A8A', '#F0605A', '#B83A3A'], ['#8FD0FF', '#4A9FE8', '#2A64B0'], ['#9BE8B0', '#45BE72', '#2A8048'], ['#FFE07A', '#F5B83A', '#C0801A']];
const LET = ['A', 'B', 'C', 'D'];
const STAGE = (tr) => { if (tr < QZ[0].q0 - 0.45) return { k: 'intro' }; for (let i = 0; i < NQ; i++) if (tr < QZ[i].end) return { k: 'q', i, s: QZ[i] }; return { k: 'outro' }; };
const sayFrac = (s, k) => s.a0 + (s.a1 - s.a0) * (k / 4) * 0.92;   // when the k-th answer is spoken (approx.)

// sound on every visible accent (beat = 2 × seconds)
const HITS = [];
HITS.push([2 * 0.3, 'title', 'swell', { gain: 0.12 }]);
QZ.forEach((s, i) => {
  HITS.push([2 * (s.q0 - 0.4), 'slide in', 'whoosh', { len: 0.35, gain: 0.1, from: 600, to: 2000 }]);
  for (let k = 0; k < 4; k++) HITS.push([2 * sayFrac(s, k), 'card ' + k, 'pop', { pitch: ['C6', 'D6', 'E6', 'G6'][k], gain: 0.16 }]);
  for (let k = 0; k < 5; k++) HITS.push([2 * (s.c0 + k), 'tick', 'tick', { gain: k === 4 ? 0.34 : 0.26 }]);
  HITS.push([2 * s.c1, 'reveal', 'bell', { pitch: 'E6', gain: 0.18 }], [2 * (s.c1 + 0.08), 'reveal', 'bell', { pitch: 'B6', gain: 0.12 }], [2 * (s.c1 + 0.12), 'confetti', 'pop', { pitch: 'A6', gain: 0.14 }]);
});
HITS.push([2 * (QZ[NQ - 1].end + 0.2), 'bravo', 'swell', { gain: 0.14 }], [2 * (QZ[NQ - 1].end + 0.5), 'stars', 'bell', { pitch: 'G6', gain: 0.14 }]);

// ---------------------------------------------------------------- static painted background (built once)
const BG = {};
function buildBG() {
  buildLayers();
  { const [cv, c] = mk(W, H); c.fillStyle = lgrad(c, 0, 0, 0, H, [[0, '#56A6E6'], [0.4, '#9AD2F4'], [0.62, '#FFEBC4'], [1, '#FFD9A0']]); c.fillRect(0, 0, W, H);
    c.fillStyle = rgrad(c, 880, 300, 900, [[0, 'rgba(255,248,215,0.9)'], [0.12, 'rgba(255,232,160,0.6)'], [0.45, 'rgba(255,205,130,0.18)'], [1, 'rgba(255,205,130,0)']]); c.fillRect(0, 0, W, H);
    ball(c, 880, 300, 64, 64, '#FFFFFF', '#FFF6D0', '#FFE08A'); BG.sky = cv; }
  { const [cv, c] = mk(W, H); const cam = { x: 540, y: 720, z: 1 };
    layer(c, cam, 0.26, () => c.drawImage(L.far, -OX, -OY));
    layer(c, cam, 0.55, () => c.drawImage(L.mid, -OX, -OY));
    layer(c, cam, 1, () => {
      c.beginPath(); c.moveTo(-700, 2300); for (let x = -700; x <= 1800; x += 40) c.lineTo(x, gy(x)); c.lineTo(1800, 2300); c.closePath();
      c.fillStyle = lgrad(c, 0, GY0 - 10, 0, GY0 + 520, [[0, '#9CCB64'], [0.12, '#76AE52'], [0.5, '#4A8444'], [1, '#2A5A34']]); c.fill();
      for (let i = 0; i < 24; i++) { const x = -300 + 1700 * hash01(i, 31), d = hash01(i, 32), y = gy(x) + 26 + d * 230; ell(c, x, y, 60 + 60 * hash01(i, 33), 10 + 10 * d, `rgba(${i % 2 ? '170,210,110' : '30,80,50'},0.22)`); }
      for (let i = 0; i < 26; i++) { const x = -200 + 1500 * hash01(i, 41), d = hash01(i, 42), y = gy(x) + 30 + d * 220, s = 0.6 + 0.6 * d;
        c.save(); c.translate(x, y); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -34 * s); stroke(c, '#4E8A3E', 3); for (let p = 0; p < 5; p++) leafShape(c, Math.cos(p * TAU / 5) * 9 * s, -34 * s + Math.sin(p * TAU / 5) * 9 * s, 18 * s, 10 * s, p * TAU / 5, i % 3 === 0 ? '#F2B8C6' : i % 3 === 1 ? '#FFFFFF' : '#FFD45E'); ell(c, 0, -34 * s, 5 * s, 5 * s, '#F5A623'); c.restore(); }
    });
    BG.land = cv; }
  // soft frosted veil behind the quiz area so the cards read on any background
  { const [cv, c] = mk(W, H); c.fillStyle = 'rgba(255,255,255,0.0)';
    c.fillStyle = lgrad(c, 0, 240, 0, 1300, [[0, 'rgba(255,250,240,0)'], [0.15, 'rgba(255,250,240,0.22)'], [0.85, 'rgba(255,250,240,0.22)'], [1, 'rgba(255,250,240,0)']]); c.fillRect(0, 240, W, 1060); BG.veil = cv; }
}

// ---------------------------------------------------------------- UI pieces, painted in volume
function panel(ctx, x, y, w, h, r, top, bot, edge) {
  ctx.save(); ctx.shadowColor = 'rgba(20,30,60,0.28)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = lgrad(ctx, 0, y, 0, y + h, [[0, top], [1, bot]]); ctx.fill(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip();
  ctx.fillStyle = lgrad(ctx, 0, y, 0, y + h * 0.45, [[0, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(x, y, w, h * 0.45);
  ctx.fillStyle = lgrad(ctx, 0, y + h * 0.7, 0, y + h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,30,0.14)']]); ctx.fillRect(x, y + h * 0.7, w, h * 0.3);
  ctx.restore();
  if (edge) { ctx.beginPath(); ctx.roundRect(x + 3, y + 3, w - 6, h - 6, r - 3); stroke(ctx, edge, 5); }
}
function outlined(ctx, str, x, y, size, fill, line = 'rgba(20,24,60,0.9)', lw = 0.2, fam = DISPLAY) {
  ctx.font = font(size, 600, fam); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (line) { ctx.strokeStyle = line; ctx.lineWidth = size * lw; ctx.strokeText(str, x, y); }
  ctx.fillStyle = fill; ctx.fillText(str, x, y);
}
function emoji(ctx, str, x, y, size) { ctx.font = `${size}px ${EMO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(str, x, y); }
function wrapWords(ctx, str, size, maxW) {
  ctx.font = font(size, 600, DISPLAY); const out = []; let cur = '';
  for (const w of str.split(' ')) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
  out.push(cur); return out;
}
function confetti(ctx, cx, cy, life) {
  if (life <= 0 || life > 1.6) return;
  const cols = ['#FF6B6B', '#FFD45E', '#6BCB77', '#4D96FF', '#F78FB3', '#FFFFFF'];
  for (let i = 0; i < 40; i++) {
    const a = hash01(i, 501) * TAU, v = 420 + 520 * hash01(i, 502), x = cx + Math.cos(a) * v * life * 0.9, y = cy + Math.sin(a) * v * life * 0.7 + 520 * life * life;
    ctx.save(); ctx.globalAlpha = clamp(1.6 - life); ctx.translate(x, y); ctx.rotate(life * 9 + i); ctx.fillStyle = cols[i % 6]; ctx.fillRect(-9, -5, 18, 10); ctx.restore();
  }
  for (let i = 0; i < 8; i++) sparkle(ctx, cx + Math.cos(i * 0.8) * 200 * life, cy + Math.sin(i * 1.3) * 120 * life - 60 * life, 12, Math.sin(clamp(life / 1.2) * PI));
}
function checkBadge(ctx, x, y, k) {
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ball(ctx, 0, 0, 46, 46, '#9CF5A8', '#3CC060', '#1E8040'); ctx.beginPath(); ctx.moveTo(-20, 2); ctx.lineTo(-5, 18); ctx.lineTo(22, -16); stroke(ctx, '#FFFFFF', 11);
  ctx.restore();
}

function card(ctx, idx, q, s, tr) {
  const col = idx % 2, row = idx >> 1, x = CARD.x[col], y = CARD.y[row], w = CARD.w, h = CARD.h;
  const appear = spring(tr - (sayFrac(s, idx) - 0.12), SPRING.bouncy);
  if (appear <= 0.01) return;
  const reveal = tr > s.c1, ok = idx === q.ok, rk = spring(tr - s.c1, SPRING.bouncy);
  const think = tr > s.c0 && tr < s.c1 ? 1 : 0;
  let sc = (0.6 + 0.4 * appear) * (1 + think * 0.015 * Math.sin(tr * 6 + idx * 1.7));
  if (reveal) sc *= ok ? 1 + 0.08 * rk : 1 - 0.06 * clamp(rk);
  const dim = reveal && !ok ? 0.68 * clamp(rk) : 0;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.rotate((1 - clamp(appear)) * (idx % 2 ? 0.2 : -0.2) + (reveal && ok ? 0.02 * Math.sin((tr - s.c1) * 10) * Math.exp(-(tr - s.c1) * 2) : 0));
  ctx.globalAlpha = clamp(appear * 1.5);
  if (reveal && ok) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgrad(ctx, 0, 0, 380, [[0, `rgba(255,255,190,${A(0.55 * rk)})`], [1, 'rgba(255,255,190,0)']]); ctx.fillRect(-400, -330, 800, 660); ctx.restore(); }
  const [hi, mid, lo] = CCOL[idx];
  panel(ctx, -w / 2, -h / 2, w, h, 40, hi, lo, reveal && ok ? '#FFFFFF' : 'rgba(255,255,255,0.55)');
  // letter badge
  ball(ctx, -w / 2 + 50, -h / 2 + 50, 34, 34, '#FFFFFF', '#F4F4FA', '#C8CCE0'); outlined(ctx, LET[idx], -w / 2 + 50, -h / 2 + 53, 46, mid, null);
  const [em, label] = q.a[idx];
  if (em) { const bob = Math.sin(tr * 2.4 + idx) * 5; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8; emoji(ctx, em, 0, -32 + bob, 118); ctx.restore();
    const lines = wrapWords(ctx, label, 54, w - 40); lines.slice(0, 2).forEach((ln, li) => outlined(ctx, ln, 0, 82 + (li - (lines.length - 1) / 2) * 52, lines.length > 1 ? 46 : 54, '#FFFFFF')); }
  else outlined(ctx, label, 0, 10, 170, '#FFFFFF');
  if (dim > 0) { ctx.globalAlpha = dim; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 40); ctx.fillStyle = 'rgba(70,80,110,0.85)'; ctx.fill(); }
  ctx.restore();
  if (reveal && ok) { checkBadge(ctx, x + w - 34, y + 30, rk); }
}

function countdown(ctx, s, tr) {
  const p = (tr - s.c0) / 5, inn = spring(tr - s.c0 + 0.1, SPRING.bouncy), out = 1 - sm((tr - s.c1) / 0.25);
  if (p < -0.05 || out <= 0.01) return;
  const cx = W / 2, cy = 932, n = Math.max(1, 5 - Math.floor(clamp(p, 0, 0.999) * 5)), sub = (clamp(p) * 5) % 1;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(inn * out, inn * out);
  ball(ctx, 0, 0, 86, 86, '#FFFFFF', '#F2F4FF', '#C6CCE8');
  ctx.beginPath(); ctx.arc(0, 0, 72, -PI / 2, -PI / 2 + TAU * (1 - clamp(p)), false); stroke(ctx, p > 0.8 ? '#F0605A' : '#7B5CFF', 14);
  const pop = 1 + 0.25 * Math.exp(-sub * 7);
  ctx.scale(pop, pop); outlined(ctx, String(n), 0, 4, 92, p > 0.8 ? '#F0605A' : '#5A3CE0', null);
  ctx.restore();
}

function header(ctx, i, s, tr) {
  const k = spring(tr - (s.q0 - 0.35), SPRING.snappy), out = 1 - sm((tr - (s.end - 0.35)) / 0.3);
  const slide = (1 - k) * 700 - (1 - out) * 900;
  ctx.save(); ctx.translate(slide, 0); ctx.globalAlpha = clamp(Math.min(k * 1.4, out * 1.5));
  // pill
  panel(ctx, W / 2 - 210, 262, 420, 92, 46, '#FFB45E', '#F07A2A', 'rgba(255,255,255,0.6)'); outlined(ctx, `Question ${i + 1} / ${NQ}`, W / 2, 310, 54, '#FFFFFF', 'rgba(120,50,10,0.75)', 0.16);
  // progress dots
  for (let d = 0; d < NQ; d++) { const dx = W / 2 + (d - (NQ - 1) / 2) * 44, done = d < i || (d === i && tr > s.c1); ball(ctx, dx, 384, 13, 13, done ? '#FFF6B0' : '#FFFFFF', done ? '#FFC83A' : 'rgba(255,255,255,0.7)', done ? '#D08A10' : 'rgba(170,180,210,0.9)'); if (d === i) { ctx.beginPath(); ctx.arc(dx, 384, 19, 0, TAU); stroke(ctx, '#FFFFFF', 4); } }
  // question panel
  const q = QD.questions[i], lines = wrapWords(ctx, q.q, 62, 900);
  panel(ctx, 44, 418, W - 88, 216, 44, '#FFFFFF', '#F3EEE4', 'rgba(255,255,255,0.9)');
  const showK = spring(tr - (s.q0 + 0.2), SPRING.bouncy);
  if (showK > 0.01) { ctx.save(); ctx.translate(W / 2, 474); ctx.scale(showK, showK); emoji(ctx, q.show, 0, Math.sin(tr * 2) * 4, q.show.length > 2 ? 78 : 86); ctx.restore(); }
  lines.forEach((ln, li) => outlined(ctx, ln, W / 2, 568 + (li - (lines.length - 1) / 2) * 54 + (lines.length > 1 ? 16 : 0), lines.length > 1 ? 50 : 62, '#2A2350', null));
  ctx.restore();
  // the cards slide with the panel
  ctx.save(); ctx.translate(slide, 0); ctx.globalAlpha = clamp(out * 1.5);
  for (let c = 0; c < 4; c++) card(ctx, c, q, s, tr);
  countdown(ctx, s, tr);
  if (tr > s.c1) { const ci = q.ok; confetti(ctx, CARD.x[ci % 2] + CARD.w / 2, CARD.y[ci >> 1] + CARD.h / 2, tr - s.c1); }
  ctx.restore();
}

// subtitles for intro and outro only (questions are on screen already)
function readAlong(ctx, ph, tr, y0) {
  const lines = wrapWords(ctx, ph.text, 60, 900), words = ph.text.split(' '), n = words.length, dur = (ph.t1 - ph.t0) * 0.94;
  const out = 1 - sm((tr - (ph.t1 + 0.4)) / 0.2); if (out <= 0) return; let wi = 0;
  ctx.save(); ctx.globalAlpha = out;
  lines.forEach((ln, li) => { const ws = ln.split(' '); ctx.font = font(60, 600, DISPLAY); const sp = ctx.measureText(' ').width, wd = ws.map((w) => ctx.measureText(w).width), tot = wd.reduce((a, b) => a + b, 0) + sp * (ws.length - 1); let x = (W - tot) / 2;
    ws.forEach((w, k) => { const tw = ph.t0 + dur * (wi / n), on = tr >= tw, kk = spring(tr - (ph.t0 - 0.2 + wi * 0.03), SPRING.snappy); wi++; if (kk > 0.01) { ctx.save(); ctx.globalAlpha = out * clamp(kk * 1.3); outlined(ctx, w, x + wd[k] / 2, y0 + li * 76 + (1 - kk) * 30, 60, on ? (tr - tw < 0.3 ? '#FFE27A' : '#FFFFFF') : 'rgba(255,255,255,0.55)', 'rgba(10,20,40,0.92)', 0.24); ctx.restore(); } x += wd[k] + sp; }); });
  ctx.restore();
}

// ---------------------------------------------------------------- the hosts
function hosts(ctx, tr, st) {
  const qz0 = QZ[0].q0 - 0.45, qEnd = QZ[NQ - 1].end, toCorner = sm((tr - (qz0 - 0.3)) / 0.8), toCenter = sm((tr - qEnd) / 0.8);
  const big = 1 - toCorner + toCenter, scR = lerp(0.58, 0.95, big), scK = lerp(0.56, 0.92, big);
  const rx = lerp(150, 330, big), kx = lerp(935, 760, big), gyH = lerp(1492, 1460, big);
  let tlk = false; for (const p of TL.phrases) if (tr > p.t0 - 0.05 && tr < p.t1 + 0.1) tlk = true;
  let think = 0, cheer = 0, ci = -1;
  if (st.k === 'q') { const s = st.s; think = tr > s.c0 && tr < s.c1 ? 1 : 0; cheer = tr > s.c1 && tr < s.c1 + 1.3 ? 1 : 0; ci = st.i; }
  const lt = st.k === 'q' ? tr - st.s.c1 : -1;
  const hop = (t0, h) => { const p = (tr - t0) / 0.42; return p > 0 && p < 1 ? Math.sin(p * PI) * h : 0; };
  const outroHop = st.k === 'outro' ? hop(qEnd + 1.0, 90) + hop(qEnd + 1.6, 70) : 0, introHop = hop(0.5, 80);
  const rAir = (cheer ? hop(st.s.c1 + 0.05, 70) : 0) + outroHop + introHop, kAir = (cheer ? hop(st.s.c1 + 0.2, 80) + hop(st.s.c1 + 0.7, 50) : 0) + (st.k === 'outro' ? hop(qEnd + 1.25, 80) : 0) + hop(0.75, 70);
  const land = (t0) => (tr > t0 ? 0.15 * wobble((tr - t0) * 2, 2.1, 3.4) * (tr < t0 + 1 ? 1 : 0) : 0);
  const rsq = cheer ? land(st.s.c1 + 0.47) : 0, ksq = cheer ? land(st.s.c1 + 0.62) + land(st.s.c1 + 1.12) : 0;
  const rRS = scR / RS;   // roo() draws at scale s; rooHand assumes RS, unused here
  const rs = { x: rx, y: gyH, air: rAir, sq: rsq - 0.08 * Math.sin(Math.min(1, Math.max(0, (tr - (st.s?.c1 ?? 0)) / 0.42)) * PI) * (cheer ? 1 : 0), dir: 1, lean: think * 0.04 * Math.sin(tr * 2) + 0.02 * Math.sin(tr * 1.3),
    lookX: think ? 0.6 * Math.sin(tr * 1.4) : 0.7, lookY: think ? -0.9 : st.k === 'q' ? -0.7 : -0.1, blink: blinkAt(tr % 6.3, [1.7, 4.9]), happy: cheer || (st.k !== 'q' && !tlk) ? 1 : 0, wide: tlk ? 0.25 : 0, mood: 1,
    talk: tlk ? mouth(tr) : 0, reach: think ? 0.55 + 0.1 * Math.sin(tr * 3) : cheer ? 1 : tlk ? 0.45 + 0.25 * Math.sin(tr * 4) : 0.15, reach2: cheer ? 1 : 0.1, t: tr, trail: rAir > 0 ? 1 : 0.3, jig: rsq, earLag: -0.3 * clamp(rAir / 70) + 0.06 * Math.sin(tr * 1.7), pouch: 0 };
  const ks = { x: kx, y: gyH, air: kAir, sq: ksq, dir: -1, lean: think * 0.05 * Math.sin(tr * 2.3 + 1) + 0.02 * Math.sin(tr * 1.1),
    lookX: think ? -0.5 * Math.sin(tr * 1.2) : -0.6, lookY: think ? -0.8 : -0.5, blink: blinkAt((tr + 2.1) % 5.7, [1.2, 3.9]), happy: cheer || st.k !== 'q' ? 1 : 0, wide: think ? 0.3 : 0, mood: 1,
    talk: 0, point: think ? 0.35 + 0.1 * Math.sin(tr * 5) : cheer ? 1 : 0, hold: cheer ? 0.9 : 0.3, t: tr, trail: kAir > 0 ? 1 : 0.4, jig: ksq };
  roo(ctx, rs.x, rs.y, scR, rs); koala(ctx, ks.x, ks.y, scK, ks);
  // little thinking dots over Tilou while the clock runs
  if (think) for (let d = 0; d < 3; d++) { const a = 0.5 + 0.5 * Math.sin(tr * 5 - d * 0.9); ball(ctx, kx - 60 - d * 34, gyH - 300 - d * 30, 11 + d * 3, 11 + d * 3, '#FFFFFF', '#F0F2FA', '#C0C8E0'); ctx.globalAlpha = 1 - a * 0.5; ctx.globalAlpha = 1; }
}

// ---------------------------------------------------------------- frame
function draw(ctx, u, tr) {
  const st = STAGE(tr);
  ctx.drawImage(BG.sky, 0, 0);
  { ctx.save(); ctx.globalAlpha = 0.85; const off = (tr * 12) % 1200; ctx.drawImage(L.cloud, -300 - off, 40, 2400, 800); ctx.drawImage(L.cloud, 2100 - off, 40, 2400, 800); ctx.restore(); }
  ctx.drawImage(BG.land, 0, 0);
  // light rays from the sun
  { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const SX = 880, SY = 300; for (let i = 0; i < 6; i++) { const a = PI * 0.62 + (i - 3) * 0.15 + 0.03 * Math.sin(tr * 0.5 + i), w0 = 0.03 + 0.02 * hash01(i, 9), al = 0.05 + 0.04 * Math.sin(tr * 1.1 + i * 2);
    ctx.beginPath(); ctx.moveTo(SX, SY); ctx.lineTo(SX + Math.cos(a - w0) * 2400, SY + Math.sin(a - w0) * 2400); ctx.lineTo(SX + Math.cos(a + w0) * 2400, SY + Math.sin(a + w0) * 2400); ctx.closePath(); ctx.fillStyle = rgrad(ctx, SX, SY, 1900, [[0, `rgba(255,236,170,${A(al)})`], [1, 'rgba(255,236,170,0)']]); ctx.fill(); } ctx.restore(); }
  ctx.drawImage(BG.veil, 0, 0);
  // floating motes
  { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 16; i++) { const life = (tr * (0.05 + 0.04 * hash01(i, 14)) + hash01(i, 15)) % 1, x = 1080 * hash01(i, 16) + 30 * Math.sin(tr * 0.9 + i), y = 1500 - 1300 * life, r = 6 + 8 * hash01(i, 17); ctx.fillStyle = rgrad(ctx, x, y, r * 2.4, [[0, `rgba(255,240,180,${A(0.45 * Math.sin(life * PI))})`], [1, 'rgba(255,240,180,0)']]); ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, TAU); ctx.fill(); } ctx.restore(); }

  if (st.k === 'intro' || tr < QZ[0].q0) {
    const it = TL.phrases[0], k = spring(tr - 0.2, SPRING.bouncy), out = 1 - sm((tr - (QZ[0].q0 - 0.9)) / 0.4);
    if (out > 0.01) { ctx.save(); ctx.globalAlpha = out;
      const words = ['Le', 'grand', 'quiz']; ctx.font = font(150, 600, DISPLAY);
      words.forEach((w, i) => { const p = spring(tr - (0.2 + i * 0.18), SPRING.bouncy); if (p > 0.01) { ctx.save(); ctx.translate(W / 2, 380 + i * 0 + (i === 2 ? 150 : 0) + (1 - p) * 60); ctx.rotate(0.03 * Math.sin(tr * 2 + i)); ctx.scale(p, p);
        const x = i === 0 ? -170 : i === 1 ? 110 : 0; outlined(ctx, w, x, 0, i === 2 ? 190 : 120, i === 2 ? '#FFD84A' : '#FFFFFF', 'rgba(60,30,110,0.9)', 0.16); ctx.restore(); } });
      const p2 = spring(tr - 1.1, SPRING.bouncy); if (p2 > 0.01) { ctx.save(); ctx.translate(W / 2, 700); ctx.scale(p2, p2); panel(ctx, -330, -50, 660, 100, 50, '#B49CFF', '#7B5CFF', 'rgba(255,255,255,0.6)'); outlined(ctx, '10 questions · 5 secondes', 0, 2, 50, '#FFFFFF', 'rgba(40,20,90,0.7)', 0.14); ctx.restore(); }
      ctx.restore(); readAlong(ctx, it, tr, 800); }
  }
  if (st.k === 'q' || (tr > QZ[0].q0 - 0.6 && tr < QZ[NQ - 1].end)) { const s2 = st.k === 'q' ? st : { i: 0, s: QZ[0] }; header(ctx, s2.i, s2.s, tr); }
  if (st.k === 'outro') {
    const ot = TL.phrases[TL.phrases.length - 1], t0 = QZ[NQ - 1].end;
    const p = spring(tr - (t0 + 0.2), SPRING.bouncy); if (p > 0.01) { ctx.save(); ctx.translate(W / 2, 400); ctx.scale(p, p); ctx.rotate(0.04 * Math.sin(tr * 2.4)); outlined(ctx, 'Bravo !', 0, 0, 190, '#FFD84A', 'rgba(60,30,110,0.9)', 0.16); ctx.restore(); }
    for (let i = 0; i < 10; i++) { const k = spring(tr - (t0 + 0.6 + i * 0.12), SPRING.bouncy); if (k <= 0.01) continue; const x = W / 2 + (i - 4.5) * 92, y = 600 + 10 * Math.sin(tr * 3 + i);
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(0.1 * Math.sin(tr * 2 + i)); ctx.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? 18 : 40, a = -PI / 2 + j * PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = lgrad(ctx, 0, -40, 0, 40, [[0, '#FFF3A0'], [1, '#F5A623']]); ctx.fill(); stroke(ctx, '#C07A10', 4); ctx.restore(); }
    readAlong(ctx, ot, tr, 760);
    const f = spring(tr - (ot.t1 + 0.6), SPRING.gentle); if (f > 0.01) { ctx.save(); ctx.globalAlpha = clamp(f); outlined(ctx, 'À bientôt !', W / 2, 820 + (1 - f) * 30, 90, '#FFFFFF', 'rgba(10,20,40,0.9)', 0.18); ctx.restore(); }
    confetti(ctx, W / 2, 400, (tr - (t0 + 0.2)) * 0.8);
  }
  hosts(ctx, tr, st);
  // grade: warm light, gentle vignette, grain
  ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.18; ctx.fillStyle = '#FFB55E'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = rgrad(ctx, W / 2, H * 0.5, H * 0.75, [[0, 'rgba(6,10,26,0)'], [0.65, 'rgba(6,10,26,0.04)'], [1, 'rgba(6,10,26,0.32)']]); ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

await document.fonts.load(`100px ${EMO}`, QD.questions.map((q) => q.show + q.a.map((a) => a[0]).join('')).join(''));
M.film({ fonts: [font(60, 600, DISPLAY)], hits: HITS, samples: 1, init() { buildBG(); }, draw });
