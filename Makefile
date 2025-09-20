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
    @echo "Previewing Flow B (send_and_meter) for Voltek"
    $(PYTHON) agent_runner.py --flow flows/send_and_meter.yaml --dry-run --brand Voltek
    @echo "\nPreviewing Flow B (send_and_meter) for Perodua"
    $(PYTHON) agent_runner.py --flow flows/send_and_meter.yaml --dry-run --brand Perodua --tenant-id demo-perodua
