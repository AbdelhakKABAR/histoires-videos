// ---------------------------------------------------------------- helpers
const sm = (p) => p * p * (3 - 2 * p);
function ell(ctx, x, y, rx, ry, col, rot = 0) { if (rx <= 0 || ry <= 0) return; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fillStyle = col; ctx.fill(); }
function box(ctx, x, y, w, h, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
function poly(ctx, pts, col) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); }
function limb(ctx, x, y, a, len, w, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); box(ctx, -w / 2, -w / 2, w, len + w / 2, w / 2, col); ctx.restore(); }

// Shots: [u0, x, y, zoom, x1, y1, zoom1]. Every entry is a cut; inside a shot the camera drifts from start to end.
function shot(u, list, endU) {
  let i = 0; while (i < list.length - 1 && u >= list[i + 1][0]) i++;
  const a = list[i], end = i < list.length - 1 ? list[i + 1][0] : endU;
  const p = prog(u, a[0], end), q = 0.5 * p + 0.5 * p * (2 - p);
  return { i, u0: a[0], p, x: lerp(a[1], a[4] ?? a[1], q) + 5 * noise1(u * 0.35, 11), y: lerp(a[2], a[5] ?? a[2], q) + 4 * noise1(u * 0.3, 12), z: lerp(a[3], a[6] ?? a[3], q) };
}
function cam(ctx, c, f, fn) {
  ctx.save(); ctx.translate(CX, 760); ctx.scale(c.z, c.z); ctx.translate(-(CX + (c.x - CX) * f), -(760 + (c.y - 760) * f)); fn(); ctx.restore();
}
function say(u, who) {
  for (const p of TL.phrases) if (p.who === who && u >= p.u0 - 0.05 && u <= p.u1 + 0.1) {
    const i = Math.round(M.TS(u) * 60), e = (TL.env[i - 1] || 0) * 0.25 + (TL.env[i] || 0) * 0.5 + (TL.env[i + 1] || 0) * 0.25;
    return clamp(e * 1.7);
  }
  return 0;
}
function walkTo(u, u0, u1, x0, x1, stride = 30) { const p = prog(u, u0, u1), x = lerp(x0, x1, sm(p)); return { x, p, walk: p > 0 && p < 1 ? x / stride : undefined }; }

