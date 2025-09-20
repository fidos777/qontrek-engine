PYTHON ?= python3

.PHONY: setup preflight test run-demo

setup:
@if [ -f requirements.txt ]; then \
$(PYTHON) -m pip install -r requirements.txt; \
else echo "requirements.txt not found, skipping dependency install"; \
fi

preflight:
$(PYTHON) scripts/preflight.py

test:
$(PYTHON) -m pytest -q

run-demo:
@echo "Running survey_pending_alert demo for Voltek"
BRAND=Voltek $(PYTHON) agent_runner.py --flow survey_pending_alert --tenant-id demo-tenant
@echo "\nRunning survey_pending_alert demo for Perodua"
BRAND=Perodua $(PYTHON) agent_runner.py --flow survey_pending_alert --tenant-id demo-tenant
