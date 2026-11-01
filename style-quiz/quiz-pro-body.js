// ================================================================ QUIZ « PRO » (adultes) — fond sombre, pas de personnages
// Même minutage que le format enfants (timeline.js, TL.quiz) ; seule l'image change.
const QD = TL.data, QZ = TL.quiz, NQ = QZ.length;
const SUBJ = (QD.subject || 'Quiz').toUpperCase();
// Palettes : chaque vidéo change de couleurs et de décor (QD.palette / QD.pattern pour forcer, sinon choix selon le titre).
const PALETTES = {
  nuit:      { bg: ['#0A0F1F', '#0E1530', '#090D1C'], acc: '#38BDF8', acc2: '#A78BFA', ban: ['#1D4ED8', '#F8FAFC', '#DC2626'], card: 'rgba(14,20,40,0.72)', fl: '200,220,255' },
  halloween: { bg: ['#150A04', '#24100A', '#0B0603'], acc: '#FB923C', acc2: '#A855F7', ban: ['#F97316', '#FDE68A', '#7C3AED'], card: 'rgba(32,14,8,0.74)', fl: '255,190,140' },
  emeraude:  { bg: ['#03140F', '#062A20', '#020F0B'], acc: '#34D399', acc2: '#FBBF24', ban: ['#059669', '#ECFDF5', '#F59E0B'], card: 'rgba(6,28,22,0.74)', fl: '190,255,225' },
  pourpre:   { bg: ['#110718', '#1F0B2E', '#0A0510'], acc: '#F472B6', acc2: '#818CF8', ban: ['#DB2777', '#FCE7F3', '#6366F1'], card: 'rgba(28,12,40,0.74)', fl: '255,200,240' },
  ocean:     { bg: ['#021318', '#05262E', '#020D11'], acc: '#22D3EE', acc2: '#2DD4BF', ban: ['#0891B2', '#F0FDFA', '#0D9488'], card: 'rgba(6,26,32,0.74)', fl: '180,240,255' },
  or:        { bg: ['#120E07', '#231A0B', '#0B0805'], acc: '#FBBF24', acc2: '#F87171', ban: ['#B45309', '#FEF3C7', '#DC2626'], card: 'rgba(30,22,10,0.74)', fl: '255,230,170' },
  corail:    { bg: ['#160807', '#2B0F10', '#0E0505'], acc: '#FB7185', acc2: '#FDBA74', ban: ['#E11D48', '#FFE4E6', '#EA580C'], card: 'rgba(36,12,14,0.74)', fl: '255,200,200' },
  glace:     { bg: ['#0B1220', '#16213A', '#070C16'], acc: '#93C5FD', acc2: '#C4B5FD', ban: ['#60A5FA', '#FFFFFF', '#A78BFA'], card: 'rgba(18,26,46,0.74)', fl: '220,235,255' },
};
const PATTERNS = ['grille', 'points', 'diagonales', 'losanges', 'cercles'];
const HKEY = (str) => { let h = 2166136261; for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const PK = Object.keys(PALETTES).filter((k) => k !== 'halloween'), // halloween seulement si demandé
      HK = HKEY(QD.title || QD.banner || QD.subject || 'quiz');
const PAL = { ...(PALETTES[QD.palette] || PALETTES[PK[HK % PK.length]]) };
// Décor selon le thème (1er nov. 2026) : France = tricolore, Monde = globe, Art = musée doré, Intrus = néon. QD.decor pour forcer.
const _TT = ((QD.title || '') + ' ' + (QD.banner || '') + ' ' + (QD.subject || '')).toLowerCase(), _DS = (QD.description || '').toLowerCase();
const LETTRE = QD.mode === 'lettre', LTR = (QD.letter || 'A').toUpperCase();
const DECOR = QD.decor || (QD.palette ? 'aucun' : LETTRE ? 'lettre' : /intrus/.test(_TT) ? 'intrus' : /(peinture|peintre|tableau|musée|\bart\b)/.test(_TT) ? 'musee'
  : /#france\b/.test(_DS) ? 'france' : /#monde\b/.test(_DS) ? 'monde' : 'aucun');
const DECOR_PAL = {
  france: { bg: ['#040A1C', '#0A1636', '#030714'], acc: '#60A5FA', acc2: '#F87171', ban: ['#0055A4', '#FFFFFF', '#EF4135'], card: 'rgba(9,17,42,0.80)', fl: '215,228,255' },
  monde:  { bg: ['#02111A', '#052433', '#020A10'], acc: '#2DD4BF', acc2: '#38BDF8', ban: ['#0EA5E9', '#5EEAD4', '#2563EB'], card: 'rgba(5,24,34,0.80)', fl: '180,240,255' },
  musee:  { bg: ['#0D0806', '#1D130C', '#070403'], acc: '#E8C37A', acc2: '#C0883A', ban: ['#8A6A2F', '#F5E1A4', '#B8862B'], card: 'rgba(24,16,10,0.82)', fl: '255,226,170' },
  lettre: { bg: ['#06091A', '#0F1633', '#04060F'], acc: '#FACC15', acc2: '#FB923C', ban: ['#F59E0B', '#FDE68A', '#F97316'], card: 'rgba(12,16,38,0.82)', fl: '255,235,170' },
  intrus: { bg: ['#07060E', '#130F22', '#050409'], acc: '#A78BFA', acc2: '#F472B6', ban: ['#7C3AED', '#F472B6', '#6366F1'], card: 'rgba(16,12,30,0.80)', fl: '225,210,255' },
};
if (DECOR_PAL[DECOR] && !QD.palette) Object.assign(PAL, DECOR_PAL[DECOR]);
// Icône du thème devant le titre : QD.icon, sinon le premier émoji de « symbols », sinon celle du décor.
const _isEmo = (x) => [...x].some((ch) => ch.codePointAt(0) >= 0x1F000 || ch.codePointAt(0) === 0x2708);
const ICON = DECOR === 'aucun' ? null : (QD.icon || (QD.symbols || []).find(_isEmo) || { france: '🇫🇷', monde: '🌍', musee: '🎨', intrus: '🔍', lettre: '🔤' }[DECOR]);
const PAT = PATTERNS.includes(QD.pattern) ? QD.pattern : PATTERNS[(HK >>> 8) % PATTERNS.length];
const RGBA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const DY = 120; // tout est décalé vers le bas : le haut de l'écran est caché par la barre de recherche TikTok
const ACC = PAL.acc, ACC2 = PAL.acc2, GOOD = '#22C55E', BAD = '#EF4444';
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
function glass(ctx, x, y, w, h, r, fill = 'rgba(255,255,255,0.055)', edge = null) {
  if (!edge) edge = DECOR === 'aucun' ? 'rgba(255,255,255,0.13)' : lgrad(ctx, x, y, x + w, y + h, [[0, RGBA(PAL.acc, 0.55)], [0.45, 'rgba(255,255,255,0.10)'], [1, RGBA(PAL.acc2, 0.45)]]);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = PAL.card; ctx.fill(); ctx.restore();
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
  if (!LETTRE) for (let k = 0; k < 4; k++) HITS.push([2 * sayFrac(s, k), 'row ' + k, 'tick', { gain: 0.12 }]);
  const nw = Math.round(WAITOF(s)); for (let k = 0; k < nw; k++) HITS.push([2 * (s.c0 + k), 'tick', 'tick', { gain: k === nw - 1 ? 0.3 : 0.22 }]);
  HITS.push([2 * s.c1, 'reveal', 'bell', { pitch: 'E6', gain: 0.16 }], [2 * (s.c1 + 0.08), 'reveal', 'bell', { pitch: 'B6', gain: 0.1 }]);
});
HITS.push([2 * (QZ[NQ - 1].end + 0.2), 'outro', 'swell', { gain: 0.12 }]);

// ---------------------------------------------------------------- fond
const BG = {};
const SYMS = QD.symbols || ['π', '√', '∑', '∞', '÷', '×', '=', '%', '+', '−', 'x²', '∫', 'Δ', '7', '3', '0', '9'];
function buildBG() {
  const [cv, c] = mk(W, H);
  c.fillStyle = lgrad(c, 0, 0, 0, H, [[0, PAL.bg[0]], [0.5, PAL.bg[1]], [1, PAL.bg[2]]]); c.fillRect(0, 0, W, H);
  c.fillStyle = rgrad(c, 120, 260, 900, [[0, RGBA(ACC, 0.22)], [1, RGBA(ACC, 0)]]); c.fillRect(0, 0, W, H);
  c.fillStyle = rgrad(c, 980, 1600, 1000, [[0, RGBA(ACC2, 0.2)], [1, RGBA(ACC2, 0)]]); c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(255,255,255,0.045)'; c.lineWidth = 1;
  if (DECOR !== 'aucun') decorBG(c);
  else if (PAT === 'grille') {
    for (let x = 0; x <= W; x += 60) { c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, H); c.stroke(); }
    for (let y = 0; y <= H; y += 60) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(W, y + 0.5); c.stroke(); }
  } else if (PAT === 'points') {
    c.fillStyle = 'rgba(255,255,255,0.07)'; for (let x = 30; x < W; x += 54) for (let y = 30; y < H; y += 54) { c.beginPath(); c.arc(x, y, 2.2, 0, TAU); c.fill(); }
  } else if (PAT === 'diagonales') {
    c.lineWidth = 2; for (let k = -H; k < W; k += 70) { c.beginPath(); c.moveTo(k, H); c.lineTo(k + H, 0); c.stroke(); }
  } else if (PAT === 'losanges') {
    for (let k = -H; k < W + H; k += 90) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + H, H); c.stroke(); c.beginPath(); c.moveTo(k, H); c.lineTo(k + H, 0); c.stroke(); }
  } else { // cercles concentriques
    c.lineWidth = 1.5; for (let r = 80; r < 1700; r += 80) { c.beginPath(); c.arc(W * 0.85, H * 0.18, r, 0, TAU); c.stroke(); }
  }
  c.fillStyle = rgrad(c, W / 2, H / 2, H * 0.75, [[0, 'rgba(0,0,0,0)'], [0.7, 'rgba(0,0,0,0.15)'], [1, 'rgba(0,0,0,0.55)']]); c.fillRect(0, 0, W, H);
  // grain fixe (rendu « papier photo », compresse bien car il ne bouge pas)
  if (DECOR !== 'aucun') { const id = c.getImageData(0, 0, W, H), d = id.data, rnd = mulberry32(7);
    for (let k = 0; k < d.length; k += 4) { const n = (rnd() - 0.5) * 9; d[k] += n; d[k + 1] += n; d[k + 2] += n; } c.putImageData(id, 0, 0); }
  BG.base = cv;
}
function eiffel(c, x0, y0, h) { // tour Eiffel en traits fins
  const L = (pts) => { c.beginPath(); pts.forEach(([x, y], k) => (k ? c.lineTo : c.moveTo).call(c, x0 + x * h, y0 - y * h)); c.stroke(); };
  for (const sg of [-1, 1]) {
    c.beginPath(); c.moveTo(x0 + sg * 0.34 * h, y0); c.quadraticCurveTo(x0 + sg * 0.17 * h, y0 - 0.12 * h, x0 + sg * 0.12 * h, y0 - 0.27 * h); c.stroke();
    L([[sg * 0.24, 0], [sg * 0.10, 0.27]]);
    L([[sg * 0.115, 0.30], [sg * 0.055, 0.55]]); L([[sg * 0.075, 0.30], [sg * 0.035, 0.55]]);
    L([[sg * 0.05, 0.57], [sg * 0.014, 0.88]]);
    for (let k = 0; k < 4; k++) { const a = 0.30 + k * 0.0625, b = a + 0.0625, wa = 0.115 - 0.06 * (a - 0.30) / 0.25 * 1, wb = 0.115 - 0.06 * (b - 0.30) / 0.25;
      L([[sg * wa, a], [sg * (wb - 0.035), b]]); L([[sg * (wa - 0.04), a], [sg * wb, b]]); }
    for (let k = 0; k < 5; k++) { const a = 0.57 + k * 0.062, b = a + 0.062, wa = 0.05 - 0.036 * (a - 0.57) / 0.31, wb = 0.05 - 0.036 * (b - 0.57) / 0.31;
      L([[sg * wa, a], [-sg * wb * 0.2, b]]); }
  }
  c.beginPath(); c.moveTo(x0 - 0.24 * h, y0); c.quadraticCurveTo(x0, y0 - 0.25 * h, x0 + 0.24 * h, y0); c.stroke();
  c.strokeRect(x0 - 0.16 * h, y0 - 0.30 * h, 0.32 * h, 0.03 * h); c.strokeRect(x0 - 0.085 * h, y0 - 0.57 * h, 0.17 * h, 0.02 * h);
  c.strokeRect(x0 - 0.025 * h, y0 - 0.92 * h, 0.05 * h, 0.04 * h); L([[0, 0.92], [0, 1.0]]);
}
function decorBG(c) {
  if (DECOR === 'france') {
    c.fillStyle = rgrad(c, 0, 0, 1100, [[0, 'rgba(0,85,164,0.38)'], [1, 'rgba(0,85,164,0)']]); c.fillRect(0, 0, W, H);
    c.fillStyle = rgrad(c, W, H, 1100, [[0, 'rgba(239,65,53,0.26)'], [1, 'rgba(239,65,53,0)']]); c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = 30; x < W; x += 54) for (let y = 30; y < H; y += 54) { c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill(); }
    c.save(); c.strokeStyle = 'rgba(255,255,255,0.13)'; c.lineWidth = 3; c.lineCap = 'round'; eiffel(c, W * 0.80, H - 30, 1250); c.restore();
    // liseré tricolore sur le bord gauche
    [['#0055A4', 0], ['#FFFFFF', 1], ['#EF4135', 2]].forEach(([col, k]) => { c.fillStyle = col; c.globalAlpha = 0.85; c.fillRect(0, H * k / 3, 10, H / 3); }); c.globalAlpha = 1;
  } else if (DECOR === 'musee') {
    c.save(); c.filter = 'blur(40px)';
    for (const [x, a] of [[W * 0.18, 0.10], [W * 0.5, 0.13], [W * 0.82, 0.10]]) { c.beginPath(); c.moveTo(x - 40, -40); c.lineTo(x + 40, -40); c.lineTo(x + 330, H * 0.85); c.lineTo(x - 330, H * 0.85); c.closePath();
      c.fillStyle = lgrad(c, 0, 0, 0, H * 0.85, [[0, `rgba(255,228,170,${a})`], [1, 'rgba(255,228,170,0)']]); c.fill(); }
    c.restore();
    c.strokeStyle = 'rgba(255,230,190,0.018)'; c.lineWidth = 1; for (let k = 0; k < H; k += 6) { c.beginPath(); c.moveTo(0, k); c.lineTo(W, k + 3); c.stroke(); }
    // cadre doré de l'écran
    c.lineWidth = 3; c.strokeStyle = lgrad(c, 0, 0, W, H, [[0, '#8A6A2F'], [0.3, '#F5E1A4'], [0.6, '#B8862B'], [1, '#F5E1A4']]); c.strokeRect(26, 26, W - 52, H - 52);
    c.lineWidth = 1; c.strokeStyle = 'rgba(232,195,122,0.35)'; c.strokeRect(40, 40, W - 80, H - 80);
  } else if (DECOR === 'monde') {
    const rnd = mulberry32(3); for (let k = 0; k < 160; k++) { c.fillStyle = `rgba(255,255,255,${(0.08 + 0.3 * rnd()).toFixed(2)})`; c.beginPath(); c.arc(W * rnd(), H * 0.7 * rnd(), 0.8 + 1.6 * rnd(), 0, TAU); c.fill(); }
  } else if (DECOR === 'lettre') {
    c.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = 30; x < W; x += 54) for (let y = 30; y < H; y += 54) { c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill(); }
  } else if (DECOR === 'intrus') {
    c.strokeStyle = 'rgba(255,255,255,0.04)'; const r = 46, hx = r * Math.sqrt(3);
    for (let y = 0, j = 0; y < H + r; y += r * 1.5, j++) for (let x = (j % 2) * hx / 2; x < W + hx; x += hx) { c.beginPath(); for (let k = 0; k < 6; k++) { const a = PI / 6 + k * PI / 3; c.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); } c.closePath(); c.stroke(); }
  }
}
const twinkle = (ctx, x, y, r, a, col) => { if (a <= 0.01) return; ctx.save(); ctx.translate(x, y); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgrad(ctx, 0, 0, r * 3, [[0, `rgba(${col},${A(a * 0.6)})`], [1, `rgba(${col},0)`]]); ctx.fillRect(-r * 3, -r * 3, r * 6, r * 6);
  ctx.fillStyle = `rgba(${col},${A(a)})`; ctx.beginPath(); ctx.moveTo(0, -r * 2.2); ctx.lineTo(r * 0.3, -r * 0.3); ctx.lineTo(r * 2.2, 0); ctx.lineTo(r * 0.3, r * 0.3); ctx.lineTo(0, r * 2.2); ctx.lineTo(-r * 0.3, r * 0.3); ctx.lineTo(-r * 2.2, 0); ctx.lineTo(-r * 0.3, -r * 0.3); ctx.closePath(); ctx.fill(); ctx.restore(); };
