// ================================================================ QUIZ « PRO » (adultes) — fond sombre, pas de personnages
// Même minutage que le format enfants (timeline.js, TL.quiz) ; seule l'image change.
const QD = TL.data, QZ = TL.quiz, NQ = QZ.length;
const SUBJ = (QD.subject || 'Quiz').toUpperCase();
const ACC = '#38BDF8', ACC2 = '#A78BFA', GOOD = '#22C55E', BAD = '#EF4444';
const LVC = ['#22C55E', '#38BDF8', '#F59E0B', '#EF4444'];
const LVNAME = (k) => ((QD.levels || [])[k] || '').toUpperCase();
const ROW = { x: 80, w: 840, h: 140, y0: 800, gap: 26 };
const LET = ['A', 'B', 'C', 'D'];
const sayFrac = (s, k) => (s.a0 === s.q0 ? s.q0 + 0.12 + k * 0.17 : s.a0 + (s.a1 - s.a0) * (k / 4) * 0.92);
const WAITOF = (s) => s.c1 - s.c0;
const STAGE = (tr) => { if (tr < QZ[0].q0 - 0.45) return { k: 'intro' }; for (let i = 0; i < NQ; i++) if (tr < QZ[i].end) return { k: 'q', i, s: QZ[i] }; return { k: 'outro' }; };
const TXT = (ctx, str, x, y, size, col, w = 800, align = 'center') => { ctx.font = font(size, w, DISPLAY); ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(str, x, y); };
const SPACED = (ctx, str, x, y, size, col, sp, w = 700) => { ctx.font = font(size, w, DISPLAY); ctx.letterSpacing = `${sp}px`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(str, x, y); ctx.letterSpacing = '0px'; };
function wrapWords(ctx, str, size, maxW, w = 800) {
  ctx.font = font(size, w, DISPLAY); const out = []; let cur = '';
  for (const wd of str.split(' ')) { const t = cur ? cur + ' ' + wd : wd; if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = wd; } else cur = t; }
  out.push(cur); return out;
}
function glass(ctx, x, y, w, h, r, fill = 'rgba(255,255,255,0.055)', edge = 'rgba(255,255,255,0.13)') {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = 'rgba(14,20,40,0.72)'; ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  ctx.fillStyle = lgrad(ctx, 0, y, 0, y + h, [[0, 'rgba(255,255,255,0.07)'], [0.5, 'rgba(255,255,255,0)']]); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = edge; ctx.stroke();
}

// ---------------------------------------------------------------- sons (plus sobres)
const HITS = [];
HITS.push([2 * 0.3, 'title', 'swell', { gain: 0.1 }]);
QZ.forEach((s) => { if (s.lv) HITS.push([2 * (s.lv[0] - 0.2), 'level', 'whoosh', { len: 0.5, gain: 0.12, from: 400, to: 1800 }]); });
QZ.forEach((s) => {
  HITS.push([2 * (s.q0 - 0.4), 'slide in', 'whoosh', { len: 0.35, gain: 0.08, from: 600, to: 2000 }]);
  for (let k = 0; k < 4; k++) HITS.push([2 * sayFrac(s, k), 'row ' + k, 'tick', { gain: 0.12 }]);
  const nw = Math.round(WAITOF(s)); for (let k = 0; k < nw; k++) HITS.push([2 * (s.c0 + k), 'tick', 'tick', { gain: k === nw - 1 ? 0.3 : 0.22 }]);
  HITS.push([2 * s.c1, 'reveal', 'bell', { pitch: 'E6', gain: 0.16 }], [2 * (s.c1 + 0.08), 'reveal', 'bell', { pitch: 'B6', gain: 0.1 }]);
});
HITS.push([2 * (QZ[NQ - 1].end + 0.2), 'outro', 'swell', { gain: 0.12 }]);

