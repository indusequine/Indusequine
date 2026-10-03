#!/usr/bin/env python3
"""Fold products that were listed once per variant back into single products.

The importers that built this catalogue sometimes made a separate product for
each colour, size or length instead of one product with options. A rider
looking for a whip found eight listings of the same whip, and picking a colour
meant going back to the category and choosing a different product.

Groups are written out by hand below rather than guessed. An earlier pass at
this used a SKU heuristic and got it wrong: the "-80" and "-90" it read as
duplicate markers are the whip's length in centimetres, and the CWD bridles it
flagged have mangled SKUs and are three real products, not one.

Nothing is deleted. The absorbed listings are set to DRAFT, which is how this
codebase hides a product, and --undo brings them back.

    python3 scripts/merge_split_listings.py            # dry run, prints the plan
    python3 scripts/merge_split_listings.py --apply
    python3 scripts/merge_split_listings.py --undo
"""
from __future__ import annotations

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402
from snapshot import take  # noqa: E402
from revalidate import ping  # noqa: E402

STATE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "merge_split_state.json")

# Each group becomes one product.
#   survivor: the handle that stays, and keeps its URL
#   title:    what it is called afterwards, with the variant stripped out
#   options:  the option names, in the order a rider should meet them
#   members:  handle -> option values to give that listing's variants. An empty
#             dict means the listing already carries the right options itself.
GROUPS = [
    # -- Freejump Spur'One: black sold alone, blue and red under a listing
    #    named "/Black/Pearl" that contains no black.
    *[
        {
            "survivor": f"freejump-spur-one-{slug}",
            "title": f"Freejump Spur'One - {name}",
            "options": ["Color"],
            "members": {f"freejump-spur-one-{slug}": {}, f"freejump-spur-one-{slug}-black-pearl": {}},
        }
        for slug, name in [
            ("disc", "Disc"),
            ("extra-long", "Extra Long"),
            ("hammer", "Hammer"),
            ("prince-of-wales", "Prince Of Wales"),
            ("round-end", "Round End"),
        ]
    ],
    # -- Equitheme kids' jacket: two colours x four sizes, as eight products.
    {
        "survivor": "equitheme-soft-classic-competition-jacket-black-8-kids",
        "title": "Equitheme Soft Classic Competition Jacket - Kids",
        "options": ["Color", "Size"],
        "members": {
            f"equitheme-soft-classic-competition-jacket-{c.lower()}-{s}-kids":
                {"Color": c, "Size": s}
            for c in ("Black", "Navy") for s in ("8", "10", "12", "14")
        },
    },
    {
        "survivor": "equitheme-bale-show-jacket-black-38-ladies",
        "title": "Equitheme Bale Show Jacket - Ladies",
        "options": ["Color", "Size"],
        "members": {
            f"equitheme-bale-show-jacket-black-{s}-ladies": {"Color": "Black", "Size": s}
            for s in ("38", "40")
        },
    },
    # -- Fleck whips: colour and length were both in the title.
    {
        "survivor": "fleck-riding-whips-woven-nylon-cover-wrapped-grip-black-80cm",
        "title": "Fleck Riding Whips - Woven Nylon Cover, Wrapped Grip",
        "options": ["Color", "Size"],
        "members": {
            f"fleck-riding-whips-woven-nylon-cover-wrapped-grip-{c}-{l}cm":
                {"Color": c.capitalize(), "Size": f"{l}cm"}
            for c in ("black", "blue", "brown", "burgundy") for l in ("80", "90")
        },
    },
    {
        "survivor": "fleck-riding-whips-woven-nylon-cover-rubber-handle-assorted-80cm",
        "title": "Fleck Riding Whips - Woven Nylon Cover, Rubber Handle",
        "options": ["Size"],
        "members": {
            f"fleck-riding-whips-woven-nylon-cover-rubber-handle-assorted-{l}cm": {"Size": f"{l}cm"}
            for l in ("80", "90")
        },
    },
    # -- Spurs whose size lived in the name.
    {
        "survivor": "waldhausen-spur-10mm-grand-prix-roller-spurs",
        "title": "Waldhausen Grand Prix Roller Spurs",
        "options": ["Size"],
        "members": {
            f"waldhausen-spur-{mm}mm-grand-prix-roller-spurs": {"Size": f"{mm}mm"}
            for mm in ("10", "20", "30")
        },
    },
    {
        "survivor": "eco-spurs-5mm-468609",
        "title": "Eco Spurs",
        "options": ["Size"],
        "members": {"eco-spurs-5mm-468609": {}, "eco-spurs-10mm-401275": {}},
    },
    # -- CWD French Nose Band: three models, each 2 colours x 4 sizes, cut into
    #    ten listings. The SKU reads CWD-FNB-<model>-<colour>-<size>, and the
    #    price confirms the model: Regular 54999, Fancy 52566, Anatomic 49999.
    #    The "Extra" listings carry no colour of their own and say Size=Full
    #    where their SKU says EXT, so both are supplied here.
    {
        "survivor": "cwd-french-nose-band-bridle-regular",
        "title": "CWD French Nose Band Bridle - Regular",
        "options": ["Color", "Size"],
        "members": {
            "cwd-french-nose-band-bridle-regular": {},
            # REG-BR-PON, the Brown/Pony this listing was missing
            "cwd-french-nose-band-bridle": {},
            "cwd-french-nose-band-bridle-regular-black-extra": {"Color": "Black", "Size": "Extra Full"},
            "cwd-french-nose-band-bridle-regular-brown-extra": {"Color": "Brown", "Size": "Extra Full"},
        },
    },
    {
        "survivor": "cwd-french-nose-band-bridle-anatomic",
        "title": "CWD French Nose Band Bridle - Anatomic",
        "options": ["Color", "Size"],
        "members": {
            "cwd-french-nose-band-bridle-anatomic": {},
            "cwd-french-nose-band-bridle-anatomic-black-extra": {"Color": "Black", "Size": "Extra Full"},
            "cwd-french-nose-band-bridle-anatomic-brown-extra": {"Color": "Brown", "Size": "Extra Full"},
        },
    },
    {
        "survivor": "cwd-french-nose-band-bridle-anatomic-fancy-stitching",
        "title": "CWD French Nose Band Bridle - Anatomic Fancy Stitching",
        "options": ["Color", "Size"],
        # Five of its six SKUs say ANA where the price says FAN, and carry a
        # "-1" the importer added to keep them unique against the Anatomic
        # listing they were copied from. CWD-FNB-FAN-BL-COB is the one that
        # came through right, and sets the shape for the rest.
        "sku_rewrite": (r"^CWD-FNB-ANA-(BL|BR)-(COB|FUL|PON|EXT)-1$", r"CWD-FNB-FAN-\1-\2"),
        "members": {
            "cwd-french-nose-band-bridle-anatomic-fancy-stitching": {},
            "cwd-french-nose-band-bridle-anatomic-fancy-stitching-black-extra": {"Color": "Black", "Size": "Extra Full"},
            "cwd-french-nose-band-bridle-anatomic-fancy-stitching-brown-extra": {"Color": "Brown", "Size": "Extra Full"},
        },
    },
]

