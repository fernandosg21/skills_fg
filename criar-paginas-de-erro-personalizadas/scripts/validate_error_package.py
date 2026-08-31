#!/usr/bin/env python3
"""Validação estrutural de um pacote de páginas de erro.

Usa apenas a biblioteca padrão. Retorna 1 quando encontra erros.
"""

from __future__ import annotations

import argparse
import json
import re
import struct
import sys
from pathlib import Path
from xml.etree import ElementTree


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--strict", action="store_true")
    return parser.parse_args()


def png_size(path: Path) -> tuple[int, int] | None:
    try:
        with path.open("rb") as handle:
            header = handle.read(24)
        if header[:8] != b"\x89PNG\r\n\x1a\n":
            return None
        return struct.unpack(">II", header[16:24])
    except OSError:
        return None


def svg_viewbox(path: Path) -> str | None:
    try:
        root = ElementTree.parse(path).getroot()
        return root.attrib.get("viewBox")
    except (OSError, ElementTree.ParseError):
        return None


def main() -> int:
    args = parse_args()
    root = args.root.resolve()
    errors: list[str] = []
    warnings: list[str] = []

    if not root.exists() or not root.is_dir():
        print(f"ERRO: diretório inexistente: {root}")
        return 1

    html_files = sorted(root.rglob("*.html"))
    css_files = sorted(root.rglob("*.css"))
    json_files = sorted(root.rglob("*.json"))

    if not html_files:
        errors.append("Nenhum arquivo HTML encontrado.")
    if not css_files:
        errors.append("Nenhum arquivo CSS encontrado.")

    for path in html_files:
        text = path.read_text(encoding="utf-8", errors="replace")
        label = path.relative_to(root)

        required_patterns = {
            "lang do documento": r"<html[^>]+\blang=",
            "meta viewport": r'<meta[^>]+name=["\']viewport["\']',
            "meta noindex": r'<meta[^>]+name=["\']robots["\'][^>]+noindex',
            "elemento main": r"<main\b",
            "título h1": r"<h1\b",
            "CSS externo": r'<link[^>]+rel=["\']stylesheet["\']',
        }
        for name, pattern in required_patterns.items():
            if not re.search(pattern, text, flags=re.I | re.S):
                errors.append(f"{label}: falta {name}.")

        if re.search(r"<style\b", text, flags=re.I):
            warnings.append(f"{label}: contém CSS inline em <style>.")
        if re.search(r"<script[^>]+src=[\"']https?://", text, flags=re.I):
            warnings.append(f"{label}: depende de script externo.")
        if not re.search(r"\b(?:4\d\d|5\d\d)\b", text):
            warnings.append(f"{label}: nenhum código HTTP visível encontrado.")
        if re.search(r'class=["\'][^"\']*error-page__art', text, flags=re.I):
            if not re.search(r'<img[^>]+alt=["\']["\']', text, flags=re.I):
                warnings.append(f"{label}: arte decorativa deveria usar alt vazio.")
        if re.search(r'class=["\'][^"\']*error-page__logo', text, flags=re.I):
            if re.search(r'class=["\'][^"\']*error-page__logo[^>]+alt=["\']["\']', text, flags=re.I):
                errors.append(f"{label}: logo está com alt vazio.")

    css_text = "\n".join(
        path.read_text(encoding="utf-8", errors="replace") for path in css_files
    )
    css_checks = {
        "controle da logo": r"error-page__logo",
        "limite de largura da logo": r"(?:max-width|clamp\s*\()",
        "responsividade": r"@media",
        "foco visível": r":focus-visible",
        "motion reduzido": r"prefers-reduced-motion",
        "altura de viewport moderna": r"100svh",
    }
    for name, pattern in css_checks.items():
        if not re.search(pattern, css_text, flags=re.I | re.S):
            warnings.append(f"CSS: não foi encontrado {name}.")

    for path in json_files:
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"{path.relative_to(root)}: JSON inválido ({exc}).")

    for path in root.rglob("*.png"):
        size = png_size(path)
        if size is None:
            warnings.append(f"{path.relative_to(root)}: PNG não pôde ser lido.")
        elif size[0] < 600 or size[1] < 600:
            warnings.append(
                f"{path.relative_to(root)}: dimensão pequena {size[0]}×{size[1]}."
            )

    for path in root.rglob("*.svg"):
        viewbox = svg_viewbox(path)
        if not viewbox:
            warnings.append(f"{path.relative_to(root)}: SVG sem viewBox válido.")

    print(f"Pacote: {root}")
    print(f"HTML: {len(html_files)} | CSS: {len(css_files)} | JSON: {len(json_files)}")

    for item in errors:
        print(f"ERRO: {item}")
    for item in warnings:
        print(f"AVISO: {item}")

    if errors:
        return 1
    if args.strict and warnings:
        return 1

    print("Validação concluída.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
