// Le hérisson et l'oisillon (TikTok 9:16, 10 s). Pure function of time: window.seek(t) paints frame t.
// Painted 2D: pre-rendered depth layers (blurred = depth of field), parallax camera, gradient-shaded
// characters with overlapping action (scarf, spines, leaf), rain with splashes, a light change, lip-sync.
import * as M from './lib/motion.js';
import { TL } from './timeline.js';

const { W, H, E, TAU, clamp, lerp, prog, bump, spring, SPRING, kf, wobble, mulberry32, hash01, noise1, mix, font } = M;
const PI = Math.PI;
const sm = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
const DISPLAY = 'Display';
const A = (v) => clamp(v).toFixed(3);   // alpha for colour strings: never negative, never exponent notation

// ---------------------------------------------------------------- the clock of the story (seconds)
// OLD(t) : le temps du jeu d'acteur (écrit pour 10 s) en fonction du temps réel du film de 15 s
const OLD = (t) => kf(t, [[0, 0], [5.0, 2.45], [7.6, 4.15], [10.3, 5.5], [10.66, 5.86], [13.0, 7.0], [20, 9.2], [30, 10]], E.linear);
const RAIN = () => 0;
const SUN = (t) => sm((t - 6.9) / 1.7);                     // (temps du jeu) les lucioles s'allument
const WALK0 = 2.45, WALK1 = 4.15, X0 = -210, X1 = 372, X2 = 418, STRIDE = 34;
const HOP0 = 5.5, HOP1 = 5.86, COVER = 5.95;
const HS = 1.2, BS = 1.25, BX = 772, LOGY = 1128, GY0 = 1240;
const gy = (x) => GY0 + 8 * Math.sin(x / 210);

// Every visual accent: [beat, label, sfx, opts] (grid = 120 bpm, so beat = 2 * seconds).
const HITS = [
  [2 * 10.3, 'hop', 'boing', { gain: 0.16, pitch: 240, to: 520, len: 0.3 }],
  [2 * 10.66, 'landing', 'thud', { gain: 0.3 }],
  [2 * 10.95, 'bird fluffs up', 'pop', { pitch: 'A5', gain: 0.22 }],
  [2 * 13.2, 'heart', 'bell', { pitch: 'E6', gain: 0.16 }],
  [2 * 14.0, 'fireflies light up', 'swell', { gain: 0.1 }],
  [2 * 27.2, 'Fin', 'bell', { pitch: 'A5', gain: 0.12 }],
];

// ---------------------------------------------------------------- drawing kit
function ell(ctx, x, y, rx, ry, col, rot = 0) { if (rx <= 0 || ry <= 0) return; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fillStyle = col; ctx.fill(); }
function rgrad(ctx, x, y, r, stops, fx = x, fy = y) { const g = ctx.createRadialGradient(fx, fy, 0, x, y, r); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function lgrad(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
// A shaded ball: light from the upper left, a darker underside.
function ball(ctx, x, y, rx, ry, hi, mid, lo, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, ry / rx);
  ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU);
  ctx.fillStyle = rgrad(ctx, 0, 0, rx * 1.25, [[0, hi], [0.55, mid], [1, lo]], -rx * 0.38, -rx * 0.45); ctx.fill(); ctx.restore();
}
function softShadow(ctx, x, y, rx, ry, a) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
  a = clamp(a); ctx.fillStyle = rgrad(ctx, 0, 0, rx, [[0, `rgba(6,14,28,${a.toFixed(3)})`], [0.6, `rgba(6,14,28,${(a * 0.55).toFixed(3)})`], [1, 'rgba(6,14,28,0)']]);
  ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore();
}
function stroke(ctx, col, w) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
function leafShape(ctx, x, y, len, wid, rot, col, vein) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.quadraticCurveTo(0, -wid, len / 2, 0); ctx.quadraticCurveTo(0, wid, -len / 2, 0); ctx.fillStyle = col; ctx.fill();
  if (vein) { ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(len / 2, 0); stroke(ctx, vein, Math.max(1, len * 0.035)); }
  ctx.restore();
}
function heart(ctx, x, y, s, rot = 0) {
  if (s <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 0.9); ctx.bezierCurveTo(-1.5, -0.2, -0.9, -1.2, 0, -0.45); ctx.bezierCurveTo(0.9, -1.2, 1.5, -0.2, 0, 0.9);
  ctx.fillStyle = lgrad(ctx, 0, -1, 0, 1, [[0, '#FF8FA8'], [1, '#F0466B']]); ctx.fill();
  ell(ctx, -0.42, -0.45, 0.2, 0.13, 'rgba(255,255,255,0.75)', -0.6);
  ctx.restore();
}
// Blink: 1 = closed. A quick close, a slightly slower open.
function blinkAt(t, times) { let b = 0; for (const c of times) { const d = t - c; if (d > -0.05 && d < 0.13) b = Math.max(b, d < 0 ? 1 + d / 0.05 : 1 - d / 0.13); } return b; }
// A cartoon eye: sclera, pupil that travels with the gaze, two catchlights, a lid; or a happy arc.
function eye(ctx, x, y, rx, ry, o) {
  const { lx = 0, ly = 0, blink = 0, happy = 0, wide = 0, skin = '#000', sad = 0 } = o;
  const k = 1 + wide * 0.16;
  if (happy > 0.5) { ctx.beginPath(); ctx.arc(x, y + ry * 0.45, rx * 0.95, PI * 1.12, PI * 1.88); stroke(ctx, '#2A1C18', rx * 0.42); return; }
  ell(ctx, x, y, rx * k, ry * k, '#FFFFFF');
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx * k, ry * k, 0, 0, TAU); ctx.clip();
  const px = x + lx * rx * 0.3, py = y + ly * ry * 0.26;
  ell(ctx, px, py, rx * 0.76, ry * 0.8, '#2A1C18');
  ell(ctx, px, py + ry * 0.2, rx * 0.5, ry * 0.42, '#5A3A2A');
  ell(ctx, px - rx * 0.26, py - ry * 0.3, rx * 0.3, rx * 0.3, '#FFFFFF');
  ell(ctx, px + rx * 0.3, py + ry * 0.32, rx * 0.13, rx * 0.13, 'rgba(255,255,255,0.9)');
  const lid = Math.max(blink, sad * 0.28);
  if (lid > 0) { ctx.fillStyle = skin; ctx.fillRect(x - rx * k - 2, y - ry * k - 2, 2 * rx * k + 4, (2 * ry * k + 4) * lid); }
  ctx.restore();
  if (blink > 0.85) { ctx.beginPath(); ctx.moveTo(x - rx, y + ry * 0.6); ctx.quadraticCurveTo(x, y + ry * 0.95, x + rx, y + ry * 0.6); stroke(ctx, '#2A1C18', rx * 0.3); }
}

