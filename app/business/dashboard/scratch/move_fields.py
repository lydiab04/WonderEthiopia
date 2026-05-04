import sys

path = r'c:\Users\Amor\Desktop\WondarEthiopia\wonderethiopia\app\business\dashboard\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

chauffeur_idx = -1
language_start = -1
language_end = -1

for i, line in enumerate(lines):
    if 'driverExperience' in line and 1880 < i < 1920:
        chauffeur_idx = i
    if 'Driver Languages' in line and 1880 < i < 1920:
        # Assuming the div starts 1 line before and ends 2 lines after
        language_start = i - 1
        language_end = i + 2

if chauffeur_idx != -1 and language_start != -1:
    lang_block = lines[language_start : language_end + 1]
    # Remove
    lines_to_keep = lines[:language_start] + lines[language_end + 1:]
    
    # Re-find chauffeur_idx in the new list
    new_chauffeur_idx = -1
    for i, line in enumerate(lines_to_keep):
        if 'driverExperience' in line and 1880 < i < 1920:
            new_chauffeur_idx = i
            break
            
    if new_chauffeur_idx != -1:
        # Insert after the experience block end (div)
        # Experience is usually 3 lines
        lines_to_keep.insert(new_chauffeur_idx + 2, "".join(lang_block))
        
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(lines_to_keep)
        print("Success")
    else:
        print("Failed to re-find chauffeur")
else:
    print(f"Failed to find: chauffeur={chauffeur_idx}, language={language_start}")
