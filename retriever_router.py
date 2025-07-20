import yaml

def get_agent_from_usecase(usecase, yaml_path="retriever/config/agent_picker.yaml"):
    with open(yaml_path, 'r') as f:
        config = yaml.safe_load(f)
    return config.get(usecase, {"primary": "Zeyti", "fallback": "Zamer"})  # fallback default

