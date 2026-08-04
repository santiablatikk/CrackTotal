#!/usr/bin/env python3
"""
Quality pass: illogical 'Nombre y apellido, First…' + present-false clubs + title counts.
Truth date: 2026-08-04. De Bruyne = Napoli (ex City leyenda).
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"
REPORT = ROOT / "scripts" / "_quality_pass_report.md"

CONT = re.compile(r"^CONTIENE\s+([A-ZÑÁÉÍÓÚÜ]):", re.I)
# "Nombre y apellido del …, Firstname …?" or "Nombre completo del …, Firstname …?"
REDUNDANT_NAME = re.compile(
    r"^(?P<prefix>CONTIENE [A-ZÑÁÉÍÓÚÜ]: )?"
    r"¿Nombre(?: y apellido| completo) del (?P<body>.+?), (?P<firstname>[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚáéíóúñü\-\.]+) …\?",
    re.I,
)


def strip(s: str) -> str:
    s = (s or "").replace("Ø", "O").replace("ø", "o")
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


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def save(p: Path, data) -> None:
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def surname_from_full(full: str, firstname: str) -> str:
    """If respuesta is 'First Last…', return Last…; else return full."""
    parts = full.strip().split()
    fn = firstname.strip()
    if len(parts) >= 2 and strip(parts[0]) == strip(fn):
        return " ".join(parts[1:])
    # special: Juan Román Riquelme with firstname Juan Román — handled if firstname is multi? our regex is single token
    if strip(fn) == "juan" and strip(full).startswith("juan roman"):
        return "Riquelme" if "riquelme" in strip(full) else " ".join(parts[2:])
    return full


def fix_redundant_name_question(letra: str, pregunta: str, respuesta: str) -> tuple[str, str, str] | None:
    """
    Returns (new_p, new_r, note) or None.
    Prefer: ¿Apellido del BODY, Firstname …? → surname (if surname starts with letter or CONTIENE)
    Else: ¿Nombre completo del BODY? → full name without giving first name in ellipsis
    """
    m = REDUNDANT_NAME.match(pregunta.strip())
    if not m:
        # also catch Juan Román as two tokens before ellipsis
        m2 = re.match(
            r"^(?P<prefix>CONTIENE [A-ZÑÁÉÍÓÚÜ]: )?¿Nombre(?: y apellido| completo) del (?P<body>.+?), (?P<firstname>[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚáéíóúñü\-\.]+(?:\s+[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚáéíóúñü\-\.]+)?) …\?",
            pregunta.strip(),
            re.I,
        )
        if not m2:
            return None
        m = m2

    prefix = m.group("prefix") or ""
    body = m.group("body").strip()
    firstname = m.group("firstname").strip()
    surname = surname_from_full(respuesta, firstname.split()[0])
    # Juan Román case
    if strip(firstname).startswith("juan roman") or (
        strip(firstname) == "juan" and "roman" in strip(respuesta)
    ):
        surname = "Riquelme"
        firstname = "Juan Román"

    # If answer was only the first name somehow, skip
    if strip(surname) == strip(respuesta) and strip(firstname) in strip(respuesta) and len(respuesta.split()) == 1:
        return None

    # Try apellido form if surname matches letter rule
    new_p_ape = f"{prefix}¿Apellido del {body}, {firstname} …?"
    new_r_ape = surname
    if letter_ok(letra, new_p_ape, new_r_ape):
        return new_p_ape, new_r_ape, f"redundant→apellido ({firstname} … / {surname})"

    # Fallback: full name without firstname spoiler
    new_p_full = f"{prefix}¿Nombre completo del {body}?"
    new_r_full = respuesta
    # If respuesta was only surname before, keep full if we can reconstruct
    if strip(respuesta) == strip(surname) and firstname:
        new_r_full = f"{firstname} {surname}".replace("  ", " ")
    if letter_ok(letra, new_p_full, new_r_full):
        return new_p_full, new_r_full, f"redundant→nombre completo ({new_r_full})"

    # CONTIENE if needed
    exp = strip(letra)[0]
    if exp in strip(new_r_ape) and not prefix:
        new_p = f"CONTIENE {letra}: ¿Apellido del {body}, {firstname} …?"
        if letter_ok(letra, new_p, new_r_ape):
            return new_p, new_r_ape, f"redundant→CONTIENE apellido"

    return None


def fix_pasala_file(path: Path) -> list[str]:
    data = load(path)
    fixes = []
    for block in data:
        L = block["letra"]
        for q in block["preguntas"]:
            p, r = q["pregunta"], q["respuesta"]
            old = (p, r)

            # Cruzeiro 5
            if re.search(r"cinco Libertadores|5 Libertadores|con 5", p, re.I) and "Cruzeiro" in r:
                q["pregunta"] = "¿Club brasileño de Belo Horizonte bicampeón de la Copa Libertadores?"
                q["respuesta"] = "Cruzeiro"
                fixes.append(f"[{L}] Cruzeiro 5→bicampeón")

            # De Bruyne present City → Napoli actual OR leyenda City
            if re.search(r"De Bruyne|Kevin …", p, re.I) or strip(r) in ("de bruyne", "kevin de bruyne"):
                if re.search(r"del Manchester City|del City(?! Ground)", p) and not re.search(
                    r"leyenda|ex |ídolo|histórico|estrella histórica|surgido", p, re.I
                ):
                    # Prefer current club Napoli for "del …"
                    if L == "D" or strip(r).startswith("de") or strip(r) == "de bruyne":
                        q["pregunta"] = "¿Apellido del mediocampista belga del Napoli, Kevin …?"
                        q["respuesta"] = "De Bruyne"
                        fixes.append(f"[{L}] De Bruyne City→Napoli")
                    else:
                        q["pregunta"] = re.sub(
                            r"del Manchester City",
                            "leyenda del Manchester City",
                            p,
                            flags=re.I,
                        )
                        fixes.append(f"[{L}] De Bruyne → leyenda City")

            # Illogical nombre y apellido + firstname
            fixed = fix_redundant_name_question(L, q["pregunta"], q["respuesta"])
            if fixed:
                np, nr, note = fixed
                q["pregunta"], q["respuesta"] = np, nr
                fixes.append(f"[{L}] {note}: {old[0][:50]} => {np[:50]} | {nr}")

            # Thiago Silva awkward ", … Silva"
            if ", … Silva?" in q["pregunta"] or ", ... Silva?" in q["pregunta"]:
                q["pregunta"] = "¿Nombre completo del central brasileño leyenda de Milan, PSG y Chelsea?"
                q["respuesta"] = "Thiago Silva"
                fixes.append(f"[{L}] Thiago Silva wording")

            if not letter_ok(L, q["pregunta"], q["respuesta"]):
                fixes.append(f"[{L}] LETTER_BREAK after edit: {q['pregunta'][:50]} => {q['respuesta']}")

    save(path, data)
    return fixes


def fix_combinadas() -> list[str]:
    path = DATA / "preguntas_combinadas.json"
    data = load(path)
    fixes = []
    for block in data:
        L = block["letra"]
        for q in block["preguntas"]:
            p, r = q["pregunta"], q["respuesta"]

            if re.search(r"cinco Libertadores|5 Libertadores", p, re.I):
                q["pregunta"] = re.sub(
                    r"con cinco Libertadores|con 5 Libertadores|cinco Libertadores",
                    "bicampeón de la Libertadores",
                    p,
                    flags=re.I,
                )
                fixes.append(f"[{L}] cinco Libertadores wording")

            # De Bruyne
            if strip(r) in ("de bruyne", "kevin de bruyne") or "De Bruyne" in p or "Kevin …" in p:
                if re.search(r"juega en el Manchester City|del Manchester City|del City", p, re.I):
                    if not re.search(r"leyenda|ex |ídolo|histórico", p, re.I):
                        if "Kevin" in p or "Kevin" in r:
                            q["pregunta"] = re.sub(
                                r"(que )?juega en el Manchester City|del Manchester City",
                                "del Napoli",
                                p,
                                flags=re.I,
                            )
                            # cleanup double
                            q["pregunta"] = re.sub(r"\s{2,}", " ", q["pregunta"])
                            fixes.append(f"[{L}] KDB → Napoli: {p[:45]}")
                        else:
                            q["pregunta"] = re.sub(
                                r"del Manchester City",
                                "leyenda del Manchester City",
                                p,
                                flags=re.I,
                            )
                            fixes.append(f"[{L}] KDB → leyenda")

            fixed = fix_redundant_name_question(L, q["pregunta"], q["respuesta"])
            if fixed:
                np, nr, note = fixed
                # Only apply if letter still ok
                if letter_ok(L, np, nr):
                    q["pregunta"], q["respuesta"] = np, nr
                    fixes.append(f"[{L}] {note}")
                else:
                    fixes.append(f"[{L}] SKIP redundant (letter): {p[:40]}")

    save(path, data)
    left = sum(
        1
        for b in data
        for q in b["preguntas"]
        if not letter_ok(b["letra"], q["pregunta"], q["respuesta"])
    )
    fixes.append(f"LETTER_LEFT={left}")
    return fixes


def fix_wordle_kdb() -> list[str]:
    path = DATA / "wordle_pool.json"
    data = load(path)
    fixes = []
    for it in data:
        name = strip(it.get("name", ""))
        ans = strip(it.get("answer", ""))
        if "de bruyne" in name or ans in ("debruyne", "de bruyne", "bruyne"):
            if strip(it.get("club", "")) != "napoli":
                fixes.append(f"Wordle KDB club {it.get('club')}→Napoli")
                it["club"] = "Napoli"
    save(path, data)
    return fixes


def recount(path: Path) -> tuple[int, int]:
    data = load(path)
    n = sum(len(b["preguntas"]) for b in data)
    bad = sum(
        1
        for b in data
        for q in b["preguntas"]
        if not letter_ok(b["letra"], q["pregunta"], q["respuesta"])
    )
    return n, bad


def main():
    all_fixes = {
        "pasalache_2025": fix_pasala_file(DATA / "pasalache_2025.json"),
        "preguntas_combinadas": fix_combinadas(),
        "wordle": fix_wordle_kdb(),
    }
    n1, b1 = recount(DATA / "pasalache_2025.json")
    n2, b2 = recount(DATA / "preguntas_combinadas.json")

    lines = [
        "# Quality pass report",
        "",
        f"- pasalache_2025: n={n1} letter_issues={b1} fixes={len(all_fixes['pasalache_2025'])}",
        f"- preguntas_combinadas: n={n2} letter_issues={b2} fixes={len(all_fixes['preguntas_combinadas'])}",
        f"- wordle fixes={len(all_fixes['wordle'])}",
        "",
    ]
    for k, v in all_fixes.items():
        lines.append(f"## {k}")
        for x in v:
            lines.append(f"- {x}")
        lines.append("")
    REPORT.write_text("\n".join(lines), encoding="utf-8")
    print(f"pasala {n1}/{b1} fixes={len(all_fixes['pasalache_2025'])}")
    print(f"combinadas {n2}/{b2} fixes={len(all_fixes['preguntas_combinadas'])}")
    print(f"wordle {len(all_fixes['wordle'])}")
    for x in all_fixes["pasalache_2025"][:40]:
        print(x)


if __name__ == "__main__":
    main()
