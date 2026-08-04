# -*- coding: utf-8 -*-
"""OLA1 removal + content hygiene for Crack Total (2026-08-04)."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
log: list[str] = []


def note(m: str) -> None:
    log.append(m)
    print(m)


def delete_paths(paths: list[str]) -> None:
    for rel in paths:
        p = ROOT / rel
        if p.exists():
            if p.is_dir():
                import shutil
                shutil.rmtree(p)
            else:
                p.unlink()
            note(f"deleted {rel}")
        else:
            note(f"missing (ok) {rel}")


def strip_html_cards() -> None:
    card_re = re.compile(
        r'\s*<a class="home-game-card[^"]*" href="(?:100-futboleros-dicen|crack-rapido)\.html"[\s\S]*?</a>\s*',
        re.I,
    )
    for name in ("index.html", "games.html"):
        p = ROOT / name
        t = p.read_text(encoding="utf-8")
        nt, n = card_re.subn("\n", t)
        if n:
            p.write_text(nt, encoding="utf-8", newline="\n")
            note(f"{name}: removed {n} game cards")


def clean_sitemap() -> None:
    p = ROOT / "sitemap.xml"
    t = p.read_text(encoding="utf-8")
    t2 = re.sub(
        r'\s*<!--[^>]*crack-rapido[^>]*-->\s*',
        "\n    ",
        t,
        flags=re.I,
    )
    t2 = re.sub(
        r'\s*<url>\s*<loc>https://cracktotal.com/100-futboleros-dicen\.html</loc>[\s\S]*?</url>\s*',
        "\n    ",
        t2,
        flags=re.I,
    )
    t2 = re.sub(
        r'\s*<url>\s*<loc>https://cracktotal.com/(?:crack-rapido|ranking-crackrapido|100-futboleros-dicen)\.html</loc>[\s\S]*?</url>\s*',
        "\n    ",
        t2,
        flags=re.I,
    )
    if t2 != t:
        p.write_text(t2, encoding="utf-8", newline="\n")
        note("sitemap cleaned")


def patch_htaccess() -> None:
    p = ROOT / ".htaccess"
    t = p.read_text(encoding="utf-8")
    block = (
        "\n# Removed games → Games catalog\n"
        "RewriteRule ^crack-rapido\\.html$ /games.html [L,R=301,NC]\n"
        "RewriteRule ^ranking-crackrapido\\.html$ /ranking.html [L,R=301,NC]\n"
        "RewriteRule ^100-futboleros-dicen\\.html$ /games.html [L,R=301,NC]\n"
    )
    if "crack-rapido\\.html$" not in t and "crack-rapido.html" not in t:
        # insert after historia-mundial redirect if present
        anchor = "blog-detail-historia-mundial"
        if anchor in t:
            t = t.replace(
                "RewriteRule ^blog-detail-historia-mundial\\.html$ /blog-detail-worldcups.html [L,R=301,NC]",
                "RewriteRule ^blog-detail-historia-mundial\\.html$ /blog-detail-worldcups.html [L,R=301,NC]"
                + block,
            )
        else:
            t += block
        p.write_text(t, encoding="utf-8", newline="\n")
        note("htaccess redirects added")
    else:
        note("htaccess already has crack-rapido rule or similar")


def patch_webconfig() -> None:
    p = ROOT / "web.config"
    t = p.read_text(encoding="utf-8")
    if 'name="Redirect crack-rapido"' in t:
        note("web.config already patched")
        return
    insert = """
                <rule name="Redirect crack-rapido" enabled="true" stopProcessing="true">
                    <match url="^crack-rapido\\.html$" />
                    <action type="Redirect" url="/games.html" redirectType="Permanent" />
                </rule>
                <rule name="Redirect ranking-crackrapido" enabled="true" stopProcessing="true">
                    <match url="^ranking-crackrapido\\.html$" />
                    <action type="Redirect" url="/ranking.html" redirectType="Permanent" />
                </rule>
                <rule name="Redirect 100-futboleros" enabled="true" stopProcessing="true">
                    <match url="^100-futboleros-dicen\\.html$" />
                    <action type="Redirect" url="/games.html" redirectType="Permanent" />
                </rule>
