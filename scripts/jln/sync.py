#!/usr/bin/env python3
"""Sync JLN Equestrian (jlnequestrian.com) into Shopify.

They run WooCommerce rather than Shopify, so there is no products.json. But
WooCommerce ships its own public read API, the Store API, and theirs is open:

    /wp-json/wc/store/v1/products?per_page=100

That is a feed read, not a scrape, so this survives them restyling their site
and picks up anything they add. Per-variation price and stock come from
/wp-json/wc/store/v1/products/<variation id>, fetched only for the few products
whose variations differ in price.

They bring five brands new to the catalogue - Premier Equine, Shires, uvex,
Flex-On and Professional's Choice - plus more Waldhausen and their own JLN
house label. None of their listings duplicate anything we already carry.

Their own category tree cannot be mapped wholesale, because their filing is
wrong often enough to matter: "Men's Breeches" holds a show shirt and a
competition jacket, "Saddlery" holds six pairs of stirrups, "Accessories" holds
gloves, and two products carry no category at all. So the mapping is per
product, in category_map.json, keyed by their slug. A product that is not in
that file is NOT guessed at - it is held, reported, and the run fails, so that
anything they add gets a decision rather than a wrong shelf.

A quarter of their range has no photograph. Those still go up: the site has a
designed "Photography Coming Soon" tile for exactly this, and hiding a product
a rider might search for serves nobody. Hiding stays reserved for what AGENTS.md
reserves it for.

    python3 scripts/jln/sync.py            # dry run, prints the plan
    python3 scripts/jln/sync.py --apply
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request
from html import unescape

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

from feeds import FeedUnavailable, read_json  # noqa: E402
from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402
from revalidate import ping  # noqa: E402
from snapshot import take  # noqa: E402

SITE = "https://jlnequestrian.com"
FEED = f"{SITE}/wp-json/wc/store/v1/products?per_page=100"
VARIATION = f"{SITE}/wp-json/wc/store/v1/products/{{id}}"
SUPPLIER_TAG = "supplier:jln"
OOS_TAG = "sync:out-of-stock"
CATEGORY_MAP = os.path.join(HERE, "category_map.json")
STATE = os.path.join(HERE, "sync_state.json")
UA = "Indusequine catalogue sync"

# Their title prefix -> the vendor field, which is where brand lives. Written
# out because "first word of the title" turns "Body Protector" into a brand
# called Body.
BRANDS = [
    ("premier equine", "Premier Equine"),
    ("professional", "Professional's Choice"),
    ("waldhausen", "Waldhausen"),
    ("shires", "Shires"),
    ("flex-on", "Flex-On"),
    ("flex- on", "Flex-On"),
    ("uvex", "uvex"),
    ("jln", "JLN"),
]
# Shopify has no empty vendor and brands.ts reads this one as "no brand".
NO_BRAND = "Indusequine"

# Their typing slips, fixed because they are visible on our product pages.
# Only outright errors - uvex's lower-case styling is the brand's own and stays.
TITLE_FIXES = {
    "Cheltanham": "Cheltenham",
    "FLat": "Flat",
    "Flex- On": "Flex-On",
}

# Every one of their size-ish attribute names. products.ts matches the literal
# "Size" and "Color"; anything else reaches the site as no size at all and the
# picker silently drops it, which is how the Piquant import went wrong. No
# product of theirs carries two of these, so folding them all into Size is safe.
SIZE_ATTRS = {
    "bit size", "generic sizing", "helmet sizing", "gloves size",
    "shirt and blazer sizing", "riding boots size", "whips and spurs size",
    "rug size",
}

# Words that carry nothing in a code read down the phone.
STOP_WORDS = {"the", "with", "and", "a", "for", "of", "to", "in"}

# Products held back for a decision rather than guessed at. The nine with no
# entry in category_map.json are held automatically; these are held for other
# reasons.
HELD = {
    "waldhausen-single-jointed-pony-snaffle":
        "duplicate of waldhausen-single-jointed-pony-snaffle-bit on their side "
        "- same bit, same two sizes, Rs3,000 vs Rs4,100, this one with no "
        "photo, description or category. Ask JLN which is current.",
}

# Three of their listings are priced or varied by an option products.ts cannot
# read, so published whole they would show one size twice at two prices. Each
# becomes one listing per value instead, the way the colour split was done.
# Front and hind are genuinely different boots and are filed differently.
SPLITS = {
    "premier-equine-air-cooled-original-eventing-boots": {
        "attribute": "Horse Leg",
        "values": {
            "front": ("Front", "tendon-boots"),
            "hind": ("Hind", "fetlock-boots"),
        },
    },
    "jln-coronet-boots": {
        "attribute": "Lining",
        "values": {
            "sheepskin": ("Sheepskin", "bell-boots"),
            "without-sheepskin": ("Without Sheepskin", "bell-boots"),
        },
    },
    "flex-on-armet-helmet-star": {
        "attribute": "Visor Type",
        "values": {
            "angel": ("Angel Visor", "helmet"),
            "mixte": ("Mixte Visor", "helmet"),
        },
    },
}

# Their descriptions end by restating the colours and sizes, which the picker
# already shows. Dropped for the same reason Piquant's size lists were.
TAIL_LINE = re.compile(
    r"^\s*(colour|color|colours|colors|size|sizes|available sizes)\s*:", re.I)

PRODUCT_SET = """
mutation($input: ProductSetInput!, $identifier: ProductSetIdentifiers!) {
  productSet(input: $input, synchronous: true, identifier: $identifier) {
    product { id handle }
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

COLLECTIONS_QUERY = """
query($cursor: String) {
  collections(first: 250, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes { id handle }
  }
}
"""

EXISTING_QUERY = """
query($q: String!) {
  products(first: 20, query: $q) { nodes { id handle title tags } }
}
"""


def get(url: str):
    return read_json(url, "JLN Equestrian")


def slug(s: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")


def title_of(raw: str) -> str:
    t = " ".join(unescape(raw).split())
    for wrong, right in TITLE_FIXES.items():
        t = t.replace(wrong, right)
    return t


def vendor_of(title: str) -> str:
    low = title.lower()
    for prefix, name in BRANDS:
        if low.startswith(prefix):
            return name
    return NO_BRAND


def code_for(title: str) -> str:
    """A stable supplier code. They carry no SKU on any variant, and the founder
    quotes these over the phone, so they are built to read aloud.

    Five words, not three: their range runs to three Dutch gags differing only
    in mouthpiece and three Flex-On stirrups differing only in colour, so the
    word that distinguishes one listing from the next sits at the end of the
    title. Taking the opening words collided seven ways.
    """
    vendor = vendor_of(title)
    words = re.findall(r"[A-Za-z0-9]+", title.replace("\u2019", "'"))
    vendor_words = re.findall(r"[A-Za-z0-9]+", vendor.lower())
    if [w.lower() for w in words[:len(vendor_words)]] == vendor_words:
        words = words[len(vendor_words):]
    words = [w for w in words if w.lower() not in STOP_WORDS][:5]
    body = "".join(w[:4].upper() for w in words)
    # JLN's own label needs no initial after JLN, and a product with no maker
    # must not be given "I" for the no-brand marker
    if vendor in (NO_BRAND, "JLN"):
        return f"JLN-{body}"
    # skip the possessive "s" of Professional's Choice, which would read PSC
    initials = "".join(w[0] for w in re.findall(r"[A-Za-z]{2,}", vendor))[:3].upper()
    return f"JLN-{initials}-{body}"


def description(raw: str) -> str:
    """Their copy as clean paragraphs.

    Most of it is the brand's own product text and worth keeping: mouthpiece
    thicknesses, cheek heights, fabric composition. What it arrives wrapped in
    is not - twelve of these carry uvex's or Shires' own page markup, divs and
    CSS classes and all. So the blocks are pulled out and rebuilt rather than
    passed through, the repeated marketing headline uvex opens with is dropped,
    and so is the trailing restatement of colours and sizes.
    """
    h = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", raw or "")
    # mark block ends so the text does not run together, as Piquant's did
    h = re.sub(r"(?i)<br\s*/?>", "\n", h)
    h = re.sub(r"(?i)<li[^>]*>", "\n\x01", h)
    h = re.sub(r"(?i)</(p|div|h[1-6]|li|tr)>", "\n\n", h)
    h = re.sub(r"<[^>]+>", " ", h)
    h = unescape(h)

    items: list[tuple[bool, str]] = []
    seen = set()
    for chunk in h.split("\n\n"):
        for line in chunk.split("\n"):
            bullet = line.startswith("\x01")
            text = " ".join(line.replace("\x01", " ").split())
            if not text or TAIL_LINE.match(text):
                continue
            # their own markup lifts a line into a heading and then repeats it
            key = text.lower().rstrip(".")
            if key in seen:
                continue
            seen.add(key)
            # uvex's bullets arrive as paragraphs led by a bullet character
            if text[0] in "\u2022\u00b7\u2023-" and len(text) > 2:
                bullet, text = True, text[1:].strip()
            items.append((bullet, text))

    # uvex opens with a tagline and then repeats it as the first words of the
    # paragraph below it. Drop the line that is only the opening of another.
    keep = []
    for i, (bullet, text) in enumerate(items):
        low = text.lower().rstrip(".")
        if not bullet and any(
            other.lower().startswith(low) and len(other) > len(text)
            for j, (b2, other) in enumerate(items) if j != i and not b2
        ):
            continue
        keep.append((bullet, text))

    out, bullets = [], []
    for bullet, text in keep:
        if bullet:
            bullets.append(text)
            continue
        if bullets:
            out.append("<ul>" + "".join(f"<li>{b}</li>" for b in bullets) + "</ul>")
            bullets = []
        out.append(f"<p>{text}</p>")
    if bullets:
        out.append("<ul>" + "".join(f"<li>{b}</li>" for b in bullets) + "</ul>")
    return "\n".join(out)


def option_name(their: str) -> str:
    low = their.strip().lower()
    if low == "color" or low == "colour":
        return "Color"
    if low in SIZE_ATTRS:
        return "Size"
    return their.strip()


def gender_of(prod: dict, title: str) -> str | None:
    """Only from what is actually said. Their category names carry it where a
    title does not, and nothing is inferred from a product being a show shirt."""
    hay = title.lower() + " " + " ".join(
        unescape(c["name"]).lower() for c in prod.get("categories") or [])
    if re.search(r"\b(girls?|boys?|kids?|child|children|junior)\b", hay):
        return "kids"
    # women before men, and on a word boundary: "women's" contains "men's", and
    # a substring test put their Maria show shirt in the men's filter.
    if re.search(r"\b(women|womens|ladies)\b", hay):
        return "women"
    if re.search(r"\b(men|mens|man)\b", hay):
        return "men"
    return None


def real_images(prod: dict) -> list[str]:
    """Their photographs, minus WooCommerce's own placeholder graphic, which is
    not a photograph and would read as one."""
    return [i["src"] for i in (prod.get("images") or [])
            if "placeholder" not in i["src"].lower()]


def variants_of(prod: dict, code: str, fetch_each: bool,
                split: tuple[str, str] | None = None) -> list[dict]:
    """One Shopify variant per variation of theirs.

    Their product object carries a single price and the variations carry only
    their attributes, so the price per variation is fetched only where the feed
    says the variations differ (price_range is set). That is five products, not
    seventy-five requests.
    """
    parent_price = int(prod["prices"]["price"]) / 100
    names = {a["name"]: option_name(a["name"]) for a in prod.get("attributes") or []}
    # an attribute with a single value is a constant, not a choice
    constant = {a["name"] for a in prod.get("attributes") or [] if len(a["terms"]) < 2}
    pretty = {a["name"]: {t["slug"]: t["name"] for t in a["terms"]}
              for a in prod.get("attributes") or []}

    out = []
    for v in prod.get("variations") or []:
        # one listing per value of a split option: keep only its variations,
        # and drop the option itself, which is now said in the title
        if split and not any(a["name"] == split[0] and a["value"] == split[1]
                             for a in v["attributes"]):
            continue
        price = parent_price
        if fetch_each:
            price = int(get(VARIATION.format(id=v["id"]))["prices"]["price"]) / 100
        chosen = []
        for a in v["attributes"]:
            if a["name"] in constant or (split and a["name"] == split[0]):
                continue
            label = pretty.get(a["name"], {}).get(a["value"], a["value"])
            chosen.append((names.get(a["name"], a["name"]), unescape(str(label))))
        sku = "-".join([code] + [slug(val).upper() for _, val in chosen]) if chosen else code
        out.append({
            "sku": sku,
            "price": f"{price:.2f}",
            # productSet refuses variants with no options, and a product whose
            # every attribute holds a single value has none left after the
            # constants are dropped. The migration's own answer was a "Title"
            # option, which products.ts already reads as no size and no colour.
            "optionValues": ([{"optionName": n, "name": val} for n, val in chosen]
                             or [{"optionName": "Title", "name": sku}]),
        })
    if not out:  # a simple product, no variations at all
        out.append({"sku": code, "price": f"{parent_price:.2f}",
                    "optionValues": [{"optionName": "Title", "name": code}]})
    return out


def product_options(variants: list[dict]) -> list[dict]:
    seen: dict[str, list[str]] = {}
    for v in variants:
        for o in v["optionValues"]:
            vals = seen.setdefault(o["optionName"], [])
            if o["name"] not in vals:
                vals.append(o["name"])
    return [{"name": n, "values": [{"name": x} for x in vals]} for n, vals in seen.items()]


def plan_for(prod: dict, category: str,
             split: tuple[str, str, str] | None = None) -> dict:
    """One product of theirs as one of ours.

    `split` is (their attribute name, the term slug, what to call it), which
    makes this one listing out of one value of an option our picker cannot
    show. The code keeps the parent's words and gains the value, so the two
    listings read as siblings down the phone.
    """
    title = title_of(prod["name"])
    code = code_for(title)
    # their own-label slugs already start with jln, and jln-jln-half-boots is
    # not a URL anyone should be given
    handle = prod["slug"] if prod["slug"].startswith("jln-") else f"jln-{prod['slug']}"
    if split:
        attribute, value, label = split
        title = f"{title} - {label}"
        code = f"{code}-{slug(label).upper()}"
        handle = f"{handle}-{value}"
    fetch_each = bool(prod["prices"].get("price_range"))
    variants = variants_of(prod, code, fetch_each,
                           (split[0], split[1]) if split else None)
    in_stock = bool(prod.get("is_in_stock"))

    tags = [f"category:{category}", SUPPLIER_TAG, f"supplier-code:{code}"]
    gender = gender_of(prod, title)
    if gender:
        tags.append(f"gender:{gender}")
    if not in_stock:
        tags.append(OOS_TAG)

    return {
        "handle": handle,
        "title": title,
        "vendor": vendor_of(title),
        "category": category,
        "description": description(prod.get("description") or ""),
        "tags": tags,
        "in_stock": in_stock,
        "gender": gender,
        "options": product_options(variants),
        "variants": variants,
        "images": real_images(prod),
        "their_slug": prod["slug"],
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write to Shopify")
    ap.add_argument("--only", help="comma-separated slugs of theirs, to redo "
                                   "just those; the rest of the state is kept")
    args = ap.parse_args()

    cmap = json.load(open(CATEGORY_MAP))
    try:
        feed = get(FEED)
    except FeedUnavailable as e:
        print(f"{e}\n  {e.url}\n\nNothing was written. Shopify is unchanged.")
        return 2
    if args.only:
        wanted = {x.strip() for x in args.only.split(",") if x.strip()}
        missing = wanted - {p["slug"] for p in feed}
        if missing:
            print(f"not on their site: {', '.join(sorted(missing))}")
            return 2
        feed = [p for p in feed if p["slug"] in wanted]

    plans, held = [], []
    for p in feed:
        if p["slug"] in HELD:
            held.append((p, HELD[p["slug"]]))
        elif p["slug"] in SPLITS:
            spec = SPLITS[p["slug"]]
            for value, (label, category) in spec["values"].items():
                q = plan_for(p, category, (spec["attribute"], value, label))
                if q["variants"]:
                    plans.append(q)
                else:
                    held.append((p, f"{spec['attribute']} {value} is in SPLITS "
                                    f"but they list no variation for it"))
        elif p["slug"] in cmap:
            plans.append(plan_for(p, cmap[p["slug"]]))
        else:
            held.append((p, "not in category_map.json - nothing here knows "
                            "where it should be filed"))

    # listings, not products: three of theirs become two listings each
    print(f"JLN Equestrian: {len(feed)} products on their site, "
          f"{len(plans)} listing{'' if len(plans) == 1 else 's'} to write, "
          f"{len(held)} held\n")
    for q in plans:
        pic = f"{len(q['images'])}img" if q["images"] else "NO PHOTO"
        print(f"  {q['title'][:48]:48s} {q['category']:28s} "
              f"{len(q['variants'])}v {pic:8s} {q['gender'] or '-':6s}"
              + ("" if q["in_stock"] else " OUT OF STOCK"))
    if held:
        print(f"\n  {len(held)} held back, not written:")
        for p, why in held:
            print(f"    {title_of(p['name'])[:52]}")
            print(f"        {why}")

    if not args.apply:
        print("\nDry run. Nothing written. Re-run with --apply.")
        return 1 if held else 0

    client = ShopifyClient(load_env())
    take(client, handles=[q["handle"] for q in plans], label="jln-sync")

    collections = {}
    cursor = None
    while True:
        page = client.query(COLLECTIONS_QUERY, {"cursor": cursor})["data"]["collections"]
        collections.update({n["handle"]: n["id"] for n in page["nodes"]})
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]

    done = []
    for i, q in enumerate(plans, 1):
        # productSet upserts by handle and restates the whole product, so
        # writing over another supplier's listing would destroy it silently.
        found = client.query(EXISTING_QUERY, {"q": f"handle:{q['handle']}"})["data"]["products"]["nodes"]
        holder = next((n for n in found if n["handle"] == q["handle"]), None)
        if holder and SUPPLIER_TAG not in holder["tags"]:
            print(f"[{i}/{len(plans)}] REFUSED {q['handle']}: handle held by "
                  f"'{holder['title'][:40]}', which is not ours")
            continue

        res = client.query(PRODUCT_SET, {
            "identifier": {"handle": q["handle"]},
            "input": {
                "handle": q["handle"], "title": q["title"], "vendor": q["vendor"],
                "status": "ACTIVE", "tags": q["tags"],
                "descriptionHtml": q["description"],
                "productOptions": q["options"], "variants": q["variants"],
                "files": [{"originalSource": u, "contentType": "IMAGE", "alt": q["title"]}
                          for u in q["images"]],
            },
        })
        payload = (res.get("data") or {}).get("productSet") or {}
        errs = res.get("errors") or payload.get("userErrors")
        if errs:
            print(f"[{i}/{len(plans)}] FAILED {q['handle']}: {str(errs)[:200]}")
            continue

        gid = payload["product"]["id"]
        client.query(PUBLISH, {"id": gid,
                               "input": [{"publicationId": client.headless_publication_id()}]})
        if q["category"] in collections:
            client.query(ADD_TO_COLLECTION,
                         {"id": collections[q["category"]], "productIds": [gid]})
        else:
            print(f"    warning: no collection {q['category']}, product not filed")

        done.append({"handle": q["handle"], "id": gid, "their_slug": q["their_slug"]})
        print(f"[{i}/{len(plans)}] {q['handle']}: {len(q['variants'])} variants"
              + ("" if q["in_stock"] else ", marked out of stock"))

    # A partial run must not erase what a full run recorded: an --only pass
    # once overwrote the rollback state for eleven earlier merges.
    synced = done
    if args.only and os.path.exists(STATE):
        before = json.load(open(STATE)).get("synced") or []
        fresh = {d["handle"] for d in done}
        synced = [d for d in before if d["handle"] not in fresh] + done
    with open(STATE, "w") as f:
        json.dump({"synced": synced}, f, indent=1)
    print(f"\n{len(done)} synced.")
    ping()
    # Fail the run so the scheduled job emails rather than holding in silence.
    # Everything mappable has already been written by this point.
    return 1 if held else 0


if __name__ == "__main__":
    raise SystemExit(main())
