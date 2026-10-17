"""Habillages visuels des jeux. Chaque vidéo en tire un différent (couleurs, fond, police, décor)."""

def h(x):
    x = x.lstrip("#"); return tuple(int(x[i:i + 2], 16) / 255 for i in (0, 2, 4))

THEMES = {
    "neon": dict(bg=("#0A0F26", "#120A2B"), fond="grille", ligne=h("#59E6FF"), clou=h("#EAF8FF"),
                 bump=h("#FF4088"), moulin=h("#FFCC33"), accent=h("#FFCC33"), accent2=h("#FF4088"),
                 mur=h("#1A2150"), police="Inter Display", gras=True, lueur=True),
    "stade": dict(bg=("#0E5A2A", "#0A3F1E"), fond="pelouse", ligne=h("#FFFFFF"), clou=h("#FFFFFF"),
                  bump=h("#FFD400"), moulin=h("#FF5A1F"), accent=h("#FFD400"), accent2=h("#FFFFFF"),
                  mur=h("#0B3B1C"), police="Anton", gras=False, lueur=False),
    "lave": dict(bg=("#1A0503", "#3A0A04"), fond="braises", ligne=h("#FF7A1A"), clou=h("#FFD08A"),
                 bump=h("#FF2E1F"), moulin=h("#FFB000"), accent=h("#FFB000"), accent2=h("#FF2E1F"),
                 mur=h("#2B0804"), police="Bungee", gras=False, lueur=True),
    "glace": dict(bg=("#0B2A4A", "#103E66"), fond="flocons", ligne=h("#BDF3FF"), clou=h("#FFFFFF"),
                  bump=h("#7FD7FF"), moulin=h("#E0F7FF"), accent=h("#9BE7FF"), accent2=h("#FFFFFF"),
                  mur=h("#0A2340"), police="Russo One", gras=False, lueur=True),
    "bonbon": dict(bg=("#3B1259", "#7A1F6E"), fond="pois", ligne=h("#FF9AD5"), clou=h("#FFF2A8"),
                   bump=h("#6EF0C2"), moulin=h("#FFE14D"), accent=h("#FFE14D"), accent2=h("#6EF0C2"),
                   mur=h("#2C0D45"), police="Luckiest Guy", gras=False, lueur=False),
    "desert": dict(bg=("#3D2412", "#6B3F1D"), fond="dunes", ligne=h("#F2C27B"), clou=h("#FFF1D6"),
                   bump=h("#E86A33"), moulin=h("#FFE0A3"), accent=h("#FFD27A"), accent2=h("#E86A33"),
                   mur=h("#2E1A0C"), police="Bebas Neue", gras=False, lueur=False),
    "espace": dict(bg=("#03030C", "#0B0726"), fond="etoiles", ligne=h("#B98CFF"), clou=h("#FFFFFF"),
                   bump=h("#00E5A8"), moulin=h("#FF7AE6"), accent=h("#FFE066"), accent2=h("#B98CFF"),
                   mur=h("#100A2E"), police="Righteous", gras=False, lueur=True),
    "or": dict(bg=("#0B0B0B", "#1C1710"), fond="losanges", ligne=h("#E8C26B"), clou=h("#FFF4D6"),
               bump=h("#C9A13B"), moulin=h("#E8C26B"), accent=h("#F2D27A"), accent2=h("#FFFFFF"),
               mur=h("#14110B"), police="Bebas Neue", gras=False, lueur=False),
    "militaire": dict(bg=("#1E2614", "#2E3A1E"), fond="camouflage", ligne=h("#D9E3A0"), clou=h("#F0F0D8"),
                      bump=h("#E05A2A"), moulin=h("#F2C14E"), accent=h("#F2C14E"), accent2=h("#E05A2A"),
                      mur=h("#141A0C"), police="Black Ops One", gras=False, lueur=False),
}
for k, v in THEMES.items():
    v["nom"] = k
    v["bg"] = (h(v["bg"][0]), h(v["bg"][1]))
