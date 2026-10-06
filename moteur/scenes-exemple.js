// ---------------------------------------------------------------- staging helpers
const CHEST = { x: 0, y: -116, s: 0.62 };
// A truck that travels from a spot in the world into `who`'s arms (k 0..1), drawn under the arms.
function carry(wx, wy, ws, ox, os, k, roll = 0) {
  return (ctx) => { const fx = (wx - ox) / os, fy = (wy - G) / os; truck(ctx, lerp(fx, CHEST.x, k), lerp(fy, CHEST.y, k), lerp(ws / os, CHEST.s, k), { roll, shadow: k < 0.3 }); };
}
function hearts(ctx, x, y, u, u0, n = 4) {
  for (let i = 0; i < n; i++) { const t = ((u - u0) * 0.22 + i / n) % 1; if (u < u0) continue; ctx.globalAlpha = Math.sin(t * PI); heart(ctx, x + 70 * Math.sin(i * 2.4 + t * 3), y - 190 * t, 20 + 8 * (i % 2), i % 2 ? C.pink : C.accent); ctx.globalAlpha = 1; }
}
function pops(ctx, x, y, u, u0, word, rot) {
  const k = springU(u, u0, SPRING.bouncy) * (1 - prog(u, u0 + 0.9, u0 + 1.4)); if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k); ctx.font = font(64, 800, DISPLAY); ctx.textAlign = 'center'; ctx.lineWidth = 12; ctx.strokeStyle = '#FFFFFF'; ctx.lineJoin = 'round'; ctx.strokeText(word, 0, 0); ctx.fillStyle = C.accent; ctx.fillText(word, 0, 0); ctx.restore();
}

// ---------------------------------------------------------------- 1 la maison, le tresor
function sMaison(ctx, u, s) {
  if (u < 8.9) {
    const c = shot(u, [[0, 560, 740, 0.8, 380, 765, 1.75]], 8.9);
    garden(ctx, u, c, { bfly: 3, bx: 640, by: 640, winFace: (x) => critter(x, 322, 905, 0.42, 'miel', { armR: 0.85 + 0.08 * Math.sin(u * 5), mood: 1, look: 0.3 }) }, () => {});
    return;
  }
  const tx = 610 + 80 * Math.sin((u - 8.9) * 0.8), bop = Math.abs(Math.sin(u * PI / 2)) * 10;
  const c = shot(u, [[8.9, 540, 830, 1.2, 550, 840, 1.32], [13.2, tx, 1005, 2.1, tx, 1000, 2.4], [15.6, 410, 800, 1.9, 410, 795, 2.15]], s.u1);
  if (c.i === 1) c.x = tx + 5 * noise1(u * 0.35, 11);
  const sk = springU(u, P.maison[1].u0 + 1.2, SPRING.bouncy);
  room(ctx, u, c, {}, () => {
    critter(ctx, 400, G - bop, 1, 'miel', { look: 0.7, lookY: c.i === 2 ? 0 : 0.6, armR: 0.3 + 0.06 * Math.sin((u - 8.9) * 0.8), mood: 1, squint: c.i === 2 ? 1 : 0, tilt: c.i === 2 ? 0.1 * Math.sin(u * 1.6) : 0 });
    truck(ctx, tx, G + 6, 1, { roll: tx / 27 });
    sparkles(ctx, tx, G - 70, 170, u, sk, 6);
    if (c.i === 2) hearts(ctx, 430, 640, u, 15.6, 4);
  });
}

// ---------------------------------------------------------------- 2 la regle de maman
function sRegle(ctx, u, s) {
  const c = shot(u, [[18, 560, 800, 1.02, 570, 795, 1.1], [22.6, 790, 700, 1.7, 790, 692, 1.9], [25.7, 350, 815, 1.9, 360, 810, 2.1], [28.6, 570, 790, 1.12, 570, 790, 1.2]], s.u1);
  const m = walkTo(u, 18.3, 21.8, 1380, 800, 34), tk = say(u, 'mama');
  const peek = bump(u, 27.1, 0.9);
  room(ctx, u, c, {}, () => {
    truck(ctx, 510, G + 6, 1, { roll: 1 });
    critter(ctx, 330, G, 1, 'miel', { look: lerp(0.8, 0.9, peek), lookY: lerp(-0.6, 0.9, peek), mood: lerp(0.5, 0.05, prog(u, 23, 26)), brow: 0.6 * prog(u, 24, 26), armR: 0.12 });
    critter(ctx, m.x, G + 4, 1.35, 'mama', { walk: m.walk, look: -0.7, lookY: 0.4, talk: tk, mood: 0.8, armL: tk > 0 || (u > 22.7 && u < 28.6) ? 0.42 + 0.08 * Math.sin(u * 3) : 0.1, armR: 0.1 });
  });
  const bk = springU(u, 24.4, SPRING.bouncy) * (1 - prog(u, 28.2, 28.6));
  if (c.i === 1 || c.i === 2) iconBub(ctx, c.i === 1 ? 250 : 800, 420, 130, bk * (c.i === 1 ? 1 : 0), (r) => { truck(ctx, 0, 6, 0.5, { shadow: 0 }); ell(ctx, -34, 62, 22, 22, SP.miel.fur); ell(ctx, 34, 62, 22, 22, SP.rosie.fur); }, -1);
}

