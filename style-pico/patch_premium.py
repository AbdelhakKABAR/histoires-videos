import sys
P = {
 'p1': "{ bloom: 0.55, thr: 0.8, title: true, streak: (tr) => { const s = SUN(OLD(tr)); return [830, 430 - 60 * s, s, '255,214,150']; }, bokeh: ['255,228,175', (tr) => 0.35 + 0.65 * SUN(OLD(tr))], leak: ['255,170,90', (tr) => 0.3 + 0.7 * SUN(OLD(tr))] }",
 'p2': "{ bloom: 0.55, thr: 0.8, streak: () => [830, 370, 1, '255,214,150'], bokeh: ['255,228,175', 1], leak: ['255,170,90', 1] }",
 'p3': "{ bloom: 0.7, thr: 1.0, bokeh: ['160,195,255', 0.8], leak: ['255,190,110', 0.45] }",
}
def one(s, a, b, n=1):
    assert s.count(a) == n, (s.count(a), a[:70]); return s.replace(a, b)
for p, cfg in P.items():
    m = open(f'{p}/lib/motion.js').read()
    m = one(m, "samples = 16, shutter = 0.5 })", "samples = 16, shutter = 0.5, post = null })")
    m = one(m, "    if (!blur) { frame(mctx, t0); return; }", "    if (!blur) { frame(mctx, t0); if (post) post(mctx, t0); return; }")
    m = one(m, "    mctx.globalAlpha = 1;\n  };", "    mctx.globalAlpha = 1;\n    if (post) post(mctx, t0);\n  };")
    open(f'{p}/lib/motion.js', 'w').write(m)
    s = open(f'{p}/film.js').read()
    s = one(s, "import { TL } from './timeline.js';", "import { TL } from './timeline.js';\nimport { premium } from './premium.js';")
    for a in ["talking ? mouth(tr) : 0", "htalk ? mouth(tr) : 0", "btalk ? mouth(tr) : 0"]:
        s = s.replace(a, "0")   # une seule voix, celle du conteur : les personnages ne parlent pas eux-mêmes
    s = one(s, "ctx.strokeStyle = 'rgba(10,20,40,0.92)'; ctx.lineWidth = 15; ctx.strokeText(wd.word, 0, 0);",
               "ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 6; ctx.strokeStyle = 'rgba(14,16,34,0.9)'; ctx.lineWidth = 13; ctx.strokeText(wd.word, 0, 0); ctx.shadowColor = 'rgba(0,0,0,0)';")
    s = one(s, "init() { buildLayers(); }, draw });", "init() { buildLayers(); }, draw, post: (ctx, tr) => premium(ctx, tr, " + cfg + ") });")
    open(f'{p}/film.js', 'w').write(s)
    open(f'{p}/premium.js', 'w').write(open('tools/premium.js').read())
print('ok')
