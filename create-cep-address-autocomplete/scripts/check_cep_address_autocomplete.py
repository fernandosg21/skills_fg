#!/usr/bin/env python3
"""Heuristic checker for CEP-first address autocomplete implementations."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


WEB_EXTENSIONS = {
    ".astro",
    ".blade.php",
    ".erb",
    ".html",
    ".htm",
    ".js",
    ".jsx",
    ".liquid",
    ".php",
    ".tsx",
    ".ts",
    ".vue",
}

INPUT_RE = re.compile(r"<input\b[^>]*>", re.IGNORECASE | re.DOTALL)
ATTR_RE = re.compile(
    r"\b(?:id|name)\s*=\s*['\"]([^'\"]+)['\"]",
    re.IGNORECASE | re.DOTALL,
)

ADDRESS_TOKENS = {
    "rua",
    "logradouro",
    "address",
    "street",
    "numero",
    "number",
    "complemento",
    "complement",
    "bairro",
    "neighborhood",
    "cidade",
    "city",
}


def iter_files(paths: list[Path]) -> list[Path]:
    files: list[Path] = []
    for path in paths:
        if path.is_dir():
            for child in path.rglob("*"):
                if child.is_file() and is_web_file(child):
                    files.append(child)
        elif path.is_file() and is_web_file(path):
            files.append(path)
    return sorted(set(files))


def is_web_file(path: Path) -> bool:
    name = path.name.lower()
    if name.endswith(".blade.php"):
        return True
    return path.suffix.lower() in WEB_EXTENSIONS


def line_for(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def name_tokens(value: str) -> set[str]:
    return {token for token in re.split(r"[^a-z0-9]+", value.lower()) if token}


def input_names(tag: str) -> list[str]:
    return [match.group(1) for match in ATTR_RE.finditer(tag)]


def is_cep_input(tag: str) -> bool:
    for name in input_names(tag):
        normalized = name.lower().replace("-", "_")
        tokens = name_tokens(name)
        if "cep" in tokens or normalized in {"postal_code", "zipcode", "zip_code"}:
            return True
    return False


def is_address_input(tag: str) -> bool:
    for name in input_names(tag):
        tokens = name_tokens(name)
        if tokens & ADDRESS_TOKENS:
            return True
        if "state" in tokens and "registration" not in tokens:
            return True
        if "estado" in tokens or "uf" in tokens:
            return True
    return False


def check_order(path: Path, text: str) -> tuple[str, str | None]:
    input_matches = list(INPUT_RE.finditer(text))
    cep_matches = [match for match in input_matches if is_cep_input(match.group(0))]
    if not cep_matches:
        return "skip", None

    address_matches = [
        match
        for match in input_matches
        if match.start() not in {cep.start() for cep in cep_matches}
        and is_address_input(match.group(0))
    ]
    if not address_matches:
        return "warn", "CEP input found, but no address component inputs were detected"

    first_cep = min(match.start() for match in cep_matches)
    earlier_address = [match for match in address_matches if match.start() < first_cep]
    if earlier_address:
        first = earlier_address[0]
        return (
            "fail",
            f"address input appears before CEP input near line {line_for(text, first.start())}",
        )

    return "ok", f"CEP input appears before address inputs near line {line_for(text, first_cep)}"


def scan_patterns(files: list[Path]) -> dict[str, bool]:
    combined = "\n".join(read_file(path) for path in files)
    return {
        "viacep": "viacep.com.br/ws" in combined.lower(),
        "mask": bool(
            re.search(r"replace\s*\(\s*/\\D|replace\s*\(\s*/\[\^0-9\]|digitsOnly|onlyDigits", combined)
        ),
        "eight_digits": bool(re.search(r"slice\s*\(\s*0\s*,\s*8\s*\)|maxlength\s*=\s*['\"]9", combined)),
        "fill_keys": all(key in combined for key in ("logradouro", "bairro"))
        and ("localidade" in combined or "cidade" in combined)
        and ("uf" in combined.lower() or "estado" in combined.lower()),
        "abort": "AbortController" in combined,
        "focus_number": bool(re.search(r"\.focus\s*\(\s*\)", combined)) and bool(
            re.search(r"number|numero", combined, re.IGNORECASE)
        ),
    }


def read_file(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="latin-1")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check common CEP-first address autocomplete guardrails."
    )
    parser.add_argument("paths", nargs="+", type=Path, help="Files or directories to scan")
    args = parser.parse_args()

    files = iter_files(args.paths)
    if not files:
        print("[FAIL] No supported web files found.")
        return 1

    order_counts = {"ok": 0, "warn": 0, "fail": 0, "skip": 0}
    for path in files:
        text = read_file(path)
        status, message = check_order(path, text)
        order_counts[status] += 1
        if status != "skip":
            label = {"ok": "OK", "warn": "WARN", "fail": "FAIL"}[status]
            print(f"[{label}] {path}: {message}")

    patterns = scan_patterns(files)
    print()
    print("Behavior signals:")
    for key, found in patterns.items():
        print(f"[{'OK' if found else 'WARN'}] {key.replace('_', ' ')}")

    failed = False
    if order_counts["ok"] == 0:
        print("[FAIL] No CEP input with following address inputs was detected.")
        failed = True
    if order_counts["fail"] > 0:
        failed = True
    required_behavior = ("viacep", "mask", "eight_digits", "fill_keys")
    if any(not patterns[key] for key in required_behavior):
        print("[FAIL] Required autocomplete behavior signals are missing.")
        failed = True

    if not patterns["abort"]:
        print("[WARN] Consider AbortController to avoid stale ViaCEP responses.")
    if not patterns["focus_number"]:
        print("[WARN] Consider focusing the number field after a successful CEP lookup.")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
