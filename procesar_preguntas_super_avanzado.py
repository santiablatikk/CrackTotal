import json
import os
import re
import unicodedata

try:
    import Levenshtein
except ImportError:
    Levenshtein = None
    print("ADVERTENCIA: Librería 'python-Levenshtein' no instalada. Deduplicación por similitud desactivada.")
    print("Instalar con: pip install python-Levenshtein")

def normalizar_texto(s, quitar_espacios=False, solo_letras_y_numeros=False):
    if not isinstance(s, str): return ""
    s = s.lower()
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    if quitar_espacios: s = s.replace(" ", "")
    if solo_letras_y_numeros: s = re.sub(r'[^a-z0-9\s]', '', s) # Mantener espacios si no se quitaron antes
    return s

def es_pregunta_de_tipo_contiene(pregunta_texto, letra_seccion_normalizada):
    pregunta_norm = normalizar_texto(pregunta_texto)
    patron_explicito = rf"^(contiene|con)\s+(la\s+)?{letra_seccion_normalizada}(\s*:|\s+\w|\s*$)"
    patron_general_contiene = rf"contiene\s+la\s+letra\s+{letra_seccion_normalizada}"
    if re.search(patron_explicito, pregunta_norm) or re.search(patron_general_contiene, pregunta_norm):
        return True
    return False

def es_respuesta_simple_palabra(respuesta_texto):
    """Considera una respuesta como simple/apellido si tiene 1 palabra principal.
       Esto es una heurística y puede fallar con nombres compuestos.
    """
    return len(respuesta_texto.split()) <= 1

def es_respuesta_multi_palabra(respuesta_texto):
    """Considera una respuesta como multi-palabra/nombre completo si tiene > 1 palabra."""
    return len(respuesta_texto.split()) > 1

def calcular_similitud_levenshtein_ratio(s1, s2):
    if not Levenshtein: return 0.0
    if not s1 and not s2: return 1.0
    if not s1 or not s2: return 0.0
    return Levenshtein.ratio(s1, s2)

