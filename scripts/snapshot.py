#!/usr/bin/env python3
"""Copy the catalogue to disk before anything changes it.

Written after a colour split destroyed the photographs of 36 listings. The
script that did it had snapshotted every variant and no images, and recovering
took an afternoon of hunting round supplier websites. Two colours were never
found.

The lesson is narrower than "take a backup": a snapshot of image *URLs* would
not have helped. Shopify's CDN links die with the media they point at, so by
the time you need them they are already 404. A backup of photographs has to
hold the bytes.

So this does both. Metadata for the whole catalogue is cheap and always taken.
Images are downloaded only for the products a run is about to touch, which
keeps it to a few megabytes instead of a few gigabytes.

    python3 scripts/snapshot.py                     # whole catalogue, metadata
    python3 scripts/snapshot.py --images --only piquant
    python3 scripts/snapshot.py --list              # what snapshots exist

From a script that is about to write:

    from snapshot import take
    take(client, handles=[...], label="split-colours")
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402

BACKUPS = HERE.parent / "backups"

PRODUCTS = """
query($cursor: String, $q: String) {
  products(first: 100, after: $cursor, query: $q) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id handle title vendor status tags descriptionHtml
      options { name values }
      media(first: 50) { nodes { ... on MediaImage { id alt image { url } } } }
      variants(first: 250) {
        nodes { id sku price selectedOptions { name value } }
      }
    }
  }
}
"""


def fetch(client: ShopifyClient, query: str | None = None) -> list[dict]:
    cursor, out = None, []
    while True:
        page = client.query(PRODUCTS, {"cursor": cursor, "q": query})["data"]["products"]
        out += page["nodes"]
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]
    return out


def download(products: list[dict], into: Path) -> tuple[int, int]:
    """Pull the actual photographs down. URLs alone are not a backup."""
    into.mkdir(parents=True, exist_ok=True)
    got = missed = 0
    for p in products:
        for i, m in enumerate(p["media"]["nodes"]):
            url = (m.get("image") or {}).get("url")
            if not url:
                continue
            name = url.split("/")[-1].split("?")[0]
            dest = into / f"{p['handle']}__{i}__{name}"
            if dest.exists():
                got += 1
                continue
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Indusequine backup"})
                with urllib.request.urlopen(req, timeout=60) as r:
                    dest.write_bytes(r.read())
                got += 1
            except Exception as e:  # a dead URL is exactly what we are guarding against
                print(f"    could not save {name}: {str(e)[:60]}")
                missed += 1
    return got, missed


def take(client: ShopifyClient, handles: list[str] | None = None,
         label: str = "", images: bool = True) -> Path:
    """Snapshot before a write. Returns the folder it wrote.

    `handles` limits the image download to the products about to change;
    metadata is always taken for everything, because it is small and the thing
    you wish you had is always the thing you did not think to include.
    """
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    folder = BACKUPS / f"{stamp}{'-' + label if label else ''}"
    folder.mkdir(parents=True, exist_ok=True)

    products = fetch(client)
    (folder / "products.json").write_text(json.dumps(products, indent=1))
    print(f"  snapshot: {len(products)} products -> {folder.relative_to(HERE.parent)}")

    if images:
        wanted = [p for p in products if handles is None or p["handle"] in set(handles)]
        if wanted:
            got, missed = download(wanted, folder / "images")
            print(f"  snapshot: {got} photographs saved"
                  + (f", {missed} could not be fetched" if missed else ""))
    return folder


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", action="store_true", help="download photographs too")
    ap.add_argument("--only", help="limit the image download to handles containing this")
    ap.add_argument("--label", default="manual")
    ap.add_argument("--list", action="store_true", help="show existing snapshots")
    args = ap.parse_args()

    if args.list:
        if not BACKUPS.exists():
            print("no snapshots yet")
            return 0
        for d in sorted(BACKUPS.iterdir()):
            if not d.is_dir():
                continue
            meta = d / "products.json"
            n = len(json.loads(meta.read_text())) if meta.exists() else 0
            imgs = len(list((d / "images").glob("*"))) if (d / "images").exists() else 0
            size = sum(f.stat().st_size for f in d.rglob("*") if f.is_file())
            print(f"  {d.name:34s} {n:4d} products, {imgs:4d} photographs, {size // 1024:6d} KB")
        return 0

    client = ShopifyClient(load_env())
    handles = None
    if args.only:
        handles = [p["handle"] for p in fetch(client) if args.only in p["handle"]]
        print(f"  {len(handles)} products match {args.only!r}")
    take(client, handles=handles, label=args.label, images=args.images)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
