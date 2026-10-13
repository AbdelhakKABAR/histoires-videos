// Prune et Tilou : le linge s'envole (TikTok 9:16). Pure function of time: window.seek(t) paints frame t.
// Style « Pico et Plume » : calques flous pré-rendus, caméra qui respire, personnages peints en volume.
// Un seul lieu (la colline au fil à linge), trois lumières : vent gris (P1), soleil doré (P2), nuit bleue (P3).
import * as M from './lib/motion.js';
import { TL } from './timeline.js';
import { PART } from './part.js';

const { W, H, E, TAU, clamp, lerp, prog, bump, spring, SPRING, kf, wobble, mulberry32, hash01, noise1, mix, font } = M;
const PI = Math.PI;
const sm = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
const DISPLAY = 'Display';
const A = (v) => clamp(v).toFixed(3);
const GY0 = 1240, gy = (x) => GY0 + 7 * Math.sin(x / 230);
const RS = 1.08, KS = 1.05;                     // échelle kangourou, koala
const LX0 = 120, LX1 = 960, LY = 560;          // le fil à linge
const lineY = (x) => LY + 58 * Math.sin(PI * clamp((x - LX0) / (LX1 - LX0)));
const PX = 880, PY = 1352;                     // l'étang

// ---------------------------------------------------------------- kit
function ell(ctx, x, y, rx, ry, col, rot = 0) { if (rx <= 0 || ry <= 0) return; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fillStyle = col; ctx.fill(); }
function rgrad(ctx, x, y, r, stops, fx = x, fy = y) { const g = ctx.createRadialGradient(fx, fy, 0, x, y, r); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function lgrad(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function ball(ctx, x, y, rx, ry, hi, mid, lo, rot = 0) {
  if (rx <= 0 || ry <= 0) return;
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
function leafShape(ctx, x, y, len, wid, rot, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.quadraticCurveTo(0, -wid, len / 2, 0); ctx.quadraticCurveTo(0, wid, -len / 2, 0); ctx.fillStyle = col; ctx.fill(); ctx.restore();
}
function heart(ctx, x, y, s, rot = 0) {
  if (s <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 0.9); ctx.bezierCurveTo(-1.5, -0.2, -0.9, -1.2, 0, -0.45); ctx.bezierCurveTo(0.9, -1.2, 1.5, -0.2, 0, 0.9);
  ctx.fillStyle = lgrad(ctx, 0, -1, 0, 1, [[0, '#FF8FA8'], [1, '#F0466B']]); ctx.fill();
  ell(ctx, -0.42, -0.45, 0.2, 0.13, 'rgba(255,255,255,0.75)', -0.6); ctx.restore();
}
function sparkle(ctx, x, y, r, a) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y);
  ctx.fillStyle = rgrad(ctx, 0, 0, r * 2.2, [[0, `rgba(255,250,210,${A(0.8 * a)})`], [1, 'rgba(255,240,180,0)']]); ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -r * 2); ctx.quadraticCurveTo(0, 0, r * 2, 0); ctx.quadraticCurveTo(0, 0, 0, r * 2); ctx.quadraticCurveTo(0, 0, -r * 2, 0); ctx.quadraticCurveTo(0, 0, 0, -r * 2);
  ctx.fillStyle = `rgba(255,255,240,${A(a)})`; ctx.fill(); ctx.restore();
}
function blinkAt(t, times) { let b = 0; for (const c of times) { const d = t - c; if (d > -0.05 && d < 0.13) b = Math.max(b, d < 0 ? 1 + d / 0.05 : 1 - d / 0.13); } return b; }
function eye(ctx, x, y, rx, ry, o) {
  const { lx = 0, ly = 0, blink = 0, happy = 0, wide = 0, skin = '#000' } = o;
  const k = 1 + wide * 0.16;
  if (happy > 0.5) { ctx.beginPath(); ctx.arc(x, y + ry * 0.45, rx * 0.95, PI * 1.12, PI * 1.88); stroke(ctx, '#2A1C18', rx * 0.42); return; }
  ell(ctx, x, y, rx * k, ry * k, '#FFFFFF');
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx * k, ry * k, 0, 0, TAU); ctx.clip();
  const px = x + lx * rx * 0.3, py = y + ly * ry * 0.26;
  ell(ctx, px, py, rx * 0.76, ry * 0.8, '#2A1C18');
  ell(ctx, px, py + ry * 0.2, rx * 0.5, ry * 0.42, '#5A3A2A');
  ell(ctx, px - rx * 0.26, py - ry * 0.3, rx * 0.3, rx * 0.3, '#FFFFFF');
  ell(ctx, px + rx * 0.3, py + ry * 0.32, rx * 0.13, rx * 0.13, 'rgba(255,255,255,0.9)');
  if (blink > 0) { ctx.fillStyle = skin; ctx.fillRect(x - rx * k - 2, y - ry * k - 2, 2 * rx * k + 4, (2 * ry * k + 4) * blink); }
  ctx.restore();
  if (blink > 0.85) { ctx.beginPath(); ctx.moveTo(x - rx, y + ry * 0.6); ctx.quadraticCurveTo(x, y + ry * 0.95, x + rx, y + ry * 0.6); stroke(ctx, '#2A1C18', rx * 0.3); }
}
function mouth(t) { const i = Math.round(t * 60), e = (TL.env[i - 1] || 0) * 0.25 + (TL.env[i] || 0) * 0.5 + (TL.env[i + 1] || 0) * 0.25; return clamp(e * 1.6); }
const said = (who) => TL.phrases.filter((p) => p.who === who);
const talking = (who, tr) => said(who).some((p) => tr > p.t0 - 0.05 && tr < p.t1 + 0.1);
const ph = (i) => TL.phrases[Math.min(i, TL.phrases.length - 1)];
// a chain (ribbon, scarf tail) that hangs and trails with delay
function chain(ctx, x, y, base, n, seg, t, trail, w, col, ph0 = 0) {
  ctx.beginPath(); ctx.moveTo(x, y);
  for (let k = 1; k <= n; k++) { const a = base + 0.28 * Math.sin(t * 6 - k * 0.85 + ph0) * (0.3 + 0.7 * trail); x += Math.cos(a) * seg; y += Math.sin(a) * seg; ctx.lineTo(x, y); }
  stroke(ctx, col, w); return [x, y];
}

