#!/usr/bin/env python3
"""Give each colour its own listing, where we have a photograph of each colour.

A rider scanning a category sees the navy breeches and the beige ones as two
cards rather than one card and a colour dropdown. That only helps when each
colour actually has a photograph: splitting a product that has one photo for
five colours gives five identical cards, which is what the variant merge spent
a day undoing.

So this only touches products where every colour owns at least one image, found
by reading the colour out of the image filename. 23 of 819 products qualify.
The other 163 colour products genuinely have one photo between them and are
left alone.

Reversible. Before anything is written, each product's whole shape is recorded
in split_colours_state.json: its options, every variant with its SKU and price,
and which media it had. --undo puts the original back and hides the listings
this made.

    python3 scripts/split_colours.py            # dry run, prints the plan
    python3 scripts/split_colours.py --apply
    python3 scripts/split_colours.py --undo
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402
from revalidate import ping  # noqa: E402
from snapshot import take  # noqa: E402

STATE = os.path.join(HERE, "split_colours_state.json")

# Colours whose photograph is named something else. Confirmed by the founder
# against the full filename, one at a time, rather than inferred.
ALIASES = {
    "lime green": "limegrn",
    "royal blue": "royal",
}

# Where exactly one colour and one image are left over and the image carries no
# colour at all, that image is that colour. Only these, checked by hand.
LEFTOVER_OK = {
    "arma-supafleece-over-reach-boots": "Black",
}

ALL_PRODUCTS = """
query($cursor: String) {
  products(first: 100, after: $cursor, query: "status:active") {
    pageInfo { hasNextPage endCursor }
    nodes {
      id handle title vendor tags
      descriptionHtml
      options { name values }
      media(first: 50) { nodes { ... on MediaImage { id alt image { url } } } }
      variants(first: 100) { nodes { id sku price selectedOptions { name value } } }
    }
  }
}
"""

PRODUCT_SET = """
mutation($input: ProductSetInput!, $identifier: ProductSetIdentifiers!) {
  productSet(input: $input, synchronous: true, identifier: $identifier) {
    product { id handle }
    userErrors { field message }
  }
}
"""

STATUS = """
mutation($input: ProductInput!) {
  productUpdate(input: $input) { product { handle status } userErrors { field message } }
}
"""

PUBLISH = """
mutation($id: ID!, $input: [PublicationInput!]!) {
  publishablePublish(id: $id, input: $input) { userErrors { message } }
}
"""

ADD_TO_COLLECTION = """
mutation($id: ID!, $productIds: [ID!]!) {
  collectionAddProductsV2(id: $id, productIds: $productIds) { userErrors { message } }
}
"""

COLLECTIONS = """
query($cursor: String) {
  collections(first: 250, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes { id handle }
  }
}
"""


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def slug(s: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")


def colour_of(filename: str, colours: list[str]) -> str | None:
    """Which colour a photograph is of, by what its file is called.

    The longest match wins, so a file naming "White (Silicon Seat)" is not
    claimed by the plain "White" that also appears in it.
    """
    f = norm(filename)
    found = [c for c in colours if norm(ALIASES.get(c.lower(), c)) in f]
    return max(found, key=lambda c: len(norm(c))) if found else None


def plan_for(node: dict) -> dict | None:
    colour_opt = next(
        (o for o in node["options"] if o["name"].lower() in ("color", "colour")), None
    )
    if not colour_opt or len(colour_opt["values"]) < 2:
        return None

    media = [
        ((m.get("image") or {}).get("url", ""),
         (m.get("image") or {}).get("url", "").split("/")[-1].split("?")[0])
        for m in node["media"]["nodes"] if m.get("image")
    ]
    by_colour: dict[str, list[str]] = {}
    unclaimed = []
    for url, fn in media:
        c = colour_of(fn, colour_opt["values"])
        if c:
            by_colour.setdefault(c, []).append(url)
        else:
            unclaimed.append(url)

    missing = [c for c in colour_opt["values"] if c not in by_colour]
    if len(missing) == 1 and len(unclaimed) == 1 and LEFTOVER_OK.get(node["handle"]) == missing[0]:
        by_colour[missing[0]] = unclaimed
        missing = []
    if missing:
        return None

    other = [o["name"] for o in node["options"] if o is not colour_opt]
    pieces = []
    for colour in colour_opt["values"]:
        variants = [
            v for v in node["variants"]["nodes"]
            if any(o["name"] == colour_opt["name"] and o["value"] == colour
                   for o in v["selectedOptions"])
        ]
        if not variants:
            return None
        pieces.append({
            "colour": colour,
            "handle": node["handle"] if colour == colour_opt["values"][0]
                      else f"{node['handle']}-{slug(colour)}",
            "title": f"{node['title']} - {colour}",
            "media": by_colour[colour],
            "variants": [
                {
                    "sku": v["sku"],
                    "price": v["price"],
                    "optionValues": [
                        {"optionName": o["name"], "name": o["value"]}
                        for o in v["selectedOptions"] if o["name"] in other
                    ],
                }
                for v in variants
            ],
        })

    return {
        "id": node["id"],
        "handle": node["handle"],
        "title": node["title"],
        "vendor": node["vendor"],
        "tags": node["tags"],
        "description": node["descriptionHtml"],
        "other_options": other,
        "pieces": pieces,
        # everything needed to put the original back
        "original": {
            "options": node["options"],
            "variants": [
                {"sku": v["sku"], "price": v["price"],
                 "optionValues": [{"optionName": o["name"], "name": o["value"]}
                                  for o in v["selectedOptions"]]}
                for v in node["variants"]["nodes"]
            ],
            "media": [(m.get("image") or {}).get("url", "")
                      for m in node["media"]["nodes"] if m.get("image")],
        },
    }


def fetch_all(client) -> list[dict]:
    cursor, out = None, []
    while True:
        page = client.query(ALL_PRODUCTS, {"cursor": cursor})["data"]["products"]
        out += page["nodes"]
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--undo", action="store_true")
    args = ap.parse_args()
    client = ShopifyClient(load_env())

    if args.undo:
        if not os.path.exists(STATE):
            print("nothing to undo")
            return 0
        done = json.load(open(STATE))["split"]
        # Undoing is a write like any other, and the thing it overwrites is
        # worth keeping too.
        take(client, handles=[m["handle"] for r in done for m in r["made"]],
             label="split-colours-undo")
        for row in done:
            o = row["original"]
            res = client.query(PRODUCT_SET, {
                "identifier": {"handle": row["handle"]},
                "input": {
                    "handle": row["handle"], "title": row["title"], "status": "ACTIVE",
                    "productOptions": [{"name": o_["name"],
                                        "values": [{"name": v} for v in o_["values"]]}
                                       for o_ in o["options"]],
                    "variants": o["variants"],
                },
            })
            errs = res.get("errors") or (res.get("data") or {}).get("productSet", {}).get("userErrors")
            print(f"  {'FAILED ' + str(errs)[:90] if errs else 'restored ' + row['handle']}")
            for made in row["made"]:
                client.query(STATUS, {"input": {"id": made["id"], "status": "DRAFT"}})
        os.remove(STATE)
        print(f"\n{len(done)} products put back; the listings this made are hidden.")
        ping()
        return 0

    plans = [p for p in (plan_for(n) for n in fetch_all(client)) if p]
    pieces = sum(len(p["pieces"]) for p in plans)
    print(f"{len(plans)} products -> {pieces} listings\n")
    for p in plans:
        print(f"  {p['title'][:52]}")
        for piece in p["pieces"]:
            keep = " (keeps its URL)" if piece["handle"] == p["handle"] else ""
            print(f"      {piece['colour'][:20]:20s} {len(piece['variants'])} variants, "
                  f"{len(piece['media'])} photos{keep}")

    if not args.apply:
        print("\nDry run. Nothing written. Re-run with --apply.")
        return 0

    take(client, handles=[pc["handle"] for p in plans for pc in p["pieces"]],
         label="split-colours")

    collections = {}
    cursor = None
    while True:
        page = client.query(COLLECTIONS, {"cursor": cursor})["data"]["collections"]
        collections.update({n["handle"]: n["id"] for n in page["nodes"]})
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]
    category = lambda tags: next((t.split(":", 1)[1] for t in tags if t.startswith("category:")), None)

    done = []
    for i, p in enumerate(plans, 1):
        made = []
        failed = False
        for piece in p["pieces"]:
            inp = {
                "handle": piece["handle"],
                "title": piece["title"],
                "vendor": p["vendor"],
                "status": "ACTIVE",
                "tags": p["tags"],
                "descriptionHtml": p["description"],
                "variants": piece["variants"],
                # Shopify re-fetches its own CDN happily, so the colour's
                # existing photographs can be handed straight over.
                "files": [{"originalSource": u, "contentType": "IMAGE",
                           "alt": piece["title"]} for u in piece["media"]],
            }
            if p["other_options"]:
                inp["productOptions"] = [
                    {"name": name,
                     "values": [{"name": v} for v in dict.fromkeys(
                         o["name"] for var in piece["variants"]
                         for o in var["optionValues"] if o["optionName"] == name)]}
                    for name in p["other_options"]
                ]
            res = client.query(PRODUCT_SET, {"identifier": {"handle": piece["handle"]}, "input": inp})
            payload = (res.get("data") or {}).get("productSet") or {}
            errs = res.get("errors") or payload.get("userErrors")
            if errs:
                print(f"[{i}/{len(plans)}] FAILED {piece['handle']}: {str(errs)[:160]}")
                failed = True
                break
            gid = payload["product"]["id"]
            client.query(PUBLISH, {"id": gid,
                                   "input": [{"publicationId": client.headless_publication_id()}]})
            cat = category(p["tags"])
            if cat and cat in collections:
                client.query(ADD_TO_COLLECTION, {"id": collections[cat], "productIds": [gid]})
            made.append({"handle": piece["handle"], "id": gid, "colour": piece["colour"]})

        if failed:
            continue
        done.append({**{k: p[k] for k in ("handle", "title", "original")}, "made": made})
        print(f"[{i}/{len(plans)}] {p['handle']}: {len(made)} listings")
        with open(STATE, "w") as f:
            json.dump({"split": done}, f, indent=1)

    print(f"\n{len(done)} products split. --undo puts them back.")
    ping()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
