import json
import shutil

# Simply copy the merged file to the final filename
try:
    shutil.copy2('data/all_questions_merged.json', 'data/questions_final.json')
    print("Successfully created data/questions_final.json")
except Exception as e:
    print(f"Error: {e}") 