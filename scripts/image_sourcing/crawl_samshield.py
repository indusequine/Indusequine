#!/usr/bin/env python3
"""Crawl Samshield's public site for product name -> image URL pairs."""
from __future__ import annotations
import json
import re
import sys
import time
import urllib.request
import urllib.parse

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

ARTICLE_RE = re.compile(
    r'<article class="product-miniature js-product-miniature"[^>]*data-id-product="(\d+)".*?</article>', re.S
)
IMG_RE = re.compile(r'data-full-size-image-url="([^"]+)"')
TITLE_RE = re.compile(r'<div class="product-title">\s*<a[^>]*>\s*([^<]+?)\s*</a>')
PAGE_URL_RE = re.compile(r'class="thumbnail product-thumbnail"\s*href="([^"#]+)')


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def parse_products(html: str) -> list[dict]:
    out = []
    for m in ARTICLE_RE.finditer(html):
        block = m.group(0)
        img_m = IMG_RE.search(block)
        title_m = TITLE_RE.search(block)
        url_m = PAGE_URL_RE.search(block)
        if not (img_m and title_m):
            continue
        out.append(
            {
                "id_product": m.group(1),
                "name": title_m.group(1).strip(),
                "image": img_m.group(1),
                "url": url_m.group(1) if url_m else None,
            }
        )
    return out


def crawl_category(base_url: str, max_pages: int = 20) -> list[dict]:
    all_products: dict[str, dict] = {}
    for page in range(1, max_pages + 1):
        url = base_url if page == 1 else f"{base_url}?page={page}"
        try:
            html = fetch(url)
        except Exception as e:
            print(f"    fetch failed for {url}: {e}", file=sys.stderr)
            break
        products = parse_products(html)
        if not products:
            break
        new_count = 0
        for p in products:
            key = p["id_product"]
            if key not in all_products:
                all_products[key] = p
                new_count += 1
        print(f"    page {page}: {len(products)} cards, {new_count} new (total {len(all_products)})")
        if new_count == 0:
            break
        time.sleep(0.35)
    return list(all_products.values())


def search(term: str) -> list[dict]:
    url = "https://www.samshield.com/en/search?s=" + urllib.parse.quote(term)
    try:
        html = fetch(url)
    except Exception as e:
        print(f"    search failed for {term!r}: {e}", file=sys.stderr)
        return []
    return parse_products(html)


CATEGORIES = {
    "breeches": "https://www.samshield.com/en/24-breeches",
    "jacket": "https://www.samshield.com/en/23-jacket",
    "shirt": "https://www.samshield.com/en/25-shirt",
    "pull-over-sweat-shirt": "https://www.samshield.com/en/26-pull-over-sweat-shirt",
    "t-shirt": "https://www.samshield.com/en/27-t-shirt",
    "bomber-down-vest": "https://www.samshield.com/en/29-bomber-down-vest",
    "parka-softshell-raincoat": "https://www.samshield.com/en/30-parka-softshell-raincoat",
    "accessoire": "https://www.samshield.com/en/31-accessories",
    "gloves": "https://www.samshield.com/en/70-gloves",
    "horsewear": "https://www.samshield.com/en/71-horsewear",
    "bags": "https://www.samshield.com/en/72-bags",
}

SEARCH_TERMS = ["helmet", "socks", "tie", "cap", "key chain"]

if __name__ == "__main__":
    result = {}
    for name, url in CATEGORIES.items():
        print(f"crawling category: {name}")
        result[f"category:{name}"] = crawl_category(url)

    for term in SEARCH_TERMS:
        print(f"searching: {term}")
        result[f"search:{term}"] = search(term)
        time.sleep(0.3)

    with open("samshield_products.json", "w") as f:
        json.dump(result, f, indent=2)

    total = sum(len(v) for v in result.values())
    print(f"\nTotal product cards found (with dupes across categories/searches): {total}")