// ---------------------------------------------------------------- layers
const L = {}; const LW = 1900, LH = 2400, OX = 410, OY = 240;
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function blurred(src, px) { const [c, x] = mk(src.width, src.height); x.filter = `blur(${px}px)`; x.drawImage(src, 0, 0); return c; }
function blobTree(c, x, base, h, R, cols, r) {
  c.beginPath(); c.moveTo(x - R * 0.12, base); c.quadraticCurveTo(x - R * 0.06, base - h * 0.5, x - R * 0.05, base - h); c.lineTo(x + R * 0.05, base - h); c.quadraticCurveTo(x + R * 0.06, base - h * 0.5, x + R * 0.12, base); c.closePath();
  c.fillStyle = lgrad(c, x - R * 0.12, 0, x + R * 0.12, 0, [[0, '#6E4A33'], [1, '#3E2A20']]); c.fill();
  for (let i = 0; i < 16; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R * 0.8, rr = R * (0.32 + 0.25 * r()), fx = x + Math.cos(a) * d, fy = base - h - R * 0.2 + Math.sin(a) * d * 0.8; const col = cols[Math.floor(r() * cols.length)];
    c.fillStyle = rgrad(c, fx, fy, rr, [[0, mix(col, '#FFF2C0', 0.25)], [0.7, col], [1, mix(col, '#1B2530', 0.3)]], fx - rr * 0.3, fy - rr * 0.4); c.beginPath(); c.arc(fx, fy, rr, 0, TAU); c.fill(); }
}
function buildLayers() {
  // far hills
  { const [cv, c] = mk(LW, LH); c.translate(OX, OY); const r = mulberry32(7);
    c.fillStyle = lgrad(c, 0, 980, 0, 1300, [[0, '#9DB8B0'], [1, '#7A9E8E']]);
    c.beginPath(); c.moveTo(-OX, 1500); for (let x = -OX; x <= LW; x += 30) c.lineTo(x, 1030 - 90 * Math.sin((x + 300) / 420) + 20 * noise1(x / 90, 3)); c.lineTo(LW, 1500); c.fill();
    for (let i = 0; i < 22; i++) { const x = -350 + i * 90 + 40 * r(), yb = 1070 - 90 * Math.sin((x + 300) / 420); blobTree(c, x, yb + 20, 40 + 30 * r(), 34 + 20 * r(), ['#7FA492', '#8DAE96', '#6E9484'], r); }
    c.fillStyle = lgrad(c, 0, 1080, 0, 1400, [[0, '#89AE78'], [1, '#6A9460']]);
    c.beginPath(); c.moveTo(-OX, 1500); for (let x = -OX; x <= LW; x += 30) c.lineTo(x, 1120 + 50 * Math.sin((x - 200) / 330) + 10 * noise1(x / 70, 4)); c.lineTo(LW, 1500); c.fill();
    L.far = blurred(cv, 6); }
  // middle: the round cottage, a big tree, bushes
  { const [cv, c] = mk(LW, LH); c.translate(OX, OY); const r = mulberry32(19);
    blobTree(c, 1180, 1215, 330, 260, ['#5E9A4E', '#6FAE52', '#4E8A44', '#88BE5A'], r);
    blobTree(c, -250, 1215, 260, 200, ['#5E9A4E', '#6FAE52', '#4E8A44'], r);
    // cottage
    const hx = 20, hb = 1205;
    c.fillStyle = lgrad(c, hx - 150, 0, hx + 150, 0, [[0, '#F6E2C0'], [0.6, '#E8C99A'], [1, '#B8936A']]); c.beginPath(); c.roundRect(hx - 140, hb - 210, 280, 210, [60, 60, 6, 6]); c.fill();
    c.beginPath(); c.moveTo(hx - 190, hb - 170); c.quadraticCurveTo(hx, hb - 400, hx + 190, hb - 170); c.quadraticCurveTo(hx, hb - 230, hx - 190, hb - 170); c.fillStyle = lgrad(c, 0, hb - 380, 0, hb - 170, [[0, '#E0704A'], [1, '#A8402C']]); c.fill();
    c.beginPath(); c.roundRect(hx + 70, hb - 400, 40, 110, 8); c.fillStyle = '#8A5A44'; c.fill();
    c.beginPath(); c.roundRect(hx - 45, hb - 130, 90, 130, [45, 45, 0, 0]); c.fillStyle = lgrad(c, 0, hb - 130, 0, hb, [[0, '#4FA0C8'], [1, '#2E6E94']]); c.fill(); ell(c, hx + 25, hb - 60, 7, 7, '#F5D06A');
    ell(c, hx - 95, hb - 120, 26, 26, '#FFE9A8'); c.beginPath(); c.arc(hx - 95, hb - 120, 26, 0, TAU); stroke(c, '#8A5A44', 6);
    ell(c, hx + 100, hb - 120, 24, 24, '#FFE9A8'); c.beginPath(); c.arc(hx + 100, hb - 120, 24, 0, TAU); stroke(c, '#8A5A44', 6);
    const bush = ['#4F8A48', '#5E9A50', '#3F7A44'];
    [[-170, 1215, 70], [180, 1220, 60], [1020, 1225, 80], [1350, 1210, 90]].forEach(([x, y, R]) => { for (let i = 0; i < 9; i++) { const fx = x + (r() - 0.5) * R * 1.6, fy = y - r() * R * 0.6, rr = R * (0.35 + 0.3 * r()); c.fillStyle = rgrad(c, fx, fy, rr, [[0, '#9CCB6A'], [0.7, bush[i % 3]], [1, '#2C5A3A']], fx - rr * 0.3, fy - rr * 0.4); c.beginPath(); c.arc(fx, fy, rr, 0, TAU); c.fill(); } });
    L.mid = blurred(cv, 2.2); }
  // clouds
  { const [cv, c] = mk(2400, 800); const r = mulberry32(31);
    for (let k = 0; k < 7; k++) { const cx = 150 + k * 340 + 80 * r(), cy = 180 + 300 * r();
      for (let i = 0; i < 9; i++) { const x = cx + (r() - 0.5) * 300, y = cy + (r() - 0.5) * 70, rr = 60 + 70 * r(); c.fillStyle = rgrad(c, x, y, rr, [[0, 'rgba(255,255,255,0.95)'], [0.6, 'rgba(240,244,250,0.7)'], [1, 'rgba(230,236,246,0)']], x - rr * 0.3, y - rr * 0.5); c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); } }
    L.cloud = blurred(cv, 6); }
  // foreground: blurred tall grass and flowers
  { const [cv, c] = mk(900, 900); const r = mulberry32(41);
    for (let i = 0; i < 40; i++) { const x = 60 + 700 * r(), h = 300 + 400 * r(), lean = (r() - 0.5) * 200; c.beginPath(); c.moveTo(x - 10, 900); c.quadraticCurveTo(x + lean * 0.3, 900 - h * 0.6, x + lean, 900 - h); c.quadraticCurveTo(x + lean * 0.3 + 6, 900 - h * 0.5, x + 10, 900); c.fillStyle = ['#2E5A34', '#3E6E3A', '#24502E'][i % 3]; c.fill(); }
    for (let i = 0; i < 7; i++) { const x = 120 + 600 * r(), y = 380 + 300 * r(); for (let p = 0; p < 5; p++) leafShape(c, x + Math.cos(p * TAU / 5) * 22, y + Math.sin(p * TAU / 5) * 22, 44, 22, p * TAU / 5, i % 2 ? '#F7F3E8' : '#F2B8C6'); ell(c, x, y, 13, 13, '#F5C842'); }
    L.fg = blurred(cv, 10); }
  { const [cv, c] = mk(256, 256); const r = mulberry32(99), d = c.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i++) { const v = 128 + (r() - 0.5) * 150; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
    c.putImageData(d, 0, 0); L.grain = cv; }
}
function layer(ctx, c, f, fn) {
  const z = 1 + (c.z - 1) * f;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-(W / 2 + (c.x - W / 2) * f), -(H / 2 + (c.y - H / 2) * f)); fn(); ctx.restore();
}

// ---------------------------------------------------------------- the laundry: a white sheet with blue dots (the important object)
// origin = middle of its top edge. flow = how much the wind blows it sideways, wave = ripple of the hem.
function drap(ctx, x, y, w, h, t, o = {}) {
  const { flow = 0, wave = 0.3, rot = 0, pegs = 1, a = 1, sc = 1 } = o;
  if (sc <= 0.02 || a <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = a;
  const hw = w / 2, N = 12, bot = [], sideL = [], sideR = [];
  for (let i = 0; i <= N; i++) { const p = i / N, bx = lerp(-hw, hw, p) + flow * h * 0.55; bot.push([bx + 10 * wave * Math.sin(t * 7 + p * 6), h + h * 0.08 * wave * Math.sin(t * 8.3 + p * 9) - flow * 30 * p]); }
  for (let i = 0; i <= 6; i++) { const q = i / 6; sideL.push([-hw + flow * h * 0.55 * q * q + 8 * wave * Math.sin(t * 6 + q * 4), q * h]); sideR.push([hw + flow * h * 0.55 * q * q + 8 * wave * Math.sin(t * 6.5 + q * 4 + 1), q * h]); }
  const path = () => { ctx.beginPath(); ctx.moveTo(-hw, 0); ctx.lineTo(hw, 0); sideR.forEach(([px, py]) => ctx.lineTo(px, py)); for (let i = N; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); for (let i = 6; i >= 0; i--) ctx.lineTo(sideL[i][0], sideL[i][1]); ctx.closePath(); };
  ctx.save(); ctx.translate(8, 14); path(); ctx.fillStyle = 'rgba(20,30,50,0.18)'; ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = lgrad(ctx, 0, 0, 0, h, [[0, '#FFFFFF'], [0.6, '#F1F5FB'], [1, '#D6E0EE']]); ctx.fill();
  ctx.save(); path(); ctx.clip();
  // folds: soft vertical shading that moves with the wind
  for (let i = 0; i < 7; i++) { const fx = lerp(-hw, hw, (i + 0.5) / 7) + 14 * Math.sin(t * 3 + i) * wave + flow * h * 0.3;
    ctx.fillStyle = lgrad(ctx, fx - 26, 0, fx + 26, 0, [[0, 'rgba(120,140,180,0)'], [0.5, `rgba(120,140,180,${A(0.18 + 0.08 * Math.sin(t * 4 + i * 2))})`], [1, 'rgba(120,140,180,0)']]); ctx.fillRect(fx - 26, -10, 52, h * 1.3); }
  for (let i = 0; i < 26; i++) { const u = hash01(i, 301), v = hash01(i, 302), dx = lerp(-hw + 14, hw - 14, u) + flow * h * 0.55 * v * v, dy = 16 + v * (h - 30); ell(ctx, dx, dy, 9, 8, '#7FB2E8'); ell(ctx, dx - 2, dy - 2, 3.5, 3, 'rgba(255,255,255,0.6)'); }
  ctx.fillStyle = 'rgba(255,255,255,0.0)';
  ctx.beginPath(); ctx.moveTo(-hw, 8); ctx.lineTo(hw, 8); stroke(ctx, '#7FB2E8', 6);
  ctx.restore();
  if (pegs) [-hw + 22, hw - 22].forEach((px) => { ctx.beginPath(); ctx.roundRect(px - 7, -16, 14, 34, 4); ctx.fillStyle = lgrad(ctx, px - 7, 0, px + 7, 0, [[0, '#E9C08A'], [1, '#A87A4A']]); ctx.fill(); ell(ctx, px, -2, 3, 3, '#6E4A2E'); });
  ctx.restore();
}
function sock(ctx, x, y, s, rot, col = '#E8504A') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.lineTo(16, 70); ctx.quadraticCurveTo(18, 92, 44, 94); ctx.quadraticCurveTo(62, 98, 60, 112); ctx.quadraticCurveTo(56, 124, 30, 122); ctx.lineTo(0, 120); ctx.quadraticCurveTo(-18, 118, -16, 96); ctx.closePath();
  ctx.fillStyle = lgrad(ctx, -16, 0, 40, 0, [[0, mix(col, '#FFFFFF', 0.25)], [1, mix(col, '#401010', 0.25)]]); ctx.fill();
  ctx.save(); ctx.clip(); [14, 36, 58].forEach((sy) => { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(-20, sy, 40, 9); }); ctx.fillStyle = 'rgba(255,240,200,0.9)'; ctx.fillRect(-20, 0, 40, 8); ctx.restore();
  ctx.restore();
}
function dress(ctx, x, y, t, flow) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(0.05 * Math.sin(t * 5) + flow * 0.35);
  ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.lineTo(36, 40); ctx.quadraticCurveTo(70 + 10 * Math.sin(t * 7), 120, 64, 150); ctx.quadraticCurveTo(0, 162 + 6 * Math.sin(t * 6), -64, 150); ctx.quadraticCurveTo(-70, 120, -36, 40); ctx.closePath();
  ctx.fillStyle = lgrad(ctx, -60, 0, 60, 150, [[0, '#FFC8DA'], [1, '#E07FA2']]); ctx.fill();
  for (let i = 0; i < 6; i++) ell(ctx, -36 + 15 * i, 138 + 4 * Math.sin(i), 5, 5, 'rgba(255,255,255,0.8)');
  [-18, 18].forEach((px) => { ctx.beginPath(); ctx.roundRect(px - 6, -14, 12, 30, 4); ctx.fillStyle = '#C99A64'; ctx.fill(); });
  ctx.restore();
}
function paperLantern(ctx, x, y, t, a, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(0.06 * Math.sin(t * 1.8 + x));
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 16); stroke(ctx, '#3A2A20', 3);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgrad(ctx, 0, 46, 170, [[0, `rgba(255,200,120,${A(0.45 * a)})`], [1, 'rgba(255,180,100,0)']]); ctx.beginPath(); ctx.arc(0, 46, 170, 0, TAU); ctx.fill(); ctx.restore();
  ball(ctx, 0, 46, 30, 32, mix('#FFF4C8', col, 0.2), col, mix(col, '#802010', 0.4));
  ctx.globalAlpha = a; ell(ctx, 0, 46, 18, 22, 'rgba(255,250,200,0.75)'); ctx.globalAlpha = 1;
  [-1, 1].forEach((k) => { ctx.beginPath(); ctx.ellipse(0, 46, 16, 31, 0, k > 0 ? -PI / 2 : PI / 2, k > 0 ? PI / 2 : PI * 1.5); stroke(ctx, 'rgba(120,50,20,0.35)', 2); });
  ctx.beginPath(); ctx.roundRect(-12, 12, 24, 7, 2); ctx.fillStyle = '#5A3A24'; ctx.fill(); ctx.beginPath(); ctx.roundRect(-12, 74, 24, 7, 2); ctx.fill();
  ctx.restore();
}
function basket(ctx, x, y, fill) {
  softShadow(ctx, x, y + 4, 120, 18, 0.4);
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-100, -90); ctx.lineTo(100, -90); ctx.lineTo(80, 0); ctx.lineTo(-80, 0); ctx.closePath(); ctx.fillStyle = lgrad(ctx, -100, 0, 100, 0, [[0, '#D9A65E'], [0.5, '#C08A44'], [1, '#8A5E2C']]); ctx.fill();
  ctx.save(); ctx.clip(); for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-110, -80 + i * 16); ctx.lineTo(110, -80 + i * 16); stroke(ctx, 'rgba(90,56,24,0.45)', 3); } for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(-100 + i * 18, -90); ctx.lineTo(-84 + i * 15, 0); stroke(ctx, 'rgba(255,230,170,0.25)', 3); } ctx.restore();
  if (fill > 0) { ball(ctx, -30, -94, 60 * fill, 22 * fill, '#FFFFFF', '#EEF3FA', '#C8D4E6'); ball(ctx, 36, -98, 52 * fill, 24 * fill, '#FFE0EA', '#F2B8C9', '#C98A9E'); ball(ctx, 5, -112, 40 * fill, 18 * fill, '#FFFFFF', '#E8F0FA', '#BACBE0'); }
  ell(ctx, 0, -90, 100, 14, 'rgba(0,0,0,0)'); ctx.beginPath(); ctx.ellipse(0, -90, 100, 14, 0, 0, TAU); stroke(ctx, '#A87436', 10);
  ctx.restore();
}

