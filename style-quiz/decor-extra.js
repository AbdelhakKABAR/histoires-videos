
// ---------------------------------------------------------------- décors (champ "decor" de l'épisode) : "colline" (défaut) ou "neige"
const DECOR = TL.data.decor || 'colline';
function buildSnowBG() {
  buildLayers();   // nuages et grain
  { const [cv, c] = mk(W, H); c.fillStyle = lgrad(c, 0, 0, 0, H, [[0, '#7FB6E8'], [0.35, '#B9DCF4'], [0.6, '#F6E4EC'], [1, '#FFE9D6']]); c.fillRect(0, 0, W, H);
    c.fillStyle = rgrad(c, 880, 300, 800, [[0, 'rgba(255,250,235,0.9)'], [0.15, 'rgba(255,240,210,0.45)'], [1, 'rgba(255,230,200,0)']]); c.fillRect(0, 0, W, H);
    ball(c, 880, 300, 58, 58, '#FFFFFF', '#FFF8E6', '#FFE6B0'); BG.sky = cv; }
  { const [cv, c] = mk(W, H); const r = mulberry32(77);
    // far snowy mountains, bluish (aerial perspective), softly blurred
    const [fm, f] = mk(W, H);
    [[1010, '#B4C8E6', '#8EA6CC', 340], [1060, '#C6D6EE', '#9CB2D6', 260]].forEach(([base, hi, lo, amp], k) => {
      f.beginPath(); f.moveTo(-50, H); for (let x = -50; x <= W + 50; x += 30) f.lineTo(x, base - amp * (0.55 + 0.45 * Math.abs(Math.sin((x + k * 230) / 260))) + 30 * noise1(x / 90, 5 + k)); f.lineTo(W + 50, H); f.closePath();
      f.fillStyle = lgrad(f, 0, base - amp, 0, base + 100, [[0, '#FFFFFF'], [0.35, hi], [1, lo]]); f.fill(); });
    c.filter = 'blur(4px)'; c.drawImage(fm, 0, 0); c.filter = 'none';
    // snowy pines in the middle distance
    const pine = (x, base, h, s) => { c.fillStyle = lgrad(c, x - 10, 0, x + 10, 0, [[0, '#6A4A34'], [1, '#3E2A20']]); c.fillRect(x - 8 * s, base - 30 * s, 16 * s, 30 * s);
      for (let k = 0; k < 4; k++) { const y0 = base - 30 * s - k * h * 0.22, w = (1 - k * 0.2) * h * 0.42; c.beginPath(); c.moveTo(x - w, y0); c.lineTo(x, y0 - h * 0.36); c.lineTo(x + w, y0); c.closePath(); c.fillStyle = lgrad(c, x - w, 0, x + w, 0, [[0, '#3E7A5E'], [1, '#24523E']]); c.fill();
        c.beginPath(); c.moveTo(x - w * 0.95, y0 - 2); c.quadraticCurveTo(x - w * 0.3, y0 - h * 0.12, x, y0 - h * 0.34); c.quadraticCurveTo(x + w * 0.3, y0 - h * 0.1, x + w * 0.9, y0 - 4); c.quadraticCurveTo(x, y0 - h * 0.06, x - w * 0.95, y0 - 2); c.fillStyle = 'rgba(255,255,255,0.92)'; c.fill(); } };
    const [pm, p] = mk(W, H); const save = c; 
    [[60, 1250, 210, 1], [190, 1270, 160, 0.8], [960, 1255, 230, 1.05], [1060, 1275, 170, 0.85]].forEach(([x, b, h, s]) => pine(x, b, h, s));
    // igloo on the left
    { const ix = 120, ib = 1300; c.beginPath(); c.ellipse(ix, ib, 150, 120, 0, PI, TAU); c.closePath(); c.fillStyle = lgrad(c, ix - 150, ib - 120, ix + 150, ib, [[0, '#FFFFFF'], [0.6, '#E2EEF8'], [1, '#B8CCE2']]); c.fill();
      for (let row = 1; row < 4; row++) { const yy = ib - row * 30, hw = 150 * Math.sqrt(1 - (row * 30 / 120) ** 2); c.beginPath(); c.moveTo(ix - hw, yy); c.lineTo(ix + hw, yy); stroke(c, 'rgba(140,170,200,0.5)', 3); for (let k = -3; k <= 3; k++) { const bx = ix + k * 44 + (row % 2) * 22; if (Math.abs(bx - ix) < hw - 10) { c.beginPath(); c.moveTo(bx, yy); c.lineTo(bx, yy + 30); stroke(c, 'rgba(140,170,200,0.4)', 3); } } }
      c.beginPath(); c.ellipse(ix + 70, ib, 46, 54, 0, PI, TAU); c.closePath(); c.fillStyle = lgrad(c, 0, ib - 54, 0, ib, [[0, '#3A5A82'], [1, '#1E3050']]); c.fill(); }
    // snowy ground with soft blue shadows and sparkles
    c.beginPath(); c.moveTo(-50, H); for (let x = -50; x <= W + 50; x += 30) c.lineTo(x, 1300 + 18 * Math.sin(x / 180) + 8 * noise1(x / 60, 9)); c.lineTo(W + 50, H); c.closePath();
    c.fillStyle = lgrad(c, 0, 1280, 0, H, [[0, '#FFFFFF'], [0.3, '#EAF2FA'], [1, '#C4D6EA']]); c.fill();
    for (let i = 0; i < 22; i++) { const x = W * r(), y = 1340 + 520 * r(); ell(c, x, y, 70 + 90 * r(), 10 + 8 * r(), 'rgba(150,180,215,0.22)'); }
    for (let i = 0; i < 60; i++) { const x = W * r(), y = 1310 + 560 * r(); ell(c, x, y, 2.5, 2.5, 'rgba(255,255,255,0.95)'); }
    BG.land = cv; }
  { const [cv, c] = mk(W, H); c.fillStyle = lgrad(c, 0, 240, 0, 1300, [[0, 'rgba(255,250,255,0)'], [0.15, 'rgba(255,250,255,0.18)'], [0.85, 'rgba(255,250,255,0.18)'], [1, 'rgba(255,250,255,0)']]); c.fillRect(0, 240, W, 1060); BG.veil = cv; }
}
function snowfall(ctx, tr) {
  for (let i = 0; i < 70; i++) { const d = hash01(i, 601), sp = 40 + 70 * d, y = ((hash01(i, 602) * (H + 200) + tr * sp) % (H + 200)) - 100, x = hash01(i, 603) * (W + 100) - 50 + 30 * Math.sin(tr * (0.6 + d) + i), r = 3 + 6 * d;
    ctx.fillStyle = rgrad(ctx, x, y, r * 1.6, [[0, `rgba(255,255,255,${A(0.6 + 0.35 * d)})`], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, TAU); ctx.fill(); }
}

// ---------------------------------------------------------------- Mimi, la petite chatte (elle parle), et Pingo, le pingouin
const CHA = { hi: '#FFD9A8', mid: '#F2A55E', lo: '#B86A2E', cream: '#FFF4E6' };
function kitten(ctx, x, y, s, o) {
  const { dir = 1, air = 0, sq = 0, lean = 0, lookX = 0, lookY = 0, blink = 0, happy = 0, wide = 0, talk = 0, mood = 0.6, point = 0, hold = 0, t = 0, trail = 0, jig = 0 } = o;
  softShadow(ctx, x, y + 6, 110 * s * (1 - clamp(air / 300) * 0.4), 20 * s, 0.4 * (1 - clamp(air / 400) * 0.5));
  ctx.save(); ctx.translate(x, y - air); ctx.scale(dir * s * (1 + sq), s * (1 - sq)); ctx.rotate(lean);
  // tail with stripes, curling and swinging late
  { let px = -54, py = -60; ctx.beginPath(); ctx.moveTo(px, py); const pts = [[px, py]];
    for (let k = 1; k <= 7; k++) { const a = -2.4 + k * 0.32 + 0.35 * Math.sin(t * 2.6 - k * 0.6) + trail * 0.3 * Math.sin(k); px += Math.cos(a) * 20; py += Math.sin(a) * 20; ctx.lineTo(px, py); pts.push([px, py]); }
    stroke(ctx, CHA.mid, 22); pts.forEach(([qx, qy], k) => { if (k % 2) ell(ctx, qx, qy, 9, 6, 'rgba(184,106,46,0.75)'); }); ball(ctx, px, py, 12, 12, '#FFFFFF', '#FFF4E6', '#E8D0B8'); }
  ball(ctx, -32, -14, 34, 16, CHA.cream, '#F5E2CC', '#D8B898'); ball(ctx, 34, -14, 34, 16, CHA.cream, '#F5E2CC', '#D8B898');
  ball(ctx, 0, -98, 68, 82, CHA.hi, CHA.mid, CHA.lo);
  ctx.fillStyle = rgrad(ctx, 4, -86, 52, [[0, CHA.cream], [1, 'rgba(255,244,230,0)']]); ctx.beginPath(); ctx.ellipse(4, -86, 40, 54, 0, 0, TAU); ctx.fill();
  // pink scarf: a band and a tail that floats behind
  chain(ctx, -40, -150, 2.0 - 0.6 * trail, 5, 20, t, trail + 0.3, 22, '#F06A96', 0.4);
  ctx.beginPath(); ctx.moveTo(-58, -152); ctx.quadraticCurveTo(0, -126, 58, -152); stroke(ctx, '#F47CA2', 26);
  ctx.beginPath(); ctx.moveTo(-54, -160); ctx.quadraticCurveTo(0, -134, 54, -160); stroke(ctx, 'rgba(255,220,235,0.6)', 5);
  { const th = lerp(2.2, -1.95, point) + 0.08 * Math.sin(t * 9) * point, sx = -52, sy = -130, hx = sx + Math.cos(th) * 60, hy = sy + Math.sin(th) * 60; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); stroke(ctx, '#E8994E', 22); ball(ctx, hx, hy, 14, 14, CHA.cream, '#F5E2CC', '#D8B898'); }
  { const th = lerp(1.0, -0.15, hold) + 0.06 * Math.sin(t * 3), sx = 52, sy = -130, hx = sx + Math.cos(th) * 60, hy = sy + Math.sin(th) * 60; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); stroke(ctx, '#F2A862', 22); ball(ctx, hx, hy, 14, 14, CHA.cream, '#F5E2CC', '#D8B898'); }
  ctx.save(); ctx.translate(0, -222); ctx.rotate(lookY * 0.08 + lean * 0.5 + jig * 0.12 + 0.04 * Math.sin(t * 1.8));
  // pointed ears with pink inside, they twitch
  [-1, 1].forEach((k) => { const tw = 0.08 * bump((t + k * 0.7) % 3.1, 1.5, 0.2); ctx.save(); ctx.translate(k * 50, -48); ctx.rotate(k * (0.28 + tw)); ctx.beginPath(); ctx.moveTo(-30, 14); ctx.quadraticCurveTo(-6, -60, 4, -66); ctx.quadraticCurveTo(18, -40, 30, 14); ctx.closePath(); ctx.fillStyle = lgrad(ctx, 0, -66, 0, 14, [[0, CHA.mid], [1, CHA.lo]]); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-16, 8); ctx.quadraticCurveTo(-2, -40, 4, -46); ctx.quadraticCurveTo(12, -28, 18, 8); ctx.closePath(); ctx.fillStyle = '#F7A8BC'; ctx.fill(); ctx.restore(); });
  ball(ctx, 0, 0, 86, 72, CHA.hi, CHA.mid, CHA.lo);
  // tabby stripes on the forehead
  [-22, 0, 22].forEach((sx) => { ctx.beginPath(); ctx.moveTo(sx, -66); ctx.quadraticCurveTo(sx * 1.1, -50, sx * 0.9, -36); stroke(ctx, 'rgba(184,106,46,0.7)', 7); });
  ball(ctx, 0, 28, 44, 28, '#FFFFFF', CHA.cream, '#E8D0B8');
  ctx.globalAlpha = 0.55; ell(ctx, -54, 20, 14, 9, '#F58CA0'); ell(ctx, 54, 20, 14, 9, '#F58CA0'); ctx.globalAlpha = 1;
  eye(ctx, -32, -8, 14, 17, { lx: lookX, ly: lookY, blink, happy, wide, skin: CHA.mid });
  eye(ctx, 32, -8, 14, 17, { lx: lookX, ly: lookY, blink, happy, wide, skin: CHA.mid });
  ctx.beginPath(); ctx.moveTo(-8, 14); ctx.lineTo(8, 14); ctx.lineTo(0, 24); ctx.closePath(); ctx.fillStyle = '#F27F9E'; ctx.fill();
  [-1, 1].forEach((k) => [[-4, -0.12], [6, 0.12]].forEach(([dy, a]) => { ctx.beginPath(); ctx.moveTo(k * 30, 26 + dy); ctx.lineTo(k * 80, 20 + dy + a * 60); stroke(ctx, 'rgba(120,80,60,0.55)', 2.2); }));
  if (talk > 0.08) { ell(ctx, 0, 38 + 3 * talk, 10 + 3 * talk, 3 + 10 * talk, '#7A2A38'); if (talk > 0.3) ell(ctx, 0, 42 + 6 * talk, 6, 3 * talk, '#F08A9A'); }
  else { ctx.beginPath(); ctx.moveTo(-14, 30); ctx.quadraticCurveTo(-7, 38 + mood * 4, 0, 30); ctx.quadraticCurveTo(7, 38 + mood * 4, 14, 30); stroke(ctx, '#7A4A3A', 3.5); }
  ctx.restore();
  ctx.restore();
}
const PNG = { hi: '#4A5A78', mid: '#283450', lo: '#141C30' };
function penguin(ctx, x, y, s, o) {
  const { dir = -1, air = 0, sq = 0, lean = 0, lookX = 0, lookY = 0, blink = 0, happy = 0, wide = 0, talk = 0, mood = 0.6, point = 0, hold = 0, t = 0, trail = 0, jig = 0 } = o;
  softShadow(ctx, x, y + 6, 115 * s * (1 - clamp(air / 300) * 0.4), 22 * s, 0.4 * (1 - clamp(air / 400) * 0.5));
  ctx.save(); ctx.translate(x, y - air); ctx.scale(dir * s * (1 + sq), s * (1 - sq)); ctx.rotate(lean + 0.04 * Math.sin(t * 3.2));   // a little waddle
  // orange feet
  [-30, 30].forEach((fx, i) => { ctx.save(); ctx.translate(fx, -10); ctx.rotate((i ? 0.15 : -0.15) + 0.1 * Math.sin(t * 3.2 + i * PI)); ball(ctx, 0, 0, 34, 14, '#FFC266', '#F59A2E', '#C06A10'); ctx.restore(); });
  // one big body (head included), dark back, white front
  ball(ctx, 0, -170, 104, 170, PNG.hi, PNG.mid, PNG.lo);
  ctx.fillStyle = rgrad(ctx, 0, -110, 120, [[0, '#FFFFFF'], [0.7, '#F2F6FA'], [1, '#D6E0EA']], -10, -150); ctx.beginPath(); ctx.ellipse(0, -112, 74, 108, 0, 0, TAU); ctx.fill();
  // flippers
  { const th = lerp(2.0, -1.7, point) + 0.12 * Math.sin(t * 9) * point; ctx.save(); ctx.translate(-92, -170); ctx.rotate(th - PI / 2); ball(ctx, 0, 52, 20, 58, PNG.hi, PNG.mid, PNG.lo); ctx.restore(); }
  { const th = lerp(1.2, -0.2, hold) + 0.1 * Math.sin(t * 3); ctx.save(); ctx.translate(92, -170); ctx.rotate(th - PI / 2); ball(ctx, 0, 52, 20, 58, PNG.hi, PNG.mid, PNG.lo); ctx.restore(); }
  // long striped scarf, its tail flies behind
  chain(ctx, -50, -220, 2.1 - 0.7 * trail, 6, 22, t, trail + 0.4, 24, '#3CB4E6', 1.1);
  ctx.beginPath(); ctx.moveTo(-74, -226); ctx.quadraticCurveTo(0, -196, 74, -226); stroke(ctx, '#46C0EE', 30);
  [-0.6, -0.2, 0.2, 0.6].forEach((p) => { const qx = p * 74, qy = -212 + 14 * (1 - p * p); ctx.beginPath(); ctx.moveTo(qx - 3, qy - 13); ctx.lineTo(qx + 3, qy + 13); stroke(ctx, '#FFFFFF', 8); });
  // face
  ctx.save(); ctx.translate(0, -282); ctx.rotate(lookY * 0.06 + jig * 0.1);
  ctx.fillStyle = rgrad(ctx, 0, 6, 70, [[0, '#FFFFFF'], [1, '#E6EEF6']]); ctx.beginPath(); ctx.moveTo(-62, 30); ctx.bezierCurveTo(-70, -40, -20, -40, 0, -14); ctx.bezierCurveTo(20, -40, 70, -40, 62, 30); ctx.quadraticCurveTo(0, 60, -62, 30); ctx.fill();
  ctx.globalAlpha = 0.55; ell(ctx, -46, 26, 13, 8, '#F58CA0'); ell(ctx, 46, 26, 13, 8, '#F58CA0'); ctx.globalAlpha = 1;
  eye(ctx, -28, 0, 12, 15, { lx: lookX, ly: lookY, blink, happy, wide, skin: '#FFFFFF' });
  eye(ctx, 28, 0, 12, 15, { lx: lookX, ly: lookY, blink, happy, wide, skin: '#FFFFFF' });
  // beak opens with the voice
  const op = talk * 12; ctx.beginPath(); ctx.moveTo(-18, 22); ctx.quadraticCurveTo(0, 14, 18, 22); ctx.lineTo(0, 38); ctx.closePath(); ctx.fillStyle = lgrad(ctx, 0, 14, 0, 38, [[0, '#FFC64D'], [1, '#F08A20']]); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-12, 30 + op * 0.3); ctx.lineTo(12, 30 + op * 0.3); ctx.lineTo(0, 40 + op); ctx.closePath(); ctx.fillStyle = '#E07A18'; ctx.fill();
  // a tuft of feathers on top that wobbles late
  [-1, 0, 1].forEach((k) => { const a = -PI / 2 + k * 0.4 + 0.25 * Math.sin(t * 3 - k) + jig * 0.8; ctx.beginPath(); ctx.moveTo(k * 6, -52); ctx.quadraticCurveTo(k * 6 + Math.cos(a - 0.3) * 14, -52 + Math.sin(a - 0.3) * 14, k * 6 + Math.cos(a) * 28, -52 + Math.sin(a) * 28); stroke(ctx, PNG.mid, 7); });
  ctx.restore();
  ctx.restore();
}
HOSTPAIRS['mimi-pingo'] = { L: (c, x, y, s, o) => kitten(c, x, y, s, { ...o, dir: 1, point: o.reach2 > 0.9 ? 1 : 0, hold: o.reach > 0.5 ? 0.8 : 0.2 }), R: penguin, sL: [0.62, 1.0], sR: [0.52, 0.86] };

