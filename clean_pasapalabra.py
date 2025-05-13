import json
import re
import os
import argparse
from collections import defaultdict

# Regex to find prefixes like "CONTIENE X:" or "Comienza con X:"
# It captures the letter (group 1) and the rest of the question (group 2)
PREFIX_PATTERN = re.compile(r"^(?:CONTIENE|Comienza con)\s+([A-Z]):\s*(.*)", re.IGNORECASE)

def normalize_string(s):
    """Lowercase and remove diacritics for comparison."""
    if not isinstance(s, str): # Handle potential non-string data gracefully
        s = str(s)
    s = s.lower().strip()
    replacements = (
        ("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"),
        ("ä", "a"), ("ë", "e"), ("ï", "i"), ("ö", "o"), ("ü", "u"),
        # Add other common punctuation/chars to remove for similarity check if needed
        # (e.g., removing "?", "¿", "!", ".", ",")
        ("?", ""), ("¿", ""), ("!", ""), ("¡", ""), (".", ""), (",", ""),
    )
    for a, b in replacements:
        s = s.replace(a, b)
    # Remove extra whitespace
    s = re.sub(r'\s+', ' ', s).strip()
    return s

APELLIDOS_COMPUESTOS_CONOCIDOS_NORMALIZADOS = [
    normalize_string("Di Stefano"), normalize_string("Van Dijk"), normalize_string("De Bruyne"),
    normalize_string("De Paul"), normalize_string("Alexander-Arnold"), normalize_string("Van Persie"),
    normalize_string("De Jong"), normalize_string("Van Nistelrooy"), normalize_string("Ter Stegen"),
    normalize_string("Di Maria"), normalize_string("Xabi Alonso"), normalize_string("Carlos Alberto"),
    normalize_string("Van Bommel"), normalize_string("Van Bronckhorst"), normalize_string("De Boer"),
    normalize_string("Van der Sar"), normalize_string("Van der Vaart"), normalize_string("De Rossi"),
    normalize_string("El Shaarawy"), normalize_string("Aubameyang"), # Pierre-Emerick Aubameyang
    normalize_string("Heung min Son"), normalize_string("Trent Alexander-Arnold"),
    normalize_string("Roberto Carlos"), normalize_string("Sir Alex Ferguson"), # Considered as full name
    normalize_string("Diego Armando Maradona"), normalize_string("Lionel Messi"), # Allow if question is generic
    normalize_string("Cristiano Ronaldo"), normalize_string("O Rei Pele"), # Allow if question is generic
    normalize_string("Jose Mourinho"), normalize_string("Carlo Ancelotti"),
    normalize_string("Joao Felix"), normalize_string("Jude Bellingham"),
    normalize_string("Julian Alvarez"), normalize_string("Javier Zanetti"),
    normalize_string("Joshua Kimmich"), normalize_string("John Terry"),
    normalize_string("Jupp Heynckes"), normalize_string("Kylian Mbappe"),
    normalize_string("Kevin De Bruyne"), normalize_string("Luka Modric"),
    normalize_string("Luis Suarez"), normalize_string("Lautaro Martinez"),
    normalize_string("Lisandro Martinez"), normalize_string("Marc Overmars"),
    normalize_string("Mesut Ozil"), normalize_string("NGolo Kante"),
    normalize_string("Nahuel Molina"), normalize_string("Nicolas Tagliafico"),
    normalize_string("Oliver Kahn"), normalize_string("Old Trafford"), # Not a person but for consistency
    normalize_string("Paolo Maldini"), normalize_string("Pepe Reina"),
    normalize_string("Paris Saint-Germain"), # Not a person
    normalize_string("Quique Setien"), normalize_string("Queens Park Rangers"), # Not a person
    normalize_string("Rodrigo De Paul"), normalize_string("Rodrygo Goes"),
    normalize_string("Rio Ferdinand"), normalize_string("Ramon Diaz"),
    normalize_string("Thiago Silva"), normalize_string("Toure Yaya"),
    normalize_string("Thomas Muller"), normalize_string("Ubaldo Fillol"),
    normalize_string("Vinicius Junior"), normalize_string("Wayne Rooney"),
    normalize_string("Xavi Hernandez"), normalize_string("Zinedine Zidane"),
    normalize_string("Zlatan Ibrahimovic")
]

