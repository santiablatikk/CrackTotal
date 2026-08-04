# -*- coding: utf-8 -*-
"""Deeper scan of outdated football facts across active banks."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"

PATTERNS = [
    ("argentina_campeon_mundo", re.compile(r"argentina.{0,60}campe[oó]n.{0,40}mund|campe[oó]n.{0,40}mund.{0,40}argentina|actual campe[oó]n del mundo", re.I | re.S)),
    ("ultimo_mundial", re.compile(r"último mundial|mundial m[aá]s reciente|pasado mundial", re.I)),
    ("ballon_actual_rodri", re.compile(r"bal[oó]n de oro.{0,40}(actual|vigente|último|m[aá]s reciente).{0,20}rodri|rodri.{0,40}bal[oó]n de oro.{0,30}(actual|vigente|último)", re.I | re.S)),
    ("ballon_2025", re.compile(r"bal[oó]n de oro 2025", re.I)),
    ("dembele", re.compile(r"dembel", re.I)),
    ("champions_actual_madrid", re.compile(r"(actual|vigente|última|ultimo|m[aá]s reciente).{0,50}champions.{0,40}(real madrid|madrid)|champions.{0,40}(actual|vigente|última).{0,40}(real madrid|madrid)", re.I | re.S)),
    ("champions_2024_madrid", re.compile(r"champions.{0,40}2024.{0,40}(real madrid|madrid)|real madrid.{0,40}champions.{0,20}2024", re.I | re.S)),
    ("libertadores_botafogo_actual", re.compile(r"(actual|vigente|última|ultimo).{0,40}libertadores.{0,40}botafogo|botafogo.{0,40}(actual|vigente|última).{0,40}libertadores", re.I | re.S)),
    ("mbappe_psg", re.compile(r"mbapp[eé].{0,50}(psg|paris saint)| (psg|paris saint).{0,50}mbapp[eé]", re.I | re.S)),
    ("actualmente", re.compile(r"actualmente", re.I)),
    ("messi_8_ballon", re.compile(r"messi.{0,30}8|ocho veces.{0,20}bal[oó]n", re.I)),
    ("wc_2026", re.compile(r"mundial 2026|world cup 2026", re.I)),
    ("espana_campeon", re.compile(r"espa[nñ]a.{0,40}campe[oó]n.{0,30}mund|campe[oó]n.{0,30}mund.{0,30}espa[nñ]a", re.I | re.S)),
    ("psg_champions", re.compile(r"paris saint-germain|psg", re.I)),
    ("flamengo_2025", re.compile(r"flamengo.{0,30}libertadores 2025|libertadores 2025.{0,30}flamengo", re.I | re.S)),
]


def walk_questions(path: Path):
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list) and data and isinstance(data[0], dict) and "preguntas" in data[0]:
        for block in data:
            letra = block.get("letra", "?")
            for i, q in enumerate(block.get("preguntas", [])):
                yield f"{letra}.{i}", q.get("pregunta", ""), q.get("respuesta", "")
    elif isinstance(data, dict) and "preguntas" in data:
        for i, q in enumerate(data["preguntas"]):
            yield f"q{i}", q.get("pregunta") or q.get("question") or "", q.get("respuesta") or q.get("answer") or ""
    elif isinstance(data, list) and data and "title" in data[0]:
        for i, item in enumerate(data):
            yield f"set{i}", item.get("title", ""), " | ".join(item.get("answers") or [])
    elif isinstance(data, list) and data and "answer" in data[0]:
        for i, item in enumerate(data):
            yield f"w{i}", item.get("name", ""), f"{item.get('answer','')} @ {item.get('club','')}"
    elif isinstance(data, dict) and "categories" in data:
        cats = data["categories"]
        if isinstance(cats, dict):
            for cat, qs in cats.items():
                if not isinstance(qs, list):
                    continue
                for i, q in enumerate(qs):
                    yield f"{cat}.{i}", q.get("question") or q.get("pregunta") or "", q.get("answer") or q.get("respuesta") or ""


def main():
    files = [
        "pasalache_2025.json",
        "preguntas_combinadas.json",
        "top10_pool.json",
        "top10_pool_extended.json",
        "wordle_pool.json",
        "crack-rapido-mega-questions.json",
    ] + [f"level_{i}.json" for i in range(1, 7)]

    findings = []
    for name in files:
        path = DATA / name
        if not path.exists():
            continue
        for where, pregunta, respuesta in walk_questions(path):
            blob = f"{pregunta} || {respuesta}"
            hits = [k for k, rx in PATTERNS if rx.search(blob)]
            if hits:
                findings.append({"file": name, "where": where, "hits": hits, "pregunta": pregunta[:180], "respuesta": respuesta[:120]})

    # prioritize actionable
    priority = [f for f in findings if any(h in f["hits"] for h in [
        "argentina_campeon_mundo", "ballon_actual_rodri", "champions_actual_madrid",
        "mbappe_psg", "libertadores_botafogo_actual", "ultimo_mundial"
    ])]
    print(f"total flagged rows: {len(findings)}")
    print(f"priority rows: {len(priority)}")
    for f in priority[:60]:
        print(f"- {f['file']} {f['where']} {f['hits']}")
        print(f"  Q: {f['pregunta']}")
        print(f"  A: {f['respuesta']}")

    out = ROOT / "reports" / "content_scan_priority_2026-08-04.json"
    out.write_text(json.dumps({"priority": priority, "allCount": len(findings), "sampleAll": findings[:100]}, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", out)


if __name__ == "__main__":
    main()
