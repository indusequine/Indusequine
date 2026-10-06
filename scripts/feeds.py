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

import datetime
import json
import os
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


def annotate(level: str, message: str) -> None:
    """Say this where it can be read without a credential.

    A failed run's log needs a GitHub token to fetch, so the reason a sync
    failed was reaching nobody: the run said only "Process completed with exit
    code 2" and someone had to open the browser to learn more. Annotations are
    served by the public API, so the reason goes there too and can be read from
    outside.
    """
    if os.environ.get("GITHUB_ACTIONS") != "true":
        return
    flat = " ".join(str(message).split())[:700]
    print(f"::{level}::{flat}", flush=True)


class FeedUnavailable(RuntimeError):
    """A supplier's feed could not be read, with a reason worth printing."""

    def __init__(self, supplier: str, url: str, reason: str):
        self.supplier, self.url, self.reason = supplier, url, reason
        super().__init__(f"could not read {supplier}'s feed: {reason}")

    @property
    def rate_limited(self) -> bool:
        """Shopify refusing the address rather than the request.

        It rate limits by client IP, and these syncs run on GitHub runners
        whose addresses are shared with a great many other projects, so the
        budget is spent before our one request per six hours arrives. A new run
        draws a new address, so this clears by itself and is not a fault.
        """
        return "HTTP 429" in self.reason


# How long a supplier may go unread before it stops being someone else's
# problem and becomes ours. Four runs a day and roughly a one-in-nine chance
# each, so a week of silence is well past bad luck.
QUIET_LIMIT = datetime.timedelta(days=7)

LAST_WRITE_QUERY = """
query($q: String!) {
  products(first: 1, query: $q, sortKey: UPDATED_AT, reverse: true) {
    nodes { updatedAt }
  }
}
"""


def last_written(client, supplier_tag: str) -> datetime.datetime | None:
    """When this supplier's products were last written here, from Shopify.

    Not from a file. A run on a GitHub runner writes to a fresh checkout and
    never commits it, so anything this records locally is gone by the next run
    and anything committed is frozen at whatever was committed. Shopify is the
    one piece of state that actually persists between runs, and a successful
    sync always touches it.
    """
    try:
        nodes = client.query(LAST_WRITE_QUERY,
                             {"q": f"tag:'{supplier_tag}'"})["data"]["products"]["nodes"]
    except Exception as e:  # a broken read here must not mask the feed problem
        print(f"  (could not ask Shopify when this supplier last synced: {e})")
        return None
    if not nodes:
        return None
    return datetime.datetime.fromisoformat(nodes[0]["updatedAt"].replace("Z", "+00:00"))


def tolerate(error: FeedUnavailable,
             last_write: datetime.datetime | None) -> int:
    """The exit code for a feed we could not read: 0 to wait, 1 to shout.

    A rate limit on a shared address is worth waiting out, because the next run
    draws a different address. Mailing a failure every six hours for it only
    teaches everyone to ignore the mail, which is how three broken syncs went
    unnoticed for a week. But waiting quietly forever would hide a supplier who
    has gone for good, so once their products here have been untouched for
    longer than QUIET_LIMIT the run fails for real.
    """
    if not error.rate_limited:
        return 1
    if last_write is None:
        print(f"\nRate limited, and nothing of {error.supplier}'s has ever been "
              f"written here. Failing so this gets looked at.")
        return 1
    quiet = datetime.datetime.now(datetime.timezone.utc) - last_write
    if quiet < QUIET_LIMIT:
        print(f"\nRate limited by Shopify, which limits by address, and these "
              f"runs share theirs with every other project on the runner.\n"
              f"{error.supplier}'s products here were last written "
              f"{quiet.total_seconds() / 3600:.0f} hours ago, so this is worth "
              f"waiting out rather than calling a failure.")
        annotate("notice", f"{error.supplier} rate limited by Shopify; last "
                           f"written {quiet.total_seconds() / 3600:.0f}h ago, "
                           f"inside the {QUIET_LIMIT.days}-day limit - waiting "
                           f"for the next run")
        return 0
    print(f"\n{error.supplier}'s products here have not been written for "
          f"{quiet.days} days, longer than the {QUIET_LIMIT.days} allowed. "
          f"Failing for real.")
    annotate("error", f"{error.supplier} has not synced for {quiet.days} days")
    return 1


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
        annotate("warning", f"{supplier} feed attempt {attempt}: {last}")
        time.sleep(pause)

    # Refused for the address rather than the request, so ask from an address
    # that is ours. Only worth doing for a rate limit: a 404 is a 404 wherever
    # it is asked from.
    if "HTTP 429" in last:
        print(f"  {supplier}: rate limited here, asking the site to fetch it instead")
        try:
            return read_via_site(url, supplier, timeout)
        except FeedUnavailable as e:
            last = f"{last} | and through the site: {e.reason}"

    annotate("error", f"could not read {supplier}'s feed at {url} - {last}")
    probe(url, supplier)
    raise FeedUnavailable(supplier, url, last)


