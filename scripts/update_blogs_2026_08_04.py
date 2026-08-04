# -*- coding: utf-8 -*-
"""Update all Crack Total blogs to truth date 2026-08-04."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRUTH_ISO = "2026-08-04"
TRUTH_HUMAN = "4 Agosto, 2026"
TRUTH_HUMAN_ALT = "4 de Agosto, 2026"
changes: list[dict] = []


def log(file: str, kind: str, before: str, after: str) -> None:
    changes.append({"file": file, "kind": kind, "before": before[:160], "after": after[:160]})


def update_schema_dates(text: str, file: str) -> str:
    def mod_pub(m):
        key = m.group(1)
        old = m.group(2)
        new = TRUTH_ISO
        if old != new:
            log(file, "schema", f'{key}:{old}', f'{key}:{new}')
        return f'"{key}": "{new}"'

    text = re.sub(r'"(datePublished|dateModified)"\s*:\s*"([^"]+)"', mod_pub, text)
    # broken JS-style comment in tactics schema
    text = text.replace(
        f'"dateModified": "{TRUTH_ISO}" // Fecha de hoy como modificada',
        f'"dateModified": "{TRUTH_ISO}"',
    )
    text = re.sub(
        r'("dateModified"\s*:\s*"20\d{2}-\d{2}-\d{2}")\s*//[^\n]*',
        r'\1',
        text,
    )
    return text


def update_visible_dates(text: str, file: str) -> str:
    patterns = [
        # <i class="fas fa-calendar..."></i> 30 Enero, 2025
        (
            re.compile(
                r'(<i class="fas fa-calendar[^"]*"[^>]*>\s*</i>\s*)([^<\n]+20\d{2})',
                re.I,
            ),
            TRUTH_HUMAN,
        ),
        (
            re.compile(
                r'(class="blog-date"[^>]*>\s*(?:<i[^>]*>\s*</i>\s*)?)([^<\n]+20\d{2})',
                re.I,
            ),
            TRUTH_HUMAN,
        ),
    ]
    for rx, replacement in patterns:
        def repl(m, rep=replacement):
            old = m.group(2).strip()
            if old == rep:
                return m.group(0)
            log(file, "visible-date", old, rep)
            return m.group(1) + rep

        text = rx.sub(repl, text)
    return text


def global_year_framing(text: str, file: str) -> str:
    """Update article-edition framing 2025 -> 2026 without rewriting all historical years."""
    replacements = [
        ("hasta 2025", "hasta agosto 2026"),
        ("Hasta 2025", "Hasta agosto 2026"),
        ("Actualizado 2025", "Actualizado agosto 2026"),
        ("Actualizado  2025", "Actualizado agosto 2026"),
        ("Datos Actualizados  2025", "Datos Actualizados agosto 2026"),
        ("Datos Actualizados 2025", "Datos Actualizados agosto 2026"),
        ("(Actualizado 2025)", "(Actualizado agosto 2026)"),
        ("en 2025, a sus 37 años", "en agosto 2026, a sus 39 años"),
        ("En 2025, a sus 37 años", "En agosto 2026, a sus 39 años"),
        ("Inter Miami (2023-2025)", "Inter Miami (2023-2026)"),
        ("Estadísticas en Inter Miami (2023-2025)", "Estadísticas en Inter Miami (2023-2026)"),
        ("El Nuevo Capítulo: Inter Miami (2023-2025)", "El Nuevo Capítulo: Inter Miami (2023-2026)"),
        ("Contrato en Miami:</strong> Hasta diciembre 2025", "Contrato en Miami:</strong> vigente en 2026 (MLS)"),
        ("Contrato:</strong> Hasta diciembre 2025", "Contrato:</strong> vigente en la MLS en 2026"),
        ("Valor actual:</strong> €15 millones (enero 2025)", "Valor de referencia:</strong> entorno a €15 millones (mercado 2025/26)"),
        ("2025 (actual):</strong> €15 millones", "2026 (referencia):</strong> €15 millones"),
        ("Messi 2025: El Futuro", "Messi 2026: Después del Mundial"),
        ("De 2004 a 2025 representa", "De 2004 a 2026 representa"),
        ("preparándose para una posible última danza en el Mundial 2026", "tras protagonizar el Mundial 2026 con Argentina"),
        ("Lionel Messi 2025", "Lionel Messi 2026"),
        ("Messi 2025:", "Messi 2026:"),
        ("La Evolución de Lionel Messi 2025", "La Evolución de Lionel Messi 2026"),
        ("La Evolución de Lionel Messi <span>2025</span>", "La Evolución de Lionel Messi <span>2026</span>"),
        ("El Legado del GOAT en 2025", "El Legado del GOAT en 2026"),
        ("Transferencias más Caras de la Historia 2025", "Transferencias más Caras de la Historia 2026"),
        ("Transferencias más Caras de la Historia <span>2025</span>", "Transferencias más Caras de la Historia <span>2026</span>"),
        ("En 2025, los fichajes más caros", "En 2026, los fichajes más caros"),
        ("Valor Actual (2025):", "Valor de referencia (2025/26):"),
        ("Mercado de Pases 2025", "Mercado de Pases 2026"),
        ("Análisis del Mercado de Pases 2025", "Análisis del Mercado de Pases 2026"),
        ("Champions League 2025", "Champions League (ciclo 2024/25-2025/26)"),
        ("La Evolución de Messi 2025", "La Evolución de Messi 2026"),
        ("Argentinos que Brillan en Europa 2025", "Argentinos que Brillan en Europa 2026"),
        ("Grandes Entrenadores Argentinos 2025", "Grandes Entrenadores Argentinos 2026"),
        ("Los Estadios más Icónicos del Mundo 2025", "Los Estadios más Icónicos del Mundo 2026"),
        ("desde 1916 hasta 2025", "desde 1916 hasta 2026"),
        ("Copa América 2025:", "Copa América (historial actualizado 2026):"),
    ]
    for a, b in replacements:
        if a in text and a != b:
            c = text.count(a)
            text = text.replace(a, b)
            log(file, "framing", f"{a} x{c}", b)
    return text


def factual_fixes(text: str, file: str) -> str:
    pairs = [
        # Mbappé current club framing in transferencias
        (
            "confirmando que fue una inversión acertada para el PSG.",
            "antes de su paso al Real Madrid en 2024, donde sigue siendo una de las estrellas más caras y decisivas de Europa.",
        ),
        (
            "Mbappé mantiene una valoración de <strong>€180 millones</strong> a los 26 años, confirmando que fue una inversión acertada para el PSG.",
            "Mbappé se consolidó luego en el <strong>Real Madrid</strong> (desde 2024), manteniendo una valoración de élite en el mercado europeo.",
        ),
        # Post World Cup 2026
        (
            "mientras continúa brillando en Miami y preparándose para una posible última danza en el Mundial 2026, Messi sigue escribiendo capítulos",
            "tras el Mundial 2026 —donde Argentina cayó en la final ante España— Messi sigue escribiendo capítulos desde Miami",
        ),
        (
            "tras protagonizar el Mundial 2026 con Argentina, Messi sigue escribiendo capítulos de una historia que ya es leyenda",
            "tras el Mundial 2026 (subcampeón con Argentina ante España), Messi sigue escribiendo capítulos de una historia que ya es leyenda",
        ),
        # Generic dangerous "actual campeón del mundo" without year for Argentina
        (
            "Argentina es el actual campeón del mundo",
            "Argentina fue campeón del mundo en 2022 y subcampeón en 2026",
        ),
        (
            "actual campeón del mundo con la Scaloneta",
            "campeón del mundo 2022 con la Scaloneta",
        ),
        (
            "vigente campeón del mundo",
            "campeón del Mundial 2022",
        ),
        # Champions latest
        (
            "el Real Madrid como último campeón de la Champions",
            "el Paris Saint-Germain como campeón de la Champions 2024/25",
        ),
        (
            "último campeón de la Champions League es el Real Madrid",
            "campeón de la Champions League 2024/25 es el Paris Saint-Germain",
        ),
        (
            "Real Madrid levantó la orejona en 2024",
            "Paris Saint-Germain levantó la orejona en 2025 (final 2024/25)",
        ),
        # Libertadores
        (
            "Botafogo campeón de la Libertadores 2024",
            "Flamengo campeón de la Libertadores 2025 (Botafogo lo había sido en 2024)",
        ),
        (
            "último campeón de la Copa Libertadores",
            "campeón de la Copa Libertadores 2025 (Flamengo)",
        ),
        # Ballon
        (
            "Rodri, actual ganador del Balón de Oro",
            "Ousmane Dembélé, ganador del Balón de Oro 2025 (Rodri lo había ganado en 2024)",
        ),
        (
            "Balón de Oro actual pertenece a Rodri",
            "Balón de Oro 2025 pertenece a Ousmane Dembélé",
        ),
    ]
    for a, b in pairs:
        if a in text:
            text = text.replace(a, b)
            log(file, "factual", a, b)
    return text


def inject_update_note(text: str, file: str) -> str:
    """Ensure a short update note near article header if missing."""
    note = (
        f'<p class="article-update-note" style="color:var(--home-muted,#aebbd0);font-size:0.92rem;">'
        f'<i class="fas fa-sync-alt" aria-hidden="true"></i> Actualizado: {TRUTH_HUMAN_ALT}.</p>'
    )
    if "article-update-note" in text:
        text = re.sub(
            r'<p class="article-update-note"[^>]*>.*?</p>',
            note,
            text,
            count=1,
            flags=re.S,
        )
        return text
    # after first calendar span block if possible
    m = re.search(r'(<span><i class="fas fa-calendar[^"]*"[^>]*>\s*</i>\s*[^<]+</span>)', text, re.I)
    if m:
        text = text[: m.end()] + "\n        " + note + text[m.end() :]
        log(file, "note", "(missing)", TRUTH_HUMAN_ALT)
    return text


def add_closing_context(text: str, file: str) -> str:
    """Add a compact 2026 context box before related links if key tournament pages."""
    snippets = {
        "blog-detail-worldcups.html": (
            "Contexto 2026",
            "España se coronó campeón del Mundial 2026 al vencer 1-0 a Argentina en la final (MetLife Stadium). "
            "Argentina llegó como defensor del título 2022 y terminó subcampeona.",
        ),
        "blog-detail-champions.html": (
            "Contexto 2024/25",
            "Paris Saint-Germain ganó su primera Champions League al golear 5-0 al Inter en la final de Múnich (31 mayo 2025). "
            "Ousmane Dembélé terminó la temporada levantando también el Balón de Oro 2025.",
        ),
        "blog-detail-libertadores.html": (
            "Contexto 2025",
            "Flamengo se consagró campeón de la Copa Libertadores 2025 al vencer 1-0 a Palmeiras en Lima, "
            "logrando su tetracampeonato continental.",
        ),
        "blog-detail-messi.html": (
            "Contexto agosto 2026",
            "Tras el Mundial 2026, Messi continúa su etapa en Inter Miami. Argentina fue subcampeona del mundo "
            "y España levantó su segunda Copa del Mundo.",
        ),
        "blog-detail-transferencias-caras.html": (
            "Contexto 2026",
            "El ranking histórico de fichajes sigue liderado por operaciones como Neymar a PSG. "
            "Mbappé, tras su ciclo parisino, consolida su etapa en el Real Madrid desde 2024.",
        ),
        "blog-detail-scaloneta.html": (
            "Contexto 2026",
            "La Scaloneta llegó otra vez a una final mundial en 2026, pero esta vez España se quedó con el título. "
            "El ciclo de Scaloni sigue siendo uno de los más relevantes de la historia argentina.",
        ),
    }
    if file not in snippets:
        return text
    if 'class="ct-2026-context"' in text:
        return text
    title, body = snippets[file]
    box = (
        f'\n        <aside class="ct-2026-context" style="margin:1.5rem 0;padding:1rem 1.15rem;'
        f'border:1px solid rgba(121,242,166,.35);border-radius:14px;background:rgba(11,21,36,.55);">'
        f'<p class="home-eyebrow" style="margin:0 0 .5rem;">{title}</p>'
        f"<p style=\"margin:0;color:var(--home-muted,#aebbd0);line-height:1.65;\">{body}</p>"
        f"</aside>\n"
    )
    # insert before related articles / share / footer CTAs if possible
    anchor = re.search(r'(<div class="related| <section class="related| <div class="share| <div data-ct-footer| <footer)', text, re.I)
    if anchor:
        text = text[: anchor.start()] + box + text[anchor.start() :]
        log(file, "context-box", "(new)", title)
    else:
        # before last </main> or end of article content
        text = text.replace("</article>", box + "</article>", 1)
        log(file, "context-box", "(new-fallback)", title)
    return text


def process_file(path: Path) -> bool:
    orig = path.read_text(encoding="utf-8")
    text = orig
    file = path.name
    text = update_schema_dates(text, file)
    text = update_visible_dates(text, file)
    text = global_year_framing(text, file)
    text = factual_fixes(text, file)
    if file.startswith("blog-detail-"):
        text = inject_update_note(text, file)
        text = add_closing_context(text, file)
    if text != orig:
        path.write_text(text, encoding="utf-8", newline="\n")
        return True
    return False


def process_blog_index() -> bool:
    path = ROOT / "blog.html"
    orig = path.read_text(encoding="utf-8")
    text = orig

    def repl_date(m):
        log("blog.html", "card-date", m.group(2).strip(), TRUTH_HUMAN)
        return m.group(1) + TRUTH_HUMAN

    text = re.sub(
        r'(class="blog-date"[^>]*>\s*<i[^>]*>\s*</i>\s*)([^<]+)',
        repl_date,
        text,
        flags=re.I,
    )
    # Card titles with 2025 edition framing
    for a, b in [
        ("2025", "2026"),  # too broad - skip
    ]:
        pass
    text = text.replace("Argentinos que Brillan en Europa 2025", "Argentinos que Brillan en Europa 2026")
    text = text.replace("Messi 2025", "Messi 2026")
    text = text.replace("Transferencias más Caras de la Historia 2025", "Transferencias más Caras de la Historia 2026")
    if text != orig:
        path.write_text(text, encoding="utf-8", newline="\n")
        return True
    return False


def process_home_historias() -> bool:
    path = ROOT / "index.html"
    orig = path.read_text(encoding="utf-8")
    text = orig
    # no hard factual claims in historias cards currently beyond titles - leave unless needed
    if "Mundial 2026" not in text and "home-editorial" in text:
        # optional soft note not required
        pass
    return False


def main():
    updated = []
    if process_blog_index():
        updated.append("blog.html")
    for path in sorted(ROOT.glob("blog-detail-*.html")):
        if process_file(path):
            updated.append(path.name)
    process_home_historias()

    report = {
        "truthDate": TRUTH_ISO,
        "filesUpdated": updated,
        "changeCount": len(changes),
        "sampleChanges": changes[:40],
    }
    out = ROOT / "reports" / "blog_updates_2026-08-04.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"files": len(updated), "changes": len(changes), "updated": updated, "report": str(out)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
