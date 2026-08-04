#!/usr/bin/env python3
"""Second pass: remaining letter issues + QSM MC factual + wordle anchors."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"
CONT = re.compile(r"^CONTIENE\s+([A-ZÑÁÉÍÓÚÜ]):", re.I)


def strip(s: str) -> str:
    s = (s or "").replace("Ø", "O").replace("ø", "o")
    s = unicodedata.normalize("NFD", s)
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower().strip()


def letter_ok(letra, pregunta, respuesta) -> bool:
    exp = strip(letra)[0]
    rn = strip(respuesta)
    m = CONT.match(pregunta.strip())
    if m:
        return strip(m.group(1))[0] == exp and exp in rn
    if pregunta.upper().startswith("CONTIENE"):
        return False
    return bool(rn) and rn.startswith(exp)


def load(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def save(p, data):
    Path(p).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def fix_combinadas():
    path = DATA / "preguntas_combinadas.json"
    data = load(path)
    fixes = []
    for block in data:
        L = block["letra"]
        for q in block["preguntas"]:
            p, r = q["pregunta"], q["respuesta"]
            if not letter_ok(L, p, r):
                if strip(r) == "charlton" or "charlton" in strip(r):
                    q["pregunta"] = "CONTIENE B: ¿Apellido del inglés leyenda del Manchester United, Bobby …?"
                    q["respuesta"] = "Charlton"
                    fixes.append("Charlton CONTIENE B")
                elif strip(r) == "haaland":
                    # Full name starts with E
                    q["pregunta"] = "¿Nombre y apellido del delantero noruego estrella del Manchester City?"
                    q["respuesta"] = "Erling Haaland"
                    fixes.append(f"Haaland->{q['respuesta']} under {L}")
                elif "manchester city" in p.lower() and "alvarez" in strip(r):
                    q["pregunta"] = "CONTIENE V: ¿Apellido del delantero argentino del Atlético de Madrid, campeón del mundo 2022? (Julián…)"
                    q["respuesta"] = "Álvarez"
                    fixes.append("Álvarez City->Atlético")
                elif letter_ok(L, p, r):
                    pass
                else:
                    # generic: if letter in answer use CONTIENE
                    exp = strip(L)[0]
                    if exp in strip(r) and not CONT.match(p.strip()):
                        q["pregunta"] = f"CONTIENE {L}: {p}"
                        fixes.append(f"AUTO_CONTIENE {L}: {p[:40]}")
                    else:
                        fixes.append(f"STILL {L}: {p[:50]} => {r}")
            # Also fix Álvarez City even if letter ok
            if "CONTIENE V:" in p and "Manchester City" in p and "Álvarez" in r:
                q["pregunta"] = "CONTIENE V: ¿Apellido del delantero argentino del Atlético de Madrid, campeón del mundo 2022? (Julián…)"
                fixes.append("Álvarez City wording")
            if "juega en el Manchester City" in p and "Bernardo" not in r:
                # soft present for Bernardo is ok-ish; leave Guardiola-like
                pass
            if re.search(r"que juega en el Manchester City", p, re.I):
                q["pregunta"] = re.sub(r"que juega en el Manchester City", "figura del Manchester City", p, flags=re.I)
                fixes.append(f"soft juega City: {p[:40]}")
            if re.search(r"que dirige al Manchester City", p, re.I):
                q["pregunta"] = re.sub(r"que dirige al Manchester City", "del Manchester City (era Guardiola)", p, flags=re.I)
                fixes.append("soft dirige City")
    save(path, data)
    left = sum(1 for b in data for q in b["preguntas"] if not letter_ok(b["letra"], q["pregunta"], q["respuesta"]))
    fixes.append(f"LEFT={left}")
    return fixes


def fix_qsm_mc():
    fixes = []
    for lvl in range(1, 7):
        path = DATA / f"level_{lvl}.json"
        data = load(path)
        for q in data.get("preguntas", []):
            p = q.get("pregunta") or q.get("question") or ""
            opts = q.get("opciones")
            correcta = q.get("respuesta_correcta") or q.get("correcta")
            r = q.get("respuesta") or q.get("answer") or ""
            blob = p + " " + (json.dumps(opts, ensure_ascii=False) if opts else "") + " " + str(r)
            changed = False
            # Free-text answers
            if r and ("mbappé" in p.lower() or "mbappe" in p.lower()):
                if strip(r) in ("psg", "paris saint-germain", "paris saint germain"):
                    if any(x in p.lower() for x in ("dónde", "donde", "actual", "club")):
                        q["respuesta"] = "Real Madrid"
                        q["answer"] = "Real Madrid"
                        changed = True
            if opts and isinstance(opts, dict):
                # If question asks current Mbappé club and correct is PSG -> flip
                if re.search(r"mbapp[eé].*(club|juega|actual)|dónde juega.*mbapp", p, re.I):
                    for k, v in opts.items():
                        if strip(str(v)) in ("psg", "paris saint-germain", "paris saint germain"):
                            opts[k] = "Real Madrid"
                            if correcta == k:
                                changed = True
                            else:
                                # find Real Madrid key
                                for k2, v2 in opts.items():
                                    if "real madrid" in strip(str(v2)):
                                        q["respuesta_correcta"] = k2
                                        changed = True
                    q["opciones"] = opts
                if re.search(r"(jul[ií]an|álvarez|alvarez).*(club|juega|actual)|dónde juega.*(jul|álvarez)", p, re.I):
                    for k, v in list(opts.items()):
                        if "manchester city" in strip(str(v)) or strip(str(v)) == "city":
                            opts[k] = "Atlético Madrid"
                            changed = True
                    q["opciones"] = opts
                # Libertadores 2025 wrong answer
                if "libertadores 2025" in p.lower() and correcta:
                    for k, v in opts.items():
                        if strip(str(v)) == "flamengo" and correcta != k:
                            q["respuesta_correcta"] = k
                            changed = True
                        # if correct points to wrong club
                    if correcta in opts and "flamengo" not in strip(str(opts[correcta])):
                        for k, v in opts.items():
                            if strip(str(v)) == "flamengo":
                                q["respuesta_correcta"] = k
                                changed = True
                if "balón de oro 2025" in p.lower() or "balon de oro 2025" in p.lower():
                    if correcta in opts and "dembele" not in strip(str(opts[correcta])) and "dembélé" not in strip(str(opts.get(correcta, ""))):
                        for k, v in opts.items():
                            if "dembele" in strip(str(v)) or "dembélé" in str(v).lower():
                                q["respuesta_correcta"] = k
                                changed = True
                if "mundial 2026" in p.lower() and ("campeón" in p.lower() or "campeon" in p.lower()):
                    if correcta in opts and "espana" not in strip(str(opts[correcta])) and "españa" not in str(opts.get(correcta, "")).lower():
                        for k, v in opts.items():
                            if "españa" in str(v).lower() or strip(str(v)) == "espana":
                                q["respuesta_correcta"] = k
                                changed = True
                if re.search(r"champions.*2024/25|champions.*2024-25|champions league 2024", p, re.I):
                    if correcta in opts and "paris" not in strip(str(opts[correcta])) and "psg" not in strip(str(opts[correcta])):
                        for k, v in opts.items():
                            if "paris" in strip(str(v)) or strip(str(v)) == "psg":
                                q["respuesta_correcta"] = k
                                changed = True
            if changed:
                fixes.append(f"L{lvl}: {p[:70]}")
        save(path, data)
    return fixes


def fix_wordle():
    path = DATA / "wordle_pool.json"
    data = load(path)
    fixes = []
    by_answer = {strip(x.get("answer")): x for x in data}
    # Ensure key players
    required = [
        {
            "id": "mbappe-rm",
            "type": "player",
            "name": "Kylian Mbappé",
            "answer": "MBAPPE",
            "nationality": "FRA",
            "position": "DEL",
            "club": "Real Madrid",
            "birth": 1998,
        },
        {
            "id": "julian-alvarez",
            "type": "player",
            "name": "Julián Álvarez",
            "answer": "ALVAREZ",
            "nationality": "ARG",
            "position": "DEL",
            "club": "Atlético Madrid",
            "birth": 2000,
        },
    ]
    for req in required:
        key = strip(req["answer"])
        if key in by_answer:
            it = by_answer[key]
            if strip(it.get("club", "")) != strip(req["club"]):
                fixes.append(f"update club {it.get('name')}: {it.get('club')}=>{req['club']}")
                it["club"] = req["club"]
        else:
            data.append(req)
            fixes.append(f"add {req['name']}")
    # Dembélé club if present
    for it in data:
        if "dembele" in strip(it.get("name", "")) or strip(it.get("answer")) == "dembele":
            # Balón 2025 at PSG historically for that season — OK if club is PSG
            if not it.get("club"):
                it["club"] = "Paris Saint-Germain"
                fixes.append("dembele club set PSG")
    save(path, data)
    return fixes


def main():
    f1 = fix_combinadas()
    f2 = fix_qsm_mc()
    f3 = fix_wordle()
    print("combinadas", len(f1), "left", [x for x in f1 if x.startswith("LEFT") or x.startswith("STILL")])
    print("qsm", len(f2))
    print("wordle", len(f3))
    for x in f1[-5:]:
        print(x)
    for x in f2[:20]:
        print(x)
    for x in f3:
        print(x)


if __name__ == "__main__":
    main()