// ---------------------------------------------------------------- the cast: one articulated rig, four animals
const SP = {
  miel: { kind: 'bear', fur: '#D9964F', dark: '#A8692F', belly: '#F6DDAE', ear: '#F2B98A', seed: 1, kid: 1 },
  mama: { kind: 'bear', fur: '#B8773C', dark: '#8A5425', belly: '#EFD0A0', ear: '#E0A070', seed: 2 },
  rosie: { kind: 'fox', fur: '#F58238', dark: '#5B3A30', belly: '#FFF6EA', ear: '#FFD3C2', seed: 3, kid: 1 },
  papi: { kind: 'badger', fur: '#858B9C', dark: '#3A3F4E', belly: '#F1EEE8', ear: '#C9CCD6', seed: 4 },
};
function critter(ctx, x, y, s, id, o = {}) {
  const sp = SP[id], kind = sp.kind;
  const { look = 0, lookY = 0, mood = 0.6, talk = 0, armL = 0.1, armR = 0.1, walk, stride = 1, droop = 0, sq = 0, tilt = 0, wag = 0, lean = 0, hold, brow = 0, tear = 0, squint = 0, blink, wide = 0, cane = 0 } = o;
  const ph = walk ?? 0, wk = walk === undefined ? 0 : stride;
  const bob = -Math.abs(Math.sin(ph)) * 13 * wk, sway = Math.sin(ph) * 0.05 * wk;
  const breath = Math.sin(NOW * 0.9 + sp.seed) * 0.014;
  ell(ctx, x, y + 6 * s, 98 * s, 20 * s, 'rgba(20,24,50,0.2)');
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 + sq), s * (1 - sq)); ctx.rotate(lean + sway);
  // tail
  if (kind === 'fox') { ctx.save(); ctx.translate(48, -92 + bob); ctx.rotate(0.95 + wag * 0.4 - droop * 0.5); ell(ctx, 0, -78, 38, 92, sp.fur); ell(ctx, 0, -140, 25, 36, sp.belly); ctx.restore(); }
  else ell(ctx, 66, -96 + bob, 22, 22, sp.dark);
  // legs: the lifted foot shortens its leg, the body bobs and sways (a waddling front-view walk)
  const lifts = [Math.max(0, Math.sin(ph)) * 28 * wk, Math.max(0, -Math.sin(ph)) * 28 * wk];
  [-1, 1].forEach((sg, i) => { limb(ctx, sg * 38, -86 + bob, 0, 72 - lifts[i] - bob, 48, sp.dark); ell(ctx, sg * 43, -8 - lifts[i], 38, 20, sp.dark); ell(ctx, sg * 43, -4 - lifts[i], 24, 10, sp.ear); });
  ctx.translate(0, bob);
  ell(ctx, 0, -165, 88 * (1 + breath), 102 * (1 + breath), sp.fur); ell(ctx, 0, -150, 60, 72, sp.belly);
  if (id === 'mama') { box(ctx, -58, -222, 116, 150, 34, '#F8C9C4'); box(ctx, -22, -160, 44, 40, 10, '#F29A9A'); }
  if (hold) hold(ctx);
  const sw = Math.sin(ph) * 0.22 * wk, aL = armL * 2.7 + sw, aR = armR * 2.7 - sw;
  if (cane) { const hx = 74 + Math.sin(aR) * 92, hy = -222 + Math.cos(aR) * 92; ctx.strokeStyle = '#7A4E2A'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx, hy - 34); ctx.lineTo(hx + 12, -bob); ctx.stroke(); ctx.beginPath(); ctx.arc(hx - 14, hy - 34, 14, PI, 0); ctx.stroke(); }
  limb(ctx, -74, -222, aL, 90, 42, sp.fur); ell(ctx, -74 - Math.sin(aL) * 92, -222 + Math.cos(aL) * 92, 24, 24, sp.dark);
  limb(ctx, 74, -222, -aR, 90, 42, sp.fur); ell(ctx, 74 + Math.sin(aR) * 92, -222 + Math.cos(aR) * 92, 24, 24, sp.dark);
  if (id === 'miel') { box(ctx, -66, -262, 132, 38, 19, C.accent); ctx.save(); ctx.translate(40, -240); ctx.rotate(-0.15 + 0.12 * Math.sin(NOW * 1.3) - sway * 3); box(ctx, -17, 0, 34, 78, 14, C.redD); ctx.restore(); }
  // head
  ctx.save(); ctx.translate(look * 12, -308 + lookY * 5); ctx.rotate(tilt + look * 0.03);
  if (kind === 'bear') [-1, 1].forEach((sg) => { ell(ctx, sg * 72, -70, 37, 37, sp.fur); ell(ctx, sg * 72, -70, 20, 20, sp.ear); });
  if (kind === 'badger') [-1, 1].forEach((sg) => { ell(ctx, sg * 70, -68, 25, 25, sp.dark); ell(ctx, sg * 70, -68, 11, 11, sp.ear); });
  if (kind === 'fox') [-1, 1].forEach((sg) => { ctx.save(); ctx.translate(sg * 54, -58); ctx.rotate(sg * (0.16 + droop * 1.3)); poly(ctx, [[-34, 14], [34, 14], [0, -112]], sp.fur); poly(ctx, [[-17, 8], [17, 8], [0, -74]], sp.ear); poly(ctx, [[-10, -78], [10, -78], [0, -112]], sp.dark); ctx.restore(); });
  ell(ctx, 0, 0, 100, 92, kind === 'badger' ? sp.belly : sp.fur);
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 100, 92, 0, 0, TAU); ctx.clip();
  if (kind === 'fox') { ell(ctx, -58 + look * 8, 56, 60, 48, sp.belly); ell(ctx, 58 + look * 8, 56, 60, 48, sp.belly); }
  if (kind === 'badger') [-1, 1].forEach((sg) => box(ctx, sg * 38 - 23 + look * 12, -110, 46, 132, 23, sp.dark));
  ctx.restore();
  const mx = look * 20, my = lookY * 6;
  if (sp.kid) { ctx.globalAlpha = 0.55; ell(ctx, -62 + mx * 0.6, 28, 16, 11, '#F7837A'); ell(ctx, 62 + mx * 0.6, 28, 16, 11, '#F7837A'); ctx.globalAlpha = 1; }
  ell(ctx, mx, 36 + my, kind === 'fox' ? 36 : 46, kind === 'fox' ? 29 : 34, kind === 'badger' ? '#FFFFFF' : sp.belly);
  ell(ctx, mx * 1.15, 15 + my, 16, 12, '#3A2622'); ell(ctx, mx * 1.15 - 5, 11 + my, 5, 3, 'rgba(255,255,255,0.5)');
  // mouth: open with the voice, otherwise a smile or a frown
  const mY = 42 + my;
  if (talk > 0.07) { ell(ctx, mx, mY + 4, 13 + 5 * talk, 4 + 15 * talk, '#7A2A28'); if (talk > 0.35) ell(ctx, mx, mY + 4 + 9 * talk, 8, 5 * talk, '#F08A8A'); }
  else { ctx.strokeStyle = '#3A2622'; ctx.lineWidth = 5.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx - 17, mY - mood * 3); ctx.quadraticCurveTo(mx, mY + mood * 17, mx + 17, mY - mood * 3); ctx.stroke(); }
  // eyes
  const bt = (NOW * 0.625 + sp.seed * 1.7) % 3.4, bl = blink ?? (bt < 0.13 ? 1 : 0);
  [-1, 1].forEach((sg) => {
    const ex = sg * 38 + look * 13, ey = -14 + lookY * 7;
    if (squint > 0.5 || bl) { ctx.strokeStyle = '#2A1C18'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); if (squint > 0.5) ctx.arc(ex, ey + 6, 13, PI * 1.1, PI * 1.9); else { ctx.moveTo(ex - 12, ey); ctx.lineTo(ex + 12, ey); } ctx.stroke(); }
    else { if (kind === 'badger') ell(ctx, ex, ey, 17, 18, '#FFFFFF'); ell(ctx, ex, ey, 13 * (1 + wide * 0.2), 14.5 * (1 + wide * 0.35), '#2A1C18'); ell(ctx, ex - 4, ey - 5, 5, 5, '#FFFFFF'); ell(ctx, ex + 4, ey + 5, 2.4, 2.4, '#FFFFFF'); }
    if (Math.abs(brow) > 0.1) { ctx.strokeStyle = kind === 'badger' ? '#FFFFFF' : sp.dark; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ex - sg * 16, -44 - brow * 11 + lookY * 7); ctx.lineTo(ex + sg * 16, -44 + brow * 9 + lookY * 7); ctx.stroke(); }
    if (id === 'papi') { ctx.strokeStyle = '#E8B84A'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(ex, ey, 25, 0, TAU); ctx.stroke(); }
  });
  if (id === 'papi') { ctx.strokeStyle = '#E8B84A'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-13 + look * 13, -14); ctx.lineTo(13 + look * 13, -14); ctx.stroke(); }
  if (tear > 0) { const ty = 8 + tear * 46; ctx.globalAlpha = clamp(2 - tear * 2); ell(ctx, -38 + look * 13, ty, 7, 10, '#8FD3FF'); ctx.globalAlpha = 1; }
  if (id === 'rosie') { poly(ctx, [[38, -84], [8, -104], [12, -62]], C.pink); poly(ctx, [[38, -84], [68, -106], [66, -62]], C.pink); ell(ctx, 38, -84, 10, 10, '#F27D92'); }
  if (id === 'mama') { for (let i = 0; i < 5; i++) ell(ctx, -70 + 13 * Math.cos(i * TAU / 5), -98 + 13 * Math.sin(i * TAU / 5), 9, 9, '#FFFFFF'); ell(ctx, -70, -98, 7, 7, C.lamp); }
  ctx.restore();
  ctx.restore();
}

