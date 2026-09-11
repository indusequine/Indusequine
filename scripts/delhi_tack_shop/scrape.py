#!/usr/bin/env python3
"""Scrape Delhi Tack Shop's catalogue (delhitackshop.com) into structured JSON.

The supplier doesn't keep a separate inventory file -- his website is the
source of truth, so this reads it directly. Product data comes from the React
Server Component payload that Next.js embeds in every server-rendered page,
so no browser is needed.

Usage:
    python3 scripts/delhi_tack_shop/scrape.py            # full catalogue
    python3 scripts/delhi_tack_shop/scrape.py --limit 5  # first N products only

Writes scripts/delhi_tack_shop/output/scraped.json. Re-run any time to pick up
his current prices and stock.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE_URL = "https://delhitackshop.com"
OUT_PATH = Path(__file__).resolve().parent / "output" / "scraped.json"
REQUEST_DELAY = 0.25  # small shop's site -- stay polite


def fetch(url: str, retries: int = 4) -> str:
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Indusequine catalogue sync)"})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read().decode("utf-8")
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            if attempt == retries - 1:
                raise RuntimeError(f"fetch failed for {url}: {e}")
            time.sleep(2 ** attempt)
    raise RuntimeError("unreachable")


def rsc_rows(html: str) -> list:
    """Decode the RSC flight payload into its parsed JSON rows."""
    payload = "".join(
        json.loads(f'"{chunk}"')
        for chunk in re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', html, re.S)
    )
    rows = []
    for line in payload.split("\n"):
        m = re.match(r"^[0-9a-f]+:([\[{].*)$", line)
        if not m:
            continue
        try:
            rows.append(json.loads(m.group(1)))
        except json.JSONDecodeError:
            continue
    return rows


def iter_elements(node):
    """Yield (type, props) for every React element (["$", type, key, props]) in a tree."""
    if isinstance(node, list):
        if len(node) == 4 and node[0] == "$" and isinstance(node[1], str):
            props = node[3] if isinstance(node[3], dict) else {}
            yield node[1], props
            yield from iter_elements(props.get("children"))
        else:
            for child in node:
                yield from iter_elements(child)
    elif isinstance(node, dict):
        for value in node.values():
            yield from iter_elements(value)


def text_of(children) -> str:
    if isinstance(children, str):
        return children
    if isinstance(children, (int, float)):
        return str(children)
    if isinstance(children, list):
        if len(children) == 4 and children[0] == "$":
            props = children[3] if isinstance(children[3], dict) else {}
            return text_of(props.get("children"))
        return "".join(text_of(c) for c in children)
    return ""


def is_element(node, typ: str) -> bool:
    return isinstance(node, list) and len(node) == 4 and node[0] == "$" and node[1] == typ


def parse_product(html: str) -> dict:
    rows = rsc_rows(html)
    cart = price = gallery = None
    breadcrumb: list[dict] = []
    specs: dict[str, str] = {}
    description = None

    for typ, props in iter_elements(rows):
        if cart is None and isinstance(props.get("variants"), list) and "code" in props and "price" in props:
            cart = props
        elif price is None and isinstance(props.get("colorPrices"), dict) and "priceTiers" in props:
            price = props
        elif gallery is None and isinstance(props.get("imageUrls"), list):
            gallery = props
        elif props.get("aria-label") == "Breadcrumb" and not breadcrumb:
            for _, inner in iter_elements(props.get("children")):
                href = inner.get("href") or ""
                if href.startswith("/category/"):
                    breadcrumb.append({"slug": href[len("/category/"):], "name": text_of(inner.get("children")).strip()})
        elif typ == "p" and description is None and "leading-relaxed text-foreground/70" in (props.get("className") or ""):
            description = text_of(props.get("children")).strip() or None
        elif typ == "div":
            kids = props.get("children")
            if isinstance(kids, list) and len(kids) == 2 and is_element(kids[0], "dt") and is_element(kids[1], "dd"):
                specs[text_of(kids[0]).strip()] = text_of(kids[1]).strip()

    if cart is None:
        raise ValueError("no product data found in page payload")

    return {
        "code": cart["code"],
        "name": cart["name"],
        "model": specs.get("Model") or None,
        "categoryPath": breadcrumb,
        "description": description,
        "price": (price or cart).get("price"),
        "discount": (price or cart).get("discount") or 0,
        "priceTiers": (price or cart).get("priceTiers"),
        "colorPrices": (price or {}).get("colorPrices") or {},
        "madeToOrder": bool(cart.get("madeToOrder")),
        "gstRate": cart.get("gstRate"),
        "images": (gallery or {}).get("imageUrls") or ([cart["image"]] if cart.get("image") else []),
        "colorImages": (gallery or {}).get("colorImages") or {},
        "variants": [
            {"size": v.get("size") or None, "color": v.get("color") or None, "quantity": v.get("quantity")}
            for v in cart["variants"]
        ],
        "specs": specs,
    }


def sitemap_paths() -> tuple[list[str], list[str]]:
    xml = fetch(f"{BASE_URL}/sitemap.xml")
    locs = re.findall(r"<loc>([^<]+)</loc>", xml)
    products = [loc.rsplit("/", 1)[1] for loc in locs if "/product/" in loc]
    brands = [loc.rsplit("/", 1)[1] for loc in locs if "/brand/" in loc]
    return products, brands


def brand_map(brand_slugs: list[str]) -> dict[str, str]:
    """Product code (lowercased) -> brand display name, from the supplier's brand pages."""
    out: dict[str, str] = {}
    for slug in brand_slugs:
        html = fetch(f"{BASE_URL}/brand/{slug}")
        h1 = re.search(r"<h1[^>]*>([^<]+)</h1>", html)
        name = h1.group(1).strip() if h1 else slug.replace("-", " ").title()
        for code in set(re.findall(r"/product/([A-Za-z0-9_\-.]+)", html)):
            out[code.lower()] = name
        time.sleep(REQUEST_DELAY)
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--limit", type=int, default=None, help="only scrape the first N products")
    args = parser.parse_args()

    product_codes, brand_slugs = sitemap_paths()
    if args.limit:
        product_codes = product_codes[: args.limit]
    print(f"{len(product_codes)} product(s), {len(brand_slugs)} brand page(s)")

    brands = brand_map(brand_slugs)

    products, failures = [], []
    for i, code in enumerate(product_codes, 1):
        url = f"{BASE_URL}/product/{code}"
        try:
            product = parse_product(fetch(url))
            product["url"] = url
            product["brand"] = brands.get(code.lower())
            products.append(product)
            print(f"[{i}/{len(product_codes)}] {code}: {product['name']} ({len(product['variants'])} variant(s))")
        except Exception as e:
            failures.append({"code": code, "url": url, "error": str(e)})
            print(f"[{i}/{len(product_codes)}] {code}: FAILED - {e}")
        time.sleep(REQUEST_DELAY)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps({
        "source": BASE_URL,
        "scrapedAt": datetime.now(timezone.utc).isoformat(),
        "products": products,
        "failures": failures,
    }, indent=2, ensure_ascii=False))
    print(f"\n{len(products)} scraped, {len(failures)} failed -> {OUT_PATH.relative_to(Path.cwd()) if OUT_PATH.is_relative_to(Path.cwd()) else OUT_PATH}")
    if failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
