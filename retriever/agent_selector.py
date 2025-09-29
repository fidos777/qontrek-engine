# retriever/agent_selector.py

try:
    import yaml  # type: ignore
except ModuleNotFoundError:  # pragma: no cover - simple fallback for test environments
    class _MiniYaml:
        """Very small YAML subset loader for key/value maps."""

        @staticmethod
        def safe_load(stream):
            if hasattr(stream, "read"):
                content = stream.read()
            else:
                content = stream
            config = {}
            current_key = None
            for raw_line in str(content).splitlines():
                line = raw_line.strip("\n")
                if not line.strip() or line.lstrip().startswith("#"):
                    continue
                if not raw_line.startswith(" "):
                    key = line.split(":", 1)[0].strip()
                    config[key] = {}
                    current_key = key
                elif current_key is not None and ":" in line:
                    sub_key, value = line.split(":", 1)
                    config[current_key][sub_key.strip()] = value.strip()
            return config

    yaml = _MiniYaml()  # type: ignore

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
