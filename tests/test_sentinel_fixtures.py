import os, glob, subprocess, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]

def _branch():
    try:
        b = subprocess.check_output(["git","rev-parse","--abbrev-ref","HEAD"], text=True).strip()
    except Exception:
        b = os.getenv("GITHUB_REF_NAME","")
    return b

def _is_main_context():
    b = _branch()
    if b in ("main","master"):
        return True
    # GitHub Actions PRs
    if os.getenv("GITHUB_BASE_REF","") in ("main","master"):
        return True
    # Safety: allow forcing check via env even off-main
    if os.getenv("ENFORCE_OPTION_B_SENTINEL","") == "1":
        return True
    return False

def _fixtures_exist():
    files = []
    files += glob.glob(str(ROOT / "flows/js/*.js"))
    files += glob.glob(str(ROOT / "flows/send_meter.json"))
    return len(files) > 0, files

def test_option_b_fixtures_block_main():
    exists, files = _fixtures_exist()
    if not exists:
        return
    if not _is_main_context():
        # Allow on feature branches
        return
    msg = [
        "Option B local fixtures detected on main/PR->main. Block release.",
        "Files:",
        *[f" - {f}" for f in files],
        "",
        "Action: migrate to Option A (submodule) then remove these files.",
    ]
    raise AssertionError("\n".join(msg))
