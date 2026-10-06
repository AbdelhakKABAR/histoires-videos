// ---------------------------------------------------------------- drawing kit
function disc(ctx, x, y, r, color) { if (r <= 0) return; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = color; ctx.fill(); }

// Small "m" bird seen from far: adds one sub-path. a = flap (-1 down .. 1 up), bank tilts it.
function addV(ctx, x, y, span, a, bank = 0) {
  const ty = -a * span * 0.55, cy = -a * span * 0.8 - span * 0.2, b = bank * span;
  ctx.moveTo(x - span, y + ty - b);
  ctx.quadraticCurveTo(x - span * 0.45, y + cy - b * 0.5, x, y);
  ctx.quadraticCurveTo(x + span * 0.45, y + cy + b * 0.5, x + span, y + ty + b);
}
function strokeV(ctx, color, lw) { ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
function vbird(ctx, x, y, span, a, color, bank = 0) { ctx.beginPath(); addV(ctx, x, y, span, a, bank); strokeV(ctx, color, span * 0.24); }

function stars(ctx, n, amt, seed = 2) {
  for (let i = 0; i < n; i++) disc(ctx, hash01(i, seed) * W, hash01(i, seed + 1) * H * 0.75, (1.5 + 2.8 * hash01(i, seed + 2)) * clamp(amt - hash01(i, seed + 3) * 0.2), C.paper);
}
function sun(ctx, x, y, r, c1, c2) { disc(ctx, x, y, r * 2.2, c1); disc(ctx, x, y, r * 1.55, c2); disc(ctx, x, y, r, C.accent); }
function ridge(ctx, base, amp, lam, scroll, seed, color, yo = 0) {
  ctx.beginPath(); ctx.moveTo(0, H + 4);
  for (let x = 0; x <= W + 16; x += 16) {
    const q = (x + scroll) / lam;
    ctx.lineTo(x, H * base - amp * (0.5 + 0.5 * noise1(q, seed)) - amp * 0.2 * Math.abs(noise1(q * 2.7, seed + 5)) + yo);
  }
  ctx.lineTo(W, H + 4); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
function heart(ctx, x, y, s, color) {
  if (s <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 0.9); ctx.bezierCurveTo(-1.5, -0.2, -0.9, -1.2, 0, -0.45); ctx.bezierCurveTo(0.9, -1.2, 1.5, -0.2, 0, 0.9); ctx.fill(); ctx.restore();
}

// ---------------------------------------------------------------- subtitles (read-along)
const SUBF = font(54, 700, DISPLAY);
const wrapCache = new Map();
function wrap(ctx, str, maxW) {
  if (wrapCache.has(str)) return wrapCache.get(str);
  ctx.font = SUBF; ctx.letterSpacing = '0px';
  const sp = ctx.measureText(' ').width, lines = [[]]; let w = 0, i = 0;
  for (const word of str.split(' ')) {
    const ww = ctx.measureText(word).width;
    if (w + ww > maxW && lines[lines.length - 1].length) { lines.push([]); w = 0; }
    lines[lines.length - 1].push({ word, x: w, w: ww, i: i++ }); w += ww + sp;
  }
  const out = { lines: lines.map((l) => ({ words: l, width: l[l.length - 1].x + l[l.length - 1].w })), n: i };
  wrapCache.set(str, out); return out;
}
function subs(ctx, u, sc) {
  const ps = P[sc.id]; if (!ps.length || sc.id === 'morale') return;
  let cur = null; for (const p of ps) if (u >= p.u0 - 0.35) cur = p;
  const last = ps[ps.length - 1];
  if (!cur || u > last.u1 + 1.5) return;
  const k = springU(u, ps[0].u0 - 0.35, SPRING.snappy) * (1 - E.inCubic(prog(u, last.u1 + 1.1, last.u1 + 1.5)));
  const wr = wrap(ctx, cur.text, 810), lh = 70, MAXL = 3;
  const dur = (cur.u1 - cur.u0) * 0.92, wNow = clamp((u - cur.u0) / dur, 0, 0.999) * wr.n;
  // long sentences are paged three lines at a time, turning the page as the voice gets there
  let page = 0; wr.lines.forEach((ln, li) => { if (ln.words[0].i <= wNow) page = Math.floor(li / MAXL); });
  const shown = wr.lines.slice(page * MAXL, page * MAXL + MAXL);
  const h = shown.length * lh + 52, w = 900, x = (W - w) / 2, y = 1474 - h + (1 - k) * 120;
  ctx.save(); ctx.globalAlpha = clamp(k * 1.4);
  ctx.fillStyle = 'rgba(8,14,32,0.88)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 34); ctx.fill();
  ctx.font = SUBF; ctx.textAlign = 'left';
  shown.forEach((ln, li) => ln.words.forEach((wd) => {
    const lit = u >= cur.u0 + (wd.i / wr.n) * dur;
    ctx.fillStyle = lit ? C.paper : '#77829B';
    ctx.fillText(wd.word, CX - ln.width / 2 + wd.x, y + 26 + lh * (li + 0.72));
  }));
  ctx.restore();
}

function bubble(ctx, x, y, r, k, ch, color = C.ink, dir = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  disc(ctx, -dir * r * 0.62, r * 0.98, r * 0.2, C.paper); disc(ctx, -dir * r * 0.95, r * 1.36, r * 0.11, C.paper);
  disc(ctx, 0, 0, r, C.paper);
  const f = font(r * 1.3, 800, DISPLAY); ctx.font = f; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(ch, 0, r * 0.45);
  ctx.restore();
}
function sparkle(ctx, x, y, r, color) {
  if (r <= 0) return;
  ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8, rr = i % 2 ? r * 0.3 : r; ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); }
  ctx.closePath(); ctx.fill();
}
function rain(ctx, t, n, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 3.6; ctx.lineCap = 'round'; ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const y = ((hash01(i, 61) * (H + 160) + t * H * (0.9 + 0.5 * hash01(i, 62))) % (H + 160)) - 80;
    const x = hash01(i, 63) * W * 1.8 - y * 0.36;
    ctx.moveTo(x, y); ctx.lineTo(x - 19, y + 52);
  }
  ctx.stroke();
}
function clouds(ctx, t, n, color, y0, y1, sp = 30, seed = 21) {
  for (let i = 0; i < n; i++) {
    const w = 200 + 220 * hash01(i, seed), span = W + w + 200;
    const x = W + 100 - ((hash01(i, seed + 1) * span + t * (sp + sp * hash01(i, seed + 2))) % span), y = lerp(y0, y1, hash01(i, seed + 3));
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, 44, 22); ctx.roundRect(x + w * 0.2, y - 30, w * 0.5, 44, 22); ctx.fill();
  }
}
