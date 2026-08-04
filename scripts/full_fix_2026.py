# -*- coding: utf-8 -*-
"""Correccion integral de bancos de preguntas a la verdad 2026-08-04."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"
REPORT = ROOT / "scripts" / "_full_fix_2026.md"

LOG: list[tuple[str, str, str, str]] = []


def log(fil: str, kind: str, before: str, after: str) -> None:
    LOG.append((fil, kind, before, after))


def strip(s) -> str:
    s = unicodedata.normalize("NFD", str(s or ""))
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower().strip()


def read(name: str):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def write(name: str, data) -> None:
    (DATA / name).write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


# ---------------------------------------------------------------- pasalache
# (letra, respuesta) -> nueva pregunta
PASALA_FIX = {
    ("C", "Vinicius Junior"): (
        "CONTIENE C: ¿Nombre deportivo del extremo brasileño del Real Madrid, "
        "segundo en el Balón de Oro 2024?"
    ),
    ("D", "Deschamps"): "¿Apellido del DT campeón del mundo 1998 y 2018 con Francia?",
    ("G", "Girona"): "¿Club catalán que terminó tercero en LaLiga 2023/24?",
    ("H", "Hernán Crespo"): (
        "¿Nombre y apellido del ex delantero argentino ídolo de River, "
        "goleador en Parma, Lazio e Inter?"
    ),
    ("H", "Hansi Flick"): (
        "¿Nombre y apellido del DT alemán que ganó el sextete con el Bayern en 2020?"
    ),
    ("J", "Jordi Alba"): (
        "¿Nombre y apellido del lateral izquierdo español leyenda del Barcelona "
        "que jugó junto a Messi en Inter Miami?"
    ),
    ("J", "Jadon Sancho"): (
        "¿Nombre completo del extremo inglés que brilló en el Borussia Dortmund "
        "antes de fichar por el Manchester United?"
    ),
    ("K", "Kingsley Coman"): (
        "¿Nombre completo del extremo francés autor del gol de la final de la "
        "Champions 2020 para el Bayern?"
    ),
    ("L", "Lewandowski"): (
        "¿Apellido del goleador polaco que brilló en Borussia Dortmund, Bayern "
        "Múnich y Barcelona, Robert …?"
    ),
    ("P", "Paquetá"): (
        "¿Apellido del mediocampista brasileño que brilló en Milan y West Ham, Lucas …?"
    ),
    ("Q", "Querétaro"): "¿Club mexicano de la Liga MX con estadio La Corregidora?",
    ("R", "Rashford"): "¿Apellido del delantero inglés surgido en Manchester United, Marcus …?",
    ("S", "Son"): "¿Apellido del delantero surcoreano ídolo del Tottenham, Heung-min …?",
    ("V", "Vinicius"): (
        "¿Apellido del extremo brasileño del Real Madrid, segundo en el Balón de Oro 2024?"
    ),
}


def fix_pasalache() -> None:
    name = "pasalache_2025.json"
    data = read(name)
    for block in data:
        L = block["letra"]
        for q in block["preguntas"]:
            key = (L, q["respuesta"])
            if key in PASALA_FIX:
                new = PASALA_FIX[key]
                if new != q["pregunta"]:
                    log(name, f"[{L}] {q['respuesta']}", q["pregunta"], new)
                    q["pregunta"] = new
    write(name, data)


# ------------------------------------------------------------- combinadas
# respuesta -> (regex a matchear en la pregunta, nueva pregunta)
COMB_FIX = [
    (
        "De Paul",
        r"juega en Atl[ée]tico Madrid \(Rodrigo\.\.\.\)",
        "Nombre completo del mediocampista argentino campeón del mundo 2022, "
        "ex Atlético de Madrid (Rodrigo...).",
    ),
    (
        "Rodrigo De Paul",
        r"juega en Atl[ée]tico Madrid",
        "Nombre completo del mediocampista argentino campeón del mundo 2022, "
        "ex Valencia, Udinese y Atlético de Madrid.",
    ),
    (
        "Emiliano Martinez",
        r"juega en Aston Villa",
        "Nombre completo del arquero argentino campeón del mundo 2022, ídolo del Aston Villa.",
    ),
    (
        "Martinez",
        r"juega en Aston Villa \(Emiliano\.\.\.\)",
        "Apellido del arquero argentino campeón del mundo 2022, ídolo del Aston Villa "
        "(Emiliano...).",
    ),
    (
        "Everton",
        r"juega en Goodison Park",
        "¿Cuál es el club inglés de la ciudad de Liverpool, clásico rival del Liverpool FC, "
        "que jugó durante más de un siglo en Goodison Park?",
    ),
    (
        "Iniesta",
        r"juega en Emirates Club",
        "Apellido del exfutbolista español, leyenda del Barcelona, autor del gol en la "
        "final del Mundial 2010.",
    ),
    (
        "Instituto",
        r"Club de f[úu]tbol cordob[ée]s que juega en la Primera Divisi[óo]n\.",
        "Club de fútbol cordobés fundado en 1918, apodado 'La Gloria'.",
    ),
    (
        "Cristiano Ronaldo",
        r"CONTIENE L: Futbolista portugu[ée]s, figura hist[óo]rica del Real Madrid, juega en Al Nassr\.",
        "CONTIENE L: Futbolista portugués, figura histórica del Real Madrid, "
        "que fichó por Al Nassr en 2023.",
    ),
    (
        "Lisandro Martinez",
        r"juega en Manchester United",
        "Defensor argentino campeón del mundo 2022, apodado 'Licha', que fichó por "
        "Manchester United en 2022.",
    ),
    (
        "Nahuel Molina",
        r"juega en Atl[ée]tico Madrid",
        "Nombre completo del lateral derecho argentino campeón del mundo 2022, "
        "ex Boca, Udinese y Atlético de Madrid.",
    ),
    (
        "Otamendi",
        r"juega en Benfica",
        "Apellido del defensor argentino campeón del mundo 2022, ex Manchester City "
        "y Benfica (Nicolás...).",
    ),
    (
        "Palacios",
        r"juega en Bayer Leverkusen \(Exequiel\.\.\.\)",
        "Apellido del mediocampista argentino campeón del mundo 2022 y de la Bundesliga "
        "2023/24 con el Bayer Leverkusen (Exequiel...).",
    ),
    (
        "Ronaldo",
        r"m[áa]ximo goleador de la historia, juega en Al Nassr",
        "Apellido del futbolista portugués, máximo goleador de la historia del fútbol, "
        "que fichó por Al Nassr en 2023.",
    ),
    (
        "Romero",
        r"juega en Tottenham \(Cristian\.\.\.\)",
        "Apellido del defensor argentino campeón del mundo 2022 y de la Europa League "
        "2025 con el Tottenham (Cristian...).",
    ),
    (
        "Suárez",
        r"en su carrera juega en Inter Miami",
        "¿Apellido del delantero uruguayo, ganador de dos Botas de Oro, que brilló en "
        "Ajax, Liverpool, FC Barcelona y Atlético de Madrid?",
    ),
    (
        "Busquets",
        r"CONTIENE U: Apellido del mediocampista espa[ñn]ol leyenda del Barcelona, juega en Inter Miami\.",
        "CONTIENE U: Apellido del mediocampista español leyenda del Barcelona y campeón "
        "del mundo 2010, Sergio …",
    ),
    (
        "Umtiti",
        r"en su carrera milita en el Lille OSC",
        "¿Apellido del defensor francés, campeón del mundo en 2018, que jugó en el "
        "FC Barcelona? (Samuel...)",
    ),
    (
        "Xavi Simons",
        r"juega en Leipzig, cedido por el PSG",
        "Nombre completo del mediapunta neerlandés surgido en La Masía que se formó "
        "también en el PSG.",
    ),
    (
        "Doku",
        r"belga del Manchester City \(J[ée]r[ée]my\.\.\.\)",
        "CONTIENE K: Apellido del extremo belga surgido en el Anderlecht (Jérémy...).",
    ),
]

ORTO_RE = [
    (re.compile(r"\bBayern Munich\b"), "Bayern Múnich"),
    (re.compile(r"\bBayern Mun(?=[\s\.])"), "Bayern Múnich"),
    (re.compile(r"\bMunich\b"), "Múnich"),
    (re.compile(r"\bModric\b"), "Modrić"),
    (re.compile(r"\bGremio\b"), "Grêmio"),
    (re.compile(r"\bJoao\b"), "João"),
]


def fix_combinadas() -> None:
    name = "preguntas_combinadas.json"
    data = read(name)

    # 1. correcciones factuales / presente falso
    for block in data:
        for q in block["preguntas"]:
            for ans, rx, new in COMB_FIX:
                if q["respuesta"] == ans and re.search(rx, q["pregunta"]):
                    if new != q["pregunta"]:
                        log(name, f"[{block['letra']}] {ans}", q["pregunta"], new)
                        q["pregunta"] = new
                    break

    # 2. ortografia (solo en la pregunta; la respuesta canonica no se toca)
    for block in data:
        for q in block["preguntas"]:
            orig = q["pregunta"]
            new = orig
            for rx, rep in ORTO_RE:
                new = rx.sub(rep, new)
            if new != orig:
                log(name, f"[{block['letra']}] ortografía", orig, new)
                q["pregunta"] = new

    # 3. dedupe: misma pregunta normalizada dentro de la misma letra
    for block in data:
        seen = set()
        keep = []
        for q in block["preguntas"]:
            key = strip(q["pregunta"])
            if key in seen:
                log(name, f"[{block['letra']}] duplicado eliminado", q["pregunta"], "—")
                continue
            seen.add(key)
            keep.append(q)
        block["preguntas"] = keep

    write(name, data)


# -------------------------------------------------------------------- QSM
def fix_qsm() -> None:
    # level_2: opciones duplicadas
    name = "level_2.json"
    data = read(name)
    for q in data["preguntas"]:
        if "récord de goles en una temporada de La Liga" in q.get("pregunta", ""):
            op = q["opciones"]
            if op.get("C") == op.get("A"):
                log(name, "opciones duplicadas", f"C={op['C']}", "C=46 goles")
                op["C"] = "46 goles"
    write(name, data)

    # level_1: preguntas duplicadas
    name = "level_1.json"
    data = read(name)
    seen = set()
    keep = []
    for q in data["preguntas"]:
        key = strip(q.get("pregunta", ""))
        if key and key in seen:
            log(name, "duplicado eliminado", q.get("pregunta", ""), "—")
            continue
        seen.add(key)
        keep.append(q)
    data["preguntas"] = keep
    write(name, data)


def main() -> None:
    fix_pasalache()
    fix_combinadas()
    fix_qsm()

    lines = ["# Fixes 2026-08-04", ""]
    by_file: dict[str, list] = {}
    for fil, kind, before, after in LOG:
        by_file.setdefault(fil, []).append((kind, before, after))
    for fil, items in by_file.items():
        lines.append(f"## {fil} ({len(items)} fixes)")
        for kind, before, after in items:
            lines.append(f"- **{kind}**")
            lines.append(f"  - antes: {before}")
            lines.append(f"  - después: {after}")
        lines.append("")
    REPORT.write_text("\n".join(lines), encoding="utf-8")
    for fil, items in by_file.items():
        print(f"{fil}: {len(items)} fixes")


if __name__ == "__main__":
    main()
