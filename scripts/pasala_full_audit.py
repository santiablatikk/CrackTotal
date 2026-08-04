#!/usr/bin/env python3
"""Full Pasala Che bank dump + letter audit."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "assets" / "data" / "pasalache_2025.json"
DUMP = ROOT / "scripts" / "_pasala_full_dump.txt"

CONTIENE_RE = re.compile(r"^CONTIENE\s+([A-ZÑÁÉÍÓÚÜ]):", re.I)

VOLATILE = [
    r"\bactualmente\b",
    r"\bactual\b",
    r"\bjuega en\b",
    r"\bjuega\b",
    r"\bataja\b",
    r"\bfigura en 202[0-9]\b",
    r"\bdesde 20\d{2}\b",
    r"\bcedido\b",
    r"\bdel Manchester United,",
    r"\bdel Napoli,",
    r"\bRB Leipzig\b",
    r"\bentrenador del\b",
    r"\btécnico del\b(?! Real Madrid campeón)",  # soft
]


def strip(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower().strip()


def main() -> None:
    data = json.loads(PATH.read_text(encoding="utf-8"))
    lines = []
    letter_issues = []
    soft = []
    dups = []

    for block in data:
        L = block["letra"]
        exp = strip(L)[0]
        seen = {}
        for q in block["preguntas"]:
            p, r = q["pregunta"], q["respuesta"]
            lines.append(f"{L}\t{p}\t{r}")
            rn = strip(r)
            m = CONTIENE_RE.match(p.strip())
            if m:
                declared = strip(m.group(1))[0]
                if declared != exp:
                    letter_issues.append(f"MISMATCH {L}: declared={declared} | {p} | {r}")
                if exp not in rn:
                    letter_issues.append(f"CONTIENE_MISS {L}: {p} | {r}")
            else:
                if p.upper().startswith("CONTIENE"):
                    letter_issues.append(f"BAD_FORMAT {L}: {p}")
                if not rn.startswith(exp):
                    letter_issues.append(f"START_MISS {L}: {p} | {r}")

            for pat in VOLATILE:
                if re.search(pat, p, re.I):
                    soft.append(f"VOLATILE {L}: /{pat}/ | {p} | {r}")
                    break

            key = (strip(p), rn)
            if key in seen:
                dups.append(f"DUP {L}: {p} | {r}")
            seen[key] = True

            # near-dup answers in same letter
            if rn in seen.get("_answers", set()):
                dups.append(f"DUP_ANS {L}: {r} | {p}")
            seen.setdefault("_answers", set()).add(rn)

    DUMP.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"TOTAL={sum(len(b['preguntas']) for b in data)}")
    print(f"LETTER={len(letter_issues)}")
    for x in letter_issues:
        print(x)
    print(f"SOFT={len(soft)}")
    for x in soft:
        print(x)
    print(f"DUPS={len(dups)}")
    for x in dups:
        print(x)


if __name__ == "__main__":
    main()
