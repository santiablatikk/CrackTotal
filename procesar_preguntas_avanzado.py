import json
import os
import re # Para buscar patrones en las preguntas
import unicodedata

try:
    import Levenshtein
except ImportError:
    Levenshtein = None
    print("ADVERTENCIA: La librería 'python-Levenshtein' no está instalada.")
    print("La deduplicación por similitud de preguntas no funcionará.")
    print("Puedes instalarla con: pip install python-Levenshtein")

def normalizar_texto(s, quitar_espacios=False):
    """
    Normaliza un string a minúsculas y sin acentos.
    Opcionalmente quita todos los espacios.
    """
    if not isinstance(s, str):
        return ""
    s = s.lower()
    s = ''.join(c for c in unicodedata.normalize('NFD', s)
                if unicodedata.category(c) != 'Mn')
    if quitar_espacios:
        s = s.replace(" ", "")
    return s

def es_pregunta_de_tipo_contiene(pregunta_texto, letra_seccion_normalizada):
    """
    Determina si una pregunta es del tipo "CONTIENE LA (LETRA)".
    Busca patrones como "contiene la [letra]", "con la [letra]", "con [letra]" al inicio
    o una frase clara como "contiene la letra X" en cualquier parte.
    """
    pregunta_norm = normalizar_texto(pregunta_texto)
    # Patrones más explícitos (ej. "contiene la a:", "con la a:")
    patron_explicito = rf"^(contiene|con)\s+(la\s+)?{letra_seccion_normalizada}(\s*:|\s+\w|\s*$)"
    # Patrón más general para "contiene la letra X" en cualquier parte, por si acaso
    patron_general_contiene = rf"contiene\s+la\s+letra\s+{letra_seccion_normalizada}"

    if re.search(patron_explicito, pregunta_norm):
        return True
    if re.search(patron_general_contiene, pregunta_norm):
        # Podríamos añadir un log para ver cuándo se activa esta regla más general
        # print(f"  DEBUG: Pregunta '{pregunta_texto}' detectada como 'contiene' por patrón general.")
        return True
    
    # Añadir más heurísticas si es necesario, por ejemplo, si la pregunta es muy corta y empieza con "Con X:"
    # O si la respuesta claramente no empieza por la letra pero la contiene, podría ser una pista,
    # aunque eso es más complicado de inferir sin riesgo.

    return False

def calcular_similitud_levenshtein_ratio(s1, s2):
    if not Levenshtein: return 0.0
    if not s1 and not s2: return 1.0
    if not s1 or not s2: return 0.0
    return Levenshtein.ratio(s1, s2)

