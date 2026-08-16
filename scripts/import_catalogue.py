#!/usr/bin/env python3
"""Converts the tack shop's Excel inventory export into src/data/catalogue.json.

Usage:
    python3 scripts/import_catalogue.py --source ~/Downloads/inventory.xlsx [--out src/data/catalogue.json]

Expects a single worksheet with header row: SKU, ITEM NAME, CATEGORY NAME, RATE.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

import openpyxl

EXCLUDE_KEYWORDS = re.compile(r"display|hang ?tag|dispenser|mixing tip|\bboxes?\b|empty bag", re.I)
EXCLUDE_EXACT_NAMES = {"Samshield Helmet Measuring Tape", "Samshield Jacket Covers and Hangers"}
UNKNOWN_PRICE_THRESHOLD = 5  # rupees; at or below this, treat price as bad data, not real

SIZE_WORDS = {
    "xxs", "xs", "s", "m", "l", "xl", "xxl", "xxxl",
    "ss", "ls", "ms", "st", "lt", "mt", "xls",
    "cob", "full", "pony", "x-full", "xfull", "shetland", "yearling",
    "extra-full", "warmblood", "osfa", "os",
    "small", "medium", "large", "x-small", "x-large", "xx-large",
    "extra small", "extra large",
}
COLOR_WORDS = {
    "black", "blue", "brown", "white", "red", "navy", "green", "grey", "gray", "orange",
    "pink", "purple", "yellow", "silver", "gold", "tan", "beige", "chestnut", "maroon",
    "cream", "ivory", "multi-colour", "multi-color", "multicolour", "multicolor",
    "burgundy", "olive", "rose", "charcoal", "khaki", "turquoise", "coral", "lilac",
    "mint", "peach", "teal", "wine", "bronze", "champagne", "caramel", "anthracite", "multi",
}

BRAND_WHITELIST = [
    "Samshield", "CWD", "Eskadron", "Freejump", "Animo Italia", "Animo", "Waldhausen",
    "Helite", "Equitheme", "Kep Italia", "Bekwick", "Winderen", "Pikeur", "Equiline",
    "Kask", "Horseware", "Mustad", "Busse", "USG", "Fleck",
]
# Longest-first so "Kep Italia" matches before a bare "Kep" would.
BRAND_WHITELIST.sort(key=len, reverse=True)


def is_variant_token(token: str) -> bool:
    t = token.strip().strip('."').lower()
    if not t:
        return True
    if t in SIZE_WORDS or t in COLOR_WORDS:
        return True
    if re.fullmatch(r"\d+(\.\d+)?\"?", t):
        return True
    if re.fullmatch(r"\d{2,3}[sml]", t):  # helmet-liner head size + fit ("55L", "56M")
        return True
    return False


# Matches a bare size token — used only as an anchor to find where the
# variant cluster (size/color) begins, not to identify every attribute.
_SIZE_TOKEN = re.compile(
    r"^(xxs|xs|s|m|l|xl|xxl|xxxl|xl2|xl3|ss|ls|ms|st|lt|mt|xls|"
    r"small|medium|large|xlarge|xsmall|xxlarge|"
    r"cob|full|pony|x-full|xfull|shetland|yearling|extra-full|warmblood|osfa|os|"
    r"fr[0-9]{2,3}|in[0-9]{2,3}|"  # European clothing size ("FR36") / inseam-inches ("IN26")
    r"[0-9]{2,3}[sml]|"  # helmet-liner head size + fit ("55L", "56M")
    r'[0-9]{1,3}(\.[0-9])?"?)$',
    re.I,
)


def _find_variant_start(name: str) -> tuple[str, str] | None:
    """Locate where a product's variant cluster (size/color) begins.

    Free-text fashion colors ("Night Blue Tone on Tone") can't be matched
    word-by-word, so instead this anchors on a *size* token — a much
    smaller, reliable vocabulary — and only trusts that anchor when it's
    adjacent to a "/", since sizes in this data always border a slash
    (".../32/Amarante", "...Black/L") while unrelated hyphenated codes
    (CWD's "BL-17-2C" tree-width codes) never do. Once anchored, it walks
    backward to absorb a color that precedes the size (freely across "/",
    at most one "-") without absorbing real product-name words.
    """
    parts = re.split(r"([\-/])", name.strip())
    offsets = []
    pos = 0
    for p in parts:
        offsets.append(pos)
        pos += len(p)

    candidates = []
    for i in range(1, len(parts), 2):
        delim = parts[i]
        following = parts[i + 1].strip() if i + 1 < len(parts) else ""
        if not _SIZE_TOKEN.match(following):
            continue
        after_delim = parts[i + 2] if i + 2 < len(parts) else None
        if delim == "/" or after_delim == "/":
            candidates.append(i)
    if not candidates:
        return None
    split_idx = min(candidates)

    hyphen_budget = 1
    while split_idx - 2 >= 0:
        prev_delim = parts[split_idx - 2]
        if prev_delim == "/":
            split_idx -= 2
        elif prev_delim == "-" and hyphen_budget > 0:
            hyphen_budget -= 1
            split_idx -= 2
        else:
            break

    cut = offsets[split_idx]
    return name[:cut].strip(" -/"), name[cut:].strip(" -/")


def base_name(name: str) -> str:
    anchored = _find_variant_start(name)
    if anchored:
        base, _tail = anchored
        if base:
            return base

    # Fallback for names with no slash-adjacent size anchor at all (e.g.
    # "Bell Boots (with Fleece Lining)- Full") — strip recognized trailing
    # tokens one at a time.
    remaining = name.strip()
    changed = True
    while changed:
        changed = False
        m = re.search(r'[\-/]\s*([A-Za-z0-9.\"]+)\s*$', remaining)
        if m and is_variant_token(m.group(1)):
            remaining = remaining[: m.start()]
            changed = True
            continue
        m2 = re.search(r'\s+([A-Za-z0-9.\"]+)\s*$', remaining)
        if m2 and is_variant_token(m2.group(1)) and len(remaining[: m2.start()].strip()) > 3:
            remaining = remaining[: m2.start()]
            changed = True
    remaining = remaining.strip(" -/")
    return remaining or name.strip()


def extract_variant_descriptor(full_name: str, base: str) -> tuple[str | None, str | None]:
    """Best-effort size/color pulled from the tail that base_name() stripped off."""
    tail = full_name.strip()[len(base) :].strip(" -/")
    if not tail:
        return None, None
    parts = re.split(r"[\-/]", tail)
    size = None
    color = None
    for p in parts:
        t = p.strip().strip('."')
        if not t:
            continue
        low = t.lower()
        if low in COLOR_WORDS or low in {c.replace("-", "") for c in COLOR_WORDS}:
            color = t
        elif low in SIZE_WORDS or re.fullmatch(r"\d+(\.\d+)?\"?", low) or re.fullmatch(r"\d{2,3}[sml]", low):
            size = t
    return size, color


def extract_brand(name: str) -> str | None:
    for brand in BRAND_WHITELIST:
        if name.lower().startswith(brand.lower() + " "):
            return "Animo Italia" if brand == "Animo" else ("Kep Italia" if brand == "Kep Italia" else brand)
    return None


def slugify(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path, help="Path to the .xlsx inventory export")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "src" / "data" / "catalogue.json",
    )
    args = parser.parse_args()

    source = args.source.expanduser()
    if not source.exists():
        print(f"error: source file not found: {source}", file=sys.stderr)
        sys.exit(1)

    wb = openpyxl.load_workbook(source, data_only=True)
    ws = wb.worksheets[0]
    rows = [r for r in ws.iter_rows(min_row=2, values_only=True) if r and r[0]]

    excluded = []
    kept = []
    for r in rows:
        sku, name, category, price = r[0], r[1], r[2], r[3]
        name = (name or "").strip()
        category = (category or "").strip()
        if EXCLUDE_KEYWORDS.search(name) or name in EXCLUDE_EXACT_NAMES:
            excluded.append(name)
            continue
        kept.append((str(sku), name, category, price))

    # Category slugs, asserted unique.
    category_names = sorted({c for _, _, c, _ in kept})
    category_slugs = {}
    for name in category_names:
        slug = slugify(name)
        assert slug not in category_slugs.values(), f"category slug collision: {name!r} -> {slug!r}"
        category_slugs[name] = slug

    # Group rows into products.
    groups: dict[tuple[str, str], list] = defaultdict(list)
    for sku, name, category, price in kept:
        bn = base_name(name)
        groups[(category, bn)].append((sku, name, price))

    products = []
    for (category, bn), items in groups.items():
        variants = []
        for sku, full_name, price in items:
            size, color = extract_variant_descriptor(full_name, bn)
            price_value = None
            if isinstance(price, (int, float)) and price > UNKNOWN_PRICE_THRESHOLD:
                price_value = round(float(price), 2)
                if price_value == int(price_value):
                    price_value = int(price_value)
            variants.append({"sku": sku, "size": size, "color": color, "price": price_value})
        products.append(
            {
                "base_name": bn,
                "category": category,
                "brand": extract_brand(bn),
                "variants": variants,
            }
        )

    # Slug assignment: base slug, suffix category on any collision, on both sides.
    base_slugs = [slugify(p["base_name"]) for p in products]
    counts = Counter(base_slugs)
    seen = set()
    for p, bslug in zip(products, base_slugs):
        if counts[bslug] > 1:
            final = f"{bslug}-{category_slugs[p['category']]}"
        else:
            final = bslug
        if final in seen:
            # Residual collision (rare — same name repeated within one category).
            # Deterministic numeric fallback, order given by the sort below.
            n = 2
            while f"{final}-{n}" in seen:
                n += 1
            final = f"{final}-{n}"
        seen.add(final)
        p["slug"] = final

    collisions_resolved = sum(1 for c in counts.values() if c > 1)

    output_products = [
        {
            "slug": p["slug"],
            "category": category_slugs[p["category"]],
            "name": p["base_name"],
            "brand": p["brand"],
            "variants": [
                {"sku": v["sku"], "size": v["size"], "color": v["color"], "price": v["price"]}
                for v in p["variants"]
            ],
        }
        for p in products
    ]
    output_categories = [{"slug": slug, "name": name} for name, slug in category_slugs.items()]

    output = {
        "generatedAt": datetime.now(timezone.utc).astimezone().isoformat(),
        "sourceFile": source.name,
        "categories": sorted(output_categories, key=lambda c: c["name"]),
        "products": sorted(output_products, key=lambda p: p["name"]),
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    singleton = sum(1 for p in products if len(p["variants"]) == 1)
    multi = sum(1 for p in products if len(p["variants"]) > 1)
    price_mismatch = 0
    for p in products:
        known = {v["price"] for v in p["variants"] if v["price"] is not None}
        if len(known) > 1:
            price_mismatch += 1
    all_prices = [v["price"] for p in products for v in p["variants"] if v["price"] is not None]

    print(f"rows read:            {len(rows)}")
    print(f"rows excluded:        {len(excluded)}  {excluded}")
    print(f"rows kept:            {len(kept)}")
    print(f"products:             {len(products)}")
    print(f"  singleton (1 sku):  {singleton}")
    print(f"  multi-variant:      {multi}  ({price_mismatch} with price disagreement)")
    print(f"categories:           {len(output_categories)}")
    print(f"slug collisions resolved: {collisions_resolved}")
    print(f"price range:          {min(all_prices)} - {max(all_prices)}")
    print(f"wrote:                {args.out}")


if __name__ == "__main__":
    main()
