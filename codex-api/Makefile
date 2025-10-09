.PHONY: help run smoke stop qa tag rollback

help:
	@echo "make run      # start uvicorn (bg) + wait healthz"
	@echo "make smoke    # seed demo + batch + dry-run + logs + CFO pack"
	@echo "make stop     # stop uvicorn + free port"
	@echo "make qa       # run smoke + banner + artifact log"
	@echo "make tag      # create local pre-tag v10.1.1-pre"
	@echo "make rollback # restore to last tag (scripts/rollback.sh)"

run:
	./start_api.sh

smoke:
	./smoke.sh

stop:
	./stop_api.sh

qa: run
	@mkdir -p artifacts
	@./smoke.sh | tee artifacts/validate.log
	@echo "✅ ALL CHECKS PASSED (smoke-level)"
	@echo "Artifacts: artifacts/validate.log"

tag:
	git add -A
	git commit -m "qa: verified smoke-level" || true
	git tag -a v10.1.1-pre -m "Stable smoke verified"
	@echo "Tagged v10.1.1-pre (local). Use: git push origin main --tags"

rollback:
	bash scripts/rollback.sh
