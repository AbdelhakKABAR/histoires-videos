"""Fabrique les visuels des participants (drapeaux ou équipes) dans badges/ :
   <i>.png (carré 256, pour la bille) et <i>_w.png (320x240, pour le classement)."""
import json, os, sys, math, subprocess
import cairo
HERE = os.path.dirname(os.path.abspath(__file__))
FI = os.path.join(HERE, "node_modules", "flag-icons", "flags")

def hexrgb(h):
    h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

def pattern(cr, w, h, cols, motif):
    c = [hexrgb(x) for x in cols] + [hexrgb(cols[0])] * 3
    cr.set_source_rgb(*c[0]); cr.paint()
    if motif == "bande":            # bande verticale centrale (type PSG)
        cr.set_source_rgb(*c[2]); cr.rectangle(w * 0.30, 0, w * 0.40, h); cr.fill()
        cr.set_source_rgb(*c[1]); cr.rectangle(w * 0.36, 0, w * 0.28, h); cr.fill()
    elif motif == "rayures":        # rayures verticales
        n = 7
        for k in range(n):
            if k % 2: cr.set_source_rgb(*c[1]); cr.rectangle(k * w / n, 0, w / n, h); cr.fill()
    elif motif == "cerceaux":       # rayures horizontales
        n = 7
        for k in range(n):
            if k % 2: cr.set_source_rgb(*c[1]); cr.rectangle(0, k * h / n, w, h / n); cr.fill()
    elif motif == "moitie":
        cr.set_source_rgb(*c[1]); cr.rectangle(w / 2, 0, w / 2, h); cr.fill()
    elif motif == "diagonale":
        cr.set_source_rgb(*c[1]); cr.set_line_width(h * 0.28)
        cr.move_to(-10, -10); cr.line_to(w + 10, h + 10); cr.stroke()
    elif motif == "col":            # maillot uni avec épaules d'une autre couleur
        cr.set_source_rgb(*c[1]); cr.rectangle(0, 0, w, h * 0.3); cr.fill()

def sigle_text(cr, s, w, h, size):
    cr.select_font_face("Inter Display", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    cr.set_font_size(size); e = cr.text_extents(s)
    x = w / 2 - (e.width / 2 + e.x_bearing); y = h / 2 - (e.height / 2 + e.y_bearing)
    cr.move_to(x, y); cr.text_path(s)
    cr.set_source_rgb(0, 0, 0); cr.set_line_width(size * 0.16); cr.stroke_preserve()
    cr.set_source_rgb(1, 1, 1); cr.fill()

def avg_color(path):
    s = cairo.ImageSurface.create_from_png(path); d = s.get_data(); st = s.get_stride()
    best, tot = [0, 0, 0], 0
    for y in range(0, 256, 8):
        for x in range(0, 256, 8):
            b, g, r = d[y * st + x * 4], d[y * st + x * 4 + 1], d[y * st + x * 4 + 2]
            sat = max(r, g, b) - min(r, g, b)
            if sat > 60:
                best[0] += r * sat; best[1] += g * sat; best[2] += b * sat; tot += sat
    if not tot: return (0.85, 0.85, 0.9)
    return tuple(min(1, v / tot / 255 * 1.1) for v in best)

def build(cfg, out="badges"):
    os.makedirs(out, exist_ok=True)
    if any("drapeau" in p for p in cfg["participants"]) and not os.path.isdir(FI):
        subprocess.run(["npm", "i", "--prefix", HERE, "--no-save", "flag-icons@7.2.3"], check=True,
                       stdout=subprocess.DEVNULL)
    meta = []
    for i, p in enumerate(cfg["participants"]):
        sq, wd = f"{out}/{i}.png", f"{out}/{i}_w.png"
        if "drapeau" in p:
            import cairosvg
            c = p["drapeau"].lower()
            cairosvg.svg2png(url=f"{FI}/1x1/{c}.svg", write_to=sq, output_width=256, output_height=256)
            cairosvg.svg2png(url=f"{FI}/4x3/{c}.svg", write_to=wd, output_width=320, output_height=240)
            col, sig = avg_color(sq), None
        else:
            cols, motif, sig = p["couleurs"], p.get("motif", "uni"), p.get("sigle", p["nom"][:3].upper())
            for path, w, h in ((sq, 256, 256), (wd, 320, 240)):
                s = cairo.ImageSurface(cairo.FORMAT_ARGB32, w, h); cr = cairo.Context(s)
                pattern(cr, w, h, cols, motif)
                if w == 320: sigle_text(cr, sig, w, h, 150 if len(sig) <= 3 else 600 / len(sig))
                s.write_to_png(path)
            col = hexrgb(p.get("trainee", cols[0] if cols[0].lower() not in ("#ffffff", "#fff") else cols[1]))
        meta.append({"nom": p["nom"], "couleur": col, "sigle": sig})
    json.dump(meta, open(f"{out}/meta.json", "w"), ensure_ascii=False)
    return meta

if __name__ == "__main__":
    print(build(json.load(open(sys.argv[1]))))