// ---------------------------------------------------------------- pre-rendered depth layers (built once, in init)
const L = {}; const LW = 1900, LH = 2400, OX = 410, OY = 240;   // world (0,0) sits at (OX, OY) in a layer
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function blurred(src, px) { const [c, x] = mk(src.width, src.height); x.filter = `blur(${px}px)`; x.drawImage(src, 0, 0); return c; }
function tree(c, x, base, top, w, colA, colB, lean, r) {
  c.beginPath(); c.moveTo(x - w * 0.62, base);
  c.bezierCurveTo(x - w * 0.4, lerp(base, top, 0.4), x - w * 0.3 + lean * 0.5, lerp(base, top, 0.7), x - w * 0.22 + lean, top);
  c.lineTo(x + w * 0.22 + lean, top);
  c.bezierCurveTo(x + w * 0.3 + lean * 0.5, lerp(base, top, 0.7), x + w * 0.42, lerp(base, top, 0.4), x + w * 0.7, base); c.closePath();
  c.fillStyle = lgrad(c, x - w, 0, x + w, 0, [[0, colB], [0.45, colA], [1, colB]]); c.fill();
  for (let i = 0; i < 3; i++) {       // a few branches
    const by = lerp(base, top, 0.35 + 0.18 * i + 0.08 * r()), sg = i % 2 ? 1 : -1, bl = w * (2 + 2.5 * r());
    c.beginPath(); c.moveTo(x + lean * 0.5, by); c.quadraticCurveTo(x + sg * bl * 0.5, by - bl * 0.2, x + sg * bl, by - bl * (0.5 + 0.4 * r())); stroke(c, colB, w * 0.2);
  }
}
function foliage(c, x, y, R, cols, n, r, alpha = 1) {
  c.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * R, rr = R * (0.28 + 0.3 * r()), fx = x + Math.cos(a) * d * 1.25, fy = y + Math.sin(a) * d * 0.75;
    const col = cols[Math.floor(r() * cols.length)];
    c.fillStyle = rgrad(c, fx, fy, rr, [[0, mix(col, '#FFE7B0', 0.22)], [0.7, col], [1, mix(col, '#1B2530', 0.3)]], fx - rr * 0.3, fy - rr * 0.4);
    c.beginPath(); c.arc(fx, fy, rr, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
}
function buildLayers() {
  // far forest: pale, blue, soft (aerial perspective)
  { const [cv, c] = mk(LW, LH); c.translate(OX, OY); const r = mulberry32(7);
    c.fillStyle = lgrad(c, 0, 1040, 0, 1400, [[0, '#6E9198'], [1, '#496B73']]);
    c.beginPath(); c.moveTo(-OX, 1500); for (let x = -OX; x <= LW; x += 40) c.lineTo(x, 1110 + 36 * noise1(x / 260, 3) + 14 * noise1(x / 70, 4)); c.lineTo(LW, 1500); c.fill();
    for (let i = 0; i < 11; i++) { const x = -330 + i * 170 + 70 * (r() - 0.5), w = 26 + 26 * r(); tree(c, x, 1150 + 30 * r(), -260, w, mix('#7C9EA8', '#5E808C', r()), mix('#5E808C', '#4A6C78', r()), 30 * (r() - 0.5), r); }
    for (let i = 0; i < 16; i++) foliage(c, -350 + i * 115 + 60 * r(), 120 + 420 * r(), 120 + 70 * r(), ['#8FA39A', '#A99C7E', '#B98F6A', '#7E9AA0'], 9, r, 0.85);
    L.far = blurred(cv, 7); }
  // middle forest: darker trunks, the autumn colour
  { const [cv, c] = mk(LW, LH); c.translate(OX, OY); const r = mulberry32(19);
    [[-190, 104, 20], [118, 76, -16], [985, 92, 14], [1255, 110, -22]].forEach(([x, w, ln]) => tree(c, x, 1250, -260, w, '#4B4A44', '#2B3238', ln, r));
    tree(c, 560, 1200, -260, 34, '#566068', '#3A4650', 10, r);
    const reds = ['#C5622E', '#E08A2E', '#A8432A', '#D9A441', '#B5532C', '#E7B04A'];
    foliage(c, -150, 330, 300, reds, 34, r); foliage(c, 160, 110, 260, reds, 26, r); foliage(c, 1010, 250, 300, reds, 34, r); foliage(c, 1290, 520, 250, reds, 26, r);
    foliage(c, 560, -40, 330, reds, 30, r); foliage(c, 820, -90, 240, reds, 20, r);
    const bush = ['#3F6B4E', '#2F5844', '#4F7B4A', '#5B6B3A'];
    foliage(c, -170, 1190, 170, bush, 16, r); foliage(c, 80, 1215, 110, bush, 10, r); foliage(c, 1060, 1200, 150, bush, 16, r); foliage(c, 1300, 1170, 170, bush, 14, r);
    L.mid = blurred(cv, 2.6); }
  // storm clouds
  { const [cv, c] = mk(2000, 900); const r = mulberry32(31);
    for (let i = 0; i < 46; i++) { const x = r() * 2000, y = 120 + r() * 420, rr = 110 + 160 * r(); c.fillStyle = rgrad(c, x, y, rr, [[0, mix('#3B4A63', '#22304A', r())], [1, 'rgba(34,48,74,0)']]); c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); }
    L.cloud = blurred(cv, 14); }
  // the mossy log (drawn around its own origin: left end at 0, top at 0)
  { const LEN = 372, RAD = 57; const [cv, c] = mk(LEN + 120, RAD * 2 + 110); c.translate(60, 60); const r = mulberry32(5);
    c.beginPath(); c.roundRect(0, 0, LEN, RAD * 2, RAD); c.fillStyle = lgrad(c, 0, 0, 0, RAD * 2, [[0, '#8A6A4A'], [0.35, '#6E4F36'], [1, '#3A2A22']]); c.fill();
    c.save(); c.beginPath(); c.roundRect(0, 0, LEN, RAD * 2, RAD); c.clip();
    for (let i = 0; i < 26; i++) { const y = 12 + r() * RAD * 1.8, x = 40 + r() * (LEN - 60), l = 30 + 70 * r(); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y + 5 * (r() - 0.5), x + l, y); stroke(c, 'rgba(40,26,20,0.32)', 3); }
    c.fillStyle = lgrad(c, 0, RAD, 0, RAD * 2, [[0, 'rgba(20,14,20,0)'], [1, 'rgba(20,14,20,0.45)']]); c.fillRect(0, 0, LEN, RAD * 2);
    c.restore();
    // moss on top
    for (let i = 0; i < 30; i++) { const x = 60 + r() * (LEN - 90), y = 3 + 9 * r(), rr = 16 + 20 * r(); c.fillStyle = rgrad(c, x, y, rr, [[0, mix('#9AC65A', '#6FA047', r())], [1, mix('#4E8A3E', '#3D7438', r())]], x - 4, y - 8); c.beginPath(); c.ellipse(x, y, rr, rr * 0.55, 0, 0, TAU); c.fill(); }
    // the cut end with its rings
    c.fillStyle = lgrad(c, 0, 0, 0, RAD * 2, [[0, '#F0D7A8'], [1, '#C79E6C']]); c.beginPath(); c.ellipse(26, RAD, 27, RAD - 3, 0, 0, TAU); c.fill();
    [0.72, 0.46, 0.2].forEach((k) => { c.beginPath(); c.ellipse(26, RAD, 27 * k, (RAD - 3) * k, 0, 0, TAU); stroke(c, 'rgba(140,96,58,0.6)', 3); });
    c.beginPath(); c.ellipse(26, RAD, 27, RAD - 3, 0, 0, TAU); stroke(c, '#5A3F2C', 5);
    L.log = cv; L.logLen = LEN; L.logRad = RAD; }
  // out-of-focus foreground: a leafy branch (top left) and ferns (bottom right)
  { const [cv, c] = mk(900, 900); const r = mulberry32(41);
    c.beginPath(); c.moveTo(0, 120); c.quadraticCurveTo(360, 150, 700, 420); stroke(c, '#1E2A2A', 26);
    for (let i = 0; i < 26; i++) { const p = r(), x = 700 * p, y = 120 + 300 * p * p + 60 * (r() - 0.3); leafShape(c, x + 30 * (r() - 0.5), y + 40 + 90 * r(), 150 + 80 * r(), 44 + 20 * r(), 0.6 + 1.6 * r(), ['#7A2E22', '#A8482A', '#C06A2A', '#5B2A24'][i % 4]); }
    L.fgBranch = blurred(cv, 11); }
  { const [cv, c] = mk(900, 800); const r = mulberry32(53);
    for (let i = 0; i < 9; i++) { const x0 = 520 + 50 * (r() - 0.5), a = -PI / 2 + (i - 4) * 0.24, len = 420 + 160 * r(); const x1 = x0 + Math.cos(a) * len, y1 = 800 + Math.sin(a) * len;
      c.beginPath(); c.moveTo(x0, 800); c.quadraticCurveTo(x0 + (x1 - x0) * 0.3, 800 + (y1 - 800) * 0.7, x1, y1); stroke(c, '#20402F', 14);
      for (let j = 2; j < 9; j++) { const q = j / 9, px = lerp(x0, x1, q), py = lerp(800, y1, q ** 0.8); leafShape(c, px, py, 110 * (1.1 - q), 20, a + PI / 2 + 0.5, '#2C5A3C'); leafShape(c, px, py, 110 * (1.1 - q), 20, a - PI / 2 - 0.5, '#24503A'); } }
    L.fgFern = blurred(cv, 9); }
  // film grain tile
  { const [cv, c] = mk(256, 256); const r = mulberry32(99), d = c.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i++) { const v = 128 + (r() - 0.5) * 150; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
    c.putImageData(d, 0, 0); L.grain = cv; }
}

