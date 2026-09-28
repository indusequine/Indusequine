#!/usr/bin/env python3
"""Pull Piquant's product photography out of their brand catalogue PDF.

Every product shot in the PDF is a cut-out whose transparency lives in a
separate soft mask, so the raw image alone comes out silhouetted on black.
Composite each one over white before it is any use to us.
"""
import io
from pathlib import Path

import fitz
from PIL import Image

PDF = Path("~/Downloads/PIQUANT Brand Catalogue (4).pdf").expanduser()
OUT = Path(__file__).resolve().parent / "images"

# xref -> filename, read off the catalogue page by page.
SHOTS = {
    # Girls High Collar Lace T-shirt (page 2 hero, page 3 colourways)
    47: "lace-front", 52: "lace-back",
    71: "lace-navy", 73: "lace-black", 74: "lace-sky-blue",
    75: "lace-mauve", 76: "lace-red",
    # Full Sleeve Normal Collar (page 4 hero, page 5 colourways)
    90: "fs-normal-front", 97: "fs-normal-back",
    118: "fs-normal-navy", 120: "fs-normal-black",
    122: "fs-normal-mauve", 123: "fs-normal-red",
    # Full Sleeve High Collar (page 6 hero, page 7 colourways)
    140: "fs-high-front", 144: "fs-high-back",
    159: "fs-high-black", 160: "fs-high-mauve",
    161: "fs-high-navy", 162: "fs-high-red",
    # Half Sleeve Normal Collar (page 8 hero, page 9 colourways)
    168: "hs-normal-front", 169: "hs-normal-back",
    196: "hs-normal-navy", 197: "hs-normal-black", 198: "hs-normal-sky-blue",
    199: "hs-normal-mauve", 200: "hs-normal-red",
    # Shampoos, one bottle each (pages 11-15)
    224: "shampoo-aloe-coconut", 235: "shampoo-cucumber-melon",
    246: "shampoo-bhringaraj", 257: "shampoo-ylang-ylang",
    268: "shampoo-cloud-9",
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF)

    masks = {}
    for page in doc:
        for img in page.get_images(full=True):
            if img[1]:
                masks[img[0]] = img[1]

    written = 0
    for xref, name in SHOTS.items():
        raw = Image.open(io.BytesIO(doc.extract_image(xref)["image"])).convert("RGB")
        smask = masks.get(xref)
        if smask:
            alpha = Image.open(io.BytesIO(doc.extract_image(smask)["image"])).convert("L")
            if alpha.size != raw.size:
                alpha = alpha.resize(raw.size, Image.LANCZOS)
            flat = Image.new("RGB", raw.size, "white")
            flat.paste(raw, mask=alpha)
            raw = flat
        raw.save(OUT / f"{name}.jpg", "JPEG", quality=88, optimize=True)
        written += 1
        print(f"{name:26s} {raw.size[0]}x{raw.size[1]}{'' if smask else '  (no mask)'}")

    print(f"\n{written} images -> {OUT}")


if __name__ == "__main__":
    main()