// ---------------------------------------------------------------- Prune, the kangaroo girl (side/three-quarter, facing right; origin = ground under her)
const ROO = { hi: '#F6C48A', mid: '#DE9A5A', lo: '#A0602E', cream: '#FFF0D8', creamD: '#EFCFA4', pink: '#F59AB0' };
function roo(ctx, x, y, s, o) {
  const { dir = 1, air = 0, sq = 0, lean = 0, lookX = 0, lookY = 0, blink = 0, happy = 0, wide = 0, talk = 0, mood = 0.6, reach = 0, reach2 = 0, t = 0, trail = 0, jig = 0, pouch = 0, earLag = 0 } = o;
  const ak = clamp(air / 70);
  softShadow(ctx, x - 20 * s * dir, y + 6, 170 * s * (1 - clamp(air / 400) * 0.5), 26 * s, 0.45 * (1 - clamp(air / 500) * 0.6));
  ctx.save(); ctx.translate(x, y - air); ctx.scale(dir * s * (1 + sq), s * (1 - sq)); ctx.rotate(lean);
  // tail: a thick tapered tail made of shaded balls, lifts in the air
  for (let i = 14; i >= 0; i--) { const p = i / 14, sw = 0.12 * Math.sin(t * 2.4 - p * 2) + jig * 0.2 * Math.sin(p * 5);
    const px = lerp(-40, -215, p), py = lerp(-100, -14 - 80 * ak, p) - 30 * Math.sin(p * PI) * (1 - ak * 0.5) + sw * 60 * p, r = lerp(36, 11, p);
    ball(ctx, px, py, r, r, ROO.hi, ROO.mid, ROO.lo); }
  // far foot and far arm (darker)
  ball(ctx, 0 - ak * 40, -15 + ak * 6, 70, 16, '#D9A36A', '#B87A42', '#7E4A22', ak * 0.5);
  { const th = lerp(1.1, -1.2, reach2) + 0.1 * Math.sin(t * 3), sx = 40, sy = -250, hx = sx + Math.cos(th) * 66, hy = sy + Math.sin(th) * 66; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); stroke(ctx, '#B87A42', 20); ball(ctx, hx, hy, 12, 12, '#E2AC72', '#C08048', '#8A5428'); }
  // haunch
  ball(ctx, -20, -108, 84, 94, ROO.hi, ROO.mid, ROO.lo, -0.2);
  // near foot
  ball(ctx, 30 - ak * 46, -16 + ak * 4, 80, 19, '#FFD9A8', '#E2A466', '#A86A34', ak * 0.55);
  // body
  ball(ctx, 18, -212, 74, 112, ROO.hi, ROO.mid, ROO.lo, -0.14);
  ctx.fillStyle = lgrad(ctx, 0, -280, 40, -110, [[0, ROO.cream], [1, ROO.creamD]]); ctx.beginPath(); ctx.ellipse(46, -186, 44, 84, -0.12, 0, TAU); ctx.fill();
  // pouch: a curved seam; it bulges and glows when it holds something
  if (pouch > 0) { ctx.fillStyle = rgrad(ctx, 52, -150, 50, [[0, ROO.cream], [1, ROO.creamD]]); ctx.beginPath(); ctx.ellipse(52, -146, 46 + 8 * pouch, 32 + 8 * pouch, 0, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(14, -166); ctx.quadraticCurveTo(52, -140 + 12 * pouch, 90, -168); stroke(ctx, '#C08A5A', 5);
  // head
  ctx.save(); ctx.translate(48, -330); ctx.rotate(lookY * 0.12 + jig * 0.15 - 0.05 * talk);
  // ears (behind), with the bow
  const ear = (bx, by, ang, len) => { ctx.save(); ctx.translate(bx, by); ctx.rotate(ang); ball(ctx, 0, -len / 2, 22, len / 2, ROO.hi, ROO.mid, ROO.lo); ell(ctx, 3, -len / 2 + 4, 11, len / 2 - 14, ROO.pink); ctx.restore(); };
  const sway = 0.06 * Math.sin(t * 2.1) + earLag;
  ear(-30, -30, -0.55 + sway * 1.3, 120); ear(-6, -40, -0.2 + sway, 128);
  ball(ctx, 0, 0, 62, 56, ROO.hi, ROO.mid, ROO.lo);
  ball(ctx, 54, 16, 42, 29, '#FFF4E2', ROO.cream, ROO.creamD, 0.1);
  ball(ctx, 90, 6, 13, 10, '#6A4A44', '#2B1D1A', '#140C0A'); ell(ctx, 86, 2, 4, 3, 'rgba(255,255,255,0.75)');
  ctx.globalAlpha = 0.55; ell(ctx, 34, 22, 15, 10, '#F58CA0'); ctx.globalAlpha = 1;
  eye(ctx, 14, -12, 11, 15, { lx: lookX, ly: lookY, blink, happy, wide, skin: ROO.mid });
  eye(ctx, 44, -10, 13.5, 17.5, { lx: lookX, ly: lookY, blink, happy, wide, skin: ROO.mid });
  ctx.beginPath(); ctx.moveTo(32, -36 - wide * 6); ctx.quadraticCurveTo(46, -42 - wide * 8, 58, -34 - wide * 4); stroke(ctx, '#8A5428', 4);
  [[34, -30], [42, -32], [50, -30]].forEach(([lx, ly], i) => { ctx.beginPath(); ctx.moveTo(lx + 2, ly + 2); ctx.lineTo(lx + 4 + i * 2, ly - 4); stroke(ctx, '#2A1C18', 2.5); });
  if (talk > 0.08) { ctx.save(); ctx.translate(68, 34); ell(ctx, 0, 3 * talk, 11 + 3 * talk, 4 + 11 * talk, '#7A2A28'); if (talk > 0.3) ell(ctx, 0, 3 + 9 * talk, 7, 4 * talk, '#F08A8A'); ctx.restore(); }
  else { ctx.beginPath(); ctx.moveTo(56, 32 - mood * 2); ctx.quadraticCurveTo(68, 36 + mood * 10, 82, 30 - mood * 2); stroke(ctx, '#5A2E28', 4); }
  // the pink bow at the base of the ears; its ribbons trail late
  ctx.save(); ctx.translate(-22, -42);
  chain(ctx, -4, 6, 2.2 - 0.6 * trail, 4, 18, t, trail, 9, '#E0577E', 0); chain(ctx, 4, 6, 2.6 - 0.5 * trail, 4, 16, t, trail, 9, '#E86B90', 1.3);
  ball(ctx, -20, -2, 20, 13, '#FFB3C8', '#F07898', '#C24870', -0.5); ball(ctx, 20, -2, 20, 13, '#FFB3C8', '#F07898', '#C24870', 0.5); ball(ctx, 0, 0, 10, 10, '#FF9AB4', '#E05A80', '#B03A60');
  ctx.restore();
  ctx.restore();
  // near arm
  { const th = lerp(1.15, -1.25, reach) + 0.08 * Math.sin(t * 3 + 1), sx = 62, sy = -244, hx = sx + Math.cos(th) * 72, hy = sy + Math.sin(th) * 72; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + Math.cos(th) * 30 + 6, sy + Math.sin(th) * 40, hx, hy); stroke(ctx, '#E6AA6C', 22); ball(ctx, hx, hy, 13, 13, '#FFE0B8', '#EDB57C', '#B8804A'); }
  ctx.restore();
}
function rooHand(st, which = 0) {
  const th = lerp(1.15, -1.25, which ? st.reach2 || 0 : st.reach || 0), sx = which ? 40 : 62, sy = which ? -250 : -244, L2 = which ? 66 : 72;
  const lx = sx + Math.cos(th) * L2, ly = sy + Math.sin(th) * L2;
  return [st.x + (st.dir || 1) * RS * (1 + (st.sq || 0)) * lx, st.y - (st.air || 0) + RS * (1 - (st.sq || 0)) * ly];
}

