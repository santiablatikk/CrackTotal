import json
import re

def validate_level_file(filename):
    print(f"\n=== Validando {filename} ===")
    
    with open(f'data/{filename}', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Contar manualmente las apariciones
    pregunta_count = len(re.findall(r'"pregunta"\s*:', content))
    respuesta_count = len(re.findall(r'"respuesta_correcta"\s*:', content))
    
    print(f"Conteo manual con regex:")
    print(f"  'pregunta': {pregunta_count}")
    print(f"  'respuesta_correcta': {respuesta_count}")
    
    try:
        data = json.load(open(f'data/{filename}', 'r', encoding='utf-8'))
        json_preguntas = len(data['preguntas'])
        print(f"Conteo JSON: {json_preguntas} preguntas")
        
        # Validar cada pregunta
        problems = []
        for i, q in enumerate(data['preguntas']):
            if 'pregunta' not in q:
                problems.append(f"Pregunta {i+1}: Falta campo 'pregunta'")
            elif not isinstance(q.get('pregunta'), str):
                problems.append(f"Pregunta {i+1}: 'pregunta' no es string")
            
            if 'respuesta_correcta' not in q:
                problems.append(f"Pregunta {i+1}: Falta campo 'respuesta_correcta'")
            elif not isinstance(q.get('respuesta_correcta'), str):
                problems.append(f"Pregunta {i+1}: 'respuesta_correcta' no es string")
            elif not q.get('respuesta_correcta'):
                problems.append(f"Pregunta {i+1}: 'respuesta_correcta' está vacío")
        
        if problems:
            print(f"\nProblemas encontrados ({len(problems)}):")
            for problem in problems:
                print(f"  - {problem}")
        else:
            print("✅ No se encontraron problemas en la validación JSON")
            
    except json.JSONDecodeError as e:
        print(f"❌ Error al parsear JSON: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

# Validar todos los archivos level
for i in range(1, 7):
    validate_level_file(f'level_{i}.json') 