PRODUCT_QUERY = """
query($q: String!) {
  products(first: 20, query: $q) {
    nodes {
      id handle title status tags
      featuredImage { url }
      variants(first: 100) {
        nodes { sku price selectedOptions { name value } }
      }
    }
  }
}
"""

PRODUCT_SET = """
mutation($input: ProductSetInput!, $identifier: ProductSetIdentifiers!) {
  productSet(input: $input, synchronous: true, identifier: $identifier) {
    product {
      id handle
      media(first: 40) { nodes { id alt } }
      variants(first: 250) { nodes { id selectedOptions { name value } } }
    }
    userErrors { field message }
  }
}
"""

STATUS = """
mutation($input: ProductInput!) {
  productUpdate(input: $input) { product { handle status } userErrors { field message } }
}
"""

VARIANTS_UPDATE = """
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    userErrors { field message }
  }
}
"""

PUBLISH = """
mutation($id: ID!, $input: [PublicationInput!]!) {
  publishablePublish(id: $id, input: $input) { userErrors { message } }
}
"""


def photo_id(url: str) -> str:
    """What the photograph actually is, ignoring how many times it was uploaded.

    Every listing in a group carries the same picture, re-uploaded per listing,
    so Shopify hands each copy its own UUID and the URLs all differ. Comparing
    URLs would put eight identical whips in one gallery.
    """
    name = re.sub(r"\?.*$", "", url).split("/")[-1]
    return re.sub(r"_[0-9a-f]{8}-[0-9a-f-]+(?=\.)", "", name)


def fetch(client, handle):
    nodes = client.query(PRODUCT_QUERY, {"q": f"handle:{handle}"})["data"]["products"]["nodes"]
    return next((n for n in nodes if n["handle"] == handle), None)


