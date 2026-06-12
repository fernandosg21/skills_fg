#!/usr/bin/env python3
"""
Helper semiautomático para separar uma arte achatada em camadas PNG e montar um PSD.

Uso:
  python scripts/make_layered_psd_from_flat_image.py input.png \
    --config examples/config_dia_dos_namorados.example.json \
    --out_dir /mnt/data/layerwork \
    --psd /mnt/data/arte_em_camadas.psd

Ajuste sempre as regiões/coordenadas no JSON para cada arte. O resultado deve ser
conferido visualmente antes da entrega.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

Rect = Tuple[int, int, int, int]


def load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def open_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def rect_mask(size: Tuple[int, int], rect: Iterable[int], feather: float = 0) -> np.ndarray:
    w, h = size
    x0, y0, x1, y1 = [int(v) for v in rect]
    img = Image.new("L", (w, h), 0)
    ImageDraw.Draw(img).rectangle([x0, y0, x1, y1], fill=255)
    if feather:
        img = img.filter(ImageFilter.GaussianBlur(float(feather)))
    return np.array(img, dtype=np.uint8)


def polygon_mask(size: Tuple[int, int], points: Iterable[Iterable[float]], feather: float = 0, scale: int = 4) -> np.ndarray:
    w, h = size
    img = Image.new("L", (w * scale, h * scale), 0)
    pts = [(int(x * scale), int(y * scale)) for x, y in points]
    ImageDraw.Draw(img).polygon(pts, fill=255)
    img = img.resize((w, h), Image.Resampling.LANCZOS)
    if feather:
        img = img.filter(ImageFilter.GaussianBlur(float(feather)))
    return np.array(img, dtype=np.uint8)


def region_mask(size: Tuple[int, int], regions: List[List[int]]) -> np.ndarray:
    w, h = size
    out = np.zeros((h, w), dtype=np.uint8)
    for region in regions:
        out = np.maximum(out, rect_mask(size, region))
    return out


def limit_to_regions(mask: np.ndarray, regions: List[List[int]], size: Tuple[int, int]) -> np.ndarray:
    if not regions:
        return mask
    return ((mask.astype(np.float32) * (region_mask(size, regions).astype(np.float32) / 255.0))).astype(np.uint8)


def shape_alpha(cfg: Dict[str, Any], size: Tuple[int, int]) -> np.ndarray:
    w, h = size
    mask = np.zeros((h, w), dtype=np.uint8)
    feather = float(cfg.get("feather", 0))
    for polygon in cfg.get("polygons", []):
        mask = np.maximum(mask, polygon_mask(size, polygon, feather=feather))
    for rect in cfg.get("rects", []):
        mask = np.maximum(mask, rect_mask(size, rect, feather=feather))
    return mask


def hsv_alpha(rgb: np.ndarray, cfg: Dict[str, Any], size: Tuple[int, int]) -> np.ndarray:
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    h_min = int(cfg.get("h_min", 0)); h_max = int(cfg.get("h_max", 179))
    s_min = int(cfg.get("s_min", 0)); s_max = int(cfg.get("s_max", 255))
    v_min = int(cfg.get("v_min", 0)); v_max = int(cfg.get("v_max", 255))
    if h_min <= h_max:
        hue = (h >= h_min) & (h <= h_max)
    else:
        hue = (h >= h_min) | (h <= h_max)
    mask = (hue & (s >= s_min) & (s <= s_max) & (v >= v_min) & (v <= v_max)).astype(np.uint8) * 255
    mask = limit_to_regions(mask, cfg.get("regions", []), size)
    if int(cfg.get("open", 0)):
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8), iterations=int(cfg.get("open", 0)))
    if int(cfg.get("dilate", 0)):
        mask = cv2.dilate(mask, np.ones((2, 2), np.uint8), iterations=int(cfg.get("dilate", 0)))
    if float(cfg.get("blur", 0)):
        mask = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), sigmaX=float(cfg.get("blur", 0)), sigmaY=float(cfg.get("blur", 0))).astype(np.uint8)
    return mask


def dark_text_alpha(rgb: np.ndarray, cfg: Dict[str, Any], size: Tuple[int, int]) -> np.ndarray:
    rgb_f = rgb.astype(np.float32)
    luma = 0.299 * rgb_f[:, :, 0] + 0.587 * rgb_f[:, :, 1] + 0.114 * rgb_f[:, :, 2]
    local = cv2.GaussianBlur(luma, (0, 0), sigmaX=float(cfg.get("local_blur_sigma", 7)), sigmaY=float(cfg.get("local_blur_sigma", 7)))
    diff = local - luma
    alpha = np.clip((diff - float(cfg.get("diff_offset", 1))) * float(cfg.get("diff_scale", 24)), 0, 255)
    alpha = np.maximum(alpha, np.clip((float(cfg.get("luma_cutoff", 218)) - luma) * float(cfg.get("luma_scale", 2.2)), 0, float(cfg.get("luma_max_alpha", 180))))
    alpha = limit_to_regions(alpha.astype(np.uint8), cfg.get("regions", []), size)
    binary = (alpha > int(cfg.get("threshold", 18))).astype(np.uint8) * 255
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8), iterations=1)
    if int(cfg.get("dilate", 1)):
        binary = cv2.dilate(binary, np.ones((2, 2), np.uint8), iterations=int(cfg.get("dilate", 1)))
    if float(cfg.get("blur", 0.65)):
        binary = cv2.GaussianBlur(binary.astype(np.float32), (0, 0), sigmaX=float(cfg.get("blur", 0.65)), sigmaY=float(cfg.get("blur", 0.65)))
    return np.clip(np.maximum(alpha.astype(np.float32), binary * 0.75), 0, 255).astype(np.uint8)


def apply_exclusions(masks: Dict[str, np.ndarray], layer_cfgs: List[Dict[str, Any]]) -> Dict[str, np.ndarray]:
    result = {name: mask.copy() for name, mask in masks.items()}
    for cfg in layer_cfgs:
        exclusions = cfg.get("exclude_layers", [])
        if not exclusions:
            continue
        exclude_mask = None
        for ex in exclusions:
            if ex in masks:
                exclude_mask = masks[ex] if exclude_mask is None else np.maximum(exclude_mask, masks[ex])
        if exclude_mask is not None:
            result[cfg["name"]] = np.where(exclude_mask > 10, 0, result[cfg["name"]]).astype(np.uint8)
    return result


def write_layer(rgb: np.ndarray, alpha: np.ndarray, path: Path) -> None:
    rgba = np.dstack([rgb, np.clip(alpha, 0, 255).astype(np.uint8)])
    Image.fromarray(rgba, "RGBA").save(path)


def fill_large_from_left(base_rgb: np.ndarray, mask_alpha: np.ndarray) -> np.ndarray:
    out = base_rgb.astype(np.float32).copy()
    mask = mask_alpha > 12
    for y in range(mask.shape[0]):
        xs = np.where(mask[y])[0]
        if xs.size == 0:
            continue
        x0 = int(xs.min())
        s1 = max(0, x0 - 90); s2 = max(1, x0 - 12)
        sample = out[y, s1:s2]
        color = np.median(sample.reshape(-1, 3), axis=0) if sample.size else out[y, max(0, x0 - 1)]
        out[y, xs] = color
    blurred = cv2.GaussianBlur(out.astype(np.uint8), (0, 0), sigmaX=18, sigmaY=18).astype(np.float32)
    feather = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), sigmaX=8, sigmaY=8)[:, :, None]
    return np.clip(base_rgb.astype(np.float32) * (1 - feather) + blurred * feather, 0, 255).astype(np.uint8)


def reconstruct_background(rgb: np.ndarray, masks: Dict[str, np.ndarray], cfg: Dict[str, Any]) -> np.ndarray:
    large_names = set(cfg.get("large_object_layers", []))
    small_masks = [m for name, m in masks.items() if name not in large_names]
    if small_masks:
        small = np.maximum.reduce(small_masks)
        small = cv2.dilate((small > 8).astype(np.uint8) * 255, np.ones((4, 4), np.uint8), iterations=1)
        bgr = cv2.inpaint(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), small, int(cfg.get("inpaint_radius", 3)), cv2.INPAINT_TELEA)
        base = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    else:
        base = rgb.copy()
    if cfg.get("directional_fill", "from_left") == "from_left":
        for name in large_names:
            if name in masks:
                base = fill_large_from_left(base, masks[name])
    else:
        large_masks = [masks[name] for name in large_names if name in masks]
        if large_masks:
            large = np.maximum.reduce(large_masks)
            large = cv2.dilate((large > 8).astype(np.uint8) * 255, np.ones((7, 7), np.uint8), iterations=2)
            bgr = cv2.inpaint(cv2.cvtColor(base, cv2.COLOR_RGB2BGR), large, max(int(cfg.get("inpaint_radius", 3)), 5), cv2.INPAINT_TELEA)
            base = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    return base


def find_magick() -> str | None:
    for candidate in ("magick", "/opt/imagemagick/bin/magick", "convert", "/opt/imagemagick/bin/convert"):
        if "/" in candidate and Path(candidate).exists():
            return candidate
        found = shutil.which(candidate)
        if found:
            return found
    return None


def make_psd(paths: List[Path], psd_path: Path) -> bool:
    magick = find_magick()
    if not magick:
        print("ImageMagick não encontrado; PNGs gerados, PSD não montado.")
        return False
    subprocess.run([magick, *map(str, paths), str(psd_path)], check=True)
    return psd_path.exists()


def main() -> None:
    parser = argparse.ArgumentParser(description="Gera camadas rasterizadas e PSD a partir de arte achatada.")
    parser.add_argument("image", type=Path)
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--out_dir", type=Path, required=True)
    parser.add_argument("--psd", type=Path)
    args = parser.parse_args()

    args.out_dir.mkdir(parents=True, exist_ok=True)
    img = open_rgba(args.image)
    w, h = img.size
    rgb = np.array(img.convert("RGB"))
    cfg = load_json(args.config)
    layer_cfgs = cfg.get("layers", [])
    if not layer_cfgs:
        raise ValueError("Config precisa conter uma lista 'layers'.")

    raw_masks: Dict[str, np.ndarray] = {}
    for layer in layer_cfgs:
        layer_type = layer.get("type")
        if layer_type == "shape":
            raw_masks[layer["name"]] = shape_alpha(layer, (w, h))
        elif layer_type == "hsv":
            raw_masks[layer["name"]] = hsv_alpha(rgb, layer, (w, h))
        elif layer_type == "dark_text":
            raw_masks[layer["name"]] = dark_text_alpha(rgb, layer, (w, h))
        else:
            raise ValueError(f"Tipo de camada não suportado: {layer_type!r}")

    masks = apply_exclusions(raw_masks, layer_cfgs)
    bg_cfg = cfg.get("background", {"name": "01_Fundo_limpo"})
    bg_rgb = reconstruct_background(rgb, masks, bg_cfg)
    bg_path = args.out_dir / f"{bg_cfg.get('name', '01_Fundo_limpo')}.png"
    Image.fromarray(np.dstack([bg_rgb, np.full((h, w), 255, dtype=np.uint8)]), "RGBA").save(bg_path)

    layer_paths = [bg_path]
    for layer in layer_cfgs:
        path = args.out_dir / f"{layer['name']}.png"
        write_layer(rgb, masks[layer["name"]], path)
        layer_paths.append(path)

    original_path = args.out_dir / "00_Referencia_original.png"
    img.save(original_path)

    comp = Image.open(bg_path).convert("RGBA")
    for path in layer_paths[1:]:
        comp.alpha_composite(Image.open(path).convert("RGBA"))
    comp_path = args.out_dir / "00_Composicao_visual.png"
    comp.save(comp_path)

    report = {
        "input": str(args.image),
        "width": w,
        "height": h,
        "layers": [p.name for p in layer_paths],
        "original_reference": original_path.name,
        "composite_preview": comp_path.name,
        "mean_absolute_error_vs_original": round(float(np.mean(np.abs(np.array(comp.convert("RGB")).astype(np.int16) - rgb.astype(np.int16)))), 4),
    }

    if args.psd:
        args.psd.parent.mkdir(parents=True, exist_ok=True)
        report["psd"] = str(args.psd) if make_psd(layer_paths + [original_path], args.psd) else None

    (args.out_dir / "qa_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