// ---------------------------------------------------------------- 3 Rosie arrive
const KN = [P.arrivee[0].u0, P.arrivee[0].u0 + 0.62, P.arrivee[0].u0 + 1.24];
function sArrivee(ctx, u, s) {
  const c = shot(u, [[32, 200, 820, 1.5, 185, 820, 1.68], [35.4, 470, 800, 1.08, 480, 800, 1.15], [39.6, 310, 800, 2.0, 315, 797, 2.15], [42.3, 600, 1010, 2.1, 600, 1000, 2.5], [44.4, 500, 810, 1.22, 500, 810, 1.3]], s.u1);
  const dk = clamp(springU(u, 35.4, SPRING.snappy)) * (1 - clamp(springU(u, 38.6, SPRING.snappy)));
  const ap = clamp(springU(u, 35.6, SPRING.gentle)), r = walkTo(u, 36.1, 38.4, DOOR, 300, 26), tk = say(u, 'rosie');
  const hop = c.i === 4 ? Math.abs(Math.sin((u - 44.4) * PI / 1.5)) * 26 : 0, mx = lerp(760, 700, sm(prog(u, 45, 47)));
  ctx.save(); KN.forEach((k) => M.shake(ctx, u, k, 9, 5, 0.1));
  room(ctx, u, c, { door: dk }, () => {
    truck(ctx, 600, G + 6, 1, { roll: 1 });
    if (c.i === 3) sparkles(ctx, 600, G - 70, 170, u, 1, 6);
    critter(ctx, mx, G, 1, 'miel', { walk: u > 45 && u < 47 ? mx / 28 : undefined, look: -0.8, wide: u < 38 ? 1 : 0, mood: c.i === 4 ? 0 : 0.4, brow: c.i === 4 ? 0.5 : 0, lookY: c.i === 4 ? 0.4 : 0 });
    if (ap > 0.02) { ctx.globalAlpha = clamp(ap * 1.5); critter(ctx, r.x, G - hop, 0.95 * (0.86 + 0.14 * ap), 'rosie', { walk: r.walk, look: 0.75, lookY: tk > 0 ? 0.3 : 0, mood: 1, talk: tk, wide: u > 39 ? 1 : 0, wag: Math.sin(u * 4), armR: u < 39 ? 0.8 + 0.1 * Math.sin(u * 6) : (u > 40.5 ? 0.5 : 0.1), armL: c.i === 4 ? 0.3 : 0.1 }); ctx.globalAlpha = 1; }
    KN.forEach((k, i) => pops(ctx, 250 + i * 40, 700 - i * 70, u, k, 'TOC', -0.2 + i * 0.18));
  });
  ctx.restore();
}

// ---------------------------------------------------------------- 4 « Non ! Il est a moi ! »
function sRefus(ctx, u, s) {
  const c = shot(u, [[48, 600, 810, 1.25, 680, 810, 1.5], [54.2, 700, 790, 2.2, 700, 790, 2.5], [57.2, 305, 800, 2.0, 300, 805, 2.15]], s.u1);
  const k = clamp(springU(u, P.refus[0].u0 + 0.7, SPRING.snappy), 0, 1.05), tk = say(u, 'miel'), no = tk > 0 || (u > 54.4 && u < 56.8);
  const back = sm(prog(u, 57.6, 59));
  ctx.save(); M.shake(ctx, u, P.refus[1].u0, 16, 7, 0.16);
  room(ctx, u, c, {}, () => {
    critter(ctx, lerp(300, 270, back), G, 0.95, 'rosie', { look: 0.75, wide: u > 54 ? 1 : 0, mood: lerp(0.9, -0.5, prog(u, 54.5, 59.5)), brow: prog(u, 57, 59.5) * 0.8, droop: prog(u, 58.4, 60.6) * 0.6, wag: Math.sin(u * 4) * (1 - prog(u, 52, 54)), armR: lerp(0.45, 0.1, prog(u, 51, 53)) });
    critter(ctx, 700, G, 1, 'miel', { look: no ? 0.25 * Math.sin(u * 9) : lerp(-0.7, 0.4, k), lean: 0.06 * k, mood: lerp(0.2, -0.7, k), brow: -k * (no ? 1 : 0.7), talk: tk, armL: lerp(0.3, -0.3, k), armR: lerp(0.1, -0.3, k), hold: carry(600, G + 6, 1, 700, 1, k, 1), sq: 0.06 * wobble(u - P.refus[1].u0, 3, 4) });
  });
  ctx.restore();
}

