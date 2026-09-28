#!/usr/bin/env python3
"""Merge The Tack Shop's split listings back into single multi-variant products.

The original migration had no way to tell that "CWD Stirrup Leathers Nylon
Lined - Black/105cm" and "...- Brown/110cm" were the same product, so each
size/colour landed as its own listing. The supplier's own export
(Item_Desc_Tack-Shop.xlsx) carries a `Product Handle` column that groups them,
which is what makes this possible.

Matching is by SKU, which overlaps 100% between their file and our catalogue.

Scope, deliberately narrow:
  - only groups whose variants are uniquely identified by Size and Color, the
    two options the storefront's VariantPicker understands today. Groups
    needing a third dimension (CWD Saddle Dynamick), or using option names the
    app drops (Type, Eye, Tread Inclination), are LEFT ALONE -- merging those
    would produce a product page whose picker can't tell its variants apart.
  - prices are carried over from our catalogue untouched. Their file shows 227
    products priced above ours; that is a separate decision for the founder.
  - fragments are set to DRAFT, never deleted, so a bad run is reversible.

Usage:
    python3 scripts/merge_tack_shop_variants.py --dry-run
    python3 scripts/merge_tack_shop_variants.py --limit 3
    python3 scripts/merge_tack_shop_variants.py
    python3 scripts/merge_tack_shop_variants.py --undo   # republish the fragments
"""
from __future__ import annotations

import argparse
import collections
import json
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from migrate_to_shopify import (  # noqa: E402
    PRODUCT_SET_MUTATION,
    PUBLISH_MUTATION,
    ShopifyClient,
    load_env,
)

XLSX = Path.home() / "Downloads" / "Item_Desc_Tack-Shop.xlsx"
SUPPLIER_TAG = "supplier:the-tack-shop"
STATE = HERE / "merge_tack_shop_state.json"

# Their option names, mapped onto the two the storefront renders.
SIZE_NAMES = {"size", "seat size", "flap size", "size on box/size inside",
              "xs, s, m, l, xl", "regular, elastic"}
COLOR_NAMES = {"color", "colour", "leather color", "leather colour",
               "elastomer/ sticker color"}

PRODUCTS_QUERY = """
query($n: Int!, $a: String) {
  products(first: $n, after: $a) {
    edges { node { id handle title vendor tags status
      media(first: 1) { edges { node { ... on MediaImage { image { url } } } } }
      variants(first: 100) { edges { node { sku price inventoryItem { id } } } } } }
    pageInfo { hasNextPage endCursor }
  }
}
"""

STATUS_MUTATION = """
mutation($input: ProductInput!) {
  productUpdate(input: $input) { product { id status } userErrors { field message } }
}
"""


def clean(x) -> str:
    s = "" if x is None else str(x).strip()
    return "" if s.lower() in ("", "none", "nan") else s


def read_supplier_file() -> dict[str, list[dict]]:
    """SKU -> supplier row, grouped later by their Product Handle."""
    import openpyxl
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb["ProductGroup"]
    rows = ws.iter_rows(values_only=True)
    hdr = [clean(h) for h in next(rows)]
    idx = {h: i for i, h in enumerate(hdr)}
    out = []
    for r in rows:
        if not any(r):
            continue
        out.append({h: (r[i] if i < len(r) else None) for h, i in idx.items()})
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
            media = n["media"]["edges"]
            got.append({
                "id": n["id"], "handle": n["handle"], "title": n["title"],
                "vendor": n["vendor"], "tags": n["tags"], "status": n["status"],
                "image": (media[0]["node"].get("image") or {}).get("url") if media else None,
                "variants": [{"sku": clean(v["node"]["sku"]), "price": v["node"]["price"]}
                             for v in n["variants"]["edges"]],
            })
        if not data["pageInfo"]["hasNextPage"]:
            return got
        cursor = data["pageInfo"]["endCursor"]


