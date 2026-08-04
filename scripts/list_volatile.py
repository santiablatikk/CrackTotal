# -*- coding: utf-8 -*-
import json
import re
from pathlib import Path


def show(s: str) -> None:
    print(s)


def scan_letter(path: Path, limit: int = 80):
    data = json.loads(path.read_text(encoding="utf-8"))
    n = 0
    for block in data:
        for i, q in enumerate(block.get("preguntas", [])):
            p = q.get("pregunta") or ""
            r = q.get("respuesta") or ""
            pl, rl = p.lower(), r.lower()
            reason = None
            if "actualmente" in pl:
                reason = "actualmente"
            elif re.search(r"actual (dt|entrenador|campe[oó]n|club|equipo)", pl):
                reason = "actual-X"
            elif "mbapp" in pl and ("psg" in pl or "paris" in pl):
                reason = "mbappe-psg-q"
            elif "mbapp" in rl and ("psg" in pl or "delantero francés del psg" in pl or "delantero frances del psg" in pl):
                reason = "mbappe-psg-a"
            elif ("balón de oro" in pl or "balon de oro" in pl) and any(
                x in pl for x in ["actual", "vigente", "último", "ultimo", "más reciente", "mas reciente"]
            ) and "2024" not in pl and "2025" not in pl:
                reason = "ballon-latest"
            elif re.search(r"campe[oó]n(a)? del mundo(?!.*(1978|1986|2022|2006|2010|2014|2018))", pl) and (
                "actual" in pl or "vigente" in pl or "hoy" in pl
            ):
                reason = "wc-current"
            if reason:
                show(f"[{path.name} {block.get('letra')}.{i}] ({reason}) {p} => {r}")
                n += 1
                if n >= limit:
                    return n
    return n


def scan_levels():
    n = 0
    for li in range(1, 7):
        d = json.loads(Path(f"assets/data/level_{li}.json").read_text(encoding="utf-8"))
        for i, q in enumerate(d.get("preguntas", [])):
            p = q.get("pregunta") or q.get("question") or ""
            r = q.get("respuesta") or q.get("answer") or ""
            blob = (p + " " + r).lower()
            if "actualmente" in blob or re.search(r"mbapp.*psg|psg.*mbapp", blob) or (
                "balón de oro" in blob and any(x in blob for x in ["actual", "vigente", "último"])
            ):
                show(f"[level_{li}.json q{i}] {p} => {r}")
                n += 1
    return n


def main():
    print("=== preguntas_combinadas ===")
    scan_letter(Path("assets/data/preguntas_combinadas.json"))
    print("=== pasalache_2025 ===")
    scan_letter(Path("assets/data/pasalache_2025.json"))
    print("=== levels ===")
    scan_levels()

    # wordle mbappe
    wp = json.loads(Path("assets/data/wordle_pool.json").read_text(encoding="utf-8"))
    print("=== wordle mbappe/messi/cr7 ===")
    for e in wp:
        name = (e.get("name") or "") + " " + (e.get("answer") or "")
        if re.search(r"mbapp|messi|ronaldo|dembele|dembelé|haaland|yamal|bellingham", name, re.I):
            show(f"{e.get('name')} | {e.get('answer')} | club={e.get('club')}")


if __name__ == "__main__":
    main()
