#!/bin/bash
# Generation gate for agent edits under tests/.
# Blocks spec files that have no expect() assertion, and any tests/ file
# that uses page.locator() for a CSS or XPath locator.
# Exit 0 allows the edit. Exit 2 blocks it. Other failures fail closed
# because hooks.json sets failClosed: true.

export PATH="/usr/bin:/bin:/usr/sbin:/sbin${PATH:+:$PATH}"
set -u

input=$(/bin/cat)

/usr/bin/python3 - "$input" <<'PY'
import json
import re
import sys
from pathlib import Path

raw = sys.argv[1] if len(sys.argv) > 1 else ""

def emit(payload, code):
    print(json.dumps(payload))
    raise SystemExit(code)

try:
    data = json.loads(raw) if raw.strip() else {}
except json.JSONDecodeError:
    emit(
        {
            "permission": "deny",
            "user_message": "generation-gate: hook input was not valid JSON.",
            "agent_message": "generation-gate failed closed because the afterFileEdit payload was not valid JSON.",
        },
        1,
    )

file_path = str(data.get("file_path") or "")
normalized = file_path.replace("\\", "/")

if not re.search(r"(^|/)tests/", normalized):
    emit({"permission": "allow"}, 0)

text = ""
path = Path(file_path)
if path.is_file():
    text = path.read_text(encoding="utf-8", errors="replace")
else:
    chunks = []
    for edit in data.get("edits") or []:
        if isinstance(edit, dict):
            chunks.append(str(edit.get("new_string") or ""))
    text = "\n".join(chunks)

reasons = []
is_spec = normalized.endswith((".spec.ts", ".spec.tsx", ".spec.js", ".spec.jsx"))
if is_spec and re.search(r"\bexpect\s*\(", text) is None:
    reasons.append("test spec has no assertion (expect)")
if re.search(r"\bpage\.locator\s*\(", text):
    reasons.append("CSS or XPath locator via page.locator() is not allowed")

if reasons:
    detail = "; ".join(reasons)
    emit(
        {
            "permission": "deny",
            "user_message": f"generation-gate blocked {file_path}: {detail}.",
            "agent_message": (
                "generation-gate blocked this tests/ edit. "
                f"{detail}. Use expect() for assertions and getByRole, getByLabel, "
                "getByPlaceholder, or getByText instead of page.locator()."
            ),
        },
        2,
    )

emit({"permission": "allow"}, 0)
PY
