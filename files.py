import os

def generate_tree(start_path, output_file):
    with open(output_file, "w", encoding="utf-8") as f:
        for root, dirs, files in os.walk(start_path):
            level = root.replace(start_path, '').count(os.sep)
            indent = ' ' * 4 * level
            f.write(f"{indent}{os.path.basename(root)}/\n")

            for file in files:
                f.write(f"{indent}    {file}\n")

    print(f"✅ Done! Saved in {output_file}")

# 👇 No input needed
generate_tree(".", "project_structure.txt")