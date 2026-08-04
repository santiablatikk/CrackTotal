# -*- coding: utf-8 -*-
"""Audit + P0 content fixes for Crack Total question banks (truth date: 2026-08-04)."""
from __future__ import annotations

import json
import re
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"
TRUTH = "2026-08-04"

# Verified facts as of 2026-08-04
FACTS = {
    "ballon_2025": "Dembélé",
    "ballon_2025_full": "Ousmane Dembélé",
    "ballon_2024": "Rodri",
    "ucl_2025": "Paris Saint-Germain",
    "ucl_2025_short": "PSG",
    "libertadores_2025": "Flamengo",
    "wc_2026": "España",
    "wc_2022": "Argentina",
}

changes: list[dict] = []


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def note(file: str, where: str, before: str, after: str, kind: str) -> None:
    changes.append(
        {
            "file": file,
            "where": where,
            "kind": kind,
            "before": before,
            "after": after,
        }
    )


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


# ---------- Pasala / preguntas_combinadas (letter banks) ----------

def iter_letter_bank(data):
    for bi, block in enumerate(data):
        letra = block.get("letra", "?")
        for qi, q in enumerate(block.get("preguntas", [])):
            yield bi, qi, letra, q


def fix_letter_question(q: dict, file: str, where: str) -> bool:
    """Return True if modified."""
    pregunta = q.get("pregunta") or ""
    respuesta = q.get("respuesta") or ""
    p_low = pregunta.lower()
    r_low = respuesta.lower()
    original_p, original_r = pregunta, respuesta
    changed = False

    # --- World Cup currency ---
    if re.search(r"campe[oó]n(a)? (actual|vigente|del mundo actual|mundial actual)", p_low) or (
        "actual" in p_low and "mundial" in p_low and "campeón" in p_low
    ):
        if "argentina" in r_low or r_low.strip() in {"argentina", "selección argentina"}:
            q["pregunta"] = re.sub(
                r"(?i)actual(mente)?|vigente",
                "del Mundial 2026",
                pregunta,
                count=1,
            )
            # Prefer clear wording
            if "2026" not in q["pregunta"]:
                q["pregunta"] = (
                    "¿Qué selección ganó el Mundial 2026?"
                    if "selección" in p_low or "país" in p_low
                    else "¿Quién ganó el Mundial 2026?"
                )
            q["respuesta"] = "España"
            changed = True

    # "último mundial" without year implying 2022 when now 2026 exists
    if re.search(r"último mundial|mundial m[aá]s reciente|pasado mundial", p_low) and "2022" not in p_low and "2026" not in p_low:
        if "argentina" in r_low:
            q["pregunta"] = re.sub(
                r"(?i)último mundial|mundial m[aá]s reciente|pasado mundial",
                "Mundial 2026",
                pregunta,
            )
            q["respuesta"] = "España"
            changed = True

    # Explicit wrong: Argentina still current champions after 2026
    if ("campeón del mundo" in p_low or "campeona del mundo" in p_low) and "2022" not in p_low:
        if "actual" in p_low or "hoy" in p_low or "vigente" in p_low:
            if "argentina" in r_low:
                q["pregunta"] = "¿Qué selección es la campeona del Mundial 2026?"
                q["respuesta"] = "España"
                changed = True

    # Anchor Messi 8 Ballons if still said as current max without year - OK historically still true as of 2026 (Dembélé has 1)
    # Balón de Oro "último" / "más reciente" / "2025" wrong answers
    if re.search(r"bal[oó]n de oro (2025|m[aá]s reciente|actual|vigente|del a[nñ]o pasado)", p_low) or (
        "balón de oro" in p_low and ("último" in p_low or "mas reciente" in p_low or "más reciente" in p_low)
    ):
        if "rodri" in r_low or "messi" in r_low or "vinicius" in r_low or "yamal" in r_low:
            if "2024" in p_low and "rodri" in r_low:
                pass  # historically correct
            else:
                q["pregunta"] = re.sub(
                    r"(?i)bal[oó]n de oro( masculino)?( 2025| m[aá]s reciente| actual| vigente| del a[nñ]o pasado)?",
                    "Balón de Oro 2025",
                    pregunta,
                    count=1,
                )
                if "apellido" in p_low or len(respuesta.split()) == 1:
                    q["respuesta"] = "Dembélé"
                else:
                    q["respuesta"] = "Ousmane Dembélé"
                changed = True

    # Explicit Balón de Oro 2024 as "actual" should be anchored
    if "balón de oro 2024" in p_low or "balon de oro 2024" in p_low:
        if "actual" in p_low or "vigente" in p_low:
            q["pregunta"] = pregunta.replace("actual", "").replace("vigente", "")
            q["pregunta"] = re.sub(r"\s+", " ", q["pregunta"]).strip()
            changed = True

    # Champions League latest winner
    if re.search(r"(última|ultimo|m[aá]s reciente|actual|vigente).{0,40}champions", p_low) or re.search(
        r"champions.{0,40}(última|ultimo|m[aá]s reciente|actual|vigente)", p_low
    ):
        if "2024" not in p_low and "2025" not in p_low:
            if any(x in r_low for x in ["real madrid", "madrid", "city", "manchester city", "inter"]):
                q["pregunta"] = "¿Qué club ganó la Champions League 2024/25?"
                q["respuesta"] = "Paris Saint-Germain" if "apellido" not in p_low else "PSG"
                # prefer full name for club answers
                q["respuesta"] = "Paris Saint-Germain"
                changed = True

    if re.search(r"champions league 202[45]|champions 202[45]|ucl 202[45]", p_low):
        if "2024/25" in p_low or "2024-25" in p_low or "2025" in p_low:
            if any(x in r_low for x in ["real madrid", "madrid"]) and "psg" not in r_low and "paris" not in r_low:
                q["respuesta"] = "Paris Saint-Germain"
                changed = True

    # Libertadores latest
    if re.search(r"(última|ultimo|m[aá]s reciente|actual|vigente).{0,40}libertadores", p_low) or re.search(
        r"libertadores.{0,40}(última|ultimo|m[aá]s reciente|actual|vigente)", p_low
    ):
        if "2024" not in p_low and "2025" not in p_low:
            if any(x in r_low for x in ["botafogo", "fluminense", "palmeiras", "river", "boca"]):
                q["pregunta"] = "¿Qué club ganó la Copa Libertadores 2025?"
                q["respuesta"] = "Flamengo"
                changed = True

    if "libertadores 2025" in p_low and "botafogo" in r_low:
        q["respuesta"] = "Flamengo"
        changed = True

    # "actualmente en Al-Nassr" for CR7 - still OK as of mid-2026 typically
    # Mbappé "actualmente en PSG" -> Real Madrid
    if "mbapp" in p_low and "actualmente" in p_low and ("psg" in p_low or "paris" in p_low):
        q["pregunta"] = re.sub(r"(?i)actualmente en (el )?(PSG|Paris Saint-Germain)", "que fichó por el Real Madrid en 2024", pregunta)
        if "psg" in r_low or "paris" in r_low:
            q["respuesta"] = "Mbappé" if "apellido" in p_low or len(respuesta.split()) <= 2 else "Kylian Mbappé"
        changed = True

    if "mbapp" in p_low and ("psg" in r_low or "paris saint" in r_low) and "club" in p_low:
        q["respuesta"] = "Real Madrid"
        changed = True

    # Soft-anchor "actualmente" for Messi Inter Miami (still OK) — leave
    # Convert bare "actualmente" award questions that claim Rodri is current Ballon
    if "rodri" in r_low and "balón de oro" in p_low and ("actual" in p_low or "vigente" in p_low or "último" in p_low or "mas reciente" in p_low or "más reciente" in p_low):
        if "2024" not in p_low:
            q["pregunta"] = "¿Quién ganó el Balón de Oro 2025?"
            q["respuesta"] = "Ousmane Dembélé" if "apellido" not in p_low else "Dembélé"
            changed = True

    # Fix "8 veces Balón de Oro actualmente" — still true for Messi
    # Golden Boy 2024 Lamine Yamal — historically OK

    if changed:
        # light clean
        q["pregunta"] = norm(q.get("pregunta", ""))
        q["respuesta"] = norm(q.get("respuesta", ""))
        note(
            file,
            where,
            f"{original_p} => {original_r}",
            f"{q['pregunta']} => {q['respuesta']}",
            "updated",
        )
    return changed