// ---------------------------------------------------------------- camera: eased keys + a breathing handheld drift
function camAt(t) {
  const [x, y, z] = kf(t, [[0, [600, 1000, 1.02]], [2.35, [700, 1062, 1.5]], [4.3, [575, 1040, 1.3]], [6.0, [600, 1022, 1.4]], [7.2, [604, 1016, 1.43]], [10, [612, 925, 1.17]]], E.inOutCubic);
  return { x: x + 7 * noise1(t * 0.55, 11), y: y + 5 * noise1(t * 0.5, 12), z: z * (1 + 0.004 * Math.sin(t * 1.1)) };
}
function layer(ctx, c, f, fn) {
  const z = 1 + (c.z - 1) * f;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-(W / 2 + (c.x - W / 2) * f), -(H / 2 + (c.y - H / 2) * f)); fn(); ctx.restore();
}

// ---------------------------------------------------------------- weather
function rainLayer(ctx, t, n, speed, len, lw, alpha, seed, slant) {
  if (alpha <= 0.01) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const sp = speed * (0.8 + 0.4 * hash01(i, seed));
    const y = ((hash01(i, seed + 1) * (H + 400) + t * sp) % (H + 400)) - 200;
    const x = hash01(i, seed + 2) * (W + 700) - 100 - (y + 200) * slant;
    ctx.moveTo(x, y); ctx.lineTo(x - len * slant, y + len);
  }
  ctx.strokeStyle = '#DCEBFF'; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
}
// Rings and a tiny crown where drops land on the ground.
function splashes(ctx, t, rain) {
  for (let i = 0; i < 34; i++) {
    if (hash01(i, 71) > rain) continue;
    const per = 0.45 + 0.5 * hash01(i, 72), ph = (t / per + hash01(i, 73)) % 1, cyc = Math.floor(t / per + hash01(i, 73));
    const x = -260 + 1620 * hash01(i * 13 + cyc, 74), depth = hash01(i * 7 + cyc, 75), y = gy(x) + 12 + depth * 150, s = 0.7 + depth * 0.7;
    if (x > 600 && x < 980 && depth < 0.25) continue;    // not through the log
    const a = (1 - ph) ** 1.5;
    ctx.beginPath(); ctx.ellipse(x, y, 30 * s * E.outCubic(ph), 8 * s * E.outCubic(ph), 0, 0, TAU); stroke(ctx, `rgba(225,240,255,${A(0.55 * a)})`, 2.4 * s);
    if (ph < 0.4) { const q = ph / 0.4, hgt = Math.sin(q * PI) * 22 * s; [-1, 1].forEach((sg) => ell(ctx, x + sg * 14 * s * q, y - hgt, 2.6 * s, 3.4 * s, `rgba(235,245,255,${A(0.8 * (1 - q))})`)); }
  }
}
function fallingLeaves(ctx, t) {
  const cols = ['#E08A2E', '#C5522E', '#E7B04A', '#B5432C', '#D9742E'];
  for (let i = 0; i < 9; i++) {
    const per = 5.5 + 3 * hash01(i, 81), p = (t / per + hash01(i, 82)) % 1;
    const x = -100 + 1350 * hash01(i, 83) + 90 * Math.sin(p * TAU * 1.6 + i) - 200 * p, y = -80 + 1420 * p;
    leafShape(ctx, x, y, 44 + 20 * hash01(i, 84), 13 + 6 * hash01(i, 85), p * 9 + i + 0.8 * Math.sin(p * 22 + i), cols[i % 5], 'rgba(90,40,20,0.5)');
  }
}

// ---------------------------------------------------------------- the big leaf, used as an umbrella
// Local frame: origin = the hand that grips the stem. a leans the stem, b tilts the blade, dx slides it.
function bigLeaf(ctx, t, a, b, dx, rain, flick) {
  const SL = 205, tx = Math.sin(a) * SL, ty = -Math.cos(a) * SL, LH2 = 222;
  ctx.beginPath(); ctx.moveTo(-4, 26); ctx.quadraticCurveTo(tx * 0.3 - 10 * a, ty * 0.55, tx, ty + 8); stroke(ctx, '#3F7A34', 11);
  ctx.beginPath(); ctx.moveTo(-4, 26); ctx.quadraticCurveTo(tx * 0.3 - 10 * a, ty * 0.55, tx, ty + 8); stroke(ctx, '#6FAE4A', 4);
  ctx.save(); ctx.translate(tx, ty); ctx.rotate(b); ctx.translate(dx, 0);
  const top = (p) => { const u = 1 - p; return [u * u * u * -LH2 + 3 * u * u * p * (-LH2 * 0.56) + 3 * u * p * p * (LH2 * 0.46) + p * p * p * LH2, u * u * u * 14 + 3 * u * u * p * -104 + 3 * u * p * p * -110 + p * p * p * 6]; };
  const path = () => { ctx.beginPath(); ctx.moveTo(-LH2, 14); ctx.bezierCurveTo(-LH2 * 0.56, -104, LH2 * 0.46, -110, LH2, 6); ctx.bezierCurveTo(LH2 * 0.5, 30, -LH2 * 0.5, 40, -LH2, 14); ctx.closePath(); };
  ctx.save(); ctx.translate(6, 12); path(); ctx.fillStyle = 'rgba(10,30,20,0.25)'; ctx.fill(); ctx.restore();   // underside depth
  path(); ctx.fillStyle = lgrad(ctx, 0, -100, 0, 40, [[0, '#A6DC62'], [0.45, '#6DB84A'], [1, '#3C8A3C']]); ctx.fill();
  ctx.save(); path(); ctx.clip();
  ctx.fillStyle = lgrad(ctx, 0, 0, 0, 40, [[0, 'rgba(20,70,40,0)'], [1, 'rgba(20,70,40,0.55)']]); ctx.fillRect(-LH2, -10, LH2 * 2, 60);
  ctx.beginPath(); ctx.moveTo(-LH2, 14); ctx.bezierCurveTo(-LH2 * 0.5, -46, LH2 * 0.45, -52, LH2, 6); stroke(ctx, 'rgba(225,255,170,0.75)', 5);
  for (let i = 1; i < 8; i++) { const p = i / 8, [vx, vy] = top(p), mxp = lerp(-LH2, LH2, p), myp = -35 * Math.sin(p * PI) + 8;
    ctx.beginPath(); ctx.moveTo(mxp + 6, myp); ctx.quadraticCurveTo(lerp(mxp, vx, 0.5) + 12, lerp(myp, vy, 0.5) - 4, vx + 10, vy + 4); stroke(ctx, 'rgba(225,255,170,0.42)', 2.6);
    ctx.beginPath(); ctx.moveTo(mxp + 6, myp); ctx.quadraticCurveTo(mxp + 16, myp + 14, mxp + 22, 40); stroke(ctx, 'rgba(20,80,40,0.35)', 2.4); }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-LH2 * 0.9, 4); ctx.bezierCurveTo(-LH2 * 0.5, -92, LH2 * 0.4, -100, LH2 * 0.88, -6); stroke(ctx, 'rgba(240,255,200,0.5)', 4);   // wet sheen on the rim
  // rain bouncing off the top
  for (let i = 0; i < 16; i++) {
    if (hash01(i, 91) > rain) continue;
    const per = 0.32 + 0.3 * hash01(i, 92), ph = (t / per + hash01(i, 93)) % 1, cyc = Math.floor(t / per + hash01(i, 93));
    const [sx, sy] = top(0.06 + 0.88 * hash01(i * 5 + cyc, 94)), q = E.outCubic(ph);
    [-1, 1].forEach((sg) => ell(ctx, sx + sg * 20 * q, sy - Math.sin(ph * PI) * 26 - 2, 3.2, 4, `rgba(235,246,255,${A(0.85 * (1 - ph))})`));
    if (ph < 0.3) ell(ctx, sx, sy - 2, 14 * (ph / 0.3), 4 * (ph / 0.3), `rgba(255,255,255,${A(0.5 * (1 - ph / 0.3))})`);
  }
  // drops gathering and falling from both tips
  [[-LH2, 16, 0.9, 0.2], [LH2, 8, 0.7, 0.6]].forEach(([px, py, per, off]) => {
    const ph = ((t + flick) / per + off) % 1, g = clamp(rain * 1.4);
    if (ph < 0.35) ell(ctx, px, py + 6, 4.5 * (ph / 0.35) * g, 6.5 * (ph / 0.35) * g, 'rgba(215,236,255,0.95)');
    else { const q = (ph - 0.35) / 0.65; ell(ctx, px, py + 6 + 330 * q * q, 4 * g, 8 * g, `rgba(215,236,255,${A(0.95 * (1 - q * q))})`); }
  });
  ctx.restore();
}