function bokeh(ctx, tr, n, col, amax) { // halos flous qui montent lentement
  for (let i = 0; i < n; i++) { const life = (tr * (0.015 + 0.02 * hash01(i, 21)) + hash01(i, 22)) % 1, x = W * hash01(i, 23) + 60 * Math.sin(tr * 0.4 + i), y = H * (1.05 - 1.1 * life), r = 18 + 50 * hash01(i, 24);
    ctx.fillStyle = rgrad(ctx, x, y, r, [[0, `rgba(${col},${A(amax * Math.sin(life * PI))})`], [0.6, `rgba(${col},${A(amax * 0.4 * Math.sin(life * PI))})`], [1, `rgba(${col},0)`]]); ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
}
function decorAnim(ctx, tr) {
  decorAnim2(ctx, tr);
  if (DECOR === 'france') {
    // rubans bleu-blanc-rouge qui ondulent en bas
    [['0,85,164', 0], ['255,255,255', 1], ['239,65,53', 2]].forEach(([col, k]) => { ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 20) { const y = H - 330 + k * 34 + 40 * Math.sin(x / 260 + tr * 0.9 + k * 0.5) + 18 * Math.sin(x / 120 - tr * 1.3); x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.lineWidth = 22; ctx.strokeStyle = `rgba(${col},${k === 1 ? 0.07 : 0.13})`; ctx.stroke(); });
    // scintillement de la tour Eiffel (comme chaque soir à Paris)
    const x0 = W * 0.80, y0 = H - 30, h = 1250;
    for (let i = 0; i < 26; i++) { const yy = 0.04 + 0.86 * hash01(i, 31), hw = yy < 0.27 ? 0.34 - 0.81 * yy : yy < 0.55 ? 0.12 - 0.23 * (yy - 0.27) : 0.05 - 0.1 * (yy - 0.55);
      const ph = (tr * (0.7 + 0.8 * hash01(i, 32)) + hash01(i, 33)) % 1; twinkle(ctx, x0 + (2 * hash01(i, 34) - 1) * hw * h * 0.8, y0 - yy * h, 3 + 3 * hash01(i, 35), Math.max(0, Math.sin(ph * TAU)) * 0.7, '255,236,190'); }
    bokeh(ctx, tr, 10, '255,255,255', 0.06);
  } else if (DECOR === 'monde') {
    // étoiles qui scintillent + étoile filante
    for (let i = 0; i < 30; i++) { const ph = (tr * (0.3 + 0.5 * hash01(i, 41)) + hash01(i, 42)) % 1; twinkle(ctx, W * hash01(i, 43), H * 0.6 * hash01(i, 44), 1.6 + 2 * hash01(i, 45), 0.55 * Math.max(0, Math.sin(ph * TAU)), '200,245,255'); }
    { const per = 7, u = (tr % per) / per * 4, n = Math.floor(tr / per); if (u < 1) { const sx = W * (0.15 + 0.6 * hash01(n, 46)), sy = 120 + 300 * hash01(n, 47), x = sx + 700 * u, y = sy + 300 * u;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = lgrad(ctx, x - 220, y - 95, x, y, [[0, 'rgba(255,255,255,0)'], [1, `rgba(255,255,255,${A(0.75 * Math.sin(u * PI))})`]]);
      ctx.beginPath(); ctx.moveTo(x - 220, y - 95); ctx.lineTo(x, y); ctx.stroke(); ctx.restore(); } }
  } else if (DECOR === 'musee') {
    // poussière dorée dans les faisceaux + spots qui respirent
    for (const [x, k] of [[W * 0.18, 0], [W * 0.5, 1], [W * 0.82, 2]]) { const a = 0.05 + 0.04 * Math.sin(tr * 0.7 + k * 2.1);
      ctx.fillStyle = rgrad(ctx, x, 0, 700, [[0, `rgba(255,228,170,${A(a)})`], [1, 'rgba(255,228,170,0)']]); ctx.fillRect(0, 0, W, 900); }
    for (let i = 0; i < 70; i++) { const life = (tr * (0.01 + 0.015 * hash01(i, 51)) + hash01(i, 52)) % 1, lane = [0.18, 0.5, 0.82][i % 3];
      const y = H * 0.85 * (1 - life), x = W * lane + (2 * hash01(i, 53) - 1) * (40 + 300 * (y / (H * 0.85))) + 20 * Math.sin(tr * 0.8 + i), r = 1.2 + 2.4 * hash01(i, 54);
      ctx.fillStyle = `rgba(255,226,160,${A(0.55 * Math.sin(life * PI) * (0.4 + 0.6 * Math.abs(Math.sin(tr * 2 + i))))})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  } else if (DECOR === 'intrus') {
    // alvéoles qui s'allument au hasard + points d'interrogation
    const r = 46, hx = r * Math.sqrt(3);
    for (let i = 0; i < 9; i++) { const n = Math.floor(tr / 2.2 + hash01(i, 61)), ph = (tr / 2.2 + hash01(i, 61)) % 1, j = Math.floor(hash01(n * 13 + i, 62) * 28), col = Math.floor(hash01(n * 13 + i, 63) * 13);
      const cx = col * hx + (j % 2) * hx / 2, cy = j * r * 1.5, a = 0.35 * Math.sin(ph * PI);
      ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = PI / 6 + k * PI / 3; ctx.lineTo(cx + r * Math.cos(an), cy + r * Math.sin(an)); } ctx.closePath();
      ctx.fillStyle = RGBA(i % 2 ? '#F472B6' : '#A78BFA', a * 0.35); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = RGBA(i % 2 ? '#F472B6' : '#A78BFA', a); ctx.stroke(); }
    bokeh(ctx, tr, 12, '200,170,255', 0.08);
  }
}
function decorAnim2(ctx, tr) {
  if (DECOR === 'lettre') { // lettre géante en contour qui respire derrière la liste + halos dorés
    [[0.15, 0.2, '#F59E0B'], [0.9, 0.7, '#F97316']].forEach(([x, y, col], k) => { const px = W * x + 100 * Math.sin(tr * 0.25 + k * 2), py = H * y + 80 * Math.cos(tr * 0.2 + k);
      ctx.fillStyle = rgrad(ctx, px, py, 650, [[0, RGBA(col, 0.16)], [1, RGBA(col, 0)]]); ctx.fillRect(0, 0, W, H); });
    ctx.save(); ctx.translate(W * 0.72, H * 0.52); ctx.rotate(-0.08 + 0.03 * Math.sin(tr * 0.3)); const k = 1 + 0.02 * Math.sin(tr * 0.8); ctx.scale(k, k);
    ctx.font = font(1250, 900, DISPLAY); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(250,204,21,0.10)'; ctx.strokeText(LTR, 0, 0);
    ctx.fillStyle = 'rgba(250,204,21,0.025)'; ctx.fillText(LTR, 0, 0); ctx.restore();
    bokeh(ctx, tr, 12, '255,220,140', 0.07); return;
  }
  if (DECOR === 'monde') { // globe qui tourne, en bas de l'écran
    const cx = W / 2, cy = H + 330, R = 900, tilt = 0.38, ct = Math.cos(tilt), st = Math.sin(tilt), rot = tr * 0.08;
    ctx.save(); ctx.fillStyle = rgrad(ctx, cx, cy, R * 1.12, [[0.80, 'rgba(45,212,191,0)'], [0.89, 'rgba(45,212,191,0.20)'], [0.9, 'rgba(56,189,248,0.10)'], [1, 'rgba(56,189,248,0)']]); ctx.fillRect(0, 0, W, H);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = rgrad(ctx, cx, cy - R, R * 1.4, [[0, 'rgba(14,90,110,0.55)'], [1, 'rgba(2,12,18,0.9)']]); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(45,212,191,0.6)'; ctx.stroke();
    const P = (la, lo) => { const x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo); return [cx + R * x, cy - R * (y * ct - z * st), y * st + z * ct]; };
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(94,234,212,0.16)';
    const seg = (f) => { ctx.beginPath(); let on = false; for (let k = 0; k <= 48; k++) { const [x, y, z] = f(k / 48); if (z > 0) { on ? ctx.lineTo(x, y) : ctx.moveTo(x, y); on = true; } else on = false; } ctx.stroke(); };
    for (let m = 0; m < 16; m++) { const lo = rot + m * TAU / 16; seg((u) => P(-PI / 2 + u * PI, lo)); }
    for (let p = -3; p <= 3; p++) { const la = p * PI / 8; seg((u) => P(la, u * TAU)); }
    ctx.restore();
  } else if (DECOR === 'intrus') { // aurores qui dérivent
    [[0.2, 0.25, '#7C3AED'], [0.85, 0.55, '#DB2777'], [0.4, 0.9, '#4F46E5']].forEach(([x, y, col], k) => {
      const px = W * x + 120 * Math.sin(tr * 0.25 + k * 2), py = H * y + 90 * Math.cos(tr * 0.2 + k);
      ctx.fillStyle = rgrad(ctx, px, py, 620, [[0, RGBA(col, 0.20)], [1, RGBA(col, 0)]]); ctx.fillRect(0, 0, W, H); });
  } else if (DECOR === 'france') { // reflet lent qui passe sur le fond
    const x = ((tr * 0.06) % 1.6 - 0.3) * W; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = lgrad(ctx, x - 300, 0, x + 300, H * 0.3, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.025)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, 0, W, H); ctx.restore();
  }
}
function floaters(ctx, tr) {
  decorAnim(ctx, tr);
  for (let i = 0; i < (DECOR === 'aucun' ? 22 : 12); i++) {
    const life = (tr * (0.012 + 0.012 * hash01(i, 3)) + hash01(i, 4)) % 1, x = 60 + 960 * hash01(i, 5) + 40 * Math.sin(tr * 0.3 + i), y = H + 100 - (H + 300) * life;
    const a = 0.09 * Math.sin(life * PI); ctx.save(); ctx.translate(x, y); ctx.rotate(0.3 * Math.sin(tr * 0.2 + i));
    TXT(ctx, SYMS[i % SYMS.length], 0, 0, 60 + 70 * hash01(i, 6), `rgba(${PAL.fl},${A(a)})`, 300); ctx.restore();
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
  glass(ctx, x, y, w, h, 28, reveal && ok ? `rgba(34,197,94,${A(0.75 * rk)})` : 'rgba(255,255,255,0.055)', reveal && ok ? 'rgba(180,255,200,0.9)' : null);
  // lettre
  ctx.beginPath(); ctx.roundRect(x + 26, y + 30, 80, 80, 20); ctx.fillStyle = reveal && ok ? 'rgba(255,255,255,0.95)' : RGBA(ACC, 0.14); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = reveal && ok ? '#FFFFFF' : RGBA(ACC, 0.6); ctx.stroke();
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
// ---------------------------------------------------------------- mode « LETTRE » : toutes les réponses commencent par la même lettre
const LROW = { x: 80, w: 840, y0: 352, h: 60, gap: 9 };
function lettreList(ctx, i, tr) {
  const pill = `TOUTES LES RÉPONSES COMMENCENT PAR ${LTR}`; ctx.font = font(27, 800, DISPLAY); ctx.letterSpacing = '2px'; const pw = ctx.measureText(pill).width; ctx.letterSpacing = '0px';
  ctx.beginPath(); ctx.roundRect(W / 2 - pw / 2 - 30, 238, pw + 60, 58, 29); ctx.fillStyle = RGBA(ACC, 0.13); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = ACC; ctx.stroke();
  SPACED(ctx, pill, W / 2, 268, 27, ACC, 2, 800);
  for (let d = 0; d < NQ; d++) {
    const s = QZ[d], y = LROW.y0 + d * (LROW.h + LROW.gap), cur = d === i && tr < s.end, done = tr > s.c1, rk = clamp(spring(tr - s.c1, SPRING.snappy));
    const ap = spring(tr - (0.1 + d * 0.06), SPRING.snappy); if (ap <= 0.01) continue;
    ctx.save(); ctx.globalAlpha *= clamp(ap * 1.3) * (done || cur ? 1 : 0.55); ctx.translate((1 - ap) * -60, 0);
    if (cur) { ctx.save(); ctx.shadowColor = RGBA(ACC, 0.7); ctx.shadowBlur = 30; ctx.beginPath(); ctx.roundRect(LROW.x, y, LROW.w, LROW.h, 18); ctx.fillStyle = RGBA(ACC, 0.10); ctx.fill(); ctx.restore(); }
    ctx.beginPath(); ctx.roundRect(LROW.x, y, LROW.w, LROW.h, 18);
    ctx.fillStyle = done ? `rgba(34,197,94,${A(0.10 + 0.12 * rk)})` : 'rgba(255,255,255,0.045)'; ctx.fill();
    ctx.lineWidth = cur ? 3 : 1.5; ctx.strokeStyle = cur ? ACC : done ? 'rgba(134,239,172,0.55)' : 'rgba(255,255,255,0.10)'; ctx.stroke();
    // numéro
    ctx.beginPath(); ctx.arc(LROW.x + 38, y + LROW.h / 2, 22, 0, TAU); ctx.fillStyle = done ? GOOD : cur ? ACC : 'rgba(255,255,255,0.12)'; ctx.fill();
    TXT(ctx, String(d + 1), LROW.x + 38, y + LROW.h / 2 + 1, 26, done || cur ? '#0B1020' : 'rgba(255,255,255,0.7)', 900);
    const ans = (QD.questions[d].answer || '').toUpperCase(), tx = LROW.x + 82, fs = 40;
    ctx.font = font(fs, 900, DISPLAY); ctx.letterSpacing = '2px';
    if (done) { // la réponse s'écrit lettre par lettre
      const n = Math.max(1, Math.ceil(ans.length * clamp((tr - s.c1) / 0.45))), shown = ans.slice(0, n);
      let f = fs; const mw = LROW.w - 110; if (ctx.measureText(ans).width > mw) { f = Math.floor(fs * mw / ctx.measureText(ans).width); ctx.font = font(f, 900, DISPLAY); }
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = ACC; ctx.fillText(shown[0], tx, y + LROW.h / 2 + 2);
      const lw = ctx.measureText(shown[0]).width; ctx.fillStyle = '#FFFFFF'; ctx.fillText(shown.slice(1), tx + lw, y + LROW.h / 2 + 2);
    } else {
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = ACC; ctx.fillText(LTR, tx, y + LROW.h / 2 + 2);
      if (cur && tr > s.c0 - 0.2) { // indice : une case par lettre
        const lw = ctx.measureText(LTR).width + 14, nl = ans.replace(/[^A-ZÀ-Ÿ]/g, '').length - 1, step = Math.min(30, (LROW.w - 140 - lw) / Math.max(1, nl));
        let k = 0; for (const ch of ans.slice(1)) { if (/[A-ZÀ-Ÿ]/.test(ch)) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(tx + lw + k * step, y + LROW.h / 2 + 14, step - 8, 4); } k++; }
      }
    }
    ctx.letterSpacing = '0px'; ctx.restore();
  }
}
function lettreCard(ctx, i, s, tr) {
  const q = QD.questions[i], k = spring(tr - (s.q0 - 0.35), SPRING.snappy), out = 1 - sm((tr - (s.end - 0.3)) / 0.3), y0 = 1080, h = 330;
  ctx.save(); ctx.globalAlpha = clamp(Math.min(k * 1.4, out * 1.5)); ctx.translate(0, (1 - k) * 100 + (1 - out) * 60);
  glass(ctx, ROW.x, y0, ROW.w, h, 34);
  const lc = s.level != null ? LVC[s.level] : ACC;
  TXT(ctx, `Q${String(i + 1).padStart(2, '0')}`, ROW.x + 44, y0 + 48, 32, ACC, 800, 'left');
  if (s.level != null) { ctx.font = font(26, 800, DISPLAY); ctx.letterSpacing = '3px'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = lc; ctx.fillText(LVNAME(s.level), ROW.x + ROW.w - 44, y0 + 48); ctx.letterSpacing = '0px'; }
  const qt = (q.qd || q.q).replace(/ ([?!:;])/g, ' $1'), size = qt.length > 44 ? 46 : 52, lines = wrapWords(ctx, qt, size, ROW.w - 90);
  lines.forEach((ln, li) => TXT(ctx, ln, ROW.x + 44, y0 + 150 + (li - (lines.length - 1) / 2) * (size * 1.22), size, '#FFFFFF', 800, 'left'));
  // minuteur puis réponse
  const WT = Math.round(WAITOF(s)), p = clamp((tr - s.c0) / WT), rk = clamp(spring(tr - s.c1, SPRING.snappy));
  if (tr > s.c0 - 0.2 && tr < s.c1 + 0.15) {
    const n = Math.max(1, WT - Math.floor(clamp(p, 0, 0.999) * WT)), last = p > 1 - 1 / WT, col = last ? BAD : ACC, bx = ROW.x + 44, bw = ROW.w - 190, by = y0 + h - 58;
    ctx.save(); ctx.globalAlpha *= clamp(spring(tr - s.c0 + 0.15, SPRING.snappy)) * (1 - sm((tr - s.c1) / 0.15));
    ctx.beginPath(); ctx.roundRect(bx, by - 7, bw, 14, 7); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
    ctx.shadowColor = col; ctx.shadowBlur = 18; ctx.beginPath(); ctx.roundRect(bx, by - 7, Math.max(14, bw * (1 - p)), 14, 7); ctx.fillStyle = lgrad(ctx, bx, 0, bx + bw, 0, [[0, last ? '#F87171' : ACC2], [1, col]]); ctx.fill(); ctx.shadowBlur = 0;
    const pop = 1 + 0.18 * Math.exp(-((p * WT) % 1) * 8); ctx.translate(ROW.x + ROW.w - 80, by); ctx.scale(pop, pop); TXT(ctx, `${n}s`, 0, 2, 48, col, 800); ctx.restore();
  }
  if (rk > 0.01) { const ans = (q.answer || '').toUpperCase(); ctx.save(); ctx.translate(W / 2, y0 + h - 60); ctx.scale(0.8 + 0.2 * rk, 0.8 + 0.2 * rk); ctx.globalAlpha *= clamp(rk * 1.3);
    let f = 54; ctx.font = font(f, 900, DISPLAY); const tw = ctx.measureText(ans).width; if (tw > ROW.w - 200) f = Math.floor(f * (ROW.w - 200) / tw);
    ctx.font = font(f, 900, DISPLAY); const bw = Math.min(ROW.w - 80, ctx.measureText(ans).width + 140);
    ctx.shadowColor = 'rgba(34,197,94,0.7)'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.roundRect(-bw / 2, -38, bw, 76, 38); ctx.fillStyle = GOOD; ctx.fill(); ctx.shadowBlur = 0;
    TXT(ctx, '✓ ' + ans, 0, 3, f, '#FFFFFF', 900); ctx.restore(); }
  ctx.restore();
}
function lettreQuestion(ctx, i, s, tr) { lettreList(ctx, i, tr); lettreCard(ctx, i, s, tr); }

function levelCard(ctx, tr) {
  for (const s of QZ) { if (!s.lv) continue; const [a, , k] = s.lv, p = spring(tr - (a - 0.25), SPRING.snappy), out = 1 - sm((tr - (s.q0 - 0.55)) / 0.3);
    if (tr < a - 0.3 || out <= 0.01 || p <= 0.01) continue;
    ctx.save(); ctx.globalAlpha = clamp(out) * clamp(p * 1.3); ctx.fillStyle = 'rgba(5,8,18,0.72)'; ctx.fillRect(0, -DY, W, H + DY);
    const c = LVC[k]; SPACED(ctx, `NIVEAU ${k + 1} / 4`, W / 2, 790, 36, 'rgba(255,255,255,0.65)', 10, 700);
    ctx.save(); ctx.translate(W / 2, 900); ctx.scale(0.85 + 0.15 * p, 0.85 + 0.15 * p); ctx.shadowColor = c; ctx.shadowBlur = 40; TXT(ctx, LVNAME(k), 0, 0, 130, c, 900); ctx.restore();
    const lw = 420 * clamp(p); ctx.fillStyle = c; ctx.fillRect(W / 2 - lw / 2, 1000, lw, 6);
    ctx.restore(); }
}

function banner(ctx, t, bf, bx, by, bw, tr) {
  const bh = 104, r = bh / 2; by -= 4;
  ctx.save(); ctx.shadowColor = DECOR === 'france' ? 'rgba(0,0,0,0.6)' : RGBA(ACC, 0.45); ctx.shadowBlur = 36; ctx.shadowOffsetY = 10;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, r);
  if (DECOR === 'france') { ctx.fillStyle = '#000'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.clip(); // trois bandes nettes, comme le drapeau
    ctx.fillStyle = '#0055A4'; ctx.fillRect(bx, by, bw / 3 + 1, bh); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(bx + bw / 3, by, bw / 3 + 1, bh); ctx.fillStyle = '#EF4135'; ctx.fillRect(bx + 2 * bw / 3, by, bw / 3, bh);
  } else { ctx.fillStyle = lgrad(ctx, bx, 0, bx + bw, 0, [[0, PAL.ban[0]], [0.25, PAL.ban[1]], [0.5, PAL.ban[2]], [0.75, PAL.ban[1]], [1, PAL.ban[0]]]); ctx.fill(); }
  ctx.restore();
  const ins = DECOR === 'france' ? 10 : 4;
  ctx.save(); ctx.beginPath(); ctx.roundRect(bx + ins, by + ins, bw - 2 * ins, bh - 2 * ins, r - ins); ctx.fillStyle = lgrad(ctx, 0, by, 0, by + bh, [[0, PAL.bg[1]], [1, PAL.bg[2]]]); ctx.fill(); ctx.clip();
  ctx.fillStyle = lgrad(ctx, 0, by, 0, by + bh, [[0, 'rgba(255,255,255,0.10)'], [0.5, 'rgba(255,255,255,0)']]); ctx.fillRect(bx, by, bw, bh);
  const sx = bx - 200 + ((tr % 5) / 5) * (bw + 600); // reflet qui traverse le bandeau toutes les 5 s
  ctx.fillStyle = lgrad(ctx, sx - 90, 0, sx + 90, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.13)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(bx, by, bw, bh);
  ctx.restore();
  const tx = W / 2 + (ICON ? 45 : 0);
  if (DECOR === 'musee') { ctx.save(); ctx.font = font(bf, 900, DISPLAY); ctx.letterSpacing = '4px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = lgrad(ctx, bx, 0, bx + bw, 0, [[0, '#C9A25A'], [0.5, '#FFF1C9'], [1, '#C9A25A']]); ctx.fillText(t, tx, by + bh / 2 + 2); ctx.restore(); }
  else SPACED(ctx, t, tx, by + bh / 2 + 2, bf, '#FFFFFF', 4, 900);
  if (ICON) { // pastille ronde + émoji qui respire doucement
    const ix = bx + 62, iy = by + bh / 2, ph = (tr % 4) / 4, k = 1 + 0.07 * Math.sin(tr * 2.4) + 0.12 * Math.exp(-ph * 12) * (tr > 0.5 ? 1 : 0);
    ctx.save(); ctx.translate(ix, iy);
    ctx.beginPath(); ctx.arc(0, 0, 38, 0, TAU); ctx.fillStyle = rgrad(ctx, 0, -10, 46, [[0, RGBA(PAL.acc, 0.38)], [1, RGBA(PAL.acc, 0.08)]]); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = RGBA(PAL.acc, 0.7); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 38 + 16 * ph, 0, TAU); ctx.strokeStyle = RGBA(PAL.acc, 0.5 * (1 - ph)); ctx.stroke(); // onde qui s'élargit
    ctx.scale(k, k); ctx.rotate(0.06 * Math.sin(tr * 1.7)); ctx.font = '46px "Noto Color Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10; ctx.fillText(ICON, 0, 3); ctx.restore(); }
}

// ---------------------------------------------------------------- image
function draw(ctx, u, tr) {
  const st = STAGE(tr);
  ctx.drawImage(BG.base, 0, 0); floaters(ctx, tr);
  ctx.save(); ctx.translate(0, DY);
  if (LETTRE && tr < QZ[0].q0) { // intro lettre : la liste vide + carte « Toutes les réponses commencent par … »
    lettreList(ctx, -1, tr);
    const k = spring(tr - 0.1, SPRING.snappy), out = 1 - sm((tr - (QZ[0].q0 - 0.6)) / 0.35), pk = spring(tr - 0.45, SPRING.bouncy);
    ctx.save(); ctx.globalAlpha = clamp(Math.min(k * 1.4, out)); ctx.translate(0, (1 - k) * 100);
    glass(ctx, ROW.x, 1080, ROW.w, 330, 34);
    SPACED(ctx, 'TOUTES LES RÉPONSES', W / 2, 1140, 36, 'rgba(255,255,255,0.85)', 5, 800);
    SPACED(ctx, 'COMMENCENT PAR', W / 2, 1190, 36, 'rgba(255,255,255,0.85)', 5, 800);
    ctx.save(); ctx.translate(W / 2, 1310); ctx.scale(pk, pk); ctx.shadowColor = RGBA(ACC, 0.8); ctx.shadowBlur = 50; ctx.font = font(170, 900, DISPLAY); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = lgrad(ctx, -80, 0, 80, 0, [[0, ACC], [1, ACC2]]); ctx.fillText(LTR, 0, 6); ctx.restore();
    ctx.restore();
  } else if (tr < QZ[0].q0) {
    const out = 1 - sm((tr - (QZ[0].lv ? QZ[0].lv[0] - 0.5 : QZ[0].q0 - 0.9)) / 0.4);
    if (out > 0.01) { ctx.save(); ctx.globalAlpha = out;
      const p0 = spring(tr - 0.15, SPRING.snappy), p1 = spring(tr - 0.35, SPRING.snappy), p2 = spring(tr - 0.8, SPRING.snappy);
      ctx.save(); ctx.globalAlpha = out * clamp(p0); SPACED(ctx, 'QUIZ', W / 2, 640 - (1 - p0) * 30, 64, 'rgba(255,255,255,0.8)', 26, 700); ctx.restore();
      ctx.save(); ctx.globalAlpha = out * clamp(p1); ctx.translate(W / 2, 800); ctx.scale(0.9 + 0.1 * p1, 0.9 + 0.1 * p1); ctx.shadowColor = RGBA(ACC, 0.6); ctx.shadowBlur = 50;
        ctx.font = font(200, 900, DISPLAY); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = lgrad(ctx, -380, 0, 380, 0, [[0, ACC], [1, ACC2]]); ctx.fillText(SUBJ, 0, 0); ctx.restore();
      const lw = 520 * clamp(p2); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(W / 2 - lw / 2, 930, lw, 3);
      ctx.save(); ctx.globalAlpha = out * clamp(p2); TXT(ctx, QD.tagline || `${NQ} questions · de facile à impossible`, W / 2, 1000, 44, 'rgba(255,255,255,0.85)', 600);
        TXT(ctx, QD.hook || 'Tu iras jusqu’au bout ?', W / 2, 1080, 52, '#FFFFFF', 800); ctx.restore();
      ctx.restore(); }
  }
  if (st.k === 'q' || (tr > QZ[0].q0 - 0.6 && tr < QZ[NQ - 1].end)) { const s2 = st.k === 'q' ? st : { i: 0, s: QZ[0] }; (LETTRE ? lettreQuestion : question)(ctx, s2.i, s2.s, tr); }
  else if (LETTRE && st.k === 'outro') { // récap de la liste complète + score et abonnement en dessous
    lettreList(ctx, NQ, tr); const t0 = QZ[NQ - 1].end, p = spring(tr - (t0 + 0.05), SPRING.snappy), p3 = spring(tr - (t0 + 0.7), SPRING.snappy);
    ctx.save(); ctx.globalAlpha = clamp(p * 1.3); ctx.translate(0, (1 - p) * 80); glass(ctx, ROW.x, 1080, ROW.w, 330, 34);
    SPACED(ctx, 'ALORS, TON SCORE ?', W / 2, 1130, 34, 'rgba(255,255,255,0.75)', 6, 700);
    ctx.save(); ctx.translate(W / 2, 1215); ctx.shadowColor = RGBA(ACC, 0.6); ctx.shadowBlur = 40; ctx.font = font(120, 900, DISPLAY); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = lgrad(ctx, -200, 0, 200, 0, [[0, ACC], [1, ACC2]]); ctx.fillText(`?/${NQ}`, 0, 0); ctx.restore();
    if (p3 > 0.01) { ctx.save(); ctx.globalAlpha *= clamp(p3 * 1.3); ctx.translate(W / 2, 1335); const pulse = 1 + 0.025 * Math.sin(tr * 6); ctx.scale(pulse, pulse);
      ctx.shadowColor = 'rgba(239,68,68,0.6)'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.roundRect(-230, -44, 460, 88, 44); ctx.fillStyle = lgrad(ctx, 0, -44, 0, 44, [[0, '#F43F5E'], [1, '#DC2626']]); ctx.fill(); ctx.shadowBlur = 0;
      TXT(ctx, "S'abonner", 0, 3, 44, '#FFFFFF', 800); ctx.restore(); }
    ctx.restore(); }
  if (st.k === 'outro' && !LETTRE) {
    const t0 = QZ[NQ - 1].end, p = spring(tr - (t0 + 0.05), SPRING.snappy), p2 = spring(tr - (t0 + 0.5), SPRING.snappy), p3 = spring(tr - (t0 + 1.0), SPRING.snappy);
    ctx.save(); ctx.globalAlpha = clamp(p); SPACED(ctx, 'ALORS, TON SCORE ?', W / 2, 640, 44, 'rgba(255,255,255,0.75)', 8, 700);
    ctx.translate(W / 2, 800); ctx.scale(0.9 + 0.1 * p, 0.9 + 0.1 * p); ctx.shadowColor = RGBA(ACC, 0.6); ctx.shadowBlur = 50;
    ctx.font = font(220, 900, DISPLAY); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = lgrad(ctx, -260, 0, 260, 0, [[0, ACC], [1, ACC2]]); ctx.fillText(`?/${NQ}`, 0, 0); ctx.restore();
    ctx.save(); ctx.globalAlpha = clamp(p2); TXT(ctx, 'Écris-le en commentaire', W / 2, 990, 50, '#FFFFFF', 700); ctx.restore();
    if (p3 > 0.01) { ctx.save(); ctx.globalAlpha = clamp(p3 * 1.3); ctx.translate(W / 2, 1130); const pulse = 1 + 0.025 * Math.sin(tr * 6); ctx.scale(pulse * (0.9 + 0.1 * p3), pulse * (0.9 + 0.1 * p3));
      ctx.save(); ctx.shadowColor = 'rgba(239,68,68,0.6)'; ctx.shadowBlur = 40; ctx.beginPath(); ctx.roundRect(-270, -56, 540, 112, 56); ctx.fillStyle = lgrad(ctx, 0, -56, 0, 56, [[0, '#F43F5E'], [1, '#DC2626']]); ctx.fill(); ctx.restore();
      TXT(ctx, "S'abonner", 0, 3, 52, '#FFFFFF', 800); ctx.restore(); }
  }
  levelCard(ctx, tr);
  if (QD.banner) { // titre fixe, visible toute la vidéo
    ctx.save(); const t = QD.banner.toUpperCase(); let bf = 50; ctx.font = font(bf, 900, DISPLAY); ctx.letterSpacing = '4px'; let tw = ctx.measureText(t).width; const MW = W - 260 - (ICON ? 90 : 0); if (tw > MW) { bf = Math.floor(bf * MW / tw); ctx.font = font(bf, 900, DISPLAY); tw = ctx.measureText(t).width; } ctx.letterSpacing = '0px';
    const bw = tw + 120 + (ICON ? 90 : 0), bx = W / 2 - bw / 2, by = 92;
    if (DECOR === 'aucun') {
    ctx.shadowColor = RGBA(ACC, 0.45); ctx.shadowBlur = 30; ctx.beginPath(); ctx.roundRect(bx, by, bw, 96, 48); ctx.fillStyle = lgrad(ctx, bx, 0, bx + bw, 0, [[0, PAL.ban[0]], [0.5, PAL.ban[1]], [1, PAL.ban[2]]]); ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.roundRect(bx + 4, by + 4, bw - 8, 88, 44); ctx.fillStyle = PAL.card.replace(/[\d.]+\)$/, '0.9)'); ctx.fill();
    SPACED(ctx, t, W / 2, by + 50, bf, '#FFFFFF', 4, 900); } else banner(ctx, t, bf, bx, by, bw, tr);
    ctx.restore(); }
  ctx.restore();
}

M.film({ fonts: [font(60, 800, DISPLAY)], hits: HITS, samples: 1, init() { buildBG(); }, draw });
