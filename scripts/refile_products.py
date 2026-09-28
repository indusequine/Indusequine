#!/usr/bin/env python3
"""Move individual products that were filed under the wrong category.

Found by reading what each product's own description says it is, not by
guessing from its name: an Equitheme "Competition" polo with a tie loop is a
show shirt whatever the importer decided, and a Cavalleria Toscana polo whose
description says "made for training and casual wear" is not.

A category lives in two places, a "category:<slug>" tag and a manual Shopify
collection, so each move changes both or the listings and the counts disagree.

    python3 scripts/refile_products.py            # dry run, prints the plan
    python3 scripts/refile_products.py --apply
    python3 scripts/refile_products.py --undo
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402
from recategorise import (  # noqa: E402
    ADD_TO_COLLECTION,
    COLLECTIONS_QUERY,
    REMOVE_FROM_COLLECTION,
    TAGS_ADD,
    TAGS_REMOVE,
    fetch_all,
)

STATE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "refile_state.json")

# handle -> (from, to, why)
MOVES = {
    "equitheme-competition-wellington-polo-kids": (
        "t-shirt", "show-shirt", "white stand-up collar with a tie loop"),
    "equitheme-competition-victor-polo-men": (
        "t-shirt", "show-shirt", "competition collar, buttoned closure"),
    "toscan-unisex-riding-shirts-polo-uomo": (
        "show-shirt", "t-shirt", "its own description says training and casual wear"),
    "kingsland-ladies-riding-shirts-klharriet-2410202522": (
        "show-shirt", "t-shirt", "a riding shirt rather than a show shirt"),
    "kingsland-mens-riding-shirts-klharbour-2410202523": (
        "show-shirt", "t-shirt", "a riding shirt rather than a show shirt"),
    "fly-mask-nylon-fm": (
        "saddle-pads", "fly-mask", "it is a fly mask"),
    "nylon-halter-with-lead-rope-nhl": (
        "saddle-pads", "halter-and-lead-rope", "it is a halter"),
}

PRODUCT_QUERY = """
query($q: String!) {
  products(first: 10, query: $q) { nodes { id handle title tags } }
}
"""


def move(client, product_id, from_slug, to_slug, collections):
    client.query(TAGS_REMOVE, {"id": product_id, "tags": [f"category:{from_slug}"]})
    client.query(TAGS_ADD, {"id": product_id, "tags": [f"category:{to_slug}"]})
    if from_slug in collections:
        client.query(REMOVE_FROM_COLLECTION,
                     {"id": collections[from_slug], "productIds": [product_id]})
    client.query(ADD_TO_COLLECTION, {"id": collections[to_slug], "productIds": [product_id]})


def main():
    apply = "--apply" in sys.argv
    undo = "--undo" in sys.argv
    client = ShopifyClient(load_env())
    collections = {c["handle"]: c["id"] for c in fetch_all(client, COLLECTIONS_QUERY, "collections")}

    if undo:
        if not os.path.exists(STATE_PATH):
            print("nothing to undo")
            return 0
        done = json.load(open(STATE_PATH))["moved"]
        for row in done:
            move(client, row["id"], row["to"], row["from"], collections)
            print(f"put back {row['handle']} -> {row['from']}")
        os.remove(STATE_PATH)
        return 0

    plan, missing = [], []
    for handle, (src, dst, why) in MOVES.items():
        found = client.query(PRODUCT_QUERY, {"q": f"handle:{handle}"})["data"]["products"]["nodes"]
        node = next((n for n in found if n["handle"] == handle), None)
        if not node:
            missing.append(handle)
            continue
        # Refuse a move whose starting point is not what we think it is: the
        # tag is what the site reads, so acting on a stale assumption would
        # leave the product in neither category.
        if f"category:{src}" not in node["tags"]:
            actual = next((t for t in node["tags"] if t.startswith("category:")), "none")
            missing.append(f"{handle} (expected {src}, has {actual})")
            continue
        if dst not in collections:
            missing.append(f"{handle} (no collection {dst})")
            continue
        plan.append({"id": node["id"], "handle": handle, "title": node["title"],
                     "from": src, "to": dst, "why": why})

    print(f"{len(plan)} products to refile\n")
    for p in plan:
        print(f"  {p['title'][:46]:46s} {p['from']:12s} -> {p['to']}")
        print(f"      {p['why']}")
    for m in missing:
        print(f"  SKIPPED {m}")

    if not apply:
        print("\nDry run. Nothing written. Re-run with --apply.")
        return 0

    for p in plan:
        move(client, p["id"], p["from"], p["to"], collections)
        print(f"moved {p['handle']} -> {p['to']}")

    with open(STATE_PATH, "w") as f:
        json.dump({"moved": plan}, f, indent=1)
    print(f"\n{len(plan)} moved. --undo puts them back.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
