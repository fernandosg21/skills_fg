#!/usr/bin/env python3
"""Gera páginas HTML estáticas a partir do manifest da skill."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path


TOKENS = {
    "%%CODE%%": "code",
    "%%TITLE%%": "title",
    "%%MESSAGE%%": "message",
    "%%ACTION_LABEL%%": "action_label",
    "%%ACTION_URL%%": "action_url",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--template", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--css", type=Path, default=None)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    data = json.loads(args.manifest.read_text(encoding="utf-8"))
    template = args.template.read_text(encoding="utf-8")

    brand = data.get("brand", {})
    art = data.get("art", {})
    errors = data.get("errors", [])

    if not brand.get("name") or not brand.get("logo"):
        raise SystemExit("Manifest precisa de brand.name e brand.logo.")
    if not errors:
        raise SystemExit("Manifest não contém erros.")

    pages_dir = args.output / "pages"
    css_dir = args.output / "css"
    pages_dir.mkdir(parents=True, exist_ok=True)
    css_dir.mkdir(parents=True, exist_ok=True)

    css_source = args.css or args.template.with_name("error-page-base.css")
    if css_source.exists():
        shutil.copy2(css_source, css_dir / "error-pages.css")

    extension = art.get("extension", "svg")
    desktop_dir = art.get("desktop_dir", "../assets/illustrations/desktop")
    mobile_dir = art.get("mobile_dir", "../assets/illustrations/mobile")

    for item in errors:
        code = str(item.get("code", "")).strip()
        if not code:
            raise SystemExit("Todo erro precisa de code.")

        output = template
        values = {key: str(item.get(field, "")) for key, field in TOKENS.items()}
        for token, value in values.items():
            output = output.replace(token, value)

        art_key = item.get("art_key", code)
        output = output.replace("%%BRAND%%", str(brand["name"]))
        output = output.replace("%%LOGO%%", str(brand["logo"]))
        output = output.replace(
            "%%ART_DESKTOP%%",
            f"{desktop_dir.rstrip('/')}/{art_key}.{extension}",
        )
        output = output.replace(
            "%%ART_MOBILE%%",
            f"{mobile_dir.rstrip('/')}/{art_key}.{extension}",
        )

        (pages_dir / f"{code}.html").write_text(output, encoding="utf-8")

    shutil.copy2(args.manifest, args.output / "manifest.json")
    print(f"{len(errors)} páginas criadas em {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
