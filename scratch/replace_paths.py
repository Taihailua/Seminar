import os
import glob
import sys

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content.replace("'/pages/", "'")
    new_content = new_content.replace('"/pages/', '"')
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")

base_dir = r"d:\Work Programs\Seminar\Seminar\frontend"
js_files = glob.glob(os.path.join(base_dir, 'js', '**', '*.js'), recursive=True)
html_files = glob.glob(os.path.join(base_dir, 'pages', '**', '*.html'), recursive=True)

for path in js_files + html_files:
    process_file(path)

print("Done")
