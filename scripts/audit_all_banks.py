#!/usr/bin/env python3
"""Inventory + programmatic audit of all Crack Total question banks."""
from __future__ import annotations

import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"
OUT = ROOT / "scripts" / "_banks_audit_report.md"

CONTIENE_RE = re.compile(r"^CONTIENE\s+([A-ZÑÁÉÍÓÚÜ]):", re.I)
RED_FLAGS = re.compile(
    r"Mbapp[eé].{0,40}PSG|PSG.{0,40}Mbapp[eé]|Juli[aá]n.{0,40}City|Manchester City.{0,30}[ÁA]lvarez|"
    r"Bal[oó]n de Oro 2024(?!\s*[,\.]?\s*Rodri)|juega en el PSG|actualmente|"
    r"cinco Libertadores|6 Copas Libertadores|Luis Filipe Vieira|"
    r"BOTA de ORO asistencias|figura en 2024|cedido desde",
    re.I,
)
VOLATILE = re.compile(
    r"\b(actualmente|juega en|ataja en|entrenador actual|del Napoli,|RB Leipzig)\b",
    re.I,
)


def strip(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower().strip()


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def audit_pasala(path: Path, label: str) -> dict:
    data = load(path)
    issues = []
    soft = []
    n = 0
    # Support both [{letra, preguntas}] and flat/other
    if isinstance(data, list) and data and isinstance(data[0], dict) and "letra" in data[0]:
        for block in data:
            L = block.get("letra", "?")
            exp = strip(L)[0] if L else "?"
            for q in block.get("preguntas", []):
                n += 1
                p = q.get("pregunta", "")
                r = q.get("respuesta", "")
                rn = strip(r)
                m = CONTIENE_RE.match(p.strip())
                if m:
                    if strip(m.group(1))[0] != exp:
                        issues.append(f"LETTER_MISMATCH {L}: {p} | {r}")
                    if exp not in rn:
                        issues.append(f"CONTIENE_MISS {L}: {p} | {r}")
                else:
                    if p.upper().startswith("CONTIENE"):
                        issues.append(f"BAD_FORMAT {L}: {p}")
                    if rn and not rn.startswith(exp):
                        issues.append(f"START_MISS {L}: {p} | {r}")
                blob = f"{p} {r}"
                if RED_FLAGS.search(blob):
                    soft.append(f"REDFLAG {L}: {p} | {r}")
                elif VOLATILE.search(p):
                    soft.append(f"VOLATILE {L}: {p} | {r}")
    elif isinstance(data, dict) and "preguntas" in data:
        # maybe letter-keyed
        for L, qs in data.items():
            if L == "preguntas":
                continue
        # flat list under preguntas with letra field?
        for q in data.get("preguntas", []):
            n += 1
            soft.append(f"FLAT_ITEM: {q}")
    else:
        # preguntas_combinadas often: [{letra, preguntas}] OR nested by difficulty
        # try walk
        def walk(obj, path_s=""):
            nonlocal n
            if isinstance(obj, list):
                for i, x in enumerate(obj):
                    walk(x, f"{path_s}[{i}]")
            elif isinstance(obj, dict):
                if "pregunta" in obj and "respuesta" in obj:
                    n += 1
                    p, r = obj["pregunta"], obj["respuesta"]
                    blob = f"{p} {r}"
                    if RED_FLAGS.search(blob):
                        soft.append(f"REDFLAG: {p} | {r}")
                    if VOLATILE.search(p):
                        soft.append(f"VOLATILE: {p} | {r}")
                    # letter from parent if available - skip strict unless letra in obj
                    if "letra" in obj:
                        L = obj["letra"]
                        exp = strip(L)[0]
                        rn = strip(r)
                        m = CONTIENE_RE.match(p.strip())
                        if m:
                            if exp not in rn:
                                issues.append(f"CONTIENE_MISS {L}: {p} | {r}")
                        elif rn and not rn.startswith(exp):
                            issues.append(f"START_MISS {L}: {p} | {r}")
                else:
                    for k, v in obj.items():
                        walk(v, f"{path_s}.{k}")

        walk(data)

    return {"label": label, "path": str(path.relative_to(ROOT)), "count": n, "letter_issues": issues, "soft": soft[:80], "soft_total": len(soft)}


def audit_pasala_blocks(path: Path, label: str) -> dict:
    """pasalache_2025 and similar letter-block format."""
    raw = load(path)
    # preguntas_combinadas may be {facil/medio/...} or list of blocks
    if isinstance(raw, list):
        return audit_pasala(path, label)

    # Nested: try find letter blocks
    issues, soft = [], []
    n = 0

    def handle_block(block):
        nonlocal n
        L = block.get("letra", "?")
        exp = strip(str(L))[0] if L else "?"
        for q in block.get("preguntas", []):
            n += 1
            p, r = q.get("pregunta", ""), q.get("respuesta", "")
            rn = strip(r)
            m = CONTIENE_RE.match(p.strip())
            if m:
                if strip(m.group(1))[0] != exp:
                    issues.append(f"LETTER_MISMATCH {L}: {p} | {r}")
                if exp not in rn:
                    issues.append(f"CONTIENE_MISS {L}: {p} | {r}")
            else:
                if p.upper().startswith("CONTIENE"):
                    issues.append(f"BAD_FORMAT {L}: {p}")
                if rn and not rn.startswith(exp):
                    issues.append(f"START_MISS {L}: {p} | {r}")
            blob = f"{p} {r}"
            if RED_FLAGS.search(blob):
                soft.append(f"REDFLAG {L}: {p} | {r}")
            elif VOLATILE.search(p):
                soft.append(f"VOLATILE {L}: {p} | {r}")

    def walk(obj):
        if isinstance(obj, list):
            for x in obj:
                if isinstance(x, dict) and "letra" in x and "preguntas" in x:
                    handle_block(x)
                else:
                    walk(x)
        elif isinstance(obj, dict):
            if "letra" in obj and "preguntas" in obj:
                handle_block(obj)
            else:
                for v in obj.values():
                    walk(v)

    walk(raw)
    return {
        "label": label,
        "path": str(path.relative_to(ROOT)),
        "count": n,
        "letter_issues": issues,
        "soft": soft[:100],
        "soft_total": len(soft),
    }


def audit_top10(path: Path, label: str) -> dict:
    data = load(path)
    topics = data if isinstance(data, list) else data.get("topics") or data.get("pool") or []
    issues = []
    titles = []
    n = 0
    for t in topics:
        n += 1
        title = t.get("title") or t.get("topic") or t.get("pregunta") or ""
        titles.append(strip(title))
        answers = t.get("answers") or t.get("respuestas") or t.get("items") or []
        if isinstance(answers, dict):
            answers = list(answers.values())
        # flatten answer strings
        ans_strs = []
        for a in answers:
            if isinstance(a, str):
                ans_strs.append(a)
            elif isinstance(a, dict):
                ans_strs.append(a.get("name") or a.get("nombre") or a.get("answer") or str(a))
        if len(ans_strs) != 10 and len(ans_strs) > 0:
            issues.append(f"NOT_10 ({len(ans_strs)}): {title}")
        if len(ans_strs) != len(set(strip(x) for x in ans_strs)):
            issues.append(f"DUP_ANSWERS: {title}")
        blob = title + " " + " ".join(ans_strs)
        if RED_FLAGS.search(blob) or VOLATILE.search(title):
            issues.append(f"FLAG: {title}")
    dup_titles = [k for k, v in Counter(titles).items() if v > 1 and k]
    for d in dup_titles:
        issues.append(f"DUP_TOPIC: {d}")
    return {"label": label, "path": str(path.relative_to(ROOT)), "count": n, "issues": issues[:60], "issue_total": len(issues)}


def audit_wordle(path: Path, label: str) -> dict:
    data = load(path)
    items = data if isinstance(data, list) else data.get("words") or data.get("pool") or []
    issues = []
    seen = set()
    n = 0
    for it in items:
        n += 1
        if isinstance(it, str):
            word, club = it, ""
        else:
            word = it.get("word") or it.get("apellido") or it.get("name") or it.get("respuesta") or ""
            club = it.get("club") or it.get("team") or ""
        key = strip(word)
        if not key:
            issues.append("EMPTY_WORD")
            continue
        if key in seen:
            issues.append(f"DUP: {word}")
        seen.add(key)
        if VOLATILE.search(club) or RED_FLAGS.search(f"{word} {club}"):
            issues.append(f"FLAG: {word} | {club}")
        # present club flags for known wrong clubs
        low = strip(f"{word} {club}")
        if "mbappe" in low and "psg" in low:
            issues.append(f"MBAPPE_PSG: {word} | {club}")
        if ("julian" in low or "alvarez" in low) and "manchester city" in low:
            issues.append(f"ALVAREZ_CITY: {word} | {club}")
    return {"label": label, "path": str(path.relative_to(ROOT)), "count": n, "issues": issues[:80], "issue_total": len(issues)}


def audit_qsm(path: Path, label: str) -> dict:
    data = load(path)
    qs = data.get("preguntas") if isinstance(data, dict) else data
    if not isinstance(qs, list):
        return {"label": label, "path": str(path.relative_to(ROOT)), "count": 0, "issues": ["NO_PREGUNTAS_ARRAY"], "issue_total": 1}
    issues = []
    n = 0
    for i, q in enumerate(qs):
        n += 1
        pregunta = q.get("pregunta") or q.get("question") or ""
        opciones = q.get("opciones") or q.get("options") or q.get("answers")
        correcta = q.get("correcta") if "correcta" in q else q.get("correct") if "correct" in q else q.get("respuesta")
        if opciones is None:
            issues.append(f"[{i}] NO_OPTIONS: {pregunta[:60]}")
            continue
        if isinstance(opciones, dict):
            opts = list(opciones.values())
            keys = list(opciones.keys())
        else:
            opts = list(opciones)
            keys = list(range(len(opts)))
        if len(opts) < 2:
            issues.append(f"[{i}] FEW_OPTIONS: {pregunta[:60]}")
        if len(set(strip(str(o)) for o in opts)) != len(opts):
            issues.append(f"[{i}] DUP_OPTIONS: {pregunta[:60]}")
        # correcta membership
        ok = False
        if isinstance(correcta, int):
            ok = 0 <= correcta < len(opts)
        elif correcta in keys:
            ok = True
        elif str(correcta) in [str(k) for k in keys]:
            ok = True
        elif strip(str(correcta)) in [strip(str(o)) for o in opts]:
            ok = True
        if not ok:
            issues.append(f"[{i}] CORRECT_NOT_IN_OPTIONS: {pregunta[:60]} | correcta={correcta}")
        blob = pregunta + " " + " ".join(str(o) for o in opts)
        if RED_FLAGS.search(blob):
            issues.append(f"[{i}] REDFLAG: {pregunta[:70]}")
    return {"label": label, "path": str(path.relative_to(ROOT)), "count": n, "issues": issues[:80], "issue_total": len(issues)}


def main() -> None:
    lines = ["# Banks audit", ""]
    results = []

    # Pasala
    for path, label in [
        (DATA / "pasalache_2025.json", "Pasala DEFAULT"),
        (DATA / "preguntas_combinadas.json", "Pasala FALLBACK"),
    ]:
        r = audit_pasala_blocks(path, label)
        results.append(r)
        lines.append(f"## {label} (`{r['path']}`)")
        lines.append(f"- count: {r['count']}")
        lines.append(f"- letter_issues: {len(r['letter_issues'])}")
        lines.append(f"- soft_flags: {r['soft_total']}")
        for i in r["letter_issues"][:40]:
            lines.append(f"  - LETTER: {i}")
        for i in r["soft"][:40]:
            lines.append(f"  - SOFT: {i}")
        lines.append("")

    for path, label in [
        (DATA / "top10_pool.json", "Top10"),
        (DATA / "top10_pool_extended.json", "Top10 extended"),
    ]:
        r = audit_top10(path, label)
        results.append(r)
        lines.append(f"## {label} (`{r['path']}`)")
        lines.append(f"- count: {r['count']}")
        lines.append(f"- issues: {r['issue_total']}")
        for i in r["issues"][:40]:
            lines.append(f"  - {i}")
        lines.append("")

    r = audit_wordle(DATA / "wordle_pool.json", "Wordle")
    results.append(r)
    lines.append(f"## Wordle (`{r['path']}`)")
    lines.append(f"- count: {r['count']}")
    lines.append(f"- issues: {r['issue_total']}")
    for i in r["issues"][:50]:
        lines.append(f"  - {i}")
    lines.append("")

    for lvl in range(1, 7):
        r = audit_qsm(DATA / f"level_{lvl}.json", f"QSM level_{lvl}")
        results.append(r)
        lines.append(f"## QSM level_{lvl}")
        lines.append(f"- count: {r['count']}")
        lines.append(f"- issues: {r['issue_total']}")
        for i in r["issues"][:30]:
            lines.append(f"  - {i}")
        lines.append("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    # compact stdout
    for r in results:
        if "letter_issues" in r:
            print(f"{r['label']}: n={r['count']} letter={len(r['letter_issues'])} soft={r['soft_total']}")
        else:
            print(f"{r['label']}: n={r['count']} issues={r['issue_total']}")


if __name__ == "__main__":
    main()
