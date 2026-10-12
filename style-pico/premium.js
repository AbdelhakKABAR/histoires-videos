// Passe « premium », appliquée une fois par image après le flou de mouvement :
// halo lumineux (bloom), reflet anamorphique sur la source de lumière, bokeh au premier plan,
// voile de lumière chaude qui respire, carton-titre doré (partie 1).
import * as M from './lib/motion.js';
const { W, H, clamp, hash01, font, spring, SPRING, E } = M;
const TAU = Math.PI * 2, sm = (p) => { p = clamp(p); return p * p * (3 - 2 * p); }, A = (v) => clamp(v).toFixed(3);
let B1 = null, B2 = null;
function bloom(ctx, amt, thr) {
  if (!B1) { B1 = document.createElement('canvas'); B1.width = 270; B1.height = 480; B2 = document.createElement('canvas'); B2.width = 270; B2.height = 480; }
  const a = B1.getContext('2d'), b = B2.getContext('2d');
  a.globalCompositeOperation = 'copy'; a.filter = `brightness(${thr}) contrast(2.6) saturate(1.25)`; a.drawImage(ctx.canvas, 0, 0, 270, 480);
  b.globalCompositeOperation = 'copy'; b.filter = 'blur(9px)'; b.drawImage(B1, 0, 0);
  b.globalCompositeOperation = 'lighter'; b.filter = 'blur(3px)'; b.globalAlpha = 0.7; b.drawImage(B1, 0, 0); b.globalAlpha = 1;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = amt; ctx.drawImage(B2, 0, 0, W, H); ctx.restore();
}
function streak(ctx, x, y, a, col) {
  if (a < 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [sx, sy, al] of [[1, 0.012, 0.55], [0.55, 0.03, 0.35], [0.25, 0.25, 0.4]]) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 900); g.addColorStop(0, `rgba(${col},${A(al * a)})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 900, 0, TAU); ctx.fill(); ctx.restore();
  }
  // petits fantômes d'objectif, en diagonale à travers l'image
  for (let i = 1; i <= 3; i++) { const k = i * 0.42, gx = x + (W / 2 - x) * k * 2, gy = y + (H / 2 - y) * k * 2, r = 30 + 26 * i;
    const g = ctx.createRadialGradient(gx, gy, r * 0.6, gx, gy, r); g.addColorStop(0, `rgba(${col},${A(0.05 * a)})`); g.addColorStop(0.9, `rgba(${col},${A(0.11 * a)})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, r, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function bokeh(ctx, t, col, a) {
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 11; i++) {
    const r = 40 + 90 * hash01(i, 81), sp = 6 + 14 * hash01(i, 82), x = ((hash01(i, 83) * (W + 400) + t * sp * (i % 2 ? 1 : -1)) % (W + 400) + W + 400) % (W + 400) - 200;
    const y = 120 + (H - 240) * hash01(i, 84) + 30 * Math.sin(t * 0.3 + i), al = a * (0.05 + 0.09 * hash01(i, 85)) * (0.75 + 0.25 * Math.sin(t * 0.8 + i * 1.7));
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${A(al * 0.55)})`); g.addColorStop(0.82, `rgba(${col},${A(al * 0.8)})`); g.addColorStop(0.93, `rgba(${col},${A(al * 1.25)})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function leak(ctx, t, col, a) {
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const x = -120 + 160 * Math.sin(t * 0.17), y = 260 + 200 * Math.sin(t * 0.11 + 1), al = a * (0.16 + 0.07 * Math.sin(t * 0.5));
  const g = ctx.createRadialGradient(x, y, 0, x, y, 1100); g.addColorStop(0, `rgba(${col},${A(al)})`); g.addColorStop(0.5, `rgba(${col},${A(al * 0.35)})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function cinema(ctx, t) {   // contraste doux en S + vignette ovale serrée + fondu au noir d'entrée
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.22; ctx.fillStyle = '#808080';
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5A6A8A'); g.addColorStop(0.5, '#9A8A7A'); g.addColorStop(1, '#3A3040'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.translate(W / 2, H / 2); ctx.scale(1, 1.55);
  const v = ctx.createRadialGradient(0, 0, W * 0.38, 0, 0, W * 0.78); v.addColorStop(0, 'rgba(4,6,16,0)'); v.addColorStop(1, 'rgba(4,6,16,0.38)');
  ctx.fillStyle = v; ctx.fillRect(-W, -H, 2 * W, 2 * H); ctx.restore();
}
function title(ctx, t) {
  const k = spring(t - 0.25, SPRING.gentle), out = 1 - sm((t - 4.6) / 0.7);
  if (k <= 0.01 || out <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(k) * out; ctx.textAlign = 'center';
  const y = 330 + (1 - k) * 40, sh = (t * 0.45) % 1;
  ctx.font = font(124, 600, 'Display');
  const g = ctx.createLinearGradient(W / 2 - 420, y - 110, W / 2 + 420, y + 10);
  g.addColorStop(0, '#FFF3C4'); g.addColorStop(clamp(sh - 0.08), '#F6C65B'); g.addColorStop(sh, '#FFFDF0'); g.addColorStop(clamp(sh + 0.08), '#F6C65B'); g.addColorStop(1, '#C98A2E');
  ctx.shadowColor = 'rgba(255,190,90,0.75)'; ctx.shadowBlur = 40; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(40,22,8,0.85)'; ctx.lineWidth = 16; ctx.strokeText('Pico & Plume', W / 2, y);
  ctx.shadowBlur = 0; ctx.fillStyle = g; ctx.fillText('Pico & Plume', W / 2, y);
  // filet doré et sous-titre
  const lw = 300 * E.outCubic(clamp((t - 0.7) / 0.9));
  ctx.strokeStyle = 'rgba(255,214,130,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W / 2 - lw, y + 48); ctx.lineTo(W / 2 + lw, y + 48); ctx.stroke();
  ctx.fillStyle = '#FFE7A8'; ctx.beginPath(); ctx.arc(W / 2, y + 48, 7, 0, TAU); ctx.fill();
  ctx.font = font(46, 600, 'Display'); ctx.globalAlpha = clamp(k) * out * sm((t - 1.0) / 0.6);
  ctx.strokeStyle = 'rgba(30,16,6,0.8)'; ctx.lineWidth = 10; ctx.strokeText('une histoire du soir', W / 2, y + 112); ctx.fillStyle = '#FFF6DE'; ctx.fillText('une histoire du soir', W / 2, y + 112);
  // étincelles qui traversent le titre
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = out;
  for (let i = 0; i < 14; i++) { const p = ((t - 0.4) * 0.5 + hash01(i, 91)) % 1; if (t < 0.4) break; const x = W / 2 - 440 + 880 * hash01(i, 92), yy = y - 60 + 120 * hash01(i, 93) - 50 * p, r = 4 + 6 * hash01(i, 94), al = Math.sin(p * Math.PI);
    const s = ctx.createRadialGradient(x, yy, 0, x, yy, r * 3); s.addColorStop(0, `rgba(255,240,200,${A(al)})`); s.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = s; ctx.beginPath(); ctx.arc(x, yy, r * 3, 0, TAU); ctx.fill(); }
  ctx.restore();
}
// P = { bloom, thr, bokeh:[col, a], leak:[col, a], streak:(t)=>[x, y, a, col] | null, title }
export function premium(ctx, t, P) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  bloom(ctx, P.bloom ?? 0.5, P.thr ?? 0.8);
  const s = P.streak && P.streak(t); if (s) streak(ctx, ...s);
  if (P.bokeh) bokeh(ctx, t, P.bokeh[0], typeof P.bokeh[1] === 'function' ? P.bokeh[1](t) : P.bokeh[1]);
  if (P.leak) leak(ctx, t, P.leak[0], typeof P.leak[1] === 'function' ? P.leak[1](t) : P.leak[1]);
  cinema(ctx, t);
  if (P.title) title(ctx, t);
  ctx.restore();
}