"""
    needle = 'rule name="Redirect historia-mundial'
    if needle in t:
        # insert before SPA routing - after historia rule
        idx = t.find('<!-- SPA Routing')
        if idx > 0:
            t = t[:idx] + insert + "\n                " + t[idx:]
            p.write_text(t, encoding="utf-8", newline="\n")
            note("web.config redirects added")
            return
    # fallback before SPA
    idx = t.find('rule name="SPA Routing"')
    if idx > 0:
        t = t[:idx] + insert + "\n                <" + t[idx:]
        # fix accidental double
        t = t.replace("<\n                <rule name=\"SPA", "<rule name=\"SPA")
        t = t.replace("<rule name=\"SPA Routing\"", insert + '                <rule name="SPA Routing"', 1) if False else t
        p.write_text(t, encoding="utf-8", newline="\n")
        note("web.config redirects added (fallback)")


def fix_pasala_questions() -> None:
    replacements = [
        (
            "¿Apellido del delantero argentino, figura del Manchester City, apodado 'La Araña'?",
            "¿Apellido del delantero argentino, figura del Atlético de Madrid, apodado 'La Araña'?",
        ),
        (
            "actualmente milita en el Manchester City",
            "milita en el Atlético de Madrid (ex Manchester City)",
        ),
        (
            "que jugó en River Plate y actualmente milita en el Manchester City",
            "que jugó en River Plate y Manchester City, y milita en el Atlético de Madrid",
        ),
        (
            "Mbappé del PSG",
            "Mbappé (ex PSG, Real Madrid)",
        ),
        (
            "figura del PSG, Kylian Mbappé",
            "figura del Real Madrid, Kylian Mbappé",
        ),
    ]
    for fname in ("assets/data/pasalache_2025.json", "assets/data/preguntas_combinadas.json"):
        p = ROOT / fname
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8")
        n = 0
        for a, b in replacements:
            c = text.count(a)
            if c:
                text = text.replace(a, b)
                n += c
        if n:
            # keep JSON valid - replacements are string-only
            p.write_text(text, encoding="utf-8", newline="\n")
        note(f"{fname}: {n} factual string fixes")


def fix_qsm_levels() -> None:
    # Soft reformulations only where "current" framing is wrong
    pairs = [
        ("Julián Álvarez del Manchester City", "Julián Álvarez del Atlético de Madrid"),
        ("Julian Alvarez del Manchester City", "Julian Alvarez del Atlético de Madrid"),
        ("Mbappé del PSG", "Mbappé del Real Madrid"),
        ("Kylian Mbappé (PSG)", "Kylian Mbappé (Real Madrid)"),
    ]
    total = 0
    for i in range(1, 7):
        p = ROOT / f"assets/data/level_{i}.json"
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8")
        n = 0
        for a, b in pairs:
            c = text.count(a)
            if c:
                text = text.replace(a, b)
                n += c
        if n:
            p.write_text(text, encoding="utf-8", newline="\n")
            total += n
            note(f"level_{i}.json: {n} fixes")
    note(f"QSM total fixes: {total}")


def audit_wordle() -> None:
    p = ROOT / "assets/data/wordle_pool.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    fixed = 0
    for item in data:
        if not isinstance(item, dict):
            continue
        club = (item.get("club") or "")
        name = item.get("name") or item.get("answer") or ""
        # Messi club
        if "messi" in str(item.get("answer", "")).lower() or "Messi" in str(name):
            if club and "PSG" in club.upper():
                item["club"] = "Inter Miami"
                fixed += 1
        if "mbapp" in str(item.get("answer", "")).lower() or "Mbapp" in str(name):
            if "PSG" in club.upper() or "Paris" in club:
                item["club"] = "Real Madrid"
                fixed += 1
        if "alvarez" in str(item.get("answer", "")).lower() or "Álvarez" in str(name) or "Alvarez" in str(name):
            if "City" in club or "Manchester" in club:
                item["club"] = "Atlético Madrid"
                fixed += 1
    if fixed:
        p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    note(f"wordle_pool club fixes: {fixed}; entries={len(data)}")


def main() -> None:
    delete_paths(
        [
            "crack-rapido.html",
            "ranking-crackrapido.html",
            "100-futboleros-dicen.html",
            "assets/js/crack-rapido.js",
            "assets/js/100-futboleros-dicen.js",
            "assets/css/crack-rapido.css",
            "assets/css/100-futboleros-dicen.css",
            "assets/data/crack-rapido-mega-questions.json",
        ]
    )
    strip_html_cards()
    clean_sitemap()
    patch_htaccess()
    patch_webconfig()
    fix_pasala_questions()
    fix_qsm_levels()
    audit_wordle()
    note("OLA1+content base done")


if __name__ == "__main__":
    main()
