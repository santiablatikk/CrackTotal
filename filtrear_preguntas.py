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

def filtrar_preguntas_por_letra(directorio_base, archivo_entrada_nombre, archivo_salida_nombre):
    """
    Filtra las preguntas de un archivo JSON consolidado.
    La regla es: la respuesta debe comenzar con la letra de la sección (ignorando mayúsculas/minúsculas y acentos).
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
        print("Asegúrate de haber ejecutado primero el script de fusión ('fusionar_json.py')")
        print("o de que el archivo consolidado exista en la ubicación correcta.")
        return
    except json.JSONDecodeError:
        print(f"ERROR: El archivo de entrada '{ruta_archivo_entrada}' no es un JSON válido.")
        return
    except Exception as e:
        print(f"ERROR: Ocurrió un error inesperado al leer '{ruta_archivo_entrada}': {e}")
        return

    datos_filtrados_final = []
    preguntas_eliminadas_count = 0
    preguntas_mantenidas_count = 0

    if not isinstance(datos_consolidados, list):
        print(f"ERROR: El contenido de '{ruta_archivo_entrada}' no es una lista JSON como se esperaba.")
        return

    for seccion in datos_consolidados:
        if not isinstance(seccion, dict) or "letra" not in seccion or "preguntas" not in seccion:
            print(f"ADVERTENCIA: Sección con formato incorrecto omitida: {seccion}")
            continue

        letra_seccion = seccion["letra"]
        preguntas_seccion = seccion["preguntas"]
        
        if not isinstance(letra_seccion, str) or len(letra_seccion) != 1:
            print(f"ADVERTENCIA: Letra de sección inválida '{letra_seccion}'. Omitiendo sección.")
            continue
            
        letra_seccion_normalizada = normalizar_texto(letra_seccion)
        
        preguntas_filtradas_para_seccion = []
        
        if not isinstance(preguntas_seccion, list):
            print(f"ADVERTENCIA: 'preguntas' no es una lista para la letra '{letra_seccion}'. Omitiendo sección.")
            continue

        for pregunta_obj in preguntas_seccion:
            if not isinstance(pregunta_obj, dict) or "pregunta" not in pregunta_obj or "respuesta" not in pregunta_obj:
                print(f"ADVERTENCIA: Objeto de pregunta con formato incorrecto omitido en letra '{letra_seccion}': {pregunta_obj}")
                # Si queremos ser estrictos y eliminarla si está mal formateada:
                # preguntas_eliminadas_count +=1 
                continue

            respuesta = pregunta_obj.get("respuesta", "") # Usar get para evitar KeyError si falta
            
            if not respuesta or not isinstance(respuesta, str): # Si la respuesta está vacía o no es string
                # print(f"  INFO: Pregunta con respuesta vacía o no string en letra '{letra_seccion}'. Se mantiene por defecto o se puede cambiar la lógica para eliminarla.")
                # print(f"  Pregunta: {pregunta_obj.get('pregunta')}")
                # Por ahora, la mantenemos si no podemos aplicar la regla.
                # Si se quisiera eliminar: preguntas_eliminadas_count += 1; continue
                preguntas_filtradas_para_seccion.append(pregunta_obj)
                preguntas_mantenidas_count += 1
                continue

            primera_letra_respuesta_normalizada = normalizar_texto(respuesta[0])

            if primera_letra_respuesta_normalizada == letra_seccion_normalizada:
                preguntas_filtradas_para_seccion.append(pregunta_obj)
                preguntas_mantenidas_count += 1
            else:
                # print(f"  Eliminando: Letra '{letra_seccion}', Respuesta '{respuesta}' (Normalizado: '{primera_letra_respuesta_normalizada}' vs '{letra_seccion_normalizada}')")
                preguntas_eliminadas_count += 1
        
        if preguntas_filtradas_para_seccion: # Solo añadir la sección si aún tiene preguntas
            datos_filtrados_final.append({
                "letra": letra_seccion,
                "preguntas": preguntas_filtradas_para_seccion
            })

    try:
        with open(ruta_archivo_salida, 'w', encoding='utf-8') as f_out:
            json.dump(datos_filtrados_final, f_out, ensure_ascii=False, indent=2)
        print(f"\n¡Filtrado completado!")
        print(f"Preguntas mantenidas: {preguntas_mantenidas_count}")
        print(f"Preguntas eliminadas por no cumplir la regla: {preguntas_eliminadas_count}")
        print(f"Los datos filtrados se han guardado en: {ruta_archivo_salida}")
    except Exception as e:
        print(f"\nERROR: No se pudo escribir el archivo de salida {ruta_archivo_salida}: {e}")

if __name__ == "__main__":
    directorio_base_script = "data" # Asume que consolidated_questions.json está en 'data'
    archivo_entrada = "consolidated_questions.json"
    archivo_salida = "consolidated_questions_filtered.json" # Se guardará en el mismo directorio base

    filtrar_preguntas_por_letra(directorio_base_script, archivo_entrada, archivo_salida)
