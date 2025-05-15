import json
import os
import unicodedata

def normalizar_texto(s):
    """
    Normaliza un string a minúsculas y sin acentos.
    """
    if not isinstance(s, str):
        return ""
    s = s.lower()
    s = ''.join(c for c in unicodedata.normalize('NFD', s)
                if unicodedata.category(c) != 'Mn')
    return s

def filtrar_y_deduplicar_preguntas(directorio_base, archivo_entrada_nombre, archivo_salida_nombre):
    """
    Filtra las preguntas de un archivo JSON consolidado y elimina duplicados exactos.
    Regla de filtrado: la respuesta debe comenzar con la letra de la sección (ignorando mayúsculas/minúsculas y acentos).
    Regla de deduplicación: elimina preguntas donde tanto "pregunta" como "respuesta" sean idénticas a otra en la misma letra.
    """
    ruta_archivo_entrada = os.path.join(directorio_base, archivo_entrada_nombre)
    ruta_archivo_salida = os.path.join(directorio_base, archivo_salida_nombre)

    print(f"Archivo de entrada: {ruta_archivo_entrada}")
    print(f"Archivo de salida: {ruta_archivo_salida}")

    try:
        with open(ruta_archivo_entrada, 'r', encoding='utf-8') as f:
            datos_consolidados = json.load(f)
    except FileNotFoundError:
        print(f"ERROR: El archivo de entrada '{ruta_archivo_entrada}' no fue encontrado.")
        print("Asegúrate de que el archivo consolidado (ej: 'consolidated_questions.json' o 'consolidated_questions_filtered.json') exista.")
        return
    except json.JSONDecodeError:
        print(f"ERROR: El archivo de entrada '{ruta_archivo_entrada}' no es un JSON válido.")
        return
    except Exception as e:
        print(f"ERROR: Ocurrió un error inesperado al leer '{ruta_archivo_entrada}': {e}")
        return

    datos_procesados_final = []
    preguntas_eliminadas_por_regla_letra = 0
    preguntas_eliminadas_por_duplicacion = 0
    preguntas_mantenidas_count = 0

    if not isinstance(datos_consolidados, list):
        print(f"ERROR: El contenido de '{ruta_archivo_entrada}' no es una lista JSON como se esperaba.")
        return

    for seccion in datos_consolidados:
        if not isinstance(seccion, dict) or "letra" not in seccion or "preguntas" not in seccion:
            print(f"ADVERTENCIA: Sección con formato incorrecto omitida: {seccion}")
            continue

        letra_seccion = seccion["letra"]
        preguntas_seccion_original = seccion["preguntas"]
        
        if not isinstance(letra_seccion, str) or len(letra_seccion) != 1:
            print(f"ADVERTENCIA: Letra de sección inválida '{letra_seccion}'. Omitiendo sección.")
            continue
            
        letra_seccion_normalizada = normalizar_texto(letra_seccion)
        
        preguntas_validas_por_letra = []
        if not isinstance(preguntas_seccion_original, list):
            print(f"ADVERTENCIA: 'preguntas' no es una lista para la letra '{letra_seccion}'. Omitiendo sección.")
            continue

        for pregunta_obj in preguntas_seccion_original:
            if not isinstance(pregunta_obj, dict) or "pregunta" not in pregunta_obj or "respuesta" not in pregunta_obj:
                # print(f"ADVERTENCIA: Objeto de pregunta con formato incorrecto omitido en letra '{letra_seccion}': {pregunta_obj}")
                continue # Omitir preguntas mal formadas

            respuesta = pregunta_obj.get("respuesta", "")
            
            if not respuesta or not isinstance(respuesta, str):
                # Mantenemos preguntas con respuestas vacías/no-string en esta etapa,
                # se podrían filtrar después si es necesario o aquí mismo.
                preguntas_validas_por_letra.append(pregunta_obj)
                continue

            primera_letra_respuesta_normalizada = normalizar_texto(respuesta[0])

            if primera_letra_respuesta_normalizada == letra_seccion_normalizada:
                preguntas_validas_por_letra.append(pregunta_obj)
            else:
                preguntas_eliminadas_por_regla_letra += 1
        
        # Ahora, deduplicar dentro de las preguntas que pasaron el filtro de letra
        preguntas_deduplicadas_para_seccion = []
        preguntas_vistas_text = set() # Usamos un set para rastrear (pregunta, respuesta) vistas

        for pregunta_obj in preguntas_validas_por_letra:
            # Asegurarnos que la pregunta y respuesta existan y sean strings para formar la tupla
            texto_pregunta = pregunta_obj.get("pregunta", "")
            texto_respuesta = pregunta_obj.get("respuesta", "")
            
            if not isinstance(texto_pregunta, str) or not isinstance(texto_respuesta, str):
                # Si alguna no es string, no podemos hacer la tupla de forma segura para el set.
                # Podríamos optar por mantenerla o descartarla. Por ahora, la mantenemos si no es un par string-string.
                preguntas_deduplicadas_para_seccion.append(pregunta_obj)
                preguntas_mantenidas_count +=1 # Se cuenta como mantenida aunque no se pudo verificar duplicidad
                continue

            pregunta_respuesta_tuple = (texto_pregunta, texto_respuesta)

            if pregunta_respuesta_tuple not in preguntas_vistas_text:
                preguntas_deduplicadas_para_seccion.append(pregunta_obj)
                preguntas_vistas_text.add(pregunta_respuesta_tuple)
                preguntas_mantenidas_count += 1
            else:
                # print(f"  Eliminando duplicado: Letra '{letra_seccion}', Pregunta '{texto_pregunta}', Respuesta '{texto_respuesta}'")
                preguntas_eliminadas_por_duplicacion += 1
        
        if preguntas_deduplicadas_para_seccion:
            datos_procesados_final.append({
                "letra": letra_seccion,
                "preguntas": preguntas_deduplicadas_para_seccion
            })

    try:
        with open(ruta_archivo_salida, 'w', encoding='utf-8') as f_out:
            json.dump(datos_procesados_final, f_out, ensure_ascii=False, indent=2)
        print(f"\n¡Procesamiento (filtrado y deduplicación) completado!")
        print(f"Preguntas mantenidas: {preguntas_mantenidas_count}")
        print(f"Preguntas eliminadas por regla de letra: {preguntas_eliminadas_por_regla_letra}")
        print(f"Preguntas eliminadas por duplicación: {preguntas_eliminadas_por_duplicacion}")
        print(f"Los datos procesados se han guardado en: {ruta_archivo_salida}")
    except Exception as e:
        print(f"\nERROR: No se pudo escribir el archivo de salida {ruta_archivo_salida}: {e}")

if __name__ == "__main__":
    directorio_base_script = "data" 
    # Puedes usar 'consolidated_questions.json' si quieres aplicar ambas operaciones a la vez,
    # o 'consolidated_questions_filtered.json' si el filtrado por letra ya se hizo
    # y solo quieres deduplicar ese resultado.
    archivo_de_entrada = "consolidated_questions.json" 
    archivo_de_salida = "consolidated_questions_filtered_deduped.json"

    print("Este script primero filtrará las preguntas donde la respuesta no comienza con la letra de la sección,")
    print("y LUEGO eliminará duplicados exactos (pregunta y respuesta) dentro de cada letra.")

    filtrar_y_deduplicar_preguntas(directorio_base_script, archivo_de_entrada, archivo_de_salida)
