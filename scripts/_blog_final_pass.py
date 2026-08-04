# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

blog = ROOT / "blog.html"
t = blog.read_text(encoding="utf-8")
t2 = t.replace(
    "Desde Uruguay 1930 hasta Qatar 2022, repasamos los momentos más memorables y las historias detrás de la competición más importante del planeta.",
    "Desde Uruguay 1930 hasta el Mundial 2026 —con España campeón ante Argentina—, repasamos momentos, récords e historias de la Copa del Mundo.",
)
t2 = t2.replace(
    "La UEFA Champions League, anteriormente conocida como Copa de Europa, es el torneo de clubes más prestigioso del mundo. Descubre su evolución desde 1955 hasta hoy.",
    "De la Copa de Europa a la era moderna: el nuevo formato y el primer título de Paris Saint-Germain en la Champions 2024/25.",
)
if t2 != t:
    blog.write_text(t2, encoding="utf-8", newline="\n")
    print("blog.html cards updated")

hm = ROOT / "blog-detail-historia-mundial.html"
t = hm.read_text(encoding="utf-8")
note = (
    '<p class="article-update-note" style="color:var(--home-muted,#aebbd0);font-size:0.92rem;">'
    '<i class="fas fa-sync-alt" aria-hidden="true"></i> Actualizado: 4 de Agosto, 2026.</p>'
)
if "article-update-note" not in t:
    t = t.replace(
        '<span class="article-date"><i class="fas fa-calendar-alt"></i> 4 Agosto, 2026</span>',
        '<span class="article-date"><i class="fas fa-calendar-alt"></i> 4 Agosto, 2026</span>\n                    ' + note,
        1,
    )
t = t.replace(
    "Historia Completa de los Mundiales de Fútbol (1930-2022)",
    "Historia Completa de los Mundiales de Fútbol (1930-2026)",
)
t = t.replace(
    "Desde sus humildes comienzos en Uruguay en 1930 hasta el espectacular torneo de Qatar en 2022, la Copa del Mundo FIFA ha evolucionado hasta convertirse en un fenómeno global que trasciende las fronteras del deporte.",
    "Desde Uruguay 1930 hasta Qatar 2022 y el Mundial 2026 —donde España se coronó ante Argentina—, la Copa del Mundo FIFA sigue siendo un fenómeno global que trasciende las fronteras del deporte.",
)
hm.write_text(t, encoding="utf-8", newline="\n")
print("historia-mundial updated")

flags = []
for p in list(ROOT.glob("blog*.html")) + [ROOT / "index.html"]:
    text = p.read_text(encoding="utf-8")
    for pat in [
        "actual campeón del mundo",
        "Messi en el PSG",
        "Rumbo a 2026",
        "próximo Mundial 2026",
        "Champions League (ciclo",
        "hasta 2025",
        "30 Enero",
    ]:
        if pat in text:
            flags.append(f"{p.name}: {pat}")

missing_dates = []
for p in ROOT.glob("blog-detail-*.html"):
    text = p.read_text(encoding="utf-8")
    if "4 Agosto, 2026" not in text and "4 de Agosto, 2026" not in text:
        missing_dates.append(p.name)
    if "dateModified" in text and '"dateModified": "2026-08-04"' not in text:
        missing_dates.append(p.name + ":schema")

print("FLAGS:", flags or "none")
print("missing dates:", missing_dates or "none")
