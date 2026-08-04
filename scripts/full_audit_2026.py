# -*- coding: utf-8 -*-
"""Auditoria completa de los 11 bancos de preguntas (verdad: 2026-08-04)."""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"
OUT = ROOT / "scripts" / "_full_audit_2026.txt"

PASALA = ["pasalache_2025.json", "preguntas_combinadas.json"]
QSM = [f"level_{i}.json" for i in range(1, 7)]
TOP10 = ["top10_pool.json", "top10_pool_extended.json"]
WORDLE = ["wordle_pool.json"]

CONTIENE_RE = re.compile(r"^CONTIENE\s+([A-ZÑÁÉÍÓÚÜ])\s*:", re.I)

RED_FLAGS = {
    "cruzeiro_5": re.compile(r"Cruzeiro.{0,60}(cinco|5)\s*(Copas?\s*)?Libertadores|cinco Libertadores", re.I),
    "estudiantes_6": re.compile(r"Estudiantes.{0,60}(seis|6)\s*(Copas?\s*)?Libertadores", re.I),
    # "leyenda del Manchester City" es un ancla historica valida; solo marcamos presente
    "kdb_city": re.compile(r"belga (del|que juega en el) Man(chester)? City", re.I),
    "mbappe_psg": re.compile(r"Mbapp[eé].{0,60}PSG|PSG.{0,60}Mbapp[eé]|Mbapp[eé].{0,60}Paris Saint", re.I),
    "alvarez_city": re.compile(r"Juli[aá]n.{0,60}Man(chester)? City|[ÁA]lvarez.{0,60}Man(chester)? City|Man(chester)? City.{0,40}[ÁA]lvarez", re.I),
    "messi_no_miami": re.compile(r"Messi.{0,60}(Barcelona|PSG|Paris)\b(?!.*(hist|ex|leyenda|gan[óo]|jug[óo]))", re.I),
    # los estadios y los vinculos confirmados a 2026-08-04 no son presente falso
    "present_tense": re.compile(
        r"\b(actualmente|milita en|ataja en|dirige actualmente|entrenador actual|t[ée]cnico actual)\b"
        r"|juega en (?!Inter Miami|Boca|Al Nassr|Anfield|Goodison|St James|Loftus)",
        re.I,
    ),
    "spoiler_nombre_apellido": re.compile(r"Nombre y apellido del?\s.{3,90},\s*[A-ZÁÉÍÓÚÑ][a-záéíóúñü]+\s*(…|\.\.\.)", re.I),
    # Rodri (2024) y Dembele (2025) son correctos: solo marcamos atribuciones erroneas
    "balon_2024_wrong": re.compile(r"Bal[oó]n de Oro 2024(?!.*Rodri)(?<!Rodri)", re.I),
    "balon_2025_wrong": re.compile(r"Bal[oó]n de Oro 2025(?!.*Demb)", re.I),
}

# Ortografia: forma mala -> forma buena
ORTO = {
    "Pique": "Piqué",
    "Ozil": "Özil",
    "Modric": "Modrić",
    "Gremio": "Grêmio",
    "Militao": "Militão",
    "Joao": "João",
    "Ruben Dias": "Rúben Dias",
    "Munich": "Múnich",
    "Julian Alvarez": "Julián Álvarez",
    "Dembele": "Dembélé",
    "Kroos": None,
}


def strip(s) -> str:
    s = unicodedata.normalize("NFD", str(s or ""))
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower().strip()


def load(name: str):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def audit_pasala(name: str) -> dict:
    data = load(name)
    res = {
        "count": 0,
        "letters": len(data),
        "letter": [],
        "flags": defaultdict(list),
        "dups": [],
        "orto": [],
    }
    seen = defaultdict(list)
    for block in data:
        L = block["letra"]
        exp = strip(L)[0]
        for q in block["preguntas"]:
            res["count"] += 1
            p, r = q["pregunta"], q["respuesta"]
            rn = strip(r)
            m = CONTIENE_RE.match(p.strip())
            if m:
                if strip(m.group(1))[0] != exp:
                    res["letter"].append(("LETTER_MISMATCH", L, p, r))
                if exp not in rn:
                    res["letter"].append(("CONTIENE_MISS", L, p, r))
            else:
                if p.strip().upper().startswith("CONTIENE"):
                    res["letter"].append(("BAD_CONTIENE_FORMAT", L, p, r))
                elif rn and not rn.startswith(exp):
                    res["letter"].append(("START_MISS", L, p, r))
            blob = f"{p} {r}"
            for key, rx in RED_FLAGS.items():
                if rx.search(blob):
                    res["flags"][key].append((L, p, r))
            for bad, good in ORTO.items():
                if good and re.search(rf"\b{re.escape(bad)}\b", blob) and good not in blob:
                    res["orto"].append((L, bad, good, p, r))
            seen[(L, strip(p))].append(r)
    for (L, pn), rs in seen.items():
        if len(rs) > 1:
            res["dups"].append((L, pn[:70], rs))
    return res


