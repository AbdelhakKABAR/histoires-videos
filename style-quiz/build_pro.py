# Assemble film.js du quiz « pro » (adultes) : python3 build_pro.py <dossier>/film.js
import os, sys
D = os.path.dirname(os.path.abspath(__file__)); s = open(os.path.join(D, 'personnages-source.js')).read()
def sl(a, b): i = s.index(a); j = s.index(b, i); return s[i:j]
head = '''// Quiz pro (TikTok 9:16). Pure function of time: window.seek(t) paints frame t.
import * as M from './lib/motion.js';
import { TL } from './timeline.js';
const { W, H, E, TAU, clamp, lerp, prog, bump, spring, SPRING, kf, wobble, mulberry32, hash01, noise1, mix, font } = M;
const PI = Math.PI;
const sm = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
const DISPLAY = 'Display';
const A = (v) => clamp(v).toFixed(3);
const GY0 = 1240, gy = (x) => GY0 + 7 * Math.sin(x / 230);
'''
K = '// ---------------------------------------------------------------- '
out = head + sl(K + 'kit', K + 'layers') + sl(K + 'layers', K + 'the laundry') + open(os.path.join(D, 'quiz-pro-body.js')).read()
open(sys.argv[1], 'w').write(out)
