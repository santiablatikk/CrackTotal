import json
import os
from collections import defaultdict

# Define all input files
input_files = [
    "data/questions.json",
    "data/questions_pasapalabra.json",
    "data/pasapalabra.json",
    "data/new_questions.json",
    "data/generated_questions_set_2.json",
    "data/final_questions_pasalache.json"
]

# Initialize a dictionary to hold all questions by letter
all_questions = defaultdict(list)

# Set to track unique questions to avoid duplicates
unique_questions = set()

# Process each file
for file_path in input_files:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
    
    print(f"Processing: {file_path}")
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            
            # Handle different possible structures
            if isinstance(data, list):
                # List of letter objects
                for letter_obj in data:
                    letter = letter_obj.get("letra", "")
                    preguntas = letter_obj.get("preguntas", [])
                    
                    if letter and preguntas:
                        for pregunta in preguntas:
                            # Create a unique key for deduplication
                            q_text = pregunta.get("pregunta", "").strip().lower()
                            r_text = pregunta.get("respuesta", "").strip().lower()
                            
                            if q_text and r_text:
                                key = f"{q_text}|{r_text}"
                                if key not in unique_questions:
                                    unique_questions.add(key)
                                    all_questions[letter].append({
                                        "pregunta": pregunta.get("pregunta"),
                                        "respuesta": pregunta.get("respuesta")
                                    })
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

# Create the final structure
final_data = []
for letter in sorted(all_questions.keys()):
    questions = all_questions[letter]
    if questions:
        final_data.append({
            "letra": letter,
            "preguntas": questions
        })

# Save the merged result
output_file = "data/all_questions_merged.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)

print(f"Merged file created: {output_file}")
print(f"Total letters: {len(final_data)}")
total_questions = sum(len(letter_obj['preguntas']) for letter_obj in final_data)
print(f"Total questions: {total_questions}") 