// ---------------------------------------------------------------- 5 Rosie s'en va
function sConsequence(ctx, u, s) {
  const c = shot(u, [[61, 275, 805, 2.1, 275, 812, 2.35], [69.6, 470, 800, 1.02, 430, 800, 1.1], [74.8, 700, 800, 1.7, 700, 800, 1.95]], s.u1);
  const r = walkTo(u, 70.5, 73, 270, DOOR, 26), out = prog(u, 72.9, 73.8), tk = say(u, 'rosie');
  const dk = clamp(springU(u, 72.1, SPRING.snappy)) * (1 - clamp(springU(u, 74.2, SPRING.snappy)));
  room(ctx, u, c, { door: dk }, () => {
    if (out < 1) { ctx.globalAlpha = 1 - out; critter(ctx, r.x, G, 0.95 * (1 - 0.12 * out), 'rosie', { walk: r.walk, stride: 0.7, look: u > 70.2 ? -0.8 : 0.5, lookY: 0.7, mood: -0.8, brow: 0.9, droop: lerp(0.6, 1, prog(u, 62.5, 64)), talk: tk, tear: prog(u, 66.8, 69.4) }); ctx.globalAlpha = 1; }
    critter(ctx, 700, G, 1, 'miel', { look: u > 76 ? 0 : -0.8, lookY: u > 76 ? 0.9 : 0, mood: lerp(-0.2, -0.7, prog(u, 70, 75)), brow: prog(u, 70, 74), armL: -0.3, armR: -0.3, hold: carry(0, 0, 1, 700, 1, 1, 1) });
  });
}

// ---------------------------------------------------------------- 6 tout seul
function sSeul(ctx, u, s) {
  const c = shot(u, [[77, 620, 830, 1.35, 600, 790, 0.95], [82.4, 465, 262, 2.3, 465, 270, 2.5], [84, 620, 850, 1.6, 640, 840, 1.8]], s.u1);
  const push = 34 * (sm(prog(u, 84, 84.7)) - sm(prog(u, 84.7, 85.2)) + sm(prog(u, 85.3, 86)) - sm(prog(u, 86, 86.6)));
  const tx = u < 82.4 ? 520 + 60 * Math.sin((u - 77) * 0.55) : 530 - push, sigh = wobble(u - 87.6, 0.6, 1.2);
  room(ctx, u, c, { dim: 0.12 }, () => {
    truck(ctx, tx, G + 6, 1, { roll: tx / 27 });
    critter(ctx, 700, G, 1, 'miel', { look: u > 88.6 ? -0.9 : -0.6, lookY: u > 88.6 ? 0 : 0.8, mood: -0.5, brow: 0.6, armL: 0.22 + (u > 87.6 ? -0.1 * (1 - sigh) : 0.03 * Math.sin(u)), sq: 0.035 * (u > 87.6 ? sigh : 0), lean: -0.05 });
  });
}

// ---------------------------------------------------------------- 7 par la fenetre
function sDehors(ctx, u, s) {
  if (u < 93.2) {
    const c = shot(u, [[91, 720, 790, 1.5, 760, 765, 1.75]], 93.2);
    room(ctx, u, c, { dim: 0.12, win: (x) => { const hy = 12 * Math.abs(Math.sin(u * PI / 2)); ell(x, 890, 705 - hy, 20, 26, SP.rosie.fur); poly(x, [[876, 687 - hy], [882, 655 - hy], [890, 683 - hy]], SP.rosie.fur); poly(x, [[892, 683 - hy], [902, 655 - hy], [906, 689 - hy]], SP.rosie.fur); butterfly(x, 700 + 20 * Math.sin(u * 2), 470 + 14 * Math.sin(u * 3), 0.7, u, C.lamp); } }, () => {
      truck(ctx, 530, G + 6, 1, { roll: 1 });
      critter(ctx, 720, G, 1, 'miel', { look: 0.85, lookY: -0.8, mood: -0.3, brow: 0.5 });
    });
    return;
  }
  const c = shot(u, [[93.2, 620, 790, 0.95, 660, 790, 1.08], [98.8, 720, 790, 1.85, 720, 790, 2.0], [101.9, 560, 790, 1.25, 330, 775, 2.7]], s.u1);
  const hop = Math.abs(Math.sin(u * PI / 2)) * 50, lau = u > 98.9 && u < 101.6 ? Math.max(0, 0.45 + 0.45 * Math.sin(u * 11)) : 0;
  garden(ctx, u, c, { bfly: 5, bx: 720, by: 560, winFace: (x) => critter(x, 322, 905, 0.42, 'miel', { mood: -0.7, brow: 0.9, look: 0.6, armL: 0.9, armR: 0.9 }) }, () => {
    const rx = 720 + 40 * Math.sin(u * 0.7), ry = G - hop;
    critter(ctx, rx, ry, 0.95, 'rosie', { mood: 1, squint: lau > 0 || hop > 30 ? 1 : 0, talk: lau, wag: Math.sin(u * 5), armR: 0.8, armL: 0.5 + 0.2 * Math.sin(u * 3), look: 0.3 * Math.sin(u * 0.7), tilt: 0.06 * Math.sin(u * 2) });
    ctx.save(); ctx.translate(rx + 0.95 * 144, ry - 0.95 * 266); ctx.rotate(u * 2.4); ctx.strokeStyle = '#8E5B30'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-66, 0); ctx.lineTo(66, 0); ctx.stroke(); ell(ctx, 74, -8, 16, 9, '#5FB257', 0.6); ctx.restore();
  });
}

