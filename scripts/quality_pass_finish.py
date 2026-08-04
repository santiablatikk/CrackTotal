# -*- coding: utf-8 -*-
"""Finish quality pass: KDB Napoli, Riquelme wording, combinadas cleanup."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def fix_pasalache():
    path = ROOT / "assets/data/pasalache_2025.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    fixes = []
    for block in data:
        for q in block["preguntas"]:
            ans = q["respuesta"]
            p = q["pregunta"]
            if ans == "De Bruyne" and ("City" in p or "leyenda" in p.lower()):
                q["pregunta"] = (
                    "¿Apellido del mediocampista belga del Napoli, Kevin …?"
                )
                fixes.append(("D/De Bruyne", p, q["pregunta"]))
            if ans == "Juan Román Riquelme" and "máximo ídolo" in p:
                q["pregunta"] = (
                    "¿Nombre completo del máximo ídolo de Boca Juniors "
                    "apodado 'El Román'?"
                )
                fixes.append(("J/Riquelme", p, q["pregunta"]))
            if ans == "van Dijk" and "Apellido" in p:
                new_p = (
                    "¿Apellido del central neerlandés capitán del Liverpool, "
                    "Virgil …?"
                )
                if p != new_p:
                    q["pregunta"] = new_p
                    fixes.append(("V/van Dijk", p, new_p))
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return fixes


def fix_combinadas():
    path = ROOT / "assets/data/preguntas_combinadas.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    fixes = []
    for block in data:
        for q in block["preguntas"]:
            p = q["pregunta"]
            ans = q["respuesta"]
            blob = (p + " " + ans).lower()
            if "figura leyenda" in p:
                new_p = p.replace("figura leyenda", "leyenda")
                fixes.append(("figura leyenda", p, new_p))
                q["pregunta"] = new_p
                p = new_p
            # KDB: present City without leyenda/Napoli → Napoli
            if "de bruyne" in blob or "kevin de bruyne" in blob:
                if re.search(
                    r"(juega en el Manchester City|del Manchester City|"
                    r"figura del Manchester City|mediocampista belga del "
                    r"Manchester City)",
                    p,
                    re.I,
                ) and not re.search(r"leyenda|Napoli|ex Manchester", p, re.I):
                    new_p = re.sub(
                        r"(que )?juega en el Manchester City",
                        "del Napoli",
                        p,
                        flags=re.I,
                    )
                    new_p = re.sub(
                        r"del Manchester City",
                        "del Napoli",
                        new_p,
                        flags=re.I,
                    )
                    new_p = re.sub(
                        r"figura del Manchester City",
                        "figura del Napoli",
                        new_p,
                        flags=re.I,
                    )
                    if new_p != p:
                        fixes.append(("KDB City→Napoli", p, new_p))
                        q["pregunta"] = new_p
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return fixes


def main():
    pf = fix_pasalache()
    cf = fix_combinadas()
    print(f"pasalache fixes: {len(pf)}")
    for f in pf:
        print(f"  [{f[0]}]")
        print(f"    BEFORE: {f[1]}")
        print(f"    AFTER:  {f[2]}")
    print(f"combinadas fixes: {len(cf)}")
    for f in cf:
        print(f"  [{f[0]}]")
        print(f"    BEFORE: {f[1]}")
        print(f"    AFTER:  {f[2]}")


if __name__ == "__main__":
    main()