// ---------------------------------------------------------------- Tilou, the koala boy (front three-quarter; origin = ground under him)
const KO = { hi: '#C9D2DE', mid: '#99A6B8', lo: '#5E6A80', belly: '#F4F2EE', bellyD: '#D8D4CC' };
function koala(ctx, x, y, s, o) {
  const { dir = -1, air = 0, sq = 0, lean = 0, lookX = 0, lookY = 0, blink = 0, happy = 0, wide = 0, talk = 0, mood = 0.6, point = 0, hold = 0, sock: sk = 0, t = 0, trail = 0, jig = 0 } = o;
  softShadow(ctx, x, y + 6, 120 * s * (1 - clamp(air / 300) * 0.4), 22 * s, 0.45 * (1 - clamp(air / 400) * 0.5));
  ctx.save(); ctx.translate(x, y - air); ctx.scale(dir * s * (1 + sq), s * (1 - sq)); ctx.rotate(lean);
  // scarf tail behind (trails away from where he looks)
  chain(ctx, -50, -176, 2.3 - 0.7 * trail, 5, 22, t, trail + 0.3, 24, '#3C9C8C', 0.5);
  // feet
  ball(ctx, -38, -16, 36, 18, KO.hi, KO.mid, KO.lo); ball(ctx, 40, -16, 36, 18, KO.hi, KO.mid, KO.lo);
  // body + belly
  ball(ctx, 0, -116, 84, 100, KO.hi, KO.mid, KO.lo);
  ctx.fillStyle = rgrad(ctx, 10, -100, 70, [[0, KO.belly], [1, KO.bellyD]], 0, -130); ctx.beginPath(); ctx.ellipse(10, -98, 52, 66, 0, 0, TAU); ctx.fill();
  // arms: the back arm points up while he warns, the front arm holds things
  { const th = lerp(2.2, -1.95, point) + 0.08 * Math.sin(t * 9) * point, sx = -62, sy = -160, hx = sx + Math.cos(th) * 74, hy = sy + Math.sin(th) * 74; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); stroke(ctx, KO.mid, 28); ball(ctx, hx, hy, 17, 17, KO.hi, KO.mid, KO.lo); }
  { const th = lerp(1.0, -0.15, hold) + 0.06 * Math.sin(t * 3), sx = 58, sy = -158, hx = sx + Math.cos(th) * 76, hy = sy + Math.sin(th) * 76; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); stroke(ctx, '#A8B4C4', 28); ball(ctx, hx, hy, 17, 17, '#D6DEE8', KO.hi, KO.mid); }
  // scarf band
  ctx.beginPath(); ctx.moveTo(-64, -180); ctx.quadraticCurveTo(0, -150, 64, -180); stroke(ctx, '#48B4A2', 28);
  ctx.beginPath(); ctx.moveTo(-60, -188); ctx.quadraticCurveTo(0, -160, 60, -188); stroke(ctx, 'rgba(200,255,240,0.5)', 5);
  [-0.6, 0, 0.6].forEach((p) => { const qx = p * 60, qy = -170 + 14 * (1 - p * p); ctx.beginPath(); ctx.moveTo(qx - 3, qy - 12); ctx.lineTo(qx + 3, qy + 12); stroke(ctx, '#F5D06A', 6); });
  // head
  ctx.save(); ctx.translate(0, -262); ctx.rotate(lookY * 0.08 + lean * 0.5 + jig * 0.12 + 0.04 * Math.sin(t * 1.7));
  [-1, 1].forEach((k) => { const ex = k * 88, ey = -44; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + k; ball(ctx, ex + Math.cos(a) * 42, ey + Math.sin(a) * 40, 14, 14, '#E6ECF2', '#B8C2D0', '#8894A6'); } ball(ctx, ex, ey, 46, 44, KO.hi, KO.mid, KO.lo); ball(ctx, ex + k * 4, ey + 4, 28, 26, '#FFFFFF', '#F2E8EE', '#D8C8D2'); });
  ball(ctx, 0, 0, 94, 82, KO.hi, KO.mid, KO.lo);
  ctx.fillStyle = rgrad(ctx, 0, 30, 60, [[0, 'rgba(240,244,248,0.9)'], [1, 'rgba(240,244,248,0)']]); ctx.beginPath(); ctx.ellipse(0, 30, 62, 44, 0, 0, TAU); ctx.fill();
  ctx.globalAlpha = 0.5; ell(ctx, -60, 24, 16, 11, '#F58CA0'); ell(ctx, 60, 24, 16, 11, '#F58CA0'); ctx.globalAlpha = 1;
  eye(ctx, -40, -16, 13, 16.5, { lx: lookX, ly: lookY, blink, happy, wide, skin: KO.mid });
  eye(ctx, 40, -16, 13, 16.5, { lx: lookX, ly: lookY, blink, happy, wide, skin: KO.mid });
  [-1, 1].forEach((k) => { ctx.beginPath(); ctx.moveTo(k * 26, -42 - wide * 6); ctx.quadraticCurveTo(k * 40, -50 - wide * 8, k * 54, -42 - wide * 4); stroke(ctx, '#5E6A80', 5); });
  ball(ctx, 0, 12, 23, 28, '#6A5E70', '#3A3242', '#1A161E'); ell(ctx, -7, 0, 6, 9, 'rgba(255,255,255,0.55)', -0.3);
  if (talk > 0.08) { ell(ctx, 0, 54 + 3 * talk, 12 + 3 * talk, 4 + 11 * talk, '#7A2A38'); if (talk > 0.3) ell(ctx, 0, 58 + 8 * talk, 7, 4 * talk, '#F08A9A'); }
  else { ctx.beginPath(); ctx.moveTo(-16, 50 - mood * 2); ctx.quadraticCurveTo(0, 54 + mood * 10, 16, 50 - mood * 2); stroke(ctx, '#3A3242', 4.5); }
  if (sk > 0.01) { ctx.save(); ctx.translate(-10, -74 - 40 * (1 - sk)); ctx.rotate(-1.35 + 0.18 * wobble(Math.max(0, t - o.sockT || 0) * 2, 2, 3)); sock(ctx, 0, 0, 1.15, 0); ctx.restore(); }
  ctx.restore();
  ctx.restore();
}
function koalaHand(st) {
  const th = lerp(1.0, -0.15, st.hold || 0), lx = 58 + Math.cos(th) * 76, ly = -158 + Math.sin(th) * 76;
  return [st.x + (st.dir || -1) * KS * (1 + (st.sq || 0)) * lx, st.y - (st.air || 0) + KS * (1 - (st.sq || 0)) * ly];
}

// ---------------------------------------------------------------- performances
const hopArc = (tr, t0, t1, h) => { const p = (tr - t0) / (t1 - t0); return p > 0 && p < 1 ? Math.sin(p * PI) * h : 0; };
const landSq = (tr, t1, k = 0.18) => (tr > t1 ? k * wobble((tr - t1) * 2, 2.1, 3.4) * (tr < t1 + 1.2 ? 1 : 0) : 0);
const antic = (tr, t0, k = 0.14) => bump(tr, t0 - 0.1, 0.22) * k;

