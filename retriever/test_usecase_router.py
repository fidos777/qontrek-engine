# retriever/test_usecase_router.py

from retriever.agent_selector import get_agent_from_usecase, get_all_usecases

usecase = "shopee_leads"
agent_config = get_agent_from_usecase(usecase)

print(f"Usecase: {usecase}")
print(f"Primary: {agent_config['primary']} | Fallback: {agent_config['fallback']}")
print("\nAll available usecases:")
print(get_all_usecases())

