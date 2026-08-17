#!/usr/bin/env python3
"""Crawl tackshop.in's own storefront (Zoho Commerce) for product name -> image pairs.

This is the actual tack shop whose inventory we imported, so names should line
up closely with our catalogue. Each collection page embeds its full product
list as a JSON blob in `window.zs_collection = {...}` — no separate API calls
or pagination needed (verified: page=2 returns the same set as page=1).
"""
from __future__ import annotations
import json
import sys
import time
import urllib.request

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

COLLECTIONS = {
    "cwd": "https://www.tackshop.in/collections/cwd/1134286000002943025",
    "samshield": "https://www.tackshop.in/collections/samshield/1134286000002945011",
    "eskadron": "https://www.tackshop.in/collections/eskadron/1134286000002945043",
    "freejump": "https://www.tackshop.in/collections/freejump/1134286000002945003",
    "waldhausen": "https://www.tackshop.in/collections/waldhausen/1134286000007210155",
    "winderen": "https://www.tackshop.in/collections/winderen/1134286000002945027",
    "kask": "https://www.tackshop.in/collections/kask/1134286000007210026",
    "kep": "https://www.tackshop.in/collections/kep/1134286000002945035",
    "mustad": "https://www.tackshop.in/collections/mustad/1134286000008526013",
    "equitheme": "https://www.tackshop.in/collections/equitheme/1134286000007210125",
    "fleck": "https://www.tackshop.in/collections/fleck/1134286000007210036",
    "helite": "https://www.tackshop.in/collections/helite/1134286000002943041",
    "equenatural": "https://www.tackshop.in/collections/equenatural/1134286000002943033",
    "forhorses": "https://www.tackshop.in/collections/forhorses/1134286000007210135",
    "ridingworld": "https://www.tackshop.in/collections/ridingworld/1134286000007210145",
    "all-products": "https://www.tackshop.in/collections/all-products/1134286000002064005",
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def extract_collection_json(html: str) -> dict | None:
    marker = "window.zs_collection = "
    idx = html.find(marker)
    if idx == -1:
        return None
    start = idx + len(marker)
    depth = 0
    end = None
    in_str = False
    esc = False
    for i in range(start, len(html)):
        c = html[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
            continue
        if c == '"':
            in_str = True
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end is None:
        return None
    return json.loads(html[start:end])


def best_image_url(product: dict) -> str | None:
    images = product.get("images") or []
    if not images:
        return None
    img = images[0]
    url = img.get("url")
    if not url:
        return None
    # Upgrade the default thumbnail to a large size; Zoho serves
    # /<file>/<id>/<W>x<H> variants alongside the base thumbnail.
    return f"https://www.tackshop.in{url}/1100x1100"


def main():
    result = {}
    for slug, url in COLLECTIONS.items():
        print(f"fetching: {slug}")
        try:
            html = fetch(url)
        except Exception as e:
            print(f"  failed: {e}", file=sys.stderr)
            continue
        data = extract_collection_json(html)
        if not data:
            print("  no embedded JSON found", file=sys.stderr)
            continue
        products = data.get("products", [])
        out = []
        for p in products:
            out.append(
                {
                    "product_id": p.get("product_id"),
                    "name": p.get("name"),
                    "handle": p.get("handle"),
                    "url": p.get("url"),
                    "brand": p.get("brand"),
                    "image": best_image_url(p),
                }
            )
        result[slug] = out
        print(f"  {len(out)} products")
        time.sleep(0.3)

    with open("tackshop_products.json", "w") as f:
        json.dump(result, f, indent=2)

    total = sum(len(v) for v in result.values())
    print(f"\nTotal product cards (with dupes across collections): {total}")


if __name__ == "__main__":
    main()
