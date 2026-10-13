
// ---------------------------------------------------------------- autres hôtes (pour varier les épisodes)
// Lulu, la petite lapine (elle parle), et Bouba, l'ourson. Vue de face, même kit que le koala : origine = sol sous les pieds.
const LAP = { hi: '#FFFFFF', mid: '#F1ECEA', lo: '#C9BEBC', pink: '#F7A8BC' };
function bunny(ctx, x, y, s, o) {
  const { dir = 1, air = 0, sq = 0, lean = 0, lookX = 0, lookY = 0, blink = 0, happy = 0, wide = 0, talk = 0, mood = 0.6, point = 0, hold = 0, t = 0, trail = 0, jig = 0 } = o;
  softShadow(ctx, x, y + 6, 110 * s * (1 - clamp(air / 300) * 0.4), 20 * s, 0.42 * (1 - clamp(air / 400) * 0.5));
  ctx.save(); ctx.translate(x, y - air); ctx.scale(dir * s * (1 + sq), s * (1 - sq)); ctx.rotate(lean);
  // feet, long and soft
  ball(ctx, -34, -14, 40, 17, LAP.hi, LAP.mid, LAP.lo); ball(ctx, 36, -14, 40, 17, LAP.hi, LAP.mid, LAP.lo);
  // fluffy tail peeking out
  ball(ctx, -70, -70, 26, 24, '#FFFFFF', '#F4F0EE', '#D2C8C6');
  // body + belly
  ball(ctx, 0, -100, 72, 86, LAP.hi, LAP.mid, LAP.lo);
  ctx.fillStyle = rgrad(ctx, 6, -86, 56, [[0, '#FFF7F2'], [1, 'rgba(250,236,230,0)']]); ctx.beginPath(); ctx.ellipse(6, -86, 44, 56, 0, 0, TAU); ctx.fill();
  // a little pink dress with white dots
  ctx.beginPath(); ctx.moveTo(-58, -132); ctx.quadraticCurveTo(0, -150, 58, -132); ctx.lineTo(74, -40); ctx.quadraticCurveTo(0, -20, -74, -40); ctx.closePath();
  ctx.fillStyle = lgrad(ctx, 0, -150, 0, -30, [[0, '#FFB3CC'], [1, '#E9799E']]); ctx.fill();
  for (let i = 0; i < 9; i++) ell(ctx, -50 + (i % 5) * 25 + (i > 4 ? 12 : 0), -110 + (i > 4 ? 40 : 0), 5, 5, 'rgba(255,255,255,0.85)');
  // arms
  { const th = lerp(2.2, -1.95, point) + 0.08 * Math.sin(t * 9) * point, sx = -54, sy = -140, hx = sx + Math.cos(th) * 64, hy = sy + Math.sin(th) * 64; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); stroke(ctx, '#EDE6E4', 24); ball(ctx, hx, hy, 15, 15, LAP.hi, LAP.mid, LAP.lo); }
  { const th = lerp(1.0, -0.15, hold) + 0.06 * Math.sin(t * 3), sx = 54, sy = -140, hx = sx + Math.cos(th) * 64, hy = sy + Math.sin(th) * 64; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); stroke(ctx, '#F6F1EF', 24); ball(ctx, hx, hy, 15, 15, LAP.hi, LAP.mid, LAP.lo); }
  // head
  ctx.save(); ctx.translate(0, -232); ctx.rotate(lookY * 0.08 + lean * 0.5 + jig * 0.12 + 0.04 * Math.sin(t * 1.6));
  // long ears: they lag behind the head and flop on landing
  const sway = 0.07 * Math.sin(t * 2.2) + jig * 0.6 + trail * 0.12;
  [[-30, -0.22 - sway, 150], [30, 0.3 + sway * 1.3, 140]].forEach(([ex, a, len], i) => { ctx.save(); ctx.translate(ex, -50); ctx.rotate(a); ball(ctx, 0, -len / 2, 25, len / 2, LAP.hi, LAP.mid, LAP.lo); ell(ctx, 2, -len / 2 + 6, 12, len / 2 - 18, LAP.pink); if (i === 1) { // yellow flower on the right ear
      ctx.translate(0, -len * 0.62); ctx.rotate(0.3 * Math.sin(t * 3) + sway); for (let p = 0; p < 5; p++) ball(ctx, Math.cos(p * TAU / 5) * 13, Math.sin(p * TAU / 5) * 13, 11, 11, '#FFF6B0', '#FFD84A', '#E0A820'); ball(ctx, 0, 0, 8, 8, '#FFB060', '#F08A30', '#C06010'); }
    ctx.restore(); });
  ball(ctx, 0, 0, 84, 74, LAP.hi, LAP.mid, LAP.lo);
  ctx.globalAlpha = 0.6; ell(ctx, -52, 22, 15, 10, '#F7A0B4'); ell(ctx, 52, 22, 15, 10, '#F7A0B4'); ctx.globalAlpha = 1;
  eye(ctx, -32, -10, 13, 17, { lx: lookX, ly: lookY, blink, happy, wide, skin: LAP.mid });
  eye(ctx, 32, -10, 13, 17, { lx: lookX, ly: lookY, blink, happy, wide, skin: LAP.mid });
  [-1, 1].forEach((k) => { ctx.beginPath(); ctx.moveTo(k * 22, -36 - wide * 6); ctx.quadraticCurveTo(k * 34, -43 - wide * 8, k * 46, -36 - wide * 4); stroke(ctx, '#C9AFAF', 4); });
  ball(ctx, 0, 16, 10, 8, '#FFB8C8', '#F27F9E', '#C85070');
  // whiskers
  [-1, 1].forEach((k) => [[-6, 0], [4, 1]].forEach(([dy, j]) => { ctx.beginPath(); ctx.moveTo(k * 20, 24 + dy); ctx.lineTo(k * (62 + j * 6), 18 + dy * 2 + j * 8); stroke(ctx, 'rgba(160,140,140,0.6)', 2); }));
  if (talk > 0.08) { ell(ctx, 0, 36 + 3 * talk, 10 + 3 * talk, 3 + 10 * talk, '#7A2A38'); ell(ctx, 0, 31, 7, 5, '#FFFFFF'); }
  else { ctx.beginPath(); ctx.moveTo(-14, 32 - mood * 2); ctx.quadraticCurveTo(0, 36 + mood * 9, 14, 32 - mood * 2); stroke(ctx, '#8A5A60', 4); ell(ctx, 0, 34 + mood * 2, 6, 4, '#FFFFFF'); }
  ctx.restore();
  ctx.restore();
}
const OUR = { hi: '#D9A06A', mid: '#A8693A', lo: '#6A3E1E', muz: '#F2D7B0' };
function bear(ctx, x, y, s, o) {
  const { dir = -1, air = 0, sq = 0, lean = 0, lookX = 0, lookY = 0, blink = 0, happy = 0, wide = 0, talk = 0, mood = 0.6, point = 0, hold = 0, t = 0, trail = 0, jig = 0 } = o;
  softShadow(ctx, x, y + 6, 125 * s * (1 - clamp(air / 300) * 0.4), 22 * s, 0.45 * (1 - clamp(air / 400) * 0.5));
  ctx.save(); ctx.translate(x, y - air); ctx.scale(dir * s * (1 + sq), s * (1 - sq)); ctx.rotate(lean);
  ball(ctx, -40, -16, 38, 19, OUR.hi, OUR.mid, OUR.lo); ball(ctx, 42, -16, 38, 19, OUR.hi, OUR.mid, OUR.lo);
  ell(ctx, -40, -12, 18, 9, 'rgba(242,215,176,0.8)'); ell(ctx, 42, -12, 18, 9, 'rgba(242,215,176,0.8)');
  ball(ctx, 0, -118, 88, 102, OUR.hi, OUR.mid, OUR.lo);
  // blue overalls with two yellow buttons
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, -118, 88, 102, 0, 0, TAU); ctx.clip();
  ctx.fillStyle = lgrad(ctx, 0, -140, 0, 0, [[0, '#6FB0F0'], [1, '#2E6AB8']]); ctx.fillRect(-100, -120, 200, 140);
  ctx.beginPath(); ctx.roundRect(-46, -170, 92, 70, 14); ctx.fill();
  ctx.restore();
  [[-34, -172], [34, -172]].forEach(([bx, by]) => { ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx * 1.6, by - 30); stroke(ctx, '#3A78C8', 14); ball(ctx, bx, by + 8, 8, 8, '#FFF3A0', '#F5C02A', '#B88010'); });
  ctx.beginPath(); ctx.roundRect(-20, -140, 40, 26, 6); stroke(ctx, 'rgba(255,255,255,0.35)', 3);
  { const th = lerp(2.2, -1.95, point) + 0.08 * Math.sin(t * 9) * point, sx = -66, sy = -168, hx = sx + Math.cos(th) * 76, hy = sy + Math.sin(th) * 76; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); stroke(ctx, OUR.mid, 30); ball(ctx, hx, hy, 18, 18, OUR.hi, OUR.mid, OUR.lo); }
  { const th = lerp(1.0, -0.15, hold) + 0.06 * Math.sin(t * 3), sx = 62, sy = -166, hx = sx + Math.cos(th) * 76, hy = sy + Math.sin(th) * 76; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); stroke(ctx, '#B87A48', 30); ball(ctx, hx, hy, 18, 18, OUR.hi, OUR.mid, OUR.lo); }
  ctx.save(); ctx.translate(0, -268); ctx.rotate(lookY * 0.08 + lean * 0.5 + jig * 0.12 + 0.04 * Math.sin(t * 1.5));
  [-1, 1].forEach((k) => { ball(ctx, k * 70, -58, 32, 30, OUR.hi, OUR.mid, OUR.lo); ball(ctx, k * 70, -55, 18, 16, '#F2C6A0', '#D89A70', '#A86A40'); });
  ball(ctx, 0, 0, 92, 80, OUR.hi, OUR.mid, OUR.lo);
  // little red beanie with a pompom that bounces late
  ctx.beginPath(); ctx.moveTo(-70, -42); ctx.quadraticCurveTo(0, -128, 70, -42); ctx.quadraticCurveTo(0, -60, -70, -42); ctx.fillStyle = lgrad(ctx, 0, -110, 0, -42, [[0, '#FF7A6A'], [1, '#D23A3A']]); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-72, -42); ctx.quadraticCurveTo(0, -62, 72, -42); stroke(ctx, '#FFFFFF', 12);
  { const px = 8 * Math.sin(t * 2.4 - 0.6) + 22 * jig + 10 * trail * Math.sin(t * 6), py = -104 - 4 * Math.abs(Math.sin(t * 2.4)); ctx.beginPath(); ctx.moveTo(0, -90); ctx.lineTo(px, py); stroke(ctx, '#D23A3A', 6); ball(ctx, px, py, 17, 17, '#FFFFFF', '#F2F2F6', '#C8CCD8'); }
  ball(ctx, 0, 30, 46, 34, '#FFF0D8', OUR.muz, '#D0A878');
  ctx.globalAlpha = 0.5; ell(ctx, -58, 22, 15, 10, '#F58C82'); ell(ctx, 58, 22, 15, 10, '#F58C82'); ctx.globalAlpha = 1;
  eye(ctx, -36, -14, 12.5, 16, { lx: lookX, ly: lookY, blink, happy, wide, skin: OUR.mid });
  eye(ctx, 36, -14, 12.5, 16, { lx: lookX, ly: lookY, blink, happy, wide, skin: OUR.mid });
  [-1, 1].forEach((k) => { ctx.beginPath(); ctx.moveTo(k * 24, -38 - wide * 6); ctx.quadraticCurveTo(k * 37, -46 - wide * 8, k * 50, -38 - wide * 4); stroke(ctx, '#5A3018', 5); });
  ball(ctx, 0, 16, 17, 12, '#6A4A44', '#2B1D1A', '#140C0A'); ell(ctx, -5, 11, 5, 3, 'rgba(255,255,255,0.7)');
  if (talk > 0.08) { ell(ctx, 0, 44 + 3 * talk, 11 + 3 * talk, 4 + 10 * talk, '#7A2A28'); if (talk > 0.3) ell(ctx, 0, 48 + 7 * talk, 7, 4 * talk, '#F08A8A'); }
  else { ctx.beginPath(); ctx.moveTo(0, 28); ctx.lineTo(0, 38); ctx.moveTo(-15, 40 - mood * 2); ctx.quadraticCurveTo(0, 46 + mood * 8, 15, 40 - mood * 2); stroke(ctx, '#3A2418', 4.5); }
  ctx.restore();
  ctx.restore();
}
// paires d'hôtes : [gauche (parle), droite] ; choisie par le champ "hosts" de l'épisode
const HOSTPAIRS = {
  'prune-tilou': { L: (c, x, y, s, o) => roo(c, x, y, s, o), R: koala, sL: [0.58, 0.95], sR: [0.56, 0.92] },
  'lulu-bouba': { L: (c, x, y, s, o) => bunny(c, x, y, s, { ...o, dir: 1, point: o.reach2 > 0.9 ? 1 : 0, hold: o.reach > 0.5 ? 0.8 : 0.2 }), R: bear, sL: [0.62, 1.0], sR: [0.56, 0.9] },
};
