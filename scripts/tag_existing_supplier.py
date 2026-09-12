#!/usr/bin/env python3
"""Tag the original catalogue with its seller.

Delhi Tack Shop's products already carry `supplier:delhi-tack-shop`, added by
their importer. The 1,193 products from the original migration carry no
supplier tag at all, so the site can't say who sells them. This adds
`supplier:the-tack-shop` to exactly those.

Uses Shopify's tagsAdd mutation, which appends. It never rewrites a product's
tag list, so the `category:` tags the whole site navigates by cannot be
disturbed. Products that already carry any `supplier:` tag are left alone, so
this is safe to re-run and will never relabel Delhi Tack Shop's stock.

Usage:
    python3 scripts/tag_existing_supplier.py --dry-run
    python3 scripts/tag_existing_supplier.py --limit 5      # a cautious first pass
    python3 scripts/tag_existing_supplier.py
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402

NEW_TAG = "supplier:the-tack-shop"
SUPPLIER_PREFIX = "supplier:"

ALL_PRODUCTS_QUERY = """
query($cursor: String) {
  products(first: 250, after: $cursor) {
    edges { node { id handle title tags } }
    pageInfo { hasNextPage endCursor }
  }
}
"""

TAGS_ADD_MUTATION = """
mutation($id: ID!, $tags: [String!]!) {
  tagsAdd(id: $id, tags: $tags) {
    userErrors { field message }
  }
}
"""


def fetch_all(client: ShopifyClient) -> list[dict]:
    products, cursor = [], None
    while True:
        result = client.query(ALL_PRODUCTS_QUERY, {"cursor": cursor})
        if result.get("errors"):
            raise RuntimeError(f"query failed: {result['errors']}")
        data = result["data"]["products"]
        products.extend(e["node"] for e in data["edges"])
        if not data["pageInfo"]["hasNextPage"]:
            return products
        cursor = data["pageInfo"]["endCursor"]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="only tag the first N products")
    args = ap.parse_args()

    client = ShopifyClient(load_env())

    products = fetch_all(client)
    untagged = [p for p in products if not any(t.startswith(SUPPLIER_PREFIX) for t in p["tags"])]
    already = len(products) - len(untagged)

    print(f"{len(products)} products live")
    print(f"  {already} already carry a supplier tag -- untouched")
    print(f"  {len(untagged)} carry none -- these get {NEW_TAG}")

    targets = untagged[: args.limit] if args.limit else untagged
    if args.limit:
        print(f"  (--limit {args.limit}: tagging only the first {len(targets)})")

    if args.dry_run:
        for p in targets[:10]:
            print(f"    would tag: {p['handle']}")
        if len(targets) > 10:
            print(f"    ... and {len(targets) - 10} more")
        return 0

    failed = 0
    for i, p in enumerate(targets, 1):
        result = client.query(TAGS_ADD_MUTATION, {"id": p["id"], "tags": [NEW_TAG]})
        errors = result.get("errors") or result["data"]["tagsAdd"]["userErrors"]
        if errors:
            failed += 1
            print(f"  FAILED {p['handle']}: {errors}")
        elif i % 100 == 0 or i == len(targets):
            print(f"  tagged {i}/{len(targets)}")

    print(f"\ndone: {len(targets) - failed} tagged, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