def process_letter_bank(path: Path) -> int:
    data = load(path)
    n = 0
    for bi, qi, letra, q in iter_letter_bank(data):
        if fix_letter_question(q, path.name, f"{letra}.{qi}"):
            n += 1
    if n:
        save(path, data)
    return n


# ---------- level_X for QSM ----------

def process_level_bank(path: Path) -> int:
    data = load(path)
    preguntas = data.get("preguntas", [])
    n = 0
    for i, q in enumerate(preguntas):
        # level format may use pregunta/respuesta or question/answer
        if "pregunta" not in q and "question" in q:
            q["pregunta"] = q.get("question", "")
            q["respuesta"] = q.get("answer", q.get("respuesta", ""))
        fake = {"pregunta": q.get("pregunta", ""), "respuesta": q.get("respuesta", "")}
        if fix_letter_question(fake, path.name, f"q{i}"):
            q["pregunta"] = fake["pregunta"]
            q["respuesta"] = fake["respuesta"]
            if "question" in q:
                q["question"] = fake["pregunta"]
            if "answer" in q:
                q["answer"] = fake["respuesta"]
            n += 1
    if n:
        save(path, data)
    return n


# ---------- Wordle clubs ----------

WORDLE_CLUB_FIXES = {
    # answer lower -> club
    "mbappe": "Real Madrid",
    "mbappé": "Real Madrid",
    "haaland": "Manchester City",
    "messi": "Inter Miami",
    "cristiano": "Al-Nassr",
    "ronaldo": "Al-Nassr",
    "dembele": "Paris Saint-Germain",
    "dembélé": "Paris Saint-Germain",
    "yamal": "Barcelona",
    "bellingham": "Real Madrid",
    "vinicius": "Real Madrid",
    "rodri": "Manchester City",
}


