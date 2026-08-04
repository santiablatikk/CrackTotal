# -*- coding: utf-8 -*-
"""Reemplaza en QSM 4/5 las preguntas con estadisticas fabricadas por hechos verificables."""
from __future__ import annotations

import json
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"
REPORT = ROOT / "scripts" / "_qsm_rebuild.md"


def strip(s) -> str:
    s = unicodedata.normalize("NFD", str(s or ""))
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower().strip()


def mc(pregunta: str, a: str, b: str, c: str, d: str, correcta: str) -> dict:
    return {
        "pregunta": pregunta,
        "opciones": {"A": a, "B": b, "C": c, "D": d},
        "respuesta_correcta": correcta,
    }


# Preguntas originales que se conservan (match por fragmento del enunciado)
KEEP_L4 = [
    "Lewandowski en la Bundesliga 2020-21",
    "minuto exacto marcó Iniesta el gol de la final",
    "pagó Manchester City por Jack Grealish",
    "Haaland en su primera temporada completa",
    "año exacto se fundó la UEFA",
    "minutos jugó Messi en su debut con el PSG",
    "minuto marcó Sergio Agüero su famoso gol",
    "Cristiano Ronaldo en la Liga portuguesa con el Sporting",
    "porterías a cero en la Premier League",
    "regla del pase hacia atrás",
    "gol más rápido en la historia de la Champions League",
    "racha invicta de 49 partidos del Arsenal",
    "Van Basten en la Eurocopa 1988",
    "cláusula de rescisión más alta",
    "Mbappé en el Mundial 2022",
    "Alan Shearer marcó 34 goles",
    "racha goleadora de Gerd Müller",
    "gol número 100,000 en la historia de La Liga",
    "partidos dirigidos en Champions League",
    "número máximo de 5 sustituciones",
    "Ronaldinho en su primera temporada en el Barcelona",
    "minuto de su debut marcó Haaland",
    "Champions League ganó Zinedine Zidane como entrenador",
]

KEEP_L5 = [
    "valor exacto del traspaso de Mbappé al Real Madrid",
    "mayor porcentaje de victorias en finales de Champions",
    "corrió la mayor distancia en el Mundial 2022",
]

# Correcciones puntuales sobre preguntas conservadas
FIX_L4 = {
    "año se introdujo la regla de 3 puntos por victoria": {
        "pregunta": "¿En qué año adoptó la FIFA los 3 puntos por victoria para sus competiciones?",
    },
    "hat-tricks marcó Cristiano Ronaldo en la Champions League": {
        "opciones": {"A": "8", "B": "10", "C": "6", "D": "12"},
        "respuesta_correcta": "A",
    },
    "gol más rápido en la historia de la Champions League": {
        "opciones": {
            "A": "Bayern Múnich (10.12 segundos)",
            "B": "Real Madrid (9.9 segundos)",
            "C": "Barcelona (8.1 segundos)",
            "D": "Olympiakos (7.69 segundos)",
        },
        "respuesta_correcta": "A",
    },
}

