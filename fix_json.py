import json
import os

# Verificar que el archivo existe
file_path = 'data/questions_fixed.json'

if not os.path.exists(file_path):
    print(f"El archivo {file_path} no existe")
    exit(1)

try:
    # Intentar leer el archivo
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"Archivo encontrado con {len(lines)} líneas")
    
    # Mostrar las primeras 5 líneas
    print("Primeras 5 líneas:")
    for i in range(min(5, len(lines))):
        print(f"{i+1}: {lines[i].strip()}")
    
    # Verificar las últimas 5 líneas para ver si el archivo está completo
    print("\nÚltimas 5 líneas:")
    for i in range(max(0, len(lines)-5), len(lines)):
        print(f"{i+1}: {lines[i].strip()}")
    
    # Intentar solucionar el problema de formato
    if len(lines) > 0:
        content = ''.join(lines)
        # Intentar forzar el cierre correcto del JSON si está incompleto
        if not content.strip().endswith(']'):
            print("\nEl archivo parece estar incompleto o malformado, intentando corregir...")
            content = content.strip()
            # Si hay un objeto incompleto al final
            if content.endswith(','):
                content = content[:-1] + ']'
            elif not content.endswith(']'):
                content += ']'
            
            # Guardar el archivo corregido
            with open('data/questions_fixed_temp.json', 'w', encoding='utf-8') as f:
                f.write(content)
            
            print("Se ha creado un archivo temporal 'data/questions_fixed_temp.json'")
            
            # Verificar si el JSON corregido es válido
            try:
                json.loads(content)
                print("El archivo corregido parece ser un JSON válido.")
            except json.JSONDecodeError as e:
                print(f"El archivo corregido sigue teniendo problemas: {e}")

except Exception as e:
    print(f"Error inesperado: {e}") 