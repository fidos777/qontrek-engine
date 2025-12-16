# Qontrek Engine

Core runtime & agent configs for SME AutoBiz OS.  
This repo manages the **engine** logic while offloading flows into a submodule (`qontrek-flows`).  

---

## 🔹 Structure


qontrek-engine/
├─ agents/ # Prompt configs per agent
├─ batch/ # Batch scripts (codex loader, runtime sync)
├─ config/ # Persona, credentials, pricing
├─ retriever/ # Agent selector + config
├─ scripts/ # Utility scripts (csv loader, log writer, etc.)
├─ taskmeta/ # Task JSON metadata
├─ flows/ (submodule) # Linked to qontrek-flows repo
├─ .github/workflows/ # CI workflows
└─ README.md


---

## 🔹 Flows as Submodule

The `flows/` directory is tracked as a **git submodule** → points to [fidos777/qontrek-flows](https://github.com/fidos777/qontrek-flows).  

Clone with submodules:

```bash
git clone --recurse-submodules git@github.com:fidos777/qontrek-engine.git


If already cloned:

git submodule update --init --recursive

🔹 CI/CD

GitHub Actions workflow (.github/workflows/ci.yml) ensures:

Repo + submodules checkout correctly (using CI_GITHUB_TOKEN)

Lint / test steps can be extended

🔹 Test Branch Protection

This dummy section was added to test branch protection rules:

## Test Branch Protection
This is a dummy line to test pull request workflow.


✅ Clean & ready — no merge conflict markers.
test governance trigger