// The red toy truck, side view; origin on the ground under its middle.
function truck(ctx, x, y, s, o = {}) {
  const { roll = 0, dir = 1, load, tilt = 0, shadow = 1, loadK = 1 } = o;
  if (shadow) ell(ctx, x, y + 4 * s, 120 * s, 14 * s, 'rgba(20,24,50,0.2)');
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.rotate(tilt);
  if (load === 'pebbles') [[-84, 0, 20], [-52, -6, 23], [-18, -2, 21], [8, 2, 17], [-68, -22, 17], [-34, -26, 19], [-6, -18, 14]].forEach(([dx, dy, r], i) => ell(ctx, dx, -116 + dy + (1 - loadK) * 40, r * loadK, r * 0.86 * loadK, i % 2 ? '#9BA3B5' : '#7F8799'));
  if (load === 'flowers') [[-86, '#F27D92'], [-60, '#FFD95A'], [-34, '#FFFFFF'], [-8, '#B58CF0'], [10, '#F27D92']].forEach(([dx, col], i) => { const sw = 6 * Math.sin(NOW * 1.4 + i), h = (48 + 16 * (i % 2)) * loadK; ctx.strokeStyle = '#3F9A4A'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(dx, -104); ctx.lineTo(dx + sw, -104 - h); ctx.stroke(); for (let k = 0; k < 5; k++) ell(ctx, dx + sw + 11 * Math.cos(k * TAU / 5), -104 - h + 11 * Math.sin(k * TAU / 5), 8.5 * loadK, 8.5 * loadK, col); ell(ctx, dx + sw, -104 - h, 6.5 * loadK, 6.5 * loadK, '#F5A623'); });
  box(ctx, -112, -52, 224, 26, 10, C.redD);
  poly(ctx, [[-122, -112], [32, -112], [26, -52], [-108, -52]], C.red); box(ctx, -126, -120, 162, 16, 8, '#FF6A4D'); box(ctx, -96, -92, 104, 10, 5, '#FFFFFF');
  box(ctx, 38, -124, 72, 80, 16, C.red); box(ctx, 54, -112, 44, 32, 9, '#BFE8FA'); box(ctx, 96, -66, 18, 14, 6, C.lamp);
  [-64, 64].forEach((wx) => { ell(ctx, wx, -24, 27, 27, '#2B2B3A'); ell(ctx, wx, -24, 12, 12, C.lamp); ctx.save(); ctx.translate(wx, -24); ctx.rotate(roll); box(ctx, -20, -3, 40, 6, 3, '#55566A'); box(ctx, -3, -20, 6, 40, 3, '#55566A'); ctx.restore(); ell(ctx, wx, -24, 6, 6, C.lamp); });
  ctx.restore();
}
function butterfly(ctx, x, y, s, t, col) {
  const f = Math.abs(Math.sin(t * 7)) * 0.85 + 0.15;
  ctx.save(); ctx.translate(x, y); ctx.rotate(0.3 * Math.sin(t * 1.3));
  [-1, 1].forEach((sg) => { ell(ctx, sg * 13 * s * f, -6 * s, 14 * s * f, 17 * s, col); ell(ctx, sg * 10 * s * f, 12 * s, 10 * s * f, 11 * s, col); });
  ell(ctx, 0, 0, 3.5 * s, 16 * s, '#3A2622'); ctx.restore();
}
function sparkles(ctx, x, y, r, u, k, n = 5, seed = 0) {
  for (let i = 0; i < n; i++) { const a = i * TAU / n + seed, tw = 0.55 + 0.45 * Math.sin(u * 3 + i * 2.1); sparkle(ctx, x + Math.cos(a) * r * (0.9 + 0.2 * hash01(i, 5)), y + Math.sin(a) * r * 0.7, 26 * k * tw, i % 2 ? C.lamp : '#FFFFFF'); }
}
function iconBub(ctx, x, y, r, k, fn, dir = 1) {
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ell(ctx, -dir * r * 0.62, r * 1.0, r * 0.2, r * 0.2, '#FFFFFF'); ell(ctx, -dir * r * 0.95, r * 1.36, r * 0.11, r * 0.11, '#FFFFFF');
  ell(ctx, 4, 6, r, r, 'rgba(20,24,50,0.15)'); ell(ctx, 0, 0, r, r, '#FFFFFF'); fn(r); ctx.restore();
}

