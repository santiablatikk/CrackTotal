import json

# Load the current questions_fixed.json
with open('data/questions_fixed.json', 'r', encoding='utf-8') as f:
    fixed_data = json.load(f)

# Load questions_final.json which has all the letters
with open('data/questions_final.json', 'r', encoding='utf-8') as f:
    final_data = json.load(f)

# Get existing letters in questions_fixed.json
existing_letters = [item['letra'] for item in fixed_data]
print(f"Existing letters in questions_fixed.json: {existing_letters}")

# Fix the U/I issue - first, find the duplicate "I" entry that should be "U"
u_indices = []
i_indices = []

for i, letter_obj in enumerate(fixed_data):
    if letter_obj['letra'] == 'I' and any("Uruguay" in pregunta['respuesta'] for pregunta in letter_obj['preguntas']):
        print(f"Found wrong I entry that should be U at index {i}")
        fixed_data[i]['letra'] = 'U'  # Change to U
    
    # Keep track of all I and U entries for later processing
    if letter_obj['letra'] == 'I':
        i_indices.append(i)
    elif letter_obj['letra'] == 'U':
        u_indices.append(i)

# Add missing letters from questions_final.json
added_letters = []
for letter_obj in final_data:
    letter = letter_obj['letra']
    if letter not in existing_letters and letter != 'U':  # Skip U since we already fixed the I->U
        fixed_data.append(letter_obj)
        added_letters.append(letter)

print(f"Added letters: {added_letters}")

# Remove duplicates by creating a new list with unique letter entries
unique_data = []
seen_letters = set()

for item in fixed_data:
    letter = item['letra']
    if letter not in seen_letters:
        unique_data.append(item)
        seen_letters.add(letter)
    else:
        # If duplicate, merge the questions
        for i, existing in enumerate(unique_data):
            if existing['letra'] == letter:
                # Get existing questions
                existing_questions = {q['pregunta']: q for q in existing['preguntas']}
                
                # Add new questions if not duplicates
                for q in item['preguntas']:
                    if q['pregunta'] not in existing_questions:
                        unique_data[i]['preguntas'].append(q)
                
                print(f"Merged {len(item['preguntas'])} questions for duplicate letter {letter}")
                break

# Save the updated questions_fixed.json
with open('data/questions_fixed.json', 'w', encoding='utf-8') as f:
    json.dump(unique_data, f, ensure_ascii=False, indent=2)

# Verify final letters
final_letters = sorted([item['letra'] for item in unique_data])
print(f"Final letters in questions_fixed.json: {final_letters}")
print(f"Total letters now in questions_fixed.json: {len(unique_data)}") 