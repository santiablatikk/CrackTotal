# -*- coding: utf-8 -*-
"""Pasada final de ortografia ES-AR sobre preguntas y respuestas de los bancos Pasala."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"

RULES = [
    (re.compile(r"\bBayern Munich\b"), "Bayern Múnich"),
    (re.compile(r"\bBayern Mun\b"), "Bayern Múnich"),
    (re.compile(r"\bMunich\b"), "Múnich"),
    (re.compile(r"\bModric\b"), "Modrić"),
    (re.compile(r"\bGremio\b"), "Grêmio"),
    (re.compile(r"\bOzil\b"), "Özil"),
    (re.compile(r"\bJoao Felix\b"), "João Félix"),
    (re.compile(r"\bJoao\b"), "João"),
    (re.compile(r"\bMilitao\b"), "Militão"),
    (re.compile(r"\bEmiliano Martinez\b"), "Emiliano Martínez"),
    (re.compile(r"\bLisandro Martinez\b"), "Lisandro Martínez"),
]

LOG: list[str] = []


def apply(text: str) -> str:
    out = text
    for rx, rep in RULES:
        out = rx.sub(rep, out)
    return out


def main() -> None:
    for name in ("pasalache_2025.json", "preguntas_combinadas.json"):
        path = DATA / name
        data = json.loads(path.read_text(encoding="utf-8"))
        n = 0
        for block in data:
            for q in block["preguntas"]:
                for field in ("pregunta", "respuesta"):
                    new = apply(q[field])
                    if new != q[field]:
                        LOG.append(
                            f"- [{block['letra']}] {field}: `{q[field][:70]}` → `{new[:70]}`"
                        )
                        q[field] = new
                        n += 1
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print(f"{name}: {n} correcciones ortográficas")
    (ROOT / "scripts" / "_orto_pass.md").write_text(
        "# Ortografía\n\n" + "\n".join(LOG) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