def procesar_preguntas_final_v3(directorio_base, archivo_entrada_nombre, archivo_salida_nombre, umbral_similitud_pregunta=0.85):
    ruta_archivo_entrada = os.path.join(directorio_base, archivo_entrada_nombre)
    ruta_archivo_salida = os.path.join(directorio_base, archivo_salida_nombre)

    print(f"Entrada: {ruta_archivo_entrada}, Salida: {ruta_archivo_salida}")

    try:
        with open(ruta_archivo_entrada, 'r', encoding='utf-8') as f_in:
            datos_consolidados = json.load(f_in)
    except Exception as e:
        print(f"ERROR al leer '{ruta_archivo_entrada}': {e}")
        return

    datos_procesados_final_lista = []
    stats = {
        "mantenidas_final": 0, "eliminadas_formato": 0,
        "eliminadas_regla_empieza": 0, "eliminadas_regla_contiene_no_contenido": 0,
        "eliminadas_regla_contiene_empieza_letra": 0,
        "eliminadas_pide_apellido_respuesta_larga": 0,
        "eliminadas_pide_nombre_completo_respuesta_corta": 0,
        "eliminadas_duplicado_exacto": 0,
        "eliminadas_similitud_pregunta_misma_respuesta": 0,
        "debug_tipo_contiene": 0, "debug_pide_apellido": 0, "debug_pide_nombre_completo": 0
    }

    if not isinstance(datos_consolidados, list):
        print(f"ERROR: Contenido de '{ruta_archivo_entrada}' no es una lista.")
        return

    for seccion in datos_consolidados:
        # ... (validación de sección y letra como antes) ...
        letra_seccion_original = seccion.get("letra")
        preguntas_seccion_original = seccion.get("preguntas")

        if not (isinstance(letra_seccion_original, str) and len(letra_seccion_original) == 1 and isinstance(preguntas_seccion_original, list)):
            stats["eliminadas_formato"] += len(preguntas_seccion_original or [])
            continue
            
        letra_seccion_norm = normalizar_texto(letra_seccion_original)
        
        # PASO 1: Filtro por reglas de letra (empieza/contiene) Y tipo de respuesta (apellido/nombre completo)
        preguntas_paso1_filtrado_logico = []
        for p_obj in preguntas_seccion_original:
            if not (isinstance(p_obj, dict) and "pregunta" in p_obj and "respuesta" in p_obj):
                stats["eliminadas_formato"] += 1
                continue

            pregunta_str = p_obj.get("pregunta", "")
            respuesta_str = p_obj.get("respuesta", "")
            
            if not isinstance(pregunta_str, str) or not isinstance(respuesta_str, str) or not respuesta_str:
                stats["eliminadas_formato"] +=1 # Requiere pregunta y respuesta para procesar
                continue
            
            pregunta_norm = normalizar_texto(pregunta_str)
            respuesta_norm = normalizar_texto(respuesta_str)
            
            # Chequeo de regla "empieza por" / "contiene la"
            pasa_regla_letra = False
            es_tipo_contiene = es_pregunta_de_tipo_contiene(pregunta_str, letra_seccion_norm)
            if es_tipo_contiene:
                stats["debug_tipo_contiene"] += 1
                if letra_seccion_norm in respuesta_norm and not respuesta_norm.startswith(letra_seccion_norm):
                    pasa_regla_letra = True
                elif not (letra_seccion_norm in respuesta_norm):
                    stats["eliminadas_regla_contiene_no_contenido"] += 1
                elif respuesta_norm.startswith(letra_seccion_norm):
                    stats["eliminadas_regla_contiene_empieza_letra"] += 1
            else: # Regla "empieza por"
                if respuesta_norm.startswith(letra_seccion_norm):
                    pasa_regla_letra = True
                else:
                    stats["eliminadas_regla_empieza"] += 1
            
            if not pasa_regla_letra:
                continue # No pasó el filtro básico de letra

            # Chequeo de "apellido de" vs "nombre completo de"
            # Estas son heurísticas y pueden necesitar ajuste.
            # No se aplican si la respuesta es muy corta (1-2 caracteres), podría ser una inicial o algo especial.
            pasa_regla_tipo_respuesta = True
            if len(respuesta_str) > 2: # Solo aplicar si la respuesta tiene cierta longitud
                if "apellido de" in pregunta_norm:
                    stats["debug_pide_apellido"] += 1
                    if es_respuesta_multi_palabra(respuesta_str): 
                        # Aquí la heurística: si pide apellido y la respuesta tiene >1 palabra, es sospechoso.
                        # Excepción simple: no aplicar si "club", "equipo", "estadio", "pais", "ciudad", "seleccion", "copa", "liga", "torneo" está en pregunta_norm
                        palabras_clave_excepcion = ["club", "equipo", "estadio", "pais", "ciudad", "seleccion", "copa", "liga", "torneo", "apodo"]
                        if not any(palabra_clave in pregunta_norm for palabra_clave in palabras_clave_excepcion):
                            pasa_regla_tipo_respuesta = False
                            stats["eliminadas_pide_apellido_respuesta_larga"] += 1
                            # print(f"  PIDE APELLIDO, RESP LARGA (L:{letra_seccion_original}): P: '{pregunta_str}' R: '{respuesta_str}'")


                elif "nombre completo de" in pregunta_norm or \
                     pregunta_norm.startswith("futbolista") or \
                     pregunta_norm.startswith("director tecnico") or \
                     pregunta_norm.startswith("jugador") or \
                     pregunta_norm.startswith("arquero") or \
                     pregunta_norm.startswith("delantero") or \
                     pregunta_norm.startswith("defensor") or \
                     pregunta_norm.startswith("mediocampista"):
                    stats["debug_pide_nombre_completo"] += 1
                    if es_respuesta_simple_palabra(respuesta_str):
                        # Aquí la heurística: si pide nombre completo (o rol de persona) y respuesta es 1 palabra, es sospechoso.
                        pasa_regla_tipo_respuesta = False
                        stats["eliminadas_pide_nombre_completo_respuesta_corta"] += 1
                        # print(f"  PIDE N.COMPLETO, RESP CORTA (L:{letra_seccion_original}): P: '{pregunta_str}' R: '{respuesta_str}'")
            
            if pasa_regla_tipo_respuesta:
                preguntas_paso1_filtrado_logico.append(p_obj)
            # else: pregunta ya fue contada en su respectiva estadística de eliminación

        # PASO 2: Deduplicación exacta
        preguntas_paso2_dedup_exacto = []
        # ... (código de deduplicación exacta como en el script anterior, usando preguntas_paso1_filtrado_logico como entrada)
        vistas_exactas = set()
        for p_obj in preguntas_paso1_filtrado_logico:
            # ... (obtener pregunta y respuesta)
            t_pregunta = p_obj.get("pregunta", "")
            t_respuesta = p_obj.get("respuesta", "")
            tupla_exacta = (t_pregunta, t_respuesta)
            if tupla_exacta not in vistas_exactas:
                preguntas_paso2_dedup_exacto.append(p_obj)
                vistas_exactas.add(tupla_exacta)
            else:
                stats["eliminadas_duplicado_exacto"] += 1


        # PASO 3: Deduplicación por similitud de pregunta si respuesta es idéntica
        preguntas_paso3_final_seccion = []
        # ... (código de deduplicación por similitud como en el script anterior, usando preguntas_paso2_dedup_exacto como entrada)
        if not Levenshtein: 
            preguntas_paso3_final_seccion = list(preguntas_paso2_dedup_exacto) 
        else:
            candidatas = list(preguntas_paso2_dedup_exacto) 
            indices_a_eliminar = set()
            for i in range(len(candidatas)):
                if i in indices_a_eliminar: continue
                p1_obj = candidatas[i]
                p1_pregunta = p1_obj.get("pregunta", "")
                p1_respuesta = p1_obj.get("respuesta", "")
                for j in range(i + 1, len(candidatas)):
                    if j in indices_a_eliminar: continue
                    p2_obj = candidatas[j]
                    p2_pregunta = p2_obj.get("pregunta", "")
                    p2_respuesta = p2_obj.get("respuesta", "")
                    if p1_respuesta == p2_respuesta:
                        p1_pregunta_norm_sim = normalizar_texto(p1_pregunta, quitar_espacios=True, solo_letras_y_numeros=True)
                        p2_pregunta_norm_sim = normalizar_texto(p2_pregunta, quitar_espacios=True, solo_letras_y_numeros=True)
                        similitud = calcular_similitud_levenshtein_ratio(p1_pregunta_norm_sim, p2_pregunta_norm_sim)
                        if similitud >= umbral_similitud_pregunta:
                            indices_a_eliminar.add(j)
                            stats["eliminadas_similitud_pregunta_misma_respuesta"] += 1
            for i in range(len(candidatas)):
                if i not in indices_a_eliminar:
                    preguntas_paso3_final_seccion.append(candidatas[i])
        
        stats["mantenidas_final"] += len(preguntas_paso3_final_seccion)
        if preguntas_paso3_final_seccion:
            datos_procesados_final_lista.append({
                "letra": letra_seccion_original,
                "preguntas": preguntas_paso3_final_seccion
            })
    
    # ... (código para guardar el archivo y mostrar estadísticas como antes) ...
    # Asegúrate de actualizar los nombres de las claves en el print de estadísticas.
    try:
        with open(ruta_archivo_salida, 'w', encoding='utf-8') as f_out:
            json.dump(datos_procesados_final_lista, f_out, ensure_ascii=False, indent=2)
        print(f"\n¡Procesamiento súper avanzado completado!")
        print(f"  Preguntas mantenidas final: {stats['mantenidas_final']}")
        print(f"  Eliminadas (formato incorrecto): {stats['eliminadas_formato']}")
        print(f"  Eliminadas (regla 'empieza por' no cumplida): {stats['eliminadas_regla_empieza']}")
        print(f"  Eliminadas (regla 'contiene' - no contenía letra): {stats['eliminadas_regla_contiene_no_contenido']}")
        print(f"  Eliminadas (regla 'contiene' - pero empezaba por letra): {stats['eliminadas_regla_contiene_empieza_letra']}")
        print(f"  Eliminadas (pide apellido, respuesta multi-palabra no exceptuada): {stats['eliminadas_pide_apellido_respuesta_larga']}")
        print(f"  Eliminadas (pide nombre completo/rol, respuesta una palabra): {stats['eliminadas_pide_nombre_completo_respuesta_corta']}")
        print(f"  Eliminadas (duplicado exacto P&R): {stats['eliminadas_duplicado_exacto']}")
        print(f"  Eliminadas (similitud pregunta, misma respuesta): {stats['eliminadas_similitud_pregunta_misma_respuesta']}")
        print(f"  (DEBUG: 'Contiene la X': {stats['debug_tipo_contiene']}, 'Pide Apellido': {stats['debug_pide_apellido']}, 'Pide N.Completo/Rol': {stats['debug_pide_nombre_completo']})")
        print(f"Los datos procesados se han guardado en: {ruta_archivo_salida}")
    except Exception as e:
        print(f"\nERROR: No se pudo escribir el archivo de salida {ruta_archivo_salida}: {e}")


if __name__ == "__main__":
    directorio_base_script = "data" 
    archivo_de_entrada = "consolidated_questions.json" 
    archivo_de_salida = "consolidated_questions_final_v3.json" 
    
    umbral_sim = 0.85 

    print("Aplicando procesamiento súper avanzado...")
    # ... (mensajes como antes)
    
    procesar_preguntas_final_v3(directorio_base_script, archivo_de_entrada, archivo_de_salida, umbral_similitud_pregunta=umbral_sim)
