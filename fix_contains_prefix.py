import json
import re

# Cargar el archivo JSON
with open('data/questions_final.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

changes = 0
fixed = 0

# Procesar cada letra
for letter_obj in data:
    letra = letter_obj['letra']
    preguntas = letter_obj['preguntas']
    
    for pregunta in preguntas:
        q_text = pregunta['pregunta']
        r_text = pregunta['respuesta']
        
        # Normalizar texto para comparación (quitar acentos)
        r_text_norm = r_text.lower()
        
        # Verificar si la respuesta comienza con la letra
        starts_with_letter = False
        
        # Primero revisamos si comienza exactamente con la letra
        if r_text_norm.startswith(letra.lower()):
            starts_with_letter = True
        # También revisar si comienza con versiones acentuadas de la letra
        elif letra.lower() == 'a' and any(r_text_norm.startswith(l) for l in ['á', 'à', 'ä', 'â']):
            starts_with_letter = True
        elif letra.lower() == 'e' and any(r_text_norm.startswith(l) for l in ['é', 'è', 'ë', 'ê']):
            starts_with_letter = True
        elif letra.lower() == 'i' and any(r_text_norm.startswith(l) for l in ['í', 'ì', 'ï', 'î']):
            starts_with_letter = True
        elif letra.lower() == 'o' and any(r_text_norm.startswith(l) for l in ['ó', 'ò', 'ö', 'ô']):
            starts_with_letter = True
        elif letra.lower() == 'u' and any(r_text_norm.startswith(l) for l in ['ú', 'ù', 'ü', 'û']):
            starts_with_letter = True
            
        # Verificar si contiene la letra en cualquier posición
        contains_letter = letra.lower() in r_text_norm
        
        # Patrones para detectar el prefijo CONTIENE
        contains_prefix_pattern = re.compile(f"^CONTIENE {letra}:", re.IGNORECASE)
        has_contains_prefix = bool(contains_prefix_pattern.match(q_text))
        
        # Caso 1: Comienza con la letra pero tiene el prefijo CONTIENE incorrectamente
        if starts_with_letter and has_contains_prefix:
            # Eliminar el prefijo incorrecto
            new_q_text = re.sub(contains_prefix_pattern, "", q_text).strip()
            pregunta['pregunta'] = new_q_text
            print(f"Removido prefijo CONTIENE {letra}: de '{q_text}' porque la respuesta '{r_text}' comienza con '{letra}'")
            changes += 1
            
        # Caso 2: No comienza con la letra, pero contiene la letra y no tiene el prefijo CONTIENE
        elif not starts_with_letter and contains_letter and not has_contains_prefix:
            # Añadir el prefijo CONTIENE
            pregunta['pregunta'] = f"CONTIENE {letra}: {q_text}"
            print(f"Añadido prefijo CONTIENE {letra}: a '{q_text}' porque la respuesta '{r_text}' contiene pero no comienza con '{letra}'")
            changes += 1
            
        # Caso 3: No contiene la letra en absoluto (posible error en la asignación)
        elif not contains_letter:
            print(f"ADVERTENCIA: La respuesta '{r_text}' no contiene la letra '{letra}' para la pregunta '{q_text}'")
        else:
            fixed += 1

# Guardar el archivo corregido
with open('data/questions_fixed.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nTotal de preguntas corregidas: {changes}")
print(f"Total de preguntas que ya estaban correctas: {fixed}")
print(f"Archivo guardado como 'data/questions_fixed.json'") 