PREPOSICIONES_APELLIDOS = ["de", "di", "van", "el", "la", "los", "las", "do", "dos", "da", "das", "y"]

# --- START: Palabras clave para preguntas genéricas (no estrictas sobre nombre/apellido) ---
PALABRAS_CLAVE_PREGUNTA_GENERICA = [
    "quien es el", "quien fue el", "como se llama el", "futbolista que", "jugador que",
    "tecnico que", "entrenador que", "arbitro que", "autor de", "ganador de", "campeon de",
    "figura de", "leyenda de", "idolo de", "club de", "equipo de", "seleccion de",
    "estadio de", "nombre del estadio", "apodo de", "pais de", "ciudad de",
    "posicion de", "maximo goleador", "bota de oro", "balon de oro"
]
# --- END: Palabras clave --- 

# --- NUEVO: Lista de términos futbolísticos que no son apellidos ---
NO_APELLIDOS = [
    # Clubes
    "real madrid", "barcelona", "atletico", "atletico madrid", "manchester united", "manchester city", 
    "liverpool", "chelsea", "arsenal", "juventus", "milan", "inter", "bayern", "borussia", "psg",
    "paris saint germain", "ajax", "porto", "benfica", "sporting", "river plate", "boca juniors", 
    "flamengo", "fc", "united", "city", "albion", "wanderers", "rovers", "atletico", "racing",
    "dynamo", "dinamo", "lokomotiv", "zenit", "shakhtar", "galatasaray", "fenerbahce", "besiktas", 
    "olympiakos", "celtic", "rangers", "anderlecht", "brugge", "copenhagen", "malmo", "rosario",
    "estudiantes", "racing", "independiente", "huracan", "velez", "newells", "gimnasia",
    "godoy cruz", "union", "colon", "talleres", "banfield", "lanus", "argentinos", "patronato",
    "platense", "tigre", "defensa", "sarmiento", "arsenal", "belgrano", "instituto", 
    "sevilla", "valencia", "villarreal", "athletic", "betis", "sociedad", "getafe", "celta", "vigo",
    "mallorca", "valladolid", "espanyol", "deportivo", "alaves", "osasuna", "girona", "leganes", "cadiz", 
    "rayo", "vallecano", "levante", "eibar", "zaragoza", "almeria", "malaga", "sporting", "gijon",
    "corinthians", "palmeiras", "santos", "sao paulo", "gremio", "cruzeiro", "internacional", "vasco",
    "botafogo", "fluminense", "atletico mineiro", "colo colo", "universidad",
    
    # Estadios
    "santiago bernabeu", "camp nou", "wanda metropolitano", "old trafford", "anfield", "stamford bridge", 
    "emirates", "etihad", "san siro", "juventus stadium", "allianz arena", "signal iduna", 
    "parc des princes", "johan cruyff", "la bombonera", "monumental", "maracana",
    "stadium", "arena", "estadio", "park", "field", "coliseum", "court", "ground",
    
    # Términos de fútbol
    "offside", "penalty", "corner", "throw in", "free kick", "goal kick", "goalkeeper", "defender", 
    "midfielder", "striker", "forward", "manager", "coach", "referee", "linesman", "var", "goal", 
    "assist", "tackle", "pass", "shot", "save", "clearance", "dribble", "headed", "volley", 
    "fuera de juego", "penalti", "penal", "penalty", "tiro libre", "saque", "arquero", "portero", 
    "defensor", "mediocampista", "delantero", "arbitro", "juez", "linea", "gol", "asistencia", 
    "entrada", "pase", "disparo", "atajada", "despeje", "regate", "cabezazo", "volea",
    
    # Países y ciudades
    "alemania", "argentina", "brasil", "espana", "francia", "inglaterra", "italia", "portugal", 
    "holanda", "belgica", "croacia", "uruguay", "colombia", "mexico", "japon", "corea", 
    "estados unidos", "canada", "australia", "rusia", "ucrania", "suiza", "austria", 
    "dinamarca", "suecia", "noruega", "finlandia", "islandia", "escocia", "gales", "irlanda", 
    "polonia", "republica checa", "hungria", "rumania", "bulgaria", "serbia", "grecia", "turquia", 
    "marruecos", "egipto", "senegal", "camerun", "nigeria", "ghana", "costa de marfil", "argelia", 
    "sudafrica", "china", "qatar", "arabia saudita", "iran", "irak", "emiratos", "australia", 
    "nueva zelanda",
    
    # Competiciones
    "mundial", "champions", "europa league", "copa libertadores", "copa sudamericana", "copa america", 
    "eurocopa", "premier league", "la liga", "serie a", "bundesliga", "ligue 1", "eredivisie", 
    "primeira liga", "superliga", "copa", "league", "championship", "copa del rey", "fa cup", 
    "carabao cup", "dfb pokal", "copa italia", "copa",
    
    # Misceláneos
    "balon de oro", "bota de oro", "fifa", "uefa", "conmebol", "concacaf", "afc", "caf", "ofc", 
    "var", "fair play", "hat trick", "seleccion", "nacional", "liga", "division", "campeonato", 
    "torneo", "clasificacion", "eliminatoria", "amistoso", "sub-", "sub17", "sub20", "sub21", "sub23", 
    "femenino", "masculino", "tecnico", "dt", "director tecnico", "federacion", "asociacion"
]
# --- FIN NUEVO ---

