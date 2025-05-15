import json
import re
import unicodedata
from difflib import SequenceMatcher

DEBUG_MODE = False # Poner en True para ver más detalles; False para salida normal

def normalizar_texto(texto):
    """Normaliza el texto: minúsculas, sin acentos, sin puntuación excesiva."""
    if not isinstance(texto, str):
        return ""
    # Quitar acentos
    nfkd_form = unicodedata.normalize('NFKD', texto)
    texto_sin_acentos = "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    # Minúsculas y quitar puntuación básica (no guiones que pueden ser parte de nombres)
    texto_limpio = re.sub(r"[¿?¡!,.:;\(\)\[\]\{\}]", "", texto_sin_acentos.lower()).strip()
    texto_limpio = re.sub(r"\\s+", " ", texto_limpio) # Normalizar espacios múltiples
    return texto_limpio

def similitud_cadenas(a, b):
    """Calcula la similitud entre dos cadenas."""
    return SequenceMatcher(None, a, b).ratio()

def extraer_letra_pregunta(pregunta_norm):
    """Extrae la letra de preguntas tipo 'empieza con la x' o 'contiene la x'."""
    # Patrones para "empieza" (del más específico al más general)
    match = re.search(r"empieza con la letra ([a-z])", pregunta_norm)
    if match: 
        if DEBUG_MODE: print(f"[DEBUG extraer_letra_pregunta] Pregunta: '{pregunta_norm}', Encontrado: 'empieza con la letra {match.group(1)}', Retorna: ('{match.group(1)}', 'empieza')")
        return match.group(1), "empieza"
    
    match = re.search(r"comienza con la letra ([a-z])", pregunta_norm)
    if match: 
        if DEBUG_MODE: print(f"[DEBUG extraer_letra_pregunta] Pregunta: '{pregunta_norm}', Encontrado: 'comienza con la letra {match.group(1)}', Retorna: ('{match.group(1)}', 'empieza')")
        return match.group(1), "empieza"

    match = re.search(r"con la letra ([a-z])", pregunta_norm) 
    if match: 
        if DEBUG_MODE: print(f"[DEBUG extraer_letra_pregunta] Pregunta: '{pregunta_norm}', Encontrado: 'con la letra {match.group(1)}', Retorna: ('{match.group(1)}', 'empieza')")
        return match.group(1), "empieza"

    match = re.search(r"empieza con ([a-z])", pregunta_norm)
    if match: 
        if DEBUG_MODE: print(f"[DEBUG extraer_letra_pregunta] Pregunta: '{pregunta_norm}', Encontrado: 'empieza con {match.group(1)}', Retorna: ('{match.group(1)}', 'empieza')")
        return match.group(1), "empieza"

    match = re.search(r"comienza con ([a-z])", pregunta_norm)
    if match: 
        if DEBUG_MODE: print(f"[DEBUG extraer_letra_pregunta] Pregunta: '{pregunta_norm}', Encontrado: 'comienza con {match.group(1)}', Retorna: ('{match.group(1)}', 'empieza')")
        return match.group(1), "empieza"

    # Patrones para "contiene" (del más específico al más general)
    match = re.search(r"contiene la ([a-z])", pregunta_norm)
    if match: 
        if DEBUG_MODE: print(f"[DEBUG extraer_letra_pregunta] Pregunta: '{pregunta_norm}', Encontrado: 'contiene la {match.group(1)}', Retorna: ('{match.group(1)}', 'contiene')")
        return match.group(1), "contiene"

    match = re.search(r"contiene ([a-z])", pregunta_norm) 
    if match: 
        if DEBUG_MODE: print(f"[DEBUG extraer_letra_pregunta] Pregunta: '{pregunta_norm}', Encontrado: 'contiene {match.group(1)}', Retorna: ('{match.group(1)}', 'contiene')")
        return match.group(1), "contiene"
    
    if DEBUG_MODE: print(f"[DEBUG extraer_letra_pregunta] Pregunta: '{pregunta_norm}', No encontró patrón, Retorna: (None, None)")
    return None, None

