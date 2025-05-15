import json
import os

def fusionar_archivos_json(directorio_entrada, archivo_salida, archivos_a_excluir):
    """
    Fusiona múltiples archivos JSON de preguntas en uno solo.

    Cada archivo JSON de entrada debe ser una lista de objetos, donde cada objeto
    tiene una clave "letra" y una clave "preguntas" (una lista de diccionarios
    con "pregunta" y "respuesta").
    """
    datos_consolidados_por_letra = {}
    archivos_procesados = []
    archivos_fallidos = []

    print(f"Directorio de entrada: {directorio_entrada}")
    print(f"Archivo de salida: {archivo_salida}")
    print(f"Archivos a excluir: {archivos_a_excluir}")

    for nombre_archivo in os.listdir(directorio_entrada):
        if nombre_archivo.endswith(".json") and nombre_archivo not in archivos_a_excluir:
            ruta_completa = os.path.join(directorio_entrada, nombre_archivo)
            print(f"Procesando archivo: {ruta_completa}...")
            try:
                with open(ruta_completa, 'r', encoding='utf-8') as f:
                    contenido_archivo = json.load(f)
                
                if not isinstance(contenido_archivo, list):
                    print(f"  ADVERTENCIA: El archivo {nombre_archivo} no contiene una lista JSON en la raíz. Omitiendo.")
                    archivos_fallidos.append(f"{nombre_archivo} (no es una lista)")
                    continue

                for item_letra in contenido_archivo:
                    if not isinstance(item_letra, dict):
                        print(f"  ADVERTENCIA: Item no es un diccionario en {nombre_archivo}. Omitiendo item: {item_letra}")
                        continue
                    
                    letra = item_letra.get("letra")
                    preguntas_nuevas = item_letra.get("preguntas")

                    if not letra or not isinstance(preguntas_nuevas, list):
                        print(f"  ADVERTENCIA: Formato incorrecto para el item de letra '{letra}' en {nombre_archivo}. Omitiendo.")
                        continue

                    if letra not in datos_consolidados_por_letra:
                        datos_consolidados_por_letra[letra] = []
                    
                    # Para evitar duplicados exactos dentro de la misma letra
                    preguntas_existentes_text = { (p["pregunta"], p["respuesta"]) for p in datos_consolidados_por_letra[letra] }

                    for pregunta_nueva_obj in preguntas_nuevas:
                        if isinstance(pregunta_nueva_obj, dict) and "pregunta" in pregunta_nueva_obj and "respuesta" in pregunta_nueva_obj:
                            pregunta_tuple = (pregunta_nueva_obj["pregunta"], pregunta_nueva_obj["respuesta"])
                            if pregunta_tuple not in preguntas_existentes_text:
                                datos_consolidados_por_letra[letra].append(pregunta_nueva_obj)
                                preguntas_existentes_text.add(pregunta_tuple)
                        else:
                            print(f"  ADVERTENCIA: Formato de pregunta incorrecto en {nombre_archivo} para letra {letra}. Omitiendo: {pregunta_nueva_obj}")


                archivos_procesados.append(nombre_archivo)
                print(f"  '{nombre_archivo}' procesado exitosamente.")

            except json.JSONDecodeError:
                print(f"  ERROR: El archivo {nombre_archivo} no es un JSON válido. Omitiendo.")
                archivos_fallidos.append(f"{nombre_archivo} (JSON inválido)")
            except Exception as e:
                print(f"  ERROR: Ocurrió un error inesperado con {nombre_archivo}: {e}. Omitiendo.")
                archivos_fallidos.append(f"{nombre_archivo} (Error: {e})")
        elif nombre_archivo in archivos_a_excluir:
            print(f"Omitiendo archivo excluido: {nombre_archivo}")
        elif not nombre_archivo.endswith(".json"):
            print(f"Omitiendo archivo no JSON: {nombre_archivo}")


    # Convertir el diccionario consolidado al formato de lista final
    lista_final_consolidada = []
    for letra_ordenada in sorted(datos_consolidados_por_letra.keys()):
        lista_final_consolidada.append({
            "letra": letra_ordenada,
            "preguntas": datos_consolidados_por_letra[letra_ordenada]
        })

    # Guardar el resultado
    try:
        with open(archivo_salida, 'w', encoding='utf-8') as f_out:
            json.dump(lista_final_consolidada, f_out, ensure_ascii=False, indent=2)
        print(f"\n¡Fusión completada! Los datos consolidados se han guardado en: {archivo_salida}")
        print(f"Total de archivos procesados: {len(archivos_procesados)}")
        if archivos_procesados:
            print("Archivos incluidos en la fusión:")
            for ap in archivos_procesados:
                print(f"  - {ap}")
        if archivos_fallidos:
            print("\nArchivos que no pudieron ser procesados o fueron omitidos por errores:")
            for af in archivos_fallidos:
                print(f"  - {af}")

    except Exception as e:
        print(f"\nERROR: No se pudo escribir el archivo de salida {archivo_salida}: {e}")


if __name__ == "__main__":
    directorio_de_jsons = "data"  # Cambia esto si tus JSONs están en otra carpeta
    nombre_archivo_consolidado = os.path.join(directorio_de_jsons, "consolidated_questions.json")
    
    archivos_excluidos = [
        "level_1.json", 
        "level_2.json", 
        "level_3.json", 
        "level_4.json", 
        "level_5.json", 
        "level_6.json",
        "consolidated_questions.json" # Para no incluirse a sí mismo si se ejecuta varias veces
    ]

    fusionar_archivos_json(directorio_de_jsons, nombre_archivo_consolidado, archivos_excluidos)