def read_via_site(url: str, supplier: str, timeout: int = 30):
    """The feed, fetched by our own deployment rather than by this machine.

    Vercel has an address of its own that Shopify has no quarrel with, and the
    deployment already holds the secret these scripts use for revalidation, so
    this needs nothing new configured and nothing asked of the supplier.
    """
    from revalidate import config  # local import: only this path needs it

    site, secret, bypass = config()
    if not secret:
        raise FeedUnavailable(supplier, url, "REVALIDATE_SECRET is not set, so "
                                             "the site cannot be asked to fetch it")
    headers = {"Content-Type": "application/json", "User-Agent": USER_AGENT}
    # The deployment sits behind Vercel's login wall, which answers a script
    # with its own 401 long before the request reaches the route.
    if bypass:
        headers["x-vercel-protection-bypass"] = bypass

    body = json.dumps({"secret": secret, "url": url}).encode()
    # trailingSlash is on and a POST does not survive the 308, so ask for the
    # slashed path directly.
    req = urllib.request.Request(f"{site}/api/supplier-feed/", data=body,
                                 headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout + 10) as resp:
            relayed = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        detail = e.read()[:200].decode("utf-8", "replace")
        raise FeedUnavailable(supplier, url,
                              f"the site would not fetch it: HTTP {e.code} {detail}")
    except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError) as e:
        raise FeedUnavailable(supplier, url,
                              f"could not reach the site to fetch it: {e}")

    status = relayed.get("status")
    if status != 200:
        raise FeedUnavailable(supplier, url,
                              f"their feed answered the site with HTTP {status}")
    try:
        feed = json.loads(relayed.get("body") or "")
    except json.JSONDecodeError as e:
        raise FeedUnavailable(supplier, url,
                              f"the site relayed something that is not JSON ({e})")
    print(f"  {supplier}: read through the site")
    annotate("notice", f"{supplier}'s feed was read through the site, "
                       f"because this runner is rate limited by Shopify")
    return feed


def probe(url: str, supplier: str) -> None:
    """When a feed will not be read, find out how much of their site will.

    Whether their whole site refuses us or only the feed endpoint decides what
    to do about it, and the difference is one request each. Runs only in CI, and
    only on a run that has already failed, so it costs a working sync nothing.
    """
    if os.environ.get("GITHUB_ACTIONS") != "true":
        return
    origin = "/".join(url.split("/")[:3])
    for path in ("/robots.txt", "/", "/products.json?limit=1",
                 "/collections/all/products.json?limit=1"):
        req = urllib.request.Request(origin + path,
                                     headers={"User-Agent": USER_AGENT,
                                              "Accept": "*/*"})
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                body = resp.read(200)
                kind = resp.headers.get("Content-Type", "?").split(";")[0]
                outcome = f"HTTP {resp.status} {kind} {len(body)}+ bytes"
        except urllib.error.HTTPError as e:
            outcome = f"HTTP {e.code} {e.reason}"
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            outcome = f"{type(e).__name__}: {e}"
        annotate("warning", f"probe {supplier} {path} -> {outcome}")