// ---------------------------------------------------------------- Ruby, la petite renarde (elle parle), et Hop, le grenouillon
const RNR = { hi: '#FFB46A', mid: '#F07A2A', lo: '#A8461A', cream: '#FFF6EA' };
function fox(ctx, x, y, s, o) {
  const { dir = 1, air = 0, sq = 0, lean = 0, lookX = 0, lookY = 0, blink = 0, happy = 0, wide = 0, talk = 0, mood = 0.6, point = 0, hold = 0, t = 0, trail = 0, jig = 0 } = o;
  softShadow(ctx, x, y + 6, 115 * s * (1 - clamp(air / 300) * 0.4), 20 * s, 0.42 * (1 - clamp(air / 400) * 0.5));
  ctx.save(); ctx.translate(x, y - air); ctx.scale(dir * s * (1 + sq), s * (1 - sq)); ctx.rotate(lean);
  // big fluffy tail with a white tip: it swings late
  { const sw = 0.22 * Math.sin(t * 2.2 - 0.5) + 0.25 * trail * Math.sin(t * 7) + jig * 0.8;
    ctx.save(); ctx.translate(-50, -60); ctx.rotate(-0.9 + sw);
    ctx.beginPath(); ctx.moveTo(0, 14); ctx.bezierCurveTo(-30, -40, -20, -130, 20, -170); ctx.bezierCurveTo(60, -130, 52, -40, 22, 10); ctx.closePath();
    ctx.fillStyle = lgrad(ctx, -30, 0, 60, 0, [[0, RNR.lo], [0.5, RNR.mid], [1, RNR.hi]]); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, -128); ctx.bezierCurveTo(4, -150, 12, -164, 20, -170); ctx.bezierCurveTo(36, -156, 42, -140, 40, -126); ctx.quadraticCurveTo(22, -116, 4, -128); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore(); }
  ball(ctx, -30, -14, 32, 15, '#5A3A2A', '#3A2418', '#1E120C'); ball(ctx, 32, -14, 32, 15, '#5A3A2A', '#3A2418', '#1E120C');
  ball(ctx, 0, -96, 66, 80, RNR.hi, RNR.mid, RNR.lo);
  ctx.fillStyle = rgrad(ctx, 4, -90, 50, [[0, RNR.cream], [1, 'rgba(255,246,234,0)']]); ctx.beginPath(); ctx.ellipse(4, -92, 36, 52, 0, 0, TAU); ctx.fill();
  { const th = lerp(2.2, -1.95, point) + 0.08 * Math.sin(t * 9) * point, sx = -50, sy = -128, hx = sx + Math.cos(th) * 60, hy = sy + Math.sin(th) * 60; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); stroke(ctx, '#E8722A', 22); ball(ctx, hx, hy, 14, 14, '#5A3A2A', '#3A2418', '#1E120C'); }
  { const th = lerp(1.0, -0.15, hold) + 0.06 * Math.sin(t * 3), sx = 50, sy = -128, hx = sx + Math.cos(th) * 60, hy = sy + Math.sin(th) * 60; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); stroke(ctx, '#F4843A', 22); ball(ctx, hx, hy, 14, 14, '#5A3A2A', '#3A2418', '#1E120C'); }
  ctx.save(); ctx.translate(0, -214); ctx.rotate(lookY * 0.08 + lean * 0.5 + jig * 0.12 + 0.04 * Math.sin(t * 1.7));
  [-1, 1].forEach((k) => { const tw = 0.1 * bump((t + k * 0.9) % 3.4, 1.7, 0.2); ctx.save(); ctx.translate(k * 52, -44); ctx.rotate(k * (0.32 + tw)); ctx.beginPath(); ctx.moveTo(-32, 16); ctx.quadraticCurveTo(-8, -70, 2, -84); ctx.quadraticCurveTo(20, -50, 32, 16); ctx.closePath(); ctx.fillStyle = lgrad(ctx, 0, -84, 0, 16, [[0, '#3A2418'], [0.3, RNR.mid], [1, RNR.lo]]); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-17, 10); ctx.quadraticCurveTo(-4, -46, 2, -56); ctx.quadraticCurveTo(12, -34, 18, 10); ctx.closePath(); ctx.fillStyle = '#FFE6D2'; ctx.fill(); ctx.restore(); });
  ball(ctx, 0, 0, 84, 70, RNR.hi, RNR.mid, RNR.lo);
  // white cheeks and a pointed muzzle
  ctx.beginPath(); ctx.moveTo(-84, 10); ctx.quadraticCurveTo(-40, 0, 0, 16); ctx.quadraticCurveTo(40, 0, 84, 10); ctx.quadraticCurveTo(50, 66, 0, 70); ctx.quadraticCurveTo(-50, 66, -84, 10); ctx.fillStyle = rgrad(ctx, 0, 40, 90, [[0, '#FFFFFF'], [1, '#F2E6DA']]); ctx.fill();
  ctx.globalAlpha = 0.5; ell(ctx, -50, 28, 13, 8, '#F58CA0'); ell(ctx, 50, 28, 13, 8, '#F58CA0'); ctx.globalAlpha = 1;
  eye(ctx, -30, -10, 13, 16, { lx: lookX, ly: lookY, blink, happy, wide, skin: RNR.mid });
  eye(ctx, 30, -10, 13, 16, { lx: lookX, ly: lookY, blink, happy, wide, skin: RNR.mid });
  ball(ctx, 0, 24, 12, 9, '#5A3A3A', '#2B1D1A', '#140C0A'); ell(ctx, -4, 20, 4, 3, 'rgba(255,255,255,0.7)');
  if (talk > 0.08) { ell(ctx, 0, 44 + 3 * talk, 10 + 3 * talk, 3 + 10 * talk, '#7A2A38'); if (talk > 0.3) ell(ctx, 0, 48 + 6 * talk, 6, 3 * talk, '#F08A9A'); }
  else { ctx.beginPath(); ctx.moveTo(-14, 40 - mood * 2); ctx.quadraticCurveTo(0, 46 + mood * 8, 14, 40 - mood * 2); stroke(ctx, '#6A3A2A', 3.5); }
  // a little green bow on the head, its ribbons wobble late
  ctx.save(); ctx.translate(36, -56); ctx.rotate(0.3 + 0.12 * Math.sin(t * 3) + jig * 0.5);
  chain(ctx, -2, 6, 1.9 - 0.5 * trail, 3, 14, t, trail, 7, '#3FAE5A', 0); chain(ctx, 2, 6, 1.3 - 0.4 * trail, 3, 13, t, trail, 7, '#3FAE5A', 1.2);
  ball(ctx, -15, 0, 15, 10, '#9CEAA8', '#4CC266', '#2A8A40', -0.4); ball(ctx, 15, 0, 15, 10, '#9CEAA8', '#4CC266', '#2A8A40', 0.4); ball(ctx, 0, 1, 7, 7, '#7CDA8A', '#3AA852', '#207A34');
  ctx.restore();
  ctx.restore();
  ctx.restore();
}
const GRE = { hi: '#B6F07A', mid: '#6CC444', lo: '#2E7A2A', belly: '#F2F8C8' };
function frog(ctx, x, y, s, o) {
  const { dir = -1, air = 0, sq = 0, lean = 0, lookX = 0, lookY = 0, blink = 0, happy = 0, wide = 0, talk = 0, mood = 0.6, point = 0, hold = 0, t = 0, trail = 0, jig = 0 } = o;
  softShadow(ctx, x, y + 6, 125 * s * (1 - clamp(air / 300) * 0.4), 22 * s, 0.42 * (1 - clamp(air / 400) * 0.5));
  ctx.save(); ctx.translate(x, y - air); ctx.scale(dir * s * (1 + sq), s * (1 - sq)); ctx.rotate(lean);
  // big folded legs and webbed feet
  [-1, 1].forEach((k) => { ball(ctx, k * 62, -40, 46, 38, GRE.hi, GRE.mid, GRE.lo); ctx.save(); ctx.translate(k * 70, -10); [-0.5, 0, 0.5].forEach((a) => ball(ctx, Math.sin(a) * 26 * k + k * 8, Math.cos(a) * 4, 14, 9, '#9CE070', '#5AB03C', '#2E7A2A')); ctx.restore(); });
  ball(ctx, 0, -92, 82, 82, GRE.hi, GRE.mid, GRE.lo);
  ctx.fillStyle = rgrad(ctx, 0, -76, 62, [[0, GRE.belly], [0.8, 'rgba(242,248,200,0.8)'], [1, 'rgba(242,248,200,0)']]); ctx.beginPath(); ctx.ellipse(0, -76, 52, 56, 0, 0, TAU); ctx.fill();
  // spots
  [[-56, -120, 10], [60, -104, 8], [-40, -60, 7]].forEach(([sx, sy, r]) => ell(ctx, sx, sy, r, r * 0.8, 'rgba(46,122,42,0.45)'));
  { const th = lerp(2.2, -1.95, point) + 0.08 * Math.sin(t * 9) * point, sx = -60, sy = -112, hx = sx + Math.cos(th) * 62, hy = sy + Math.sin(th) * 62; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); stroke(ctx, '#5AB03C', 22); ball(ctx, hx, hy, 15, 13, '#9CE070', '#5AB03C', '#2E7A2A'); }
  { const th = lerp(1.0, -0.15, hold) + 0.06 * Math.sin(t * 3), sx = 60, sy = -112, hx = sx + Math.cos(th) * 62, hy = sy + Math.sin(th) * 62; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); stroke(ctx, '#66BC44', 22); ball(ctx, hx, hy, 15, 13, '#9CE070', '#5AB03C', '#2E7A2A'); }
  // red neckerchief, its point flutters
  ctx.beginPath(); ctx.moveTo(-62, -150); ctx.quadraticCurveTo(0, -128, 62, -150); stroke(ctx, '#E8463E', 22);
  { const fl = 0.15 * Math.sin(t * 5) + 0.3 * trail * Math.sin(t * 9) + jig; ctx.save(); ctx.translate(0, -138); ctx.rotate(fl * 0.4); ctx.beginPath(); ctx.moveTo(-24, -4); ctx.lineTo(24, -4); ctx.lineTo(4 * Math.sin(t * 4), 40); ctx.closePath(); ctx.fillStyle = lgrad(ctx, 0, -4, 0, 40, [[0, '#FF6A5A'], [1, '#C02A2A']]); ctx.fill(); ell(ctx, -6, 10, 3, 3, '#FFFFFF'); ell(ctx, 8, 18, 3, 3, '#FFFFFF'); ctx.restore(); }
  // head: wide, with two big eyes on top
  ctx.save(); ctx.translate(0, -214); ctx.rotate(lookY * 0.07 + jig * 0.1 + 0.04 * Math.sin(t * 1.9));
  ball(ctx, 0, 0, 104, 66, GRE.hi, GRE.mid, GRE.lo);
  [-1, 1].forEach((k) => { ball(ctx, k * 50, -52, 40, 38, GRE.hi, GRE.mid, GRE.lo); eye(ctx, k * 50, -54, 25, 26, { lx: lookX, ly: lookY, blink, happy, wide, skin: GRE.mid }); });
  ctx.globalAlpha = 0.5; ell(ctx, -70, 14, 15, 9, '#F58CA0'); ell(ctx, 70, 14, 15, 9, '#F58CA0'); ctx.globalAlpha = 1;
  ell(ctx, -12, -6, 3, 2.5, '#2E5A2A'); ell(ctx, 12, -6, 3, 2.5, '#2E5A2A');
  if (talk > 0.08) { ctx.beginPath(); ctx.moveTo(-50, 14); ctx.quadraticCurveTo(0, 30 + 26 * talk, 50, 14); ctx.quadraticCurveTo(0, 22, -50, 14); ctx.fillStyle = '#7A2A38'; ctx.fill(); ell(ctx, 0, 22 + 12 * talk, 14, 5 * talk, '#F08A9A'); }
  else { ctx.beginPath(); ctx.moveTo(-56, 10); ctx.quadraticCurveTo(0, 34 + mood * 12, 56, 10); stroke(ctx, '#245A22', 5); }
  ctx.restore();
  ctx.restore();
}
HOSTPAIRS['ruby-hop'] = { L: (c, x, y, s, o) => fox(c, x, y, s, { ...o, dir: 1, point: o.reach2 > 0.9 ? 1 : 0, hold: o.reach > 0.5 ? 0.8 : 0.2 }), R: frog, sL: [0.64, 1.0], sR: [0.56, 0.9] };
const PAIR = HOSTPAIRS[TL.data.hosts] || HOSTPAIRS['prune-tilou'];
