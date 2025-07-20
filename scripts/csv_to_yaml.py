import csv
import os
import yaml
import sys

def convert_csv_to_yaml(csv_file, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    with open(csv_file, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            yaml_data = {
                "title": row["title"],
                "trigger_type": row.get("trigger_type", "manual"),
                "complexity": row.get("complexity", "low"),
                "credit_cost": float(row.get("credit_estimate", 0.3)),
                "persona": row.get("persona", "Zeyti"),
                "vertical": row.get("vertical", "general"),
                "fallback_supported": row.get("premium_required", "false").lower() == "true"
            }
            filename = row["title"].replace(" ", "_").lower() + ".yaml"
            with open(os.path.join(out_dir, filename), 'w') as yamlfile:
                yaml.dump(yaml_data, yamlfile, sort_keys=False)

if __name__ == "__main__":
    csv_file = sys.argv[1]
    out_dir = sys.argv[2]
    convert_csv_to_yaml(csv_file, out_dir)