// ---------------------------------------------------------------- 8 le coeur serre
function sMalaise(ctx, u, s) {
  const c = shot(u, [[105, 700, 800, 2.0, 700, 808, 2.3], [110.4, 520, 1000, 1.6, 520, 985, 2.0], [115.6, 610, 830, 1.3, 610, 830, 1.38]], s.u1);
  const sqz = sm(prog(u, 107, 108.6));
  room(ctx, u, c, { dim: 0.12 + 0.26 * prog(u, 105, 110) }, () => {
    truck(ctx, 520, G + 6, 1, { roll: 1 });
    critter(ctx, 700, G, 1, 'miel', { look: c.i ? -0.7 : 0, lookY: c.i ? 0.8 : 0.5, mood: -0.85, brow: 1, lean: -0.04, tear: c.i === 0 ? prog(u, 108.6, 110.6) : 0 });
    if (c.i === 0) heart(ctx, 700 + 3 * wobble(u - 107, 3, 2), G - 168, 30 * (1 - 0.45 * sqz) * (1 + 0.08 * Math.sin(u * PI)), C.accent);
  });
}

// ---------------------------------------------------------------- 9 Papi Blaireau
function sSage(ctx, u, s) {
  const c = shot(u, [[119, 470, 800, 1.05, 460, 800, 1.12], [124.3, 310, 735, 1.85, 310, 728, 2.05], [129.8, 700, 800, 2.0, 700, 795, 2.35]], s.u1);
  const dk = clamp(springU(u, 119.3, SPRING.snappy)) * (1 - clamp(springU(u, 123.9, SPRING.snappy)));
  const ap = clamp(springU(u, 119.8, SPRING.gentle)), p = walkTo(u, 120.2, 123.6, DOOR, 300, 20), tk = say(u, 'papi'), aha = clamp(springU(u, 131, SPRING.bouncy), 0, 1.15);
  room(ctx, u, c, { door: dk, dim: 0.38 * (1 - prog(u, 130.4, 132)) }, () => {
    truck(ctx, 520, G + 6, 1, { roll: 1 });
    if (ap > 0.02) { ctx.globalAlpha = clamp(ap * 1.5); critter(ctx, p.x, G, 1.18 * (0.88 + 0.12 * ap), 'papi', { walk: p.walk, stride: 0.6, cane: 1, armR: 0.14, look: 0.7, lookY: 0.3, mood: 0.8, talk: tk, armL: u > 124.4 && u < 129.7 ? 0.62 + 0.06 * Math.sin(u * 3) : 0.1 }); ctx.globalAlpha = 1; }
    critter(ctx, 700, G - 22 * Math.abs(Math.sin((u - 131) * PI / 1.2)) * (u > 131 ? 1 : 0), 1, 'miel', { look: lerp(-0.8, -0.3, aha), lookY: -0.2, mood: lerp(-0.7, 1, aha), brow: 0.8 * (1 - aha), wide: u > 130.4 ? 1 : 0, armL: 0.6 * aha, armR: 0.6 * aha });
    sparkles(ctx, 700, 610, 150, u, clamp(aha), 5, 0.6);
  });
  const bk = springU(u, 125.6, SPRING.bouncy) * (1 - prog(u, 129.4, 129.8)), h2 = springU(u, 127.9, SPRING.bouncy);
  if (c.i === 1) iconBub(ctx, 820, 400, 135, bk, (r) => { truck(ctx, 0, -6, 0.5, { shadow: 0 }); heart(ctx, lerp(0, -34, clamp(h2)), 60, 24, C.accent); heart(ctx, 34, 60, 24 * h2, C.accent); }, 1);
}

