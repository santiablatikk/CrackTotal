import json

# Read the merged file
with open('data/all_questions_merged.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Count questions per letter
total_questions = sum(len(letter_obj['preguntas']) for letter_obj in data)
print(f"Total questions: {total_questions}")

# Minimal cleanup of the questions
for letter_obj in data:
    for pregunta in letter_obj['preguntas']:
        # Clean up any trailing/leading spaces
        pregunta['pregunta'] = pregunta['pregunta'].strip()
        pregunta['respuesta'] = pregunta['respuesta'].strip()

# Save the final cleaned version
with open('data/questions_final.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Final version saved to data/questions_final.json") 