// ---------------------------------------------------------------- fond
const BG = {};
const SYMS = QD.symbols || ['π', '√', '∑', '∞', '÷', '×', '=', '%', '+', '−', 'x²', '∫', 'Δ', '7', '3', '0', '9'];
function buildBG() {
  const [cv, c] = mk(W, H);
  c.fillStyle = lgrad(c, 0, 0, 0, H, [[0, '#0A0F1F'], [0.5, '#0E1530'], [1, '#090D1C']]); c.fillRect(0, 0, W, H);
  c.fillStyle = rgrad(c, 120, 260, 900, [[0, 'rgba(56,189,248,0.22)'], [1, 'rgba(56,189,248,0)']]); c.fillRect(0, 0, W, H);
  c.fillStyle = rgrad(c, 980, 1600, 1000, [[0, 'rgba(167,139,250,0.2)'], [1, 'rgba(167,139,250,0)']]); c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(255,255,255,0.045)'; c.lineWidth = 1;
  for (let x = 0; x <= W; x += 60) { c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, H); c.stroke(); }
  for (let y = 0; y <= H; y += 60) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(W, y + 0.5); c.stroke(); }
  c.fillStyle = rgrad(c, W / 2, H / 2, H * 0.75, [[0, 'rgba(0,0,0,0)'], [0.7, 'rgba(0,0,0,0.15)'], [1, 'rgba(0,0,0,0.55)']]); c.fillRect(0, 0, W, H);
  BG.base = cv;
}
function floaters(ctx, tr) {
  for (let i = 0; i < 22; i++) {
    const life = (tr * (0.012 + 0.012 * hash01(i, 3)) + hash01(i, 4)) % 1, x = 60 + 960 * hash01(i, 5) + 40 * Math.sin(tr * 0.3 + i), y = H + 100 - (H + 300) * life;
    const a = 0.09 * Math.sin(life * PI); ctx.save(); ctx.translate(x, y); ctx.rotate(0.3 * Math.sin(tr * 0.2 + i));
    TXT(ctx, SYMS[i % SYMS.length], 0, 0, 60 + 70 * hash01(i, 6), `rgba(200,220,255,${A(a)})`, 300); ctx.restore();
  }
}

