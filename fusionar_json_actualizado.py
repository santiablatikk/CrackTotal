import json
import os
import re
import unicodedata

def normalizar_texto_para_letra(texto):
    if not isinstance(texto, str) or not texto:
        return ""
    # Quitar acentos
    nfkd_form = unicodedata.normalize('NFKD', texto)
    texto_sin_acentos = "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    return texto_sin_acentos.lower()

def obtener_primera_letra_valida(texto_normalizado):
    if texto_normalizado and texto_normalizado[0].isalpha():
        return texto_normalizado[0]
    return None

def fusionar_archivos_json(directorio_data, archivos_a_fusionar, archivo_salida_fusion):
    preguntas_por_letra = {} # { 'a': [ {pregunta1}, {pregunta2} ], 'b': [ ... ] }
    preguntas_ya_agregadas = set() # Para evitar duplicados exactos durante la fusión

    print(f"Archivos a fusionar: {archivos_a_fusionar}")

    for nombre_archivo in archivos_a_fusionar:
        ruta_archivo = os.path.join(directorio_data, nombre_archivo)
        print(f"Procesando archivo: {ruta_archivo}")
        try:
            with open(ruta_archivo, 'r', encoding='utf-8') as f:
                contenido = json.load(f)
            
            lista_preguntas_archivo = []
            if isinstance(contenido, list):
                # El archivo es una lista de preguntas directamente, o una lista de secciones
                for item in contenido:
                    if isinstance(item, dict) and "pregunta" in item and "respuesta" in item:
                        lista_preguntas_archivo.append(item)
                    elif isinstance(item, dict) and "preguntas" in item and isinstance(item.get("preguntas"), list):
                        # Es una sección con una lista de preguntas
                        lista_preguntas_archivo.extend(item["preguntas"])
            elif isinstance(contenido, dict) and "preguntas" in contenido and isinstance(contenido.get("preguntas"), list):
                # El archivo es un objeto con una clave "preguntas"
                 lista_preguntas_archivo = contenido["preguntas"]
            else:
                print(f"  Advertencia: El archivo {nombre_archivo} no tiene el formato esperado (lista de preguntas o dict con 'preguntas'). Se omitirá.")
                continue

            print(f"  Encontradas {len(lista_preguntas_archivo)} preguntas en {nombre_archivo}")
            for pregunta_item in lista_preguntas_archivo:
                if not isinstance(pregunta_item, dict) or "pregunta" not in pregunta_item or "respuesta" not in pregunta_item:
                    # print(f"    Omitiendo item mal formado: {pregunta_item}")
                    continue

                pregunta_original = pregunta_item.get("pregunta")
                respuesta_original = pregunta_item.get("respuesta")

                # Evitar duplicados exactos (pregunta, respuesta) durante la fase de fusión
                # Normalizamos muy básicamente para esta comprobación
                pregunta_norm_simple = str(pregunta_original).strip().lower()
                respuesta_norm_simple = str(respuesta_original).strip().lower()
                
                if (pregunta_norm_simple, respuesta_norm_simple) in preguntas_ya_agregadas:
                    # print(f"    Omitiendo duplicado exacto durante fusión: {pregunta_original} / {respuesta_original}")
                    continue
                
                letra_normalizada = normalizar_texto_para_letra(respuesta_original)
                primera_letra = obtener_primera_letra_valida(letra_normalizada)

                if primera_letra:
                    if primera_letra not in preguntas_por_letra:
                        preguntas_por_letra[primera_letra] = []
                    preguntas_por_letra[primera_letra].append(pregunta_item)
                    preguntas_ya_agregadas.add((pregunta_norm_simple, respuesta_norm_simple))
                # else:
                    # print(f"    Respuesta sin letra inicial válida: {respuesta_original}")


        except FileNotFoundError:
            print(f"  Error: Archivo {nombre_archivo} no encontrado.")
        except json.JSONDecodeError:
            print(f"  Error: Archivo {nombre_archivo} no es un JSON válido.")
        except Exception as e:
            print(f"  Error inesperado procesando {nombre_archivo}: {e}")

    # Convertir el diccionario a la lista de formato esperado por procesador_preguntas_experto.py
    # [{'letra': 'A', 'preguntas': [...]}, {'letra': 'B', 'preguntas': [...]}]
    resultado_formateado = []
    for letra_ordenada in sorted(preguntas_por_letra.keys()):
        resultado_formateado.append({
            "letra": letra_ordenada.upper(), # Guardamos la letra de la sección en mayúscula
            "preguntas": preguntas_por_letra[letra_ordenada]
        })
    
    try:
        with open(archivo_salida_fusion, 'w', encoding='utf-8') as f:
            json.dump(resultado_formateado, f, ensure_ascii=False, indent=2)
        print(f"Fusión completada. {len(preguntas_ya_agregadas)} preguntas únicas agrupadas guardadas en '{archivo_salida_fusion}'.")
        print(f"Total de secciones por letra: {len(resultado_formateado)}")
    except IOError:
        print(f"Error al escribir el archivo de salida fusionado '{archivo_salida_fusion}'.")

if __name__ == "__main__":
    directorio_base_data = "data"
    
    # Lista obtenida anteriormente, excluyendo niveles y procesados intermedios
    archivos_fuente = [
        "all_questions_merged_v5.json",
        "final_questions_pasalache.json",
        "pasapalabra.json",
        "questions.json",
        "generated_questions_set_2.json",
        "new_questions.json",
        "questions_pasapalabra.json"
    ]
    
    nombre_archivo_fusionado_salida = os.path.join(directorio_base_data, "consolidado_para_procesar_v2.json")
    
    fusionar_archivos_json(directorio_base_data, archivos_fuente, nombre_archivo_fusionado_salida)

    print(f"\nPara procesar este archivo fusionado, ejecuta:")
    print(f"python procesador_preguntas_experto.py")
    print(f"Cuando te pida el archivo de entrada, usa: {nombre_archivo_fusionado_salida}")
    print(f"Y como archivo de salida, por ejemplo: data/preguntas_ultra_filtradas_v2.json") 