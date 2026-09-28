"""Move products out of the catch-all categories into real ones.

"Others" was a drawer for anything the import could not place, and gift cards
had a category to themselves. Both were offered to riders as though they were
real categories.

A category lives in two places: a "category:<slug>" tag, which the site reads
off the product, and a Shopify collection, which the site builds the category
list from. They are manual collections, not rule-based, so a move has to change
both or the counts and the listings disagree.

Two categories are created because nothing existing fits: Sunglasses, which
belongs with the rider's gear, and Stable, for arena and yard equipment.

    python3 scripts/recategorise.py            # dry run, prints the plan
    python3 scripts/recategorise.py --apply
    python3 scripts/recategorise.py --undo
"""

import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402

STATE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "recategorise_state.json")

# Categories that have to exist before anything moves: handle -> title.
NEW_CATEGORIES = {
    "sunglasses": "Sunglasses",
    "stable": "Stable",
}

# Everything in gift-card moves wholesale.
WHOLESALE = {"gift-card": "gifts"}

# Products in "others", matched on a phrase in the title. First match wins, so
# the more specific phrases come first.
BY_TITLE = [
    ("Leather Show Halter", "halter-and-lead-rope"),
    ("Mustad", "horse-shoe"),
    ("Air Vest", "protective-vests"),
    ("Set of Spurs", "spurs-and-spur-straps"),
    ("Rubber Grooming Gloves", "grooming"),
    ("Snaffle Bits", "bits-and-connectors"),
    ("Breastplate", "breastplate-and-martingale"),
    ("Key Chain", "key-chain"),
    ("Sun Glasses", "sunglasses"),
    ("Keyhole Cup", "stable"),
]

PRODUCTS_QUERY = """
query($cursor: String) {
  products(first: 250, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes { id title tags }
  }
}
"""

COLLECTIONS_QUERY = """
query($cursor: String) {
  collections(first: 250, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes { id handle title }
  }
}
"""

COLLECTION_CREATE = """
mutation($input: CollectionInput!) {
  collectionCreate(input: $input) { collection { id handle } userErrors { field message } }
}
"""

TAGS_ADD = "mutation($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }"
TAGS_REMOVE = "mutation($id: ID!, $tags: [String!]!) { tagsRemove(id: $id, tags: $tags) { userErrors { message } } }"
ADD_TO_COLLECTION = """
mutation($id: ID!, $productIds: [ID!]!) {
  collectionAddProductsV2(id: $id, productIds: $productIds) { userErrors { message } }
}
"""
PUBLISH = """
mutation($id: ID!, $input: [PublicationInput!]!) {
  publishablePublish(id: $id, input: $input) { userErrors { message } }
}
"""

REMOVE_FROM_COLLECTION = """
mutation($id: ID!, $productIds: [ID!]!) {
  collectionRemoveProducts(id: $id, productIds: $productIds) { userErrors { message } }
}
"""


def fetch_all(client, query, key):
    cursor, out = None, []
    while True:
        page = client.query(query, {"cursor": cursor})["data"][key]
        out += page["nodes"]
        if not page["pageInfo"]["hasNextPage"]:
            return out
        cursor = page["pageInfo"]["endCursor"]


def category_of(tags):
    tag = next((t for t in tags if t.startswith("category:")), None)
    return tag[len("category:"):] if tag else None


def build_plan(products):
    plan = []
    for product in products:
        current = category_of(product["tags"])
        if current in WHOLESALE:
            plan.append((product, current, WHOLESALE[current]))
            continue
        if current != "others":
            continue
        target = next((t for phrase, t in BY_TITLE if phrase.lower() in product["title"].lower()), None)
        if target:
            plan.append((product, current, target))
    return plan


def ensure_categories(client, by_handle, apply):
    for handle, title in NEW_CATEGORIES.items():
        if handle in by_handle:
            continue
        print(f"  create category {title!r} ({handle})")
        if not apply:
            continue
        result = client.query(COLLECTION_CREATE, {"input": {"title": title, "handle": handle}})
        errors = result["data"]["collectionCreate"]["userErrors"]
        if errors:
            raise RuntimeError(f"could not create {handle}: {errors}")
        gid = result["data"]["collectionCreate"]["collection"]["id"]
        by_handle[handle] = gid
        # A collection the headless channel cannot see does not exist as far as
        # the site is concerned: its page 404s and it is missing from the
        # category list, however many products are in it.
        publish(client, gid)
        time.sleep(0.4)


def publish(client, gid):
    result = client.query(PUBLISH, {"id": gid, "input": [{"publicationId": client.headless_publication_id()}]})
    errors = result["data"]["publishablePublish"]["userErrors"]
    if errors:
        raise RuntimeError(f"could not publish {gid}: {errors}")


def move(client, product_id, from_slug, to_slug, collections):
    client.query(TAGS_REMOVE, {"id": product_id, "tags": [f"category:{from_slug}"]})
    client.query(TAGS_ADD, {"id": product_id, "tags": [f"category:{to_slug}"]})
    if from_slug in collections:
        client.query(REMOVE_FROM_COLLECTION,
                     {"id": collections[from_slug], "productIds": [product_id]})
    client.query(ADD_TO_COLLECTION, {"id": collections[to_slug], "productIds": [product_id]})


def main():
    apply = "--apply" in sys.argv
    client = ShopifyClient(load_env())
    collections = {c["handle"]: c["id"] for c in fetch_all(client, COLLECTIONS_QUERY, "collections")}

    if "--undo" in sys.argv:
        state = json.load(open(STATE_PATH))
        for entry in state:
            move(client, entry["id"], entry["to"], entry["from"], collections)
            print(f"back to {entry['from']}: {entry['title'][:56]}")
        print(f"\nreverted {len(state)} products")
        return

    products = fetch_all(client, PRODUCTS_QUERY, "products")
    plan = build_plan(products)

    print("categories:")
    ensure_categories(client, collections, apply)

    grouped = {}
    for product, source, target in plan:
        grouped.setdefault((source, target), []).append(product["title"])
    print("\nmoves:")
    for (source, target), titles in sorted(grouped.items(), key=lambda kv: -len(kv[1])):
        print(f"  {source} -> {target}  ({len(titles)})")
        for title in titles[:4]:
            print(f"      {title[:62]}")
        if len(titles) > 4:
            print(f"      ... and {len(titles) - 4} more")
    print(f"\n{len(plan)} products across {len(grouped)} moves")

    if not apply:
        print("\ndry run -- pass --apply to write")
        return
    if not plan:
        print("\nnothing to move; state file untouched")
        return

    json.dump(
        [{"id": p["id"], "title": p["title"], "from": s, "to": t} for p, s, t in plan],
        open(STATE_PATH, "w"), indent=1,
    )
    for index, (product, source, target) in enumerate(plan, 1):
        move(client, product["id"], source, target, collections)
        print(f"[{index}/{len(plan)}] {product['title'][:52]} -> {target}")
    print(f"\nmoved {len(plan)} products. Undo: python3 scripts/recategorise.py --undo")


if __name__ == "__main__":
    main()
