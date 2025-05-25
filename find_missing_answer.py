import json

# Cargar el archivo level_6.json
with open('data/level_6.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total de preguntas en level_6.json: {len(data['preguntas'])}")

# Buscar preguntas con problemas
missing_answers = []
empty_answers = []
invalid_answers = []

for i, pregunta in enumerate(data['preguntas']):
    # Verificar si falta respuesta_correcta
    if 'respuesta_correcta' not in pregunta:
        missing_answers.append({
            'index': i,
            'pregunta': pregunta.get('pregunta', 'PREGUNTA NO ENCONTRADA')
        })
        print(f"Pregunta {i+1} SIN respuesta_correcta:")
        print(f"  {pregunta.get('pregunta', 'PREGUNTA NO ENCONTRADA')}")
        print()
    
    # Verificar si respuesta_correcta está vacía
    elif not pregunta['respuesta_correcta']:
        empty_answers.append({
            'index': i,
            'pregunta': pregunta.get('pregunta', 'PREGUNTA NO ENCONTRADA')
        })
        print(f"Pregunta {i+1} CON respuesta_correcta VACÍA:")
        print(f"  {pregunta.get('pregunta', 'PREGUNTA NO ENCONTRADA')}")
        print(f"  respuesta_correcta: '{pregunta['respuesta_correcta']}'")
        print()
    
    # Verificar si respuesta_correcta no es string
    elif not isinstance(pregunta['respuesta_correcta'], str):
        invalid_answers.append({
            'index': i,
            'pregunta': pregunta.get('pregunta', 'PREGUNTA NO ENCONTRADA'),
            'respuesta_type': type(pregunta['respuesta_correcta'])
        })
        print(f"Pregunta {i+1} CON respuesta_correcta NO ES STRING:")
        print(f"  {pregunta.get('pregunta', 'PREGUNTA NO ENCONTRADA')}")
        print(f"  respuesta_correcta: {pregunta['respuesta_correcta']} (tipo: {type(pregunta['respuesta_correcta'])})")
        print()

print(f"Resumen:")
print(f"- Preguntas sin respuesta_correcta: {len(missing_answers)}")
print(f"- Preguntas con respuesta_correcta vacía: {len(empty_answers)}")
print(f"- Preguntas con respuesta_correcta no string: {len(invalid_answers)}")
print(f"- Total de problemas: {len(missing_answers) + len(empty_answers) + len(invalid_answers)}") 