<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Indusequine conventions

**Images: use a plain `<img>`, never `next/image`.** Every component here does:
`ProductImage`, `CategoryTile`, `CategoryGroupTile`, `CampaignHero`, `BrandStrip`.
Shopify-hosted photographs go through `shopifyImage()` in `src/lib/imageUrl.ts`
for resizing. `next/image` routes requests through Vercel's optimiser, which is
not wanted here, and it rejects the Shopify CDN outright unless the host is
configured. A `next/image` added to this codebase renders blank on the
deployment while working fine in `next dev`.

**Verify in a production build, not `next dev`.** `npm run build && npm start`
catches what dev hides, image handling included. Remove `.next` first when a
change is not showing up.

**Stock lives with the suppliers, not in Shopify**, where every product reads
zero inventory. Each sync tags what its supplier's site reports, and
`inStockFromTags()` in `src/data/products.ts` reads those tags. Out of stock is
shown and marked, never hidden. Hiding (status DRAFT) is reserved for products
a supplier has dropped and for the split listings folded into multi-variant
products.

**A catalogue change is not visible until the pages are refreshed.** Every page
that reads Shopify is cached for an hour, so a merge or a price fix keeps
serving the old version until then, which reads as the change not having
worked. `scripts/revalidate.py` tells the site to refresh; the write scripts
call it themselves when they finish. It needs `REVALIDATE_SECRET` (matching the
one set in Vercel) and `VERCEL_BYPASS_SECRET` (Settings -> Deployment
Protection -> Protection Bypass for Automation), because the deployment sits
behind Vercel's login wall and answers a script with its own 401 otherwise.