// ---------------------------------------------------------------- 10 Miel court dehors
function sCourse(ctx, u, s) {
  if (u < 139.4) {
    const c = shot(u, [[134, 620, 820, 1.3, 520, 820, 1.4]], 139.4);
    const a = walkTo(u, 134.4, 135.6, 700, 610, 28), k = clamp(springU(u, 135.9, SPRING.snappy), 0, 1.05), b = walkTo(u, 137.6, 139.4, 610, 120, 20);
    const mx = u < 137.6 ? a.x : b.x;
    room(ctx, u, c, { door: clamp(springU(u, 137.2, SPRING.snappy)) }, () => {
      critter(ctx, 390, G, 1.18, 'papi', { cane: 1, armR: 0.14, look: 0.6, mood: 1, squint: 1, armL: 0.75 + 0.06 * Math.sin(u * 5) });
      critter(ctx, mx, G, 1, 'miel', { walk: a.walk ?? b.walk, stride: u > 137.6 ? 1.5 : 1, lean: u > 137.6 ? -0.12 : 0, look: u > 137 ? -0.9 : -0.6, lookY: u < 136.5 ? 0.6 : 0, mood: 1, armL: lerp(0.25, -0.3, k), armR: lerp(0.1, -0.3, k), hold: carry(520, G + 6, 1, mx, 1, k, 1) });
    });
    return;
  }
  const m = walkTo(u, 139.4, 144.6, 150, 500, 20), run = m.p < 1;
  const c = shot(u, [[139.4, 300, 800, 1.3, 300, 800, 1.3]], s.u1); c.x = m.x + 110;
  const seen = clamp(springU(u, 142.6, SPRING.snappy));
  garden(ctx, u, c, { door: 1, bfly: 3, bx: 800, by: 600 }, () => {
    critter(ctx, 740, G, 0.95, 'rosie', { look: lerp(0.7, -0.8, seen), droop: 0.5 * (1 - seen), mood: lerp(-0.2, 0.4, seen), wide: seen > 0.5 ? 1 : 0, wag: seen * Math.sin(u * 4) });
    if (run) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); for (let i = 0; i < 5; i++) { const y = G - 60 - i * 62, l = 60 + 50 * hash01(i + Math.floor(u * 4), 7); ctx.moveTo(m.x - 130, y); ctx.lineTo(m.x - 130 - l, y); } ctx.stroke();
      for (let i = 0; i < 4; i++) { const t = ((u * 1.6 + i / 4) % 1); ell(ctx, m.x - 70 - 90 * t, G - 6 - 26 * t, 12 + 20 * t, 12 + 20 * t, `rgba(255,255,255,${0.6 * (1 - t)})`); } }
    critter(ctx, m.x, G, 1, 'miel', { walk: m.walk, stride: 1.6, lean: run ? 0.14 : 0, look: 0.85, mood: 0.8, armL: -0.3, armR: -0.3, hold: carry(0, 0, 1, m.x, 1, 1, u * 2), sq: 0.05 * wobble(u - 144.6, 2, 3), talk: !run ? 0.25 + 0.2 * Math.sin(u * 6) : 0.3 });
  });
}

// ---------------------------------------------------------------- 11 pardon, c'est ton tour
function sPartage(ctx, u, s) {
  const c = shot(u, [[146, 500, 800, 2.0, 500, 800, 2.2], [150.2, 620, 810, 1.4, 620, 810, 1.5], [153.5, 740, 805, 2.0, 740, 800, 2.3], [157, 620, 790, 1.15, 620, 790, 1.22]], s.u1);
  const tk = say(u, 'miel'), bow = bump(u, 149.4, 1.1), give = clamp(springU(u, 150.6, SPRING.gentle), 0, 1), take = clamp(springU(u, 155.4, SPRING.snappy), 0, 1.05);
  const tw = { x: lerp(500, 640, give), y: lerp(G - 116, G + 6, give), s: lerp(0.62, 0.9, give) }, joy = clamp(springU(u, P.partage[1].u0, SPRING.bouncy), 0, 1.1);
  const j1 = u > 157 ? Math.abs(Math.sin((u - 157) * PI / 1.5)) * 40 : 0, j2 = u > 157 ? Math.abs(Math.sin((u - 157.75) * PI / 1.5)) * 40 : 0;
  garden(ctx, u, c, { bfly: 4, bx: 620, by: 560 }, () => {
    critter(ctx, 500, G - j1, 1, 'miel', { look: 0.8, lookY: 0.9 * bow, mood: lerp(lerp(0.1, -0.2, bow), 1, joy), brow: 0.8 * (1 - give), talk: tk, armL: u < 150.6 ? -0.3 : 0.1 + 0.6 * (j1 > 5 ? 1 : 0), armR: u < 150.6 ? -0.3 : lerp(0.35, 0.1, take) + 0.6 * (j1 > 5 ? 1 : 0), hold: u < 150.6 ? carry(0, 0, 1, 500, 1, 1, 1) : null, squint: u > 157 ? 1 : 0 });
    if (u >= 150.6 && take < 0.02) truck(ctx, tw.x, tw.y, tw.s, { roll: tw.x / 27 });
    critter(ctx, 760, G - j2, 0.95, 'rosie', { look: -0.8, lookY: give > 0.5 && take < 0.5 ? 0.6 : 0, droop: 0.4 * (1 - prog(u, 149, 151)), mood: lerp(0.2, 1, Math.max(joy, prog(u, 151, 152.5) * 0.6)), wide: u > 150.6 && u < 153.7 ? 1 : 0, squint: joy > 0.5 ? 1 : 0, wag: Math.sin(u * 6) * Math.max(joy, 0.3), armL: lerp(0.1, -0.3, take), armR: lerp(0.1, -0.3, take), hold: take >= 0.02 ? carry(640, G + 6, 0.9, 760, 0.95, take, 1) : null, tilt: 0.08 * joy * Math.sin(u * 3) });
    hearts(ctx, 760, 640, u, P.partage[1].u0, 5);
    if (u > 157) sparkles(ctx, 630, 620, 300, u, 1, 7);
  });
}

