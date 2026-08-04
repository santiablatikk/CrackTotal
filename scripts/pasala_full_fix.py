#!/usr/bin/env python3
"""
Full Pasala Che bank correction pass (truth date 2026-08-04).
Letter/CONTIENE rule enforced; rewrite outdated/poor questions.
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "assets" / "data" / "pasalache_2025.json"
REPORT = ROOT / "scripts" / "_pasala_full_fix_report.md"

CONTIENE_RE = re.compile(r"^CONTIENE\s+([A-ZÑÁÉÍÓÚÜ]):", re.I)

# Exact old pregunta -> (new_pregunta, new_respuesta, tipo)
FIXES: dict[str, tuple[str, str, str]] = {
    # --- Presente / formulación ---
    "¿Club saudí donde juega Cristiano Ronaldo desde 2023?": (
        "¿Club saudí al que llegó Cristiano Ronaldo en 2023?",
        "Al Nassr",
        "factual",
    ),
    "¿Club de la MLS donde juega Lionel Messi desde 2023?": (
        "¿Club de la MLS al que llegó Lionel Messi en 2023?",
        "Inter Miami",
        "factual",
    ),
    "¿País sudamericano que juega eliminatorias CONMEBOL y tiene capital en Quito?": (
        "¿País sudamericano de CONMEBOL con capital en Quito?",
        "Ecuador",
        "formulacion",
    ),
    "¿Apellido del mediocampista belga del Manchester City, Kevin …?": (
        "¿Apellido del mediocampista belga leyenda del Manchester City, Kevin …?",
        "De Bruyne",
        "factual",
    ),
    "¿Apellido del lateral derecho del Real Madrid, Dani …?": (
        "¿Apellido del lateral derecho leyenda del Real Madrid, Dani …?",
        "Carvajal",
        "factual",
    ),
    "¿Apellido del volante inglés del Manchester City, Phil …?": (
        "¿Apellido del volante inglés figura del Manchester City, Phil …?",
        "Foden",
        "factual",
    ),
    "¿Apellido del mediocampista español del Barcelona, Pablo …?": (
        "¿Apellido del mediocampista español surgido en el Barcelona, Pablo …?",
        "Gavi",
        "factual",
    ),
    "¿Apellido del delantero noruego del Manchester City, Erling …?": (
        "¿Apellido del delantero noruego estrella del Manchester City, Erling …?",
        "Haaland",
        "factual",
    ),
    "CONTIENE A: ¿Apellido del goleador noruego del Manchester City?": (
        "CONTIENE A: ¿Apellido del goleador noruego estrella del Manchester City?",
        "Haaland",
        "factual",
    ),
    "¿Nombre y apellido del mediocampista uruguayo del Real Madrid, Federico …?": (
        "¿Nombre y apellido del mediocampista uruguayo estrella del Real Madrid, Federico …?",
        "Federico Valverde",
        "factual",
    ),
    "CONTIENE D: ¿Apellido del mediocampista uruguayo del Real Madrid, Federico …?": (
        "CONTIENE D: ¿Apellido del mediocampista uruguayo estrella del Real Madrid, Federico …?",
        "Valverde",
        "factual",
    ),
    "CONTIENE H: ¿Apellido del mediocampista inglés del Real Madrid, Jude …?": (
        "CONTIENE H: ¿Apellido del mediocampista inglés estrella del Real Madrid, Jude …?",
        "Bellingham",
        "factual",
    ),
    "¿Apellido del delantero polaco del Barcelona, Robert …?": (
        "¿Apellido del delantero polaco estrella del Barcelona, Robert …?",
        "Lewandowski",
        "factual",
    ),
    "¿Nombre y apellido del 9 argentino del Inter, campeón del mundo?": (
        "¿Nombre y apellido del 9 argentino del Inter de Milán, campeón del mundo 2022?",
        "Lautaro Martínez",
        "formulacion",
    ),
    "¿Nombre y apellido del defensor argentino del Manchester United campeón del mundo?": (
        "¿Nombre y apellido del defensor argentino campeón del mundo 2022 en Manchester United?",
        "Lisandro Martínez",
        "formulacion",
    ),
    "¿Apellido del arquero argentino del Aston Villa, Emiliano …?": (
        "¿Apellido del arquero argentino ídolo del Aston Villa, Emiliano …?",
        "Martínez",
        "factual",
    ),
    "¿Apellido del atacante de la Real Sociedad, Mikel …?": (
        "¿Apellido del atacante ídolo de la Real Sociedad, Mikel …?",
        "Oyarzabal",
        "factual",
    ),
    "¿Apellido del mediocampista de España y el Barcelona, Dani …?": (
        "¿Apellido del mediocampista de España y el Barcelona desde 2024, Dani …?",
        "Olmo",
        "factual",
    ),
    "¿Nombre futbolístico del mediocampista español de Barcelona, Pedro …?": (
        "¿Nombre futbolístico del mediocampista español del Barcelona, Pedro …?",
        "Pedri",
        "formulacion",
    ),
    "¿Apellido del extremo estadounidense del Milan, Christian …?": (
        "¿Apellido del extremo estadounidense estrella de la selección de EE.UU., Christian …?",
        "Pulisic",
        "factual",
    ),
    "¿Apellido del extremo brasileño del Barcelona, Raphael …?": (
        "¿Apellido del extremo brasileño figura del Barcelona, Raphael …?",
        "Raphinha",
        "factual",
    ),
    "¿Nombre deportivo del mediocampista español del Manchester City, Rodrigo …?": (
        "¿Nombre deportivo del mediocampista español Balón de Oro 2024, Rodrigo …?",
        "Rodri",
        "factual",
    ),
    "¿Nombre y apellido del zaguero portugués del Manchester City, Rúben …?": (
        "¿Nombre y apellido del zaguero portugués estrella del Manchester City, Rúben …?",
        "Rúben Dias",
        "factual",
    ),
    "¿Apellido del capitán surcoreano del Tottenham, Heung-min …?": (
        "¿Apellido del capitán surcoreano ídolo del Tottenham, Heung-min …?",
        "Son",
        "factual",
    ),
    "¿Apellido del entrenador del Atlético de Madrid, Diego …?": (
        "¿Apellido del entrenador histórico del Atlético de Madrid, Diego …?",
        "Simeone",
        "factual",
    ),
    "¿Nombre y apellido del central neerlandés del Liverpool, Virgil …?": (
        "¿Nombre y apellido del central neerlandés capitán del Liverpool, Virgil …?",
        "Virgil van Dijk",
        "factual",
    ),
    "¿Apellido del lateral derecho inglés del Manchester City, Kyle …?": (
        "¿Apellido del lateral derecho inglés leyenda del Manchester City, Kyle …?",
        "Walker",
        "factual",
    ),
    "¿Apellido del mediocampista alemán del Bayern, Joshua …?": (
        "¿Apellido del mediocampista alemán figura del Bayern Múnich, Joshua …?",
        "Kimmich",
        "factual",
    ),
    "¿Nombre y apellido del extremo francés del Bayern, Kingsley …?": (
        "¿Nombre y apellido del extremo francés figura del Bayern Múnich, Kingsley …?",
        "Kingsley Coman",
        "factual",
    ),
    "¿Apellido del extremo georgiano del PSG, Khvicha …?": (
        "¿Apellido del extremo georgiano figura del PSG, Khvicha …?",
        "Kvaratskhelia",
        "factual",
    ),
    "¿Nombre y apellido del lateral izquierdo español del Inter Miami?": (
        "¿Nombre y apellido del lateral izquierdo español compañero de Messi en Inter Miami?",
        "Jordi Alba",
        "factual",
    ),
    "¿Nombre y apellido del central croata del Manchester City, Joško …?": (
        "¿Nombre y apellido del central croata figura del Manchester City, Joško …?",
        "Joško Gvardiol",
        "factual",
    ),
    "¿Club de Junín que milita en la Liga Profesional?": (
        "¿Club de Junín de la Liga Profesional argentina?",
        "Sarmiento",
        "formulacion",
    ),
    "¿Apellido del delantero colombiano del Torino y la Atalanta, Duván …?": (
        "¿Apellido del delantero colombiano ex Atalanta y Torino, Duván …?",
        "Zapata",
        "factual",
    ),
    "¿Nombre y apellido del extremo suizo del Chicago Fire, Xherdan …?": (
        "¿Nombre y apellido del extremo suizo ex Liverpool e Inter, Xherdan …?",
        "Xherdan Shaqiri",
        "factual",
    ),
    "¿Nombre y apellido del mediapunta neerlandés Xavi …, figura en Leipzig y PSG?": (
        "¿Nombre y apellido del mediapunta neerlandés surgido en el PSG, Xavi …?",
        "Xavi Simons",
        "factual",
    ),
    "¿Apellido del mediocampista brasileño del West Ham, Lucas …?": (
        "¿Apellido del mediocampista brasileño figura del West Ham, Lucas …?",
        "Paquetá",
        "factual",
    ),
    "¿Apodo del mediocampista portugués Vítor Machado Ferreira, figura del PSG?": (
        "¿Apodo del mediocampista portugués Vítor Machado Ferreira, estrella del PSG?",
        "Vitinha",
        "formulacion",
    ),
    "¿Club cearense revelación en Brasil, apodado Leão do Pici?": (
        "¿Club cearense de la Serie A brasileña, apodado Leão do Pici?",
        "Fortaleza",
        "formulacion",
    ),
    # --- Ediciones concretas ---
    "¿Apellido del técnico del Real Madrid campeón de la Champions 2024?": (
        "¿Apellido del técnico del Real Madrid campeón de la Champions 2023/24?",
        "Ancelotti",
        "formulacion",
    ),
    "¿Club español campeón de la Champions 2024?": (
        "¿Club español campeón de la Champions 2023/24?",
        "Real Madrid",
        "formulacion",
    ),
    "¿Ciudad del club subcampeón de la Champions 2024 (Borussia …)?": (
        "¿Ciudad del club subcampeón de la Champions 2023/24 (Borussia …)?",
        "Dortmund",
        "formulacion",
    ),
    "¿Club inglés campeón de la Champions 2023?": (
        "¿Club inglés campeón de la Champions 2022/23?",
        "Manchester City",
        "formulacion",
    ),
    "¿Club uruguayo con muchas Libertadores junto a Nacional?": (
        "¿Club uruguayo pentacampeón histórico de la Copa Libertadores?",
        "Peñarol",
        "formulacion",
    ),
    "CONTIENE R: ¿Apellido del capitán de la selección española 2024, Álvaro …?": (
        "CONTIENE R: ¿Apellido del capitán de España en la Eurocopa 2024, Álvaro …?",
        "Morata",
        "formulacion",
    ),
    "¿Apellido del director técnico de la Selección Argentina campeona 2022 y 2024?": (
        "¿Apellido del DT de Argentina campeón del Mundo 2022 y de la Copa América 2024?",
        "Scaloni",
        "formulacion",
    ),
    "¿Nombre y apellido del arquero argentino campeón del mundo apodado 'Dibu'?": (
        "¿Nombre y apellido del arquero argentino campeón del mundo 2022 apodado 'Dibu'?",
        "Emiliano Martínez",
        "formulacion",
    ),
    "¿Nombre y apellido del defensor brasileño del Real Madrid, Éder …?": (
        "¿Nombre y apellido del defensor brasileño estrella del Real Madrid, Éder …?",
        "Éder Militão",
        "factual",
    ),
    "¿Apellido del delantero francés del Real Madrid, Kylian …?": (
        "¿Apellido del delantero francés estrella del Real Madrid, Kylian …?",
        "Mbappé",
        "factual",
    ),
    "¿Apellido del extremo brasileño estrella del Real Madrid?": (
        "¿Apellido del extremo brasileño ídolo del Real Madrid?",
        "Vinicius",
        "formulacion",
    ),
    # --- Duplicados / calidad ---
    "¿País europeo campeón del Mundial 2010?": (
        "¿Estadio del SL Benfica en Lisboa, conocido como da Luz?",
        "Estádio da Luz",
        "formulacion",
    ),
    "¿Club francés campeón múltiple desde 2010s?": (
        "¿Club italiano de Emilia-Romaña apodado 'I Crociati'?",
        "Parma",
        "formulacion",
    ),
    "¿Cómo se denomina al conjunto nacional de fútbol de un país?": (
        "¿Club inglés de la costa sur apodado 'The Saints'?",
        "Southampton",
        "formulacion",
    ),
    "¿Nombre y apellido del delantero neerlandés ex Ajax y Sevilla, Quincy …?": (
        "¿Apellido del 10 colombiano ídolo de River Plate, Juan Fernando …?",
        "Quintero",
        "formulacion",
    ),
    "¿País asiático cuyo nombre en inglés comienza con Y?": (
        "¿Apellido del legendario arquero soviético Balón de Oro 1963, Lev …?",
        "Yashin",
        "formulacion",
    ),
    "¿Nombre y apellido del extremo austriaco de origen turco, Yusuf …?": (
        "¿Apellido del extremo inglés ex Manchester United e Inter, Ashley …?",
        "Young",
        "formulacion",
    ),
    "¿Club mexicano cuyo apodo incluye la letra X en su nombre?": (
        "¿Apodo del Club Tijuana de la Liga MX?",
        "Xolos de Tijuana",
        "formulacion",
    ),
    "CONTIENE S: ¿Apellido del goleador egipcio del Liverpool, Mohamed …?": (
        "¿Apellido del goleador egipcio ídolo del Liverpool, Mohamed …?",
        "Salah",
        "formulacion",
    ),
    "¿Apellido del entrenador del Tottenham 2023/24, Ange …?": (
        "¿Apellido del entrenador australiano del Tottenham en 2023/24, Ange …?",
        "Postecoglou",
        "formulacion",
    ),
    "¿Apellido del entrenador del Manchester City campeón de Europa 2023?": (
        "¿Apellido del DT del Manchester City campeón de la Champions 2022/23?",
        "Guardiola",
        "formulacion",
    ),
    "¿Nombre del técnico del Bayer Leverkusen 2023/24?": (
        "¿Nombre del DT del Bayer Leverkusen campeón invicto 2023/24?",
        "Xabi Alonso",
        "formulacion",
    ),
    "¿Club catalán revelación de 2022/23 y 2023/24 en LaLiga?": (
        "¿Club catalán revelación de LaLiga en 2022/23 y 2023/24?",
        "Girona",
        "formulacion",
    ),
    "¿Apellido del delantero argentino apodado 'La Araña', figura del Atlético de Madrid?": (
        "¿Apellido del delantero argentino apodado 'La Araña', del Atlético de Madrid?",
        "Álvarez",
        "formulacion",
    ),
    "¿Nombre de pila del delantero argentino apodado 'La Araña'?": (
        "¿Nombre de pila del delantero argentino 'La Araña' del Atlético de Madrid?",
        "Julián",
        "formulacion",
    ),
}


def strip(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower().strip()


def letter_issues(data: list) -> list[str]:
    issues = []
    for block in data:
        L = block["letra"]
        exp = strip(L)[0]
        for q in block["preguntas"]:
            p, r = q["pregunta"], q["respuesta"]
            rn = strip(r)
            m = CONTIENE_RE.match(p.strip())
            if m:
                declared = strip(m.group(1))[0]
                if declared != exp:
                    issues.append(f"MISMATCH {L} declared={declared}: {p} | {r}")
                if exp not in rn:
                    issues.append(f"CONTIENE_MISS {L}: {p} | {r}")
            else:
                if p.upper().startswith("CONTIENE"):
                    issues.append(f"BAD_FORMAT {L}: {p}")
                if not rn.startswith(exp):
                    issues.append(f"START_MISS {L}: {p} | {r}")
    return issues


def main() -> None:
    data = json.loads(PATH.read_text(encoding="utf-8"))
    before = letter_issues(data)
    applied = []
    missing = set(FIXES)

    for block in data:
        for q in block["preguntas"]:
            key = q["pregunta"]
            if key in FIXES:
                np, nr, tipo = FIXES[key]
                applied.append(
                    {
                        "tipo": tipo,
                        "letra": block["letra"],
                        "antes_p": key,
                        "antes_r": q["respuesta"],
                        "despues_p": np,
                        "despues_r": nr,
                    }
                )
                q["pregunta"], q["respuesta"] = np, nr
                missing.discard(key)

    # Deduplicate identical (pregunta, respuesta) within letter
    for block in data:
        seen = set()
        out = []
        for q in block["preguntas"]:
            sig = (q["pregunta"], q["respuesta"])
            if sig in seen:
                continue
            seen.add(sig)
            out.append(q)
        block["preguntas"] = out

    after = letter_issues(data)
    if after:
        print("ABORT letter issues:")
        for i in after:
            print(i)
        raise SystemExit(1)

    PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    counts = {"factual": 0, "formulacion": 0, "orto": 0, "letra": 0}
    for a in applied:
        counts[a["tipo"]] = counts.get(a["tipo"], 0) + 1

    lines = [
        "# Pasala Che — full fix report",
        "",
        f"- Total preguntas: **{sum(len(b['preguntas']) for b in data)}**",
        f"- Letter-issues before: **{len(before)}**",
        f"- Letter-issues after: **{len(after)}**",
        f"- Fixes aplicados: **{len(applied)}**",
        f"- Por tipo: {counts}",
        f"- Keys no encontradas: **{len(missing)}**",
        "",
        "## Before → after",
        "",
    ]
    for a in applied:
        lines.append(f"### [{a['tipo']}] Letra {a['letra']}")
        lines.append(f"- Antes: {a['antes_p']} → **{a['antes_r']}**")
        lines.append(f"- Después: {a['despues_p']} → **{a['despues_r']}**")
        lines.append("")

    REPORT.write_text("\n".join(lines), encoding="utf-8")
    print(f"OK fixes={len(applied)} letter_after={len(after)} missing={len(missing)}")
    print(f"counts={counts}")
    if missing:
        for m in sorted(missing):
            print("MISSING:", m[:80])


if __name__ == "__main__":
    main()
