# retriever/agent_selector.py

import yaml

DEFAULT_AGENT = {"primary": "Zeyti", "fallback": "Zamer"}
DEFAULT_CONFIG_PATH = "retriever/config/agent_picker.yaml"

def get_agent_from_usecase(usecase, yaml_path=DEFAULT_CONFIG_PATH):
    """
    Given a usecase name, return primary and fallback agent.
    Returns: ("Izara", "Danish")
    """
    try:
        with open(yaml_path, "r") as f:
            config = yaml.safe_load(f)
            agent_pair = config.get(usecase, DEFAULT_AGENT)
            return agent_pair.get("primary", "Zeyti"), agent_pair.get("fallback", "Zamer")
    except FileNotFoundError:
        return DEFAULT_AGENT["primary"], DEFAULT_AGENT["fallback"]

def get_all_usecases(yaml_path=DEFAULT_CONFIG_PATH):
    """
    Returns a list of all usecases defined in the config.
    """
    try:
        with open(yaml_path, "r") as f:
            config = yaml.safe_load(f)
            return list(config.keys())
    except FileNotFoundError:
        return []