def procesar_preguntas_final(directorio_base, archivo_entrada_nombre, archivo_salida_nombre, umbral_similitud_pregunta=0.85):
    ruta_archivo_entrada = os.path.join(directorio_base, archivo_entrada_nombre)
    ruta_archivo_salida = os.path.join(directorio_base, archivo_salida_nombre)

    print(f"Archivo de entrada: {ruta_archivo_entrada}")
    print(f"Archivo de salida: {ruta_archivo_salida}")
    if Levenshtein:
        print(f"Usando umbral de similitud de pregunta para respuestas idénticas: {umbral_similitud_pregunta}")
    else:
        print("Deduplicación por similitud de pregunta DESACTIVADA (falta Levenshtein).")

    try:
        with open(ruta_archivo_entrada, 'r', encoding='utf-8') as f_in:
            datos_consolidados = json.load(f_in)
    except FileNotFoundError:
        print(f"ERROR: Archivo de entrada '{ruta_archivo_entrada}' no encontrado.")
        return
    except json.JSONDecodeError:
        print(f"ERROR: Archivo de entrada '{ruta_archivo_entrada}' no es un JSON válido.")
        return
    except Exception as e:
        print(f"ERROR al leer '{ruta_archivo_entrada}': {e}")
        return

    datos_procesados_final_lista = []
    stats = {
        "mantenidas_final": 0,
        "eliminadas_formato_incorrecto": 0,
        "eliminadas_regla_empieza": 0,
        "eliminadas_regla_contiene_no_cumple_contenido": 0,
        "eliminadas_regla_contiene_empieza_con_letra": 0,
        "eliminadas_duplicado_exacto": 0,
        "eliminadas_similitud_pregunta_misma_respuesta": 0,
        "debug_preguntas_tipo_contiene": 0
    }

    if not isinstance(datos_consolidados, list):
        print(f"ERROR: El contenido de '{ruta_archivo_entrada}' no es una lista JSON.")
        return

    for seccion in datos_consolidados:
        if not isinstance(seccion, dict) or "letra" not in seccion or "preguntas" not in seccion:
            stats["eliminadas_formato_incorrecto"] += 1
            continue

        letra_seccion_original = seccion["letra"]
        preguntas_seccion_original = seccion["preguntas"]
        
        if not isinstance(letra_seccion_original, str) or len(letra_seccion_original) != 1:
            stats["eliminadas_formato_incorrecto"] += 1 # O un contador específico para letras inválidas
            continue
            
        letra_seccion_norm = normalizar_texto(letra_seccion_original)
        
        # 1. Filtrado por regla de letra (EMPIEZA o CONTIENE)
        preguntas_paso1_filtrado_letra = []
        if not isinstance(preguntas_seccion_original, list): continue

        for p_obj in preguntas_seccion_original:
            if not (isinstance(p_obj, dict) and "pregunta" in p_obj and "respuesta" in p_obj):
                stats["eliminadas_formato_incorrecto"] += 1
                continue

            pregunta_str = p_obj.get("pregunta", "")
            respuesta_str = p_obj.get("respuesta", "")
            
            if not respuesta_str or not isinstance(respuesta_str, str) or not isinstance(pregunta_str, str) : # Necesitamos ambos para la lógica
                preguntas_paso1_filtrado_letra.append(p_obj) # Mantener si datos insuficientes para regla
                continue
            
            respuesta_norm = normalizar_texto(respuesta_str)
            
            if es_pregunta_de_tipo_contiene(pregunta_str, letra_seccion_norm):
                stats["debug_preguntas_tipo_contiene"] += 1
                # Regla CONTIENE: respuesta DEBE contener la letra Y NO DEBE empezar con la letra.
                if letra_seccion_norm in respuesta_norm and not respuesta_norm.startswith(letra_seccion_norm):
                    preguntas_paso1_filtrado_letra.append(p_obj)
                elif not (letra_seccion_norm in respuesta_norm):
                    stats["eliminadas_regla_contiene_no_cumple_contenido"] += 1
                    # print(f"  CONTIENE (letra {letra_seccion_original}): '{respuesta_str}' NO CONTIENE '{letra_seccion_norm}'. P: '{pregunta_str}'")
                elif respuesta_norm.startswith(letra_seccion_norm):
                    stats["eliminadas_regla_contiene_empieza_con_letra"] += 1
                    # print(f"  CONTIENE (letra {letra_seccion_original}): '{respuesta_str}' EMPIEZA con '{letra_seccion_norm}'. P: '{pregunta_str}'")
            else:
                # Regla EMPIEZA: respuesta DEBE empezar con la letra.
                if respuesta_norm.startswith(letra_seccion_norm):
                    preguntas_paso1_filtrado_letra.append(p_obj)
                else:
                    stats["eliminadas_regla_empieza"] += 1
                    # print(f"  EMPIEZA (letra {letra_seccion_original}): '{respuesta_str}' NO EMPIEZA con '{letra_seccion_norm}'. P: '{pregunta_str}'")

        # 2. Deduplicación exacta (pregunta Y respuesta idénticas)
        preguntas_paso2_dedup_exacto = []
        vistas_exactas = set()
        for p_obj in preguntas_paso1_filtrado_letra:
            t_pregunta = p_obj.get("pregunta", "")
            t_respuesta = p_obj.get("respuesta", "")
            # Ya validamos que pregunta y respuesta existen y son strings en el paso anterior para aplicar reglas
            
            tupla_exacta = (t_pregunta, t_respuesta)
            if tupla_exacta not in vistas_exactas:
                preguntas_paso2_dedup_exacto.append(p_obj)
                vistas_exactas.add(tupla_exacta)
            else:
                stats["eliminadas_duplicado_exacto"] += 1

        # 3. Deduplicación por similitud de PREGUNTA si la RESPUESTA es IDÉNTICA
        preguntas_paso3_final_seccion = []
        if not Levenshtein: 
            preguntas_paso3_final_seccion = list(preguntas_paso2_dedup_exacto) # Usar una copia
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

                    if p1_respuesta == p2_respuesta: # Solo si respuestas son idénticas
                        # Normalizar preguntas antes de comparar similitud para mayor robustez
                        p1_pregunta_norm_sim = normalizar_texto(p1_pregunta, quitar_espacios=True)
                        p2_pregunta_norm_sim = normalizar_texto(p2_pregunta, quitar_espacios=True)
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
    
    try:
        with open(ruta_archivo_salida, 'w', encoding='utf-8') as f_out:
            json.dump(datos_procesados_final_lista, f_out, ensure_ascii=False, indent=2)
        print(f"\n¡Procesamiento avanzado completado!")
        print(f"  Preguntas mantenidas final: {stats['mantenidas_final']}")
        print(f"  Eliminadas (formato incorrecto de item/sección): {stats['eliminadas_formato_incorrecto']}")
        print(f"  Eliminadas (regla 'empieza por'): {stats['eliminadas_regla_empieza']}")
        print(f"  Eliminadas (regla 'contiene' - no contenía letra): {stats['eliminadas_regla_contiene_no_cumple_contenido']}")
        print(f"  Eliminadas (regla 'contiene' - pero empezaba por letra): {stats['eliminadas_regla_contiene_empieza_con_letra']}")
        print(f"  Eliminadas (duplicado exacto P&R): {stats['eliminadas_duplicado_exacto']}")
        print(f"  Eliminadas (similitud pregunta, misma respuesta): {stats['eliminadas_similitud_pregunta_misma_respuesta']}")
        print(f"  (DEBUG: Preguntas tentativamente clasificadas como 'CONTIENE LA X': {stats['debug_preguntas_tipo_contiene']})")
        print(f"Los datos procesados se han guardado en: {ruta_archivo_salida}")
    except Exception as e:
        print(f"\nERROR: No se pudo escribir el archivo de salida {ruta_archivo_salida}: {e}")

if __name__ == "__main__":
    directorio_base_script = "data" 
    archivo_de_entrada = "consolidated_questions.json" 
    archivo_de_salida = "consolidated_questions_final_v2.json" # Nuevo nombre de salida
    
    umbral_sim = 0.85 # 85% de similitud para preguntas con misma respuesta

    print("Aplicando procesamiento avanzado:")
    print("1. Filtro por letra (EMPIEZA POR / CONTIENE LA).")
    print("2. Deduplicación exacta (pregunta y respuesta).")
    print(f"3. Deduplicación por similitud de preguntas (umbral {umbral_sim*100}%) si tienen la misma respuesta.")
    
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

