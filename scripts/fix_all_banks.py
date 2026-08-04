#!/usr/bin/env python3
"""Fix all active question banks — letter rule + critical factual anchors (2026-08-04)."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"
REPORT = ROOT / "scripts" / "_banks_fix_report.md"

CONT = re.compile(r"^CONTIENE\s+([A-ZÑÁÉÍÓÚÜ]):", re.I)


def strip(s: str) -> str:
    s = (s or "").replace("Ø", "O").replace("ø", "o").replace("Đ", "D").replace("đ", "d")
    s = unicodedata.normalize("NFD", s)
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower().strip()


def letter_ok(letra: str, pregunta: str, respuesta: str) -> bool:
    exp = strip(letra)[0]
    rn = strip(respuesta)
    m = CONT.match(pregunta.strip())
    if m:
        return strip(m.group(1))[0] == exp and exp in rn
    if pregunta.upper().startswith("CONTIENE"):
        return False
    return bool(rn) and rn.startswith(exp)


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


# Exact pregunta replacements in preguntas_combinadas (any letter block)
COMBINADAS_BY_PREGUNTA: dict[str, tuple[str, str]] = {
    # Misplaced anchors that were inserted under B — rewrite so letter B works OR replace with B-safe facts
    "¿Cuál es el campeón de la Libertadores 2025?": (
        "¿Cuál es el campeón brasileño de la Libertadores 2025? (Club de Río)",
        "Flamengo",  # still wrong letter if under B — handled by move logic
    ),
    "¿Cuál es el campeón de la Champions League 2024/25?": (
        "¿Cuál es el campeón francés de la Champions League 2024/25?",
        "Paris Saint-Germain",
    ),
    "¿Cuál es el campeón del Mundial 2026?": (
        "¿Cuál es la selección campeona del Mundial 2026?",
        "España",
    ),
    "¿Apellido del francés ganador del Balón de Oro 2025?": (
        "¿Apellido del francés ganador del Balón de Oro 2025?",
        "Dembélé",
    ),
    # Letter-broken items
    "¿Apellido del ex futbolista inglés, leyenda del Manchester United y de la selección inglesa, conocido como 'Bobby'?": (
        "CONTIENE B: ¿Apellido del ex futbolista inglés leyenda del Manchester United, Bobby …?",
        "Charlton",
    ),
    "¿Cuál es el barrio de Buenos Aires donde se encuentra el estadio de Boca Juniors?": (
        "¿Barrio de Buenos Aires del estadio de Boca Juniors (La …)?",
        "Boca",
    ),
    "¿Cuál es uno de los principales clubes de fútbol de la ciudad de Brujas, en Bélgica?": (
        "¿Club belga de Brujas habitual en Champions (Club …)?",
        "Brugge",
    ),
    "¿Cuál es el club de fútbol de la ciudad de Cali, en Colombia, conocido como 'El Azucarero'?": (
        "CONTIENE C: ¿Club de Cali (Colombia) conocido como 'El Azucarero'?",
        "Deportivo Cali",
    ),
    "¿Cuál es el club alemán de la Bundesliga que viste de amarillo y negro, con sede en Dortmund?": (
        "CONTIENE D: ¿Club alemán de amarillo y negro con sede en Dortmund?",
        "Borussia Dortmund",
    ),
    "Delantero noruego del Manchester City": (
        "CONTIENE E: ¿Apellido del delantero noruego estrella del Manchester City?",
        "Haaland",
    ),
    "Nombre completo del delantero noruego del Manchester City, conocido por su potencia y capacidad goleadora": (
        "CONTIENE E: ¿Apellido del delantero noruego goleador del Manchester City?",
        "Haaland",
    ),
    "¿Cuál es el club italiano de la ciudad homónima, siete veces campeón de Europa?": (
        "CONTIENE M: ¿Club italiano de Milán apodado Rossoneri, múltiple campeón de Europa?",
        "Milan",
    ),
    "¿Apellido del mediocampista noruego, capitán del Arsenal FC?": (
        "¿Apellido del mediocampista noruego capitán del Arsenal, Martin …?",
        "Odegaard",
    ),
    "Club francés de la capital, donde jugaron Neymar y Mbappé.": (
        "¿Club francés de París donde coincidieron Neymar y Mbappé?",
        "Paris Saint-Germain",
    ),
    "¿Cuál es el club italiano de la capital, donde Francesco Totti es una leyenda?": (
        "¿Club italiano de la capital donde Francesco Totti es leyenda?",
        "Roma",
    ),
    "¿Nombre completo del ex mediocampista marfileño, leyenda del Manchester City?": (
        "CONTIENE T: ¿Nombre completo del mediocampista marfileño leyenda del Manchester City, Yaya …?",
        "Yaya Touré",
    ),
    "¿Cuál es el club de fútbol de la Premier League que juega sus partidos como local en Old Trafford?": (
        "CONTIENE U: ¿Club de la Premier que juega en Old Trafford?",
        "Manchester United",
    ),
    "¿Qué país europeo, cuya capital es Luxemburgo, tiene una selección de fútbol afiliada a la UEFA?": (
        "CONTIENE X: ¿País europeo cuya capital es Luxemburgo?",
        "Luxemburgo",
    ),
    "¿Nombre del estadio principal de Yokohama, Japón, que fue sede de la final del Mundial 2002?": (
        "¿Ciudad japonesa sede de la final del Mundial 2002 (estadio internacional)?",
        "Yokohama",
    ),
    "¿Cuál es el club español de la región de Aragón, con sede en la ciudad de Zaragoza?": (
        "CONTIENE Z: ¿Club español de Aragón con sede en Zaragoza?",
        "Real Zaragoza",
    ),
}

# Global factual text replacements (substring in pregunta or respuesta fields)
FACTUAL_SUBS: list[tuple[str, str]] = [
    ("Club francés de la capital, donde jugaron Neymar y Mbappé.", "¿Club francés de París donde coincidieron Neymar y Mbappé?"),
]

# Move misplaced anchors: remove from wrong letter, ensure present under correct letter
ANCHORS_TO_ENSURE = {
    "D": [
        {
            "pregunta": "¿Apellido del francés ganador del Balón de Oro 2025?",
            "respuesta": "Dembélé",
        }
    ],
    "E": [
        {
            "pregunta": "¿Selección campeona del Mundial 2026?",
            "respuesta": "España",
        }
    ],
    "F": [
        {
            "pregunta": "¿Club brasileño campeón de la Copa Libertadores 2025?",
            "respuesta": "Flamengo",
        }
    ],
    "P": [
        {
            "pregunta": "¿Club francés campeón de la Champions League 2024/25?",
            "respuesta": "Paris Saint-Germain",
        }
    ],
}

REMOVE_FROM_B = {
    "¿Cuál es el campeón de la Libertadores 2025?",
    "¿Cuál es el campeón de la Champions League 2024/25?",
    "¿Cuál es el campeón del Mundial 2026?",
    "¿Apellido del francés ganador del Balón de Oro 2025?",
}


def fix_combinadas() -> list[str]:
    path = DATA / "preguntas_combinadas.json"
    data = load(path)
    fixes = []

    for block in data:
        L = block["letra"]
        kept = []
        for q in block["preguntas"]:
            p = q["pregunta"]
            # remove misplaced anchors from B
            if L == "B" and p in REMOVE_FROM_B:
                fixes.append(f"[B] REMOVE misplaced: {p}")
                continue
            if p in COMBINADAS_BY_PREGUNTA:
                np, nr = COMBINADAS_BY_PREGUNTA[p]
                # skip if this was a remove-only case already handled
                if L == "B" and p in REMOVE_FROM_B:
                    continue
                if (np, nr) != (p, q["respuesta"]):
                    fixes.append(f"[{L}] {p[:50]} => {np[:50]} | {nr}")
                q["pregunta"], q["respuesta"] = np, nr
            # Soft: actualmente → reformulate lightly in pregunta only
            if "actualmente" in q["pregunta"].lower():
                old = q["pregunta"]
                q["pregunta"] = re.sub(r"\bactualmente\b", "en su carrera", q["pregunta"], flags=re.I)
                q["pregunta"] = re.sub(r", en su carrera,", ",", q["pregunta"])
                if q["pregunta"] != old:
                    fixes.append(f"[{L}] actualmente soft: {old[:55]}")
            kept.append(q)
        block["preguntas"] = kept

    # Ensure anchors under correct letters
    by_letter = {b["letra"]: b for b in data}
    for L, items in ANCHORS_TO_ENSURE.items():
        block = by_letter[L]
        existing = {(strip(q["pregunta"]), strip(q["respuesta"])) for q in block["preguntas"]}
        for item in items:
            key = (strip(item["pregunta"]), strip(item["respuesta"]))
            if key not in existing:
                block["preguntas"].append(item)
                fixes.append(f"[{L}] ADD anchor: {item['pregunta']} => {item['respuesta']}")
                existing.add(key)

    # Second pass: any remaining letter issues — auto CONTIENE or flag
    still = []
    for block in data:
        L = block["letra"]
        for q in block["preguntas"]:
            if not letter_ok(L, q["pregunta"], q["respuesta"]):
                still.append((L, q["pregunta"], q["respuesta"]))

    # Auto-fix remaining: if answer contains letter, prefix CONTIENE; else rewrite answer path minimal
    for L, p, r in still:
        block = by_letter[L]
        for q in block["preguntas"]:
            if q["pregunta"] == p and q["respuesta"] == r:
                exp = strip(L)[0]
                rn = strip(r)
                if exp in rn and not CONT.match(p.strip()):
                    q["pregunta"] = f"CONTIENE {L}: {p}"
                    fixes.append(f"[{L}] AUTO_CONTIENE: {p[:55]}")
                elif not rn.startswith(exp):
                    # last resort: leave and report
                    fixes.append(f"[{L}] REVIEW_HUMAN: {p[:55]} => {r}")
                break

    save(path, data)
    # final count
    n_iss = sum(
        1
        for b in data
        for q in b["preguntas"]
        if not letter_ok(b["letra"], q["pregunta"], q["respuesta"])
    )
    fixes.append(f"FINAL_LETTER_ISSUES={n_iss}")
    return fixes


def fix_wordle() -> list[str]:
    path = DATA / "wordle_pool.json"
    data = load(path)
    fixes = []
    seen = set()
    out = []
    for it in data:
        name = it.get("name") or ""
        answer = strip(it.get("answer") or "")
        club = it.get("club") or ""
        low_name = strip(name)
        # Mbappé must be Real Madrid
        if "mbappe" in low_name or answer == "mbappe":
            if strip(club) != "real madrid":
                fixes.append(f"Mbappé club {club} => Real Madrid")
                it["club"] = "Real Madrid"
        # Julián Álvarez Atlético
        if ("alvarez" in low_name or "álvarez" in strip(name) or answer in ("alvarez", "julian alvarez", "julian")) and "julian" in low_name:
            if "city" in strip(club):
                fixes.append(f"Álvarez club {club} => Atlético Madrid")
                it["club"] = "Atlético Madrid"
        if "messi" in low_name and "miami" not in strip(club):
            fixes.append(f"Messi club {club} => Inter Miami")
            it["club"] = "Inter Miami"
        # dedupe by answer
        if answer in seen:
            fixes.append(f"DROP_DUP {name} ({answer})")
            continue
        seen.add(answer)
        out.append(it)
    save(path, out)
    return fixes


def fix_qsm() -> list[str]:
    fixes = []
    replacements = [
        (re.compile(r"Mbapp[eé].{0,20}PSG|PSG.{0,20}Mbapp[eé]", re.I), None),  # handled case by case
    ]
    # concrete string fixes across levels
    pair_fixes = [
        ("Paris Saint-Germain", "Real Madrid", "mbappé"),  # if question says where Mbappé plays now
    ]
    for lvl in range(1, 7):
        path = DATA / f"level_{lvl}.json"
        data = load(path)
        qs = data.get("preguntas", [])
        for q in qs:
            p = q.get("pregunta") or q.get("question") or ""
            r = q.get("respuesta") or q.get("answer") or ""
            pl, rl = p.lower(), r.lower()
            changed = False
            # Mbappé current club
            if "mbappé" in pl or "mbappe" in pl:
                if "psg" in pl or "paris" in pl:
                    if "dónde juega" in pl or "donde juega" in pl or "actual" in pl or "club actual" in pl:
                        q["pregunta"] = re.sub(r"PSG|Paris Saint-Germain|París Saint-Germain", "Real Madrid", p, flags=re.I)
                        q["question"] = q["pregunta"]
                        if strip(r) in ("psg", "paris saint-germain", "paris saint germain"):
                            q["respuesta"] = "Real Madrid"
                            q["answer"] = "Real Madrid"
                        changed = True
                if strip(r) in ("psg", "paris saint-germain") and ("mbappé" in pl or "mbappe" in pl):
                    q["respuesta"] = "Real Madrid"
                    q["answer"] = "Real Madrid"
                    changed = True
            if ("julían" in pl or "julian" in pl or "álvarez" in pl or "alvarez" in pl) and "city" in pl:
                q["pregunta"] = re.sub(r"Manchester City|Man City|City", "Atlético Madrid", p, flags=re.I)
                q["question"] = q["pregunta"]
                if "city" in strip(r):
                    q["respuesta"] = "Atlético Madrid"
                    q["answer"] = "Atlético Madrid"
                changed = True
            if "messi" in pl and ("psg" in pl or "barcelona" in pl) and ("actual" in pl or "dónde juega" in pl or "donde juega" in pl):
                q["pregunta"] = re.sub(r"PSG|Barcelona|Paris Saint-Germain", "Inter Miami", p, flags=re.I)
                q["question"] = q["pregunta"]
                if strip(r) in ("psg", "barcelona", "paris saint-germain"):
                    q["respuesta"] = "Inter Miami"
                    q["answer"] = "Inter Miami"
                changed = True
            # Soft actualmente
            if "actualmente" in pl:
                q["pregunta"] = re.sub(r"\bactualmente\b", "en su carrera", p, flags=re.I)
                q["question"] = q["pregunta"]
                changed = True
            if changed:
                fixes.append(f"L{lvl}: {p[:60]}")
        save(path, data)
    return fixes


def fix_pasala_default() -> list[str]:
    """Minor polish only — letter already 0."""
    path = DATA / "pasalache_2025.json"
    data = load(path)
    fixes = []
    for block in data:
        for q in block["preguntas"]:
            # Rodri 2024 is correct historically — ensure wording is clear
            if "Balón de Oro 2024" in q["pregunta"] and q["respuesta"] == "Rodri":
                # already clear
                pass
            if "actualmente" in q["pregunta"].lower():
                old = q["pregunta"]
                q["pregunta"] = re.sub(r"\bactualmente\b", "en su carrera", q["pregunta"], flags=re.I)
                if q["pregunta"] != old:
                    fixes.append(old[:60])
    save(path, data)
    return fixes


def fix_top10() -> list[str]:
    fixes = []
    for fname in ["top10_pool.json", "top10_pool_extended.json"]:
        path = DATA / fname
        data = load(path)
        for t in data:
            title = t.get("title", "")
            answers = t.get("answers", [])
            # Ensure answers are strings of length 10
            if len(answers) != 10:
                fixes.append(f"{fname}: {title} has {len(answers)} answers")
            # factual: if title mentions Mbappé club wrong — rare in top10 lists
            blob = title + " " + " ".join(str(a) for a in answers)
            if re.search(r"Mbapp[eé].*PSG|Juli[aá]n.*City", blob, re.I):
                fixes.append(f"{fname} FLAG: {title}")
        save(path, data)
    return fixes


def fix_mentiroso() -> list[str]:
    """Add one stable 2026 template; avoid inventing facts."""
    path = ROOT / "server.js"
    text = path.read_text(encoding="utf-8")
    fixes = []
    needle = '{ template: "Puedo nombrar X selecciones que participaron en el Mundial de 2022 (fase final)." },'
    add = (
        '{ template: "Puedo nombrar X selecciones que llegaron a semifinales del Mundial 2026." },\n'
        '    { template: "Puedo nombrar X jugadores que disputaron la final del Mundial 2026." },'
    )
    if "Mundial 2026" not in text and needle in text:
        text = text.replace(needle, needle + "\n    " + add, 1)
        path.write_text(text, encoding="utf-8", newline="\n")
        fixes.append("Added Mundial 2026 mentiroso templates")
    elif "Mundial 2026" in text:
        fixes.append("Mentiroso already has 2026 refs")
    return fixes


def recount_letters(path: Path) -> int:
    data = load(path)
    return sum(
        1
        for b in data
        for q in b["preguntas"]
        if not letter_ok(b["letra"], q["pregunta"], q["respuesta"])
    )


def main():
    report = ["# Banks fix report (2026-08-04)", ""]
    all_fixes = {}

    all_fixes["pasalache_2025"] = fix_pasala_default()
    all_fixes["preguntas_combinadas"] = fix_combinadas()
    all_fixes["wordle"] = fix_wordle()
    all_fixes["qsm"] = fix_qsm()
    all_fixes["top10"] = fix_top10()
    all_fixes["mentiroso"] = fix_mentiroso()

    pasala_iss = recount_letters(DATA / "pasalache_2025.json")
    comb_iss = recount_letters(DATA / "preguntas_combinadas.json")
    report.append(f"- pasalache_2025 letter-issues: **{pasala_iss}**")
    report.append(f"- preguntas_combinadas letter-issues: **{comb_iss}**")
    report.append("")
    for k, v in all_fixes.items():
        report.append(f"## {k} ({len(v)} fixes)")
        for line in v[:80]:
            report.append(f"- {line}")
        if len(v) > 80:
            report.append(f"- … +{len(v)-80} more")
        report.append("")

    REPORT.write_text("\n".join(report), encoding="utf-8")
    print(f"pasala_letter={pasala_iss} combinadas_letter={comb_iss}")
    for k, v in all_fixes.items():
        print(f"{k}: {len(v)}")


if __name__ == "__main__":
    main()
