#!/usr/bin/env python3
"""Turn Piquant's supplied photography into square product images.

They send one landscape frame per colourway, with the front and the back of
the garment side by side on a mannequin. Product cards here are square and
crop to fill, so a landscape pair would centre on the gap between the two
shirts and show neither. Split each frame down the middle instead, trim the
mannequin out of the surrounding space, and sit each half on its own square.

The shampoos arrive as single tall bottles and only need the same squaring.

Input is the two folders as they unzip from Drive:
    ~/Downloads/Piquant- Tshirts/
    ~/Downloads/Piquant- shampoo/

Usage:
    python3 scripts/piquant/prepare_images.py
    python3 scripts/piquant/prepare_images.py --source ~/somewhere/else
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
OUT = HERE / "images"
SIZE = 1200
FILL = 0.86  # share of the square the garment fills, so every shot matches

# Their filenames carry the cut in shorthand and the colour in their own words.
# "F_S Men" is the classic collar, "F_S" alone the high collar, "H_S G" the
# lace one, "H_S" alone the classic half sleeve.
STYLES = {
    ("H_S", True): "lace",          # H_S + G
    ("F_S", False): "fs-high",      # F_S, no Men
    ("F_S", True): "fs-normal",     # F_S Men
    ("H_S", False): "hs-normal",    # H_S, no G
}

# Piquant's catalogue prints Mauve and Red; their file names say Pink and Wine.
# The catalogue is what a rider sees, so it wins.
COLOURS = {
    "black": "black",
    "navy blue": "navy",
    "navy": "navy",
    "pink": "mauve",
    "sky blue": "sky-blue",
    "wine red": "red",
    "wine": "red",
}

SHAMPOOS = {
    "aloe & coconut oil revitalizer": "shampoo-aloe-coconut",
    "cucumber melon": "shampoo-cucumber-melon",
    "bhringaraj revitalizer": "shampoo-bhringaraj",
    "ylang ylang horse shampoo": "shampoo-ylang-ylang",
    "cloud 9": "shampoo-cloud-9",
}


def parse_shirt(stem: str) -> tuple[str, str] | None:
    """'Navy blue H_S G' -> ('lace', 'navy'). Their naming is inconsistent about
    case and stray underscores, so normalise hard before matching."""
    s = re.sub(r"[_\s]+", " ", stem.strip().lower()).strip()
    suffixed = s.endswith(" g") or s.endswith(" men")
    marker = "men" if s.endswith(" men") else ("g" if s.endswith(" g") else "")
    if suffixed:
        s = s.rsplit(" ", 1)[0].strip()

    for sleeve in ("f s", "h s"):
        if s.endswith(sleeve):
            colour_part = s[: -len(sleeve)].strip()
            key = (sleeve.replace(" ", "_").upper(), marker == "men" if sleeve == "f s" else marker == "g")
            style = STYLES.get(key)
            colour = COLOURS.get(colour_part)
            if style and colour:
                return style, colour
            return None
    return None


def background(im: Image.Image, outer_left: bool) -> tuple[int, int, int]:
    """Their backdrop is a soft gradient, and the two panels in a frame are
    separated by a near-white gutter. Sample the outer edge, away from that
    gutter, so a half never takes its background colour from the divider."""
    w, h = im.size
    x = 2 if outer_left else w - 3
    px = im.load()
    pts = [(x, int(h * f)) for f in (0.05, 0.3, 0.6, 0.9)]
    return tuple(sum(px[p][c] for p in pts) // len(pts) for c in range(3))


def content_box(im: Image.Image, bg: tuple[int, int, int]) -> tuple[int, int, int, int] | None:
    mask = Image.new("L", im.size, 0)
    mp, sp = mask.load(), im.load()
    w, h = im.size
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            r, g, b = sp[x, y][:3]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) > 40:
                mp[x, y] = 255
    return mask.getbbox()


def square(im: Image.Image, outer_left: bool) -> Image.Image:
    """Sit the garment on its own square, at the same scale as every other.

    Squaring each half to whatever it happened to measure left the garments at
    noticeably different sizes down a product grid, because their frames are
    not all cropped alike. Scale each one so it fills the same share of the
    square instead, and the grid reads as one set.
    """
    bg = background(im, outer_left)
    box = content_box(im, bg)
    if box:
        im = im.crop(box)

    scale = (SIZE * FILL) / max(im.size)
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)

    canvas = Image.new("RGB", (SIZE, SIZE), bg)
    canvas.paste(im, ((SIZE - im.width) // 2, (SIZE - im.height) // 2))
    return canvas


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default="~/Downloads", help="folder holding the two unzipped folders")
    args = ap.parse_args()
    src = Path(args.source).expanduser()

    shirts = src / "Piquant- Tshirts"
    bottles = src / "Piquant- shampoo"
    for d in (shirts, bottles):
        if not d.is_dir():
            print(f"error: {d} not found. Unzip the Drive folders into {src} first.")
            return 1

    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.jpg"):
        old.unlink()

    written = 0
    unmatched = []
    for f in sorted(shirts.glob("*.png")):
        parsed = parse_shirt(f.stem)
        if not parsed:
            unmatched.append(f.name)
            continue
        style, colour = parsed
        im = Image.open(f).convert("RGB")
        half = im.width // 2
        for side, crop, outer_left in (("", im.crop((0, 0, half, im.height)), True),
                                       ("-back", im.crop((half, 0, im.width, im.height)), False)):
            out = OUT / f"{style}-{colour}{side}.jpg"
            square(crop, outer_left).save(out, "JPEG", quality=88, optimize=True)
            written += 1
        print(f"{f.name:30s} -> {style}-{colour}.jpg + back")

    for f in sorted(bottles.glob("*.png")):
        name = SHAMPOOS.get(f.stem.strip().lower())
        if not name:
            unmatched.append(f.name)
            continue
        square(Image.open(f).convert("RGB"), True).save(
            OUT / f"{name}.jpg", "JPEG", quality=88, optimize=True
        )
        written += 1
        print(f"{f.name:30s} -> {name}.jpg")

    if unmatched:
        print("\nnot recognised, nothing written for these:")
        for n in unmatched:
            print(f"  {n}")

    print(f"\n{written} images -> {OUT}")
    return 1 if unmatched else 0


if __name__ == "__main__":
    raise SystemExit(main())