// ---------------------------------------------------------------- en-tête, question, réponses
function topBar(ctx, i, s, tr, alpha) {
  ctx.save(); ctx.globalAlpha = alpha;
  if (!QD.banner) SPACED(ctx, `QUIZ ${SUBJ}`, W / 2, 200, 30, 'rgba(255,255,255,0.55)', 8, 700);
  const lc = s.level != null ? LVC[s.level] : ACC, label = s.level != null ? `NIVEAU ${s.level + 1} · ${LVNAME(s.level)}` : 'QUESTION';
  ctx.font = font(30, 800, DISPLAY); ctx.letterSpacing = '3px'; const tw = ctx.measureText(label).width; ctx.letterSpacing = '0px';
  ctx.beginPath(); ctx.roundRect(W / 2 - tw / 2 - 34, 238, tw + 68, 60, 30); ctx.fillStyle = lc + '22'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = lc; ctx.stroke();
  SPACED(ctx, label, W / 2, 269, 30, lc, 3, 800);
  // barre de progression en segments
  const sw = 72, g = 10, x0 = W / 2 - (NQ * sw + (NQ - 1) * g) / 2;
  for (let d = 0; d < NQ; d++) { const done = d < i || (d === i && tr > s.c1), cur = d === i;
    ctx.beginPath(); ctx.roundRect(x0 + d * (sw + g), 330, sw, 8, 4); ctx.fillStyle = done ? lc : cur ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.14)'; ctx.fill(); }
  ctx.restore();
}
function row(ctx, idx, q, s, tr) {
  const y = ROW.y0 + idx * (ROW.h + ROW.gap), x = ROW.x, w = ROW.w, h = ROW.h;
  const ap = spring(tr - (sayFrac(s, idx) - 0.12), SPRING.snappy); if (ap <= 0.01) return;
  const reveal = tr > s.c1, ok = idx === q.ok, rk = clamp(spring(tr - s.c1, SPRING.snappy));
  ctx.save(); ctx.globalAlpha = clamp(ap * 1.4) * (reveal && !ok ? 1 - 0.6 * rk : 1); ctx.translate((1 - ap) * 80, 0);
  if (reveal && ok) { ctx.save(); ctx.shadowColor = 'rgba(34,197,94,0.75)'; ctx.shadowBlur = 50 * rk; ctx.beginPath(); ctx.roundRect(x, y, w, h, 28); ctx.fillStyle = `rgba(34,197,94,${A(0.9 * rk)})`; ctx.fill(); ctx.restore(); }
  glass(ctx, x, y, w, h, 28, reveal && ok ? `rgba(34,197,94,${A(0.75 * rk)})` : 'rgba(255,255,255,0.055)', reveal && ok ? 'rgba(180,255,200,0.9)' : 'rgba(255,255,255,0.14)');
  // lettre
  ctx.beginPath(); ctx.roundRect(x + 26, y + 30, 80, 80, 20); ctx.fillStyle = reveal && ok ? 'rgba(255,255,255,0.95)' : 'rgba(56,189,248,0.14)'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = reveal && ok ? '#FFFFFF' : 'rgba(56,189,248,0.6)'; ctx.stroke();
  TXT(ctx, LET[idx], x + 66, y + 72, 44, reveal && ok ? '#15803D' : ACC, 800);
  { const lab = q.a[idx][1]; let fs = 66; ctx.font = font(fs, 800, DISPLAY); const mw = w - 140 - 110; const tw0 = ctx.measureText(lab).width; if (tw0 > mw) fs = Math.max(40, Math.floor(fs * mw / tw0)); TXT(ctx, lab, x + 140, y + h / 2 + 3, fs, '#FFFFFF', 800, 'left'); }
  if (reveal && ok) { const k = rk; ctx.save(); ctx.translate(x + w - 70, y + h / 2); ctx.scale(k, k); ctx.beginPath(); ctx.arc(0, 0, 36, 0, TAU); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-16, 1); ctx.lineTo(-4, 14); ctx.lineTo(18, -12); ctx.strokeStyle = '#16A34A'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
function timer(ctx, s, tr) {
  const WT = Math.round(WAITOF(s)), p = clamp((tr - s.c0) / WT), on = spring(tr - s.c0 + 0.15, SPRING.snappy), out = 1 - sm((tr - s.c1) / 0.3);
  if (tr < s.c0 - 0.2 || out <= 0.01) return;
  const n = Math.max(1, WT - Math.floor(clamp(p, 0, 0.999) * WT)), last = p > 1 - 1 / WT, col = last ? BAD : ACC;
  ctx.save(); ctx.globalAlpha = clamp(on) * out;
  const bx = ROW.x, bw = ROW.w - 120, by = 735;
  ctx.beginPath(); ctx.roundRect(bx, by - 7, bw, 14, 7); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
  ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 18; ctx.beginPath(); ctx.roundRect(bx, by - 7, Math.max(14, bw * (1 - p)), 14, 7); ctx.fillStyle = lgrad(ctx, bx, 0, bx + bw, 0, [[0, last ? '#F87171' : ACC2], [1, col]]); ctx.fill(); ctx.restore();
  const sub = (p * WT) % 1, pop = 1 + 0.18 * Math.exp(-sub * 8);
  ctx.translate(ROW.x + ROW.w - 50, by); ctx.scale(pop, pop); TXT(ctx, `${n}s`, 0, 2, 50, col, 800);
  ctx.restore();
}
function question(ctx, i, s, tr) {
  const k = spring(tr - (s.q0 - 0.35), SPRING.snappy), out = 1 - sm((tr - (s.end - 0.35)) / 0.3), slide = (1 - k) * 120 - (1 - out) * 200;
  topBar(ctx, i, s, tr, clamp(Math.min(1, out * 1.5)));
  const q = QD.questions[i];
  ctx.save(); ctx.globalAlpha = clamp(Math.min(k * 1.4, out * 1.5)); ctx.translate(0, slide);
  glass(ctx, ROW.x, 380, ROW.w, 300, 34);
  TXT(ctx, `Q${String(i + 1).padStart(2, '0')}`, ROW.x + 44, 430, 32, ACC, 800, 'left');
  const qt = (q.qd || q.q).replace(/ ([?!:;])/g, ' $1');
  if (q.show) { // grand emoji (drapeau…) au centre de la carte, question courte à côté du numéro
    TXT(ctx, qt, ROW.x + 130, 430, 44, '#FFFFFF', 800, 'left');
    const sk = spring(tr - (s.q0 - 0.2), SPRING.bouncy); ctx.save(); ctx.translate(ROW.x + ROW.w / 2, 568); ctx.scale(sk, sk);
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10; ctx.font = '180px "Noto Color Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(q.show, 0, 0); ctx.restore();
  } else {
  const size = qt.length > 40 ? 52 : 60, lines = wrapWords(ctx, qt, size, ROW.w - 90);
  lines.forEach((ln, li) => TXT(ctx, ln, ROW.x + 44, 545 + (li - (lines.length - 1) / 2) * (size * 1.22), size, '#FFFFFF', 800, 'left'));
  }
  ctx.restore();
  ctx.save(); ctx.globalAlpha = clamp(out * 1.5); ctx.translate(0, -(1 - out) * 200);
  for (let c = 0; c < 4; c++) row(ctx, c, q, s, tr);
  timer(ctx, s, tr);
  ctx.restore();
}
function levelCard(ctx, tr) {
  for (const s of QZ) { if (!s.lv) continue; const [a, , k] = s.lv, p = spring(tr - (a - 0.25), SPRING.snappy), out = 1 - sm((tr - (s.q0 - 0.55)) / 0.3);
    if (tr < a - 0.3 || out <= 0.01 || p <= 0.01) continue;
    ctx.save(); ctx.globalAlpha = clamp(out) * clamp(p * 1.3); ctx.fillStyle = 'rgba(5,8,18,0.72)'; ctx.fillRect(0, 0, W, H);
    const c = LVC[k]; SPACED(ctx, `NIVEAU ${k + 1} / 4`, W / 2, 790, 36, 'rgba(255,255,255,0.65)', 10, 700);
    ctx.save(); ctx.translate(W / 2, 900); ctx.scale(0.85 + 0.15 * p, 0.85 + 0.15 * p); ctx.shadowColor = c; ctx.shadowBlur = 40; TXT(ctx, LVNAME(k), 0, 0, 130, c, 900); ctx.restore();
    const lw = 420 * clamp(p); ctx.fillStyle = c; ctx.fillRect(W / 2 - lw / 2, 1000, lw, 6);
    ctx.restore(); }
}

// ---------------------------------------------------------------- image
function draw(ctx, u, tr) {
  const st = STAGE(tr);
  ctx.drawImage(BG.base, 0, 0); floaters(ctx, tr);
  if (tr < QZ[0].q0) {
    const out = 1 - sm((tr - (QZ[0].lv ? QZ[0].lv[0] - 0.5 : QZ[0].q0 - 0.9)) / 0.4);
    if (out > 0.01) { ctx.save(); ctx.globalAlpha = out;
      const p0 = spring(tr - 0.15, SPRING.snappy), p1 = spring(tr - 0.35, SPRING.snappy), p2 = spring(tr - 0.8, SPRING.snappy);
      ctx.save(); ctx.globalAlpha = out * clamp(p0); SPACED(ctx, 'QUIZ', W / 2, 640 - (1 - p0) * 30, 64, 'rgba(255,255,255,0.8)', 26, 700); ctx.restore();
      ctx.save(); ctx.globalAlpha = out * clamp(p1); ctx.translate(W / 2, 800); ctx.scale(0.9 + 0.1 * p1, 0.9 + 0.1 * p1); ctx.shadowColor = 'rgba(56,189,248,0.6)'; ctx.shadowBlur = 50;
        ctx.font = font(200, 900, DISPLAY); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = lgrad(ctx, -380, 0, 380, 0, [[0, ACC], [1, ACC2]]); ctx.fillText(SUBJ, 0, 0); ctx.restore();
      const lw = 520 * clamp(p2); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(W / 2 - lw / 2, 930, lw, 3);
      ctx.save(); ctx.globalAlpha = out * clamp(p2); TXT(ctx, QD.tagline || `${NQ} questions · de facile à impossible`, W / 2, 1000, 44, 'rgba(255,255,255,0.85)', 600);
        TXT(ctx, QD.hook || 'Tu iras jusqu’au bout ?', W / 2, 1080, 52, '#FFFFFF', 800); ctx.restore();
      ctx.restore(); }
  }
  if (st.k === 'q' || (tr > QZ[0].q0 - 0.6 && tr < QZ[NQ - 1].end)) { const s2 = st.k === 'q' ? st : { i: 0, s: QZ[0] }; question(ctx, s2.i, s2.s, tr); }
  if (st.k === 'outro') {
    const t0 = QZ[NQ - 1].end, p = spring(tr - (t0 + 0.05), SPRING.snappy), p2 = spring(tr - (t0 + 0.5), SPRING.snappy), p3 = spring(tr - (t0 + 1.0), SPRING.snappy);
    ctx.save(); ctx.globalAlpha = clamp(p); SPACED(ctx, 'ALORS, TON SCORE ?', W / 2, 640, 44, 'rgba(255,255,255,0.75)', 8, 700);
    ctx.translate(W / 2, 800); ctx.scale(0.9 + 0.1 * p, 0.9 + 0.1 * p); ctx.shadowColor = 'rgba(56,189,248,0.6)'; ctx.shadowBlur = 50;
    ctx.font = font(220, 900, DISPLAY); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = lgrad(ctx, -260, 0, 260, 0, [[0, ACC], [1, ACC2]]); ctx.fillText(`?/${NQ}`, 0, 0); ctx.restore();
    ctx.save(); ctx.globalAlpha = clamp(p2); TXT(ctx, 'Écris-le en commentaire', W / 2, 990, 50, '#FFFFFF', 700); ctx.restore();
    if (p3 > 0.01) { ctx.save(); ctx.globalAlpha = clamp(p3 * 1.3); ctx.translate(W / 2, 1130); const pulse = 1 + 0.025 * Math.sin(tr * 6); ctx.scale(pulse * (0.9 + 0.1 * p3), pulse * (0.9 + 0.1 * p3));
      ctx.save(); ctx.shadowColor = 'rgba(239,68,68,0.6)'; ctx.shadowBlur = 40; ctx.beginPath(); ctx.roundRect(-270, -56, 540, 112, 56); ctx.fillStyle = lgrad(ctx, 0, -56, 0, 56, [[0, '#F43F5E'], [1, '#DC2626']]); ctx.fill(); ctx.restore();
      TXT(ctx, "S'abonner", 0, 3, 52, '#FFFFFF', 800); ctx.restore(); }
  }
  levelCard(ctx, tr);
  if (QD.banner) { // titre fixe, visible toute la vidéo
    ctx.save(); const t = QD.banner.toUpperCase(); let bf = 50; ctx.font = font(bf, 900, DISPLAY); ctx.letterSpacing = '4px'; let tw = ctx.measureText(t).width; if (tw > W - 260) { bf = Math.floor(bf * (W - 260) / tw); ctx.font = font(bf, 900, DISPLAY); tw = ctx.measureText(t).width; } ctx.letterSpacing = '0px';
    const bw = tw + 120, bx = W / 2 - bw / 2, by = 92;
    ctx.shadowColor = 'rgba(56,189,248,0.45)'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.roundRect(bx, by, bw, 96, 48); ctx.fillStyle = lgrad(ctx, bx, 0, bx + bw, 0, [[0, '#1D4ED8'], [0.5, '#F8FAFC'], [1, '#DC2626']]); ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.roundRect(bx + 4, by + 4, bw - 8, 88, 44); ctx.fillStyle = 'rgba(10,15,31,0.86)'; ctx.fill();
    SPACED(ctx, t, W / 2, by + 50, bf, '#FFFFFF', 4, 900); ctx.restore(); }
}

M.film({ fonts: [font(60, 800, DISPLAY)], hits: HITS, samples: 1, init() { buildBG(); }, draw });