def build(client, group):
    """Read every member and work out the merged product, or say why not."""
    survivor = group["survivor"]
    if survivor not in group["members"]:
        return None, f"survivor {survivor} is not one of its own members"

    found, variants, images, by_colour = {}, [], [], {}
    for handle, forced in group["members"].items():
        node = fetch(client, handle)
        if not node:
            return None, f"missing listing {handle}"
        found[handle] = node
        image = (node["featuredImage"] or {}).get("url")
        if image and photo_id(image) not in {photo_id(u) for u in images}:
            images.append(image)

        for v in node["variants"]["nodes"]:
            own = {o["name"]: o["value"] for o in v["selectedOptions"]
                   if o["value"] != "Default Title"}
            values = {**own, **forced}
            missing = [o for o in group["options"] if o not in values]
            if missing:
                return None, f"{handle}: no value for {missing}"
            sku = v["sku"]
            fix = group.get("sku_rewrite")
            if fix and sku:
                sku = re.sub(fix[0], fix[1], sku)
            variants.append({
                "sku": sku,
                "price": v["price"],
                "optionValues": [{"optionName": o, "name": values[o]} for o in group["options"]],
            })
            if "Color" in values and image:
                by_colour.setdefault(values["Color"], image)

    # Pinning a colour to a photograph only helps when the colours actually
    # have different photographs. These groups share one picture between them,
    # so pinning would promise a red whip and show the blue one.
    if len({photo_id(u) for u in by_colour.values()}) < 2:
        by_colour = {}

    seen = set()
    for v in variants:
        key = tuple(o["name"] for o in v["optionValues"])
        if key in seen:
            return None, f"two variants would share options {key}"
        seen.add(key)

    base = found[survivor]
    return {
        "survivor": survivor,
        "survivor_id": base["id"],
        "title": group["title"],
        "tags": base["tags"],
        "options": [
            {"name": o, "values": [{"name": n} for n in
                                   dict.fromkeys(x["name"] for v in variants
                                                 for x in v["optionValues"] if x["optionName"] == o)]}
            for o in group["options"]
        ],
        "variants": variants,
        "images": images,
        "by_colour": by_colour,
        "absorb": [h for h in group["members"] if h != survivor],
        "absorb_ids": {h: found[h]["id"] for h in group["members"] if h != survivor},
    }, None


def main():
    apply = "--apply" in sys.argv
    client = ShopifyClient(load_env())

    if "--undo" in sys.argv:
        if not os.path.exists(STATE):
            print("nothing to undo")
            return 0
        done = json.load(open(STATE))["merged"]
        # Undoing is a write like any other, and what it overwrites is worth
        # keeping too.
        take(client, handles=[r["survivor"] for r in done]
             + [h for r in done for h in r["absorb_ids"]], label="merge-undo")
        for row in done:
            for handle, pid in row["absorb_ids"].items():
                client.query(STATUS, {"input": {"id": pid, "status": "ACTIVE"}})
                print(f"restored {handle}")
        print("\nThe survivors keep their merged variants; restoring those by hand "
              "is not automated, so check them in Shopify.")
        os.remove(STATE)
        return 0

    only = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--only=")), None)
    groups = [g for g in GROUPS if not only or only in g["survivor"]]
    if only and not groups:
        print(f"no group matches --only={only}")
        return 1

    plans, problems = [], []
    for group in groups:
        plan, why = build(client, group)
        (problems if why else plans).append(why or plan)

    listings = sum(len(p["absorb"]) + 1 for p in plans)
    print(f"{len(plans)} groups: {listings} listings -> {len(plans)} products\n")
    for p in plans:
        opts = ", ".join(f"{o['name']} ({len(o['values'])})" for o in p["options"])
        print(f"  {p['title']}")
        print(f"    {p['survivor']}")
        print(f"    {len(p['absorb']) + 1} listings -> {len(p['variants'])} variants  [{opts}]")
        print(f"    {len(p['images'])} images, {len(p['by_colour'])} pinned to a colour")
    for why in problems:
        print(f"  REFUSED: {why}")

    if not apply:
        print("\nDry run. Nothing written. Re-run with --apply.")
        return 0
    if problems:
        print("\nRefusing to run while any group is unresolved.")
        return 1

    take(client, handles=[h for p in plans for h in [p["survivor"], *p["absorb"]]],
         label="merge-split-listings")

    done = []
    for i, p in enumerate(plans, 1):
        res = client.query(PRODUCT_SET, {
            "identifier": {"handle": p["survivor"]},
            "input": {
                "handle": p["survivor"],
                "title": p["title"],
                "status": "ACTIVE",
                "tags": p["tags"],
                "productOptions": p["options"],
                "variants": p["variants"],
                "files": [{"originalSource": u, "contentType": "IMAGE", "alt": p["title"]}
                          for u in p["images"]],
            },
        })
        payload = (res.get("data") or {}).get("productSet") or {}
        errs = res.get("errors") or payload.get("userErrors")
        if errs:
            print(f"[{i}/{len(plans)}] FAILED {p['survivor']}: {str(errs)[:200]}")
            continue
        product = payload["product"]
        client.query(PUBLISH, {"id": product["id"],
                               "input": [{"publicationId": client.headless_publication_id()}]})

        for handle, pid in p["absorb_ids"].items():
            client.query(STATUS, {"input": {"id": pid, "status": "DRAFT"}})

        done.append({"survivor": p["survivor"], "absorb_ids": p["absorb_ids"]})
        print(f"[{i}/{len(plans)}] {p['survivor']}: {len(p['variants'])} variants, "
              f"{len(p['absorb'])} listings drafted")

    # Keep what earlier runs recorded: a --only run would otherwise drop the
    # rollback for every group it did not touch.
    kept = []
    if os.path.exists(STATE):
        touched = {r["survivor"] for r in done}
        kept = [r for r in json.load(open(STATE))["merged"] if r["survivor"] not in touched]
    with open(STATE, "w") as f:
        json.dump({"merged": done + kept}, f, indent=1)
    print(f"\n{len(done)} merged. --undo restores the drafted listings.")
    ping()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
