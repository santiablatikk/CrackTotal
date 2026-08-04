# -*- coding: utf-8 -*-
"""Apply high-confidence content fixes for 2026-08-04 across banks."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"
changes = []


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def save(p: Path, data) -> None:
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def log(file, where, before, after, kind="fix"):
    changes.append({"file": file, "where": where, "kind": kind, "before": before, "after": after})


def fix_text_pair(pregunta: str, respuesta: str):
    """Return (pregunta, respuesta, changed)."""
    p, r = pregunta, respuesta
    pl, rl = p.lower(), r.lower()
    changed = False
    before = f"{p} => {r}"

    # Mbappé still framed as PSG striker
    if "mbapp" in (pl + " " + rl) and re.search(r"\bpsg\b|paris saint", pl) and "real madrid" not in pl:
        if "apellido del delantero francés del psg" in pl or "delantero francés del psg" in pl:
            p = "¿Apellido del delantero francés del Real Madrid, campeón del mundo 2018?"
            r = "Mbappé"
            changed = True
        elif "actualmente" in pl and "psg" in pl:
            p = re.sub(r"(?i)actualmente en (el )?(PSG|Paris Saint-Germain)", "del Real Madrid", p)
            changed = True
        elif "del psg" in pl or "del paris" in pl:
            p = re.sub(r"(?i)del (PSG|Paris Saint-Germain)", "del Real Madrid", p)
            changed = True

    # Cavani left Boca in July 2026
    if "cavani" in rl and "actualmente" in pl and "boca" in pl:
        p = re.sub(
            r"(?i)que actualmente juega en Boca Juniors",
            "que jugó en Boca Juniors entre 2023 y 2026",
            p,
        )
        p = re.sub(
            r"(?i)y actualmente en Boca Juniors",
            "y también jugó en Boca Juniors",
            p,
        )
        p = re.sub(
            r"(?i), actualmente en Boca Juniors\??",
            ", ex Boca Juniors?",
            p,
        )
        changed = True

    # Julián Álvarez: Atlético de Madrid (not Manchester City)
    if "juli" in pl and "lvarez" in pl.replace("á", "a") and "manchester city" in pl and "actualmente" in pl:
        p = re.sub(r"(?i)actualmente milita en el Manchester City", "que pasó del Manchester City al Atlético de Madrid", p)
        p = re.sub(r"(?i)actualmente en el Manchester City", "del Atlético de Madrid", p)
        changed = True
    if re.search(r"juli[aá]n", rl) and "manchester city" in pl and "actualmente" in pl:
        p = re.sub(r"(?i)actualmente milita en el Manchester City", "que fichó por el Atlético de Madrid", p)
        changed = True

    # Answer says Manchester City for Julián currently
    if "juli" in pl and "city" in rl and "actualmente" in pl:
        r = "Julián Álvarez"
        p = re.sub(r"(?i)actualmente milita en el Manchester City", "del Atlético de Madrid", p)
        changed = True

    # Kyle Walker: often left City — rephrase to historical
    if "walker" in rl and "actualmente en milan" in pl:
        p = re.sub(r"(?i)Actualmente en Milan\.?", "que también jugó en el Milan.", p)
        changed = True

    # Gerrard "actualmente entrenador" without club — ambiguous
    if "gerrard" in rl and "actualmente entrenador" in pl:
        p = re.sub(r"(?i), actualmente entrenador\??", ", exentrenador de clubes como el Aston Villa?", p)
        changed = True

    # Cuca "actualmente en Atlético Mineiro" — volatile; anchor
    if "cuca" in rl and "actualmente en atl" in pl:
        p = re.sub(r"(?i)actualmente en Atl[eé]tico Mineiro", "conocido por dirigir a Atlético Mineiro", p)
        changed = True

    # "Balón de Oro actual/vigente/último" without year -> 2025 Dembélé
    if re.search(r"bal[oó]n de oro", pl) and re.search(r"\b(actual|vigente|último|ultimo|m[aá]s reciente)\b", pl):
        if "2024" not in pl and "2025" not in pl and "2022" not in pl and "2018" not in pl:
            if "rodri" in rl or "messi" in rl or "vinicius" in rl or "vinícius" in rl:
                p = "¿Quién ganó el Balón de Oro 2025?"
                r = "Ousmane Dembélé" if "apellido" not in pl else "Dembélé"
                changed = True

    # Current world champion language
    if re.search(r"campe[oó]n(a)? (actual|vigente) del mundo|actual campe[oó]n(a)? del mundo", pl):
        if "argentina" in rl or "selección argentina" in rl:
            p = "¿Qué selección ganó el Mundial 2026?"
            r = "España"
            changed = True

    # Soft: "Apellido del delantero francés del PSG => Mbappe"
    if rl.replace("é", "e") in {"mbappe", "mbappé"} and re.search(r"franc[eé]s del psg", pl):
        p = "¿Apellido del delantero francés del Real Madrid?"
        r = "Mbappé"
        changed = True

    if changed:
        p = re.sub(r"\s+", " ", p).strip()
        r = re.sub(r"\s+", " ", r).strip()
        return p, r, True, before
    return pregunta, respuesta, False, before


def process_letter_bank(path: Path) -> int:
    data = load(path)
    n = 0
    for block in data:
        letra = block.get("letra", "?")
        for i, q in enumerate(block.get("preguntas", [])):
            p, r, ch, before = fix_text_pair(q.get("pregunta", ""), q.get("respuesta", ""))
            if ch:
                q["pregunta"], q["respuesta"] = p, r
                log(path.name, f"{letra}.{i}", before, f"{p} => {r}")
                n += 1
    if n:
        save(path, data)
    return n


def process_levels() -> int:
    total = 0
    for li in range(1, 7):
        path = DATA / f"level_{li}.json"
        data = load(path)
        n = 0
        for i, q in enumerate(data.get("preguntas", [])):
            p0 = q.get("pregunta") or q.get("question") or ""
            r0 = q.get("respuesta") or q.get("answer") or ""
            p, r, ch, before = fix_text_pair(p0, r0)
            if ch:
                if "pregunta" in q:
                    q["pregunta"] = p
                if "question" in q:
                    q["question"] = p
                if "respuesta" in q:
                    q["respuesta"] = r
                if "answer" in q:
                    q["answer"] = r
                log(path.name, f"q{i}", before, f"{p} => {r}")
                n += 1
        if n:
            save(path, data)
        total += n
    return total


def process_wordle() -> int:
    path = DATA / "wordle_pool.json"
    data = load(path)
    n = 0
    for i, e in enumerate(data):
        ans = (e.get("answer") or "").lower().replace("é", "e")
        name = (e.get("name") or "").lower().replace("é", "e")
        club = e.get("club") or ""
        if ("mbappe" in ans or "mbappe" in name) and club in {"PSG", "Paris Saint-Germain", "Monaco", ""}:
            before = f"{e.get('name')}@{club}"
            e["club"] = "Real Madrid"
            log(path.name, f"#{i}", before, f"{e.get('name')}@Real Madrid", "wordle")
            n += 1
        if ("julian" in name or "álvarez" in name or "alvarez" in name) and "city" in club.lower():
            before = f"{e.get('name')}@{club}"
            e["club"] = "Atlético de Madrid"
            log(path.name, f"#{i}", before, f"{e.get('name')}@Atlético de Madrid", "wordle")
            n += 1
    # Ensure Dembélé exists
    has = any("dembele" in ((e.get("answer") or "") + (e.get("name") or "")).lower().replace("é", "e") for e in data)
    if not has:
        data.append(
            {
                "id": "dembele-2025",
                "type": "player",
                "name": "Ousmane Dembélé",
                "answer": "DEMBELE",
                "nationality": "Francia",
                "position": "Delantero",
                "club": "Paris Saint-Germain",
                "birth": 1997,
            }
        )
        log(path.name, "new", "(missing)", "Ousmane Dembélé", "wordle-add")
        n += 1
    if n:
        save(path, data)
    return n


def inject_pasalache_modern() -> int:
    path = DATA / "pasalache_2025.json"
    data = load(path)
    n = 0

    def has(letter, substr):
        for block in data:
            if block.get("letra") != letter:
                continue
            return any(substr.lower() in ((q.get("pregunta") or "") + (q.get("respuesta") or "")).lower() for q in block.get("preguntas", []))
        return False

    def add(letter, pregunta, respuesta):
        nonlocal n
        for block in data:
            if block.get("letra") == letter:
                block.setdefault("preguntas", []).insert(0, {"pregunta": pregunta, "respuesta": respuesta})
                log(path.name, f"{letter}+", "(new)", f"{pregunta} => {respuesta}", "add")
                n += 1
                return

    if not has("D", "Balón de Oro 2025"):
        add("D", "¿Apellido del francés ganador del Balón de Oro 2025?", "Dembélé")
    if not has("E", "Mundial 2026"):
        add("E", "¿Selección campeona del Mundial 2026?", "España")
    if not has("P", "2024/25") and not has("P", "Champions League 2024"):
        add("P", "¿Club francés campeón de la Champions League 2024/25?", "Paris Saint-Germain")
    if not has("F", "Libertadores 2025"):
        add("F", "¿Club brasileño campeón de la Copa Libertadores 2025?", "Flamengo")
    if not has("T", "Ferran Torres") and not has("T", "Torres"):
        # careful: many Torres — use full phrasing
        add("T", "CONTIENE T: ¿Apellido del delantero español autor del gol de la final del Mundial 2026?", "Torres")

    # Fix any remaining mbappe/psg inside pasalache
    for block in data:
        letra = block.get("letra", "?")
        for i, q in enumerate(block.get("preguntas", [])):
            p, r, ch, before = fix_text_pair(q.get("pregunta", ""), q.get("respuesta", ""))
            if ch:
                q["pregunta"], q["respuesta"] = p, r
                log(path.name, f"{letra}.{i}", before, f"{p} => {r}")
                n += 1

    if n:
        save(path, data)
    return n


def inject_levels_modern() -> int:
    """Add a few verified 2025/2026 facts into level banks used by QSM."""
    path = DATA / "level_1.json"
    data = load(path)
    preguntas = data.setdefault("preguntas", [])
    blob = json.dumps(preguntas, ensure_ascii=False).lower()
    n = 0
    news = [
        {
            "pregunta": "¿Quién ganó el Balón de Oro 2025?",
            "respuesta": "Ousmane Dembélé",
            "dificultad": 1,
        },
        {
            "pregunta": "¿Qué selección ganó el Mundial 2026?",
            "respuesta": "España",
            "dificultad": 1,
        },
        {
            "pregunta": "¿Qué club ganó la Champions League 2024/25?",
            "respuesta": "Paris Saint-Germain",
            "dificultad": 1,
        },
        {
            "pregunta": "¿Qué club ganó la Copa Libertadores 2025?",
            "respuesta": "Flamengo",
            "dificultad": 1,
        },
    ]
    for item in news:
        key = item["pregunta"].lower()
        if key not in blob:
            # support both schemas
            entry = dict(item)
            entry["question"] = item["pregunta"]
            entry["answer"] = item["respuesta"]
            preguntas.insert(0, entry)
            log(path.name, "inject", "(new)", f"{item['pregunta']} => {item['respuesta']}", "add")
            n += 1
            blob = json.dumps(preguntas, ensure_ascii=False).lower()
    if n:
        save(path, data)
    return n


def inject_combinadas_modern() -> int:
    path = DATA / "preguntas_combinadas.json"
    data = load(path)
    n = 0

    def add(letter, pregunta, respuesta):
        nonlocal n
        for block in data:
            if block.get("letra") == letter:
                exists = any(pregunta.lower() in (q.get("pregunta") or "").lower() for q in block.get("preguntas", []))
                if not exists:
                    block.setdefault("preguntas", []).insert(0, {"pregunta": pregunta, "respuesta": respuesta})
                    log(path.name, f"{letter}+", "(new)", f"{pregunta} => {respuesta}", "add")
                    n += 1
                return

    add("D", "¿Apellido del francés ganador del Balón de Oro 2025?", "Dembélé")
    add("E", "¿Selección campeona del Mundial 2026?", "España")
    add("P", "¿Qué club ganó la Champions League 2024/25?", "Paris Saint-Germain")
    add("F", "¿Club campeón de la Copa Libertadores 2025?", "Flamengo")

    for block in data:
        letra = block.get("letra", "?")
        for i, q in enumerate(block.get("preguntas", [])):
            p, r, ch, before = fix_text_pair(q.get("pregunta", ""), q.get("respuesta", ""))
            if ch:
                q["pregunta"], q["respuesta"] = p, r
                log(path.name, f"{letra}.{i}", before, f"{p} => {r}")
                n += 1
    if n:
        save(path, data)
    # mirror critical into backup
    backup = DATA / "preguntas_combinadas_backup.json"
    if backup.exists():
        b = load(backup)
        bn = 0
        for block in b:
            letra = block.get("letra", "?")
            for i, q in enumerate(block.get("preguntas", [])):
                p, r, ch, before = fix_text_pair(q.get("pregunta", ""), q.get("respuesta", ""))
                if ch:
                    q["pregunta"], q["respuesta"] = p, r
                    log(backup.name, f"{letra}.{i}", before, f"{p} => {r}")
                    bn += 1
        if bn:
            save(backup, b)
            n += bn
    return n


def process_crack() -> int:
    path = DATA / "crack-rapido-mega-questions.json"
    if not path.exists():
        return 0
    data = load(path)
    n = 0
    cats = data.get("categories") or {}
    if isinstance(cats, dict):
        for cat, qs in cats.items():
            if not isinstance(qs, list):
                continue
            for i, q in enumerate(qs):
                p0 = q.get("question") or q.get("pregunta") or ""
                r0 = q.get("answer") or q.get("respuesta") or ""
                p, r, ch, before = fix_text_pair(p0, r0)
                if ch:
                    if "question" in q:
                        q["question"] = p
                    if "pregunta" in q:
                        q["pregunta"] = p
                    if "answer" in q:
                        q["answer"] = r
                    if "respuesta" in q:
                        q["respuesta"] = r
                    log(path.name, f"{cat}.{i}", before, f"{p} => {r}")
                    n += 1
    if n:
        data["lastUpdated"] = "2026-08-04"
        save(path, data)
    return n


def main():
    summary = {
        "pasalache": inject_pasalache_modern(),
        "combinadas": inject_combinadas_modern(),
        "levels_fix": process_levels(),
        "levels_inject": inject_levels_modern(),
        "wordle": process_wordle(),
        "crack": process_crack(),
    }
    out = ROOT / "reports" / "content_fixes_2026-08-04.json"
    out.write_text(
        json.dumps({"summary": summary, "total": len(changes), "changes": changes}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"summary": summary, "total": len(changes), "report": str(out)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
