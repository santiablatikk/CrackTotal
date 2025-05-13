import json

# Load the final questions file
with open('data/questions_final.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Count questions per letter
total = 0
print("Questions per letter:")
for letter_obj in data:
    letter = letter_obj['letra']
    count = len(letter_obj['preguntas'])
    total += count
    print(f"{letter}: {count}")

print(f"\nTotal questions: {total}") 