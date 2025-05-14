import json
import os

# Verificar que el archivo existe
if not os.path.exists('data/questions_fixed.json'):
    print("El archivo no existe")
    exit(1)

try:
    # Intentar leer el archivo
    with open('data/questions_fixed.json', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Intenta parsear el JSON
    data = json.loads(content)
    
    print(f"Archivo JSON válido con {len(data)} letras")
    
    # Contar y mostrar las letras disponibles
    letras = [item['letra'] for item in data]
    print(f"Letras: {letras}")
    
    # Contar preguntas por letra
    for letra_obj in data:
        print(f"Letra {letra_obj['letra']}: {len(letra_obj['preguntas'])} preguntas")
    
    # Total de preguntas
    total_preguntas = sum(len(item['preguntas']) for item in data)
    print(f"Total de preguntas: {total_preguntas}")

except json.JSONDecodeError as e:
    print(f"Error en el formato JSON: {e}")
    
except Exception as e:
    print(f"Error inesperado: {e}") 