// ---------------------------------------------------------------- la lanterne : un bocal où dorment trois lucioles
function lantern(ctx, t, a) {
  ctx.save(); ctx.rotate(a);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); stroke(ctx, '#5A4632', 5);
  ctx.beginPath(); ctx.arc(0, 44, 16, PI, 0); stroke(ctx, '#5A4632', 5);
  const pulse = 0.85 + 0.15 * Math.sin(t * 3.1);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgrad(ctx, 0, 84, 250, [[0, `rgba(255,226,140,${A(0.3 * pulse)})`], [0.35, `rgba(255,200,110,${A(0.2 * pulse)})`], [1, 'rgba(255,200,110,0)']]); ctx.beginPath(); ctx.arc(0, 84, 250, 0, TAU); ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.roundRect(-24, 40, 48, 12, 4); ctx.fillStyle = '#7A5A3A'; ctx.fill();
  ctx.beginPath(); ctx.roundRect(-30, 50, 60, 74, 20); ctx.fillStyle = rgrad(ctx, 0, 88, 46, [[0, '#FFF6C8'], [0.6, '#FFD970'], [1, '#E8A63C']]); ctx.fill(); stroke(ctx, 'rgba(255,255,255,0.55)', 3);
  for (let i = 0; i < 3; i++) { const fx = 15 * Math.sin(t * (1.3 + 0.4 * i) + i * 2), fy = 88 + 20 * Math.sin(t * (1.1 + 0.3 * i) + i); ell(ctx, fx, fy, 5.5, 5.5, '#FFFFFF'); ell(ctx, fx, fy, 9, 9, 'rgba(255,255,210,0.45)'); }
  ctx.beginPath(); ctx.moveTo(-20, 62); ctx.quadraticCurveTo(-24, 86, -18, 110); stroke(ctx, 'rgba(255,255,255,0.6)', 4);
  ctx.restore();
}

