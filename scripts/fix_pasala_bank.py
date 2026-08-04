#!/usr/bin/env python3
"""Fix Pasala Che bank: letter rule already enforced; polish factual/orto; revalidate 0 issues."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "assets" / "data" / "pasalache_2025.json"
REPORT = ROOT / "scripts" / "_pasala_fix_report.md"

CONTIENE_RE = re.compile(r"^CONTIENE\s+([A-ZÑÁÉÍÓÚÜ]):", re.I)


def strip(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower().strip()


# Exact pregunta -> (new_pregunta, new_respuesta, tipo)
REPLACEMENTS: dict[str, tuple[str, str, str]] = {
    "CONTIENE C: ¿Nombre del extremo brasileño del Real Madrid, figura en 2024?": (
        "CONTIENE C: ¿Nombre del extremo brasileño del Real Madrid, Vinicius …?",
        "Vinicius Junior",
        "factual",
    ),
    "¿Apellido del extremo brasileño del Real Madrid, figura en 2024?": (
        "¿Apellido del extremo brasileño estrella del Real Madrid?",
        "Vinicius",
        "factual",
    ),
    "¿Club italiano de Florencia que juega en el Artemio Franchi?": (
        "¿Club italiano de Florencia con estadio Artemio Franchi?",
        "Fiorentina",
        "orto",
    ),
    "¿Nombre y apellido del extremo inglés del Manchester United, Jadon …?": (
        "¿Nombre y apellido del extremo inglés surgido en Manchester United, Jadon …?",
        "Jadon Sancho",
        "factual",
    ),
    "¿Apellido del delantero inglés del Manchester United, Marcus …?": (
        "¿Apellido del delantero inglés ídolo de Manchester United, Marcus …?",
        "Rashford",
        "factual",
    ),
    "¿Nombre y apellido del joven mediapunta neerlandés del PSG/RB Leipzig, Xavi …?": (
        "¿Nombre y apellido del mediapunta neerlandés Xavi …, figura en Leipzig y PSG?",
        "Xavi Simons",
        "factual",
    ),
    "¿Apellido del Balón de Oro 2018, Luka …?": (
        "¿Apellido del Balón de Oro 2018, Luka …?",
        "Modrić",
        "orto",
    ),
    "¿Apellido del delantero inglés del Bayern/Spurs, Harry …?": (
        "¿Apellido del delantero inglés del Bayern Múnich, Harry …?",
        "Kane",
        "factual",
    ),
    "¿Nombre y apellido del central brasileño del Chelsea, … Silva?": (
        "¿Nombre y apellido del central brasileño leyenda de Milan, PSG y Chelsea, … Silva?",
        "Thiago Silva",
        "factual",
    ),
    "¿Apellido del delantero argentino del Galatasaray, Mauro …?": (
        "¿Apellido del delantero argentino ídolo de Inter y Galatasaray, Mauro …?",
        "Icardi",
        "factual",
    ),
    "¿Apellido del extremo argentino del Sevilla, Lucas …?": (
        "¿Apellido del extremo argentino que brilló en Sevilla, Lucas …?",
        "Ocampos",
        "factual",
    ),
    "¿Apellido del mediocampista brasileño del West Ham, Lucas …?": (
        "¿Apellido del mediocampista brasileño que juega en West Ham, Lucas …?",
        "Paquetá",
        "factual",
    ),
    "¿Club inglés donde ataja Emiliano 'Dibu' Martínez?": (
        "¿Club inglés donde se consagró Emiliano 'Dibu' Martínez como titular?",
        "Aston Villa",
        "factual",
    ),
    "¿Apellido del entrenador del Manchester City desde 2016?": (
        "¿Apellido del entrenador del Manchester City campeón de Europa 2023?",
        "Guardiola",
        "factual",
    ),
    "¿Entrenador del Liverpool en la temporada 2024/25?": (
        "¿Entrenador neerlandés del Liverpool en la temporada 2024/25?",
        "Arne Slot",
        "factual",
    ),
}


def letter_issues(data: list) -> list:
    issues = []
    for block in data:
        L = block["letra"]
        exp = strip(L)[0]
        for q in block["preguntas"]:
            p, r = q["pregunta"], q["respuesta"]
            rn = strip(r)
            m = CONTIENE_RE.match(p.strip())
            if m:
                declared = strip(m.group(1))[0]
                if declared != exp:
                    issues.append(("CONTIENE_LETTER_MISMATCH", L, p, r))
                if exp not in rn:
                    issues.append(("CONTIENE_MISS", L, p, r))
            else:
                if p.upper().startswith("CONTIENE"):
                    issues.append(("CONTIENE_BAD_FORMAT", L, p, r))
                if not rn.startswith(exp):
                    issues.append(("START_MISS", L, p, r))
    return issues


def main() -> None:
    data = json.loads(PATH.read_text(encoding="utf-8"))
    before = letter_issues(data)
    fixes = []

    for block in data:
        for q in block["preguntas"]:
            key = q["pregunta"]
            if key in REPLACEMENTS:
                np, nr, tipo = REPLACEMENTS[key]
                old = (q["pregunta"], q["respuesta"])
                q["pregunta"], q["respuesta"] = np, nr
                fixes.append(
                    {
                        "tipo": tipo,
                        "letra": block["letra"],
                        "antes": f"{old[0]} → {old[1]}",
                        "despues": f"{np} → {nr}",
                    }
                )

    after = letter_issues(data)
    if after:
        raise SystemExit(f"ABORT: letter issues remain: {after}")

    PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Pasala Che fix report",
        "",
        f"- Letter issues before: **{len(before)}**",
        f"- Letter issues after: **{len(after)}**",
        f"- Fixes applied: **{len(fixes)}**",
        f"- Total questions: **{sum(len(b['preguntas']) for b in data)}**",
        "",
        "## Fixes",
        "",
    ]
    for f in fixes:
        lines.append(f"- **{f['tipo']}** [{f['letra']}] {f['antes']}")
        lines.append(f"  - → {f['despues']}")
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"before={len(before)} after={len(after)} fixes={len(fixes)}")
    for f in fixes:
        print(f"[{f['tipo']}] {f['letra']}: {f['despues'][:90]}")


if __name__ == "__main__":
    main()