// ---------------------------------------------------------------- 12 jouer a deux
function sJeu(ctx, u, s) {
  const c = shot(u, [[160, 520, 790, 1.05, 600, 790, 1.1], [165.4, 0, 990, 1.9, 0, 990, 1.9], [168.1, 0, 990, 1.9, 0, 990, 1.9], [170.2, 540, 960, 1.9, 540, 900, 1.5], [172.3, 430, 800, 2.0, 430, 795, 2.15], [175, 560, 770, 1.0, 560, 750, 0.86]], s.u1);
  const warm = prog(u, 166, 178), o = { warm, bfly: 3, bx: 600, by: 560 };
  if (c.i === 0) {
    const tx = lerp(240, 800, sm(prog(u, 160.3, 165.2)));
    garden(ctx, u, c, o, () => {
      critter(ctx, tx - 340, G - Math.abs(Math.sin(u * PI / 1.2)) * 44, 1, 'miel', { look: 0.8, mood: 1, squint: 1, armL: 0.8, armR: 0.8, talk: 0.3 + 0.3 * Math.sin(u * 8) });
      critter(ctx, tx - 165, G, 0.95, 'rosie', { walk: tx / 22, stride: 1.3, lean: 0.1, look: 0.8, lookY: 0.4, mood: 1, armR: 0.3, armL: 0.15, wag: Math.sin(u * 6) });
      truck(ctx, tx, G + 6 - 5 * Math.abs(Math.sin(tx / 40)), 1, { roll: tx / 27 });
    });
  } else if (c.i === 1) {
    const tx = 300 + (u - 165.4) * 95; c.x = tx + 20;
    garden(ctx, u, c, o, () => {
      critter(ctx, tx - 185, G, 0.95, 'rosie', { walk: tx / 22, stride: 1.2, lean: 0.1, look: 0.8, lookY: 0.5, mood: 1, armR: 0.3 });
      truck(ctx, tx, G + 6 - 7 * Math.abs(Math.sin(tx / 30)), 1, { roll: tx / 27, load: 'pebbles', loadK: clamp(springU(u, 165.5, SPRING.bouncy), 0, 1.1), tilt: 0.02 * Math.sin(tx / 30) });
    });
  } else if (c.i === 2) {
    const tx = 820 - (u - 168.1) * 95; c.x = tx - 20;
    garden(ctx, u, c, o, () => {
      critter(ctx, tx + 190, G, 1, 'miel', { walk: tx / 22, stride: 1.2, lean: -0.1, look: -0.8, lookY: 0.5, mood: 1, armL: 0.3 });
      truck(ctx, tx, G + 6 - 7 * Math.abs(Math.sin(tx / 30)), 1, { roll: tx / 27, dir: -1, load: 'flowers', loadK: clamp(springU(u, 168.2, SPRING.bouncy), 0, 1.1) });
    });
  } else if (c.i === 3) {
    const fly = sm(prog(u, 171.3, 172.3));
    garden(ctx, u, c, { ...o, bfly: 0 }, () => {
      critter(ctx, 250, G, 1, 'miel', { look: 0.8, lookY: lerp(0.5, -0.6, fly), mood: 1, wide: 1, talk: 0.5 * fly, armL: 0.7 * fly, armR: 0.7 * fly });
      critter(ctx, 830, G, 0.95, 'rosie', { look: -0.8, lookY: lerp(0.5, -0.6, fly), mood: 1, wide: 1, talk: 0.5 * fly, wag: Math.sin(u * 5), armL: 0.7 * fly, armR: 0.7 * fly });
      truck(ctx, 540, G + 6, 1, { roll: 1 });
      [[-90, '#FFD95A'], [-40, '#F27D92'], [10, '#FFFFFF'], [78, '#B58CF0']].forEach(([dx, col], i) => butterfly(ctx, 540 + dx + fly * (dx * 2.2 + 60 * Math.sin(u * 2 + i)), G - 132 - (i === 3 ? 12 : 0) - fly * (300 + 60 * i), 1.25, u * (0.35 + 0.65 * fly) + i, col));
    });
  } else {
    const tk = say(u, 'miel'), wide = c.i === 5;
    const j1 = wide ? Math.abs(Math.sin((u - 175) * PI / 1.5)) * 50 : 0, j2 = wide ? Math.abs(Math.sin((u - 175.75) * PI / 1.5)) * 50 : 0;
    garden(ctx, u, c, { ...o, door: 1, bfly: 5 }, () => {
      if (wide) { critter(ctx, 150, G, 1.2, 'mama', { look: 0.6, mood: 1, squint: 1, armR: 0.8 + 0.08 * Math.sin(u * 5) }); critter(ctx, -60, G, 1.1, 'papi', { cane: 1, armR: 0.14, look: 0.6, mood: 1, squint: 1 }); }
      critter(ctx, 430, G - j1, 1, 'miel', { look: wide ? 0.6 : 0.3, mood: 1, talk: tk, squint: tk > 0 ? 0 : 1, armL: wide ? 0.8 : 0.5 + 0.1 * Math.sin(u * 4), armR: wide ? 0.8 : 0.5 - 0.1 * Math.sin(u * 4), tilt: 0.06 * Math.sin(u * 2.5) });
      truck(ctx, 600, G + 6, 1, { roll: 1, load: 'flowers' });
      critter(ctx, 770, G - j2, 0.95, 'rosie', { look: -0.6, mood: 1, squint: 1, armL: 0.8, armR: 0.8, wag: Math.sin(u * 6) });
      if (wide) sparkles(ctx, 600, 560, 330, u, 1, 7);
    });
  }
}