NEW_L4 = [
    mc("¿Cuántos goles oficiales marcó Messi en el año calendario 2012, récord mundial?",
       "86", "91", "79", "95", "B"),
    mc("¿Qué equipo remontó un 0-4 y ganó 6-1 en la Champions 2016-17?",
       "Roma", "Liverpool", "Barcelona", "Ajax", "C"),
    mc("¿Quién es el máximo goleador histórico de la Copa Libertadores?",
       "Alberto Spencer", "Fernando Morena", "Pedro Rocha", "Daniel Onega", "A"),
    mc("¿En qué temporada ganó el Manchester United el triplete con Ferguson?",
       "1997-98", "1998-99", "1999-2000", "2000-01", "B"),
    mc("¿Qué club ganó la primera Copa Libertadores, en 1960?",
       "Peñarol", "Nacional", "Independiente", "Santos", "A"),
    mc("¿Quién fue el máximo goleador del Mundial 2018?",
       "Romelu Lukaku", "Harry Kane", "Kylian Mbappé", "Antoine Griezmann", "B"),
    mc("¿Cuántos goles marcó Ronaldo Nazário en el Mundial 2002?",
       "6", "7", "8", "9", "C"),
    mc("¿Qué selección ganó la Eurocopa 2004?",
       "Portugal", "Grecia", "República Checa", "Países Bajos", "B"),
    mc("¿Cuántas Copas de Europa/Champions League tiene el AC Milan?",
       "6", "7", "5", "8", "B"),
    mc("¿En qué año se disputó el primer Mundial de fútbol?",
       "1928", "1930", "1934", "1926", "B"),
    mc("¿Quién ganó el Balón de Oro en 2006?",
       "Thierry Henry", "Gianluigi Buffon", "Fabio Cannavaro", "Ronaldinho", "C"),
    mc("¿Cuántos goles marcó Gerd Müller en el Mundial 1970?",
       "8", "9", "10", "11", "C"),
    mc("¿Qué club goleó 8-2 al Barcelona en la Champions 2019-20?",
       "Bayern Múnich", "Liverpool", "PSG", "Manchester City", "A"),
    mc("¿Quién marcó el gol del empate en el minuto 93 de la final de la Champions 2014?",
       "Gareth Bale", "Sergio Ramos", "Marcelo", "Karim Benzema", "B"),
    mc("¿Cuántos partidos disputó invicto el Arsenal en la Premier 2003-04?",
       "34", "36", "38", "40", "C"),
    mc("¿Qué arquero atajó dos penales en la tanda de la final del Mundial 2022?",
       "Hugo Lloris", "Emiliano Martínez", "Dominik Livaković", "Yassine Bounou", "B"),
    mc("¿Qué club portugués ganó la Copa de Europa en 1961 y 1962?",
       "Porto", "Sporting CP", "Benfica", "Belenenses", "C"),
    mc("¿Cuántos goles oficiales marcó Cristiano Ronaldo con el Real Madrid?",
       "450", "398", "511", "372", "A"),
    mc("¿En qué año ganó Boca Juniors su última Copa Libertadores?",
       "2003", "2005", "2007", "2012", "C"),
    mc("¿Qué selección africana llegó a semifinales del Mundial 2022?",
       "Senegal", "Camerún", "Marruecos", "Ghana", "C"),
    mc("¿Cuántos goles marcó Gabriel Batistuta en Copas del Mundo?",
       "8", "10", "12", "9", "B"),
    mc("¿Qué club brasileño ganó la Copa Libertadores 2024?",
       "Palmeiras", "Flamengo", "Botafogo", "Atlético Mineiro", "C"),
    mc("¿Cuántas Eurocopas ganó España hasta 2024?",
       "3", "4", "2", "5", "B"),
    mc("¿Quién ganó la Bota de Oro de la Bundesliga 2023-24 con 36 goles?",
       "Serhou Guirassy", "Harry Kane", "Niclas Füllkrug", "Loïs Openda", "B"),
    mc("¿Qué equipo ganó la primera Premier League, en 1992-93?",
       "Arsenal", "Blackburn Rovers", "Manchester United", "Aston Villa", "C"),
    mc("¿Cuántos goles marcó Pelé en Copas del Mundo?",
       "10", "12", "14", "9", "B"),
    mc("¿Qué entrenador ganó la Champions League con el Porto en 2004?",
       "André Villas-Boas", "José Mourinho", "Jorge Jesus", "Fernando Santos", "B"),
    mc("¿Cuántas Copas América ganó Argentina hasta 2024?",
       "15", "16", "14", "17", "B"),
    mc("¿Qué selección ganó la Copa América 2019?",
       "Argentina", "Brasil", "Perú", "Chile", "B"),
    mc("¿Cuál es el área exacta del área penal reglamentaria (40,32 m x 16,5 m)?",
       "665,28 m²", "1368 m²", "540 m²", "742,5 m²", "A"),
    mc("¿Quién es el máximo goleador histórico de la selección argentina?",
       "Gabriel Batistuta", "Lionel Messi", "Sergio Agüero", "Hernán Crespo", "B"),
    mc("¿Qué club ganó la Europa League 2024/25?",
       "Manchester United", "Tottenham", "Athletic Club", "Lyon", "B"),
    mc("¿Cuántas Champions League ganó el Liverpool?",
       "5", "6", "4", "7", "B"),
    mc("¿Qué jugador ganó el Balón de Oro 2021?",
       "Robert Lewandowski", "Lionel Messi", "Karim Benzema", "Jorginho", "B"),
]

