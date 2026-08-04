# -*- coding: utf-8 -*-
"""Ship-ready content + SEO hygiene for Crack Total (truth 2026-08-04)."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRUTH = "2026-08-04"
log: list[str] = []


def note(msg: str) -> None:
    log.append(msg)
    print(msg)


def fix_preguntas() -> None:
    path = ROOT / "assets/data/preguntas_combinadas.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    changed = 0
    replacements = [
        (
            "¿Apellido del delantero argentino, figura del Manchester City, apodado 'La Araña'?",
            "¿Apellido del delantero argentino, figura del Atlético de Madrid, apodado 'La Araña'?",
        ),
        (
            "¿Nombre completo del delantero argentino, campeón del mundo en 2022, apodado 'La Araña', que jugó en River Plate y actualmente milita en el Manchester City?",
            "¿Nombre completo del delantero argentino, campeón del mundo en 2022, apodado 'La Araña', que jugó en River Plate y Manchester City, y milita en el Atlético de Madrid?",
        ),
        (
            "actualmente milita en el Manchester City",
            "milita en el Atlético de Madrid (ex Manchester City)",
        ),
    ]

    def walk(obj):
        nonlocal changed
        if isinstance(obj, dict):
            for k, v in list(obj.items()):
                if isinstance(v, str):
                    nv = v
                    for a, b in replacements:
                        if a in nv:
                            nv = nv.replace(a, b)
                    if nv != v:
                        obj[k] = nv
                        changed += 1
                else:
                    walk(v)
        elif isinstance(obj, list):
            for item in obj:
                walk(item)

    walk(data)
    if changed:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=4) + "\n", encoding="utf-8")
    note(f"preguntas_combinadas.json string fixes: {changed}")


def dedupe_top10() -> None:
    path = ROOT / "assets/data/top10_pool_extended.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        note("top10_pool_extended: unexpected shape")
        return
    seen = set()
    out = []
    for item in data:
        title = (item.get("title") or "").strip().lower()
        if not title or title in seen:
            continue
        seen.add(title)
        out.append(item)
    # re-id sequentially
    for i, item in enumerate(out, start=1000):
        item["id"] = i
    removed = len(data) - len(out)
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    note(f"top10_pool_extended: kept {len(out)}, removed duplicates {removed}")


def patch_generate_top10() -> None:
    path = ROOT / "scripts/generate-top10-pool.js"
    text = path.read_text(encoding="utf-8")
    old = """    // Si aún faltan, duplicar manteniendo el mismo título (sin sufijo "variante")
    while (out.length < 220 && out.length > 0) {
      const base = out[out.length % Math.max(1, SYNTHETIC_TOPICS.length)];
      out.push({ id: idCounter++, title: base.title, source: base.source, answers: base.answers });
    }"""
    new = """    // Prefer unique topics only — never pad the pool with duplicate titles
    // (duplicates bias daily Top10 selection)."""
    if old in text:
        path.write_text(text.replace(old, new), encoding="utf-8")
        note("generate-top10-pool.js: removed duplicate-padding loop")
    else:
        note("generate-top10-pool.js: pad loop already absent or changed")


def update_sitemap_lastmod() -> None:
    path = ROOT / "sitemap.xml"
    text = path.read_text(encoding="utf-8")
    # Update lastmod for all blog-detail and blog.html / index / games
    def bump_block(m):
        loc = m.group(1)
        block = m.group(0)
        if any(
            x in loc
            for x in (
                "blog-detail-",
                "/blog.html",
                "cracktotal.com/</loc>",
                "/games.html",
                "/index.html",
            )
        ) or loc.rstrip("/").endswith("cracktotal.com"):
            block2 = re.sub(r"<lastmod>[^<]+</lastmod>", f"<lastmod>{TRUTH}</lastmod>", block)
            return block2
        return block

    new = re.sub(
        r"<url>\s*<loc>([^<]+)</loc>\s*<lastmod>[^<]+</lastmod>.*?</url>",
        bump_block,
        text,
        flags=re.S,
    )
    # also bump remaining blog lastmods that pattern might miss
    new2 = re.sub(
        r"(<loc>https://cracktotal.com/blog[^<]*</loc>\s*<lastmod>)[^<]+",
        rf"\g<1>{TRUTH}",
        new,
    )
    if new2 != text:
        path.write_text(new2, encoding="utf-8", newline="\n")
        note("sitemap.xml: bumped blog/home/games lastmod to 2026-08-04")
    else:
        note("sitemap.xml: no lastmod changes")


def fix_blog_meta_framing() -> None:
    path = ROOT / "blog-detail-argentinos-europa.html"
    text = path.read_text(encoding="utf-8")
    reps = [
        ("en Europa en 2025:", "en Europa en 2026:"),
        ("Argentinos que Brillan en Europa 2025", "Argentinos que Brillan en Europa 2026"),
    ]
    n = 0
    for a, b in reps:
        if a in text:
            text = text.replace(a, b)
            n += 1
    if n:
        path.write_text(text, encoding="utf-8", newline="\n")
    note(f"argentinos-europa framing fixes: {n}")


def main() -> None:
    fix_preguntas()
    dedupe_top10()
    patch_generate_top10()
    update_sitemap_lastmod()
    fix_blog_meta_framing()
    out = ROOT / "reports"
    # do not create reports per mission rules — print only
    note("done")


if __name__ == "__main__":
    main()
