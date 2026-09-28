"""Fold brand names that are the same brand spelled two ways.

Shopify holds the brand in `vendor`, and the same maker reached us under two
spellings from two suppliers: "EQUITHEME" and "Equitheme", "Helite" and
"HeLite", "Shires Equestrian" and "Shires". The site reads vendor directly, so
each pair shows up as two brands, splits its products and would put two tiles
in the brand strip.

Every previous value is written to merge_brand_names_state.json first, so a bad
run is one --undo away.

    python3 scripts/merge_brand_names.py           # dry run
    python3 scripts/merge_brand_names.py --apply
    python3 scripts/merge_brand_names.py --undo
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402

STATE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "merge_brand_names_state.json")

# spelling we drop -> spelling we keep (the brand's own styling)
MERGES = {
    "EQUITHEME": "Equitheme",
    "Helite": "HeLite",
    "Shires Equestrian": "Shires",
}

# Riding World and Equithème come from the same French house, and three Riding
# World dog blankets were imported under the Equithème spelling. Their titles
# say Riding World, which is a brand we already carry, so they go there instead
# of disappearing into Equitheme.
BY_TITLE = {"Riding World": "Riding World"}

PRODUCTS_QUERY = """
query($cursor: String) {
  products(first: 250, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes { id title vendor status }
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


def set_vendor(client, product_id, vendor):
    result = client.query(UPDATE_MUTATION, {"input": {"id": product_id, "vendor": vendor}})
    errors = result["data"]["productUpdate"]["userErrors"]
    if errors:
        raise RuntimeError(f"{product_id}: {errors}")


def main():
    apply = "--apply" in sys.argv
    client = ShopifyClient(load_env())

    if "--undo" in sys.argv:
        state = json.load(open(STATE_PATH))
        for entry in state:
            set_vendor(client, entry["id"], entry["before"])
        print(f"reverted {len(state)} products")
        return

    products = fetch_products(client)

    def target(product):
        for prefix, brand in BY_TITLE.items():
            if product["title"].startswith(prefix):
                return brand
        return MERGES[product["vendor"]]

    plan = [(p, target(p)) for p in products if p["vendor"] in MERGES]

    by_target = {}
    for product, keep in plan:
        by_target.setdefault((product["vendor"], keep), []).append(product)
    for (dupe, keep), moving in sorted(by_target.items()):
        staying = [p for p in products if p["vendor"] == keep]
        print(f"{dupe!r} -> {keep!r}: {len(moving)} products move, "
              f"joining {len(staying)} already there ({len(moving) + len(staying)} total)")
        for p in moving:
            flag = "" if p["status"] == "ACTIVE" else f"  [{p['status'].lower()}]"
            print(f"    {p['title'][:66]}{flag}")

    print(f"\n{len(plan)} products across {len(MERGES)} merges")
    if not apply:
        print("\ndry run -- pass --apply to write")
        return
    if not plan:
        print("\nnothing to merge; state file untouched")
        return

    json.dump(
        [{"id": p["id"], "title": p["title"], "before": p["vendor"], "after": keep}
         for p, keep in plan],
        open(STATE_PATH, "w"), indent=1,
    )
    for index, (product, keep) in enumerate(plan, 1):
        set_vendor(client, product["id"], keep)
        print(f"[{index}/{len(plan)}] {product['title'][:56]} -> {keep}")
    print(f"\nmerged {len(plan)} products. Undo: python3 scripts/merge_brand_names.py --undo")


if __name__ == "__main__":
    main()
