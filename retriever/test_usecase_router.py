# retriever/test_usecase_router.py
from retriever.agent_selector import get_agent_from_usecase, get_all_usecases

usecase = "shopee_leads"
agent_pair = get_agent_from_usecase(usecase)

assert isinstance(agent_pair, tuple) and len(agent_pair) == 2, "Expected a (primary, fallback) tuple"
assert all(isinstance(agent, str) and agent for agent in agent_pair), "Both primary and fallback agents must be non-empty strings"
primary, fallback = agent_pair

print(f"Usecase: {usecase}")
print(f"Primary: {primary} | Fallback: {fallback}")

print("\nAll available usecases:")
print(get_all_usecases())
