import requests

def template_guard(block):
    if len(block.get("body", "")) > 1024:
        raise ValueError("Template body too long")

    if block.get("header_type") == "image" and not block.get("image_url"):
        raise ValueError("Missing image_url for image header")

    return True

def gpt_qualifier_score(lead_input):
    url = "https://mocked-url/score"
    res = requests.post(url, json=lead_input)
    return res.json().get("intent_score", 0)