def process_wordle(path: Path) -> int:
    data = load(path)
    n = 0
    for i, entry in enumerate(data):
        ans = (entry.get("answer") or entry.get("name") or "").lower()
        ans_fold = ans.replace("é", "e").replace("á", "a").replace("í", "i").replace("ó", "o").replace("ú", "u")
        club = entry.get("club") or ""
        for key, new_club in WORDLE_CLUB_FIXES.items():
            key_fold = key.replace("é", "e")
            if key_fold in ans_fold or key in ans:
                if club != new_club and (not club or club != new_club):
                    # only update if known mismatch patterns
                    if key_fold in {"mbappe", "dembele"} or club in {"PSG", "Paris Saint-Germain", "Real Madrid", "Manchester United", ""}:
                        if key_fold == "mbappe" and club in {"PSG", "Paris Saint-Germain", "Monaco", ""}:
                            before = f"{entry.get('name')} @ {club}"
                            entry["club"] = "Real Madrid"
                            note(path.name, f"#{i}", before, f"{entry.get('name')} @ Real Madrid", "wordle-club")
                            n += 1
                        elif key_fold == "dembele" and club and "Paris" not in club and club != "PSG":
                            before = f"{entry.get('name')} @ {club}"
                            entry["club"] = "Paris Saint-Germain"
                            note(path.name, f"#{i}", before, f"{entry.get('name')} @ Paris Saint-Germain", "wordle-club")
                            n += 1
                break
        # Add Dembélé if missing as 2025 Ballon winner target — optional, skip inventing
    if n:
        save(path, data)
    return n


# ---------- Top10: fix known outdated sets ----------