def audit_qsm(name: str) -> dict:
    raw = load(name)
    qs = raw.get("preguntas") if isinstance(raw, dict) else raw
    res = {"count": len(qs), "schema": [], "flags": defaultdict(list), "dups": [], "kinds": Counter()}
    seen = Counter()
    for i, q in enumerate(qs):
        p = q.get("pregunta") or q.get("question") or ""
        opts = q.get("opciones") or q.get("options")
        seen[strip(p)] += 1
        if opts is not None:
            res["kinds"]["mc"] += 1
            corr = q.get("respuesta_correcta", q.get("correcta", q.get("respuesta")))
            if isinstance(opts, dict):
                vals = list(opts.values())
                keys = list(opts.keys())
                ok = corr in keys or corr in vals
            else:
                vals = list(opts)
                ok = corr in vals or (isinstance(corr, int) and 0 <= corr < len(vals))
            if not ok:
                res["schema"].append((i, "CORRECT_NOT_IN_OPTIONS", p[:70], corr))
            if len(vals) < 2:
                res["schema"].append((i, "FEW_OPTIONS", p[:70], vals))
            if len(set(strip(v) for v in vals)) != len(vals):
                res["schema"].append((i, "DUP_OPTIONS", p[:70], vals))
            blob = p + " " + " ".join(str(v) for v in vals)
        else:
            ans = q.get("respuesta") or q.get("answer")
            res["kinds"]["free"] += 1
            if not ans:
                res["schema"].append((i, "NO_ANSWER", p[:70], None))
            blob = f"{p} {ans}"
        for key, rx in RED_FLAGS.items():
            if rx.search(blob):
                res["flags"][key].append((i, p[:80]))
    res["dups"] = [(k[:70], v) for k, v in seen.items() if v > 1 and k]
    return res


def audit_top10(name: str) -> dict:
    raw = load(name)
    if isinstance(raw, dict):
        topics = raw.get("topics") or raw.get("pool") or raw.get("items") or []
    else:
        topics = raw
    res = {"count": len(topics), "schema": [], "flags": defaultdict(list), "dups": []}
    titles = Counter()
    for t in topics:
        title = t.get("title") or t.get("titulo") or t.get("pregunta") or ""
        answers = t.get("answers") or t.get("respuestas") or t.get("items") or []
        titles[strip(title)] += 1
        norm = []
        for a in answers:
            if isinstance(a, str):
                norm.append(a)
            elif isinstance(a, dict):
                norm.append(a.get("text") or a.get("name") or a.get("respuesta") or "")
        if len(norm) != 10:
            res["schema"].append((title[:60], f"LEN={len(norm)}"))
        if len(set(strip(x) for x in norm)) != len(norm):
            res["schema"].append((title[:60], "DUP_ANSWERS"))
        # top10.js normaliza y renderiza en mayusculas: el pool va en minusculas por diseno
        blob = title + " " + " ".join(norm)
        for key, rx in RED_FLAGS.items():
            if rx.search(blob):
                res["flags"][key].append((title[:60],))
    res["dups"] = [k for k, v in titles.items() if v > 1 and k]
    return res