function ACT1(tr) {
  // Prune bounds in from the left in three hops, notices the flying sheet, gets ready to leap.
  const hops = [[0.5, 1.25, -260, -20], [1.45, 2.2, -20, 200], [2.4, 3.15, 200, 380]];
  let x = -260, air = 0, sq = 0, trail = 0;
  for (const [a, b, x0, x1] of hops) { if (tr >= a && tr <= b) { const p = (tr - a) / (b - a); x = lerp(x0, x1, sm(p)); air = Math.sin(p * PI) * 170; sq = -0.1 * Math.sin(p * PI); trail = 1; } else if (tr > b) x = x1; sq += antic(tr, a) + landSq(tr, b, 0.17); }
  trail = Math.max(trail, Math.exp(-Math.max(0, tr - 3.15) * 3) * (tr > 3.15 ? 1 : 0));
  const sheetT = 9.0, see = sm((tr - (ph(1).t0 + 0.3)) / 0.4), follow = sm((tr - sheetT) / 1.0);
  const crouch = bump(tr, 16.9, 1.4) * 0.12;
  const pt = talking('Prune', tr), kt = talking('Tilou', tr);
  const rs = { x, y: gy(x), air, sq: sq + crouch, dir: 1, lean: 0.12 * (air > 0 ? 1 : 0) + 0.04 * Math.sin(tr * 1.3) * (tr > 3.4 ? 1 : 0) - crouch * 0.6,
    lookX: lerp(0.8, 0.9, see), lookY: lerp(0, -0.6, see) - 0.5 * follow, wide: 0.8 * bump(tr, sheetT + 0.4, 1.2) + (pt ? 0.3 : 0), blink: blinkAt(tr, [3.6, 6.0, 8.2, 12.4, 14.4, 16.9]),
    happy: tr < 3.4 && tr > 0.4 ? 1 : 0, mood: tr < 8.6 ? 0.9 : 0.1, talk: pt ? mouth(tr) : 0, reach: 0.35 * bump(tr, 3.3, 0.5) + (pt ? 0.75 : 0.15 * see), reach2: pt ? 0.5 : 0.1, t: tr, trail, jig: landSq(tr, 3.15) + landSq(tr, 2.2), earLag: -0.35 * clamp(air / 170) + 0.12 * Math.sin(tr * 3) * 0.5, pouch: 0 };
  const point = sm((tr - (ph(1).t0 - 0.3)) / 0.3) * (1 - sm((tr - (ph(1).t1 + 1.6)) / 0.4));
  const kx = 800, khop = hopArc(tr, ph(1).t0 - 0.35, ph(1).t0 + 0.05, 40);
  const ks = { x: kx, y: gy(kx), air: khop, sq: antic(tr, ph(1).t0 - 0.35, 0.1) + landSq(tr, ph(1).t0 + 0.05, 0.14), dir: -1, lean: 0.05 * Math.sin(tr * 1.1),
    lookX: lerp(0.6, -0.2, point) + 0.7 * follow, lookY: lerp(0, -1, point) - 0.6 * follow, wide: 0.6 * point + 0.7 * bump(tr, sheetT + 0.4, 1.0), blink: blinkAt(tr, [1.8, 4.4, 9.1, 11.6, 15.6]), happy: 0, mood: lerp(0.6, 0.0, point),
    talk: kt ? mouth(tr) : 0, point, hold: 0.2 + 0.4 * bump(tr, sheetT + 1, 2), t: tr, trail: 0.6 + 0.4 * Math.sin(tr * 2), jig: landSq(tr, ph(1).t0 + 0.05) };
  return [rs, ks];
}
function ACT2(tr) {
  // the big leap over the pond's edge, the catch, the pouch, the sock gag, back to the line.
  const J0 = 0.7, J1 = 2.35, CATCH = 1.55, ST0 = 2.7, ST1 = 3.7, SOCK = 4.7, H0 = 9.9, H1 = 10.6;
  const pj = prog(tr, J0, J1), inJ = pj > 0 && pj < 1;
  let x = lerp(380, 600, sm(pj)), air = inJ ? Math.sin(pj * PI) * 430 : 0;
  const hp = prog(tr, H0, H1); if (tr > H0) { x = lerp(600, 480, sm(hp)); air += hp > 0 && hp < 1 ? Math.sin(hp * PI) * 120 : 0; }
  const sq = antic(tr, J0, 0.2) + landSq(tr, J1, 0.22) - (inJ ? 0.12 * Math.sin(pj * PI) : 0) + antic(tr, H0, 0.1) + landSq(tr, H1, 0.12);
  const pt = talking('Prune', tr), kt = talking('Tilou', tr), laugh = tr > ph(1).t0 + 0.2 && tr < ph(2).t0 - 0.2;
  const rs = { x, y: gy(x), air, sq, dir: tr > 9.85 ? -1 : 1, lean: inJ ? 0.25 * Math.cos(pj * PI) * -0.4 + 0.1 : 0.03 * Math.sin(tr * 2),
    lookX: tr < 4.6 ? 0.9 : tr < 5.4 ? 0.9 : 0.8, lookY: tr < CATCH ? -1 : tr < ST1 ? 0.6 : -0.2, wide: 0.7 * bump(tr, CATCH, 0.6) + 0.6 * bump(tr, SOCK + 0.2, 0.6) + (pt ? 0.3 : 0), blink: blinkAt(tr, [0.3, 4.2, 8.4, 11.6]),
    happy: (tr > 2.4 && tr < 2.9) || (laugh && !kt) || (tr > 11.2) ? 1 : 0, mood: 1, talk: pt ? mouth(tr) : 0, reach: inJ ? sm(pj * 3) : (tr < ST1 ? 0.2 : pt ? 0.8 : 0.3 + 0.5 * bump(tr, 11.0, 0.8)), reach2: inJ ? sm(pj * 3) * 0.9 : 0.2,
    t: tr, trail: inJ || (hp > 0 && hp < 1) ? 1 : 0.3, jig: landSq(tr, J1) + landSq(tr, H1) + (laugh ? 0.12 * Math.sin(tr * 16) : 0), earLag: -0.4 * clamp(air / 250) + landSq(tr, J1, 0.4), pouch: sm((tr - ST0) / 0.8) * (1 - sm((tr - 10.6) / 0.6)) };
  const kx = 900, sockOn = sm((tr - SOCK) / 0.12), khop = hopArc(tr, 11.1, 11.55, 50) + hopArc(tr, 11.7, 12.15, 40);
  const ks = { x: kx, y: gy(kx), air: khop, sq: landSq(tr, SOCK, 0.2) + landSq(tr, 11.55, 0.12), dir: -1, lean: -0.06 * bump(tr, SOCK + 0.2, 0.8) + 0.04 * Math.sin(tr * 1.4),
    lookX: tr < SOCK ? lerp(-0.9, 0.4, sm((tr - 0.8) / 0.6)) : -0.6, lookY: tr < CATCH + 0.3 ? -1 : tr < SOCK ? 0.1 : -0.9, wide: 0.9 * bump(tr, SOCK + 0.15, 0.7) + (kt ? 0.2 : 0), blink: blinkAt(tr, [0.4, 3.0, 7.6, 10.2]),
    happy: (tr > 2.4 && tr < 3.2) || tr > 11.0 ? 1 : 0, mood: tr > SOCK ? 0.4 : 1, talk: kt ? mouth(tr) : 0, point: 0.6 * bump(tr, 6.6, 1.6), hold: 0.3 + 0.5 * bump(tr, 1.5, 1.2), t: tr, trail: 0.4, jig: landSq(tr, SOCK) + landSq(tr, 11.55), sock: sockOn, sockT: SOCK };
  return [rs, ks];
}
function ACT3(tr) {
  // The laundry dances; they fold the sheet together, carry it to the basket, a heart, then the moral.
  const F0 = ph(1).t0 - 0.4, F1 = F0 + 3.4;   // folding: walking towards each other
  const f = sm((tr - F0) / (F1 - F0));
  const rx = lerp(290, 340, f), kx = lerp(830, 740, f);
  const pt = talking('Prune', tr), kt = talking('Tilou', tr);
  const step = (t0) => hopArc(tr, t0, t0 + 0.4, 26);
  const holding = tr > F0 - 0.6 && tr < F1 + 0.5 ? 1 : 0;
  const k1 = ph(2).t0 - 0.3, khop = hopArc(tr, k1, k1 + 0.45, 70);
  const rs = { x: rx, y: gy(rx), air: step(F0 + 0.4) + step(F0 + 1.6) + step(F0 + 2.8), sq: landSq(tr, F0 + 0.8, 0.08) + landSq(tr, F0 + 2.0, 0.08) + landSq(tr, F0 + 3.2, 0.08), dir: 1, lean: 0.03 * Math.sin(tr * 1.2),
    lookX: tr < 5 ? 0.3 : 0.9, lookY: tr < 5 ? -0.8 : -0.1, wide: pt ? 0.3 : 0, blink: blinkAt(tr, [2.2, 5.3, 9.0, 12.2, 16.0, 21.0, 25.0]), happy: (tr > 15.8 && tr < 17.5) || tr > 23 ? 1 : 0, mood: 1,
    talk: pt ? mouth(tr) : 0, reach: holding ? 0.62 : pt ? 0.7 : 0.15 + 0.05 * Math.sin(tr), reach2: holding ? 0.55 : 0.1, t: tr, trail: 0.3 + 0.3 * f * (1 - f) * 4, jig: 0, earLag: 0.05 * Math.sin(tr * 1.5), pouch: 0 };
  const ks = { x: kx, y: gy(kx), air: step(F0 + 0.6) + step(F0 + 1.8) + step(F0 + 3.0) + khop, sq: landSq(tr, k1 + 0.45, 0.14), dir: -1, lean: 0.04 * Math.sin(tr * 1.3),
    lookX: tr < 5 ? -0.3 : 0.9, lookY: tr < 5 ? -0.8 : -0.1, wide: kt ? 0.3 : 0, blink: blinkAt(tr, [1.4, 4.6, 8.2, 13.4, 18.4, 22.0]), happy: (tr > ph(2).t1 && tr < 17.5) || tr > 23 ? 1 : 0, mood: 1,
    talk: kt ? mouth(tr) : 0, point: 0.8 * bump(tr, k1 + 0.6, 0.9), hold: holding ? 0.85 : 0.3, t: tr, trail: 0.4, jig: landSq(tr, k1 + 0.45) };
  return [rs, ks];
}
const ACT = (tr) => (PART === 1 ? ACT1(tr) : PART === 2 ? ACT2(tr) : ACT3(tr));

// ---------------------------------------------------------------- camera
function camAt(tr) {
  const K = PART === 1 ? [[0, [470, 980, 1.06]], [3.4, [520, 1000, 1.14]], [8.4, [600, 960, 1.08]], [12, [700, 900, 1.04]], [16, [580, 990, 1.16]], [17.8, [560, 1000, 1.2]]]
    : PART === 2 ? [[0, [600, 960, 1.08]], [1.5, [680, 860, 1.02]], [3.0, [640, 990, 1.16]], [5.2, [740, 980, 1.18]], [8.5, [620, 1000, 1.12]], [13.0, [560, 980, 1.1]]]
      : [[0, [540, 900, 1.0]], [5, [540, 960, 1.08]], [10, [520, 990, 1.16]], [15, [520, 990, 1.14]], [18, [540, 930, 1.0]], [29.8, [540, 920, 1.02]]];
  const [x, y, z] = kf(tr, K, E.inOutCubic);
  const shake = PART === 1 ? 1.6 : 1;
  return { x: x + 7 * shake * noise1(tr * 0.55, 11), y: y + 5 * noise1(tr * 0.5, 12), z: z * (1 + 0.004 * Math.sin(tr * 1.1)) };
}

