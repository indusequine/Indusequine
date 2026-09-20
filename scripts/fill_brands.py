"""Fill in the brand (Shopify vendor) for products whose brand sits in the title.

Products imported without a brand carry vendor "Indusequine", which the site
reads as "no brand" and hides. For a good number of those the brand is right
there in the product title -- "Haas Fetlock Brush", "Ariat Pro Showshirt" --
so it only needs recording in the field the site actually reads.

Every previous vendor is written to brand_fill_state.json before anything
changes, so a bad run is one `--undo` away.

    python3 scripts/fill_brands.py            # dry run, prints the plan
    python3 scripts/fill_brands.py --apply
    python3 scripts/fill_brands.py --undo
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402

NO_BRAND = "Indusequine"
STATE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "brand_fill_state.json")

# Brands that are not yet on any product, so they can't be learned from the
# catalogue itself. Confirmed by the founder on 2026-09-20.
NEW_BRANDS = [
    "Anna Scarpati",
    "Ariat",
    "Bhoof",
    "Double S",
    "EET",
    "Four Beat",
    "HH Equestrian",
    "Haas",
    "Happy Mouth",
    # Delhi Tack Shop lines
    "Albacon",
    "Cypress Hill",
    "EQ Pro",
    "MCL",
    "Velocity",
]

PRODUCTS_QUERY = """
query($cursor: String) {
  products(first: 250, after: $cursor, query: "status:active") {
    pageInfo { hasNextPage endCursor }
    nodes { id title vendor }
  }
}
"""

UPDATE_MUTATION = """
mutation($input: ProductInput!) {
  productUpdate(input: $input) {
    product { id vendor }
    userErrors { field message }
  }
}
"""


def fetch_products(client):
    cursor, out = None, []
    while True:
        page = client.query(PRODUCTS_QUERY, {"cursor": cursor})["data"]["products"]
        out += page["nodes"]
        if not page["pageInfo"]["hasNextPage"]:
            return out
        cursor = page["pageInfo"]["endCursor"]


def build_plan(products):
    """Match each brandless product against the longest brand name it contains."""
    known = {p["vendor"] for p in products if p["vendor"] != NO_BRAND}
    candidates = sorted(known | set(NEW_BRANDS), key=len, reverse=True)
    plan = []
    for product in products:
        if product["vendor"] != NO_BRAND:
            continue
        for brand in candidates:
            if re.search(r"\b" + re.escape(brand) + r"\b", product["title"], re.I):
                plan.append((product, brand))
                break
    return plan


def set_vendor(client, product_id, vendor):
    result = client.query(UPDATE_MUTATION, {"input": {"id": product_id, "vendor": vendor}})
    errors = result["data"]["productUpdate"]["userErrors"]
    if errors:
        raise RuntimeError(f"{product_id}: {errors}")


def main():
    apply = "--apply" in sys.argv
    undo = "--undo" in sys.argv
    client = ShopifyClient(load_env())

    if undo:
        state = json.load(open(STATE_PATH))
        for entry in state:
            set_vendor(client, entry["id"], entry["before"])
            print(f"reverted {entry['title']} -> {entry['before']}")
        print(f"\nreverted {len(state)} products")
        return

    plan = build_plan(fetch_products(client))
    by_brand = {}
    for product, brand in plan:
        by_brand.setdefault(brand, []).append(product["title"])
    for brand in sorted(by_brand, key=lambda b: (-len(by_brand[b]), b)):
        print(f"{brand} ({len(by_brand[brand])})")
        for title in by_brand[brand]:
            print(f"    {title}")
    print(f"\n{len(plan)} products across {len(by_brand)} brands")

    if not apply:
        print("\ndry run -- pass --apply to write")
        return

    if not plan:
        # Nothing to do, usually a second run. Bail out before touching the
        # state file, or the previous run's undo list is lost.
        print("\nnothing left to fill; state file untouched")
        return

    json.dump(
        [{"id": p["id"], "title": p["title"], "before": p["vendor"], "after": b} for p, b in plan],
        open(STATE_PATH, "w"),
        indent=1,
    )
    for index, (product, brand) in enumerate(plan, 1):
        set_vendor(client, product["id"], brand)
        print(f"[{index}/{len(plan)}] {product['title']} -> {brand}")
    print(f"\nset a brand on {len(plan)} products. Undo: python3 scripts/fill_brands.py --undo")


if __name__ == "__main__":
    main()