def process_top10(path: Path) -> int:
    data = load(path)
    n = 0
    for i, item in enumerate(data):
        title = item.get("title") or ""
        answers = item.get("answers") or []
        t_low = title.lower()
        ans_join = " | ".join(answers).lower()

        # If set claims latest UCL winners list wrongly — hard to auto-fix lists
        if "libertadores 2024" in t_low and "botafogo" not in ans_join:
            pass

        if re.search(r"campeón(es)? (actual|vigente|m[aá]s reciente).{0,20}champions", t_low):
            item["title"] = "Campeón de la Champions League 2024/25"
            item["answers"] = ["Paris Saint-Germain", "PSG", "Paris SG"]
            note(path.name, f"#{i}", title, item["title"], "top10-title")
            n += 1

        if re.search(r"campeón(es)? (actual|vigente|m[aá]s reciente).{0,20}libertadores", t_low):
            item["title"] = "Campeón de la Copa Libertadores 2025"
            item["answers"] = ["Flamengo", "CR Flamengo", "Mengão"]
            note(path.name, f"#{i}", title, item["title"], "top10-title")
            n += 1

        if re.search(r"campeón(a)? (actual|vigente).{0,20}mundial", t_low) or re.search(
            r"selección.{0,20}campeón(a)? del mundo(?! 2022)", t_low
        ):
            if "2022" not in t_low:
                item["title"] = "Campeón del Mundial 2026"
                item["answers"] = ["España", "Spain", "Selección Española"]
                note(path.name, f"#{i}", title, item["title"], "top10-title")
                n += 1

        # Subjective "mejores de la historia" — leave for now (P2)
    if n:
        save(path, data)
    return n


# ---------- Crack rapido (secondary) ----------

def process_crack_rapido(path: Path) -> int:
    data = load(path)
    cats = data.get("categories") or {}
    n = 0
    if isinstance(cats, dict):
        for cat, questions in cats.items():
            if not isinstance(questions, list):
                continue
            for i, q in enumerate(questions):
                fake = {
                    "pregunta": q.get("question") or q.get("pregunta") or "",
                    "respuesta": q.get("answer") or q.get("respuesta") or "",
                }
                if fix_letter_question(fake, path.name, f"{cat}.{i}"):
                    if "question" in q:
                        q["question"] = fake["pregunta"]
                    if "pregunta" in q:
                        q["pregunta"] = fake["pregunta"]
                    if "answer" in q:
                        q["answer"] = fake["respuesta"]
                    if "respuesta" in q:
                        q["respuesta"] = fake["respuesta"]
                    n += 1
    if n:
        data["lastUpdated"] = TRUTH
        save(path, data)
    return n


# ---------- Mentiroso templates in server.js (string replacements) ----------

SERVER_REPLACEMENTS = [
    (
        re.compile(r"campeón actual del mundo|campeona actual del mundo|actual campeón del mundo", re.I),
        "campeón del Mundial 2026",
    ),
    (
        re.compile(r"último campeón de la Champions(?! League 2024)", re.I),
        "campeón de la Champions League 2024/25",
    ),
]


