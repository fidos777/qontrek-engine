import os
import sys
import hashlib
from agent_logger import log_agent_run
from agent_config import load_prompt

# Get agent name from CLI
agent_name = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == "--agent" else None

if not agent_name:
    print("Usage: python3 agent_runner.py --agent <AgentName>")
    sys.exit(1)

try:
    # Load prompt
    prompt = load_prompt(agent_name)

    # Simulated response (you can replace this)
    print(f"🤖 [{agent_name}] Activated!")
    print(f"🗣️ Prompt: {prompt}")
    response = f"Hai! Saya {agent_name}. Ada yang saya boleh bantu hari ini?"
    print(f"💬 Response:\n{response}")

    # Log success to Supabase
    log_agent_run(
        agent_name=agent_name,
        prompt_hash=hashlib.md5(prompt.encode()).hexdigest(),
        status="success",
        error_msg=None,
        user_id="60d583aa-1b3e-4478-bc29-5ff5450cc271"
    )

except Exception as e:
    print(f"❌ Error: {str(e)}")

    # Log failure to Supabase
    log_agent_run(
        agent_name=agent_name,
        prompt_hash=hashlib.md5(prompt.encode()).hexdigest() if 'prompt' in locals() else "hash-error",
        status="fail",
        error_msg=str(e),
        user_id="60d583aa-1b3e-4478-bc29-5ff5450cc271"
    )

