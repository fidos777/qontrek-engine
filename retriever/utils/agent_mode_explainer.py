# retriever/utils/agent_mode_explainer.py

def explain_agent_mode(agent_name):
    """
    Explain why this agent was selected and what its fallback/setup is.
    Returns a human-readable string for demo/debug mode.
    """
    explanations = {
        "Izara": {
            "role": "Lead educator",
            "tools": ["lead_parser.py", "browserless"],
            "fallback": "Danish",
            "reason": "Selected for first contact lead education via WhatsApp. Uses parser and vision if needed."
        },
        "Danish": {
            "role": "ROI calculator",
            "tools": ["roi_calc.py"],
            "fallback": "Zeyti",
            "reason": "Triggered after Izara to calculate savings & payback using client data."
        },
        "Zeyti": {
            "role": "Follow-up engine",
            "tools": ["selector_tool.py"],
            "fallback": "Zamer",
            "reason": "Handles follow-up. Selected when ROI is above threshold. Uses tool selector."
        },
        "Zamer": {
            "role": "Reminder/escalation agent",
            "tools": [],
            "fallback": "Tawfiq",
            "reason": "Selected to send reminders or escalate leads that stall."
        },
        "Tawfiq": {
            "role": "Logger & QA agent",
            "tools": ["agent_logger.py"],
            "fallback": None,
            "reason": "Logs failed runs, triggers QA reports. Final fallback for broken chains."
        },
        "Azmir": {
            "role": "Error recovery & diagnostics",
            "tools": ["debug_tool.py"],
            "fallback": None,
            "reason": "Activated if unknown errors occur. Helps trace problems and recover session."
        },
    }

    info = explanations.get(agent_name)
    if not info:
        return f"⚠️ No explanation found for agent: {agent_name}"

    lines = [
        f"🧠 Agent Name: {agent_name}",
        f"📌 Role: {info['role']}",
        f"🛠️ Tools: {', '.join(info['tools']) if info['tools'] else 'None'}",
        f"🔁 Fallback: {info['fallback'] or 'None'}",
        f"📝 Reason: {info['reason']}"
    ]
    return "\n".join(lines)