NEW_L5 = [
    mc("¿Quién ganó el Balón de Oro en 1961, único argentino en lograrlo con nacionalidad italiana?",
       "Omar Sívori", "Alfredo Di Stéfano", "Luis Suárez Miramontes", "Raymond Kopa", "A"),
    mc("¿Cuál fue el primer club argentino en ganar la Copa Libertadores?",
       "Boca Juniors", "Racing Club", "Independiente", "Estudiantes", "C"),
    mc("¿Cuántas Copas Libertadores ganó Independiente?",
       "6", "7", "5", "8", "B"),
    mc("¿Quién marcó el gol más rápido en la historia de los Mundiales (11 segundos)?",
       "Hakan Şükür", "Václav Mašek", "Ernst Lehner", "Bryan Robson", "A"),
    mc("¿Qué selección ganó la primera Eurocopa, en 1960?",
       "España", "Yugoslavia", "Unión Soviética", "Checoslovaquia", "C"),
    mc("¿Quién fue el máximo goleador del Mundial 1986?",
       "Diego Maradona", "Gary Lineker", "Careca", "Emilio Butragueño", "B"),
    mc("¿Qué club argentino ganó la Copa Intercontinental de 1968?",
       "Racing Club", "Independiente", "Estudiantes de La Plata", "Boca Juniors", "C"),
    mc("¿Cuántos goles marcó Ferenc Puskás en la final de la Copa de Europa 1960?",
       "3", "4", "2", "5", "B"),
    mc("¿Quién ganó el primer Balón de Oro de la historia, en 1956?",
       "Alfredo Di Stéfano", "Raymond Kopa", "Stanley Matthews", "Ferenc Puskás", "C"),
    mc("¿Cuál fue el resultado de la final del Mundial 1954, el 'Milagro de Berna'?",
       "Alemania 3-2 Hungría", "Hungría 3-2 Alemania", "Alemania 2-1 Hungría", "Alemania 4-2 Hungría", "A"),
    mc("¿Qué selección eliminó a Brasil en el Mundial 1982?",
       "Polonia", "Italia", "Alemania Federal", "Francia", "B"),
    mc("¿Cuántos goles marcó Paolo Rossi en el Mundial 1982?",
       "5", "6", "7", "4", "B"),
    mc("¿Qué club fue el primero de las islas británicas en ganar la Copa de Europa?",
       "Manchester United", "Celtic", "Liverpool", "Rangers", "B"),
    mc("¿Quién dirigió a Países Bajos y su 'fútbol total' en el Mundial 1974?",
       "Rinus Michels", "Ernst Happel", "Johan Cruyff", "Guus Hiddink", "A"),
    mc("¿En qué año se disputó el primer Campeonato Sudamericano (hoy Copa América)?",
       "1910", "1916", "1920", "1924", "B"),
    mc("¿Cuál es el club con más títulos de la Serie A italiana?",
       "Inter", "Milan", "Juventus", "Genoa", "C"),
    mc("¿Qué futbolista ganó tres Copas del Mundo como jugador?",
       "Garrincha", "Pelé", "Didi", "Mário Zagallo", "B"),
    mc("¿En qué año ganó Racing Club la Copa Intercontinental?",
       "1966", "1967", "1968", "1969", "B"),
    mc("¿Cuántas Copas Libertadores ganó Boca Juniors?",
       "5", "6", "7", "4", "B"),
    mc("¿Qué futbolista liberiano ganó el Balón de Oro y luego fue presidente de su país?",
       "Didier Drogba", "Samuel Eto'o", "George Weah", "Roger Milla", "C"),
    mc("¿Cuál fue el marcador de la final del Mundial 1970?",
       "Brasil 4-1 Italia", "Brasil 3-1 Italia", "Brasil 4-2 Italia", "Brasil 2-1 Italia", "A"),
    mc("¿Quién es el jugador con más partidos disputados en la historia de la Champions League?",
       "Lionel Messi", "Iker Casillas", "Cristiano Ronaldo", "Xavi Hernández", "C"),
    mc("¿Qué selección ganó la Copa Confederaciones 2017, la última edición?",
       "Chile", "Alemania", "Portugal", "México", "B"),
    mc("¿Cuántos Mundiales organizó México antes de 2026?",
       "1", "2", "3", "0", "B"),
    mc("¿Cuántas finales de Champions League disputó el Atlético de Madrid?",
       "2", "3", "4", "1", "B"),
    mc("¿Quién fue el DT campeón del mundo con Alemania en 2014?",
       "Jürgen Klinsmann", "Joachim Löw", "Hansi Flick", "Oliver Bierhoff", "B"),
    mc("¿Qué club brasileño ganó la Copa Libertadores en 1992 y 1993?",
       "Palmeiras", "Flamengo", "São Paulo", "Cruzeiro", "C"),
    mc("¿Quién marcó el gol conocido como 'la Mano de Dios' en 1986?",
       "Jorge Valdano", "Diego Maradona", "Jorge Burruchaga", "Ricardo Bochini", "B"),
    mc("¿Cuántas Copas del Mundo ganó Uruguay?",
       "1", "2", "3", "4", "B"),
    mc("¿Qué equipo ganó la Recopa de Europa en su última edición, en 1999?",
       "Chelsea", "Lazio", "Mallorca", "Real Madrid", "B"),
    mc("¿Quién fue el máximo goleador de la Eurocopa 2020?",
       "Cristiano Ronaldo y Patrik Schick", "Romelu Lukaku", "Harry Kane", "Karim Benzema", "A"),
    mc("¿En qué año ganó el Ajax de Cruyff su primera Copa de Europa?",
       "1969", "1971", "1972", "1973", "B"),
    mc("¿Qué selección ganó la Copa Asiática 2019?",
       "Japón", "Qatar", "Corea del Sur", "Irán", "B"),
    mc("¿Cuántos goles marcó Just Fontaine en el Mundial 1958?",
       "11", "12", "13", "14", "C"),
]

