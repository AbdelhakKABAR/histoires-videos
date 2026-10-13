# Assemble film.js d'un épisode de quiz : python3 build.py <dossier>/film.js
# = kit de dessin + décor + personnages (Prune la kangourou, Tilou le koala, pris dans personnages-source.js) + quiz-body.js
import os, sys
D = os.path.dirname(os.path.abspath(__file__)); s = open(os.path.join(D, 'personnages-source.js')).read()
def sl(a, b): i = s.index(a); j = s.index(b, i); return s[i:j]
head = '''// Le grand quiz de Prune (TikTok 9:16). Pure function of time: window.seek(t) paints frame t.
import * as M from './lib/motion.js';
import { TL } from './timeline.js';
const { W, H, E, TAU, clamp, lerp, prog, bump, spring, SPRING, kf, wobble, mulberry32, hash01, noise1, mix, font } = M;
const PI = Math.PI;
const sm = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
const DISPLAY = 'Display';
const A = (v) => clamp(v).toFixed(3);
const GY0 = 1240, gy = (x) => GY0 + 7 * Math.sin(x / 230);
const RS = 1.08, KS = 1.05;
'''
K = '// ---------------------------------------------------------------- '
out = head + sl(K + 'kit', K + 'layers') + sl(K + 'layers', K + 'the laundry') + sl('function sock(', 'function dress(') + sl(K + 'Prune, the kangaroo', K + 'performances') + open(os.path.join(D, 'quiz-body.js')).read()
open(sys.argv[1], 'w').write(out)
