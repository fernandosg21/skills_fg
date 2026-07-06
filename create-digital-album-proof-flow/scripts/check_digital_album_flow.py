#!/usr/bin/env python3
"""Heuristic checker for Proof-style digital album creation flows.

Usage:
  python check_digital_album_flow.py /path/to/project

The checker is intentionally framework-agnostic. It scans text files for the
core standalone contract: album models, required album_model_id, Proof-like
create UI labels, Ajax/JSON redirect, and upload/lâminas continuation.
"""

from __future__ import annotations

import argparse
import os
import re
from pathlib import Path


TEXT_EXTENSIONS = {
    ".php", ".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte", ".html",
    ".htm", ".blade.php", ".twig", ".erb", ".py", ".rb", ".go", ".cs",
    ".java", ".sql", ".md",
}

SKIP_DIRS = {
    ".git", "node_modules", "vendor", "dist", "build", ".next", ".nuxt",
    "coverage", "__pycache__", ".venv", "venv", "tmp", "uploads",
}


def iter_text_files(root: Path):
    for current_root, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            path = Path(current_root) / name
            suffixes = "".join(path.suffixes[-2:]) if path.suffixes[-2:] == [".blade", ".php"] else path.suffix
            if suffixes.lower() not in TEXT_EXTENSIONS and path.suffix.lower() not in TEXT_EXTENSIONS:
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            yield path, text


def normalize(text: str) -> str:
    return text.lower()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("project_root", help="Project root to scan")
    args = parser.parse_args()

    root = Path(args.project_root).resolve()
    if not root.exists():
        print(f"ERROR: not found: {root}")
        return 2

    corpus = []
    files = []
    for path, text in iter_text_files(root):
        rel = path.relative_to(root)
        files.append(str(rel))
        corpus.append(text)

    haystack = normalize("\n".join(corpus))

    checks = [
        ("album model library", [r"album_models?", r"modelo[s]? de [áa]lb", r"size_label|tamanho"]),
        ("required model field", [r"album_model_id", r"required|obrigat[óo]rio|validate"]),
        ("create album screen", [r"novo projeto", r"[áa]lbum", r"dados do [áa]lbum"]),
        ("next upload action", [r"avan[çc]ar para envio de l[âa]minas|enviar l[âa]minas|upload.*l[âa]min"]),
        ("no-model empty state", [r"nenhum modelo cadastrado|crie um.*modelo|sem modelos"]),
        ("ajax/json response", [r"fetch\(|xmlhttprequest|application/json", r"redirect_url|redirectUrl|album_id"]),
        ("ownership or tenant scope", [r"tenant_id|owner_id|user_id", r"album_model_id"]),
    ]

    failed = []
    for label, patterns in checks:
        ok = all(re.search(pattern, haystack, re.IGNORECASE | re.DOTALL) for pattern in patterns)
        print(("OK   " if ok else "MISS ") + label)
        if not ok:
            failed.append(label)

    if failed:
        print("\nMissing signals:")
        for label in failed:
            print(f"- {label}")
        print("\nThis is a heuristic smoke check, not a substitute for app tests.")
        return 1

    print(f"\nScanned {len(files)} text files under {root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