def options_for(row: dict) -> tuple[str, str, str]:
    """(size, color, third) as the storefront would read them."""
    size = color = ""
    pairs = [(clean(row.get("AttributeName1")), clean(row.get("AttributeOption1"))),
             (clean(row.get("AttributeName2")), clean(row.get("AttributeOption2")))]
    for name, val in pairs:
        if not val:
            continue
        if name.lower() in SIZE_NAMES and not size:
            size = val
        elif name.lower() in COLOR_NAMES and not color:
            color = val
    return size, color, clean(row.get("AttributeOption3"))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--undo", action="store_true")
    args = ap.parse_args()

    client = ShopifyClient(load_env())

    if args.undo:
        if not STATE.exists():
            print("no state file -- nothing to undo")
            return 1
        state = json.loads(STATE.read_text())
        for gid in state["drafted"]:
            client.query(STATUS_MUTATION, {"input": {"id": gid, "status": "ACTIVE"}})
        print(f"republished {len(state['drafted'])} fragments")
        return 0

    rows = read_supplier_file()
    by_sku = {}
    for r in rows:
        s = clean(r.get("SKU")).upper()
        if s:
            by_sku.setdefault(s, r)

    ours = our_products(client)
    print(f"our Tack Shop products: {len(ours)}")

    groups = collections.defaultdict(list)
    for p in ours:
        handles = {clean(by_sku[v["sku"].upper()].get("Product Handle"))
                   for v in p["variants"] if v["sku"].upper() in by_sku}
        handles = {h for h in handles if h}
        if len(handles) == 1:
            groups[handles.pop()].append(p)

    plan = []
    skipped = collections.Counter()
    for handle, frags in groups.items():
        if len(frags) < 2:
            continue
        srows = [r for r in rows if clean(r.get("Product Handle")) == handle]
        combos, unknown, third = collections.Counter(), set(), False
        for r in srows:
            size, color, t3 = options_for(r)
            combos[(size, color)] += 1
            if t3:
                third = True
            for nm in (clean(r.get("AttributeName1")), clean(r.get("AttributeName2"))):
                if nm and nm.lower() not in SIZE_NAMES | COLOR_NAMES:
                    unknown.add(nm.lower())
        if third:
            skipped["needs a third option"] += 1; continue
        if unknown:
            skipped["option names the app drops"] += 1; continue
        if any(n > 1 for n in combos.values()):
            skipped["variants not separable by size/colour"] += 1; continue

        cat = next((t for f in frags for t in f["tags"] if t.startswith("category:")), None)
        brand = next((clean(by_sku[v["sku"].upper()].get("Brand"))
                      for f in frags for v in f["variants"]
                      if v["sku"].upper() in by_sku and clean(by_sku[v["sku"].upper()].get("Brand"))), "")
        name = next((clean(r.get("Product Name")) for r in srows if clean(r.get("Product Name"))), frags[0]["title"])
        image = next((f["image"] for f in frags if f["image"]), None)

        variants = []
        for f in frags:
            for v in f["variants"]:
                r = by_sku.get(v["sku"].upper())
                if not r:
                    continue
                size, color, _ = options_for(r)
                opts = []
                if size:
                    opts.append({"optionName": "Size", "name": size})
                if color:
                    opts.append({"optionName": "Color", "name": color})
                variants.append({"sku": v["sku"], "price": v["price"], "optionValues": opts})

        names = []
        if any(o["optionName"] == "Size" for v in variants for o in v["optionValues"]):
            names.append("Size")
        if any(o["optionName"] == "Color" for v in variants for o in v["optionValues"]):
            names.append("Color")
        if not names or not variants:
            skipped["no usable options"] += 1; continue

        plan.append({"handle": handle, "name": name, "brand": brand, "cat": cat,
                     "image": image, "variants": variants, "option_names": names,
                     "frags": frags})

    print(f"\ngroups to merge: {len(plan)}")
    print(f"fragments absorbed: {sum(len(p['frags']) for p in plan)}")
    for reason, n in skipped.most_common():
        print(f"  skipped {n:3d}: {reason}")

    todo = plan[: args.limit] if args.limit else plan
    if args.dry_run:
        for p in todo[:12]:
            print(f"\n  {p['name'][:60]}  [{p['handle']}]")
            print(f"    {len(p['frags'])} listings -> 1 product, {len(p['variants'])} variants, "
                  f"options {p['option_names']}, image={'yes' if p['image'] else 'no'}")
        if len(todo) > 12:
            print(f"\n  ... and {len(todo)-12} more")
        return 0

    by_handle = {p["handle"]: p for p in ours}
    drafted, made = [], 0
    for i, p in enumerate(todo, 1):
        inp = {
            "title": p["name"],
            "handle": p["handle"],
            "vendor": p["brand"] or "Indusequine",
            "status": "ACTIVE",
            "tags": [t for t in [p["cat"], SUPPLIER_TAG] if t],
            # values are objects, not bare strings -- Shopify rejects "20" but
            # accepts {"name": "20"}.
            "productOptions": [{"name": n, "values": [{"name": val} for val in sorted(
                {o["name"] for v in p["variants"] for o in v["optionValues"] if o["optionName"] == n},
                key=str)]} for n in p["option_names"]],
            "variants": [{"sku": v["sku"], "price": v["price"],
                          "optionValues": v["optionValues"]} for v in p["variants"]],
        }
        if p["image"]:
            inp["files"] = [{"originalSource": p["image"], "contentType": "IMAGE"}]

        # productSet upserts BY HANDLE, and it replaces the target's variant
        # list wholesale. If the supplier's handle is already held by one of our
        # products that is NOT in this group, merging would silently destroy
        # that product's variants -- which is exactly how LDR-WH and LR-BR were
        # lost on the first run. Refuse rather than clobber.
        occupant = by_handle.get(p["handle"])
        if occupant and occupant["id"] not in {f["id"] for f in p["frags"]}:
            print(f"[{i}/{len(todo)}] SKIPPED {p['handle']}: handle already held by "
                  f"'{occupant['title'][:40]}', which is not part of this group")
            continue

        res = client.query(PRODUCT_SET_MUTATION,
                           {"input": inp, "synchronous": True, "identifier": {"handle": p["handle"]}})
        payload = (res.get("data") or {}).get("productSet") or {}
        errs = res.get("errors") or payload.get("userErrors")
        if errs:
            print(f"[{i}/{len(todo)}] FAILED {p['handle']}: {str(errs)[:160]}")
            continue
        gid = payload["product"]["id"]
        # Shopify normalises handles (it collapses "a---b" to "a-b"), so the
        # handle it actually used can differ from the one we asked for. Match
        # the survivor on the id it returns, never on our requested handle --
        # getting this wrong drafts the merged product itself.
        survivor_handle = payload["product"].get("handle")
        client.query(PUBLISH_MUTATION, {"id": gid, "input": [{"publicationId": client.headless_publication_id()}]})
        made += 1

        for f in p["frags"]:
            if f["id"] == gid or f["handle"] == survivor_handle:
                continue  # this one became the merged product
            r = client.query(STATUS_MUTATION, {"input": {"id": f["id"], "status": "DRAFT"}})
            e = (r.get("errors") or ((r.get("data") or {}).get("productUpdate") or {}).get("userErrors"))
            if e:
                print(f"    WARNING: could not draft {f['handle']}: {str(e)[:120]}")
            else:
                drafted.append(f["id"])
        if i % 10 == 0 or i == len(todo):
            print(f"[{i}/{len(todo)}] merged, {len(drafted)} fragments drafted")

    STATE.write_text(json.dumps({"drafted": drafted}, indent=1))
    print(f"\ndone: {made} products merged, {len(drafted)} fragments drafted")
    print(f"state written to {STATE.name} -- re-run with --undo to republish them")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
