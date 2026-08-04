# -*- coding: utf-8 -*-
"""Map blog pages: dates + outdated football signals."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FLAGS = [
    ("messi_psg", re.compile(r"messi.{0,40}psg|psg.{0,40}messi", re.I | re.S)),
    ("mbappe_psg", re.compile(r"mbapp[eé].{0,40}(psg|paris saint)| (psg|paris).{0,40}mbapp", re.I | re.S)),
    ("argentina_actual_wc", re.compile(r"argentina.{0,50}(actual|vigente|sigue siendo).{0,30}campe[oó]n|campe[oó]n(a)? (actual|vigente) del mundo.{0,20}argentina", re.I | re.S)),
    ("ultimo_mundial_sin_anio", re.compile(r"último mundial(?!\s*20)|mundial m[aá]s reciente(?!\s*20)", re.I)),
    ("ballon_actual", re.compile(r"bal[oó]n de oro (actual|vigente|m[aá]s reciente|último)", re.I)),
    ("champions_actual_madrid", re.compile(r"(última|ultimo|actual|vigente).{0,30}champions.{0,40}(real madrid|madrid)|real madrid.{0,30}(última|actual).{0,20}champions", re.I | re.S)),
    ("libertadores_botafogo", re.compile(r"(última|actual|vigente).{0,30}libertadores.{0,30}botafogo|botafogo.{0,30}(última|actual).{0,20}libertadores", re.I | re.S)),
    ("actualmente", re.compile(r"actualmente", re.I)),
    ("date_2024", re.compile(r"2024")),
    ("date_2025", re.compile(r"2025")),
    ("hasta_2025_meta", re.compile(r"hasta 2025|en 2025|2025:", re.I)),
]

date_pats = [
    re.compile(r"blog-date[^>]*>.*?(\d{1,2}\s+\w+,?\s+\d{4})", re.I | re.S),
    re.compile(r"(Publicado|Actualizado|Última actualización)[:\s]*([^<\n]+)", re.I),
    re.compile(r'"datePublished"\s*:\s*"([^"]+)"'),
    re.compile(r'"dateModified"\s*:\s*"([^"]+)"'),
    re.compile(r"content=\"(20\d{2}-\d{2}-\d{2})"),
]


def extract_dates(text: str):
    found = []
    for pat in date_pats:
        for m in pat.finditer(text):
            found.append(m.group(0)[:80] if m.lastindex is None else m.group(m.lastindex))
    # also plain visible dates like 27 Julio, 2024
    found += re.findall(r"\d{1,2}\s+[A-Za-zÁÉÍÓÚáéíóú]+,?\s+20\d{2}", text)[:5]
    return list(dict.fromkeys(found))[:8]


def main():
    details = sorted(ROOT.glob("blog-detail-*.html"))
    blog = (ROOT / "blog.html").read_text(encoding="utf-8", errors="ignore")
    cards = re.findall(r'href="(blog-detail-[^"]+\.html)"', blog)
    inventory = []
    for path in details:
        text = path.read_text(encoding="utf-8", errors="ignore")
        title_m = re.search(r"<title>([^<]+)</title>", text, re.I)
        hits = {k: len(rx.findall(text)) for k, rx in FLAGS if rx.search(text)}
        p0 = any(k in hits for k in [
            "messi_psg", "mbappe_psg", "argentina_actual_wc", "ballon_actual",
            "champions_actual_madrid", "libertadores_botafogo",
        ])
        p1 = "actualmente" in hits or "date_2024" in hits
        priority = "P0" if p0 else ("P1" if p1 else "P2")
        inventory.append({
            "file": path.name,
            "title": (title_m.group(1) if title_m else "")[:90],
            "inBlogIndex": path.name in cards,
            "dates": extract_dates(text),
            "flags": hits,
            "priority": priority,
        })

    # blog.html card dates
    card_dates = re.findall(r'blog-date.*?</span>', blog, flags=re.I | re.S)
    report = {
        "truthDate": "2026-08-04",
        "blogIndexCards": len(cards),
        "uniqueCards": sorted(set(cards)),
        "detailsCount": len(details),
        "cardDateSamples": [re.sub(r"<[^>]+>", " ", c).strip()[:60] for c in card_dates[:15]],
        "inventory": inventory,
        "priorityCounts": {
            "P0": sum(1 for i in inventory if i["priority"] == "P0"),
            "P1": sum(1 for i in inventory if i["priority"] == "P1"),
            "P2": sum(1 for i in inventory if i["priority"] == "P2"),
        },
    }
    out = ROOT / "reports" / "blog_audit_2026-08-04.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "details": len(details),
        "cards": len(set(cards)),
        "priorityCounts": report["priorityCounts"],
        "report": str(out),
        "p0": [i["file"] for i in inventory if i["priority"] == "P0"],
        "sample": inventory[:5],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
