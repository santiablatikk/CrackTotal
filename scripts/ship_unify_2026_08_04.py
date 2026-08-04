#!/usr/bin/env python3
"""Crack Total ship: visual unify + soft editorial + dead-game hygiene (truth date 2026-08-04)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = "20260804v"

DEAD_FILES = [
    "assets/js/crack-rapido.js",
    "assets/css/crack-rapido.css",
    "assets/data/crack-rapido-mega-questions.json",
    "assets/js/100-futboleros-dicen.js",
    "assets/css/100-futboleros-dicen.css",
]

# Brand accents → Home green family
COLOR_MAP = [
    ("#a651ff", "#79f2a6"),
    ("#A651FF", "#79f2a6"),
    ("#7a3bff", "#22c55e"),
    ("#7A3BFF", "#22c55e"),
    ("#8e44ad", "#79f2a6"),
    ("#8E44AD", "#79f2a6"),
    ("#9b59b6", "#34d399"),
    ("#9B59B6", "#34d399"),
    ("#ff6b9d", "#79f2a6"),
    ("#FF6B9D", "#79f2a6"),
    ("#e91e63", "#22c55e"),
    ("#E91E63", "#22c55e"),
    ("rgba(166,81,255", "rgba(121,242,166"),
    ("rgba(166, 81, 255", "rgba(121, 242, 166"),
    ("rgba(255, 107, 157", "rgba(121, 242, 166"),
    ("rgba(255,107,157", "rgba(121,242,166"),
]

EDITORIAL_SOFT = [
    # framing only — keep verified historical facts intact
    (
        r"revolucionando el fútbol en 2025",
        "revolucionando el fútbol hacia 2026",
    ),
    (
        r"Transformando el Deporte Rey en 2025",
        "Transformando el Deporte Rey hacia 2026",
    ),
    (
        r"Cambiando el Deporte Rey en 2025",
        "Cambiando el Deporte Rey hacia 2026",
    ),
    (
        r"Conquistan el Viejo Continente en 2025",
        "Conquistan el Viejo Continente en 2026",
    ),
    (
        r"Marcarán el Futuro del Deporte Rey en 2025",
        "Marcan el Futuro del Deporte Rey en 2026",
    ),
    (
        r"en 2025 continúan escribiendo",
        "en 2026 continúan escribiendo",
    ),
    (
        r"desafíos únicos en 2025",
        "desafíos únicos en 2026",
    ),
    (
        r"siguen siendo fundamentales en 2025",
        "siguen siendo fundamentales en 2026",
    ),
    (
        r"sigue siendo fundamental en 2025",
        "sigue siendo fundamental en 2026",
    ),
    (
        r"continúa siendo en 2025 el torneo",
        "sigue siendo en 2026 el torneo",
    ),
    (
        r"Impacto Económico y Mediático en 2025",
        "Impacto Económico y Mediático hacia 2026",
    ),
    (
        r"fútbol femenino en Argentina y el mundo en 2025",
        "fútbol femenino en Argentina y el mundo hacia 2026",
    ),
    (
        r"tecnología está revolucionando el fútbol en 2025",
        "tecnología está revolucionando el fútbol hacia 2026",
    ),
    (
        r"River Plate 1-0 Boca Juniors \(Enero 2025\)",
        "River Plate 1-0 Boca Juniors (Supercopa Internacional, enero 2025)",
    ),
    (
        r"Posible transferencia de €200M\+ en 2025-2026",
        "Mercado abierto 2025/26: movimientos millonarios siguen en revisión humana",
    ),
]

FONT_FIX = (
    "family=Poppins:wght@400;500;700&family=Oswald:wght@500;700",
    "family=Montserrat:wght@400;500;600;700;800&family=Oswald:wght@400;700",
)

HOME_DISCOVER_RE = re.compile(
    r'href="assets/css/(home|discover)\.css\?v=[^"]+"'
)


def delete_dead() -> list[str]:
    removed = []
    for rel in DEAD_FILES:
        p = ROOT / rel
        if p.exists():
            p.unlink()
            removed.append(rel)
    return removed


def patch_text(text: str) -> tuple[str, int]:
    n = 0
    for a, b in COLOR_MAP:
        c = text.count(a)
        if c:
            text = text.replace(a, b)
            n += c
    for pat, repl in EDITORIAL_SOFT:
        text2, c = re.subn(pat, repl, text, flags=re.IGNORECASE)
        if c:
            text = text2
            n += c
    if FONT_FIX[0] in text:
        text = text.replace(FONT_FIX[0], FONT_FIX[1])
        n += 1
    text2, c = HOME_DISCOVER_RE.subn(
        lambda m: f'href="assets/css/{m.group(1)}.css?v={CACHE}"', text
    )
    if c:
        text = text2
        n += c
    # QSM/Mentiroso CSS vars rename to home green semantics (keep var names for less JS churn)
    if "--qsm-purple: #79f2a6" in text or "--qsm-purple: #a651ff" in text.replace(
        "#79f2a6", "#a651ff"
    ):
        pass
    text2 = text.replace(
        "background: linear-gradient(135deg, var(--qsm-purple), var(--qsm-purple-2)); color:#fff;",
        "background: linear-gradient(135deg, #79f2a6, #22c55e); color:#04120a;",
    )
    if text2 != text:
        n += text.count(
            "background: linear-gradient(135deg, var(--qsm-purple), var(--qsm-purple-2)); color:#fff;"
        )
        text = text2
    text2 = text.replace(
        ".modal-button.primary { background: linear-gradient(135deg, var(--qsm-purple), var(--qsm-purple-2)); color:#fff; }",
        ".modal-button.primary { background: linear-gradient(135deg, #79f2a6, #22c55e); color:#04120a; }",
    )
    if text2 != text:
        n += 1
        text = text2
    return text, n


def bump_sw() -> bool:
    sw = ROOT / "sw.js"
    text = sw.read_text(encoding="utf-8")
    new = re.sub(
        r"const APP_VERSION = '[^']+';",
        "const APP_VERSION = '3.8.0';",
        text,
        count=1,
    )
    if new != text:
        sw.write_text(new, encoding="utf-8", newline="\n")
        return True
    return False


def main() -> None:
    removed = delete_dead()
    print(f"deleted={len(removed)} {removed}")

    targets = list(ROOT.glob("*.html")) + list((ROOT / "assets" / "css").glob("*.css"))
    total = 0
    touched = []
    for path in targets:
        raw = path.read_text(encoding="utf-8", errors="ignore")
        new, n = patch_text(raw)
        if n and new != raw:
            path.write_text(new, encoding="utf-8", newline="\n")
            touched.append(f"{path.name}:{n}")
            total += n
    print(f"patched_files={len(touched)} edits~={total}")
    for t in touched[:40]:
        print(" ", t)
    print("sw_bumped=", bump_sw())


if __name__ == "__main__":
    main()