def es_valida(item, letra_pregunta_info):
    pregunta_original = item.get("pregunta", "")
    respuesta_original = item.get("respuesta", "")
    
    pregunta_norm = normalizar_texto(pregunta_original)
    respuesta_norm = normalizar_texto(respuesta_original)

    if not pregunta_original or not respuesta_original:
        return False # Pregunta o respuesta vacía

    letra, tipo_regla_letra = letra_pregunta_info

    # 1. Validación "CONTIENE LA (LETRA)"
    if tipo_regla_letra == "contiene" and letra:
        if not letra in respuesta_norm:
            # print(f"RECHAZADA (Contiene): '{respuesta_original}' no contiene '{letra}'. Pregunta: '{pregunta_original}'")
            return False
        if respuesta_norm.startswith(letra):
            # print(f"RECHAZADA (Contiene-Empieza): '{respuesta_original}' empieza con '{letra}'. Pregunta: '{pregunta_original}'")
            return False

    # 2. Validación "EMPIEZA CON (LETRA)"
    elif tipo_regla_letra == "empieza" and letra:
        if not respuesta_norm.startswith(letra):
            # print(f"RECHAZADA (Empieza): '{respuesta_original}' no empieza con '{letra}'. Pregunta: '{pregunta_original}'")
            return False

    # 3. Validación "Apellido de"
    if "apellido de" in pregunta_norm:
        palabras_respuesta = respuesta_original.split()
        # Un apellido suele ser una o dos palabras. Permitimos hasta 3 para apellidos compuestos o con partículas.
        # También intentamos filtrar si parece un nombre completo.
        if len(palabras_respuesta) > 3:
             # print(f"RECHAZADA (Apellido-Largo): '{respuesta_original}'. Pregunta: '{pregunta_original}'")
             return False
        # Evitar respuestas que claramente no son apellidos (ej. frases largas)
        # Esta regla es heurística y puede necesitar ajustes.
        if len(respuesta_original) > 30 and len(palabras_respuesta) > 1: # Un apellido muy largo Y con espacios
             # print(f"RECHAZADA (Apellido-Frase): '{respuesta_original}'. Pregunta: '{pregunta_original}'")
             return False


    # 4. Validación "Nombre completo de"
    if "nombre completo de" in pregunta_norm or "nombre y apellido de" in pregunta_norm:
        palabras_respuesta = respuesta_original.split()
        # Un nombre completo suele tener al menos dos palabras.
        if len(palabras_respuesta) < 2:
            # A menos que sea una descripción como "Futbolista argentino..."
            if not any(keyword in pregunta_norm for keyword in ["futbolista", "director tecnico", "jugador", "arquero", "defensor", "mediocampista", "delantero"]):
                 # print(f"RECHAZADA (Nombre Completo-Corto): '{respuesta_original}'. Pregunta: '{pregunta_original}'")
                 return False
        if len(respuesta_original) > 50 and len(palabras_respuesta) < 2 : # Nombre muy largo para ser solo uno sin apellido
            # print(f"RECHAZADA (Nombre Completo-Extraño): '{respuesta_original}'. Pregunta: '{pregunta_original}'")
            return False
            
    # Si pasó todas las validaciones específicas
    return True

def obtener_primera_letra_respuesta(respuesta_normalizada):
    """Obtiene la primera letra alfabética de una respuesta normalizada."""
    if respuesta_normalizada and respuesta_normalizada[0].isalpha():
        return respuesta_normalizada[0].upper()
    return None # O alguna letra default si se prefiere no descartar