// ---------------------------------------------------------------- HITS (beat = 2 × seconds)
const HITS = PART === 1 ? [
  [2 * 0.45, 'push off', 'boing', { gain: 0.12, pitch: 220, to: 480, len: 0.25 }], [2 * 1.25, 'land', 'thud', { gain: 0.22 }],
  [2 * 1.42, 'push off', 'boing', { gain: 0.12, pitch: 240, to: 520, len: 0.25 }], [2 * 2.2, 'land', 'thud', { gain: 0.22 }],
  [2 * 2.38, 'push off', 'boing', { gain: 0.12, pitch: 260, to: 540, len: 0.25 }], [2 * 3.15, 'land', 'thud', { gain: 0.26 }],
  [2 * 8.7, 'peg pops', 'pop', { pitch: 'E6', gain: 0.22 }], [2 * 8.9, 'peg pops', 'pop', { pitch: 'A5', gain: 0.2 }],
  [2 * 9.0, 'sheet flies', 'whoosh', { len: 0.8, gain: 0.16, from: 400, to: 1600 }], [2 * 9.6, 'sock flies', 'whoosh', { len: 0.4, gain: 0.1, from: 900, to: 2400 }],
  [2 * 12.5, 'suspense', 'swell', { gain: 0.1 }],
] : PART === 2 ? [
  [2 * 0.68, 'leap', 'boing', { gain: 0.16, pitch: 200, to: 700, len: 0.4 }], [2 * 0.9, 'air', 'whoosh', { len: 0.6, gain: 0.12, from: 500, to: 1800 }],
  [2 * 1.55, 'catch', 'pop', { pitch: 'C6', gain: 0.24 }], [2 * 2.35, 'land', 'thud', { gain: 0.3 }],
  [2 * 2.9, 'into the pouch', 'bell', { pitch: 'E6', gain: 0.16 }], [2 * 3.3, 'sparkle', 'bell', { pitch: 'B6', gain: 0.1 }],
  [2 * 4.4, 'sock falls', 'whoosh', { len: 0.3, gain: 0.1, from: 1800, to: 600 }], [2 * 4.7, 'sock on head', 'pop', { pitch: 'G5', gain: 0.26 }],
  [2 * 9.9, 'hop', 'boing', { gain: 0.1, pitch: 260, to: 520, len: 0.25 }], [2 * 10.6, 'land', 'thud', { gain: 0.18 }],
  [2 * 10.9, 'sheet from pouch', 'bell', { pitch: 'G6', gain: 0.12 }], [2 * 11.6, 'peg', 'tick', { gain: 0.3 }], [2 * 11.75, 'peg', 'tick', { gain: 0.3 }],
] : [
  [2 * 1.0, 'lanterns', 'bell', { pitch: 'E6', gain: 0.1 }], [2 * 2.0, 'lanterns', 'bell', { pitch: 'G6', gain: 0.08 }],
  [2 * 7.6, 'fold', 'pop', { pitch: 'A5', gain: 0.14 }], [2 * 9.0, 'fold', 'pop', { pitch: 'C6', gain: 0.14 }],
  [2 * 10.2, 'into basket', 'thud', { gain: 0.14 }], [2 * 15.9, 'heart', 'bell', { pitch: 'E6', gain: 0.14 }],
  [2 * 17.7, 'moral', 'swell', { gain: 0.1 }], [2 * 24.6, 'fin', 'bell', { pitch: 'C6', gain: 0.12 }],
];

// ---------------------------------------------------------------- subtitles
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
  const out = 1 - E.inCubic(prog(t, cur.t1 + 0.4, cur.t1 + 0.55)), wr = wrap(ctx, cur.text, 860), lh = 84, dur = (cur.t1 - cur.t0) * 0.94;
  const y0 = 1430 - (wr.lines.length - 1) * lh / 2, accent = cur.who === 'Prune' ? '#FFB3CF' : cur.who === 'Tilou' ? '#9FF0DA' : '#FFE27A';
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

// ---------------------------------------------------------------- the laundry line and what hangs on it, per part
function posts(ctx) {
  [LX0, LX1].forEach((px) => { softShadow(ctx, px, GY0 + 6, 40, 9, 0.4); ctx.fillStyle = lgrad(ctx, px - 13, 0, px + 13, 0, [[0, '#C49A6A'], [0.5, '#9A6E44'], [1, '#5E4028']]); ctx.beginPath(); ctx.roundRect(px - 13, LY - 30, 26, GY0 - LY + 36, 6); ctx.fill(); ctx.beginPath(); ctx.roundRect(px - 34, LY - 30, 68, 16, 6); ctx.fill(); });
  ctx.beginPath(); ctx.moveTo(LX0, LY - 20); for (let x = LX0; x <= LX1; x += 20) ctx.lineTo(x, lineY(x) - 20); stroke(ctx, '#F4EEE2', 4);
}
function laundry(ctx, tr, wind, rs) {
  const flap = (i) => wind * (0.35 + 0.25 * Math.sin(tr * 5.3 + i) + 0.15 * noise1(tr * 2 + i, 50 + i));
  // things that stay on the line all film long: the pink dress and two socks
  dress(ctx, 600, lineY(600) - 20, tr, flap(1));
  const sockOn = (x, i, col) => sock(ctx, x, lineY(x) - 22, 0.9, -0.1 + flap(i) * 0.9 + 0.05 * Math.sin(tr * 2 + i), col);
  sockOn(760, 2, '#5EA8E8');
  if (PART === 3) { sockOn(820, 3, '#E8504A'); }
  if (PART === 1) {
    const OFF = 8.75;
    if (tr < 9.6) sockOn(820, 3, '#E8504A');
    else { const q = (tr - 9.6) / 2.2; if (q < 1) sock(ctx, lerp(820, 1250, q), lineY(820) - 22 - 700 * q + 120 * Math.sin(q * 4), 0.9, q * 9, '#E8504A'); }
    if (tr < OFF) drap(ctx, 330, lineY(330) - 20, 240, 250, tr, { flow: flap(0) * 1.4, wave: 0.4 + wind * 0.6 });
    else { const q = (tr - OFF) / (17.8 - OFF), e = E.outCubic(clamp(q * 1.6));
      const x = lerp(330, PX + 70, e) + 30 * Math.sin(tr * 1.3), y = lerp(lineY(330) - 20, 470, sm(q * 2)) + (q > 0.5 ? lerp(0, 250, sm((q - 0.5) * 2)) : 0) + 20 * Math.sin(tr * 2.1);
      drap(ctx, x, y, 240, 250, tr, { flow: 0.4 + 0.3 * Math.sin(tr * 2.2), wave: 1, rot: 0.25 * Math.sin(tr * 1.7) + 0.2, pegs: 0 }); }
  }
  if (PART === 2) {
    const CATCH = 1.55, ST0 = 2.7, ST1 = 3.7, OUT0 = 10.7, OUT1 = 11.6;
    if (tr < CATCH) { const cs = ACT2(CATCH)[0], [cx0, cy0] = rooHand(cs, 0), q = sm(tr / CATCH); drap(ctx, lerp(950, cx0, q) + 10 * Math.sin(tr * 2), lerp(720, cy0 - 10, q), 240, 250, tr, { flow: 0.2 * Math.sin(tr * 2), wave: 0.8, rot: 0.2 + 0.1 * Math.sin(tr * 1.7), pegs: 0 }); }
    else if (tr < ST1) { const [hx, hy] = rooHand(rs, 0), sq2 = 1 - sm((tr - ST0) / (ST1 - ST0)), [px, py] = [rs.x + rs.dir * 52 * RS, rs.y - rs.air - 150 * RS];
      drap(ctx, lerp(px, hx, sq2), lerp(py - 60, hy - 10, sq2), 240, 250, tr, { flow: tr < 2.4 ? -0.4 : 0.1, wave: 0.6, rot: tr < 2.4 ? 0.5 : 0, pegs: 0, sc: 0.12 + 0.88 * sq2 });
      for (let i = 0; i < 8; i++) { const life = tr - ST0 - i * 0.08; if (life > 0 && life < 1) sparkle(ctx, px + 70 * Math.cos(i * 2.4) * life, py - 40 - 120 * life + 20 * Math.sin(i), 9, Math.sin(life * PI)); } }
    else if (tr > OUT0) { const q = sm((tr - OUT0) / (OUT1 - OUT0)), [px, py] = [rs.x + rs.dir * 52 * RS, rs.y - rs.air - 150 * RS];
      drap(ctx, lerp(px, 330, q), lerp(py, lineY(330) - 20, q) - 140 * Math.sin(q * PI), 240, 250, tr, { flow: 0.1 * Math.sin(tr * 3), wave: 0.5 - 0.3 * q, pegs: tr > OUT1 ? 1 : 0, sc: 0.12 + 0.88 * q });
      for (let i = 0; i < 6; i++) { const life = tr - OUT0 - i * 0.1; if (life > 0 && life < 1) sparkle(ctx, lerp(px, 330, q) + 60 * Math.cos(i * 2.1), lerp(py, 600, q) + 40 * Math.sin(i * 1.7) - 50 * life, 8, Math.sin(life * PI)); } }
  }
}