// ---------------------------------------------------------------- 13 la morale
function sMorale(ctx, u, s) {
  const p = P.morale[0];
  fill(ctx, C.ink);
  const k = springU(u, s.u0, SPRING.gentle);
  sun(ctx, CX, lerp(2400, 1800, k), 440, mix(C.ink, C.accent, 0.1), mix(C.ink, C.accent, 0.2));
  const size = 118, f = font(size, 800, DISPLAY), lines = ['Partager,', 'c’est doubler', 'la joie.'];
  const n = 5, dur = (p.u1 - p.u0) * 0.9; let wi = 0;
  lines.forEach((ln, li) => {
    let x = 96; const base = 500 + li * 146;
    ln.split(' ').forEach((word) => {
      const L = layout(ctx, word, f, -0.02 * size), kk = springU(u, p.u0 + (wi / n) * dur, SPRING.bouncy);
      if (kk > 0.02) L.glyphs.forEach((g) => glyph(ctx, g.ch, x + g.cx, base + (1 - kk) * 60, f, li === 2 ? C.accent : C.paper, 1, Math.max(kk, 0.2)));
      x += L.width + size * 0.26; wi++;
    });
  });
  const land = p.u1 + 0.3, q = clamp(springU(u, land - 1.2, SPRING.gentle));
  const j1 = Math.abs(Math.sin((u - land) * PI / 2)) * 26 * (u > land ? 1 : 0), j2 = Math.abs(Math.sin((u - land - 1) * PI / 2)) * 26 * (u > land + 1 ? 1 : 0);
  const yy = 1440 + (1 - q) * 700;
  critter(ctx, 300, yy - j1, 0.85, 'miel', { look: 0.5, mood: 1, squint: 1, armR: 0.3, armL: 0.75 * clamp(springU(u, land + 0.4, SPRING.bouncy)) });
  truck(ctx, 540, yy + 4, 0.85, { roll: 1, load: 'flowers' });
  critter(ctx, 790, yy - j2, 0.82, 'rosie', { look: -0.5, mood: 1, squint: 1, armL: 0.3, armR: 0.75 * clamp(springU(u, land + 0.8, SPRING.bouncy)), wag: Math.sin(u * 5) });
  heart(ctx, 540, 1080 - 8 * Math.sin(u * 1.5), 44 * springU(u, land + 0.6, SPRING.bouncy), C.accent);
  const fk = springU(u, land + 1.2, SPRING.snappy);
  if (fk > 0) { ctx.font = font(88, 500, UI); ctx.fillStyle = C.paper; ctx.textAlign = 'left'; ctx.fillText('Fin', 100, 990 + (1 - fk) * 40); }
}

