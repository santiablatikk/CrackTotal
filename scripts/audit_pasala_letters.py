#!/usr/bin/env python3
"""Audit Pasala Che bank: letter/CONTIENE + soft factual flags."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "assets" / "data" / "pasalache_2025.json"
DUMP = ROOT / "scripts" / "_pasala_audit_dump.txt"

CONTIENE_RE = re.compile(r"^CONTIENE\s+([A-ZÑÁÉÍÓÚÜ]):", re.I)


def strip(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower().strip()


def main() -> None:
    data = json.loads(PATH.read_text(encoding="utf-8"))
    letter_issues = []
    factual_flags = []
    orto_flags = []
    lines = []

    for block in data:
        L = block["letra"]
        exp = strip(L)[0]
        for q in block["preguntas"]:
            p, r = q["pregunta"], q["respuesta"]
            lines.append(f"{L}|{p}|{r}")
            rn = strip(r)
            m = CONTIENE_RE.match(p.strip())
            if m:
                declared = strip(m.group(1))[0]
                if declared != exp:
                    letter_issues.append(("CONTIENE_LETTER_MISMATCH", L, declared, p, r))
                if exp not in rn:
                    letter_issues.append(("CONTIENE_MISS", L, p, r))
            else:
                if p.upper().startswith("CONTIENE"):
                    letter_issues.append(("CONTIENE_BAD_FORMAT", L, p, r))
                if not rn.startswith(exp):
                    letter_issues.append(("START_MISS", L, p, r))

            low = p.lower()
            for pat in (
                "actualmente",
                "actual entrenador",
                "juega en el",
                "cedido",
                "figura en 2024",
                "del napoli,",
                "rb leipzig",
                "manchester united,",
            ):
                if pat in low:
                    factual_flags.append((L, pat, p, r))

            for bad, good in (
                ("Pique", "Piqué"),
                ("Ozil", "Özil"),
                ("Gremio", "Grêmio"),
                ("Puskas", "Puskás"),
                ("Munich", "Múnich"),
                ("Militao", "Militão"),
            ):
                if bad in r and good not in r:
                    orto_flags.append((L, r, f"{bad}->{good}"))

    DUMP.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"TOTAL_Q={sum(len(b['preguntas']) for b in data)}")
    print(f"LETTER_ISSUES={len(letter_issues)}")
    for x in letter_issues:
        print("LETTER", x)
    print(f"FACTUAL_SOFT={len(factual_flags)}")
    for x in factual_flags:
        print("FACT", x)
    print(f"ORTO={len(orto_flags)}")
    for x in orto_flags:
        print("ORTO", x)


if __name__ == "__main__":
    main()
