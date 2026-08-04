#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"
CONT = re.compile(r"^CONTIENE\s+([A-ZÑÁÉÍÓÚÜ]):", re.I)
RF = re.compile(
    r"Mbapp[eé].{0,40}PSG|PSG.{0,40}Mbapp[eé]|City.{0,30}[ÁA]lvarez|[ÁA]lvarez.{0,30}City|"
    r"Bal[oó]n de Oro 2024(?!\s*[–\-]?Rodri)|cinco Libertadores|6 Copas Libertadores|"
    r"Luis Filipe Vieira|BOTA de ORO asistencias|juega en el PSG|actualmente|"
    r"Manchester City.{0,40}Juli[aá]n|Juli[aá]n.{0,40}Manchester City",
    re.I,
)


def strip(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower().strip()


def letter_issues(path: Path):
    raw = json.loads(path.read_text(encoding="utf-8"))
    issues = []
    n = 0
    for block in raw:
        L = block["letra"]
        exp = strip(L)[0]
        for q in block["preguntas"]:
            n += 1
            p, r = q["pregunta"], q["respuesta"]
            rn = strip(r)
            m = CONT.match(p.strip())
            if m:
                if strip(m.group(1))[0] != exp or exp not in rn:
                    issues.append((L, p, r))
            else:
                if p.upper().startswith("CONTIENE") or (rn and not rn.startswith(exp)):
                    issues.append((L, p, r))
    return n, issues


def redflags_pasala(path: Path):
    raw = json.loads(path.read_text(encoding="utf-8"))
    hits = []
    for block in raw:
        for q in block["preguntas"]:
            blob = f"{q['pregunta']} {q['respuesta']}"
            if RF.search(blob):
                hits.append((block["letra"], q["pregunta"], q["respuesta"]))
    return hits


def main():
    for name in ["pasalache_2025.json", "preguntas_combinadas.json"]:
        n, issues = letter_issues(DATA / name)
        hits = redflags_pasala(DATA / name)
        print(f"\n=== {name} n={n} letter={len(issues)} redflags={len(hits)}")
        for x in issues[:30]:
            print("LETTER", x[0], "|", x[1][:70], "=>", x[2])
        for x in hits[:20]:
            print("RED", x[0], "|", x[1][:70], "=>", x[2])

    w = json.loads((DATA / "wordle_pool.json").read_text(encoding="utf-8"))
    print(f"\n=== wordle n={len(w)}")
    seen = set()
    for it in w:
        a = strip(it.get("answer") or "")
        club = it.get("club") or ""
        name = it.get("name") or ""
        if a in seen:
            print("DUP", name, a, club)
        seen.add(a)
        low = strip(f"{name} {club} {a}")
        if "mbappe" in low and "psg" in low:
            print("MBAPPE_PSG", name, club)
        if ("alvarez" in low or "julian" in low) and "manchester city" in low:
            print("ALVAREZ_CITY", name, club)
        if "messi" in low and "psg" in low:
            print("MESSI_BAD", name, club)
        if not a:
            print("EMPTY", it)

    print("\n=== QSM")
    for lvl in range(1, 7):
        d = json.loads((DATA / f"level_{lvl}.json").read_text(encoding="utf-8"))
        qs = d.get("preguntas", [])
        hits = []
        empty = 0
        for q in qs:
            p = q.get("pregunta") or q.get("question") or ""
            r = q.get("respuesta") or q.get("answer") or ""
            if not p or not r:
                empty += 1
            if RF.search(f"{p} {r}"):
                hits.append((p, r))
        print(f"L{lvl} n={len(qs)} empty={empty} redflags={len(hits)}")
        for h in hits[:10]:
            print(" ", h[0][:70], "=>", h[1])

    # top10 sample flags
    print("\n=== TOP10 titles")
    for fname in ["top10_pool.json", "top10_pool_extended.json"]:
        pool = json.loads((DATA / fname).read_text(encoding="utf-8"))
        print(fname, "topics", len(pool))
        for t in pool:
            title = t.get("title", "")
            answers = t.get("answers", [])
            blob = title + " " + " ".join(str(a) for a in answers)
            if RF.search(blob) or "actualmente" in title.lower():
                print(" FLAG", title)


if __name__ == "__main__":
    main()
