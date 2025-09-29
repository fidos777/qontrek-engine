# Qontrek Engine

Core runtime & agent configs powering **SME AutoBiz OS**.  
This repo hosts the engine (agents, retrievers, configs, scripts) and links to runbook flows via a submodule.

---

## 📂 Structure

- `agents/` → AI agent prompt configs
- `config/` → matrices & pricing maps
- `scripts/` → runtime tools (loggers, loaders, etc.)
- `flows/` → **submodule** pointing to [qontrek-flows](https://github.com/fidos777/qontrek-flows)

---

## 🚀 Getting Started

### Clone with submodules
```bash
git clone --recurse-submodules git@github.com:fidos777/qontrek-engine.git
cd qontrek-engine

