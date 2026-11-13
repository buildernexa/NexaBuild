#!/usr/bin/env python3
"""Static integrity checks for NexaBuild dashboard and embedded APK workflow."""
from __future__ import annotations
import base64, json, re, sys
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []

def require(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)

# Required static app files.
for rel in ("index.html", "manifest.json", "sw.js", "privacy.html", "css/app.css"):
    require((ROOT / rel).is_file(), f"File wajib tidak ditemukan: {rel}")

# JSON manifest must be parseable and have installable PWA metadata.
try:
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    require(bool(manifest.get("name")), "manifest.name kosong")
    require(bool(manifest.get("start_url")), "manifest.start_url kosong")
    require(bool(manifest.get("icons")), "manifest.icons kosong")
    for icon in manifest.get("icons", []):
        require((ROOT / icon.get("src", "__missing__")).is_file(),
                f"Ikon manifest tidak ditemukan: {icon.get('src')}")
except Exception as exc:
    errors.append(f"manifest.json tidak valid: {exc}")

# Decode the actual workflow template the dashboard publishes to apk-builder.
template_file = ROOT / "js/template.js"
source = template_file.read_text(encoding="utf-8")
match = re.search(r'^\s*"\.github/workflows/build\.yml":"([A-Za-z0-9+/=]+)"', source, re.M)
require(match is not None, "Workflow build.yml tidak ditemukan di template.js")
if match:
    try:
        workflow_text = base64.b64decode(match.group(1), validate=True).decode("utf-8")
        workflow = yaml.load(workflow_text, Loader=yaml.BaseLoader)
        require(isinstance(workflow, dict), "Workflow build.yml bukan YAML mapping")
        require("workflow_dispatch" in workflow.get("on", {}), "Trigger workflow_dispatch tidak ada")
        jobs = workflow.get("jobs", {})
        for job in ("validate", "build", "sign", "cleanup_failed_build"):
            require(job in jobs, f"Job workflow hilang: {job}")
        require(jobs.get("build", {}).get("needs") == "validate", "Job build harus menunggu validasi")
        require(jobs.get("sign", {}).get("needs") == "build", "Job sign harus menunggu build")
        build_text = workflow_text
        require("SRC_TOKEN" in build_text, "Dukungan sumber repository privat hilang")
        require("KEYSTORE_B64" in build_text and "KS_SEED" in build_text,
                "Dukungan signing tetap/keystore hilang")
        require("upload-artifact@v4" in build_text and "download-artifact@v4" in build_text,
                "Pemisahan artefak build/sign hilang")
        require("timeout-minutes" in build_text, "Timeout job tidak ditetapkan")
        require("permissions:" in build_text, "Permission workflow tidak dibatasi")
    except Exception as exc:
        errors.append(f"Workflow embedded tidak valid: {exc}")

# Validate the dashboard CI workflow itself.
try:
    ci = yaml.load((ROOT / ".github/workflows/ci.yml").read_text(encoding="utf-8"), Loader=yaml.BaseLoader)
    require(isinstance(ci, dict) and "validate" in ci.get("jobs", {}), "Workflow CI dashboard tidak valid")
except Exception as exc:
    errors.append(f"Workflow CI dashboard tidak valid: {exc}")

# Ensure the public dashboard source does not accidentally contain obvious credential assignments.
for rel in ("js", "css", "index.html"):
    base = ROOT / rel
    files = [base] if base.is_file() else list(base.rglob("*")) if base.exists() else []
    for file in files:
        if not file.is_file() or file.suffix.lower() not in (".js", ".css", ".html"):
            continue
        text = file.read_text(encoding="utf-8", errors="ignore")
        require(not re.search(r'(?i)(ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})', text),
                f"Kemungkinan GitHub token tertanam: {file.relative_to(ROOT)}")

if errors:
    print("VALIDATION FAILED")
    for error in errors:
        print("-", error)
    sys.exit(1)
print("VALIDATION PASSED")
print("- PWA assets and manifest: OK")
print("- Embedded Android build workflow: OK")
print("- Build/sign job separation: OK")
print("- Dashboard CI workflow: OK")
print("- Obvious hardcoded GitHub token scan: OK")