// ---------------------------------------------------------------- the frame
function draw(ctx, u, tr) {
  const c = camAt(tr), wind = PART === 1 ? 1 : PART === 2 ? 0.25 : 0.12, night = PART === 3 ? 1 : 0, sun = PART === 2 ? 1 : 0;
  // sky
  const sky = PART === 1 ? [['#6F86A6'], ['#9FB2C8'], ['#C9D2D8'], ['#D8DCD2']] : PART === 2 ? [['#4C9AD8'], ['#8CC8EE'], ['#FFE6B8'], ['#FFD49A']] : [['#0E1B3D'], ['#22417A'], ['#3D6A96'], ['#2C4E66']];
  ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, [[0, sky[0][0]], [0.42, sky[1][0]], [0.72, sky[2][0]], [1, sky[3][0]]]); ctx.fillRect(0, 0, W, H);
  const SX = 230, SY = 400;
  if (sun) { ctx.fillStyle = rgrad(ctx, SX, SY, 900, [[0, 'rgba(255,248,215,0.95)'], [0.1, 'rgba(255,232,160,0.75)'], [0.4, 'rgba(255,205,130,0.25)'], [1, 'rgba(255,205,130,0)']]); ctx.fillRect(0, 0, W, H); ball(ctx, SX, SY, 70, 70, '#FFFFFF', '#FFF6D0', '#FFE08A'); }
  if (sun) layer(ctx, c, 0.14, () => { ctx.save(); ctx.lineCap = 'butt'; ['#FF6B6B', '#FFA94D', '#FFE066', '#8CE99A', '#74C0FC', '#B197FC'].forEach((col, i) => { ctx.beginPath(); ctx.arc(620, 1300, 720 - i * 22, PI * 1.05, PI * 1.95); ctx.globalAlpha = 0.32; ctx.strokeStyle = col; ctx.lineWidth = 22; ctx.stroke(); }); ctx.restore(); });
  if (night) layer(ctx, c, 0.08, () => {
    for (let i = 0; i < 90; i++) { const x = -200 + 1500 * hash01(i, 201), y = -100 + 900 * hash01(i, 202), tw = 0.55 + 0.45 * Math.sin(tr * (1.2 + 2 * hash01(i, 203)) + i); ell(ctx, x, y, 2.4 + 2.6 * hash01(i, 204), 2.4 + 2.6 * hash01(i, 204), `rgba(235,242,255,${A(0.9 * tw)})`); }
    const mx = 800, my = 330; ctx.fillStyle = rgrad(ctx, mx, my, 520, [[0, 'rgba(210,228,255,0.55)'], [0.25, 'rgba(170,200,255,0.2)'], [1, 'rgba(170,200,255,0)']]); ctx.beginPath(); ctx.arc(mx, my, 520, 0, TAU); ctx.fill();
    ball(ctx, mx, my, 88, 88, '#FFFFFF', '#F2F4E8', '#C9D2E0'); ell(ctx, mx - 26, my - 16, 17, 14, 'rgba(180,190,210,0.5)'); ell(ctx, mx + 30, my + 26, 11, 9, 'rgba(180,190,210,0.5)');
  });
  // clouds drift (fast in the wind)
  { ctx.save(); ctx.globalAlpha = PART === 1 ? 0.75 : PART === 2 ? 0.85 : 0.18; if (PART === 1) { ctx.filter = 'none'; }
    const sp = PART === 1 ? 90 : 14, off = (tr * sp) % 1200; ctx.drawImage(L.cloud, -300 - off, PART === 1 ? 40 : 60, 2400, 800); ctx.drawImage(L.cloud, 2100 - off, PART === 1 ? 40 : 60, 2400, 800);
    if (PART === 1) { ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.35; ctx.drawImage(L.cloud, -500 - (tr * 60) % 1200, 120, 2400, 800); }
    ctx.restore(); }
  layer(ctx, c, 0.26, () => ctx.drawImage(L.far, -OX, -OY));
  layer(ctx, c, 0.4, () => { for (let i = 0; i < 4; i++) { const mx = ((i * 600 + tr * (20 + 8 * i) * (1 + 3 * wind)) % 2400) - 600, my = 1050 + 60 * hash01(i, 3); ctx.save(); ctx.translate(mx, my); ctx.scale(1, 0.2); ctx.fillStyle = rgrad(ctx, 0, 0, 520, [[0, `rgba(236,242,246,${A(0.22 * (1 - sun * 0.6))})`], [1, 'rgba(236,242,246,0)']]); ctx.beginPath(); ctx.arc(0, 0, 520, 0, TAU); ctx.fill(); ctx.restore(); } });
  layer(ctx, c, 0.55, () => ctx.drawImage(L.mid, -OX, -OY));
  if (sun) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { const a = PI * 0.3 + (i - 3) * 0.14 + 0.02 * Math.sin(tr * 0.7 + i), w0 = 0.03 + 0.03 * hash01(i, 9), al = 0.06 + 0.06 * (0.5 + 0.5 * Math.sin(tr * 1.3 + i * 2.1));
    ctx.beginPath(); ctx.moveTo(SX, SY); ctx.lineTo(SX + Math.cos(a - w0) * 2400, SY + Math.sin(a - w0) * 2400); ctx.lineTo(SX + Math.cos(a + w0) * 2400, SY + Math.sin(a + w0) * 2400); ctx.closePath();
    ctx.fillStyle = rgrad(ctx, SX, SY, 1900, [[0, `rgba(255,236,170,${A(al)})`], [1, 'rgba(255,236,170,0)']]); ctx.fill(); } ctx.restore(); }

  const [rs, ks] = ACT(tr);
  layer(ctx, c, 1, () => {
    // ground
    ctx.beginPath(); ctx.moveTo(-700, 2300); for (let x = -700; x <= 1800; x += 40) ctx.lineTo(x, gy(x)); ctx.lineTo(1800, 2300); ctx.closePath();
    ctx.fillStyle = lgrad(ctx, 0, GY0 - 10, 0, GY0 + 520, [[0, '#9CCB64'], [0.12, '#76AE52'], [0.5, '#4A8444'], [1, '#2A5A34']]); ctx.fill();
    for (let i = 0; i < 24; i++) { const x = -300 + 1700 * hash01(i, 31), d = hash01(i, 32), y = gy(x) + 26 + d * 230; ell(ctx, x, y, 60 + 60 * hash01(i, 33), 10 + 10 * d, `rgba(${i % 2 ? '170,210,110' : '30,80,50'},0.22)`); }
    // pond with the sky in it
    { ctx.save(); ctx.beginPath(); ctx.ellipse(PX, PY, 250, 48, 0, 0, TAU);
      ctx.fillStyle = lgrad(ctx, 0, PY - 48, 0, PY + 48, PART === 1 ? [[0, '#8FA4BA'], [1, '#4A6680']] : PART === 2 ? [[0, '#BFE6FF'], [1, '#4C9AD0']] : [[0, '#5B7FB8'], [1, '#22345E']]); ctx.fill(); ctx.clip();
      for (let i = 0; i < 4; i++) { const p = (tr / (PART === 1 ? 1.2 : 2.4) + i * 0.27) % 1; ctx.beginPath(); ctx.ellipse(PX - 120 + 80 * i, PY + 6 * Math.sin(i * 2), 30 + 70 * p, 6 + 12 * p, 0, 0, TAU); stroke(ctx, `rgba(240,248,255,${A(0.45 * (1 - p))})`, 3); }
      if (night) ell(ctx, PX - 40 + 4 * Math.sin(tr * 1.3), PY - 6, 34, 9, 'rgba(240,246,255,0.8)'); else ell(ctx, PX + 40, PY - 10, 90, 6, 'rgba(255,255,255,0.35)');
      ctx.restore(); ctx.beginPath(); ctx.ellipse(PX, PY, 250, 48, 0, 0, TAU); stroke(ctx, 'rgba(40,80,50,0.55)', 6);
      // reeds and a water lily
      for (let i = 0; i < 7; i++) { const rx = PX + 180 + i * 16, rh = 90 + 50 * hash01(i, 7), a = 0.15 * Math.sin(tr * (1.5 + wind * 2) + i) + wind * 0.25; ctx.beginPath(); ctx.moveTo(rx, PY + 10); ctx.quadraticCurveTo(rx + Math.sin(a) * rh * 0.5, PY - rh * 0.6, rx + Math.sin(a) * rh, PY - rh); stroke(ctx, '#4E7A3A', 6); if (i % 2) ball(ctx, rx + Math.sin(a) * rh, PY - rh, 7, 18, '#A87A4A', '#7A5230', '#4A3020', a); }
      ell(ctx, PX - 150, PY + 12, 36, 10, '#5E9A4A'); ball(ctx, PX - 150, PY + 2, 12, 10, '#FFE0EC', '#F7A8C4', '#D07094'); }
    // flowers in the grass (more in the sun)
    for (let i = 0; i < (sun ? 26 : 14); i++) { const x = -200 + 1500 * hash01(i, 41), d = hash01(i, 42), y = gy(x) + 30 + d * 220; if (Math.abs(x - PX) < 280 && y > PY - 60 && y < PY + 60) continue; const s = 0.6 + 0.6 * d, a = 0.12 * Math.sin(tr * (2 + wind * 4) + i) * (0.5 + wind);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -34 * s); stroke(ctx, '#4E8A3E', 3); for (let p = 0; p < 5; p++) leafShape(ctx, Math.cos(p * TAU / 5) * 9 * s, -34 * s + Math.sin(p * TAU / 5) * 9 * s, 18 * s, 10 * s, p * TAU / 5, i % 3 === 0 ? '#F2B8C6' : i % 3 === 1 ? '#FFFFFF' : '#FFD45E'); ell(ctx, 0, -34 * s, 5 * s, 5 * s, '#F5A623'); ctx.restore(); }
    // grass edge, leaning with the gusts
    const gust = wind * (0.25 + 0.2 * noise1(tr * 1.2, 61));
    for (let i = 0; i < 150; i++) { const x = -330 + 11.6 * i + 8 * hash01(i, 51), h = 20 + 34 * hash01(i, 52), a = gust + 0.12 * Math.sin(tr * (2.6 + wind * 3) + x * 0.02) + 0.3 * (hash01(i, 53) - 0.5), y = gy(x) + 4;
      ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.quadraticCurveTo(x + Math.sin(a) * h * 0.4, y - h * 0.6, x + Math.sin(a) * h, y - Math.cos(a) * h); ctx.quadraticCurveTo(x + Math.sin(a) * h * 0.5 + 4, y - h * 0.5, x + 5, y); ctx.fillStyle = i % 3 ? '#7FB352' : '#9FD264'; ctx.fill(); }
    // basket by the left post
    basket(ctx, 190, GY0 + 40, PART === 3 ? clamp((tr - 10.2) / 0.3) : PART === 2 ? 0.6 : 0.4);
    posts(ctx);
    if (night) { [[260, '#FF9A5A'], [450, '#FFC85A'], [690, '#FF7A8A'], [880, '#FFC85A']].forEach(([lx, col], i) => paperLantern(ctx, lx, lineY(lx) - 18, tr, clamp((tr - 0.6 - i * 0.45) / 0.4) * (0.85 + 0.15 * Math.sin(tr * 3 + i)), col)); }
    laundry(ctx, tr, wind, rs);
    // P3: the sheet held between them, folded in two, then in four, then into the basket
    if (PART === 3) {
      const F0 = ph(1).t0 - 0.4, F1 = F0 + 3.4, f1 = sm((tr - (F0 + 1.0)) / 0.5), f2 = sm((tr - (F0 + 2.4)) / 0.5);
      if (tr > F0 - 0.6 && tr < F1 + 0.5) { const [ax, ay] = rooHand(rs, 0), [bx, by] = koalaHand(ks), w = Math.max(40, bx - ax), h = 250 * (1 - 0.5 * f1) * (1 - 0.45 * f2);
        drap(ctx, (ax + bx) / 2, (ay + by) / 2 - 4, w, h, tr, { flow: 0.05 * Math.sin(tr * 2), wave: 0.4, pegs: 0, a: clamp((tr - (F0 - 0.6)) / 0.3) }); }
      else if (tr >= F1 + 0.5 && tr < F1 + 1.3) { const q = sm((tr - F1 - 0.5) / 0.8), [ax, ay] = rooHand(rs, 0), [bx, by] = koalaHand(ks);
        drap(ctx, lerp((ax + bx) / 2, 190, q), lerp((ay + by) / 2, GY0 - 60, q) - 120 * Math.sin(q * PI), lerp(Math.max(40, bx - ax), 120, q), 70 * (1 - q * 0.4), tr, { wave: 0.2, pegs: 0, a: 1 - q * 0.6 }); }
      if (tr < F0 - 0.6) drap(ctx, 330, lineY(330) - 20, 240, 250, tr, { flow: 0.12 * Math.sin(tr * 1.4), wave: 0.4, a: 1 - clamp((tr - (F0 - 1.0)) / 0.4) });
    }
    roo(ctx, rs.x, rs.y, RS, rs);
    koala(ctx, ks.x, ks.y, KS, ks);
    // P2 : the sock falls from the sky onto Tilou
    if (PART === 2 && tr > 4.0 && tr < 4.7) { const q = (tr - 4.0) / 0.7; sock(ctx, ks.x - 10 + 60 * (1 - q), ks.y - 600 - 900 * (1 - q * q) + 300, 1.0, q * 5, '#E8504A'); }
    // heart (P2 laugh, P3 friendship)
    const HT = PART === 2 ? 7.2 : PART === 3 ? 15.8 : -9;
    { const life = tr - HT, k = spring(life, SPRING.bouncy); if (life > 0 && life < 2) { ctx.save(); ctx.globalAlpha = 1 - sm((life - 1.2) / 0.6); heart(ctx, (rs.x + ks.x) / 2 + 10 * Math.sin(life * 3), 880 - 90 * E.outCubic(clamp(life / 1.6)), 28 * k, 0.12 * Math.sin(life * 4)); ctx.restore(); } }
    // wind: leaves and petals blowing across
    if (PART === 1) { for (let i = 0; i < 16; i++) { const per = 2.2 + 1.6 * hash01(i, 81), p = (tr / per + hash01(i, 82)) % 1, x = -150 + 1500 * p, y = 300 + 1000 * hash01(i, 83) + 80 * Math.sin(p * TAU * 2 + i);
      leafShape(ctx, x, y, 30 + 16 * hash01(i, 84), 10 + 5 * hash01(i, 85), p * 14 + i, ['#E8B04A', '#8FC264', '#F2B8C6', '#E08A2E'][i % 4]); }
      ctx.save(); ctx.globalAlpha = 0.35; for (let i = 0; i < 9; i++) { const per = 1.1 + 0.6 * hash01(i, 91), p = (tr / per + hash01(i, 92)) % 1, x = -400 + 1900 * p, y = 250 + 1000 * hash01(i, 93); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 120, y - 16, x + 260, y + 4 * Math.sin(i)); stroke(ctx, `rgba(255,255,255,${A(Math.sin(p * PI))})`, 3); } ctx.restore(); }
    if (sun) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 20; i++) { const life = (tr * (0.08 + 0.06 * hash01(i, 14)) + hash01(i, 15)) % 1, x = -60 + 1250 * hash01(i, 16) + 30 * Math.sin(tr * 0.9 + i), y = 1300 - 760 * life, r = 5 + 9 * hash01(i, 17); ctx.fillStyle = rgrad(ctx, x, y, r * 2.4, [[0, `rgba(255,236,170,${A(0.5 * Math.sin(life * PI))})`], [1, 'rgba(255,236,170,0)']]); ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, TAU); ctx.fill(); } ctx.restore(); }
  });
  // night: everything turns blue except what the lanterns and fireflies light
  if (night) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.62; ctx.fillStyle = '#6A80C4'; ctx.fillRect(0, 0, W, H); ctx.restore();
    layer(ctx, c, 1, () => {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      [[260, 0], [450, 1], [690, 2], [880, 3]].forEach(([lx, i]) => { const a = clamp((tr - 0.6 - i * 0.45) / 0.4); ctx.fillStyle = rgrad(ctx, lx, lineY(lx) + 30, 380, [[0, `rgba(255,200,120,${A(0.22 * a)})`], [1, 'rgba(255,190,100,0)']]); ctx.beginPath(); ctx.arc(lx, lineY(lx) + 30, 380, 0, TAU); ctx.fill(); });
      const fire = sm((tr - 4) / 12);
      for (let i = 0; i < 40; i++) { const on = i < 8 ? 0.6 : clamp((fire * 40 - (i - 8)) / 5); if (on <= 0) continue;
        const bx0 = -150 + 1400 * hash01(i, 211), by0 = 520 + 700 * hash01(i, 212), x = bx0 + 46 * Math.sin(tr * (0.5 + 0.5 * hash01(i, 213)) + i), y = by0 + 34 * Math.sin(tr * (0.6 + 0.4 * hash01(i, 214)) + i * 1.3);
        const bl = 0.55 + 0.45 * Math.sin(tr * (2 + 2 * hash01(i, 216)) + i * 3), r = 24 + 20 * hash01(i, 217);
        ctx.fillStyle = rgrad(ctx, x, y, r, [[0, `rgba(240,255,170,${A(0.95 * on * bl)})`], [0.25, `rgba(200,255,120,${A(0.5 * on * bl)})`], [1, 'rgba(200,255,120,0)']]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
      ctx.restore();
    });
  }
  // blurred foreground grass
  layer(ctx, c, 1.5, () => {
    const g = wind * 0.06;
    ctx.save(); ctx.translate(-380, 1720); ctx.rotate(0.03 * Math.sin(tr * 1.2) + g * Math.sin(tr * 3)); ctx.drawImage(L.fg, -100, -760, 860, 860); ctx.restore();
    ctx.save(); ctx.translate(1180, 1760); ctx.scale(-1, 1); ctx.rotate(0.03 * Math.sin(tr * 1.4 + 1) + g * Math.sin(tr * 3 + 1)); ctx.drawImage(L.fg, -100, -760, 860, 860); ctx.restore();
  });
  // grade
  ctx.save();
  if (PART === 1) { ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.3; ctx.fillStyle = '#A8B8D4'; ctx.fillRect(0, 0, W, H); }
  if (PART === 2) { ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.3; ctx.fillStyle = '#FFB55E'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.45; ctx.fillStyle = rgrad(ctx, SX, SY, 1300, [[0, 'rgba(255,225,160,0.55)'], [1, 'rgba(255,225,160,0)']]); ctx.fillRect(0, 0, W, H); }
  if (PART === 3) { ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.25; ctx.fillStyle = '#FFD27A'; ctx.fillRect(0, 0, W, H); }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = rgrad(ctx, W / 2, H * 0.52, H * 0.72, [[0, 'rgba(6,10,26,0)'], [0.6, 'rgba(6,10,26,0.06)'], [1, `rgba(6,10,26,${PART === 3 ? 0.55 : 0.42})`]]); ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.08; const fr = Math.floor(tr * 30), gxo = Math.floor(hash01(fr, 5) * 256), gyo = Math.floor(hash01(fr, 6) * 256);
  for (let y = -gyo; y < H; y += 256) for (let x = -gxo; x < W; x += 256) ctx.drawImage(L.grain, x, y);
  ctx.restore();

  // title card on the first part
  if (PART === 1) { const k = spring(tr - 0.2, SPRING.gentle), out = 1 - sm((tr - 3.6) / 0.6); if (k > 0.01 && out > 0.01) { ctx.save(); ctx.globalAlpha = clamp(k) * out; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    ctx.font = font(104, 600, DISPLAY); ctx.strokeStyle = 'rgba(30,20,50,0.85)'; ctx.lineWidth = 20; const y = 330 + (1 - k) * 40; ctx.strokeText('Prune & Tilou', W / 2, y); ctx.fillStyle = lgrad(ctx, 0, y - 80, 0, y, [[0, '#FFF3C4'], [1, '#FFC24D']]); ctx.fillText('Prune & Tilou', W / 2, y);
    ctx.font = font(56, 600, DISPLAY); ctx.lineWidth = 12; ctx.strokeText('Le linge s\'envole !', W / 2, y + 86); ctx.fillStyle = '#FFFFFF'; ctx.fillText('Le linge s\'envole !', W / 2, y + 86); ctx.restore(); } }

  if (PART !== 3) subs(ctx, tr);
  else {
    const MP = TL.phrases[TL.phrases.length - 1], M0 = MP.t0;
    if (tr < M0 - 0.3) subs(ctx, tr);
    const lines = [[['Aider', 'à', 'la', 'maison,'], 86], [["c'est", 'faire'], 86], [['plaisir'], 150], [['à', 'toute', 'sa', 'famille.'], 86]]; let wi = 0;
    const per = (MP.t1 - MP.t0) / 10;
    ctx.save(); ctx.lineJoin = 'round';
    lines.forEach(([ln, size0], li) => { let size = size0; ctx.font = font(size, 600, DISPLAY); const sp = ctx.measureText(' ').width; let ws = ln.map((w) => ctx.measureText(w).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (ln.length - 1);
      if (tot > 940) { size *= 940 / tot; ctx.font = font(size, 600, DISPLAY); ws = ln.map((w) => ctx.measureText(w).width); tot = 940; }
      let x = (W - tot) / 2; const y = [380, 480, 620, 730][li];
      ln.forEach((w, k) => { const p = spring(tr - (M0 - 0.1 + wi * per), SPRING.bouncy); wi++; if (p > 0.01) { ctx.save(); ctx.translate(x + ws[k] / 2, y + (1 - p) * 50); ctx.scale(0.85 + 0.15 * p, 0.85 + 0.15 * p); ctx.globalAlpha = clamp(p * 1.4); ctx.font = font(size, 600, DISPLAY); ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(8,16,40,0.9)'; ctx.lineWidth = size * 0.2; ctx.strokeText(w, 0, 0); ctx.fillStyle = li === 2 ? '#FFE27A' : '#FFFFFF'; ctx.fillText(w, 0, 0); ctx.restore(); } x += ws[k] + sp; }); });
    const f = spring(tr - (MP.t1 + 1.6), SPRING.gentle); if (f > 0.01) { ctx.globalAlpha = clamp(f); ctx.font = font(80, 600, DISPLAY); ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(8,16,40,0.9)'; ctx.lineWidth = 15; ctx.strokeText('Fin', W / 2, 1450 + (1 - f) * 30); ctx.fillStyle = '#FFFFFF'; ctx.fillText('Fin', W / 2, 1450 + (1 - f) * 30); }
    ctx.restore();
  }
}

M.film({ fonts: [font(SUBS, 600, DISPLAY)], hits: HITS, samples: 5, init() { buildLayers(); }, draw });