// ---------------------------------------------------------------- set 1: the playroom
const DOOR = 165;
function room(ctx, u, c, o, actors) {
  const dim = o.dim || 0, dk = o.door || 0;
  fill(ctx, C.wall);
  cam(ctx, c, 1, () => {
    ctx.fillStyle = C.wall2; for (let x = -1500; x < 2700; x += 124) ctx.fillRect(x, -900, 58, 2000);
    ctx.fillStyle = '#EFC98F'; ctx.fillRect(-1600, 930, 4400, 180); ctx.fillStyle = '#E2B273'; ctx.fillRect(-1600, 922, 4400, 16);
    // window on the garden
    box(ctx, 628, 352, 344, 416, 22, '#A8703F'); box(ctx, 646, 370, 308, 380, 10, '#A6DCF7');
    ctx.save(); ctx.beginPath(); ctx.rect(646, 370, 308, 380); ctx.clip();
    ell(ctx, 880, 440, 34, 34, C.lamp); ell(ctx, 720, 800, 240, 130, '#9ADB86'); ell(ctx, 930, 790, 190, 110, '#7CC96C');
    box(ctx, 690 + ((u * 5) % 380) - 80, 430, 110, 30, 15, '#FFFFFF');
    if (o.win) o.win(ctx);
    ctx.restore();
    box(ctx, 792, 370, 16, 380, 0, '#A8703F'); box(ctx, 646, 548, 308, 14, 0, '#A8703F'); box(ctx, 610, 756, 380, 26, 10, '#8E5B30');
    [-1, 1].forEach((sg) => { const cw = 8 * Math.sin(u * 0.8 + sg); poly(ctx, [[800 + sg * 172, 340], [800 + sg * 100, 340], [800 + sg * (118 + cw), 560], [800 + sg * (150 + cw), 770], [800 + sg * 186, 770]], '#F2836B'); });
    box(ctx, 600, 322, 400, 24, 12, '#8E5B30');
    // door
    box(ctx, 38, 566, 254, 544, 14, '#8E5B30');
    if (dk > 0.02) { box(ctx, 52, 580, 226, 530, 4, '#BDE6F8'); ell(ctx, 165, 1130, 200, 130, C.grass); }
    const dw = 226 * (1 - 0.8 * dk); box(ctx, 52, 580, dw, 530, 4, '#C7854A'); box(ctx, 52 + dw * 0.14, 620, dw * 0.72, 190, 8, '#B5733B'); box(ctx, 52 + dw * 0.14, 850, dw * 0.72, 200, 8, '#B5733B'); ell(ctx, 52 + dw * 0.86, 850, 12, 12, C.lamp);
    // shelf, toys, clock, picture
    box(ctx, 340, 470, 250, 20, 8, '#8E5B30');
    box(ctx, 356, 414, 56, 56, 8, '#6FB6E8'); box(ctx, 372, 362, 52, 52, 8, C.lamp); box(ctx, 420, 418, 52, 52, 8, '#8FD694'); ell(ctx, 520, 436, 34, 34, '#F27D92'); ell(ctx, 508, 424, 10, 10, 'rgba(255,255,255,0.6)');
    const sw = Math.sin(u * PI) * 0.42; ctx.save(); ctx.translate(465, 262); ctx.rotate(sw); box(ctx, -4, 0, 8, 96, 4, '#8E5B30'); ell(ctx, 0, 100, 17, 17, C.lamp); ctx.restore();
    ell(ctx, 465, 210, 68, 68, '#8E5B30'); ell(ctx, 465, 210, 56, 56, '#FFF8EA');
    for (let i = 0; i < 12; i++) ell(ctx, 465 + 46 * Math.cos(i * TAU / 12), 210 + 46 * Math.sin(i * TAU / 12), 3.5, 3.5, '#8E5B30');
    ctx.save(); ctx.translate(465, 210); ctx.rotate(u * 0.05 + 1); box(ctx, -4, -40, 8, 44, 4, C.ink); ctx.rotate(u * 0.6); box(ctx, -3, -30, 6, 34, 3, C.accent); ctx.restore(); ell(ctx, 465, 210, 6, 6, C.ink);
    box(ctx, 1060, 300, 180, 150, 10, '#8E5B30'); box(ctx, 1074, 314, 152, 122, 4, '#FFE9B8'); ell(ctx, 1150, 384, 34, 30, C.accent); ell(ctx, 1150, 420, 60, 18, '#8FD694');
    box(ctx, -420, 380, 300, 200, 10, '#8E5B30'); box(ctx, -406, 394, 272, 172, 4, '#CFEBD2');
    // floor, rug
    ctx.fillStyle = C.wood; ctx.fillRect(-1600, G - 10, 4400, 1500); ctx.fillStyle = C.woodD; ctx.fillRect(-1600, G - 10, 4400, 10);
    ctx.strokeStyle = 'rgba(120,70,30,0.25)'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 1; i < 9; i++) { ctx.moveTo(-1600, G - 10 + i * i * 9); ctx.lineTo(2800, G - 10 + i * i * 9); } ctx.stroke();
    ell(ctx, 560, G + 70, 470, 92, '#E86F5A'); ell(ctx, 560, G + 70, 400, 70, '#F6B26B'); ell(ctx, 560, G + 70, 300, 46, '#FCE2A6');
    // sunbeam
    ctx.fillStyle = `rgba(255,236,170,${0.24 * (1 - dim)})`; ctx.beginPath(); ctx.moveTo(646, 750); ctx.lineTo(954, 750); ctx.lineTo(820, G + 170); ctx.lineTo(330, G + 170); ctx.closePath(); ctx.fill();
    actors();
    for (let i = 0; i < 16; i++) { const t = (hash01(i, 3) + u * 0.012 * (1 + hash01(i, 4))) % 1; ell(ctx, 420 + 420 * hash01(i, 5) + 30 * Math.sin(u * 0.4 + i), 740 + t * 420, 3.5, 3.5, `rgba(255,250,220,${0.7 * Math.sin(t * PI) * (1 - dim)})`); }
  });
  if (dim) { ctx.fillStyle = `rgba(52,62,110,${dim * 0.42})`; ctx.fillRect(0, 0, W, H); }
}