def audit_wordle(name: str) -> dict:
    raw = load(name)
    items = raw if isinstance(raw, list) else raw.get("pool") or raw.get("words") or []
    res = {"count": len(items), "schema": [], "flags": defaultdict(list), "dups": []}
    seen = Counter()
    for it in items:
        ans = it.get("answer") or ""
        nm = it.get("name") or ""
        club = it.get("club") or ""
        seen[strip(ans)] += 1
        if not ans:
            res["schema"].append((nm, "NO_ANSWER"))
            continue
        # el loader normaliza (minusculas + sin acentos): solo importan los caracteres base
        if not re.fullmatch(r"[A-Za-zÑñ]+", ans):
            res["schema"].append((nm, f"BAD_CHARS:{ans}"))
        if not (3 <= len(ans) <= 12):
            res["schema"].append((nm, f"BAD_LEN:{ans}"))
        blob = f"{nm} {club} {it.get('nationality','')} {it.get('position','')}"
        for key, rx in RED_FLAGS.items():
            if rx.search(blob):
                res["flags"][key].append((nm, club))
    res["dups"] = [k for k, v in seen.items() if v > 1]
    return res


def cross_bank_consistency() -> list:
    """Detecta la misma persona con clubes contradictorios entre bancos."""
    watch = {
        "mbappe": "Real Madrid",
        "julian alvarez": "Atletico",
        "messi": "Inter Miami",
        "de bruyne": "Napoli",
        "dembele": "Paris Saint-Germain",
    }
    hits = []
    for name in PASALA + QSM + TOP10 + WORDLE:
        text = (DATA / name).read_text(encoding="utf-8")
        for line in text.splitlines():
            ln = strip(line)
            for person, club in watch.items():
                if person in ln and "club" not in ln[:12]:
                    if strip(club) not in ln and re.search(r"juega en|actualmente|milita", ln):
                        hits.append((name, line.strip()[:110]))
    return hits


def main() -> None:
    buf = []

    def w(s=""):
        buf.append(str(s))

    w("=== INVENTARIO + AUDITORIA (verdad 2026-08-04) ===")
    w()
    w("-- PASALA --")
    for n in PASALA:
        r = audit_pasala(n)
        w(f"{n}: count={r['count']} letters={r['letters']} letter_issues={len(r['letter'])} orto={len(r['orto'])} dups={len(r['dups'])}")
        for it in r["letter"][:20]:
            w(f"   LETTER {it}")
        for k, v in r["flags"].items():
            w(f"   FLAG {k}: {len(v)}")
            for x in v[:6]:
                w(f"      {x}")
        for it in r["orto"][:15]:
            w(f"   ORTO {it[1]}->{it[2]} | {it[3][:70]}")
        for it in r["dups"][:10]:
            w(f"   DUP {it}")
        w()

    w("-- QSM --")
    for n in QSM:
        r = audit_qsm(n)
        w(f"{n}: count={r['count']} kinds={dict(r['kinds'])} schema={len(r['schema'])} dups={len(r['dups'])}")
        for it in r["schema"][:15]:
            w(f"   SCHEMA {it}")
        for k, v in r["flags"].items():
            w(f"   FLAG {k}: {len(v)}")
            for x in v[:8]:
                w(f"      {x}")
        for it in r["dups"][:10]:
            w(f"   DUP x{it[1]} {it[0]}")
        w()

    w("-- TOP10 --")
    for n in TOP10:
        r = audit_top10(n)
        w(f"{n}: topics={r['count']} schema={len(r['schema'])} dups={len(r['dups'])}")
        for it in r["schema"][:20]:
            w(f"   SCHEMA {it}")
        for k, v in r["flags"].items():
            w(f"   FLAG {k}: {len(v)} {v[:4]}")
        for it in r["dups"][:10]:
            w(f"   DUP {it}")
        w()

    w("-- WORDLE --")
    for n in WORDLE:
        r = audit_wordle(n)
        w(f"{n}: count={r['count']} schema={len(r['schema'])} dups={len(r['dups'])}")
        for it in r["schema"][:20]:
            w(f"   SCHEMA {it}")
        for k, v in r["flags"].items():
            w(f"   FLAG {k}: {len(v)} {v[:4]}")
        for it in r["dups"][:10]:
            w(f"   DUP {it}")
        w()

    w("-- CROSS-BANK --")
    for h in cross_bank_consistency()[:40]:
        w(f"   {h}")

    OUT.write_text("\n".join(buf), encoding="utf-8")
    print("\n".join(buf[:400]))
    print(f"\n[reporte completo: {OUT.relative_to(ROOT)}]")


if __name__ == "__main__":
    sys.exit(main())
