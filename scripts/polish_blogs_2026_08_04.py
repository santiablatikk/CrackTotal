# -*- coding: utf-8 -*-
"""Second-pass polish after mass blog update (truth date 2026-08-04)."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
n = 0


def sub(path: Path, old: str, new: str) -> None:
    global n
    text = path.read_text(encoding="utf-8")
    if old not in text:
        return
    c = text.count(old)
    path.write_text(text.replace(old, new), encoding="utf-8", newline="\n")
    n += c
    print(f"  {path.name}: {c}x {old[:70]!r} -> {new[:70]!r}")


def main() -> None:
    # --- Revert over-aggressive Champions framing ---
    for name in ("blog-detail-champions.html", "blog-detail-transferencias-caras.html"):
        p = ROOT / name
        sub(p, "Champions League (ciclo 2024/25-2025/26)", "Champions League")

    champions = ROOT / "blog-detail-champions.html"
    # Restore sensible titles (post-PSG title)
    for a, b in [
        (
            "Champions League: La Orejona más Prestigiosa del Mundo - Crack Total",
            "Champions League: historia, formato y el título de PSG 2024/25 - Crack Total",
        ),
        (
            'og:title" content="Champions League: La Orejona más Prestigiosa del Mundo"',
            'og:title" content="Champions League: historia y el título de PSG 2024/25"',
        ),
        (
            'og:description" content="Champions League: historia, formato nuevo, equipos favoritos y análisis completo del torneo más prestigioso del fútbol mundial."',
            'og:description" content="Historia de la Champions, el nuevo formato y el título de Paris Saint-Germain en 2024/25. Actualizado agosto 2026."',
        ),
        (
            'twitter:title" content="Champions League"',
            'twitter:title" content="Champions League: PSG campeón 2024/25"',
        ),
        (
            '"headline": "Champions League: La Orejona más Prestigiosa del Mundo"',
            '"headline": "Champions League: historia, formato y el título de PSG 2024/25"',
        ),
        (
            '"description": "Champions League: historia, formato nuevo, equipos favoritos y análisis completo del torneo más prestigioso del fútbol mundial."',
            '"description": "Historia de la Champions, el nuevo formato y el título de Paris Saint-Germain en 2024/25. Actualizado agosto 2026."',
        ),
        (
            'id="article-hero-title">Champions League: La Orejona más Prestigiosa del Mundo</h1>',
            'id="article-hero-title">Champions League: historia y el título de PSG 2024/25</h1>',
        ),
        (
            'aria-current="page">Champions League</li>',
            'aria-current="page">Champions League 2024/25</li>',
        ),
        (
            '<h1 class="title-text">Champions League</h1>',
            '<h1 class="title-text">Champions League</h1>',
        ),
        (
            "El <strong>Real Madrid</strong> llega a la Champions League como el club más exitoso",
            "El <strong>Real Madrid</strong> sigue siendo el club más exitoso",
        ),
        (
            "<h2>El Impacto Económico de la Champions League</h2>",
            "<h2>El Impacto Económico de la Champions League</h2>",
        ),
        (
            "La Champions League distribuirá más de",
            "La Champions League (ciclo reciente 2024/25) distribuyó más de",
        ),
        (
            "La <strong>final de la Champions League</strong> se disputará el 31 de mayo en el espectacular Allianz Arena de Múnich. Con capacidad para 75,000 espectadores, el estadio del Bayern München será testigo de una nueva coronación europea.",
            "La <strong>final de la Champions 2024/25</strong> se disputó el 31 de mayo de 2025 en el Allianz Arena de Múnich. Allí <strong>Paris Saint-Germain</strong> goleó 5-0 al Inter y levantó su primera Orejona.",
        ),
        (
            "Múnich ha acogido finales históricas y promete un marco incomparable para la culminación del torneo más prestigioso del fútbol mundial. La ciudad alemana se prepara para recibir a millones de aficionados de todo el mundo.",
            "Múnich sumó otra final histórica: el 5-0 de PSG al Inter quedó como una de las coronaciones más contundentes de la era moderna.",
        ),
        (
            "La <strong>Champions League 2024-25</strong> promete ser una edición histórica. Con el nuevo formato revolucionario, equipos valorados en más de €1,000 millones según Transfermarkt, y la participación de las estrellas más brillantes del fútbol mundial, cada partido será un espectáculo.",
            "La <strong>Champions League 2024/25</strong> quedó marcada por el nuevo formato y por el primer título europeo de <strong>Paris Saint-Germain</strong>. El ciclo 2025/26 sigue con el mismo esquema de liga única y favoritos de élite.",
        ),
        (
            "la Champions League continuará escribiendo páginas doradas en la historia del fútbol.",
            "la Champions League sigue escribiendo páginas doradas en la historia del fútbol.",
        ),
        (
            "En mayo de 2025, un nuevo campeón levantará la copa más codiciada del fútbol de clubes. Con datos de Transfermarkt que muestran el nivel económico sin precedentes del torneo, y un formato que promete más emoción que nunca, la Champions League sigue siendo <strong>el sueño dorado de todo futbolista</strong>.",
            "En mayo de 2025, <strong>PSG</strong> levantó la copa más codiciada del fútbol de clubes. Con un mercado de cifras récord y un formato que multiplica las noches grandes, la Champions sigue siendo <strong>el sueño dorado de todo futbolista</strong>.",
        ),
        (
            "<h4>Datos Transfermarkt - Manchester City 2025</h4>",
            "<h4>Datos Transfermarkt - Manchester City (referencia 2025/26)</h4>",
        ),
        (
            "<h4>2024-2025: Nueva Era</h4>",
            "<h4>Desde 2024/25: Nueva Era</h4>",
        ),
    ]:
        sub(champions, a, b)

    # --- World Cups ---
    wc = ROOT / "blog-detail-worldcups.html"
    for a, b in [
        (
            "Historia de los Mundiales 2025: De Uruguay 1930 a Qatar 2022 y Rumbo a 2026 - Crack Total",
            "Historia de los Mundiales: de Uruguay 1930 al título de España 2026 - Crack Total",
        ),
        (
            "La historia completa de los Mundiales de Fútbol desde Uruguay 1930 hasta Qatar 2022, incluyendo estadísticas actualizadas, récords históricos y todo sobre el próximo Mundial 2026.",
            "La historia de los Mundiales desde Uruguay 1930 hasta el Mundial 2026, con récords, estadísticas y el título de España ante Argentina.",
        ),
        (
            'og:title" content="Historia de los Mundiales 2025: De Uruguay 1930 a Qatar 2022"',
            'og:title" content="Historia de los Mundiales: de 1930 a España campeón 2026"',
        ),
        (
            "La historia completa de los Mundiales de Fútbol, récords históricos y proyecciones para el Mundial 2026.",
            "Historia de los Mundiales, récords y el campeonato de España en 2026.",
        ),
        (
            "La historia completa de los Mundiales de Fútbol desde Uruguay 1930 hasta Qatar 2022.",
            "Historia de los Mundiales desde Uruguay 1930 hasta España campeón en 2026.",
        ),
        (
            '"headline": "Historia de los Mundiales 2025: De Uruguay 1930 a Qatar 2022 y Rumbo a 2026"',
            '"headline": "Historia de los Mundiales: de Uruguay 1930 al título de España 2026"',
        ),
        (
            "De Uruguay 1930 a Qatar 2022 y Rumbo a 2026 - Análisis Completo 2025",
            "De Uruguay 1930 al Mundial 2026 — Análisis actualizado agosto 2026",
        ),
        (
            "La <strong>Copa del Mundo de la FIFA</strong> sigue siendo el evento deportivo más visto del planeta en 2025. Desde aquel primer torneo en Uruguay en 1930 hasta el inolvidable Qatar 2022 que coronó a Messi, los Mundiales han escrito las páginas más épicas de la historia del fútbol. Con el próximo mundial de 2026 en Estados Unidos, México y Canadá aproximándose, repasamos la evolución de esta competición que paraliza al mundo cada cuatro años.",
            "La <strong>Copa del Mundo de la FIFA</strong> sigue siendo el evento deportivo más visto del planeta. Desde Uruguay 1930 hasta Qatar 2022 —que coronó a Messi— y el Mundial 2026 en Estados Unidos, México y Canadá —donde <strong>España</strong> se consagró ante Argentina—, repasamos la evolución de la competición que paraliza al mundo cada cuatro años.",
        ),
        (
            "En esta completa revisión histórica actualizada a 2025, exploramos los momentos más memorables, los récords que perduran y las estadísticas que definen a la competición más prestigiosa del fútbol mundial.",
            "En esta revisión histórica actualizada a agosto 2026, exploramos momentos memorables, récords que perduran y las estadísticas que definen la competición más prestigiosa del fútbol mundial.",
        ),
        (
            "<h2>Estadísticas Generales de los Mundiales (1930-2022)</h2>",
            "<h2>Estadísticas Generales de los Mundiales (1930-2026)</h2>",
        ),
        (
            '<div class="stat-number">22</div>\n                    <div class="stat-label">Ediciones Jugadas</div>',
            '<div class="stat-number">23</div>\n                    <div class="stat-label">Ediciones Jugadas</div>',
        ),
        (
            "<p>La Albiceleste coronada en Qatar 2022 con Messi como estrella máxima. Subcampeón en 3 ocasiones.</p>",
            "<p>La Albiceleste coronada en Qatar 2022 con Messi. Subcampeona en 2026 ante España (y en 1930, 1990 y 2014).</p>",
        ),
        (
            "<p>Les Bleus, campeón defensor hasta Qatar 2022. Subcampeón en la última final contra Argentina.</p>",
            "<p>Les Bleus, bicampeones (1998, 2018) y subcampeones en Qatar 2022 ante Argentina.</p>",
        ),
        (
            "<h2>Rumbo al Mundial 2026: Estados Unidos, México y Canadá</h2>",
            "<h2>Mundial 2026: Estados Unidos, México y Canadá — España campeón</h2>",
        ),
        (
            "<h4>Innovaciones del Mundial 2026:</h4>",
            "<h4>Claves del Mundial 2026:</h4>",
        ),
        (
            "<h4>Proyecciones Mundial 2026:</h4>",
            "<h4>Balance Mundial 2026:</h4>",
        ),
        (
            "La <strong>Copa del Mundo de la FIFA</strong> sigue evolucionando en 2025, manteniendo su esencia mientras se adapta a los nuevos tiempos. Desde la emoción pura de Uruguay 1930 hasta la tecnología avanzada de Qatar 2022, cada Mundial ha aportado algo único a la historia del fútbol.",
            "La <strong>Copa del Mundo de la FIFA</strong> sigue evolucionando, manteniendo su esencia mientras se adapta a los nuevos tiempos. Desde Uruguay 1930 hasta Qatar 2022 y el Mundial 2026, cada edición aportó algo único a la historia del fútbol.",
        ),
        (
            "Con el Mundial 2026 aproximándose con su formato expandido y tres países organizadores, nos preparamos para una nueva era de la competición más prestigiosa del deporte rey. Mientras tanto, Qatar 2022 permanecerá en la memoria como el Mundial que coronó a Messi y cerró uno de los capítulos más hermosos de la historia del fútbol.",
            "El Mundial 2026, con formato expandido y tres anfitriones, coronó a <strong>España</strong> (1-0 vs Argentina). Qatar 2022 sigue en la memoria como el Mundial que coronó a Messi; 2026 abre otro capítulo de la historia albiceleste y europea.",
        ),
        (
            "Historia de los Mundiales: De Uruguay 1930 a Qatar 2022 y Rumbo a 2026 - Crack Total",
            "Historia de los Mundiales: de Uruguay 1930 a España campeón 2026 - Crack Total",
        ),
    ]:
        sub(wc, a, b)

    # Insert España in palmarés if missing
    wc_text = wc.read_text(encoding="utf-8")
    if "España - 2 Títulos" not in wc_text and "Francia - 2 Títulos" in wc_text:
        insert = (
            '                    <div class="timeline-item">\n'
            "                        <h4> España - 2 Títulos (2010, 2026)</h4>\n"
            "                        <p>La Roja sumó su segundo Mundial en 2026 al vencer 1-0 a Argentina en MetLife Stadium.</p>\n"
            "          </div>\n"
        )
        wc_text = wc_text.replace(
            '                    <div class="timeline-item">\n                        <h4> Francia - 2 Títulos (1998, 2018)</h4>',
            insert
            + '                    <div class="timeline-item">\n                        <h4> Francia - 2 Títulos (1998, 2018)</h4>',
            1,
        )
        wc.write_text(wc_text, encoding="utf-8", newline="\n")
        print("  blog-detail-worldcups.html: inserted España palmarés")
        global n
        n += 1

    # Add a short WC2026 card after Qatar card if missing
    wc_text = wc.read_text(encoding="utf-8")
    if "Mundial 2026: España campeón" not in wc_text:
        card = """
            <div class="worldcup-card">
                <h3><i class="fas fa-star"></i> Mundial 2026: España campeón</h3>
                <p>En la final de MetLife Stadium, <strong>España</strong> derrotó 1-0 a <strong>Argentina</strong> y levantó su segunda Copa del Mundo (después de Sudáfrica 2010). La Albiceleste llegó como defensora del título de Qatar 2022 y terminó subcampeona.</p>
                <ul>
                    <li><strong>Campeón:</strong> España</li>
                    <li><strong>Subcampeón:</strong> Argentina</li>
                    <li><strong>Sede de la final:</strong> MetLife Stadium (Nueva Jersey)</li>
                </ul>
        </div>
