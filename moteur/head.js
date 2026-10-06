// Miel et le camion rouge (TikTok 9:16, 2 min): pure function of time. window.seek(t) paints frame t.
// Articulated characters, camera shots with cuts, lip-sync from the narration envelope (timeline.js).
import * as M from './lib/motion.js';
import { TL } from './timeline.js';

const { W, H, E, TAU, prog, lerp, clamp, bump, springU, SPRING, wobble, font, layout, glyph, fill, hash01, noise1, mix } = M;
const PI = Math.PI;
const C = { ink: '#16233F', paper: '#F4EBDD', accent: '#F2542D', white: '#FFFFFF', lamp: '#FFD95A', pink: '#F7A9B4',
  wall: '#F9E4BC', wall2: '#F5D9A6', wood: '#C98F5A', woodD: '#A8703F', grass: '#86CF6E', grassD: '#5FB257', red: '#E8452C', redD: '#B9301C' };
const DISPLAY = 'Display', UI = 'UI';
const CX = W / 2, G = 1100;
const SC = Object.fromEntries(TL.scenes.map((s) => [s.id, s]));
const P = Object.fromEntries(TL.scenes.map((s) => [s.id, TL.phrases.filter((p) => p.scene === s.id)]));
const r4 = (x) => Math.round(x * 4) / 4;
let NOW = 0;
