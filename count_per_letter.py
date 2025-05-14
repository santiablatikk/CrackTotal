import json

# Load the questions_fixed.json file
with open('data/questions_fixed.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Count questions per letter
print("Questions per letter in questions_fixed.json:")
total_questions = 0
for letter_obj in sorted(data, key=lambda x: x['letra']):
    letter = letter_obj['letra']
    count = len(letter_obj['preguntas'])
    total_questions += count
    print(f"{letter}: {count}")

print(f"\nTotal questions: {total_questions}")
print(f"Total letters: {len(data)}") 