def procesar_preguntas(archivo_entrada, archivo_salida, similitud_threshold=0.85):
    try:
        with open(archivo_entrada, 'r', encoding='utf-8') as f:
            datos_entrada_raw = json.load(f) # Renamed variable for clarity
    except FileNotFoundError:
        print(f"Error: El archivo de entrada '{archivo_entrada}' no fue encontrado.")
        return
    except json.JSONDecodeError:
        print(f"Error: El archivo '{archivo_entrada}' no contiene un JSON válido.")
        return

    if not isinstance(datos_entrada_raw, list): # Check if the raw input is a list of sections
        print(f"Error: El JSON en '{archivo_entrada}' no es una lista de secciones.")
        return

    preguntas_aplanadas = []
    for seccion_obj in datos_entrada_raw: # Iterate through the list of original sections
        if isinstance(seccion_obj, dict) and "preguntas" in seccion_obj and isinstance(seccion_obj["preguntas"], list):
            if DEBUG_MODE:
                nombre_seccion_original = seccion_obj.get("seccion", "Sección Desconocida")
                print(f"[DEBUG procesar_preguntas] Extrayendo preguntas de la sección original: '{nombre_seccion_original}'")
            preguntas_aplanadas.extend(seccion_obj["preguntas"])
        else:
            nombre_seccion_original_malformed = seccion_obj.get("seccion", "Sección Desconocida o Malformada")
            print(f"Advertencia: Sección mal formada o sin clave 'preguntas' encontrada en '{archivo_entrada}'. Sección: '{nombre_seccion_original_malformed}', Contenido aproximado: {str(seccion_obj)[:200]}")
            pass 

    preguntas_validas_por_letra_agrupacion = {}
    vistos_exactos = set()
    preguntas_similares_tracker = {} 

    total_inicial = len(preguntas_aplanadas)
    descartadas_formato = 0
    descartadas_reglas = 0
    descartadas_duplicado_exacto = 0
    descartadas_duplicado_similar = 0
    preguntas_sin_letra_agrupacion_valida = 0

    for item in preguntas_aplanadas:
        if not isinstance(item, dict) or "pregunta" not in item or "respuesta" not in item:
            descartadas_formato += 1
            continue

        pregunta_original = item["pregunta"]
        respuesta_original = item["respuesta"]
        pregunta_norm = normalizar_texto(pregunta_original)
        respuesta_norm = normalizar_texto(respuesta_original)

        clave_exacta = (pregunta_norm, respuesta_norm)
        if clave_exacta in vistos_exactos:
            descartadas_duplicado_exacto += 1
            continue
        
        pregunta_norm_para_similitud = re.sub(r"(empieza con la letra [a-z]|contiene la [a-z]|con la letra [a-z])", "", pregunta_norm).strip()
        pregunta_norm_para_similitud = re.sub(r"\\s+", " ", pregunta_norm_para_similitud)

        es_duplicado_similar = False
        if respuesta_norm in preguntas_similares_tracker:
            for p_existente_norm_sim in preguntas_similares_tracker[respuesta_norm]:
                if similitud_cadenas(pregunta_norm_para_similitud, p_existente_norm_sim) >= similitud_threshold:
                    es_duplicado_similar = True
                    break
        if es_duplicado_similar:
            descartadas_duplicado_similar += 1
            continue
            
        letra_extraida_regla, tipo_regla = extraer_letra_pregunta(pregunta_norm)
        clave_agrupacion = None

        if letra_extraida_regla: # Si hay regla explícita en la pregunta
            clave_agrupacion = letra_extraida_regla.upper()
            # La validación en es_valida() usará esta letra_extraida_regla y tipo_regla
        else: # No hay regla explícita en la pregunta, tratar como "Empieza con (1ra letra de respuesta)"
            primera_letra_resp_norm = obtener_primera_letra_respuesta(respuesta_norm) # Devuelve MAYÚSCULA o None
            if primera_letra_resp_norm: # Si la respuesta empieza con una letra válida
                letra_extraida_regla = primera_letra_resp_norm.lower() # Para es_valida(), la letra debe ser minúscula
                tipo_regla = "empieza" # Asumimos regla "empieza"
                clave_agrupacion = primera_letra_resp_norm # Ya está en mayúscula para la clave de sección
            # Si primera_letra_resp_norm es None, letra_extraida_regla y tipo_regla permanecen None,
            # y clave_agrupacion también será None. es_valida se llamará con (None,None)
            # y la pregunta probablemente no se agrupe si clave_agrupacion sigue siendo None.

        valida = es_valida(item, (letra_extraida_regla, tipo_regla)) # AHORA es_valida recibe la regla IMPLÍCITA si es el caso
        
        if DEBUG_MODE:
            print(f"--- [DEBUG procesar] ---")
            print(f"  Pregunta Original: {pregunta_original}")
            print(f"  Respuesta Original: {respuesta_original}")
            print(f"  Letra (Regla o Implícita): {letra_extraida_regla}, Tipo Regla: {tipo_regla}")
            print(f"  Resultado es_valida(): {valida}")
            print(f"  Clave Agrupación Final: {clave_agrupacion}")

        if not valida:
            descartadas_reglas += 1
            if DEBUG_MODE: print(f"  DECISIÓN: Descartada por REGLAS DE VALIDACIÓN (es_valida)")
            continue

        if clave_agrupacion: 
            if clave_agrupacion not in preguntas_validas_por_letra_agrupacion:
                preguntas_validas_por_letra_agrupacion[clave_agrupacion] = []
            preguntas_validas_por_letra_agrupacion[clave_agrupacion].append(item)
            vistos_exactos.add(clave_exacta)
            if respuesta_norm not in preguntas_similares_tracker:
                preguntas_similares_tracker[respuesta_norm] = []
            preguntas_similares_tracker[respuesta_norm].append(pregunta_norm_para_similitud)
        else:
            preguntas_sin_letra_agrupacion_valida +=1
            if DEBUG_MODE: print(f"  ADVERTENCIA: Pregunta válida pero sin clave de agrupación (respuesta '{respuesta_original}' no empieza con letra o regla no clara)")

    # Convertir el diccionario al formato de lista de secciones para el JSON de salida
    resultado_final_formateado = []
    for letra_seccion_key in sorted(preguntas_validas_por_letra_agrupacion.keys()):
        resultado_final_formateado.append({
            "letra": letra_seccion_key,
            "preguntas": preguntas_validas_por_letra_agrupacion[letra_seccion_key]
        })

    try:
        with open(archivo_salida, 'w', encoding='utf-8') as f:
            json.dump(resultado_final_formateado, f, ensure_ascii=False, indent=2)
    except IOError:
        print(f"Error: No se pudo escribir en el archivo de salida '{archivo_salida}'.")
        return

    print(f"Procesamiento completado.")
    print(f"Total de preguntas iniciales (después de aplanar): {total_inicial}")
    print(f"Descartadas por formato incorrecto (dentro de 'preguntas'): {descartadas_formato}")
    print(f"Descartadas por reglas de validación: {descartadas_reglas}")
    print(f"Descartadas por duplicado exacto: {descartadas_duplicado_exacto}")
    print(f"Descartadas por similitud con misma respuesta: {descartadas_duplicado_similar}")
    if preguntas_sin_letra_agrupacion_valida > 0:
        print(f"Preguntas válidas pero no agrupadas (respuesta no empieza con letra?): {preguntas_sin_letra_agrupacion_valida}")
    print(f"Total de preguntas guardadas en '{archivo_salida}': {sum(len(s['preguntas']) for s in resultado_final_formateado)}")

if __name__ == "__main__":
    archivo_entrada_default = "data/consolidated_questions.json" 
    archivo_salida_default = "data/output_from_consolidated_filtered.json"

    DEBUG_MODE = False # Desactivar DEBUG para la ejecución normal por defecto
    debug_input = input(f"Ejecutar en modo DEBUG (mostrará muchos detalles) (s/N): ").lower()
    if debug_input == 's':
        DEBUG_MODE = True

    entrada = input(f"Introduce el nombre del archivo JSON de entrada (default: {archivo_entrada_default}): ") or archivo_entrada_default
    salida = input(f"Introduce el nombre del archivo JSON de salida (default: {archivo_salida_default}): ") or archivo_salida_default
    
    procesar_preguntas(entrada, salida)
    print(f"Puedes encontrar las preguntas procesadas en el archivo: {salida}") 