// ---------------------------------------------------------------- set 2: the garden
function hill(ctx, base, amp, lam, seed, col) {
  ctx.beginPath(); ctx.moveTo(-1700, 2600);
  for (let x = -1700; x <= 2900; x += 40) ctx.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(x / lam + seed)) - amp * 0.3 * Math.sin(x / lam * 2.3 + seed * 3));
  ctx.lineTo(2900, 2600); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
function garden(ctx, u, c, o, actors) {
  const w = o.warm || 0, dk = o.door || 0;
  const g = ctx.createLinearGradient(0, 0, 0, 1300); g.addColorStop(0, mix('#5DB9EE', '#F0885A', w * 0.75)); g.addColorStop(1, mix('#DFF4FC', '#FFE3A6', w));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  cam(ctx, c, 0.12, () => {
    const sx = 800, sy = lerp(330, 560, w);
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(u * 0.04); ctx.fillStyle = mix('#FFE680', '#FFB36B', w); for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(-16, -112); ctx.lineTo(16, -112); ctx.lineTo(0, -168 - 10 * Math.sin(u * 1.2 + i)); ctx.fill(); } ctx.restore();
    ell(ctx, sx, sy, 98, 98, mix(C.lamp, '#FF9A4D', w));
  });
  cam(ctx, c, 0.25, () => { for (let i = 0; i < 7; i++) { const x = ((hash01(i, 21) * 2800 + u * 5 * (1 + hash01(i, 22))) % 2800) - 900, y = 180 + 380 * hash01(i, 23), s = 0.8 + 0.7 * hash01(i, 24); ctx.fillStyle = mix('#FFFFFF', '#FFD9C2', w); ctx.beginPath(); ctx.roundRect(x, y, 250 * s, 56 * s, 28 * s); ctx.roundRect(x + 50 * s, y - 38 * s, 120 * s, 60 * s, 30 * s); ctx.fill(); } });
  cam(ctx, c, 0.45, () => hill(ctx, 960, 200, 420, 1, mix('#B4E3A6', '#E7C98A', w * 0.6)));
  cam(ctx, c, 0.7, () => {
    hill(ctx, 1040, 130, 300, 4, mix('#98D886', '#C9BE74', w * 0.6));
    for (let i = 0; i < 9; i++) { const x = -1100 + i * 420 + 200 * hash01(i, 31), y = 1000 - 60 * hash01(i, 32); box(ctx, x - 9, y - 40, 18, 90, 6, '#8E5B30'); ell(ctx, x, y - 80, 62, 76, mix('#5FB257', '#9A9A4A', w * 0.5)); }
  });
  cam(ctx, c, 1, () => {
    ctx.fillStyle = C.grass; ctx.fillRect(-1800, G - 22, 4800, 1700); ctx.fillStyle = '#9ADB86'; ctx.fillRect(-1800, G - 22, 4800, 12);
    ell(ctx, 220, G + 60, 250, 70, '#F1DDB0');
    // house
    for (let i = 0; i < 4; i++) { const t = (u * 0.06 + i / 4) % 1; ctx.globalAlpha = 0.6 * (1 - t); ell(ctx, 330 + 50 * t + 14 * Math.sin(u * 0.5 + i * 2), 380 - 220 * t, 22 + 34 * t, 22 + 34 * t, '#FFFFFF'); ctx.globalAlpha = 1; }
    box(ctx, 300, 390, 62, 150, 6, '#C96A4A');
    box(ctx, -170, 600, 620, 500, 8, '#FCEBCD'); box(ctx, -170, 1050, 620, 50, 0, '#E9CFA4');
    poly(ctx, [[-228, 622], [140, 372], [508, 622]], '#DD5A3C'); poly(ctx, [[-228, 622], [508, 622], [490, 650], [-210, 650]], '#B9442A');
    ell(ctx, 140, 520, 38, 38, '#FFF2C9'); ell(ctx, 140, 520, 26, 26, '#BFE8FA');
    box(ctx, 52, 792, 196, 318, 14, '#8E5B30'); box(ctx, 66, 806, 168, 304, 6, '#5B3A29');
    const dw = 168 * (1 - 0.8 * dk); box(ctx, 66, 806, dw, 304, 6, '#C7854A'); ell(ctx, 66 + dw * 0.84, 968, 10, 10, C.lamp); if (o.inDoor) o.inDoor(ctx);
    box(ctx, 240, 672, 164, 184, 12, '#8E5B30'); box(ctx, 254, 686, 136, 156, 6, '#FFEFB5');
    if (o.winFace) { ctx.save(); ctx.beginPath(); ctx.rect(254, 686, 136, 156); ctx.clip(); o.winFace(ctx); ctx.restore(); }
    box(ctx, 318, 686, 8, 156, 0, '#8E5B30'); box(ctx, 254, 760, 136, 8, 0, '#8E5B30'); box(ctx, 232, 846, 180, 34, 8, '#B9442A');
    ['#F27D92', '#FFD95A', '#FFFFFF', '#F27D92'].forEach((col, i) => ell(ctx, 256 + i * 44, 842 + 3 * Math.sin(u + i), 15, 15, col));
    // apple tree
    const ts = Math.sin(u * 0.5) * 9; box(ctx, 1010, 720, 70, 390, 20, '#8E5B30');
    [[1045, 560, 200], [920, 640, 130], [1170, 650, 140], [1050, 430, 150]].forEach(([x, y, r], i) => ell(ctx, x + ts * (0.6 + 0.2 * i), y, r, r * 0.92, i % 2 ? mix('#5FB257', '#A9A04A', w * 0.4) : mix('#4FA64C', '#9A9440', w * 0.4)));
    [[960, 560], [1120, 500], [1060, 660], [1190, 640], [930, 670]].forEach(([x, y]) => ell(ctx, x + ts, y, 15, 15, C.accent));
    // flowers
    for (let i = 0; i < 18; i++) { const x = -500 + i * 125 + 70 * hash01(i, 41), y = G + 30 + 150 * hash01(i, 42), sw = 7 * Math.sin(u * 1.1 + i), col = ['#F27D92', '#FFFFFF', '#FFD95A', '#B58CF0'][i % 4]; ctx.strokeStyle = '#3F9A4A'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw, y - 40); ctx.stroke(); for (let k = 0; k < 5; k++) ell(ctx, x + sw + 10 * Math.cos(k * TAU / 5), y - 40 + 10 * Math.sin(k * TAU / 5), 8, 8, col); ell(ctx, x + sw, y - 40, 6, 6, '#F5A623'); }
    for (let i = 0; i < 40; i++) { const x = -900 + i * 70 + 40 * hash01(i, 51), y = G - 8 + 200 * hash01(i, 52), sw = 5 * Math.sin(u * 1.4 + i); poly(ctx, [[x - 9, y], [x + 9, y], [x + sw, y - 34]], C.grassD); }
    actors();
    const n = o.bfly ?? 3;
    for (let i = 0; i < n; i++) { const bx = (o.bx ?? 620) + 260 * Math.sin(u * 0.33 + i * 2.1) + 60 * Math.sin(u * 0.9 + i), by = (o.by ?? 620) + 120 * Math.sin(u * 0.47 + i * 1.3) + 30 * Math.sin(u * 1.7 + i); butterfly(ctx, bx, by, 1.15, u + i * 3, ['#FFD95A', '#F27D92', '#FFFFFF', '#B58CF0'][i % 4]); }
    for (let i = 0; i < 6; i++) { const t = (hash01(i, 61) + u * 0.022 * (1 + hash01(i, 62))) % 1; ctx.save(); ctx.translate(820 + 420 * hash01(i, 63) - 260 * t + 40 * Math.sin(u * 0.8 + i), 640 + 460 * t); ctx.rotate(u * 0.9 + i); ell(ctx, 0, 0, 13, 7, i % 2 ? '#F5A623' : '#8FD06A'); ctx.restore(); }
  });
  if (w) { ctx.fillStyle = `rgba(255,150,70,${0.13 * w})`; ctx.fillRect(0, 0, W, H); }
}