// ---------------------------------------------------------------- the hedgehog (side view, facing right; origin = ground under him)
const FUR = { cream: '#FCEBCF', creamD: '#E6C295', spineD: '#4A2F22', spineM: '#6E4A33', spineL: '#9A7352', tip: '#E9D2A8' };
function hedgehog(ctx, x, y, s, o) {
  const { ph = 0, wk = 0, sq = 0, lean = 0, lookX = 0, lookY = 0, blink = 0, wide = 0, happy = 0, talk = 0, brow = 0, mood = 0.5,
    leafA = 0, leafB = 0, leafDx = 0, beckon = 0, trail = 0, t = 0, rain = 1, jig = 0, air = 0 } = o;
  const bob = -Math.abs(Math.sin(ph)) * 9 * wk;
  const ak = clamp(air / 92);
  softShadow(ctx, x + 8 * s, y + 8 * s, 170 * s * (1 - ak * 0.3), 30 * s * (1 - ak * 0.3), 0.5 * (1 - ak * 0.4));
  ctx.save(); ctx.translate(x, y - air); ctx.scale(s * (1 + sq), s * (1 - sq)); ctx.rotate(lean);
  // feet: the lifted one travels forward
  const foot = (fx, lift, col) => { ball(ctx, fx, -9 - lift, 31, 15, '#F2CFA0', col, '#B98A5C', -0.12 * (lift > 2 ? 1 : 0)); };
  const lifts = [Math.max(0, Math.sin(ph)) * 22 * wk, Math.max(0, -Math.sin(ph)) * 22 * wk];
  foot(-58 + Math.cos(ph) * 16 * wk, lifts[0] + air * 0.06, '#C99C6C');
  ctx.translate(0, bob);
  // scarf tail: a chain that trails when he moves and hangs when he stops
  { let px = -34, py = -128; const base = lerp(1.95, 2.95, trail);
    ctx.beginPath(); ctx.moveTo(px, py);
    for (let k = 1; k <= 5; k++) { const a = base + 0.26 * Math.sin(t * 6.2 - k * 0.85) * (0.35 + 0.65 * trail + 0.4 * rain * 0.5) + jig * 0.5 * Math.sin(k * 1.3); px += Math.cos(a) * 25; py += Math.sin(a) * 25; ctx.lineTo(px, py); }
    stroke(ctx, '#B92B2B', 30); ctx.beginPath(); ctx.arc(px, py, 3, 0, TAU); stroke(ctx, '#F5D06A', 9); }
  // spines: an outer row first (the silhouette), the mass, then lighter rows on it; each quill sways a little late
  const CXs = -30, CYs = -142, RX = 142, RY = 128, A0 = -0.34 * PI, A1 = -1.2 * PI;
  const row = (R, n, len, col, colTip, off, wdt) => {
    for (let i = 0; i < n; i++) {
      const a = lerp(A0, A1, (i + off) / (n - 1 + off * 2)), sway = 0.07 * Math.sin(t * 3.3 + i * 0.9 + R * 4) * (0.5 + 0.5 * rain) + 0.1 * Math.sin(ph * 2 - i * 0.5) * wk + jig * Math.sin(i * 1.7 + R * 3) * 0.9 - trail * 0.12;
      const bx = CXs + RX * R * Math.cos(a), by = CYs + RY * R * Math.sin(a), d = a - 0.3 + sway;
      const nx = Math.cos(d), ny = Math.sin(d), tx = -ny, ty = nx;
      ctx.beginPath(); ctx.moveTo(bx + tx * wdt, by + ty * wdt); ctx.quadraticCurveTo(bx + nx * len * 0.5 + tx * wdt * 0.5, by + ny * len * 0.5 + ty * wdt * 0.5, bx + nx * len, by + ny * len); ctx.quadraticCurveTo(bx + nx * len * 0.5 - tx * wdt * 0.5, by + ny * len * 0.5 - ty * wdt * 0.5, bx - tx * wdt, by - ty * wdt); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      ell(ctx, bx + nx * len * 0.82, by + ny * len * 0.82, 4.2, 4.2, colTip);
    }
  };
  row(0.97, 16, 60, FUR.spineD, '#8A6A4C', 0, 19);
  ball(ctx, CXs, CYs, RX, RY, '#8A6244', '#65432F', '#3B251C');
  row(0.84, 13, 50, FUR.spineM, FUR.tip, 0.5, 17);
  row(0.62, 10, 46, FUR.spineL, FUR.tip, 0.2, 16);
  row(0.38, 6, 42, '#A98260', '#F3E2BE', 0.6, 15);
  const gx = 104, gy2 = -150;
  // far arm: it beckons while he speaks
  { const sx = 104, sy = -112, th = lerp(1.15, -0.55 + 0.42 * Math.sin(t * 13), beckon), hx = sx + Math.cos(th) * 54, hy = sy + Math.sin(th) * 54;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); stroke(ctx, '#D9B487', 25); ball(ctx, hx, hy, 15, 15, '#F6DDB6', '#E0BC8C', '#C09A6A'); }
  foot(50 - Math.cos(ph) * 16 * wk, lifts[1] + air * 0.06, '#DDB07E');
  // body and head: one creamy mass with a soft belly light
  const skin = (x0, y0) => lgrad(ctx, x0, -270, x0 + 60, y0, [[0, '#FFF3DC'], [0.55, FUR.cream], [1, FUR.creamD]]);
  ctx.fillStyle = skin(0, -10); ctx.beginPath(); ctx.ellipse(42, -100, 94, 98, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = rgrad(ctx, 60, -100, 80, [[0, 'rgba(255,250,236,0.9)'], [1, 'rgba(255,250,236,0)']]); ctx.beginPath(); ctx.ellipse(60, -96, 66, 72, 0, 0, TAU); ctx.fill();
  // head group (tilts with the gaze)
  ctx.save(); ctx.translate(70, -150); ctx.rotate(lookY * 0.1 - 0.04 * beckon + 0.03 * Math.sin(t * 13) * beckon); ctx.translate(-70, 150);
  ctx.fillStyle = skin(20, -110); ctx.beginPath(); ctx.ellipse(74, -190, 88, 78, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(108, -262); ctx.quadraticCurveTo(168, -238, 196, -184); ctx.quadraticCurveTo(176, -140, 104, -120); ctx.closePath(); ctx.fill();
  // ear
  ball(ctx, 34, -252, 24, 24, '#A98260', '#7A563C', '#56382A'); ell(ctx, 37, -250, 12, 13, '#F2A59A');
  // scarf band
  ctx.beginPath(); ctx.moveTo(-34, -132); ctx.quadraticCurveTo(50, -92, 132, -128); stroke(ctx, '#D93A3A', 34);
  ctx.beginPath(); ctx.moveTo(-30, -142); ctx.quadraticCurveTo(50, -104, 128, -138); stroke(ctx, 'rgba(255,150,130,0.55)', 6);
  [0.2, 0.5, 0.8].forEach((p) => { const u = 1 - p, qx = u * u * -34 + 2 * u * p * 50 + p * p * 132, qy = u * u * -132 + 2 * u * p * -92 + p * p * -128; ctx.beginPath(); ctx.moveTo(qx - 4, qy - 15); ctx.lineTo(qx + 4, qy + 15); stroke(ctx, '#F5D06A', 6); });
  // cheek, nose
  ctx.globalAlpha = 0.55; ell(ctx, 96, -160, 24, 15, '#F58C82'); ctx.globalAlpha = 1;
  ball(ctx, 194, -182, 16, 15, '#6A4A44', '#2B1D1A', '#140C0A'); ell(ctx, 189, -188, 5, 3.4, 'rgba(255,255,255,0.75)', -0.5);
  // mouth: opens with the voice, otherwise a smile that follows the mood
  if (talk > 0.08) { ctx.save(); ctx.translate(152, -142); ctx.rotate(-0.2); ell(ctx, 0, 4 * talk, 15 + 4 * talk, 5 + 15 * talk, '#7A2A28'); if (talk > 0.3) ell(ctx, 0, 4 + 12 * talk, 9, 6 * talk, '#F08A8A'); ctx.restore(); }
  else { ctx.beginPath(); ctx.moveTo(126, -146 - mood * 3); ctx.quadraticCurveTo(150, -140 + mood * 15, 172, -152 - mood * 2); stroke(ctx, '#5A2E28', 5); }
  // eye + brow
  eye(ctx, 116, -204, 17, 21, { lx: lookX, ly: lookY, blink, happy, wide, skin: FUR.cream });
  ctx.beginPath(); ctx.moveTo(97, -238 - brow * 9); ctx.quadraticCurveTo(116, -247 - brow * 13, 136, -236 - brow * 5); stroke(ctx, '#7A563C', 6);
  ctx.restore();
  // near arm + the leaf it holds
  ctx.beginPath(); ctx.moveTo(60, -112); ctx.quadraticCurveTo(70, -150, gx, gy2 + 4); stroke(ctx, '#EBCB9C', 27);
  ctx.save(); ctx.translate(gx + 6, gy2 + 4); lantern(ctx, t, -leafA * 0.8 + 0.06 * Math.sin(t * 2.1)); ctx.restore();
  ball(ctx, gx, gy2 + 2, 17, 17, '#FFF0D6', '#EDCB9C', '#C9A070');
  ctx.restore();
}

// ---------------------------------------------------------------- the baby bird (three-quarter, facing left; origin = its feet)
function bird(ctx, x, y, s, o) {
  const { cold = 0, lookX = 0, lookY = 0, blink = 0, happy = 0, wide = 0, talk = 0, fluff = 0, flap = 0, tilt = 0, t = 0, sad = 0, hopY = 0 } = o;
  const sh = cold * 3.4 * Math.sin(t * 44) * (0.55 + 0.45 * Math.sin(t * 5.3)), k = 1 + fluff;
  softShadow(ctx, x, y + 3, 78 * s, 14 * s, 0.4);
  ctx.save(); ctx.translate(x + sh, y - hopY); ctx.scale(s, s);
  // feet
  [-15, 15].forEach((fx) => { ctx.beginPath(); ctx.moveTo(fx, -12); ctx.lineTo(fx, -1); ctx.moveTo(fx - 10, 1); ctx.lineTo(fx, -2); ctx.lineTo(fx + 9, 1); ctx.moveTo(fx, -2); ctx.lineTo(fx - 2, 4); stroke(ctx, '#F0933A', 5.5); });
  ctx.translate(0, -4); ctx.rotate(tilt); ctx.scale(k * (1 + cold * 0.03), k * (1 - cold * 0.05));
  // tail
  ctx.save(); ctx.translate(46, -44); ctx.rotate(-0.25 + 0.5 * flap * Math.sin(t * 26) + cold * 0.25); ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(50, -24); ctx.lineTo(54, -4); ctx.lineTo(46, 12); ctx.lineTo(-6, 12); ctx.closePath(); ctx.fillStyle = lgrad(ctx, 0, 0, 54, 0, [[0, '#3F8FD2'], [1, '#2C6BAE']]); ctx.fill(); ctx.restore();
  // body
  ball(ctx, 0, -58, 60, 58, '#B6E6FF', '#5FB6EE', '#2F7CC2');
  ctx.fillStyle = rgrad(ctx, -14, -38, 44, [[0, 'rgba(245,252,255,0.98)'], [0.7, 'rgba(232,246,255,0.85)'], [1, 'rgba(232,246,255,0)']]); ctx.beginPath(); ctx.ellipse(-14, -38, 42, 38, 0, 0, TAU); ctx.fill();
  // wing
  ctx.save(); ctx.translate(30, -62); ctx.rotate(0.55 - flap * (0.9 + 0.5 * Math.sin(t * 30)) + cold * 0.12);
  ball(ctx, 6, 14, 22, 34, '#74C2F2', '#3D8FD2', '#2462A6'); ctx.beginPath(); ctx.moveTo(0, 24); ctx.quadraticCurveTo(8, 34, 14, 40); ctx.moveTo(-8, 16); ctx.quadraticCurveTo(-2, 30, 2, 42); stroke(ctx, 'rgba(22,70,130,0.5)', 3); ctx.restore();
  // head tuft: droops when wet, springs up when warm
  [-0.5, 0, 0.5].forEach((a, i) => { const dr = cold * (0.9 + 0.2 * i), ang = -PI / 2 + a * 0.8 + 0.45 + dr * 1.25 + 0.08 * Math.sin(t * 5 + i), l = 30 + (i === 1 ? 8 : 0);
    ctx.beginPath(); ctx.moveTo(2 + i * 3, -112); ctx.quadraticCurveTo(2 + Math.cos(ang - 0.4) * l * 0.6, -112 + Math.sin(ang - 0.4) * l * 0.6, 2 + Math.cos(ang) * l, -112 + Math.sin(ang) * l); stroke(ctx, i === 1 ? '#5FB6EE' : '#3D8FD2', 9); });
  // face
  ctx.globalAlpha = 0.6 * (1 - cold * 0.5); ell(ctx, -46, -54, 12, 8, '#FF9FA8'); ell(ctx, 22, -57, 13, 9, '#FF9FA8'); ctx.globalAlpha = 1;
  eye(ctx, -32, -76, 11, 14.5, { lx: lookX, ly: lookY, blink, happy, wide, skin: '#5FB6EE', sad });
  eye(ctx, 6, -78, 12.5, 16, { lx: lookX, ly: lookY, blink, happy, wide, skin: '#5FB6EE', sad });
  if (sad > 0.2) { [[-32, -1], [6, 1]].forEach(([ex, sg]) => { ctx.beginPath(); ctx.moveTo(ex - 11, -98 - sg * 4 * sad); ctx.lineTo(ex + 11, -98 + sg * 4 * sad); stroke(ctx, '#2F7CC2', 4.5); }); }
  // beak: the lower half drops with the voice
  const op = talk * 15 + cold * 2.5 * (0.5 + 0.5 * Math.sin(t * 44));
  ctx.beginPath(); ctx.moveTo(-28, -58); ctx.lineTo(-2, -58); ctx.lineTo(-17, -46 + op); ctx.closePath(); ctx.fillStyle = '#D9761F'; ctx.fill();
  if (op > 3) { ctx.beginPath(); ctx.moveTo(-25, -58); ctx.lineTo(-5, -58); ctx.lineTo(-16, -50 + op * 0.6); ctx.closePath(); ctx.fillStyle = '#8A2E2A'; ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(-31, -60); ctx.quadraticCurveTo(-15, -70, 1, -60); ctx.lineTo(-17, -50); ctx.closePath(); ctx.fillStyle = lgrad(ctx, 0, -68, 0, -50, [[0, '#FFC24D'], [1, '#F59A2E']]); ctx.fill();
  ctx.restore();
  // shiver marks and drips while it is cold
  if (cold > 0.05) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = cold * (0.45 + 0.4 * Math.sin(t * 22) ** 2);
    [[-82, -70, 1], [82, -74, -1], [-90, -36, 1], [88, -40, -1]].forEach(([mx, my, sg]) => { ctx.beginPath(); ctx.moveTo(mx, my - 12); ctx.quadraticCurveTo(mx - sg * 9, my, mx, my + 12); stroke(ctx, '#EAF4FF', 4); });
    ctx.restore();
  }
}

// ---------------------------------------------------------------- performances: what each one does at time t
function hedgeState(t, tr) {
  const p = prog(t, WALK0, WALK1), walkX = lerp(X0, X1, 1 - (1 - p) ** 1.7);
  const hp = prog(t, HOP0, HOP1), hopX = lerp(0, X2 - X1, sm(hp)), air = hp > 0 && hp < 1 ? Math.sin(hp * PI) * 92 : 0;
  const x = walkX + hopX, wk = p > 0 && p < 1 ? clamp((1 - p) * 9) : 0;
  const antic = bump(t, HOP0 - 0.09, 0.2) * 0.14, land = t > HOP1 ? 0.2 * wobble((t - HOP1) * 2, 2.1, 3.4) : 0, stop = t > WALK1 ? 0.07 * wobble((t - WALK1) * 2, 2, 4) : 0;
  const stretch = hp > 0 && hp < 1 ? -0.1 * Math.sin(hp * PI) : 0;
  const said = TL.phrases[1], talking = tr > said.t0 - 0.05 && tr < said.t1 + 0.1;
  const cover = spring(t - (HOP0 + 0.12), SPRING.wobbly), up = sm((t - 8.15) / 0.6);
  const vx = p > 0 && p < 1 ? 1 : hp > 0 && hp < 1 ? 0.8 : 0, trail = Math.max(vx * clamp((t - WALK0) * 6), 0.9 * Math.exp(-Math.max(0, t - WALK1) * 5) * (t > WALK1 && hp <= 0 ? 1 : 0), 0.7 * Math.exp(-Math.max(0, t - HOP1) * 5) * (t > HOP1 ? 1 : 0));
  const notice = sm((t - 3.55) / 0.3);
  return {
    x, y: gy(x), air, ph: walkX / STRIDE, wk, sq: antic + land + stop + stretch,
    lean: 0.05 * wk - 0.1 * antic / 0.14 * 0.5 + 0.06 * Math.sin(hp * PI) * (hp > 0 && hp < 1 ? 1 : 0) + 0.035 * cover * (1 - up * 0.5),
    lookX: lerp(lerp(0.35, 1, notice), 0.55, up), lookY: lerp(lerp(0.25, -0.15, notice), -1, up) - 0.2 * cover * (1 - up),
    wide: 0.9 * bump(t, 3.8, 0.5) + 0.3 * (talking ? 1 : 0), brow: 0.9 * notice * (1 - sm((t - 6.6) / 0.5)) + 0.6 * up,
    blink: blinkAt(t, [3.05, 5.36, 6.62, 8.05, 9.2]), happy: t > 7.25 && t < 8.0 ? 1 : 0, mood: lerp(0.25, 1, sm((t - 5.9) / 0.5)),
    talk: talking ? mouth(tr) : 0, beckon: sm((tr - (said.t0 - 0.12)) / 0.18) * (1 - sm((tr - said.t1) / 0.22)),
    leafA: 0.05 * Math.sin(walkX / STRIDE * 2) * wk - 0.1 * trail + 0.4 * cover + 0.012 * Math.sin(t * 2.3) - land * 0.5,
    leafB: -0.16 + 0.07 * Math.sin(walkX / STRIDE * 2 + 1) * wk + 0.2 * cover + 0.02 * Math.sin(t * 1.9 + 1) + land * 0.7 + 0.06 * trail,
    leafDx: 0, trail, jig: (land + stop) * 0.9, t: tr, rain: 0.3,
  };
}
function birdState(t, tr) {
  const warm = spring(t - COVER, SPRING.gentle), cold = clamp(1 - warm), hears = sm((t - 3.3) / 0.25), up = sm((t - 8.3) / 0.6);
  const said = TL.phrases[2], talking = tr > said.t0 - 0.05 && tr < said.t1 + 0.1, peek = bump(t, COVER + 0.12, 0.3);
  const fluff = t > 6.0 ? 0.13 * wobble((t - 6.0) * 2, 1.9, 2.6) + 0.05 * warm : 0;
  return {
    cold, t: tr, sad: 1 - sm((t - 5.7) / 0.4),
    lookX: lerp(lerp(-0.1, -1, hears), 0.9, up) + 0.5 * peek, lookY: lerp(lerp(0.75, 0.05, hears), -1, up) - 0.9 * peek,
    wide: 0.8 * bump(t, 3.5, 0.45) + 0.7 * bump(t, COVER + 0.15, 0.35) + (talking ? 0.25 : 0),
    blink: Math.max(blinkAt(t, [1.2, 3.38, 5.2, 7.02, 8.6, 9.5]), cold * bump(t, 2.15, 0.22)),
    happy: t > 7.02 && t < 7.85 ? 1 : 0, talk: talking ? mouth(tr) : 0, fluff,
    flap: 0.55 * bump(t, 6.5, 0.45) + 0.25 * bump(t, 7.3, 0.3), tilt: -0.1 * hears * (1 - warm) + 0.07 * Math.sin(t * 2) * warm - 0.14 * peek,
    hopY: 16 * Math.abs(Math.sin((t - 6.25) * PI / 0.28)) * (t > 6.25 && t < 6.81 ? 1 : 0),
  };
}
function mouth(t) { const i = Math.round(t * 60), e = (TL.env[i - 1] || 0) * 0.25 + (TL.env[i] || 0) * 0.5 + (TL.env[i + 1] || 0) * 0.25; return clamp(e * 1.6); }

// ---------------------------------------------------------------- read-along subtitles: each word pops as it is spoken
const SUBS = 66; const wrapCache = new Map();
function wrap(ctx, str, maxW) {
  if (wrapCache.has(str)) return wrapCache.get(str);
  ctx.font = font(SUBS, 600, DISPLAY); ctx.letterSpacing = '0px';
  const spw = ctx.measureText(' ').width, lines = [[]]; let w = 0, i = 0, chars = 0;
  for (const word of str.split(' ')) {
    const ww = ctx.measureText(word).width;
    if (w + ww > maxW && lines[lines.length - 1].length) { lines.push([]); w = 0; }
    lines[lines.length - 1].push({ word, x: w, w: ww, i: i++, c0: chars }); w += ww + spw + 8; chars += word.length + 1;
  }
  const out = { lines: lines.map((l) => ({ words: l, width: l[l.length - 1].x + l[l.length - 1].w })), chars };
  wrapCache.set(str, out); return out;
}
function subs(ctx, t) {
  let cur = null; for (const p of TL.phrases) if (t >= p.t0 - 0.2 && t <= p.t1 + 0.55) cur = p;
  if (!cur) return;
  const out = 1 - E.inCubic(prog(t, cur.t1 + 0.4, cur.t1 + 0.55)), wr = wrap(ctx, cur.text, 820), lh = 84, dur = (cur.t1 - cur.t0) * 0.94;
  const y0 = 1420 - (wr.lines.length - 1) * lh / 2, accent = cur.who === 'herisson' ? '#FFB38A' : cur.who === 'oisillon' ? '#9BDCFF' : '#FFE27A';
  ctx.save(); ctx.font = font(SUBS, 600, DISPLAY); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  wr.lines.forEach((ln, li) => ln.words.forEach((wd) => {
    const tw = cur.t0 + (wd.c0 / wr.chars) * dur, k = spring(t - (cur.t0 - 0.2 + wd.i * 0.035), SPRING.snappy), lit = spring(t - tw, SPRING.bouncy), on = t >= tw;
    if (k <= 0.01) return;
    const cx = W / 2 - ln.width / 2 + wd.x + wd.w / 2, cy = y0 + li * lh + (1 - k) * 40, sc = (0.9 + 0.1 * k) * (1 + 0.045 * (on ? 1 : 0) * clamp(1.6 - (t - tw) * 2.2) * lit);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.globalAlpha = clamp(k * 1.3) * out;
    ctx.strokeStyle = 'rgba(10,20,40,0.92)'; ctx.lineWidth = 15; ctx.strokeText(wd.word, 0, 0);
    ctx.fillStyle = on ? (t - tw < 0.34 ? accent : '#FFFFFF') : 'rgba(255,255,255,0.5)'; ctx.fillText(wd.word, 0, 0);
    ctx.restore();
  }));
  ctx.restore();
}

// ---------------------------------------------------------------- the frame
function draw(ctx, u, tr) {
  const t = OLD(tr), c = camAt(t), fire = SUN(t), rain = 0.25;
  // ciel de nuit : bleu profond, une lune, des étoiles qui scintillent
  ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, [[0, '#0E1B3D'], [0.45, '#22417A'], [0.75, '#3D6A96'], [1, '#2C4E66']]); ctx.fillRect(0, 0, W, H);
  layer(ctx, c, 0.08, () => {
    for (let i = 0; i < 90; i++) { const x = -200 + 1500 * hash01(i, 201), y = -100 + 900 * hash01(i, 202), tw = 0.55 + 0.45 * Math.sin(tr * (1.2 + 2 * hash01(i, 203)) + i); ell(ctx, x, y, 2.4 + 2.6 * hash01(i, 204), 2.4 + 2.6 * hash01(i, 204), `rgba(235,242,255,${A(0.9 * tw)})`); }
    const mx = 760, my = 360; ctx.fillStyle = rgrad(ctx, mx, my, 520, [[0, 'rgba(210,228,255,0.55)'], [0.25, 'rgba(170,200,255,0.2)'], [1, 'rgba(170,200,255,0)']]); ctx.beginPath(); ctx.arc(mx, my, 520, 0, TAU); ctx.fill();
    ball(ctx, mx, my, 92, 92, '#FFFFFF', '#F2F4E8', '#C9D2E0'); ell(ctx, mx - 26, my - 16, 17, 14, 'rgba(180,190,210,0.5)'); ell(ctx, mx + 30, my + 26, 11, 9, 'rgba(180,190,210,0.5)'); ell(ctx, mx + 12, my - 40, 8, 7, 'rgba(180,190,210,0.4)');
  });
  layer(ctx, c, 0.26, () => ctx.drawImage(L.far, -OX, -OY));
  layer(ctx, c, 0.4, () => { for (let i = 0; i < 5; i++) { const mx = ((i * 520 + tr * (22 + 8 * i)) % 2400) - 600, my = 980 + 60 * hash01(i, 3) + 14 * Math.sin(tr * 0.6 + i); ctx.save(); ctx.translate(mx, my); ctx.scale(1, 0.22); ctx.fillStyle = rgrad(ctx, 0, 0, 520, [[0, 'rgba(200,220,255,0.26)'], [1, 'rgba(200,220,255,0)']]); ctx.beginPath(); ctx.arc(0, 0, 520, 0, TAU); ctx.fill(); ctx.restore(); } });
  layer(ctx, c, 0.52, () => ctx.drawImage(L.mid, -OX, -OY));

  const hs = hedgeState(t, tr), bs = birdState(t, tr);
  layer(ctx, c, 0.8, () => {
    ctx.beginPath(); ctx.moveTo(-700, 1700); for (let x = -700; x <= 1800; x += 50) ctx.lineTo(x, 1176 + 24 * noise1(x / 230, 8) + 8 * noise1(x / 60, 9)); ctx.lineTo(1800, 1700); ctx.closePath();
    ctx.fillStyle = lgrad(ctx, 0, 1150, 0, 1400, [[0, '#4E7A56'], [1, '#2C5140']]); ctx.fill();
  });
  layer(ctx, c, 1, () => {
    ctx.beginPath(); ctx.moveTo(-700, 2300); for (let x = -700; x <= 1800; x += 40) ctx.lineTo(x, gy(x)); ctx.lineTo(1800, 2300); ctx.closePath();
    ctx.fillStyle = lgrad(ctx, 0, GY0 - 10, 0, GY0 + 520, [[0, '#7FAE5A'], [0.12, '#5E9150'], [0.5, '#35603F'], [1, '#1E3C30']]); ctx.fill();
    for (let i = 0; i < 26; i++) { const x = -300 + 1700 * hash01(i, 31), d = hash01(i, 32), y = gy(x) + 26 + d * 230; ell(ctx, x, y, 60 + 60 * hash01(i, 33), 10 + 10 * d, `rgba(${i % 2 ? '150,196,96' : '30,70,50'},0.22)`); }
    for (let i = 0; i < 18; i++) { const x = -260 + 1620 * hash01(i, 35), d = hash01(i, 36), y = gy(x) + 30 + d * 250; leafShape(ctx, x, y, 34 + 26 * d, 9 + 6 * d, hash01(i, 37) * 3, ['#E08A2E', '#C5522E', '#E7B04A', '#B5432C'][i % 4], 'rgba(90,40,20,0.45)'); }
    // la mare où se reflète la lune
    { const px = 250, py = 1376; ctx.save(); ctx.beginPath(); ctx.ellipse(px, py, 190, 34, 0, 0, TAU); ctx.fillStyle = lgrad(ctx, 0, py - 34, 0, py + 34, [[0, '#5B7FB8'], [1, '#22345E']]); ctx.fill(); ctx.clip();
      ell(ctx, px + 50 + 4 * Math.sin(tr * 1.3), py - 4, 34, 9 + 1.5 * Math.sin(tr * 2.2), 'rgba(240,246,255,0.8)');
      for (let i = 0; i < 3; i++) { const ph = (tr / 2.2 + i * 0.33) % 1; ctx.beginPath(); ctx.ellipse(px + 50, py - 4, 40 + 120 * ph, 10 + 26 * ph, 0, 0, TAU); stroke(ctx, `rgba(240,248,255,${A(0.35 * (1 - ph))})`, 3); }
      ctx.restore(); ctx.beginPath(); ctx.ellipse(px, py, 190, 34, 0, 0, TAU); stroke(ctx, 'rgba(24,50,40,0.5)', 5); }
    const gust = 0.1 * noise1(tr * 0.9, 61);
    for (let i = 0; i < 150; i++) { const x = -330 + 11.6 * i + 8 * hash01(i, 51), h = 20 + 34 * hash01(i, 52), a = gust + 0.1 * Math.sin(tr * 2.2 + x * 0.02) + 0.3 * (hash01(i, 53) - 0.5), y = gy(x) + 4;
      ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.quadraticCurveTo(x + Math.sin(a) * h * 0.4, y - h * 0.6, x + Math.sin(a) * h, y - Math.cos(a) * h); ctx.quadraticCurveTo(x + Math.sin(a) * h * 0.5 + 4, y - h * 0.5, x + 5, y); ctx.fillStyle = i % 3 ? '#6FA352' : '#8FC264'; ctx.fill(); }
    [[1010, 1250, 1], [1062, 1262, 0.7]].forEach(([mx, my, ms]) => { softShadow(ctx, mx, my + 2, 44 * ms, 9 * ms, 0.35); ctx.fillStyle = lgrad(ctx, mx - 14 * ms, 0, mx + 14 * ms, 0, [[0, '#FFF6E2'], [1, '#D9C3A0']]); ctx.beginPath(); ctx.roundRect(mx - 12 * ms, my - 56 * ms, 24 * ms, 58 * ms, 10 * ms); ctx.fill();
      ctx.beginPath(); ctx.ellipse(mx, my - 54 * ms, 46 * ms, 34 * ms, 0, PI, TAU); ctx.closePath(); ctx.fillStyle = lgrad(ctx, 0, my - 90 * ms, 0, my - 54 * ms, [[0, '#F0584A'], [1, '#B8302C']]); ctx.fill();
      [[-22, -66, 7], [4, -78, 8], [24, -64, 6]].forEach(([dx, dy, r]) => ell(ctx, mx + dx * ms, my + dy * ms, r * ms, r * 0.8 * ms, '#FFF4E0')); });
    softShadow(ctx, 600 + L.logLen / 2, LOGY + L.logRad * 2 + 4, 230, 26, 0.5);
    ctx.drawImage(L.log, 600 - 60, LOGY - 60);
    bird(ctx, BX, LOGY + 7, BS, bs);
    hedgehog(ctx, hs.x, hs.y, HS, hs);
    { const life = tr - 13.2, k = spring(life, SPRING.bouncy); if (life > 0) { ctx.save(); ctx.globalAlpha = 1 - sm((life - 1.3) / 0.6); heart(ctx, 668 + 10 * Math.sin(life * 3), 968 - 80 * E.outCubic(clamp(life / 1.8)), 26 * k, 0.12 * Math.sin(life * 4)); ctx.restore(); } }
    fallingLeaves(ctx, tr * 0.7);
  });
  // la nuit : tout est bleui, sauf ce que la lanterne et les lucioles éclairent
  { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.78 - 0.16 * fire; ctx.fillStyle = '#5E76BE'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  layer(ctx, c, 1, () => {
    const lx = hs.x + 132, ly = hs.y - hs.air - 96, pulse = 0.9 + 0.1 * Math.sin(tr * 3.1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgrad(ctx, lx, ly, 620, [[0, `rgba(255,214,130,${A(0.34 * pulse)})`], [0.3, `rgba(255,190,100,${A(0.22 * pulse)})`], [1, 'rgba(255,190,100,0)']]); ctx.beginPath(); ctx.arc(lx, ly, 620, 0, TAU); ctx.fill();
    // les lucioles : quelques-unes au loin dès le début, puis toute la clairière s'allume
    for (let i = 0; i < 46; i++) { const on = i < 6 ? 0.5 : clamp((fire * 46 - (i - 6)) / 5); if (on <= 0) continue;
      const bx0 = -150 + 1400 * hash01(i, 211), by0 = 560 + 640 * hash01(i, 212), x = bx0 + 46 * Math.sin(tr * (0.5 + 0.5 * hash01(i, 213)) + i) + 20 * Math.sin(tr * 1.7 + i * 2), y = by0 + 34 * Math.sin(tr * (0.6 + 0.4 * hash01(i, 214)) + i * 1.3) - 40 * fire * hash01(i, 215);
      const bl = 0.55 + 0.45 * Math.sin(tr * (2 + 2 * hash01(i, 216)) + i * 3), r = 26 + 22 * hash01(i, 217);
      ctx.fillStyle = rgrad(ctx, x, y, r, [[0, `rgba(240,255,170,${A(0.95 * on * bl)})`], [0.25, `rgba(200,255,120,${A(0.5 * on * bl)})`], [1, 'rgba(200,255,120,0)']]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
    ctx.restore();
  });
  layer(ctx, c, 1.5, () => {
    ctx.save(); ctx.translate(-330, 170); ctx.rotate(0.03 * Math.sin(tr * 1.2)); ctx.drawImage(L.fgBranch, -60, -120, 1010, 1010); ctx.restore();
    ctx.save(); ctx.translate(1010, 1790); ctx.rotate(0.03 * Math.sin(tr * 1.4 + 1)); ctx.drawImage(L.fgFern, -520, -800, 1000, 890); ctx.restore();
  });
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.3 * fire; ctx.fillStyle = '#FFD27A'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = rgrad(ctx, W / 2, H * 0.52, H * 0.72, [[0, 'rgba(4,8,24,0)'], [0.6, 'rgba(4,8,24,0.08)'], [1, 'rgba(4,8,24,0.6)']]); ctx.fillRect(0, 0, W, H);
  ctx.restore();
  if (tr < 21.5) subs(ctx, tr);
  // la morale, en grand, puis « Fin »
  { const M0 = 22.2, lines = [['Un', 'ami,', "c'est", 'une'], ['lumière'], ['dans', 'la', 'nuit.']]; let wi = 0;
    ctx.save(); ctx.lineJoin = 'round';
    lines.forEach((ln, li) => { const size = li === 1 ? 150 : 92; ctx.font = font(size, 600, DISPLAY); ctx.textAlign = 'left'; const sp = ctx.measureText(' ').width, ws = ln.map((w) => ctx.measureText(w).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (ln.length - 1); let x = (W - tot) / 2; const y = [420, 570, 680][li];
      ln.forEach((w, k) => { const p = spring(tr - (M0 + wi * 0.27), SPRING.bouncy); wi++; if (p > 0.01) { ctx.save(); ctx.translate(x + ws[k] / 2, y + (1 - p) * 50); ctx.scale(0.85 + 0.15 * p, 0.85 + 0.15 * p); ctx.globalAlpha = clamp(p * 1.4); ctx.font = font(size, 600, DISPLAY); ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(8,16,40,0.9)'; ctx.lineWidth = size * 0.2; ctx.strokeText(w, 0, 0); ctx.fillStyle = li === 1 ? '#FFE27A' : '#FFFFFF'; ctx.fillText(w, 0, 0); ctx.restore(); } x += ws[k] + sp; }); });
    const f = spring(tr - 27.2, SPRING.gentle); if (f > 0.01) { ctx.globalAlpha = clamp(f); ctx.font = font(70, 600, DISPLAY); ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(8,16,40,0.9)'; ctx.lineWidth = 14; ctx.strokeText('Fin', W / 2, 800 + (1 - f) * 30); ctx.fillStyle = '#FFFFFF'; ctx.fillText('Fin', W / 2, 800 + (1 - f) * 30); }
    ctx.restore(); }
}

M.film({ fonts: [font(SUBS, 600, DISPLAY)], hits: HITS, samples: 5, init() { buildLayers(); }, draw });
