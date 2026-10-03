#!/usr/bin/env python3
"""Import Piquant Equestrians' catalogue into Shopify.

Reads catalogue.json, which was built by hand off their brand catalogue PDF,
and creates the nine products it describes: four show shirts with colour and
size variants, and five shampoos in two bottle sizes each.

Piquant is the first supplier to arrive with their own photography, so the
images live here in the repo rather than on a supplier's site. They go up
through Shopify's staged uploads, and each colour's shot is then pinned to
that colour's variants, so picking Red shows the red shirt.

Nothing here updates an existing product. Every handle must be free, and the
run refuses outright if one is taken -- these are new listings, and a silent
overwrite of someone else's product is the one mistake worth designing out.

Usage:
    python3 scripts/piquant/import_to_shopify.py              # print the plan
    python3 scripts/piquant/import_to_shopify.py --apply
    python3 scripts/piquant/import_to_shopify.py --apply --only LACE,SH-ALOE

Credentials come from .env, or the environment in CI.
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import sys
import urllib.request
import uuid
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402
from revalidate import ping  # noqa: E402
from snapshot import take  # noqa: E402

CATALOGUE = HERE / "catalogue.json"
IMAGES = HERE / "images"
STATE = HERE / "import_state.json"

PRODUCT_SET = """
mutation($input: ProductSetInput!, $synchronous: Boolean!) {
  productSet(input: $input, synchronous: $synchronous) {
    product {
      id handle
      media(first: 50) { nodes { id alt } }
      variants(first: 250) { nodes { id selectedOptions { name value } } }
    }
    userErrors { field message }
  }
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

VARIANTS_UPDATE = """
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    userErrors { field message }
  }
}
"""

STAGED_UPLOADS = """
mutation($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets { url resourceUrl parameters { name value } }
    userErrors { field message }
  }
}
"""

COLLECTIONS_QUERY = """
query($cursor: String) {
  collections(first: 250, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes { id handle }
  }
}
"""

OPTION_ADD_VALUES = """
mutation($productId: ID!, $option: OptionUpdateInput!, $add: [OptionValueCreateInput!]) {
  productOptionUpdate(productId: $productId, option: $option, optionValuesToAdd: $add) {
    product { id options { name optionValues { name } } }
    userErrors { field message }
  }
}
"""

VARIANTS_CREATE = """
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkCreate(productId: $productId, variants: $variants) {
    productVariants { sku }
    userErrors { field message }
  }
}
"""

DELETE_MEDIA = """
mutation($productId: ID!, $mediaIds: [ID!]!) {
  productDeleteMedia(productId: $productId, mediaIds: $mediaIds) {
    deletedMediaIds
    mediaUserErrors { field message }
  }
}
"""

CREATE_MEDIA = """
mutation($productId: ID!, $media: [CreateMediaInput!]!) {
  productCreateMedia(productId: $productId, media: $media) {
    media { ... on MediaImage { id alt } }
    mediaUserErrors { field message }
  }
}
"""

PRODUCT_MEDIA_QUERY = """
query($q: String!) {
  products(first: 1, query: $q) {
    nodes {
      id handle
      media(first: 60) { nodes { id ... on MediaImage { alt } } }
      variants(first: 250) {
        nodes { id selectedOptions { name value } media(first: 1) { nodes { id } } }
      }
    }
  }
}
"""

PRODUCT_UPDATE = """
mutation($product: ProductUpdateInput!) {
  productUpdate(product: $product) { product { handle } userErrors { field message } }
}
"""

HANDLES_QUERY = """
query($q: String!) {
  products(first: 250, query: $q) { nodes { id handle title } }
}
"""


# --------------------------------------------------------------------------
# building the plan


def shirt_description(p: dict, chart: dict) -> str:
    """Prose, and nothing else.

    The product page renders Shopify's plain-text `description`, which Shopify
    derives by stripping every tag, so anything structured arrives as a run-on
    paragraph. The measurements used to be pasted in here for that reason and
    read as a wall of numbers. They belong in a size chart, not in the copy a
    rider reads first.
    """
    return f"<p>{p['blurb']}</p>\n<p>{'. '.join(p['features'])}.</p>"


def key(p: dict, size: str) -> str:
    """Teens S and M differ between the girls' and boys' cuts, so the chart
    holds both and the product's own fit picks one."""
    if size in ("Teens S", "Teens M"):
        return f"{size} ({p['fit']})"
    return size


def shampoo_description(p: dict) -> str:
    items = ", ".join(i.lower() for i in p["ingredients"])
    return (
        f"<p>{p['strapline']}. {p['blurb']}</p>\n"
        f"<p>Made with {items}.</p>\n"
        "<p>Available in 250 ml and 500 ml.</p>"
    )


def plan_for(p: dict, cat: dict) -> dict:
    """One product's full Shopify shape, images named but not yet uploaded."""
    vendor, supplier_tag = cat["vendor"], cat["supplier_tag"]
    tags = [f"category:{p['category']}", supplier_tag, f"supplier-code:{p['code']}"]

    if "colours" in p:
        options = [
            # "Color", not "Colour": products.ts reads this option by name, and
            # the rest of the catalogue came in from the original migration
            # spelled the American way. A British spelling here parses as no
            # colour at all, and the picker silently drops to sizes only.
            {"name": "Color", "values": [{"name": c} for c in p["colours"]]},
            {"name": "Size", "values": [{"name": s} for s in p["sizes"]]},
        ]
        variants = [
            {
                "sku": f"PQ-{p['code']}-{slug(c)}-{slug(s)}",
                "price": p["price"],
                "optionValues": [
                    {"optionName": "Color", "name": c},
                    {"optionName": "Size", "name": s},
                ],
            }
            for c in p["colours"]
            for s in p["sizes"]
        ]
        description = shirt_description(p, cat["size_chart"])
        # by_colour points at shots already in main/extra, so listing it again
        # put every colourway in the gallery twice. dict.fromkeys keeps the
        # first occurrence and the order.
        images = list(dict.fromkeys(
            [p["images"]["main"], *p["images"]["extra"], *p["images"]["by_colour"].values()]
        ))
    else:
        options = [{"name": "Size", "values": [{"name": f"{ml} ml"} for ml in p["sizes_ml"]]}]
        variants = [
            {
                "sku": f"PQ-{p['code']}-{ml}",
                "price": "450.00" if ml == 250 else "799.00",
                "optionValues": [{"optionName": "Size", "name": f"{ml} ml"}],
            }
            for ml in p["sizes_ml"]
        ]
        description = shampoo_description(p)
        images = [p["images"]["main"]]

    return {
        "code": p["code"],
        "handle": p["handle"],
        "title": p["title"],
        "category": p["category"],
        "vendor": vendor,
        "tags": tags,
        "options": options,
        "variants": variants,
        "description": description,
        "images": images,
        "by_colour": p["images"].get("by_colour", {}),
    }


def slug(s: str) -> str:
    return s.lower().replace(" ", "-")


# --------------------------------------------------------------------------
# images


def upload(client: ShopifyClient, names: list[str]) -> dict[str, str]:
    """Push each local image to Shopify's staging bucket, return name -> url."""
    files = {n: IMAGES / f"{n}.jpg" for n in names}
    missing = [n for n, f in files.items() if not f.exists()]
    if missing:
        raise SystemExit(f"error: missing image files: {missing}")

    res = client.query(STAGED_UPLOADS, {
        "input": [
            {
                "filename": f"{n}.jpg",
                "mimeType": mimetypes.guess_type(f.name)[0] or "image/jpeg",
                "httpMethod": "POST",
                "resource": "IMAGE",
            }
            for n, f in files.items()
        ]
    })
    payload = (res.get("data") or {}).get("stagedUploadsCreate") or {}
    if res.get("errors") or payload.get("userErrors"):
        raise SystemExit(f"staged upload failed: {res.get('errors') or payload['userErrors']}")

    urls = {}
    for (name, path), target in zip(files.items(), payload["stagedTargets"]):
        body, content_type = multipart(
            [(p["name"], p["value"]) for p in target["parameters"]],
            path.read_bytes(),
            path.name,
        )
        req = urllib.request.Request(
            target["url"], data=body, headers={"Content-Type": content_type}, method="POST"
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            if resp.status not in (200, 201, 204):
                raise SystemExit(f"upload of {path.name} failed: HTTP {resp.status}")
        urls[name] = target["resourceUrl"]
    return urls


def multipart(fields: list[tuple[str, str]], content: bytes, filename: str) -> tuple[bytes, str]:
    """The storage bucket wants the file last, after every signed field."""
    boundary = uuid.uuid4().hex
    sep = f"--{boundary}".encode()
    parts = []
    for name, value in fields:
        parts += [sep, f'Content-Disposition: form-data; name="{name}"'.encode(), b"", value.encode()]
    parts += [
        sep,
        f'Content-Disposition: form-data; name="file"; filename="{filename}"'.encode(),
        b"Content-Type: image/jpeg",
        b"",
        content,
        f"--{boundary}--".encode(),
        b"",
    ]
    return b"\r\n".join(parts), f"multipart/form-data; boundary={boundary}"


# --------------------------------------------------------------------------


def pin_colours(client: ShopifyClient, node: dict, plan: dict) -> None:
    """Give every colour variant the shot of that colour.

    Run after variants are added as well as at import, since a variant created
    later starts with no image and would otherwise fall back to the product's
    first photo, showing navy to someone who picked red.
    """
    if not plan["by_colour"]:
        return
    media = {m.get("alt"): m["id"] for m in node["media"]["nodes"]}
    updates = []
    for v in node["variants"]["nodes"]:
        if v["media"]["nodes"]:
            continue
        colour = next((o["value"] for o in v["selectedOptions"] if o["name"] == "Color"), None)
        mid = media.get(plan["by_colour"].get(colour, ""))
        if mid:
            updates.append({"id": v["id"], "mediaId": mid})
    if not updates:
        return
    r = client.query(VARIANTS_UPDATE, {"productId": node["id"], "variants": updates})
    e = (r.get("errors")
         or ((r.get("data") or {}).get("productVariantsBulkUpdate") or {}).get("userErrors"))
    print(f"    {'FAILED pinning: ' + str(e)[:120] if e else f'pinned {len(updates)} variant images'}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write to Shopify")
    ap.add_argument("--only", help="comma-separated product codes")
    ap.add_argument("--descriptions", action="store_true",
                    help="rewrite descriptions on products already created")
    ap.add_argument("--images", action="store_true",
                    help="replace the photography on products already created")
    ap.add_argument("--variants", action="store_true",
                    help="add variants the catalogue gained, on products already created")
    args = ap.parse_args()

    cat = json.loads(CATALOGUE.read_text())
    plans = [plan_for(p, cat) for p in cat["products"]]
    if args.only:
        wanted = {c.strip() for c in args.only.split(",")}
        plans = [p for p in plans if p["code"] in wanted]

    total = sum(len(p["variants"]) for p in plans)
    print(f"Piquant: {len(plans)} products, {total} variants\n")
    for p in plans:
        opts = " x ".join(f"{o['name']} ({len(o['values'])})" for o in p["options"])
        price = {v["price"] for v in p["variants"]}
        print(f"  {p['title']}")
        print(f"    {p['handle']}")
        print(f"    {opts} = {len(p['variants'])} variants at "
              f"{'/'.join(sorted(price, key=float))} INR")
        print(f"    category:{p['category']}, {len(p['images'])} images")

    if not args.apply:
        print("\nDry run. Nothing written. Re-run with --apply.")
        return 0

    client = ShopifyClient(load_env())
    take(client, handles=[p["handle"] for p in plans], label="piquant")

    if args.variants:
        # Only ever adds. A variant that exists in Shopify but not in the
        # catalogue is left alone: removing one would take its orders and its
        # history with it, and that is never what a size being added means.
        for i, p in enumerate(plans, 1):
            res = client.query(PRODUCT_MEDIA_QUERY, {"q": f"handle:{p['handle']}"})
            node = next(iter(res["data"]["products"]["nodes"]), None)
            if not node:
                print(f"[{i}/{len(plans)}] not found: {p['handle']}")
                continue

            have = {
                tuple(sorted((o["name"], o["value"]) for o in v["selectedOptions"]))
                for v in node["variants"]["nodes"]
            }
            missing = [
                v for v in p["variants"]
                if tuple(sorted((o["optionName"], o["name"]) for o in v["optionValues"])) not in have
            ]
            if not missing:
                print(f"[{i}/{len(plans)}] {p['handle']}: nothing to add")
                pin_colours(client, node, p)
                continue

            # A new value has to exist on the option before a variant can use it.
            live = client.query(
                "query($q: String!) { products(first: 1, query: $q) "
                "{ nodes { options { id name optionValues { name } } } } }",
                {"q": f"handle:{p['handle']}"},
            )["data"]["products"]["nodes"][0]["options"]
            for opt in p["options"]:
                on_product = next((o for o in live if o["name"] == opt["name"]), None)
                if not on_product:
                    continue
                known = {v["name"] for v in on_product["optionValues"]}
                new = [v for v in opt["values"] if v["name"] not in known]
                if new:
                    r = client.query(OPTION_ADD_VALUES, {
                        "productId": node["id"],
                        "option": {"id": on_product["id"]},
                        "add": [{"name": v["name"]} for v in new],
                    })
                    e = r.get("errors") or ((r.get("data") or {}).get("productOptionUpdate") or {}).get("userErrors")
                    if e:
                        print(f"[{i}/{len(plans)}] FAILED adding {[v['name'] for v in new]}: {str(e)[:140]}")
                        continue
                    print(f"    option {opt['name']}: added {[v['name'] for v in new]}")

            # productVariantsBulkCreate carries the SKU on the inventory item,
            # unlike productSet, which takes it on the variant.
            payload_variants = [
                {
                    "price": v["price"],
                    "optionValues": v["optionValues"],
                    "inventoryItem": {"sku": v["sku"]},
                }
                for v in missing
            ]
            r = client.query(VARIANTS_CREATE, {"productId": node["id"], "variants": payload_variants})
            payload = (r.get("data") or {}).get("productVariantsBulkCreate") or {}
            e = r.get("errors") or payload.get("userErrors")
            if e:
                print(f"[{i}/{len(plans)}] FAILED {p['handle']}: {str(e)[:180]}")
                continue
            print(f"[{i}/{len(plans)}] {p['handle']}: added {len(payload['productVariants'])} variants")
            # A variant created after the import has no image of its own, so
            # pin the colours again with the product re-read.
            fresh = client.query(PRODUCT_MEDIA_QUERY, {"q": f"handle:{p['handle']}"})
            pin_colours(client, fresh["data"]["products"]["nodes"][0], p)
        return 0

    if args.images:
        urls = upload(client, sorted({n for p in plans for n in p["images"]}))
        for i, p in enumerate(plans, 1):
            res = client.query(PRODUCT_MEDIA_QUERY, {"q": f"handle:{p['handle']}"})
            node = next(iter(res["data"]["products"]["nodes"]), None)
            if not node:
                print(f"[{i}/{len(plans)}] not found: {p['handle']}")
                continue
            gid = node["id"]

            old = [m["id"] for m in node["media"]["nodes"]]
            if old:
                client.query(DELETE_MEDIA, {"productId": gid, "mediaIds": old})

            r = client.query(CREATE_MEDIA, {
                "productId": gid,
                "media": [
                    {"originalSource": urls[n], "mediaContentType": "IMAGE", "alt": n}
                    for n in p["images"]
                ],
            })
            payload = (r.get("data") or {}).get("productCreateMedia") or {}
            errs = r.get("errors") or payload.get("mediaUserErrors")
            if errs:
                print(f"[{i}/{len(plans)}] FAILED {p['handle']}: {str(errs)[:160]}")
                continue

            if p["by_colour"]:
                media = {m["alt"]: m["id"] for m in payload["media"]}
                updates = []
                for v in node["variants"]["nodes"]:
                    colour = next(
                        (o["value"] for o in v["selectedOptions"] if o["name"] == "Color"), None
                    )
                    mid = media.get(p["by_colour"].get(colour, ""))
                    if mid:
                        updates.append({"id": v["id"], "mediaId": mid})
                if updates:
                    u = client.query(VARIANTS_UPDATE, {"productId": gid, "variants": updates})
                    e = (u.get("errors")
                         or ((u.get("data") or {}).get("productVariantsBulkUpdate") or {}).get("userErrors"))
                    if e:
                        print(f"    warning: variant images not set: {str(e)[:140]}")
            print(f"[{i}/{len(plans)}] refreshed {p['handle']} ({len(p['images'])} images)")
        return 0

    if args.descriptions:
        # productUpdate, never productSet: productSet replaces the variant list
        # wholesale and would take all 145 of them with it.
        for i, p in enumerate(plans, 1):
            found = client.query(HANDLES_QUERY, {"q": f"handle:{p['handle']}"})
            node = next(iter(found["data"]["products"]["nodes"]), None)
            if not node:
                print(f"[{i}/{len(plans)}] not found: {p['handle']}")
                continue
            r = client.query(PRODUCT_UPDATE, {
                "product": {"id": node["id"], "descriptionHtml": p["description"]},
            })
            errs = r.get("errors") or ((r.get("data") or {}).get("productUpdate") or {}).get("userErrors")
            print(f"[{i}/{len(plans)}] {'FAILED ' + str(errs)[:120] if errs else 'updated ' + p['handle']}")
        return 0

    taken = client.query(HANDLES_QUERY, {
        "q": " OR ".join(f"handle:{p['handle']}" for p in plans)
    })
    existing = {n["handle"]: n["title"] for n in (taken["data"]["products"]["nodes"])}
    clash = [p["handle"] for p in plans if p["handle"] in existing]
    if clash:
        print("\nerror: these handles already exist, refusing to overwrite:", file=sys.stderr)
        for h in clash:
            print(f"  {h}  (currently '{existing[h]}')", file=sys.stderr)
        return 1

    collections = {}
    cursor = None
    while True:
        res = client.query(COLLECTIONS_QUERY, {"cursor": cursor})
        page = res["data"]["collections"]
        collections.update({n["handle"]: n["id"] for n in page["nodes"]})
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]

    for p in plans:
        if p["category"] not in collections:
            print(f"error: no collection for category {p['category']!r}", file=sys.stderr)
            return 1

    print(f"\nuploading {len({n for p in plans for n in p['images']})} images...")
    urls = upload(client, sorted({n for p in plans for n in p["images"]}))

    created = []
    for i, p in enumerate(plans, 1):
        inp = {
            "handle": p["handle"],
            "title": p["title"],
            "vendor": p["vendor"],
            "status": "ACTIVE",
            "tags": p["tags"],
            "descriptionHtml": p["description"],
            "productOptions": p["options"],
            "variants": p["variants"],
            "files": [
                {"originalSource": urls[n], "contentType": "IMAGE", "alt": n}
                for n in p["images"]
            ],
        }
        res = client.query(PRODUCT_SET, {"input": inp, "synchronous": True})
        payload = (res.get("data") or {}).get("productSet") or {}
        errs = res.get("errors") or payload.get("userErrors")
        if errs:
            print(f"[{i}/{len(plans)}] FAILED {p['handle']}: {str(errs)[:200]}")
            continue

        product = payload["product"]
        gid = product["id"]
        created.append({"code": p["code"], "id": gid, "handle": product["handle"]})

        client.query(PUBLISH, {
            "id": gid,
            "input": [{"publicationId": client.headless_publication_id()}],
        })
        client.query(ADD_TO_COLLECTION, {
            "id": collections[p["category"]], "productIds": [gid],
        })

        if p["by_colour"]:
            media = {m["alt"]: m["id"] for m in product["media"]["nodes"]}
            updates = []
            for v in product["variants"]["nodes"]:
                colour = next(
                    (o["value"] for o in v["selectedOptions"] if o["name"] == "Color"), None
                )
                media_id = media.get(p["by_colour"].get(colour, ""))
                if media_id:
                    updates.append({"id": v["id"], "mediaId": media_id})
            if updates:
                r = client.query(VARIANTS_UPDATE, {"productId": gid, "variants": updates})
                e = (r.get("errors")
                     or ((r.get("data") or {}).get("productVariantsBulkUpdate") or {}).get("userErrors"))
                if e:
                    print(f"    warning: variant images not set: {str(e)[:140]}")

        print(f"[{i}/{len(plans)}] created {product['handle']} "
              f"({len(p['variants'])} variants)")

    STATE.write_text(json.dumps({"created": created}, indent=1))
    print(f"\n{len(created)} products created. Ids in {STATE.name} for rollback.")
    ping()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