def merge_and_deduplicate(input_filenames, output_filename, report_filename="data/name_mismatch_report.txt"):
    """
    Merges questions from multiple JSON files into a single file,
    removing duplicates and logging potential name/surname mismatches.
    """
    print(f"Starting merge and deduplication process...")
    print(f"Input files: {input_filenames}")
    print(f"Output file: {output_filename}")

    merged_questions_by_letter = defaultdict(list)
    seen_normalized_tuples = set()
    total_questions_processed = 0
    duplicates_found = 0
    potential_mismatches_logged = 0
    contiene_prefix_removed = 0
    questions_modified_for_name_clarity = 0
    apellido_prefix_removed = 0  # <-- NUEVO: Contador para prefijos de apellido eliminados

    report_entries = []

    for filename in input_filenames:
        print(f"  Processing file: {filename}")
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            print(f"    Warning: File not found. Skipping.")
            continue
        except json.JSONDecodeError:
            print(f"    Warning: Could not decode JSON. Skipping.")
            continue
        except Exception as e:
            print(f"    An unexpected error occurred reading {filename}: {e}. Skipping.")
            continue

        if not isinstance(data, list):
            print(f"    Warning: Expected a list of sections in {filename}, got {type(data)}. Skipping.")
            continue

        for section in data:
             if not isinstance(section, dict) or "letra" not in section or "preguntas" not in section:
                 print(f"    Warning: Skipping invalid section structure: {section}")
                 continue

             section_letter = section["letra"].upper()
             questions = section["preguntas"]

             if not isinstance(questions, list):
                  print(f"    Warning: 'preguntas' for letter {section_letter} in {filename} is not a list. Skipping.")
                  continue

             for q_data in questions:
                 if not isinstance(q_data, dict) or "pregunta" not in q_data or "respuesta" not in q_data:
                     print(f"    Warning: Skipping invalid question structure in {section_letter}: {q_data}")
                     continue

                 pregunta = q_data["pregunta"]
                 respuesta = q_data["respuesta"]
                 total_questions_processed += 1

                 normalized_pregunta = normalize_string(pregunta)
                 normalized_respuesta = normalize_string(respuesta)
                 palabras_respuesta = normalized_respuesta.split()
                 palabras_significativas_respuesta = [p for p in palabras_respuesta if p not in PREPOSICIONES_APELLIDOS]
                 num_palabras_significativas = len(palabras_significativas_respuesta)
                 
                 # --- NUEVO: Verificar si la respuesta NO es un apellido ---
                 respuesta_no_es_apellido = False
                 for termino in NO_APELLIDOS:
                     if termino in normalized_respuesta:
                         respuesta_no_es_apellido = True
                         break
                 
                 # También verificar por iniciales mayúsculas múltiples (como FC, AC, etc.)
                 if re.search(r'\b[A-Z]{2,}\b', respuesta) or re.search(r'\b[A-Z]\.[A-Z]\.', respuesta):
                     respuesta_no_es_apellido = True
                 # --- FIN NUEVO ---

                 # --- START: Validación y Logueo Nombre/Apellido/Completo ---
                 pregunta_pide_nombre_completo = (
                     "nombre completo" in normalized_pregunta or
                     "nombres y apellidos" in normalized_pregunta or
                     "nombre y apellido" in normalized_pregunta
                 )
                 pregunta_pide_apellido = (
                     ("apellido del" in normalized_pregunta or
                      "apellido de la" in normalized_pregunta or
                      "apellidos de" in normalized_pregunta or
                      normalized_pregunta.startswith("apellido:")) and
                     not pregunta_pide_nombre_completo
                 )
                 pregunta_pide_nombre_pila = (
                     "nombre de pila" in normalized_pregunta and
                     not pregunta_pide_nombre_completo and
                     not pregunta_pide_apellido
                 )
                 
                 es_pregunta_generica = any(frase in normalized_pregunta for frase in PALABRAS_CLAVE_PREGUNTA_GENERICA)

                 # ----- NUEVO: Modificar pregunta para aclarar el tipo de respuesta esperada -----
                 pregunta_original = pregunta
                 
                 # NUEVO: Quitar prefijo "Apellido:" si la respuesta no es un apellido
                 if pregunta_pide_apellido and respuesta_no_es_apellido:
                     if pregunta.startswith("Apellido:"):
                         pregunta = pregunta.replace("Apellido:", "").strip()
                         apellido_prefix_removed += 1
                         print(f"    Removed 'Apellido:' prefix because answer '{respuesta}' is not a surname")
                     elif pregunta.startswith("Apellido del"):
                         pregunta = pregunta.replace("Apellido del", "").strip()
                         apellido_prefix_removed += 1
                         print(f"    Removed 'Apellido del' prefix because answer '{respuesta}' is not a surname")
                     elif pregunta.startswith("Apellido de la"):
                         pregunta = pregunta.replace("Apellido de la", "").strip()
                         apellido_prefix_removed += 1
                         print(f"    Removed 'Apellido de la' prefix because answer '{respuesta}' is not a surname")
                     elif "apellido" in normalized_pregunta:
                         # Reemplazar la palabra "apellido" por una alternativa más adecuada
                         if "club" in normalized_respuesta or "fc" in normalized_respuesta or "united" in normalized_respuesta:
                             pregunta = re.sub(r'(?i)apellido', 'Nombre del club', pregunta)
                         elif "estadio" in normalized_respuesta or "stadium" in normalized_respuesta or "arena" in normalized_respuesta:
                             pregunta = re.sub(r'(?i)apellido', 'Nombre del estadio', pregunta)
                         elif any(pais in normalized_respuesta for pais in ["alemania", "argentina", "brasil", "espana", "francia"]):
                             pregunta = re.sub(r'(?i)apellido', 'País', pregunta)
                         else:
                             pregunta = re.sub(r'(?i)apellido', 'Nombre', pregunta)
                         
                         apellido_prefix_removed += 1
                         print(f"    Modified 'apellido' in question because answer '{respuesta}' is not a surname")
                 
                 # Caso 1: La respuesta parece un nombre completo (2+ palabras significativas) 
                 # pero la pregunta no lo especifica
                 elif (num_palabras_significativas >= 2 and 
                     not pregunta_pide_nombre_completo and 
                     not es_pregunta_generica and 
                     not (pregunta_pide_apellido and normalized_respuesta in APELLIDOS_COMPUESTOS_CONOCIDOS_NORMALIZADOS) and
                     not respuesta_no_es_apellido):  # <-- MODIFICADO: No modificar si no es un apellido
                     
                     # Si la pregunta es "¿Quién...?" o "¿Cuál...?" añadir frase al final
                     if pregunta.startswith("¿") and ("?" in pregunta):
                         # Reemplazar el signo de interrogación final con la especificación
                         pregunta = pregunta.replace("?", " (nombre completo)?")
                     # Para otras formas de preguntas
                     elif not "nombre completo" in pregunta.lower():
                         # Si no tiene signos de interrogación, añadir al principio
                         if pregunta.startswith("Apellido del"):
                             # Si dice "Apellido del..." pero la respuesta es nombre completo, corregir
                             pregunta = pregunta.replace("Apellido del", "Nombre completo del")
                         elif pregunta.startswith("Apellido de la"):
                             pregunta = pregunta.replace("Apellido de la", "Nombre completo de la")
                         else:
                             # Para otros casos añadir al inicio
                             pregunta = "Nombre completo: " + pregunta
                     
                     if pregunta != pregunta_original:
                         questions_modified_for_name_clarity += 1
                         print(f"    Modified: '{pregunta_original}' -> '{pregunta}'")
                 
                 # Caso 2: La respuesta parece solo apellido (1 palabra significativa) 
                 # pero la pregunta no lo especifica y no es nombre de pila
                 elif (num_palabras_significativas == 1 and 
                       not pregunta_pide_apellido and 
                       not pregunta_pide_nombre_pila and
                       not pregunta_pide_nombre_completo and
                       not es_pregunta_generica and
                       not respuesta_no_es_apellido):  # <-- MODIFICADO: No modificar si no es un apellido
                     
                     # Si la pregunta es "¿Quién...?" o "¿Cuál...?" añadir frase al final
                     if pregunta.startswith("¿") and ("?" in pregunta):
                         # Reemplazar el signo de interrogación final con la especificación
                         pregunta = pregunta.replace("?", " (apellido)?")
                     # Para otras formas de preguntas
                     elif not "apellido" in pregunta.lower():
                         # Si no tiene signos de interrogación, añadir al principio
                         if pregunta.startswith("Nombre completo del"):
                             # Si dice "Nombre completo del..." pero la respuesta es solo apellido, corregir
                             pregunta = pregunta.replace("Nombre completo del", "Apellido del")
                         elif pregunta.startswith("Nombre completo de la"):
                             pregunta = pregunta.replace("Nombre completo de la", "Apellido de la")
                         else:
                             # Para otros casos añadir al inicio
                             pregunta = "Apellido: " + pregunta
                     
                     if pregunta != pregunta_original:
                         questions_modified_for_name_clarity += 1
                         print(f"    Modified: '{pregunta_original}' -> '{pregunta}'")
                 # ----- FIN NUEVO -----

                 mismatch_reason = None

                 # Caso 1: Respuesta parece nombre completo, pregunta no lo pide explícitamente
                 if (num_palabras_significativas >= 2 and 
                     not pregunta_pide_nombre_completo and 
                     not es_pregunta_generica and 
                     not (pregunta_pide_apellido and normalized_respuesta in APELLIDOS_COMPUESTOS_CONOCIDOS_NORMALIZADOS)):
                     mismatch_reason = f"Respuesta '{respuesta}' ({num_palabras_significativas} pal sig.) parece N. Completo, pero pregunta no lo pide así."

                 # Caso 2: Pregunta pide nombre completo, respuesta es corta
                 elif pregunta_pide_nombre_completo and num_palabras_significativas < 2:
                     mismatch_reason = f"Pregunta pide N. Completo, pero respuesta '{respuesta}' ({num_palabras_significativas} pal sig.) es corta."
                 
                 # Caso 3: Pregunta pide apellido, respuesta no es apellido conocido y tiene varias palabras O es vacía
                 elif pregunta_pide_apellido:
                     if num_palabras_significativas > 1 and normalized_respuesta not in APELLIDOS_COMPUESTOS_CONOCIDOS_NORMALIZADOS:
                         mismatch_reason = f"Pregunta pide Apellido, respuesta '{respuesta}' ({num_palabras_significativas} pal sig.) parece N. Completo no reconocido."
                     elif num_palabras_significativas == 0 and len(palabras_respuesta) > 0: # Solo preposiciones
                         mismatch_reason = f"Pregunta pide Apellido, respuesta '{respuesta}' no tiene palabras significativas."
                 
                 # Caso 4: Pregunta pide nombre de pila, respuesta no es una palabra
                 elif pregunta_pide_nombre_pila and num_palabras_significativas != 1:
                     mismatch_reason = f"Pregunta pide N. Pila, pero respuesta '{respuesta}' ({num_palabras_significativas} pal sig.) no es una palabra."

                 if mismatch_reason:
                     report_entries.append(f"ARCHIVO: {os.path.basename(filename)}")
                     report_entries.append(f"LETRA: {section_letter}")
                     report_entries.append(f"PREGUNTA: {pregunta}")
                     report_entries.append(f"RESPUESTA: {respuesta}")
                     report_entries.append(f"NORMALIZADA_P: {normalized_pregunta}")
                     report_entries.append(f"NORMALIZADA_R: {normalized_respuesta}")
                     report_entries.append(f"RAZON: {mismatch_reason}")
                     report_entries.append("-" * 30)
                     potential_mismatches_logged += 1
                     # NO HACEMOS `continue` AQUI - la pregunta sigue para otros filtros
                 # --- END: Validación y Logueo ---

                 # Check if the question has a "CONTIENE X:" prefix
                 contiene_match = re.match(r"^\s*CONTIENE\s+([A-Z])\s*:\s*(.*)", pregunta, re.IGNORECASE)
                 if contiene_match:
                     contiene_letra = contiene_match.group(1).lower()
                     resto_pregunta = contiene_match.group(2)
                     
                     # If the answer starts with the same letter mentioned in "CONTIENE X:"
                     if normalized_respuesta.startswith(contiene_letra):
                         # Remove the prefix "CONTIENE X:" from the question
                         pregunta_sin_prefijo = resto_pregunta.strip()
                         pregunta = pregunta_sin_prefijo
                         contiene_prefix_removed += 1
                         print(f"    Removed 'CONTIENE {contiene_letra.upper()}:' prefix because answer '{respuesta}' starts with '{contiene_letra}'")
                 
                 # Check for duplicates
                 normalized_pregunta = normalize_string(pregunta)  # Re-normalize if the question was modified
                 normalized_tuple = (normalized_pregunta, normalized_respuesta)
                 if normalized_tuple not in seen_normalized_tuples:
                     seen_normalized_tuples.add(normalized_tuple)
                     # Store the question data (may be modified if prefix was removed)
                     merged_questions_by_letter[section_letter].append({
                         "pregunta": pregunta,
                         "respuesta": respuesta
                     })
                 else:
                     duplicates_found += 1
                     # print(f"    Duplicate found and skipped: ('{pregunta}', '{respuesta}')")

             # End of q_data loop
         # End of section loop
    # End of filename loop

    # <<<--- START FINAL LETTER CHECK --- >>>
    print("\nPerforming final letter-answer check before writing...")
    final_validated_questions = defaultdict(list)
    post_merge_mismatched_removed = 0
    final_question_count = 0

    for letter, questions_list in merged_questions_by_letter.items():
        normalized_letter = normalize_string(letter)
        if not normalized_letter: continue # Skip if letter is invalid

        validated_for_letter = []
        for q_data in questions_list:
            respuesta = q_data["respuesta"]
            normalized_respuesta = normalize_string(respuesta)

            # Check if the normalized answer starts with the normalized letter
            if normalized_respuesta and normalized_respuesta.startswith(normalized_letter):
                validated_for_letter.append(q_data)
            else:
                post_merge_mismatched_removed += 1
                print(f"  Post-merge mismatch (Letter: {letter}, Answer: '{respuesta}'). Removing: '{q_data['pregunta'][:50]}...'")

        if validated_for_letter: # Only keep letter section if it has valid questions
            final_validated_questions[letter] = validated_for_letter
            final_question_count += len(validated_for_letter)

    # <<<--- END FINAL LETTER CHECK --- >>>


    # Prepare the final structure sorted by letter using the validated questions
    final_data_structure = []
    for letter in sorted(final_validated_questions.keys()):
        final_data_structure.append({
            "letra": letter,
            "preguntas": final_validated_questions[letter]
        })

    # Write the merged and deduplicated data
    try:
        output_dir = os.path.dirname(output_filename)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)
            print(f"  Created output directory: {output_dir}")

        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(final_data_structure, f, ensure_ascii=False, indent=2)

        print(f"\nMerge and deduplication complete.")
        print(f"  Total questions processed initially: {total_questions_processed}")
        print(f"  'CONTIENE X:' prefixes removed: {contiene_prefix_removed}")
        print(f"  Questions modified for name/apellido clarity: {questions_modified_for_name_clarity}")
        print(f"  'Apellido:' prefixes removed from non-apellidos: {apellido_prefix_removed}")  # <-- NUEVO
        print(f"  Duplicate questions removed: {duplicates_found}")
        print(f"  Mismatched questions removed post-merge: {post_merge_mismatched_removed}")
        # Calculate final count based on what's actually written
        print(f"  Total unique & valid questions saved: {final_question_count}")
        print(f"  Merged data saved to: {output_filename}")

    except Exception as e:
        print(f"  An unexpected error occurred writing {output_filename}: {e}")

    # <<<--- START WRITING REPORT --- >>>
    if report_entries:
        try:
            report_dir = os.path.dirname(report_filename)
            if report_dir and not os.path.exists(report_dir):
                os.makedirs(report_dir)
            with open(report_filename, 'w', encoding='utf-8') as rf:
                rf.write("POTENCIALES DISCREPANCIAS NOMBRE/APELLIDO:\n")
                rf.write("=============================================\n\n")
                for entry in report_entries:
                    rf.write(entry + "\n")
            print(f"  Reporte de potenciales discrepancias guardado en: {report_filename}")
            print(f"  Entradas en el reporte: {potential_mismatches_logged}")
        except Exception as e:
            print(f"  Error escribiendo el reporte de discrepancias: {e}")
    else:
        print("  No se encontraron potenciales discrepancias de nombre/apellido para reportar.")
    # <<<--- END WRITING REPORT --- >>>


def main():
    parser = argparse.ArgumentParser(description="Merge, deduplicate, and check Pasapalabra JSON files.")
    parser.add_argument('input_files', nargs='+', help='List of input JSON files.')
    parser.add_argument('-o', '--output', default='data/all_questions_merged_v5.json', help='Output file for merged data.')
    parser.add_argument('-r', '--report', default='data/name_mismatch_report.txt', help='Output file for name mismatch report.')
    
    args = parser.parse_args()

    # Ensure the output directory exists if specified in the path
    output_dir = os.path.dirname(args.output)
    if output_dir and not os.path.exists(output_dir):
        try:
            os.makedirs(output_dir)
            print(f"Created output directory: {output_dir}")
        except OSError as e:
            print(f"Error creating output directory {output_dir}: {e}")
            return # Exit if cannot create directory

    merge_and_deduplicate(args.input_files, args.output, args.report)

if __name__ == "__main__":
    main() 