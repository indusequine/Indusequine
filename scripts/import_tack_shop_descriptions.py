#!/usr/bin/env python3
"""Import The Tack Shop's product descriptions into Shopify.

Every Tack Shop product on the site currently has no description at all.
Their export (Item_Desc_Tack-Shop.xlsx) carries one for most of them, matched
to our catalogue by SKU, which overlaps 100%.

Notes on what gets written:
  - `Long Description` where present, else `Store Description`.
  - stored as descriptionHtml, Shopify's native field. The storefront reads
    Product.description, which Shopify serves with HTML stripped, so the app
    gets clean text without us mangling anything -- and the marked-up version
    is still there if we ever render it properly.
  - <iframe>/<script>/<style> are removed first. Nine of their descriptions
    embed YouTube players, which we are not putting on our product pages.
  - uses productUpdate, which touches only the description. Deliberately NOT
    productSet: that replaces a product's variant list wholesale and cost us
    two variants during the merge.

Nothing is overwritten: a product that already has a description is skipped
unless --overwrite is passed.

Usage:
    python3 scripts/import_tack_shop_descriptions.py --dry-run
    python3 scripts/import_tack_shop_descriptions.py --limit 5
    python3 scripts/import_tack_shop_descriptions.py
"""
from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402

XLSX = Path.home() / "Downloads" / "Item_Desc_Tack-Shop.xlsx"
SUPPLIER_TAG = "supplier:the-tack-shop"
MIN_LEN = 20  # below this it's "N/A" or a stray character, not a description

PRODUCTS_QUERY = """
query($n: Int!, $a: String) {
  products(first: $n, after: $a) {
    edges { node { id handle title tags status descriptionHtml
      variants(first: 100) { edges { node { sku } } } } }
    pageInfo { hasNextPage endCursor }
  }
}
"""

UPDATE_MUTATION = """
mutation($input: ProductInput!) {
  productUpdate(input: $input) { product { id } userErrors { field message } }
}
"""

UNSAFE = re.compile(r"<(iframe|script|style)\b.*?</\1\s*>", re.I | re.S)
STRAY = re.compile(r"<(iframe|script|style|embed|object)\b[^>]*/?>", re.I)


def clean(x) -> str:
    s = "" if x is None else str(x).strip()
    return "" if s.lower() in ("", "none", "nan") else s


def sanitise(text: str) -> str:
    """Their markup, minus anything we don't want on a product page."""
    out = UNSAFE.sub("", text)
    out = STRAY.sub("", out)
    return out.strip()


def plain(text: str) -> str:
    """Roughly what the storefront will show, for dry-run review."""
    t = re.sub(r"<br\s*/?>|</p>", " ", text, flags=re.I)
    t = re.sub(r"<[^>]+>", "", t)
    return re.sub(r"\s+", " ", html.unescape(t)).strip()


def is_prose(text: str) -> bool:
    """Reject variant names masquerading as descriptions.

    Their file often repeats a variant label -- "Anna Scarpati Falco
    White-Blue Showshirt/44" -- in the description column. Real copy is
    longer, and doesn't read as slash-separated option values.
    """
    words = text.split()
    if len(words) < 10:
        return False
    # "Donna / Women / 44 / White" -- mostly separators, not sentences
    if text.count("/") >= 3 and len(words) < 25:
        return False
    return True


def echoes_title(text: str, title: str) -> bool:
    """True when the description carries nothing the title doesn't already."""
    norm = lambda s: re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()  # noqa: E731
    t, ti = norm(text), norm(title)
    if len(t) <= len(ti) + 12:
        return True
    tw, tiw = set(t.split()), set(ti.split())
    return bool(tw) and len(tw - tiw) <= 2


def read_supplier_rows() -> dict[str, str]:
    """SKU -> chosen description, already sanitised."""
    import openpyxl
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb["ProductGroup"]
    rows = ws.iter_rows(values_only=True)
    hdr = [clean(h) for h in next(rows)]
    idx = {h: i for i, h in enumerate(hdr)}
    out: dict[str, str] = {}
    for r in rows:
        if not any(r):
            continue
        get = lambda k: clean(r[idx[k]]) if k in idx and idx[k] < len(r) else ""  # noqa: E731
        sku = get("SKU").upper()
        if not sku or sku in out:
            continue
        body = sanitise(get("Long Description") or get("Store Description"))
        if len(plain(body)) >= MIN_LEN:
            out[sku] = body
    return out


def our_products(client: ShopifyClient) -> list[dict]:
    got, cursor = [], None
    while True:
        res = client.query(PRODUCTS_QUERY, {"n": 60, "a": cursor})
        if res.get("errors"):
            raise RuntimeError(res["errors"])
        data = res["data"]["products"]
        for e in data["edges"]:
            n = e["node"]
            if SUPPLIER_TAG not in n["tags"]:
                continue
            # Drafted merge fragments are hidden from the site; writing copy
            # onto them helps nobody.
            if n["status"] != "ACTIVE":
                continue
            got.append({
                "id": n["id"], "handle": n["handle"], "title": n["title"],
                "has_desc": bool(clean(n["descriptionHtml"])),
                "skus": [clean(v["node"]["sku"]).upper() for v in n["variants"]["edges"]],
            })
        if not data["pageInfo"]["hasNextPage"]:
            return got
        cursor = data["pageInfo"]["endCursor"]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--overwrite", action="store_true")
    args = ap.parse_args()

    by_sku = read_supplier_rows()
    client = ShopifyClient(load_env())
    ours = our_products(client)
    print(f"our Tack Shop products: {len(ours)}")
    print(f"usable descriptions in their file: {len(by_sku)} SKUs\n")

    plan, already, nomatch, echo = [], 0, 0, 0
    for p in ours:
        if p["has_desc"] and not args.overwrite:
            already += 1
            continue
        body = next((by_sku[s] for s in p["skus"] if s in by_sku), None)
        if not body:
            nomatch += 1
            continue
        # A "description" that is just the product name restated adds a line of
        # duplicate text under the title and tells a rider nothing.
        flat = plain(body)
        if echoes_title(flat, p["title"]) or not is_prose(flat):
            echo += 1
            continue
        plan.append((p, body))

    print(f"would gain a description: {len(plan)}")
    print(f"already has one, skipped : {already}")
    print(f"no description on offer:  {nomatch}")
    print(f"not usable copy (echoes the title / variant label): {echo}")

    todo = plan[: args.limit] if args.limit else plan
    if args.dry_run:
        for p, body in todo[:6]:
            print(f"\n  {p['title'][:58]}")
            print(f"    {plain(body)[:200]}…")
        return 0

    done = 0
    for i, (p, body) in enumerate(todo, 1):
        res = client.query(UPDATE_MUTATION, {"input": {"id": p["id"], "descriptionHtml": body}})
        errs = res.get("errors") or ((res.get("data") or {}).get("productUpdate") or {}).get("userErrors")
        if errs:
            print(f"[{i}/{len(todo)}] FAILED {p['handle']}: {str(errs)[:140]}")
            continue
        done += 1
        if i % 100 == 0 or i == len(todo):
            print(f"[{i}/{len(todo)}] {done} written")
    print(f"\ndone: {done} descriptions written")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
