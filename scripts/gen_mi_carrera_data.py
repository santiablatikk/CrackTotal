# -*- coding: utf-8 -*-
"""Genera datasets MVP de Mi Carrera."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "assets" / "data" / "mi-carrera"


def dump(rel: str, data) -> None:
    path = BASE / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    n = len(data) if isinstance(data, list) else "obj"
    print(f"wrote {rel} ({n})")


CONTINENTS = [
    {"id": "continent_sa", "name": "Sudamérica", "shortName": "SA", "code": "SA"},
    {"id": "continent_na", "name": "Norteamérica", "shortName": "NA", "code": "NA"},
    {"id": "continent_ca", "name": "Centroamérica y Caribe", "shortName": "CAC", "code": "CA"},
    {"id": "continent_eu", "name": "Europa", "shortName": "EU", "code": "EU"},
    {"id": "continent_af", "name": "África", "shortName": "AF", "code": "AF"},
    {"id": "continent_as", "name": "Asia", "shortName": "AS", "code": "AS"},
    {"id": "continent_oc", "name": "Oceanía", "shortName": "OC", "code": "OC"},
]

COUNTRY_ROWS = [
    ("country_ar", "Argentina", "Argentina", "AR", "ARG", "continent_sa", "argentino", "ar"),
    ("country_br", "Brasil", "Brasil", "BR", "BRA", "continent_sa", "brasileño", "br"),
    ("country_uy", "Uruguay", "Uruguay", "UY", "URY", "continent_sa", "uruguayo", "uy"),
    ("country_cl", "Chile", "Chile", "CL", "CHL", "continent_sa", "chileno", "cl"),
    ("country_co", "Colombia", "Colombia", "CO", "COL", "continent_sa", "colombiano", "co"),
    ("country_pe", "Perú", "Perú", "PE", "PER", "continent_sa", "peruano", "pe"),
    ("country_py", "Paraguay", "Paraguay", "PY", "PRY", "continent_sa", "paraguayo", "py"),
    ("country_ec", "Ecuador", "Ecuador", "EC", "ECU", "continent_sa", "ecuatoriano", "ec"),
    ("country_bo", "Bolivia", "Bolivia", "BO", "BOL", "continent_sa", "boliviano", "bo"),
    ("country_ve", "Venezuela", "Venezuela", "VE", "VEN", "continent_sa", "venezolano", "ve"),
    ("country_mx", "México", "México", "MX", "MEX", "continent_na", "mexicano", "mx"),
    ("country_us", "Estados Unidos", "EE.UU.", "US", "USA", "continent_na", "estadounidense", "us"),
    ("country_ca", "Canadá", "Canadá", "CA", "CAN", "continent_na", "canadiense", "ca"),
    ("country_cr", "Costa Rica", "Costa Rica", "CR", "CRI", "continent_ca", "costarricense", "cr"),
    ("country_pa", "Panamá", "Panamá", "PA", "PAN", "continent_ca", "panameño", "pa"),
    ("country_hn", "Honduras", "Honduras", "HN", "HND", "continent_ca", "hondureño", "hn"),
    ("country_gt", "Guatemala", "Guatemala", "GT", "GTM", "continent_ca", "guatemalteco", "gt"),
    ("country_sv", "El Salvador", "El Salvador", "SV", "SLV", "continent_ca", "salvadoreño", "sv"),
    ("country_ni", "Nicaragua", "Nicaragua", "NI", "NIC", "continent_ca", "nicaragüense", "ni"),
    ("country_jm", "Jamaica", "Jamaica", "JM", "JAM", "continent_ca", "jamaicano", "jm"),
    ("country_ht", "Haití", "Haití", "HT", "HTI", "continent_ca", "haitiano", "ht"),
    ("country_tt", "Trinidad y Tobago", "Trinidad", "TT", "TTO", "continent_ca", "trinitense", "tt"),
    ("country_cu", "Cuba", "Cuba", "CU", "CUB", "continent_ca", "cubano", "cu"),
    ("country_es", "España", "España", "ES", "ESP", "continent_eu", "español", "es"),
    ("country_pt", "Portugal", "Portugal", "PT", "PRT", "continent_eu", "portugués", "pt"),
    ("country_fr", "Francia", "Francia", "FR", "FRA", "continent_eu", "francés", "fr"),
    ("country_it", "Italia", "Italia", "IT", "ITA", "continent_eu", "italiano", "it"),
    ("country_de", "Alemania", "Alemania", "DE", "DEU", "continent_eu", "alemán", "de"),
    ("country_eng", "Inglaterra", "Inglaterra", "GB", "ENG", "continent_eu", "inglés", "gb-eng"),
    ("country_sco", "Escocia", "Escocia", "GB", "SCO", "continent_eu", "escocés", "gb-sct"),
    ("country_wal", "Gales", "Gales", "GB", "WAL", "continent_eu", "galés", "gb-wls"),
    ("country_nir", "Irlanda del Norte", "Irlanda del Norte", "GB", "NIR", "continent_eu", "norirlandés", "gb-nir"),
    ("country_ie", "Irlanda", "Irlanda", "IE", "IRL", "continent_eu", "irlandés", "ie"),
    ("country_nl", "Países Bajos", "Países Bajos", "NL", "NLD", "continent_eu", "neerlandés", "nl"),
    ("country_be", "Bélgica", "Bélgica", "BE", "BEL", "continent_eu", "belga", "be"),
    ("country_ch", "Suiza", "Suiza", "CH", "CHE", "continent_eu", "suizo", "ch"),
    ("country_at", "Austria", "Austria", "AT", "AUT", "continent_eu", "austríaco", "at"),
    ("country_pl", "Polonia", "Polonia", "PL", "POL", "continent_eu", "polaco", "pl"),
    ("country_cz", "Chequia", "Chequia", "CZ", "CZE", "continent_eu", "checo", "cz"),
    ("country_sk", "Eslovaquia", "Eslovaquia", "SK", "SVK", "continent_eu", "eslovaco", "sk"),
    ("country_hu", "Hungría", "Hungría", "HU", "HUN", "continent_eu", "húngaro", "hu"),
    ("country_ro", "Rumania", "Rumania", "RO", "ROU", "continent_eu", "rumano", "ro"),
    ("country_rs", "Serbia", "Serbia", "RS", "SRB", "continent_eu", "serbio", "rs"),
    ("country_hr", "Croacia", "Croacia", "HR", "HRV", "continent_eu", "croata", "hr"),
    ("country_ba", "Bosnia y Herzegovina", "Bosnia", "BA", "BIH", "continent_eu", "bosnio", "ba"),
    ("country_si", "Eslovenia", "Eslovenia", "SI", "SVN", "continent_eu", "esloveno", "si"),
    ("country_me", "Montenegro", "Montenegro", "ME", "MNE", "continent_eu", "montenegrino", "me"),
    ("country_mk", "Macedonia del Norte", "Macedonia del Norte", "MK", "MKD", "continent_eu", "macedonio", "mk"),
    ("country_al", "Albania", "Albania", "AL", "ALB", "continent_eu", "albanés", "al"),
    ("country_gr", "Grecia", "Grecia", "GR", "GRC", "continent_eu", "griego", "gr"),
    ("country_tr", "Turquía", "Turquía", "TR", "TUR", "continent_eu", "turco", "tr"),
    ("country_dk", "Dinamarca", "Dinamarca", "DK", "DNK", "continent_eu", "danés", "dk"),
    ("country_se", "Suecia", "Suecia", "SE", "SWE", "continent_eu", "sueco", "se"),
    ("country_no", "Noruega", "Noruega", "NO", "NOR", "continent_eu", "noruego", "no"),
    ("country_fi", "Finlandia", "Finlandia", "FI", "FIN", "continent_eu", "finlandés", "fi"),
    ("country_is", "Islandia", "Islandia", "IS", "ISL", "continent_eu", "islandés", "is"),
    ("country_ua", "Ucrania", "Ucrania", "UA", "UKR", "continent_eu", "ucraniano", "ua"),
    ("country_ru", "Rusia", "Rusia", "RU", "RUS", "continent_eu", "ruso", "ru"),
    ("country_by", "Bielorrusia", "Bielorrusia", "BY", "BLR", "continent_eu", "bielorruso", "by"),
    ("country_bg", "Bulgaria", "Bulgaria", "BG", "BGR", "continent_eu", "búlgaro", "bg"),
    ("country_ge", "Georgia", "Georgia", "GE", "GEO", "continent_eu", "georgiano", "ge"),
    ("country_am", "Armenia", "Armenia", "AM", "ARM", "continent_eu", "armenio", "am"),
    ("country_az", "Azerbaiyán", "Azerbaiyán", "AZ", "AZE", "continent_eu", "azerbaiyano", "az"),
    ("country_md", "Moldavia", "Moldavia", "MD", "MDA", "continent_eu", "moldavo", "md"),
    ("country_lt", "Lituania", "Lituania", "LT", "LTU", "continent_eu", "lituano", "lt"),
    ("country_lv", "Letonia", "Letonia", "LV", "LVA", "continent_eu", "letón", "lv"),
    ("country_ee", "Estonia", "Estonia", "EE", "EST", "continent_eu", "estonio", "ee"),
    ("country_cy", "Chipre", "Chipre", "CY", "CYP", "continent_eu", "chipriota", "cy"),
    ("country_mt", "Malta", "Malta", "MT", "MLT", "continent_eu", "maltés", "mt"),
    ("country_lu", "Luxemburgo", "Luxemburgo", "LU", "LUX", "continent_eu", "luxemburgués", "lu"),
    ("country_xk", "Kosovo", "Kosovo", "XK", "XKX", "continent_eu", "kosovar", "xk"),
    ("country_eg", "Egipto", "Egipto", "EG", "EGY", "continent_af", "egipcio", "eg"),
    ("country_ma", "Marruecos", "Marruecos", "MA", "MAR", "continent_af", "marroquí", "ma"),
    ("country_tn", "Túnez", "Túnez", "TN", "TUN", "continent_af", "tunecino", "tn"),
    ("country_dz", "Argelia", "Argelia", "DZ", "DZA", "continent_af", "argelino", "dz"),
    ("country_sn", "Senegal", "Senegal", "SN", "SEN", "continent_af", "senegalés", "sn"),
    ("country_ng", "Nigeria", "Nigeria", "NG", "NGA", "continent_af", "nigeriano", "ng"),
    ("country_gh", "Ghana", "Ghana", "GH", "GHA", "continent_af", "ghanés", "gh"),
    ("country_ci", "Costa de Marfil", "Costa de Marfil", "CI", "CIV", "continent_af", "marfileño", "ci"),
    ("country_cm", "Camerún", "Camerún", "CM", "CMR", "continent_af", "camerunés", "cm"),
    ("country_za", "Sudáfrica", "Sudáfrica", "ZA", "ZAF", "continent_af", "sudafricano", "za"),
    ("country_ml", "Malí", "Malí", "ML", "MLI", "continent_af", "maliense", "ml"),
    ("country_bf", "Burkina Faso", "Burkina Faso", "BF", "BFA", "continent_af", "burkinés", "bf"),
    ("country_cd", "RD del Congo", "RD Congo", "CD", "COD", "continent_af", "congoleño", "cd"),
    ("country_ao", "Angola", "Angola", "AO", "AGO", "continent_af", "angoleño", "ao"),
    ("country_ke", "Kenia", "Kenia", "KE", "KEN", "continent_af", "keniano", "ke"),
    ("country_gn", "Guinea", "Guinea", "GN", "GIN", "continent_af", "guineano", "gn"),
    ("country_jp", "Japón", "Japón", "JP", "JPN", "continent_as", "japonés", "jp"),
    ("country_kr", "Corea del Sur", "Corea del Sur", "KR", "KOR", "continent_as", "surcoreano", "kr"),
    ("country_cn", "China", "China", "CN", "CHN", "continent_as", "chino", "cn"),
    ("country_sa", "Arabia Saudita", "Arabia Saudita", "SA", "SAU", "continent_as", "saudí", "sa"),
    ("country_qa", "Catar", "Catar", "QA", "QAT", "continent_as", "catarí", "qa"),
    ("country_ae", "Emiratos Árabes Unidos", "EAU", "AE", "ARE", "continent_as", "emiratí", "ae"),
    ("country_ir", "Irán", "Irán", "IR", "IRN", "continent_as", "iraní", "ir"),
    ("country_iq", "Irak", "Irak", "IQ", "IRQ", "continent_as", "iraquí", "iq"),
    ("country_uz", "Uzbekistán", "Uzbekistán", "UZ", "UZB", "continent_as", "uzbeko", "uz"),
    ("country_in", "India", "India", "IN", "IND", "continent_as", "indio", "in"),
    ("country_th", "Tailandia", "Tailandia", "TH", "THA", "continent_as", "tailandés", "th"),
    ("country_id", "Indonesia", "Indonesia", "ID", "IDN", "continent_as", "indonesio", "id"),
    ("country_kw", "Kuwait", "Kuwait", "KW", "KWT", "continent_as", "kuwaití", "kw"),
    ("country_il", "Israel", "Israel", "IL", "ISR", "continent_as", "israelí", "il"),
    ("country_au", "Australia", "Australia", "AU", "AUS", "continent_oc", "australiano", "au"),
    ("country_nz", "Nueva Zelanda", "Nueva Zelanda", "NZ", "NZL", "continent_oc", "neozelandés", "nz"),
    ("country_fj", "Fiyi", "Fiyi", "FJ", "FJI", "continent_oc", "fiyiano", "fj"),
    ("country_pg", "Papúa Nueva Guinea", "Papúa", "PG", "PNG", "continent_oc", "papú", "pg"),
]

NT_RATINGS = {
    "country_ar": (90, 95), "country_br": (88, 96), "country_uy": (82, 88), "country_cl": (74, 78),
    "country_co": (80, 84), "country_pe": (72, 74), "country_py": (70, 72), "country_ec": (76, 78),
    "country_bo": (62, 60), "country_ve": (68, 68), "country_mx": (78, 80), "country_us": (78, 82),
    "country_ca": (74, 72), "country_cr": (70, 70), "country_pa": (68, 66), "country_jm": (66, 64),
    "country_es": (90, 94), "country_pt": (86, 88), "country_fr": (90, 95), "country_it": (84, 90),
    "country_de": (86, 92), "country_eng": (88, 92), "country_sco": (72, 74), "country_nl": (86, 88),
    "country_be": (84, 86), "country_hr": (82, 84), "country_rs": (78, 78), "country_ch": (78, 80),
    "country_dk": (80, 80), "country_se": (76, 78), "country_no": (78, 76), "country_pl": (76, 78),
    "country_tr": (76, 76), "country_gr": (72, 74), "country_ua": (76, 76), "country_ma": (80, 78),
    "country_sn": (78, 76), "country_ng": (76, 76), "country_eg": (74, 74), "country_gh": (74, 74),
    "country_ci": (74, 74), "country_cm": (72, 74), "country_za": (68, 68), "country_jp": (78, 80),
    "country_kr": (76, 78), "country_sa": (72, 70), "country_qa": (68, 68), "country_ir": (74, 72),
    "country_au": (74, 74), "country_nz": (62, 60), "country_cn": (66, 64), "country_wal": (74, 72),
}


def club(cid, name, short, country, continent, comp, level, prestige, c1, c2, city=None, incomplete=False, style="shield"):
    return {
        "id": cid,
        "name": name,
        "shortName": short,
        "countryId": country,
        "continentId": continent,
        "primaryCompetitionId": comp,
        "level": level,
        "prestige": prestige,
        "colors": {"primary": c1, "secondary": c2},
        "city": city,
        "badgeId": None,
        "badgeStyle": style,
        "incomplete": incomplete,
    }


CLUBS = [
    club("club_boca", "Club Atlético Boca Juniors", "Boca", "country_ar", "continent_sa", "comp_liga_profesional_ar", 4, 90, "#003B93", "#FABB00", "Buenos Aires"),
    club("club_river", "Club Atlético River Plate", "River", "country_ar", "continent_sa", "comp_liga_profesional_ar", 4, 90, "#E3132D", "#FFFFFF", "Buenos Aires"),
    club("club_independiente", "Club Atlético Independiente", "Independiente", "country_ar", "continent_sa", "comp_liga_profesional_ar", 3, 82, "#E20E17", "#FFFFFF", "Avellaneda"),
    club("club_racing", "Racing Club", "Racing", "country_ar", "continent_sa", "comp_liga_profesional_ar", 3, 80, "#92C3E0", "#FFFFFF", "Avellaneda"),
    club("club_san_lorenzo", "Club Atlético San Lorenzo de Almagro", "San Lorenzo", "country_ar", "continent_sa", "comp_liga_profesional_ar", 3, 78, "#0066B3", "#CE0E2D", "Buenos Aires"),
    club("club_estudiantes", "Club Estudiantes de La Plata", "Estudiantes", "country_ar", "continent_sa", "comp_liga_profesional_ar", 3, 78, "#FFFFFF", "#E30613", "La Plata"),
    club("club_velez", "Club Atlético Vélez Sarsfield", "Vélez", "country_ar", "continent_sa", "comp_liga_profesional_ar", 3, 76, "#FFFFFF", "#003DA5", "Buenos Aires"),
    club("club_newells", "Club Atlético Newell's Old Boys", "Newell's", "country_ar", "continent_sa", "comp_liga_profesional_ar", 2, 72, "#D21033", "#000000", "Rosario"),
    club("club_rosario_central", "Club Atlético Rosario Central", "Central", "country_ar", "continent_sa", "comp_liga_profesional_ar", 2, 72, "#002B5C", "#FCE300", "Rosario"),
    club("club_talleres", "Club Atlético Talleres", "Talleres", "country_ar", "continent_sa", "comp_liga_profesional_ar", 3, 74, "#0033A0", "#FFFFFF", "Córdoba"),
    club("club_lanus", "Club Atlético Lanús", "Lanús", "country_ar", "continent_sa", "comp_liga_profesional_ar", 2, 70, "#8B0000", "#FFFFFF", "Lanús"),
    club("club_huracan", "Club Atlético Huracán", "Huracán", "country_ar", "continent_sa", "comp_liga_profesional_ar", 2, 68, "#FFFFFF", "#E30613", "Buenos Aires"),
    club("club_argentinos", "Asociación Atlética Argentinos Juniors", "Argentinos", "country_ar", "continent_sa", "comp_liga_profesional_ar", 2, 70, "#E30613", "#FFFFFF", "Buenos Aires"),
    club("club_banfield", "Club Atlético Banfield", "Banfield", "country_ar", "continent_sa", "comp_liga_profesional_ar", 2, 66, "#006633", "#FFFFFF", "Banfield"),
    club("club_gimnasia", "Club de Gimnasia y Esgrima La Plata", "Gimnasia", "country_ar", "continent_sa", "comp_liga_profesional_ar", 2, 64, "#FFFFFF", "#0033A0", "La Plata"),
    club("club_union", "Club Atlético Unión", "Unión", "country_ar", "continent_sa", "comp_liga_profesional_ar", 2, 64, "#E30613", "#FFFFFF", "Santa Fe"),
    club("club_defensa", "Defensa y Justicia", "Defensa", "country_ar", "continent_sa", "comp_liga_profesional_ar", 2, 68, "#F5D300", "#1A1A1A", "Florencio Varela"),
    club("club_godoy_cruz", "Club Deportivo Godoy Cruz Antonio Tomba", "Godoy Cruz", "country_ar", "continent_sa", "comp_liga_profesional_ar", 2, 66, "#0033A0", "#FFFFFF", "Mendoza"),
    club("club_instituto", "Instituto Atlético Central Córdoba", "Instituto", "country_ar", "continent_sa", "comp_liga_profesional_ar", 2, 62, "#E30613", "#FFFFFF", "Córdoba", True),
    club("club_flamengo", "Clube de Regatas do Flamengo", "Flamengo", "country_br", "continent_sa", "comp_brasileirao", 4, 92, "#C8102E", "#000000", "Río de Janeiro"),
    club("club_palmeiras", "Sociedade Esportiva Palmeiras", "Palmeiras", "country_br", "continent_sa", "comp_brasileirao", 4, 90, "#006437", "#FFFFFF", "São Paulo"),
    club("club_corinthians", "Sport Club Corinthians Paulista", "Corinthians", "country_br", "continent_sa", "comp_brasileirao", 4, 88, "#000000", "#FFFFFF", "São Paulo"),
    club("club_sao_paulo", "São Paulo Futebol Clube", "São Paulo", "country_br", "continent_sa", "comp_brasileirao", 4, 86, "#FE0000", "#000000", "São Paulo"),
    club("club_santos", "Santos Futebol Clube", "Santos", "country_br", "continent_sa", "comp_brasileirao", 3, 82, "#FFFFFF", "#000000", "Santos"),
    club("club_gremio", "Grêmio Foot-Ball Porto Alegrense", "Grêmio", "country_br", "continent_sa", "comp_brasileirao", 3, 84, "#0D80BF", "#000000", "Porto Alegre"),
    club("club_internacional", "Sport Club Internacional", "Internacional", "country_br", "continent_sa", "comp_brasileirao", 3, 84, "#E20E17", "#FFFFFF", "Porto Alegre"),
    club("club_atletico_mineiro", "Clube Atlético Mineiro", "Atlético-MG", "country_br", "continent_sa", "comp_brasileirao", 4, 86, "#000000", "#FFFFFF", "Belo Horizonte"),
    club("club_cruzeiro", "Cruzeiro Esporte Clube", "Cruzeiro", "country_br", "continent_sa", "comp_brasileirao", 3, 80, "#2F6FED", "#FFFFFF", "Belo Horizonte"),
    club("club_botafogo", "Botafogo de Futebol e Regatas", "Botafogo", "country_br", "continent_sa", "comp_brasileirao", 4, 85, "#000000", "#FFFFFF", "Río de Janeiro"),
    club("club_fluminense", "Fluminense Football Club", "Fluminense", "country_br", "continent_sa", "comp_brasileirao", 3, 82, "#7A0019", "#006633", "Río de Janeiro"),
    club("club_vasco", "Club de Regatas Vasco da Gama", "Vasco", "country_br", "continent_sa", "comp_brasileirao", 3, 78, "#000000", "#FFFFFF", "Río de Janeiro"),
    club("club_athletico_pr", "Club Athletico Paranaense", "Athletico-PR", "country_br", "continent_sa", "comp_brasileirao", 3, 76, "#E30613", "#000000", "Curitiba"),
    club("club_fortaleza", "Fortaleza Esporte Clube", "Fortaleza", "country_br", "continent_sa", "comp_brasileirao", 3, 74, "#E30613", "#0033A0", "Fortaleza"),
    club("club_bahia", "Esporte Clube Bahia", "Bahia", "country_br", "continent_sa", "comp_brasileirao", 2, 70, "#0033A0", "#E30613", "Salvador"),
    club("club_penarol", "Club Atlético Peñarol", "Peñarol", "country_uy", "continent_sa", "comp_primera_uy", 3, 84, "#000000", "#FFD100", "Montevideo"),
    club("club_nacional_uy", "Club Nacional de Football", "Nacional", "country_uy", "continent_sa", "comp_primera_uy", 3, 84, "#FFFFFF", "#E30613", "Montevideo"),
    club("club_colo_colo", "Club Social y Deportivo Colo-Colo", "Colo-Colo", "country_cl", "continent_sa", "comp_primera_cl", 3, 80, "#FFFFFF", "#000000", "Santiago"),
    club("club_u_de_chile", "Club Universidad de Chile", "U. de Chile", "country_cl", "continent_sa", "comp_primera_cl", 3, 78, "#0033A0", "#E30613", "Santiago"),
    club("club_catolica_cl", "Club Deportivo Universidad Católica", "U. Católica", "country_cl", "continent_sa", "comp_primera_cl", 2, 74, "#0033A0", "#FFFFFF", "Santiago"),
    club("club_atletico_nacional", "Atlético Nacional", "Atlético Nacional", "country_co", "continent_sa", "comp_dimayor", 3, 82, "#009639", "#FFFFFF", "Medellín"),
    club("club_millonarios", "Millonarios Fútbol Club", "Millonarios", "country_co", "continent_sa", "comp_dimayor", 3, 78, "#0033A0", "#FFFFFF", "Bogotá"),
    club("club_america_cali", "América de Cali", "América de Cali", "country_co", "continent_sa", "comp_dimayor", 2, 74, "#E30613", "#FFFFFF", "Cali"),
    club("club_junior", "Club Deportivo Popular Junior F.C.", "Junior", "country_co", "continent_sa", "comp_dimayor", 2, 74, "#E30613", "#FFFFFF", "Barranquilla"),
    club("club_olimpia_py", "Club Olimpia", "Olimpia", "country_py", "continent_sa", "comp_primera_py", 3, 78, "#FFFFFF", "#000000", "Asunción"),
    club("club_cerro_porteno", "Club Cerro Porteño", "Cerro Porteño", "country_py", "continent_sa", "comp_primera_py", 3, 76, "#E30613", "#0033A0", "Asunción"),
    club("club_ldu", "Liga Deportiva Universitaria", "LDU Quito", "country_ec", "continent_sa", "comp_ligapro_ec", 3, 76, "#FFFFFF", "#E30613", "Quito", True),
    club("club_barcelona_sc", "Barcelona Sporting Club", "Barcelona SC", "country_ec", "continent_sa", "comp_ligapro_ec", 3, 76, "#F6EB16", "#000000", "Guayaquil"),
    club("club_alianza_lima", "Club Alianza Lima", "Alianza Lima", "country_pe", "continent_sa", "comp_liga1_pe", 2, 72, "#0033A0", "#FFFFFF", "Lima"),
    club("club_universitario", "Club Universitario de Deportes", "Universitario", "country_pe", "continent_sa", "comp_liga1_pe", 2, 72, "#F5D300", "#800000", "Lima"),
    club("club_bolivar", "Club Bolívar", "Bolívar", "country_bo", "continent_sa", "comp_liga1_pe", 2, 68, "#75AADB", "#FFFFFF", "La Paz", True),
    club("club_the_strongest", "The Strongest", "The Strongest", "country_bo", "continent_sa", "comp_liga1_pe", 2, 66, "#F5D300", "#000000", "La Paz", True),
    club("club_america_mx", "Club América", "América", "country_mx", "continent_na", "comp_liga_mx", 3, 86, "#F5D300", "#0033A0", "Ciudad de México"),
    club("club_chivas", "Club Deportivo Guadalajara", "Chivas", "country_mx", "continent_na", "comp_liga_mx", 3, 84, "#E30613", "#FFFFFF", "Guadalajara"),
    club("club_monterrey", "Club de Fútbol Monterrey", "Monterrey", "country_mx", "continent_na", "comp_liga_mx", 3, 82, "#0033A0", "#FFFFFF", "Monterrey"),
    club("club_tigres", "Club de Fútbol Tigres de la UANL", "Tigres", "country_mx", "continent_na", "comp_liga_mx", 3, 84, "#F5D300", "#0033A0", "San Nicolás"),
    club("club_cruz_azul", "Cruz Azul Fútbol Club", "Cruz Azul", "country_mx", "continent_na", "comp_liga_mx", 3, 80, "#0033A0", "#FFFFFF", "Ciudad de México"),
    club("club_pumas", "Club Universidad Nacional", "Pumas", "country_mx", "continent_na", "comp_liga_mx", 2, 74, "#0033A0", "#C4A35A", "Ciudad de México"),
    club("club_inter_miami", "Inter Miami CF", "Inter Miami", "country_us", "continent_na", "comp_mls", 3, 78, "#F7B5CD", "#000000", "Miami"),
    club("club_lafc", "Los Angeles FC", "LAFC", "country_us", "continent_na", "comp_mls", 3, 76, "#000000", "#C39E6D", "Los Ángeles"),
    club("club_lagalaxy", "LA Galaxy", "Galaxy", "country_us", "continent_na", "comp_mls", 2, 74, "#00245D", "#FFD200", "Carson"),
    club("club_seattle", "Seattle Sounders FC", "Sounders", "country_us", "continent_na", "comp_mls", 2, 74, "#5D9732", "#0054A6", "Seattle"),
    club("club_nycfc", "New York City FC", "NYCFC", "country_us", "continent_na", "comp_mls", 2, 72, "#6CACE4", "#041E42", "Nueva York"),
    club("club_atlanta", "Atlanta United FC", "Atlanta", "country_us", "continent_na", "comp_mls", 2, 72, "#80000B", "#000000", "Atlanta"),
    club("club_toronto", "Toronto FC", "Toronto", "country_ca", "continent_na", "comp_mls", 2, 70, "#E31937", "#FFFFFF", "Toronto"),
    club("club_vancouver", "Vancouver Whitecaps FC", "Whitecaps", "country_ca", "continent_na", "comp_mls", 2, 68, "#00245D", "#FFFFFF", "Vancouver"),
    club("club_saprissa", "Deportivo Saprissa", "Saprissa", "country_cr", "continent_ca", "comp_costa_rica", 2, 66, "#7B2D8E", "#FFFFFF", "San Juan de Tibás"),
    club("club_alajuelense", "Liga Deportiva Alajuelense", "Alajuelense", "country_cr", "continent_ca", "comp_costa_rica", 2, 64, "#E30613", "#000000", "Alajuela"),
    club("club_manchester_city", "Manchester City FC", "Man City", "country_eng", "continent_eu", "comp_premier", 5, 98, "#6CABDD", "#FFFFFF", "Manchester"),
    club("club_arsenal", "Arsenal FC", "Arsenal", "country_eng", "continent_eu", "comp_premier", 5, 94, "#EF0107", "#FFFFFF", "Londres"),
    club("club_liverpool", "Liverpool FC", "Liverpool", "country_eng", "continent_eu", "comp_premier", 5, 96, "#C8102E", "#FFFFFF", "Liverpool"),
    club("club_manchester_united", "Manchester United FC", "Man United", "country_eng", "continent_eu", "comp_premier", 5, 94, "#DA291C", "#FFFFFF", "Manchester"),
    club("club_chelsea", "Chelsea FC", "Chelsea", "country_eng", "continent_eu", "comp_premier", 5, 92, "#034694", "#FFFFFF", "Londres"),
    club("club_tottenham", "Tottenham Hotspur FC", "Tottenham", "country_eng", "continent_eu", "comp_premier", 4, 88, "#FFFFFF", "#132257", "Londres"),
    club("club_newcastle", "Newcastle United FC", "Newcastle", "country_eng", "continent_eu", "comp_premier", 4, 86, "#241F20", "#FFFFFF", "Newcastle"),
    club("club_aston_villa", "Aston Villa FC", "Aston Villa", "country_eng", "continent_eu", "comp_premier", 4, 84, "#95BFE5", "#670E36", "Birmingham"),
    club("club_west_ham", "West Ham United FC", "West Ham", "country_eng", "continent_eu", "comp_premier", 3, 78, "#7A263A", "#1BB1E7", "Londres"),
    club("club_brighton", "Brighton & Hove Albion FC", "Brighton", "country_eng", "continent_eu", "comp_premier", 3, 78, "#0057B8", "#FFFFFF", "Brighton"),
    club("club_real_madrid", "Real Madrid Club de Fútbol", "Real Madrid", "country_es", "continent_eu", "comp_laliga", 5, 99, "#FFFFFF", "#FFD100", "Madrid"),
    club("club_barcelona", "FC Barcelona", "Barcelona", "country_es", "continent_eu", "comp_laliga", 5, 97, "#A50044", "#004D98", "Barcelona"),
    club("club_atletico_madrid", "Club Atlético de Madrid", "Atlético", "country_es", "continent_eu", "comp_laliga", 5, 92, "#CB3524", "#FFFFFF", "Madrid"),
    club("club_sevilla", "Sevilla FC", "Sevilla", "country_es", "continent_eu", "comp_laliga", 4, 84, "#FFFFFF", "#D4A017", "Sevilla"),
    club("club_real_sociedad", "Real Sociedad de Fútbol", "Real Sociedad", "country_es", "continent_eu", "comp_laliga", 4, 82, "#0067B1", "#FFFFFF", "San Sebastián"),
    club("club_villarreal", "Villarreal CF", "Villarreal", "country_es", "continent_eu", "comp_laliga", 3, 80, "#FFE014", "#005187", "Villarreal"),
    club("club_athletic", "Athletic Club", "Athletic", "country_es", "continent_eu", "comp_laliga", 3, 80, "#EE2523", "#FFFFFF", "Bilbao"),
    club("club_betis", "Real Betis Balompié", "Betis", "country_es", "continent_eu", "comp_laliga", 3, 78, "#0BB363", "#FFFFFF", "Sevilla"),
    club("club_valencia", "Valencia CF", "Valencia", "country_es", "continent_eu", "comp_laliga", 3, 78, "#FFFFFF", "#EE3524", "Valencia"),
    club("club_inter", "FC Internazionale Milano", "Inter", "country_it", "continent_eu", "comp_serie_a", 5, 94, "#010E80", "#000000", "Milán"),
    club("club_milan", "AC Milan", "Milan", "country_it", "continent_eu", "comp_serie_a", 5, 92, "#FB090B", "#000000", "Milán"),
    club("club_juventus", "Juventus FC", "Juventus", "country_it", "continent_eu", "comp_serie_a", 5, 92, "#000000", "#FFFFFF", "Turín"),
    club("club_napoli", "SSC Napoli", "Napoli", "country_it", "continent_eu", "comp_serie_a", 5, 90, "#12A0D7", "#FFFFFF", "Nápoles"),
    club("club_roma", "AS Roma", "Roma", "country_it", "continent_eu", "comp_serie_a", 4, 84, "#8E1F2F", "#F0BC42", "Roma"),
    club("club_lazio", "SS Lazio", "Lazio", "country_it", "continent_eu", "comp_serie_a", 4, 82, "#87D8F7", "#FFFFFF", "Roma"),
    club("club_fiorentina", "ACF Fiorentina", "Fiorentina", "country_it", "continent_eu", "comp_serie_a", 3, 78, "#482E92", "#FFFFFF", "Florencia"),
    club("club_atalanta", "Atalanta BC", "Atalanta", "country_it", "continent_eu", "comp_serie_a", 4, 84, "#1B2E5B", "#E30613", "Bérgamo"),
    club("club_bayern", "FC Bayern München", "Bayern", "country_de", "continent_eu", "comp_bundesliga", 5, 97, "#DC052D", "#FFFFFF", "Múnich"),
    club("club_dortmund", "Borussia Dortmund", "Dortmund", "country_de", "continent_eu", "comp_bundesliga", 5, 90, "#FDE100", "#000000", "Dortmund"),
    club("club_leipzig", "RB Leipzig", "Leipzig", "country_de", "continent_eu", "comp_bundesliga", 4, 84, "#FFFFFF", "#DD0741", "Leipzig"),
    club("club_leverkusen", "Bayer 04 Leverkusen", "Leverkusen", "country_de", "continent_eu", "comp_bundesliga", 4, 86, "#E32221", "#000000", "Leverkusen"),
    club("club_frankfurt", "Eintracht Frankfurt", "Frankfurt", "country_de", "continent_eu", "comp_bundesliga", 3, 78, "#E1000F", "#000000", "Fráncfort"),
    club("club_wolfsburg", "VfL Wolfsburg", "Wolfsburg", "country_de", "continent_eu", "comp_bundesliga", 3, 74, "#65B32E", "#FFFFFF", "Wolfsburgo"),
    club("club_psg", "Paris Saint-Germain FC", "PSG", "country_fr", "continent_eu", "comp_ligue1", 5, 94, "#004170", "#DA291C", "París"),
    club("club_marseille", "Olympique de Marseille", "Marsella", "country_fr", "continent_eu", "comp_ligue1", 4, 82, "#00A0E3", "#FFFFFF", "Marsella"),
    club("club_lyon", "Olympique Lyonnais", "Lyon", "country_fr", "continent_eu", "comp_ligue1", 3, 80, "#003366", "#FFFFFF", "Lyon"),
    club("club_monaco", "AS Monaco FC", "Monaco", "country_fr", "continent_eu", "comp_ligue1", 4, 82, "#E30613", "#FFFFFF", "Mónaco"),
    club("club_lille", "LOSC Lille", "Lille", "country_fr", "continent_eu", "comp_ligue1", 3, 78, "#E00E0F", "#FFFFFF", "Lille"),
    club("club_nice", "OGC Nice", "Nice", "country_fr", "continent_eu", "comp_ligue1", 3, 74, "#E30613", "#000000", "Niza"),
    club("club_benfica", "SL Benfica", "Benfica", "country_pt", "continent_eu", "comp_liga_portugal", 4, 88, "#E30613", "#FFFFFF", "Lisboa"),
    club("club_porto", "FC Porto", "Porto", "country_pt", "continent_eu", "comp_liga_portugal", 4, 88, "#003893", "#FFFFFF", "Oporto"),
    club("club_sporting", "Sporting Clube de Portugal", "Sporting", "country_pt", "continent_eu", "comp_liga_portugal", 4, 86, "#008057", "#FFFFFF", "Lisboa"),
    club("club_ajax", "AFC Ajax", "Ajax", "country_nl", "continent_eu", "comp_eredivisie", 4, 86, "#D2122E", "#FFFFFF", "Ámsterdam"),
    club("club_psv", "PSV Eindhoven", "PSV", "country_nl", "continent_eu", "comp_eredivisie", 4, 84, "#E30613", "#FFFFFF", "Eindhoven"),
    club("club_feyenoord", "Feyenoord Rotterdam", "Feyenoord", "country_nl", "continent_eu", "comp_eredivisie", 4, 82, "#E30713", "#FFFFFF", "Róterdam"),
    club("club_anderlecht", "RSC Anderlecht", "Anderlecht", "country_be", "continent_eu", "comp_belgian", 3, 76, "#FFFFFF", "#5A2D81", "Bruselas"),
    club("club_club_brugge", "Club Brugge KV", "Club Brugge", "country_be", "continent_eu", "comp_belgian", 3, 78, "#0070AD", "#000000", "Brujas"),
    club("club_celtic", "Celtic FC", "Celtic", "country_sco", "continent_eu", "comp_scottish", 3, 80, "#018749", "#FFFFFF", "Glasgow"),
    club("club_rangers", "Rangers FC", "Rangers", "country_sco", "continent_eu", "comp_scottish", 3, 80, "#1B4BA0", "#FFFFFF", "Glasgow"),
    club("club_galatasaray", "Galatasaray SK", "Galatasaray", "country_tr", "continent_eu", "comp_superlig", 3, 82, "#FDB912", "#A90432", "Estambul"),
    club("club_fenerbahce", "Fenerbahçe SK", "Fenerbahçe", "country_tr", "continent_eu", "comp_superlig", 3, 82, "#FFFF00", "#00205B", "Estambul"),
    club("club_besiktas", "Beşiktaş JK", "Beşiktaş", "country_tr", "continent_eu", "comp_superlig", 3, 78, "#000000", "#FFFFFF", "Estambul"),
    club("club_olympiacos", "Olympiacos FC", "Olympiacos", "country_gr", "continent_eu", "comp_superleague_gr", 3, 76, "#E30613", "#FFFFFF", "El Pireo"),
    club("club_paok", "PAOK FC", "PAOK", "country_gr", "continent_eu", "comp_superleague_gr", 2, 72, "#000000", "#FFFFFF", "Salónica"),
    club("club_al_hilal", "Al Hilal SFC", "Al Hilal", "country_sa", "continent_as", "comp_saudi_pro", 4, 86, "#0033A0", "#FFFFFF", "Riad"),
    club("club_al_nassr", "Al Nassr FC", "Al Nassr", "country_sa", "continent_as", "comp_saudi_pro", 4, 84, "#FFFF00", "#0033A0", "Riad"),
    club("club_al_ittihad", "Al Ittihad Club", "Al Ittihad", "country_sa", "continent_as", "comp_saudi_pro", 3, 80, "#000000", "#F5D300", "Yeda"),
    club("club_al_ahli_sa", "Al Ahli Saudi FC", "Al Ahli", "country_sa", "continent_as", "comp_saudi_pro", 3, 78, "#006633", "#FFFFFF", "Yeda"),
    club("club_al_sadd", "Al Sadd SC", "Al Sadd", "country_qa", "continent_as", "comp_afc_cl", 3, 74, "#FFFFFF", "#000000", "Doha", True),
    club("club_al_ain", "Al Ain FC", "Al Ain", "country_ae", "continent_as", "comp_afc_cl", 3, 72, "#FFFFFF", "#8B0000", "Al Ain", True),
    club("club_urawa", "Urawa Red Diamonds", "Urawa", "country_jp", "continent_as", "comp_jleague", 3, 74, "#E30613", "#FFFFFF", "Saitama"),
    club("club_kashima", "Kashima Antlers", "Kashima", "country_jp", "continent_as", "comp_jleague", 3, 72, "#A32035", "#FFFFFF", "Kashima"),
    club("club_yokohama", "Yokohama F. Marinos", "Marinos", "country_jp", "continent_as", "comp_jleague", 3, 72, "#0033A0", "#FFFFFF", "Yokohama"),
    club("club_vissel_kobe", "Vissel Kobe", "Vissel", "country_jp", "continent_as", "comp_jleague", 2, 70, "#8B0000", "#FFFFFF", "Kobe"),
    club("club_ulsan", "Ulsan HD FC", "Ulsan", "country_kr", "continent_as", "comp_kleague", 3, 72, "#0033A0", "#E30613", "Ulsan"),
    club("club_jeonbuk", "Jeonbuk Hyundai Motors FC", "Jeonbuk", "country_kr", "continent_as", "comp_kleague", 3, 72, "#006633", "#FFFFFF", "Jeonju"),
    club("club_melbourne_city", "Melbourne City FC", "Melbourne City", "country_au", "continent_oc", "comp_aleague", 2, 64, "#6CABDD", "#FFFFFF", "Melbourne"),
    club("club_sydney_fc", "Sydney FC", "Sydney FC", "country_au", "continent_oc", "comp_aleague", 2, 66, "#0033A0", "#FFFFFF", "Sídney"),
    club("club_al_ahly", "Al Ahly SC", "Al Ahly", "country_eg", "continent_af", "comp_egyptian", 3, 84, "#E30613", "#FFFFFF", "El Cairo"),
    club("club_zamalek", "Zamalek SC", "Zamalek", "country_eg", "continent_af", "comp_egyptian", 3, 78, "#FFFFFF", "#E30613", "El Cairo"),
    club("club_wydad", "Wydad Athletic Club", "Wydad", "country_ma", "continent_af", "comp_botola", 3, 76, "#E30613", "#FFFFFF", "Casablanca"),
    club("club_raja", "Raja Club Athletic", "Raja", "country_ma", "continent_af", "comp_botola", 3, 74, "#006633", "#FFFFFF", "Casablanca"),
    club("club_esperance", "Espérance Sportive de Tunis", "Espérance", "country_tn", "continent_af", "comp_botola", 3, 74, "#F5D300", "#E30613", "Túnez", True),
    club("club_mamelodi", "Mamelodi Sundowns FC", "Sundowns", "country_za", "continent_af", "comp_south_african", 3, 76, "#F5D300", "#0033A0", "Pretoria"),
    club("club_tp_mazembe", "TP Mazembe", "Mazembe", "country_cd", "continent_af", "comp_caf_cl", 3, 74, "#000000", "#FFFFFF", "Lubumbashi", True),
    club("club_salzburg", "FC Red Bull Salzburg", "Salzburg", "country_at", "continent_eu", "comp_uecl", 3, 78, "#FFFFFF", "#E30613", "Salzburgo", True),
    club("club_shakhtar", "FC Shakhtar Donetsk", "Shakhtar", "country_ua", "continent_eu", "comp_uel", 3, 78, "#FF6600", "#000000", "Donetsk", True),
    club("club_dynamo_kyiv", "FC Dynamo Kyiv", "Dynamo Kyiv", "country_ua", "continent_eu", "comp_uel", 3, 76, "#FFFFFF", "#0033A0", "Kyiv"),
    club("club_red_star", "FK Crvena zvezda", "Estrella Roja", "country_rs", "continent_eu", "comp_uel", 3, 76, "#E30613", "#FFFFFF", "Belgrado"),
    club("club_partizan", "FK Partizan", "Partizan", "country_rs", "continent_eu", "comp_uecl", 2, 72, "#000000", "#FFFFFF", "Belgrado"),
    club("club_dinamo_zagreb", "GNK Dinamo Zagreb", "Dinamo Zagreb", "country_hr", "continent_eu", "comp_uel", 3, 76, "#0033A0", "#FFFFFF", "Zagreb"),
    club("club_basel", "FC Basel 1893", "Basel", "country_ch", "continent_eu", "comp_uecl", 2, 72, "#E30613", "#0033A0", "Basilea"),
    club("club_young_boys", "BSC Young Boys", "Young Boys", "country_ch", "continent_eu", "comp_uel", 3, 74, "#F5D300", "#000000", "Berna"),
    club("club_copenhagen", "FC København", "Copenhague", "country_dk", "continent_eu", "comp_uel", 3, 74, "#FFFFFF", "#0033A0", "Copenhague"),
    club("club_brondby", "Brøndby IF", "Brøndby", "country_dk", "continent_eu", "comp_uecl", 2, 68, "#F5D300", "#0033A0", "Brøndby"),
    club("club_legia", "Legia Warszawa", "Legia", "country_pl", "continent_eu", "comp_uecl", 2, 70, "#006633", "#FFFFFF", "Varsovia"),
    club("club_sparta_prague", "AC Sparta Praha", "Sparta Praga", "country_cz", "continent_eu", "comp_uel", 3, 72, "#E30613", "#FFFFFF", "Praga"),
    club("club_slavia_prague", "SK Slavia Praha", "Slavia Praga", "country_cz", "continent_eu", "comp_uel", 3, 72, "#E30613", "#FFFFFF", "Praga"),
    club("club_ferencvaros", "Ferencvárosi TC", "Ferencváros", "country_hu", "continent_eu", "comp_uecl", 2, 70, "#006633", "#FFFFFF", "Budapest"),
]


def mk_comp(cid, name, short, ctype, continent, country, level, prestige, matches, incomplete=False):
    row = {
        "id": cid,
        "name": name,
        "shortName": short,
        "type": ctype,
        "continentId": continent,
        "countryId": country,
        "level": level,
        "prestige": prestige,
        "seasonMatchesTypical": matches,
    }
    if incomplete:
        row["incomplete"] = True
    return row


COMPETITIONS = [
    mk_comp("comp_world_cup", "Copa del Mundo FIFA", "Mundial", "international", None, None, 5, 100, 7),
    mk_comp("comp_copa_america", "Copa América", "Copa América", "international", "continent_sa", None, 4, 88, 6),
    mk_comp("comp_euro", "Eurocopa", "Euro", "international", "continent_eu", None, 4, 90, 6),
    mk_comp("comp_afcon", "Copa África", "AFCON", "international", "continent_af", None, 3, 78, 6),
    mk_comp("comp_asian_cup", "Copa Asiática", "Asian Cup", "international", "continent_as", None, 3, 74, 6),
    mk_comp("comp_gold_cup", "Copa de Oro", "Gold Cup", "international", "continent_na", None, 3, 72, 6),
    mk_comp("comp_nations_league", "UEFA Nations League", "Nations League", "international", "continent_eu", None, 3, 70, 6),
    mk_comp("comp_ucl", "UEFA Champions League", "Champions", "continental", "continent_eu", None, 5, 98, 13),
    mk_comp("comp_uel", "UEFA Europa League", "Europa League", "continental", "continent_eu", None, 4, 82, 12),
    mk_comp("comp_uecl", "UEFA Conference League", "Conference", "continental", "continent_eu", None, 3, 68, 12),
    mk_comp("comp_libertadores", "Copa Libertadores", "Libertadores", "continental", "continent_sa", None, 5, 92, 13),
    mk_comp("comp_sudamericana", "Copa Sudamericana", "Sudamericana", "continental", "continent_sa", None, 4, 78, 12),
    mk_comp("comp_concacaf_cl", "CONCACAF Champions Cup", "Concacaf CL", "continental", "continent_na", None, 3, 70, 8),
    mk_comp("comp_caf_cl", "CAF Champions League", "CAF CL", "continental", "continent_af", None, 3, 72, 10),
    mk_comp("comp_afc_cl", "AFC Champions League Elite", "AFC CL", "continental", "continent_as", None, 3, 74, 10),
    mk_comp("comp_club_world_cup", "Mundial de Clubes FIFA", "Mundial Clubes", "continental", None, None, 4, 85, 5),
    mk_comp("comp_premier", "Premier League", "Premier", "league", "continent_eu", "country_eng", 5, 96, 38),
    mk_comp("comp_laliga", "LaLiga", "LaLiga", "league", "continent_eu", "country_es", 5, 94, 38),
    mk_comp("comp_serie_a", "Serie A", "Serie A", "league", "continent_eu", "country_it", 5, 90, 38),
    mk_comp("comp_bundesliga", "Bundesliga", "Bundesliga", "league", "continent_eu", "country_de", 5, 90, 34),
    mk_comp("comp_ligue1", "Ligue 1", "Ligue 1", "league", "continent_eu", "country_fr", 4, 86, 34),
    mk_comp("comp_eredivisie", "Eredivisie", "Eredivisie", "league", "continent_eu", "country_nl", 4, 80, 34),
    mk_comp("comp_liga_portugal", "Liga Portugal", "Liga Portugal", "league", "continent_eu", "country_pt", 4, 82, 34),
    mk_comp("comp_belgian", "Jupiler Pro League", "Pro League", "league", "continent_eu", "country_be", 3, 74, 30),
    mk_comp("comp_scottish", "Scottish Premiership", "Scottish Prem", "league", "continent_eu", "country_sco", 3, 72, 38),
    mk_comp("comp_superlig", "Süper Lig", "Süper Lig", "league", "continent_eu", "country_tr", 3, 74, 36),
    mk_comp("comp_superleague_gr", "Super League Grecia", "Super League GR", "league", "continent_eu", "country_gr", 3, 70, 30),
    mk_comp("comp_liga_profesional_ar", "Liga Profesional Argentina", "Liga Profesional", "league", "continent_sa", "country_ar", 4, 80, 27),
    mk_comp("comp_brasileirao", "Brasileirão", "Brasileirão", "league", "continent_sa", "country_br", 4, 84, 38),
    mk_comp("comp_liga_mx", "Liga MX", "Liga MX", "league", "continent_na", "country_mx", 3, 76, 17),
    mk_comp("comp_mls", "Major League Soccer", "MLS", "league", "continent_na", "country_us", 3, 72, 34),
    mk_comp("comp_primera_uy", "Primera División Uruguay", "Primera UY", "league", "continent_sa", "country_uy", 3, 70, 30),
    mk_comp("comp_primera_cl", "Campeonato Nacional Chile", "Primera CL", "league", "continent_sa", "country_cl", 3, 68, 30),
    mk_comp("comp_dimayor", "Liga BetPlay Dimayor", "Liga BetPlay", "league", "continent_sa", "country_co", 3, 70, 40),
    mk_comp("comp_liga1_pe", "Liga 1 Perú", "Liga 1", "league", "continent_sa", "country_pe", 2, 62, 34, True),
    mk_comp("comp_primera_py", "Primera División Paraguay", "Primera PY", "league", "continent_sa", "country_py", 2, 64, 44, True),
    mk_comp("comp_ligapro_ec", "LigaPro Ecuador", "LigaPro", "league", "continent_sa", "country_ec", 2, 64, 30, True),
    mk_comp("comp_jleague", "J1 League", "J1", "league", "continent_as", "country_jp", 3, 72, 38),
    mk_comp("comp_kleague", "K League 1", "K League", "league", "continent_as", "country_kr", 3, 70, 38),
    mk_comp("comp_saudi_pro", "Saudi Pro League", "Saudi PL", "league", "continent_as", "country_sa", 3, 76, 34),
    mk_comp("comp_aleague", "A-League Men", "A-League", "league", "continent_oc", "country_au", 2, 64, 26),
    mk_comp("comp_botola", "Botola Pro", "Botola", "league", "continent_af", "country_ma", 2, 66, 30, True),
    mk_comp("comp_egyptian", "Egyptian Premier League", "Egyptian PL", "league", "continent_af", "country_eg", 2, 68, 34, True),
    mk_comp("comp_south_african", "Premiership sudafricana", "Prem SA", "league", "continent_af", "country_za", 2, 64, 30, True),
    mk_comp("comp_costa_rica", "Liga Promerica", "Liga CR", "league", "continent_ca", "country_cr", 2, 58, 44, True),
    mk_comp("comp_fa_cup", "FA Cup", "FA Cup", "cup", "continent_eu", "country_eng", 4, 84, 6),
    mk_comp("comp_copa_del_rey", "Copa del Rey", "Copa del Rey", "cup", "continent_eu", "country_es", 4, 82, 6),
    mk_comp("comp_coppa_italia", "Coppa Italia", "Coppa Italia", "cup", "continent_eu", "country_it", 3, 76, 5),
    mk_comp("comp_dfb_pokal", "DFB-Pokal", "DFB-Pokal", "cup", "continent_eu", "country_de", 3, 78, 5),
    mk_comp("comp_coupe_de_france", "Coupe de France", "Coupe de France", "cup", "continent_eu", "country_fr", 3, 74, 5),
    mk_comp("comp_copa_argentina", "Copa Argentina", "Copa Argentina", "cup", "continent_sa", "country_ar", 3, 70, 6),
    mk_comp("comp_copa_do_brasil", "Copa do Brasil", "Copa do Brasil", "cup", "continent_sa", "country_br", 3, 74, 8),
]

ARCHETYPES = [
    {
        "id": "arch_tech_promise",
        "name": "Promesa técnica",
        "description": "Toque fino y lectura de juego. Crece más con minutos y buen entorno.",
        "modifiers": {"ratingBias": 1, "potentialBias": 3, "popularityBias": 0, "reputationBias": 1, "injuryRiskBias": 0, "goalBias": 0.05, "assistBias": 0.12},
    },
    {
        "id": "arch_physical",
        "name": "Tanque físico",
        "description": "Potencia y resistencia. Aguanta más minutos, menos magia con la pelota.",
        "modifiers": {"ratingBias": 2, "potentialBias": 1, "popularityBias": -1, "reputationBias": 0, "injuryRiskBias": 0.02, "goalBias": 0.08, "assistBias": -0.05},
    },
    {
        "id": "arch_tactical",
        "name": "Cerebro táctico",
        "description": "Orden y liderazgo silencioso. Mejor relación con DT y crecimiento estable.",
        "modifiers": {"ratingBias": 1, "potentialBias": 2, "popularityBias": -2, "reputationBias": 3, "injuryRiskBias": -0.01, "goalBias": -0.05, "assistBias": 0.1},
    },
    {
        "id": "arch_media_star",
        "name": "Crack mediático",
        "description": "Presencia y marketing. Sube popularidad y valor, más presión y ruido.",
        "modifiers": {"ratingBias": 0, "potentialBias": 2, "popularityBias": 8, "reputationBias": -1, "injuryRiskBias": 0, "goalBias": 0.1, "assistBias": 0.05},
    },
]

DECISIONS = [
    {
        "id": "dec_transfer",
        "type": "transferencia",
        "title": "Ofertas de transferencia",
        "prompt": "Llegaron propuestas. ¿Qué hacés?",
        "tags": ["transfer", "market"],
        "options": [
            {"id": "accept_best_prestige", "label": "Ir al club de más prestigio", "summary": "Escaparate grande, pelear minutos", "effects": {"prestigeDelta": 6, "popularityDelta": 4, "minutesBias": -0.15, "moneyDelta": 800000, "clubRelationDelta": -8, "transferPreference": "prestige"}},
            {"id": "accept_minutes", "label": "Elegir el club que garantiza titularidad", "summary": "Más PJ, menos glamour", "effects": {"prestigeDelta": -2, "minutesBias": 0.2, "reputationDelta": 2, "moneyDelta": 200000, "transferPreference": "minutes"}},
            {"id": "stay_loyal", "label": "Quedarte y renovar el vínculo", "summary": "Lealtad, menos salto inmediato", "effects": {"clubRelationDelta": 10, "reputationDelta": 3, "popularityDelta": 1, "moneyDelta": 150000, "transferPreference": "stay"}},
        ],
    },
    {
        "id": "dec_renewal",
        "type": "renovacion",
        "title": "Renovación de contrato",
        "prompt": "El club pone un papel sobre la mesa.",
        "tags": ["contract"],
        "options": [
            {"id": "money_short", "label": "Cobrar más ahora (contrato corto)", "summary": "+plata, menos estabilidad", "effects": {"moneyDelta": 1200000, "clubRelationDelta": 2, "reputationDelta": -1, "transferBias": 0.1}},
            {"id": "years_role", "label": "Años y rol claro, salario contenido", "summary": "Titularidad y calma", "effects": {"moneyDelta": 300000, "minutesBias": 0.12, "clubRelationDelta": 8, "moraleDelta": 5}},
            {"id": "refuse", "label": "No renovar y esperar el mercado", "summary": "Libertad futura, roce presente", "effects": {"clubRelationDelta": -12, "reputationDelta": -2, "popularityDelta": 3, "transferBias": 0.2}},
        ],
    },
    {
        "id": "dec_training",
        "type": "entrenamiento",
        "title": "Plan de entrenamiento",
        "prompt": "¿En qué metés el foco esta temporada?",
        "tags": ["training", "growth"],
        "options": [
            {"id": "tech", "label": "Trabajo técnico extra", "summary": "+rating potencial suave, algo de fatiga", "effects": {"ratingDelta": 1, "potentialDelta": 1, "fitnessDelta": -4, "injuryRiskDelta": 0.01}},
            {"id": "phys", "label": "Carga física fuerte", "summary": "+fitness y minutos, riesgo muscular", "effects": {"fitnessDelta": 8, "minutesBias": 0.08, "injuryRiskDelta": 0.03, "moraleDelta": -2}},
            {"id": "mental", "label": "Trabajo mental y video", "summary": "+reputación y forma estable", "effects": {"reputationDelta": 3, "formDelta": 1, "moraleDelta": 4, "fitnessDelta": -1}},
        ],
    },
    {
        "id": "dec_role",
        "type": "rol",
        "title": "Definición de rol",
        "prompt": "El DT te llama para hablar de tu lugar en el equipo.",
        "tags": ["role", "minutes"],
        "options": [
            {"id": "starter_mid", "label": "Pedir titularidad aunque el club sea menor", "summary": "Minutos ya, prestigio después", "effects": {"minutesBias": 0.18, "prestigeDelta": -3, "clubRelationDelta": 2, "transferPreference": "minutes"}},
            {"id": "bench_big", "label": "Aceptar rotación en club grande", "summary": "Escaparate, menos PJ", "effects": {"minutesBias": -0.12, "prestigeDelta": 5, "popularityDelta": 4, "transferPreference": "prestige"}},
            {"id": "trust_coach", "label": "Confiar en el proceso del DT", "summary": "Relación alta, resultado mixto", "effects": {"clubRelationDelta": 12, "moraleDelta": 3, "minutesBias": 0.05}},
        ],
    },
    {
        "id": "dec_national",
        "type": "seleccion",
        "title": "Convocatoria de selección",
        "prompt": "La selección te tiene en el radar.",
        "tags": ["national", "caps"],
        "options": [
            {"id": "accept_call", "label": "Ir sí o sí", "summary": "+caps, fatiga de viajes", "effects": {"nationalCallBias": 0.35, "popularityDelta": 5, "fitnessDelta": -6, "clubRelationDelta": -2}},
            {"id": "protect_body", "label": "Cuidar el cuerpo y priorizar club", "summary": "Menos riesgo, menos exposición", "effects": {"nationalCallBias": -0.2, "fitnessDelta": 5, "clubRelationDelta": 4, "popularityDelta": -3}},
            {"id": "negotiate", "label": "Negociar minutos y calendario", "summary": "Equilibrio político", "effects": {"nationalCallBias": 0.1, "reputationDelta": 2, "moraleDelta": 2, "clubRelationDelta": 1}},
        ],
    },
    {
        "id": "dec_press",
        "type": "prensa",
        "title": "Rueda de prensa caliente",
        "prompt": "Te preguntan por el DT y el vestuario.",
        "tags": ["press", "reputation"],
        "options": [
            {"id": "diplomatic", "label": "Respuesta diplomática", "summary": "Poco ruido", "effects": {"reputationDelta": 2, "popularityDelta": 1, "clubRelationDelta": 3}},
            {"id": "honest_fire", "label": "Hablar con fuego", "summary": "+show, posible roce", "effects": {"popularityDelta": 7, "reputationDelta": -4, "clubRelationDelta": -6, "moraleDelta": 2}},
            {"id": "silence", "label": "Cortar y no hablar", "summary": "Frío mediático", "effects": {"popularityDelta": -2, "reputationDelta": 1, "clubRelationDelta": 1}},
        ],
    },
    {
        "id": "dec_sponsor",
        "type": "patrocinio",
        "title": "Oferta de patrocinio",
        "prompt": "Una marca quiere tu cara en la campaña.",
        "tags": ["sponsor", "money"],
        "options": [
            {"id": "global_brand", "label": "Marca global (más plata, más exposición)", "summary": "+money +popularity", "effects": {"moneyDelta": 2000000, "popularityDelta": 8, "reputationDelta": -1}},
            {"id": "local_brand", "label": "Marca local alineada al club", "summary": "Menos plata, mejor clima", "effects": {"moneyDelta": 500000, "popularityDelta": 3, "clubRelationDelta": 5, "reputationDelta": 2}},
            {"id": "reject", "label": "Rechazar y cuidar imagen", "summary": "Menos ruido comercial", "effects": {"moneyDelta": 0, "reputationDelta": 3, "popularityDelta": -1, "moraleDelta": 1}},
        ],
    },
    {
        "id": "dec_injury",
        "type": "lesion",
        "title": "Molestia muscular",
        "prompt": "El cuerpo pide freno. El calendario no.",
        "tags": ["injury", "fitness"],
        "options": [
            {"id": "rush_back", "label": "Volver rápido", "summary": "Más PJ, más riesgo", "effects": {"fitnessDelta": -10, "minutesBias": 0.1, "injuryRiskDelta": 0.08, "clubRelationDelta": 4}},
            {"id": "full_recovery", "label": "Recuperación completa", "summary": "Pierde ritmo, cuida carrera", "effects": {"fitnessDelta": 12, "minutesBias": -0.2, "injuryRiskDelta": -0.05, "moraleDelta": -3}},
            {"id": "managed", "label": "Minutos controlados", "summary": "Equilibrio", "effects": {"fitnessDelta": 4, "minutesBias": -0.05, "injuryRiskDelta": -0.02, "clubRelationDelta": 2}},
        ],
    },
]

EVENTS = [
    {"id": "ev_injury_minor", "category": "lesion", "title": "Contractura a destiempo", "body": "Una molestia te saca del once por algunas semanas.", "weightBase": 10, "cooldownSeasons": 2, "tags": ["injury"], "conditions": {"minAge": 17}, "effects": {"fitnessDelta": -12, "injuryWeeks": 3, "minutesBias": -0.15, "moraleDelta": -4}},
    {"id": "ev_injury_major", "category": "lesion", "title": "Lesión seria", "body": "El scanner confirma lo peor: temporada complicada.", "weightBase": 4, "cooldownSeasons": 4, "tags": ["injury", "major"], "conditions": {"minAge": 18}, "effects": {"fitnessDelta": -25, "injuryWeeks": 12, "minutesBias": -0.45, "moraleDelta": -10, "ratingDelta": -1}},
    {"id": "ev_national_call", "category": "seleccion", "title": "Primera del boletín", "body": "El DT de la selección te convoca.", "weightBase": 8, "cooldownSeasons": 2, "tags": ["national"], "conditions": {"minRating": 72, "minForm": 3}, "effects": {"nationalCapsDelta": 2, "popularityDelta": 5, "prestigeDelta": 2, "fitnessDelta": -3}},
    {"id": "ev_coach_conflict", "category": "entrenador", "title": "Roce con el entrenador", "body": "El vestuario se entera de una discusión en el despacho.", "weightBase": 7, "cooldownSeasons": 2, "tags": ["coach", "relation"], "conditions": {"minAge": 19}, "effects": {"clubRelationDelta": -14, "moraleDelta": -6, "minutesBias": -0.1, "reputationDelta": -2}},
    {"id": "ev_scoring_streak", "category": "racha_goleadora", "title": "Racha de gol", "body": "Las redes se llenan cada domingo.", "weightBase": 6, "cooldownSeasons": 3, "tags": ["form", "goals"], "conditions": {"positions": ["FWD", "MID"], "minRating": 70}, "effects": {"formDelta": 2, "popularityDelta": 6, "goalsBonus": 4, "moraleDelta": 5}},
    {"id": "ev_press_storm", "category": "prensa", "title": "Tormenta mediática", "body": "Un titular exagerado prende fuego la semana.", "weightBase": 7, "cooldownSeasons": 2, "tags": ["press"], "conditions": {"minPopularity": 40}, "effects": {"popularityDelta": 3, "reputationDelta": -5, "moraleDelta": -4}},
    {"id": "ev_sponsor_boost", "category": "patrocinio", "title": "Campaña que pega", "body": "El comercial sale bien y suena el teléfono.", "weightBase": 5, "cooldownSeasons": 3, "tags": ["sponsor", "money"], "conditions": {"minPopularity": 45}, "effects": {"moneyDelta": 900000, "popularityDelta": 4}},
    {"id": "ev_clasico_hero", "category": "clasico", "title": "Héroe del clásico", "body": "En el partido del año, tu nombre queda en la foto.", "weightBase": 5, "cooldownSeasons": 3, "tags": ["clasico", "prestige"], "conditions": {"minMinutesBias": -1, "minRating": 68}, "effects": {"prestigeDelta": 4, "popularityDelta": 7, "clubRelationDelta": 6, "moraleDelta": 6}},
    {"id": "ev_foreign_interest", "category": "interes_extranjero", "title": "Interés del exterior", "body": "Un intermediario deja un mensaje: hay ojos puestos en vos.", "weightBase": 8, "cooldownSeasons": 2, "tags": ["transfer", "foreign"], "conditions": {"minRating": 74, "minAge": 18, "maxAge": 32}, "effects": {"transferBias": 0.25, "popularityDelta": 3, "marketValueFactor": 1.08}},
    {"id": "ev_bad_form", "category": "mala_forma", "title": "Bajón de rendimiento", "body": "Los controles salen flojos y la hinchada silba.", "weightBase": 8, "cooldownSeasons": 2, "tags": ["form"], "conditions": {"minAge": 17}, "effects": {"formDelta": -2, "moraleDelta": -7, "popularityDelta": -3, "minutesBias": -0.08}},
    {"id": "ev_historic_season", "category": "temporada_historica", "title": "Temporada para el museo", "body": "Números de leyenda y noches inolvidables.", "weightBase": 2, "cooldownSeasons": 6, "tags": ["historic", "peak"], "conditions": {"minRating": 84, "minForm": 4}, "effects": {"prestigeDelta": 8, "popularityDelta": 10, "ratingDelta": 1, "trophyChanceBonus": 0.2, "moraleDelta": 8}},
    {"id": "ev_unexpected_chance", "category": "oportunidad_inesperada", "title": "Oportunidad inesperada", "body": "Una baja en el once te abre la puerta.", "weightBase": 7, "cooldownSeasons": 2, "tags": ["opportunity", "minutes"], "conditions": {"minAge": 17, "maxAge": 29}, "effects": {"minutesBias": 0.16, "formDelta": 1, "clubRelationDelta": 3}},
    {"id": "ev_contract_conflict", "category": "conflicto_contractual", "title": "Conflicto contractual", "body": "La negociación se traba y el clima se enfría.", "weightBase": 6, "cooldownSeasons": 3, "tags": ["contract", "relation"], "conditions": {"minAge": 20, "minReputation": 30}, "effects": {"clubRelationDelta": -10, "moraleDelta": -5, "transferBias": 0.15, "moneyDelta": -100000}},
]

RETIREMENT_LINES = [
    {"id": "ret_legend", "minScore": 9.0, "text": "Colgaste los botines entre ovaciones. El museo ya tiene tu camiseta."},
    {"id": "ret_idol", "minScore": 8.0, "text": "Te retirás como ídolo de una generación que te va a discutir en las mesas por años."},
    {"id": "ret_solid", "minScore": 6.0, "text": "Carrera sólida, respeto ganado y una despedida sin ruido de fracaso."},
    {"id": "ret_irregular", "minScore": 3.5, "text": "Hubo picos y valles. El fútbol te dio capítulos, no una novela perfecta."},
    {"id": "ret_fail", "minScore": 0.0, "text": "La promesa se apagó antes de tiempo. Queda la lección y el orgullo de haberlo intentado."},
]


def main():
    countries = []
    for row in COUNTRY_ROWS:
        countries.append({
            "id": row[0], "name": row[1], "shortName": row[2], "iso2": row[3], "iso3": row[4],
            "continentId": row[5], "nationality": row[6], "flagCode": row[7],
        })

    national_teams = []
    for c in countries:
        rating, prestige = NT_RATINGS.get(c["id"], (65, 60))
        incomplete = c["id"] not in NT_RATINGS
        suffix = c["id"].replace("country_", "")
        nt = {
            "id": "nt_" + suffix,
            "name": c["name"],
            "shortName": c["iso3"],
            "countryId": c["id"],
            "continentId": c["continentId"],
            "flagCode": c["flagCode"],
            "rating": rating,
            "prestige": prestige,
            "incomplete": incomplete,
        }
        national_teams.append(nt)

    for nt in national_teams:
        if nt["id"] == "nt_eng":
            nt["shortName"] = "ENG"
            nt["name"] = "Inglaterra"
        elif nt["id"] == "nt_sco":
            nt["shortName"] = "SCO"
            nt["name"] = "Escocia"
        elif nt["id"] == "nt_wal":
            nt["shortName"] = "WAL"
            nt["name"] = "Gales"
        elif nt["id"] == "nt_nir":
            nt["shortName"] = "NIR"
            nt["name"] = "Irlanda del Norte"

    dump("world/continents.json", CONTINENTS)
    dump("world/countries.json", countries)
    dump("world/competitions.json", COMPETITIONS)
    dump("world/national-teams.json", national_teams)
    dump("clubs/clubs_seed.json", CLUBS)
    dump("narrative/archetypes.json", ARCHETYPES)
    dump("narrative/decisions.json", DECISIONS)
    dump("narrative/events.json", EVENTS)
    dump("narrative/retirement_lines.json", RETIREMENT_LINES)
    dump("manifests/packs.json", {
        "version": 1,
        "packs": [
            {"id": "world_core", "path": "world", "priority": 1},
            {"id": "clubs_seed", "path": "clubs/clubs_seed.json", "priority": 1, "count": len(CLUBS)},
            {"id": "narrative_core", "path": "narrative", "priority": 1},
        ],
        "counts": {
            "continents": len(CONTINENTS),
            "countries": len(countries),
            "competitions": len(COMPETITIONS),
            "nationalTeams": len(national_teams),
            "clubs": len(CLUBS),
            "archetypes": len(ARCHETYPES),
            "decisions": len(DECISIONS),
            "events": len(EVENTS),
        },
    })


if __name__ == "__main__":
    main()
