#!/usr/bin/env python3
"""Read a supplier's public feed, and say plainly when it cannot be read.

Every sync begins by fetching a supplier's catalogue over HTTP. When that fetch
raised, the whole script died on an unhandled traceback, which GitHub reports
only as "Process completed with exit code 1" - the same thing it says when a
supplier has added a product we cannot file. The two need telling apart: one is
a thing to look at, the other a thing to wait out.

So a failure here is caught, named, retried, and finally reported as its own
exit code rather than a stack trace.

The User-Agent matters more than it looks. Shopify's bot protection treats a
bare custom agent coming from a datacentre address as something to refuse, and
every one of these syncs runs from a GitHub runner. The one fetch in this repo
that has never failed in CI is the Delhi scrape, which sends a browser agent;
the two that read Shopify products.json sent "Indusequine catalogue sync" and
failed almost every run. So these send a browser agent and say who we are after
it, which is honest and is what their own storefront serves.
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.request

USER_AGENT = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 "
              "(Indusequine catalogue sync; +https://indusequine.com)")

# Worth trying again: a rate limit, Shopify's bot refusal, or a bad gateway.
RETRY_CODES = {408, 425, 429, 430, 500, 502, 503, 504}

# How long to wait before each retry. Short at first, then long enough that a
# rate limit has a chance to clear.
BACKOFF = (2, 8, 20, 45)


class FeedUnavailable(RuntimeError):
    """A supplier's feed could not be read, with a reason worth printing."""

    def __init__(self, supplier: str, url: str, reason: str):
        self.supplier, self.url, self.reason = supplier, url, reason
        super().__init__(f"could not read {supplier}'s feed: {reason}")


def read_json(url: str, supplier: str, timeout: int = 30):
    """The feed at `url` as parsed JSON, or raise FeedUnavailable saying why."""
    last = "no attempt was made"
    for attempt, pause in enumerate((*BACKOFF, None), start=1):
        req = urllib.request.Request(url, headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-IN,en;q=0.9",
        })
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read()
            try:
                return json.loads(raw)
            except json.JSONDecodeError as e:
                # A login wall or a block page answers 200 with HTML
                head = raw[:120].decode("utf-8", "replace").replace("\n", " ")
                last = f"answered {len(raw)} bytes that are not JSON ({e}): {head}"
        except urllib.error.HTTPError as e:
            body = e.read()[:160].decode("utf-8", "replace").replace("\n", " ")
            last = f"HTTP {e.code} {e.reason}: {body}"
            if e.code not in RETRY_CODES:
                break
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last = f"{type(e).__name__}: {e}"
        if pause is None:
            break
        print(f"  {supplier}: {last} - trying again in {pause}s "
              f"(attempt {attempt} of {len(BACKOFF) + 1})")
        time.sleep(pause)
    raise FeedUnavailable(supplier, url, last)
