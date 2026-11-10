#!/bin/bash
# Heal gate for agent edits under tests/.
#
# Cursor's afterFileEdit input is:
#   { "file_path": "<absolute path>",
#     "edits": [{ "old_string": "<search>", "new_string": "<replace>" }] }
# There is no separate previous-file field. The file on disk is already the
# post-edit text, so this script compares only old_string and new_string.
#
# It rejects a tests/ edit (exit 2) when a hunk with both strings:
#   - has fewer active expect( calls in new_string than in old_string, or
#   - comments out an expect( line that was active in old_string.
# An equal expect( count is not semantic equivalence. Callers must also
# diff tests/ (see .cursor/skills/self-heal/SKILL.md).
#
# When old_string is missing or empty, the previous text is not in the
# payload. This script does not invent it from git or from the file on disk.
# It allows that edit and leaves the assertion check to the tests/ diff.
#
# Exit 0 allows. Exit 2 blocks. Other failures fail closed because
# hooks.json sets failClosed: true.

export PATH="/usr/bin:/bin:/usr/sbin:/sbin${PATH:+:$PATH}"
set -u

input=$(/bin/cat)

/usr/bin/python3 - "$input" <<'PY'
import json
import re
import sys

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
            "user_message": "heal-gate: hook input was not valid JSON.",
            "agent_message": "heal-gate failed closed because the afterFileEdit payload was not valid JSON.",
        },
        1,
    )

file_path = str(data.get("file_path") or "")
normalized = file_path.replace("\\", "/")

if not re.search(r"(^|/)tests/", normalized):
    emit({"permission": "allow"}, 0)

if not re.search(r"\.(spec|test)\.(ts|tsx|js|jsx)$", normalized):
    emit({"permission": "allow"}, 0)

EXPECT_RE = re.compile(r"\bexpect\s*\(")


def normalize(text):
    return re.sub(r"\s+", " ", text).strip()


def inspect(text):
    """Return active expect count, normalized active lines, and commented payloads."""
    active_count = 0
    active_lines = []
    commented = []
    in_block = False
    block_parts = []

    def flush_block():
        payload = "".join(block_parts).strip()
        block_parts.clear()
        if payload and EXPECT_RE.search(payload):
            commented.append(normalize(payload))

    for line in text.splitlines():
        i = 0
        code_chars = []
        while i < len(line):
            if in_block:
                end = line.find("*/", i)
                if end == -1:
                    block_parts.append(line[i:])
                    i = len(line)
                else:
                    block_parts.append(line[i:end])
                    in_block = False
                    flush_block()
                    i = end + 2
                continue
            if line.startswith("/*", i):
                in_block = True
                i += 2
                continue
            if line.startswith("//", i):
                payload = line[i + 2 :].strip()
                if payload and EXPECT_RE.search(payload):
                    commented.append(normalize(payload))
                break
            code_chars.append(line[i])
            i += 1
        code = "".join(code_chars)
        found = EXPECT_RE.findall(code)
        if found:
            active_count += len(found)
            active_lines.append(normalize(code))
    if in_block:
        flush_block()
    return active_count, active_lines, commented


def weakens(old, new):
    old_count, old_lines, _old_comments = inspect(old)
    new_count, new_lines, new_comments = inspect(new)
    reasons = []
    if new_count < old_count:
        reasons.append(
            f"active expect( calls fell from {old_count} to {new_count}"
        )
    still_active = set(new_lines)
    for line in old_lines:
        if not line or line in still_active:
            continue
        if any(line in payload for payload in new_comments):
            reasons.append("an active expect( was commented out")
            break
    return reasons


edits = data.get("edits")
if not isinstance(edits, list):
    edits = []

reasons = []
for edit in edits:
    if not isinstance(edit, dict):
        continue
    old = edit.get("old_string")
    new = edit.get("new_string")
    if not isinstance(old, str) or not isinstance(new, str) or old == "":
        continue
    reasons.extend(weakens(old, new))

if reasons:
    detail = "; ".join(dict.fromkeys(reasons))
    emit(
        {
            "permission": "deny",
            "user_message": f"heal-gate blocked {file_path}: {detail}.",
            "agent_message": (
                "heal-gate blocked this tests/ edit. "
                f"{detail}. Do not remove, weaken, or comment out an assertion to make a test pass."
            ),
        },
        2,
    )

emit({"permission": "allow"}, 0)
PY