def process_server_mentiroso(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    orig = text
    n = 0
    # Conservative: only rewrite clearly outdated challenge phrases if present
    pairs = [
        ("campeón mundial actual Argentina", "campeón del Mundial 2026 (España)"),
        ("campeon mundial actual Argentina", "campeón del Mundial 2026 (España)"),
        ("actual campeón de la Champions League (Real Madrid)", "campeón de la Champions 2024/25 (PSG)"),
        ("último campeón de la Champions League es el Real Madrid", "campeón de la Champions 2024/25 es el PSG"),
        ("Balón de Oro actual (Rodri)", "Balón de Oro 2025 (Dembélé)"),
        ("Balón de Oro vigente Rodri", "Balón de Oro 2025 Dembélé"),
    ]
    for a, b in pairs:
        if a.lower() in text.lower():
            # case-insensitive replace via regex
            text2, c = re.subn(re.escape(a), b, text, flags=re.I)
            if c:
                text = text2
                n += c
                note(path.name, "mentirosoCategories", a, b, "server-template")
    if text != orig:
        path.write_text(text, encoding="utf-8")
    return n


def audit_flags(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    pats = {
        "actualmente": r"actualmente",
        "campeon_actual": r"campe[oó]n(a)? actual|actual campe[oó]n",
        "ultimo_mundial": r"último mundial|mundial m[aá]s reciente",
        "ballon_2024_as_latest": r"bal[oó]n de oro (actual|vigente|m[aá]s reciente)",
        "mbappe_psg": r"Mbapp[eé].{0,40}PSG|PSG.{0,40}Mbapp[eé]",
    }
    return {k: len(re.findall(v, text, flags=re.I)) for k, v in pats.items() if re.search(v, text, flags=re.I)}


def main() -> None:
    summary = {}
    summary["pasalache_2025"] = process_letter_bank(DATA / "pasalache_2025.json")
    summary["preguntas_combinadas"] = process_letter_bank(DATA / "preguntas_combinadas.json")
    # backup: sync critical fixes too so it doesn't drift if reused
    summary["preguntas_combinadas_backup"] = process_letter_bank(DATA / "preguntas_combinadas_backup.json")
    for i in range(1, 7):
        summary[f"level_{i}"] = process_level_bank(DATA / f"level_{i}.json")
    summary["wordle_pool"] = process_wordle(DATA / "wordle_pool.json")
    summary["top10_pool"] = process_top10(DATA / "top10_pool.json")
    summary["top10_pool_extended"] = process_top10(DATA / "top10_pool_extended.json")
    summary["crack_rapido"] = process_crack_rapido(DATA / "crack-rapido-mega-questions.json")
    summary["server_mentiroso"] = process_server_mentiroso(ROOT / "server.js")

    # Add a few high-value NEW stable items into pasalache if Balón 2025 missing
    pasalache = load(DATA / "pasalache_2025.json")
    has_dembele_2025 = False
    for block in pasalache:
        for q in block.get("preguntas", []):
            t = (q.get("pregunta") or "") + (q.get("respuesta") or "")
            if "2025" in t and re.search(r"dembel|dembele", t, re.I):
                has_dembele_2025 = True
    if not has_dembele_2025:
        # letter D
        for block in pasalache:
            if block.get("letra") == "D":
                block.setdefault("preguntas", []).insert(
                    0,
                    {
                        "pregunta": "¿Apellido del francés ganador del Balón de Oro 2025?",
                        "respuesta": "Dembélé",
                    },
                )
                note("pasalache_2025.json", "D+new", "(missing)", "Dembélé Balón 2025", "added")
                summary["pasalache_2025"] = summary.get("pasalache_2025", 0) + 1
                break
        # letter E for España mundial
        for block in pasalache:
            if block.get("letra") == "E":
                exists = any("Mundial 2026" in (q.get("pregunta") or "") for q in block.get("preguntas", []))
                if not exists:
                    block.setdefault("preguntas", []).insert(
                        0,
                        {
                            "pregunta": "¿Selección campeona del Mundial 2026?",
                            "respuesta": "España",
                        },
                    )
                    note("pasalache_2025.json", "E+new", "(missing)", "España Mundial 2026", "added")
                    summary["pasalache_2025"] = summary.get("pasalache_2025", 0) + 1
                break
        # letter P for PSG champions
        for block in pasalache:
            if block.get("letra") == "P":
                exists = any("2024/25" in (q.get("pregunta") or "") or "2024-25" in (q.get("pregunta") or "") for q in block.get("preguntas", []))
                if not exists:
                    block.setdefault("preguntas", []).insert(
                        0,
                        {
                            "pregunta": "¿Club francés campeón de la Champions League 2024/25?",
                            "respuesta": "Paris Saint-Germain",
                        },
                    )
                    note("pasalache_2025.json", "P+new", "(missing)", "PSG Champions 2024/25", "added")
                    summary["pasalache_2025"] = summary.get("pasalache_2025", 0) + 1
                break
        # letter F Flamengo
        for block in pasalache:
            if block.get("letra") == "F":
                exists = any("Libertadores 2025" in (q.get("pregunta") or "") for q in block.get("preguntas", []))
                if not exists:
                    block.setdefault("preguntas", []).insert(
                        0,
                        {
                            "pregunta": "¿Club brasileño campeón de la Copa Libertadores 2025?",
                            "respuesta": "Flamengo",
                        },
                    )
                    note("pasalache_2025.json", "F+new", "(missing)", "Flamengo Libertadores 2025", "added")
                    summary["pasalache_2025"] = summary.get("pasalache_2025", 0) + 1
                break
        save(DATA / "pasalache_2025.json", pasalache)

    report = {
        "truthDate": TRUTH,
        "summary": summary,
        "totalChanges": len(changes),
        "samples": changes[:40],
        "postFlags": {
            name: audit_flags(DATA / name)
            for name in [
                "pasalache_2025.json",
                "preguntas_combinadas.json",
                "wordle_pool.json",
            ]
            if (DATA / name).exists()
        },
    }
    out = ROOT / "reports" / "content_audit_2026-08-04.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"summary": summary, "totalChanges": len(changes), "report": str(out)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