"""
        # insert before Rumbo/Mundial 2026 section heading
        marker = "<h2>Mundial 2026: Estados Unidos, México y Canadá — España campeón</h2>"
        if marker in wc_text:
            wc_text = wc_text.replace(marker, card + "\n            " + marker, 1)
            wc.write_text(wc_text, encoding="utf-8", newline="\n")
            print("  blog-detail-worldcups.html: added WC2026 card")
            n += 1

    # --- Libertadores ---
    lib = ROOT / "blog-detail-libertadores.html"
    for a, b in [
        (
            '<h2><i class="fas fa-calendar"></i> 4 Agosto, 2026</h2>',
            '<h2><i class="fas fa-calendar"></i> Calendario típico de la Copa</h2>',
        ),
        (
            "La edición 2025 está en marcha con <strong>47 equipos</strong> de las 10 confederaciones sudamericanas. Botafogo de Brasil es el campeón defensor, buscando revalidar su título continental.",
            "La edición 2025 coronó a <strong>Flamengo</strong> (1-0 vs Palmeiras en Lima). Botafogo había sido campeón en 2024; en agosto 2026 el foco ya está en el ciclo 2026 de la Copa.",
        ),
        (
            "Botafogo (campeón defensor), Flamengo, Palmeiras, Fortaleza, Internacional, Séo Paulo, Corinthians, Bahia",
            "Flamengo (campeón 2025), Palmeiras, Botafogo, Fortaleza, Internacional, São Paulo, Corinthians, Bahia",
        ),
        (
            "El campeón de la Copa Libertadores 2025 obtendrá:",
            "El campeón de la Copa Libertadores 2025 obtuvo / el vigente ciclo ofrece:",
        ),
    ]:
        sub(lib, a, b)

    # --- Remaining framing / stale futures ---
    pairs_by_file = {
        "blog-detail-argentinos-europa.html": [
            (
                "Los <strong>argentinos que brillan en Europa</strong> en 2025 representan",
                "Los <strong>argentinos que brillan en Europa</strong> en 2026 representan",
            ),
            (
                "El 2025 promete ser un año crucial para consolidar esta presencia argentina en Europa, con el Mundial 2026 en el horizonte y una nueva generación de talentos preparándose para dar el salto al fútbol europeo de élite.",
                "Tras el Mundial 2026, la presencia argentina en Europa sigue siendo clave: una generación consolidada y otra empujando desde abajo para sostener el nivel albiceleste en el Viejo Continente.",
            ),
        ],
        "blog-detail-estadios-iconicos.html": [
            (
                "Estados Unidos, México y Canadá están preparándose para co-organizar el Mundial 2026 con estadios de última generación.",
                "Estados Unidos, México y Canadá co-organizaron el Mundial 2026 con estadios de última generación que fueron sede de la coronación de España.",
            ),
        ],
        "blog-detail-futbol-sudamericano.html": [
            (
                "El 2025 promete ser un año memorable para el fútbol sudamericano, con la Copa Libertadores entregando espectáculo puro, las Eliminatorias definiendo destinos mundialistas y una nueva generación de talentos preparándose para conquistar el mundo desde la cuna del fútbol más bello del planeta.",
                "El ciclo 2025-26 quedó marcado para Sudamérica: Flamengo levantó la Libertadores 2025, el Mundial 2026 coronó a España ante Argentina, y una nueva generación sigue empujando desde la cuna del fútbol más bello del planeta.",
            ),
        ],
        "blog-detail-estilos-juego.html": [
            (
                "En <strong>2025</strong>, el fútbol ha alcanzado nuevos niveles de sofisticación táctica.",
                "En <strong>2026</strong>, el fútbol sigue en niveles altos de sofisticación táctica.",
            ),
        ],
        "blog-detail-mercado-pases.html": [
            (
                "Análisis completo del mercado de pases 2025",
                "Análisis del mercado de pases (ciclo 2025/26)",
            ),
        ],
        "blog-detail-entrenadores-argentinos.html": [
            (
                "Scaloni campeón del mundo, Simeone en Atlético",
                "Scaloni campeón del mundo 2022 (finalista 2026), Simeone en Atlético",
            ),
        ],
        "index.html": [
            (
                "La Scaloneta: cómo se construyó un equipo campeón",
                "La Scaloneta: el ciclo que fue campeón del mundo y llegó otra vez a la final",
            ),
        ],
    }
    for fname, pairs in pairs_by_file.items():
        p = ROOT / fname
        for a, b in pairs:
            sub(p, a, b)

    # blog.html card titles alignment (edition years)
    blog = ROOT / "blog.html"
    for a, b in [
        ("Argentinos que Brillan en Europa 2025", "Argentinos que Brillan en Europa 2026"),
        ("Messi 2025", "Messi 2026"),
        ("Transferencias más Caras de la Historia 2025", "Transferencias más Caras de la Historia 2026"),
        ("Historia de los Mundiales 2025", "Historia de los Mundiales"),
        ("Rumbo a 2026", "España campeón 2026"),
        ("Mercado de Pases 2025", "Mercado de Pases 2026"),
        ("Champions League 2025", "Champions League"),
    ]:
        sub(blog, a, b)

    print(f"TOTAL replacements: {n}")


if __name__ == "__main__":
    main()
