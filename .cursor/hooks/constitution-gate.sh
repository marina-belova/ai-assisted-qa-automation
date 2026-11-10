#!/bin/bash
# Constitution gate for agent edits under tests/ and pages/.
#
# Cursor afterFileEdit input (https://cursor.com/docs/hooks):
#   { "file_path": "<absolute path>",
#     "edits": [{ "old_string": "<search>", "new_string": "<replace>" }] }
# The file on disk is already the post-edit text, so this script compares
# only old_string and new_string. It does not read the file or git.
#
# matcher "Write" is configured in hooks.json. afterFileEdit is matched
# against the tool value Write. Tab edits use afterTabFileEdit and do not
# reach this script.
#
# Exit 0 allows. Exit 2 blocks. Invalid JSON exits 1. hooks.json sets
# failClosed: true, so exit 1 blocks as well. Cursor documents exit 2 as
# equivalent to permission "deny". The afterFileEdit section does not define
# an output schema; the JSON below matches the other gates in this repo.
#
# A violation is blocked only when the edit introduces it. The same pattern
# already present in old_string is left alone. An empty old_string is the
# previous content of a new file, so new_string is still inspected.
# Missing or malformed edits for a tests/ or pages/ path fail closed.
#
# Not detected: an expected-value change that keeps the same matcher, a
# banned pattern that appears only in a comment, and a CSS locator that is
# not XPath. Quoted strings are scanned.

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
            "user_message": "constitution-gate: hook input was not valid JSON.",
            "agent_message": "constitution-gate failed closed because the afterFileEdit payload was not valid JSON.",
        },
        1,
    )

file_path = str(data.get("file_path") or "")
normalized = file_path.replace("\\", "/")

if not re.search(r"(^|/)(tests|pages)/", normalized):
    emit({"permission": "allow"}, 0)

def strip_comments(text):
    """Drop comments. Quoted strings stay, so an XPath // is not a comment."""
    out = []
    i = 0
    n = len(text)
    while i < n:
        if text.startswith("/*", i):
            end = text.find("*/", i + 2)
            if end == -1:
                break
            i = end + 2
            continue
        if text.startswith("//", i):
            end = text.find("\n", i)
            if end == -1:
                break
            out.append("\n")
            i = end + 1
            continue
        if text[i] in "\"'`":
            quote = text[i]
            out.append(quote)
            i += 1
            while i < n:
                out.append(text[i])
                if text[i] == "\\":
                    if i + 1 < n:
                        out.append(text[i + 1])
                    i += 2
                    continue
                if text[i] == quote:
                    i += 1
                    break
                i += 1
            continue
        out.append(text[i])
        i += 1
    return "".join(out)

WAIT_RE = re.compile(r"\bpage\.waitForTimeout\s*\(")
XPATH_RE = re.compile(
    r"""(?ix)
    \bxpath\s*=
    | \.locator\s*\(\s*[`'"]\s*(?:xpath\s*=|//)
    """
)
ANY_RE = re.compile(
    r"(?::\s*any\b|\bas\s+any\b|<\s*any\b|,\s*any\b)"
)
CREDENTIAL_RE = re.compile(
    r"""(?ix)
    \b(?:password|passwd|secret|api[_-]?key|api[_-]?token|access[_-]?token)\b
    \s*[:=]\s*
    ([`'"])
    (?!\1)
    (?!your-password|change-?me|example|placeholder|<.*>|\$\{)
    [^`'"]{3,}?
    \1
    """
)
DESCRIBE_TAG_RE = re.compile(
    r"""(?x)
    test\.describe(?:\.(?:only|skip|fixme))?\s*\(
    (?:
        \s*[`'"][^`'"]*@[\w-]+[^`'"]*[`'"]
        | [^)]{0,400}\{\s*tag\s*:
    )
    """
)
STRONG_RE = re.compile(
    r"\.(?:toHaveText|toHaveValue|toContainText|toEqual|toHaveCount|toBeEnabled|toBeDisabled|toBeFocused)\s*\("
)
WEAK_RE = re.compile(r"\.(?:toBeTruthy|toBeDefined|toBeFalsy|toBeVisible)\s*\(")
EXPECT_RE = re.compile(r"\bexpect\s*\(")

def normalize(text):
    return re.sub(r"\s+", " ", text).strip()

def inspect(text):
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

def introduced(pattern, old, new):
    return len(pattern.findall(new)) > len(pattern.findall(old))

def weakens(old, new):
    old_count, old_lines, _old_comments = inspect(old)
    new_count, new_lines, new_comments = inspect(new)
    reasons = []
    if new_count < old_count:
        reasons.append(f"active expect( calls fell from {old_count} to {new_count}")
    still_active = set(new_lines)
    for line in old_lines:
        if not line or line in still_active:
            continue
        if any(line in payload for payload in new_comments):
            reasons.append("an active expect( was commented out")
            break
    old_code = strip_comments(old)
    new_code = strip_comments(new)
    if (
        new_count >= old_count
        and len(STRONG_RE.findall(new_code)) < len(STRONG_RE.findall(old_code))
        and len(WEAK_RE.findall(new_code)) > len(WEAK_RE.findall(old_code))
    ):
        reasons.append("an expect( matcher was replaced by a weaker matcher")
    return reasons

CHECKS = (
    (WAIT_RE, "page.waitForTimeout"),
    (XPATH_RE, "an XPath locator"),
    (ANY_RE, "the TypeScript any type"),
    (CREDENTIAL_RE, "a hardcoded credential"),
    (DESCRIBE_TAG_RE, "a tag on test.describe()"),
)

edits = data.get("edits", None)
if not isinstance(edits, list) or len(edits) == 0:
    emit(
        {
            "permission": "deny",
            "user_message": f"constitution-gate blocked {file_path}: edits are missing or malformed.",
            "agent_message": "constitution-gate failed closed because this tests/ or pages/ edit did not include a non-empty edits array.",
        },
        1,
    )

reasons = []
for edit in edits:
    if not isinstance(edit, dict):
        emit(
            {
                "permission": "deny",
                "user_message": f"constitution-gate blocked {file_path}: edits are missing or malformed.",
                "agent_message": "constitution-gate failed closed because an edits entry was not an object.",
            },
            1,
        )
    old = edit.get("old_string")
    new = edit.get("new_string")
    if not isinstance(old, str) or not isinstance(new, str):
        emit(
            {
                "permission": "deny",
                "user_message": f"constitution-gate blocked {file_path}: edits are missing or malformed.",
                "agent_message": "constitution-gate failed closed because old_string or new_string was not a string. An empty old_string is valid.",
            },
            1,
        )
    old_code = strip_comments(old)
    new_code = strip_comments(new)
    for pattern, label in CHECKS:
        if introduced(pattern, old_code, new_code):
            reasons.append(label)
    reasons.extend(weakens(old, new))

if reasons:
    detail = "; ".join(dict.fromkeys(reasons))
    emit(
        {
            "permission": "deny",
            "user_message": f"constitution-gate blocked {file_path}: {detail}.",
            "agent_message": (
                "constitution-gate blocked this tests/ or pages/ edit. "
                f"{detail}. Do not introduce a constitution WON'T violation."
            ),
        },
        2,
    )

emit({"permission": "allow"}, 0)
PY
