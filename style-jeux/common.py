"""Outils de dessin partagés par tous les jeux (cairo, 1080x1920)."""
import math, random, subprocess
import cairo

W, H, FPS = 1080, 1920, 30


def ease(x):
    x = max(0, min(1, x)); return x * x * (3 - 2 * x)


def back(x):
    x = max(0, min(1, x)); c = 1.7
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2


def rrect(cr, x, y, w, h, r):
    cr.new_sub_path()
    cr.arc(x + w - r, y + r, r, -math.pi / 2, 0); cr.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    cr.arc(x + r, y + h - r, r, math.pi / 2, math.pi); cr.arc(x + r, y + r, r, math.pi, 1.5 * math.pi)
    cr.close_path()


class Painter:
    def __init__(self, theme, parts, seed):
        """parts : liste de dicts {nom, couleur, sigle, img, imgw} (ordre = index des billes)."""
        self.th, self.parts = theme, parts
        self.img = [cairo.ImageSurface.create_from_png(p["img"]) for p in parts]
        self.imgw = [cairo.ImageSurface.create_from_png(p["imgw"]) for p in parts]
        r = random.Random(seed)
        self.deco = [(r.uniform(0, W), r.uniform(0, 4000), r.uniform(0.3, 1), r.uniform(0, 6.28)) for _ in range(140)]
        self.conf = [(r.uniform(0, W), r.uniform(-1600, 0), r.uniform(250, 520), r.uniform(0, 6.28),
                      r.choice([theme["accent"], theme["accent2"], theme["ligne"], (1, 1, 1)])) for _ in range(170)]

    # ---------- texte ----------
    def text(self, cr, s, x, y, size, color=(1, 1, 1), a=1.0, align="c", shadow=True, light=False, font=None):
        th = self.th
        fam = font or (th["police"] if not light else "Inter Display")
        wt = cairo.FONT_WEIGHT_BOLD if (th["gras"] and not light and not font) else cairo.FONT_WEIGHT_NORMAL
        if font: wt = cairo.FONT_WEIGHT_BOLD
        cr.select_font_face(fam, cairo.FONT_SLANT_NORMAL, wt)
        cr.set_font_size(size)
        e = cr.text_extents(s)
        if align == "c" and e.width > W - 80:            # ne jamais déborder de l'écran
            size *= (W - 80) / e.width; cr.set_font_size(size); e = cr.text_extents(s)
        tx = x - (e.width / 2 + e.x_bearing) if align == "c" else (x if align == "l" else x - e.width - e.x_bearing)
        if shadow:
            cr.set_source_rgba(0, 0, 0, 0.55 * a); cr.move_to(tx + 3, y + 4); cr.show_text(s)
        cr.set_source_rgba(*color, a); cr.move_to(tx, y); cr.show_text(s)
        return e.width

    # ---------- fond ----------
    def background(self, cr, oy=0.0, t=0.0):
        th = self.th; b1, b2 = th["bg"]
        g = cairo.LinearGradient(0, 0, 0, H)
        g.add_color_stop_rgb(0, *b1); g.add_color_stop_rgb(1, *b2)
        cr.set_source(g); cr.paint()
        f = th["fond"]
        if f == "grille":
            cr.set_source_rgba(1, 1, 1, 0.045); cr.set_line_width(2)
            step = 120; y = -(oy * 0.6) % step - step
            while y < H: cr.move_to(0, y); cr.line_to(W, y); y += step
            for x in range(0, W + 1, step): cr.move_to(x, 0); cr.line_to(x, H)
            cr.stroke()
        elif f == "pelouse":
            step = 160; y = -(oy % (2 * step)) - 2 * step; j = 0
            while y < H:
                cr.set_source_rgba(1, 1, 1, 0.05 if j % 2 else 0.0); cr.rectangle(0, y, W, step); cr.fill()
                y += step; j += 1
        elif f == "pois":
            step = 140; off = -(oy * 0.5) % step
            cr.set_source_rgba(1, 1, 1, 0.06)
            for yy in range(-1, H // step + 2):
                for xx in range(0, W // step + 2):
                    cr.arc(xx * step + (step / 2 if yy % 2 else 0), yy * step + off, 18, 0, 6.29); cr.fill()
        elif f == "dunes":
            for j in range(7):
                base = (j * 330 - oy * 0.4) % 2300 - 200
                cr.move_to(0, H); cr.line_to(0, base)
                for x in range(0, W + 41, 40):
                    cr.line_to(x, base + 40 * math.sin(x / 170 + j))
                cr.line_to(W, H); cr.close_path()
                cr.set_source_rgba(1, 0.85, 0.6, 0.035); cr.fill()
        elif f == "losanges":
            cr.set_source_rgba(*th["ligne"], 0.07); cr.set_line_width(2)
            step = 150; off = -(oy * 0.5) % step
            for k in range(-15, 25):
                cr.move_to(k * step, off - step); cr.line_to(k * step + H, H + off)
                cr.move_to(k * step, off - step); cr.line_to(k * step - H, H + off)
            cr.stroke()
        elif f == "camouflage":
            for (x, y, s, p) in self.deco[:60]:
                yy = (y - oy * 0.5) % 2400 - 240
                cr.set_source_rgba(0, 0, 0, 0.12 if p > 3 else 0.0)
                cr.save(); cr.translate(x, yy); cr.scale(1.6, 0.8); cr.arc(0, 0, 90 * s, 0, 6.29); cr.restore(); cr.fill()
                cr.set_source_rgba(0.6, 0.65, 0.35, 0.07 if p <= 3 else 0.0)
                cr.save(); cr.translate(x + 60, yy + 50); cr.scale(1.3, 0.9); cr.arc(0, 0, 70 * s, 0, 6.29); cr.restore(); cr.fill()
        else:   # particules : etoiles / flocons / braises
            for (x, y, s, p) in self.deco:
                if f == "etoiles":
                    yy = (y - oy * 0.25 * s) % 2200 - 140; a = 0.35 + 0.5 * abs(math.sin(t * 2 + p)); rad = 1.5 + 2 * s
                    cr.set_source_rgba(1, 1, 1, a * s)
                elif f == "flocons":
                    yy = (y + t * 60 * s - oy * 0.4) % 2200 - 140; rad = 2 + 4 * s
                    x = x + 20 * math.sin(t + p); cr.set_source_rgba(1, 1, 1, 0.35 * s)
                else:  # braises
                    yy = (y - t * 90 * s - oy * 0.4) % 2200 - 140; rad = 2 + 4 * s
                    cr.set_source_rgba(1, 0.55 + 0.3 * s, 0.15, 0.55 * s)
                cr.arc(x, yy, rad, 0, 6.29); cr.fill()

    # ---------- formes ----------
    def line(self, cr, a, b, w, col, oy=0.0):
        cr.set_line_cap(cairo.LINE_CAP_ROUND)
        steps = ((w + 22, 0.10), (w + 10, 0.22), (w, 1.0)) if self.th["lueur"] else ((w + 6, 0.35), (w, 1.0))
        for lw, al in steps:
            cr.set_source_rgba(*(col if self.th["lueur"] or al == 1.0 else (0, 0, 0)), al); cr.set_line_width(lw)
            cr.move_to(a[0], a[1] - oy); cr.line_to(b[0], b[1] - oy); cr.stroke()

    def ball(self, cr, x, y, ang, i, r, ring=(1, 1, 1), ringw=4, alpha=1.0, gray=False):
        cr.save()
        if alpha < 1: cr.push_group()
        cr.set_source_rgba(0, 0, 0, 0.35); cr.arc(x + 5, y + 8, r, 0, 2 * math.pi); cr.fill()
        cr.save(); cr.translate(x, y); cr.rotate(ang)
        cr.arc(0, 0, r, 0, 2 * math.pi); cr.clip()
        s = 2 * r / 256; cr.scale(s, s); cr.set_source_surface(self.img[i], -128, -128); cr.paint()
        cr.restore()
        g = cairo.RadialGradient(x - r * 0.35, y - r * 0.4, 0, x - r * 0.35, y - r * 0.4, r * 1.1)
        g.add_color_stop_rgba(0, 1, 1, 1, 0.45); g.add_color_stop_rgba(0.5, 1, 1, 1, 0.0); g.add_color_stop_rgba(1, 0, 0, 0, 0.35)
        cr.set_source(g); cr.arc(x, y, r, 0, 2 * math.pi); cr.fill()
        cr.set_source_rgb(*ring); cr.set_line_width(ringw); cr.arc(x, y, r, 0, 2 * math.pi); cr.stroke()
        sg = self.parts[i].get("sigle")
        if sg:
            fs = r * (0.78 if len(sg) <= 3 else 2.4 / len(sg))
            cr.select_font_face("Inter Display", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD); cr.set_font_size(fs)
            e = cr.text_extents(sg)
            cr.move_to(x - e.width / 2 - e.x_bearing, y - e.height / 2 - e.y_bearing); cr.text_path(sg)
            cr.set_source_rgb(0, 0, 0); cr.set_line_width(fs * 0.18); cr.stroke_preserve()
            cr.set_source_rgb(1, 1, 1); cr.fill()
        if gray:
            cr.set_source_rgba(0.1, 0.1, 0.12, 0.6); cr.arc(x, y, r, 0, 2 * math.pi); cr.fill()
            cr.set_source_rgb(1, 0.2, 0.25); cr.set_line_width(max(3, r * 0.16)); cr.set_line_cap(cairo.LINE_CAP_ROUND)
            d = r * 0.55; cr.move_to(x - d, y - d); cr.line_to(x + d, y + d); cr.move_to(x + d, y - d); cr.line_to(x - d, y + d); cr.stroke()
        if alpha < 1:
            cr.pop_group_to_source(); cr.paint_with_alpha(alpha)
        cr.restore()

    def flag_rect(self, cr, i, x, y, w, h, a=1.0):
        cr.save(); cr.translate(x, y); rrect(cr, 0, 0, w, h, 8); cr.clip(); cr.scale(w / 320, h / 240)
        cr.set_source_surface(self.imgw[i], 0, 0); cr.paint_with_alpha(a); cr.restore()

    def panel(self, cr, x, y, w, h, a=1.0):
        rrect(cr, x, y, w, h, 30)
        cr.set_source_rgba(0.02, 0.03, 0.08, 0.78 * a); cr.fill_preserve()
        cr.set_source_rgba(1, 1, 1, 0.14 * a); cr.set_line_width(2); cr.stroke()

    def podium_hud(self, cr, rank, a=1.0):
        """Bandeau du haut : 3 premiers."""
        self.panel(cr, 70, 150, 940, 128, a)
        medal = [self.th["accent"], (0.82, 0.85, 0.9), (0.85, 0.55, 0.3)]
        for j in range(min(3, len(rank))):
            i = rank[j]; x0 = 95 + j * 310
            cr.set_source_rgba(*medal[j], a); cr.arc(x0 + 26, 214, 24, 0, 2 * math.pi); cr.fill()
            self.text(cr, str(j + 1), x0 + 26, 225, 30, color=(0.08, 0.08, 0.1), a=a, shadow=False, font="Inter Display")
            self.flag_rect(cr, i, x0 + 64, 192, 58, 44, a)
            name = self.parts[i]["nom"]
            self.text(cr, name, x0 + 132, 226, 32 if len(name) <= 8 else 27, a=a, align="l", font="Inter Display")

    def survivors_hud(self, cr, alive, a=1.0):
        """Bandeau du haut pour les jeux à élimination : restants + tous les participants."""
        n = len(alive); nb = sum(alive)
        self.panel(cr, 50, 140, 980, 150, a)
        self.text(cr, f"RESTANTS : {nb}", W / 2, 192, 40, color=self.th["accent"], a=a, shadow=False)
        sp = min(92, 900 / n); x0 = W / 2 - sp * (n - 1) / 2
        for i in range(n):
            self.ball(cr, x0 + i * sp, 245, 0, i, r=min(30, sp * 0.4), ringw=2, alpha=a, gray=not alive[i])

    def elim_popup(self, cr, i, e, y=420):
        """Bandeau « X éliminé » pendant ~1,4 s."""
        if e < 0 or e > 1.4: return
        a = ease(e / 0.15) * (1 - ease((e - 1.1) / 0.3))
        sc = back(e / 0.25)
        cr.save(); cr.translate(W / 2, y); cr.scale(sc, sc)
        rrect(cr, -330, -55, 660, 110, 55); cr.set_source_rgba(0.75, 0.05, 0.1, 0.9 * a); cr.fill()
        self.ball(cr, -265, 0, 0, i, r=40, alpha=a)
        self.text(cr, f"{self.parts[i]['nom']} éliminé", 40, 16, 46, a=a, font="Inter Display")
        cr.restore()

    # ---------- intro / outro ----------
    def intro_overlay(self, cr, T, cfg, n):
        th = self.th
        cr.set_source_rgba(0, 0, 0, 0.45); cr.paint()
        ap = ease(T / 0.35)
        self.text(cr, cfg.get("titre1", "QUI"), W / 2, 330, 104, a=ap)
        self.text(cr, cfg.get("titre2", "VA GAGNER ?"), W / 2, 450, 104, color=th["accent"], a=ap)
        self.text(cr, cfg.get("sous_titre", ""), W / 2, 540, 44, a=ap * 0.95, light=True)
        # grille des participants
        cols = 3 if n <= 6 else (5 if n <= 10 else (5 if n <= 15 else 6))
        rows = (n + cols - 1) // cols
        big = n <= 10
        br, dx, dy = (62, 190, 210) if big else (46, 165, 160)
        for i in range(n):
            rr, cc = divmod(i, cols)
            cnt = min(cols, n - rr * cols)
            x = W / 2 + (cc - (cnt - 1) / 2) * dx
            y = 700 + rr * dy
            a = ease((T - 0.15 - i * 0.05) / 0.25)
            if a <= 0: continue
            cr.save(); cr.translate(x, y); s = back((T - 0.15 - i * 0.05) / 0.35); cr.scale(s, s)
            self.ball(cr, 0, 0, 0, i, r=br, ringw=4)
            cr.restore()
            nm = self.parts[i]["nom"]
            if not self.parts[i].get("numero"):
                self.text(cr, nm, x, y + br + 46, (30 if len(nm) <= 10 else 25) * (1 if big else 0.85), a=a, font="Inter Display")
        cd = T - 1.6
        if cd >= 0:
            k = int(cd); lab = ["3", "2", "1", "GO !"][min(k, 3)]; frac = cd - k
            s = 1 + 0.6 * (1 - ease(frac / 0.4)); al = 1 - ease((frac - 0.6) / 0.4) if k < 3 else 1
            cr.save(); cr.translate(W / 2, 700 + rows * dy + 200); cr.scale(s, s)
            self.text(cr, lab, 0, 70, 220, color=th["accent2"] if k == 3 else (1, 1, 1), a=al)
            cr.restore()

    def victory_flash(self, cr, e, label="VICTOIRE !"):
        cr.set_source_rgba(1, 1, 1, 0.5 * max(0, 1 - e / 8)); cr.paint()
        sc = back(e / 12)
        cr.save(); cr.translate(W / 2, 1020); cr.scale(sc, sc)
        self.text(cr, label, 0, 0, 140, color=self.th["accent"])
        cr.restore()

    def outro(self, cr, e, winner, rank, cfg, titre="LE VAINQUEUR"):
        th = self.th
        cr.set_source_rgba(0.02, 0.02, 0.06, 0.9 * ease(e / 0.4)); cr.paint()
        cr.save(); cr.translate(W / 2, 760); cr.rotate(e * 0.4)
        for j in range(16):
            cr.move_to(0, 0); cr.arc(0, 0, 900, j * math.pi / 8, j * math.pi / 8 + math.pi / 16); cr.close_path()
        cr.set_source_rgba(*th["accent"], 0.10 * ease(e / 0.5)); cr.fill(); cr.restore()
        self.text(cr, titre, W / 2, 360, 72, a=ease(e / 0.3))
        sc = back(e / 0.6)
        if sc > 0.01:
            cr.save(); cr.translate(W / 2, 760); cr.scale(sc, sc)
            cr.set_source_rgba(*th["accent"], 0.35); cr.arc(0, 0, 215, 0, 2 * math.pi); cr.fill()
            self.ball(cr, 0, 0, math.sin(e * 2) * 0.15, winner, r=180, ring=th["accent"], ringw=12)
            cr.restore()
        self.text(cr, self.parts[winner]["nom"].upper(), W / 2, 1095, 120, color=th["accent"], a=ease((e - 0.3) / 0.3))
        for j, (xx, lab) in enumerate(((330, "2e"), (750, "3e"))):
            if j + 1 >= len(rank): break
            i = rank[j + 1]; al = ease((e - 0.8 - j * 0.2) / 0.3)
            if al > 0:
                cr.save(); cr.translate(xx, 1250); cr.scale(al, al); self.ball(cr, 0, 0, 0, i, r=62); cr.restore()
                self.text(cr, lab + "  " + self.parts[i]["nom"], xx, 1360, 40, a=al, font="Inter Display")
        al = ease((e - 1.4) / 0.4)
        self.text(cr, cfg.get("question_fin", "Ton choix a gagné ?"), W / 2, 1480, 56, a=al, font="Inter Display")
        self.text(cr, "Dis-le en commentaire !", W / 2, 1550, 56, color=th["accent2"], a=al, font="Inter Display")
        for (x0, y0, v, ph, col) in self.conf:
            y = y0 + v * e * 1.6
            if 0 < y < H:
                x = x0 + 40 * math.sin(e * 3 + ph)
                cr.save(); cr.translate(x, y); cr.rotate(e * 5 + ph)
                cr.set_source_rgb(*col); cr.rectangle(-9, -5, 18, 10); cr.fill(); cr.restore()


class Encoder:
    def __init__(self, path):
        self.surf = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H)
        self.cr = cairo.Context(self.surf)
        self.p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgra",
                                   "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
                                   "-crf", "19", "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)

    def push(self):
        self.surf.flush(); self.p.stdin.write(bytes(self.surf.get_data()))

    def close(self):
        self.p.stdin.close(); self.p.wait()