// Every visual accent with its sound: [beat, label, sfx, opts]
const HITS = [
  [0, 'ouverture', 'bell', { pitch: 'D5', len: 1.6, gain: 0.25 }],
  [9, 'dans la maison', 'whoosh', { len: 0.4, from: 500, to: 1600, gain: 0.16 }],
  [r4(P.maison[1].u0 + 1.25), 'tresor', 'coins', { gain: 0.3 }],
  [15.5, 'calin', 'bell', { pitch: 'A5', gain: 0.2 }],
  ...[18.5, 19.25, 20, 20.75, 21.5].map((b, i) => [b, 'pas maman ' + i, 'thud', { pitch: 90, to: 60, gain: 0.16 }]),
  [24.5, 'bulle partage', 'pop', { pitch: 'F#5', gain: 0.25 }],
  ...KN.map((k, i) => [r4(k), 'toc ' + i, 'tok', { pitch: 'A3', len: 0.25, gain: 0.7 }]),
  [35.5, 'porte', 'whoosh', { len: 0.35, from: 300, to: 900, gain: 0.22 }],
  [36, 'Rosie', 'boing', { pitch: 300, to: 520, gain: 0.2 }],
  [42.25, 'le camion brille', 'coins', { gain: 0.28 }],
  [r4(P.refus[0].u0 + 0.75), 'il serre', 'whoosh', { len: 0.3, from: 900, to: 400, gain: 0.25 }],
  [r4(P.refus[1].u0), 'non', 'impact', { gain: 0.4 }],
  [58.5, 'oreilles', 'boing', { pitch: 420, to: 200, gain: 0.2 }],
  [63, 'triste', 'bell', { pitch: 'D4', len: 2, gain: 0.2 }],
  [72, 'porte ouvre', 'whoosh', { len: 0.35, from: 300, to: 900, gain: 0.2 }],
  [74.25, 'porte ferme', 'thud', { pitch: 120, to: 50, gain: 0.5 }],
  ...[82.5, 83, 83.5].map((b, i) => [b, 'horloge ' + i, i % 2 ? 'tick' : 'click', { gain: 0.4 }]),
  [84, 'vroum 1', 'whoosh', { len: 0.5, from: 200, to: 420, gain: 0.2 }], [85.25, 'vroum 2', 'whoosh', { len: 0.5, from: 200, to: 380, gain: 0.18 }],
  [93.25, 'dehors', 'bell', { pitch: 'A5', gain: 0.22 }],
  ...[94, 96, 98, 100].map((b, i) => [b, 'saut Rosie ' + i, 'boing', { pitch: 320, to: 560, gain: 0.14 }]),
  [107, 'coeur', 'thud', { pitch: 80, to: 50, gain: 0.35 }], [108, 'coeur 2', 'thud', { pitch: 80, to: 50, gain: 0.3 }],
  [110.5, 'silence', 'bell', { pitch: 'D4', len: 2.2, gain: 0.18 }],
  [119.25, 'porte papi', 'whoosh', { len: 0.35, from: 300, to: 900, gain: 0.2 }],
  ...[120.5, 121.5, 122.5, 123.5].map((b, i) => [b, 'canne ' + i, 'tok', { pitch: 'D3', len: 0.2, gain: 0.4 }]),
  [125.5, 'bulle', 'pop', { pitch: 'A4', gain: 0.25 }], [128, 'deux coeurs', 'pop', { pitch: 'D5', gain: 0.28 }],
  [131, 'il comprend', 'bell', { pitch: 'D6', gain: 0.3 }], [131, 'etincelles', 'coins', { gain: 0.25 }],
  [136, 'il prend', 'pop', { pitch: 'A4', gain: 0.25 }],
  [137.5, 'course', 'riser', { len: 1.1, gain: 0.2 }],
  [139.5, 'dehors', 'whoosh', { len: 0.5, from: 500, to: 2200, gain: 0.3 }],
  ...[140, 140.5, 141, 141.5, 142, 142.5, 143, 143.5, 144].map((b, i) => [b, 'pas ' + i, 'thud', { pitch: 110, to: 70, gain: 0.14 }]),
  [144.75, 'stop', 'boing', { pitch: 260, to: 180, gain: 0.2 }],
  [150.75, 'il donne', 'whoosh', { len: 0.4, from: 400, to: 1000, gain: 0.18 }],
  [r4(P.partage[1].u0), 'sourire', 'bell', { pitch: 'A5', gain: 0.3 }], [r4(P.partage[1].u0), 'coeurs', 'coins', { gain: 0.3 }],
  [157, 'joie', 'boing', { pitch: 300, to: 560, gain: 0.2 }], [158.5, 'joie 2', 'boing', { pitch: 340, to: 620, gain: 0.2 }],
  [160, 'jeu', 'impact', { gain: 0.3 }],
  [165.5, 'cailloux', 'coins', { gain: 0.3 }], [165.5, 'cut', 'click', { gain: 0.2 }],
  [168.25, 'fleurs', 'pop', { pitch: 'D5', gain: 0.28 }], [168.5, 'fleurs 2', 'pop', { pitch: 'F#5', gain: 0.24 }], [168.75, 'fleurs 3', 'pop', { pitch: 'A5', gain: 0.24 }],
  [171.25, 'papillons', 'bell', { pitch: 'D6', gain: 0.25 }], [171.5, 'envol', 'whoosh', { len: 0.6, from: 800, to: 2600, gain: 0.14 }],
  [175, 'final', 'coins', { gain: 0.3 }], [176.5, 'saut', 'boing', { pitch: 300, to: 560, gain: 0.16 }],
  [SC.morale.u0, 'morale', 'impact', { gain: 0.4 }],
  [r4(P.morale[0].u1 + 0.75), 'coeur', 'bell', { pitch: 'D6', gain: 0.3 }],
  [r4(P.morale[0].u1 + 1.5), 'fin', 'tok', { pitch: 'D4', len: 1.2, gain: 0.5 }],
].sort((a, b) => a[0] - b[0]);

const DRAW = { maison: sMaison, regle: sRegle, arrivee: sArrivee, refus: sRefus, consequence: sConsequence, seul: sSeul, dehors: sDehors, malaise: sMalaise, sage: sSage, course: sCourse, partage: sPartage, jeu: sJeu, morale: sMorale };
M.film({
  fonts: [font(100, 700, DISPLAY), font(100, 800, DISPLAY), font(40, 500, UI)],
  hits: HITS,
  draw(ctx, u) {
    NOW = u;
    const s = TL.scenes.find((x) => u < x.u1) || TL.scenes[TL.scenes.length - 1];
    DRAW[s.id](ctx, u, s);
    subs(ctx, u, s);
  },
});