# level_6: correcciones puntuales
FIX_L6 = {
    "primer equipo no inglés en ganar la Copa de Europa": {
        "pregunta": "¿Qué club ganó la primera Copa de Europa, en la temporada 1955-56?",
    },
    "jugador argentino marcó el primer gol en la historia de la J-League": {
        "pregunta": "¿Qué astro brasileño marcó el primer gol en la historia de la J-League japonesa?",
    },
    "más penales detenidos en la historia de la Premier League": {
        "pregunta": "¿Qué arquero tiene el récord de más penales detenidos en la historia de la Premier League?",
        "opciones": {
            "A": "David James (13)",
            "B": "Pepe Reina (9)",
            "C": "Edwin van der Sar (11)",
            "D": "Brad Friedel (10)",
        },
        "respuesta_correcta": "A",
    },
}

LOG: list[str] = []


def rebuild(name: str, keep_frags: list[str], new_qs: list[dict], fixes: dict) -> None:
    path = DATA / name
    data = json.loads(path.read_text(encoding="utf-8"))
    kept = []
    dropped = []
    for q in data["preguntas"]:
        p = q.get("pregunta", "")
        if any(strip(f) in strip(p) for f in keep_frags):
            for frag, patch in fixes.items():
                if strip(frag) in strip(p):
                    for k, v in patch.items():
                        LOG.append(f"- **{name} / corregida**: `{p[:80]}` → `{k}` actualizado")
                        q[k] = v
            kept.append(q)
        else:
            dropped.append(p)
    for p in dropped:
        LOG.append(f"- **{name} / eliminada (stat fabricada)**: {p[:110]}")
    for q in new_qs:
        LOG.append(f"- **{name} / nueva (verificable)**: {q['pregunta'][:110]}")
    data["preguntas"] = kept + new_qs
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"{name}: kept={len(kept)} dropped={len(dropped)} new={len(new_qs)} total={len(data['preguntas'])}")


def patch_only(name: str, fixes: dict) -> None:
    path = DATA / name
    data = json.loads(path.read_text(encoding="utf-8"))
    n = 0
    for q in data["preguntas"]:
        p = q.get("pregunta", "")
        for frag, patch in fixes.items():
            if strip(frag) in strip(p):
                LOG.append(f"- **{name} / corregida**: {p[:100]}")
                for k, v in patch.items():
                    q[k] = v
                n += 1
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"{name}: {n} correcciones")


def main() -> None:
    rebuild("level_4.json", KEEP_L4, NEW_L4, FIX_L4)
    rebuild("level_5.json", KEEP_L5, NEW_L5, {})
    patch_only("level_6.json", FIX_L6)
    REPORT.write_text(
        "# Rebuild QSM niveles duros\n\n" + "\n".join(LOG) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
