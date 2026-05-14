# Indusequine — Resume Point

**For Claude in a future session:** read this top-to-bottom before doing anything else. Then ask the user what they want to do next. Don't re-derive context from scratch.

**For the user:** this file captures exactly where we left off, including everything Claude needs to continue cleanly on a different machine.

---

## TL;DR

- **What this is:** Indusequine — India's first equestrian marketplace. Pre-launch landing site for founder Mithilesh (h.u.mithilesh@gmail.com).
- **Built and deployed:** files are sitting in `public_html/` on Hostinger shared hosting. Verified intact via Hostinger preview URL (`https://mediumvioletred-cassowary-122161.hostingersite.com/` — root serves, but preview infra has a known bug that 404s nested paths; the real domain will work normally).
- **Blocked on:** `indusequine.com` domain has been stuck on **"still connecting"** in hPanel for 24+ hours. Hostinger backend is stuck on activation. User has been advised to contact Hostinger live chat; that's the only path to unstick.
- **Once the domain connects:** Claude (next session) should hit `https://indusequine.com`, verify all six pages load with proper styling, submit a real waitlist entry, and confirm it lands in the founder's Google Sheet.

---

## Architecture (the version we actually deployed)

- **Next.js 16.2.6** App Router, TypeScript, Tailwind v4
- **`output: 'export'`** in `next.config.ts` — static export mode (chosen because Hostinger Premium's "Node.js Selector" had no visible "Create Application" button despite being advertised; the feature appears to not be active on this plan tier)
- **Trailing slash**: `trailingSlash: true` (every page lives at `/route/index.html`)
- **Forms**: client-side `fetch` to a Google Apps Script Web App. `WaitlistForm.tsx` and `ContactForm.tsx` use plain `useState`, not server actions. They POST with `Content-Type: text/plain` to avoid CORS preflight.
- **Env var**: `NEXT_PUBLIC_SHEETS_WEBHOOK_URL` (must have the `NEXT_PUBLIC_` prefix — gets inlined into the client bundle at build time). Lives in `.env.local` (gitignored).
- **Brand**: deep forest green / oxblood / cream / brass palette, Cormorant Garamond + Inter typography, custom inline SVG illustrations (no stock photos in v1)
- **Webhook URL** (already verified working — `{"ok":true}` confirmed via Node fetch test): see `.env.local` on disk; the URL takes the form `https://script.google.com/macros/s/AKfycbxpzus3s9SgTkoPxJ1AmGmMBjLTUrJocRedH-tQq3_KOoqMSN8tvZ8C6jMo4fqd6idB/exec`. Apps Script project name: `Indusequine Webhook`. Sheet tab: `Submissions`. Columns: `timestamp, form, name, email, role, city, phone, organisation, kind, message`.

## What's where

```
src/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── marketplace/page.tsx, services/page.tsx, story/page.tsx,
│   │   waitlist/page.tsx, contact/page.tsx
│   ├── sitemap.ts, robots.ts  (both have `export const dynamic = "force-static"`)
└── components/
    ├── Header.tsx, Footer.tsx, Container.tsx
    ├── Logo.tsx, Illustrations.tsx (all custom SVG art)
    ├── WaitlistForm.tsx, ContactForm.tsx (client-side fetch)
next.config.ts  →  output: 'export', trailingSlash: true, images.unoptimized
```

## Git history

```
fbbe21f  Revert "Switch to Node standalone output for Hostinger Node.js Selector"   ← HEAD
38f4b16  Switch to Node standalone output for Hostinger Node.js Selector  (preserved in case Node deploy works later)
a7d1146  Switch to static export for shared hosting deployment
10af1b1  Initial pre-launch site
```

Repo lives at `./indusequine/` (the outer `Indusequine/` folder is just the workspace container — npm rejected the capital-letter folder as a package name).

Local git config: `user.name=Indusequine Founder`, `user.email=h.u.mithilesh@gmail.com`. Local-only, not global.

No remote configured yet. If you want offsite backup beyond OneDrive, push to GitHub.

---

## Architectural decisions that have already been ruled out — DO NOT re-suggest

- **Vercel** — user's account onboarding glitched ("No scopes available"), can't deploy through CLI without finishing onboarding in browser, and the browser session kept dropping. Ruled out 2026-05-11.
- **Hostinger Node.js Selector** — "Create Application" button not visible on user's Premium plan; pivoted to static export instead. Commit `38f4b16` preserves the Node-mode code in history if ever needed.

## Decisions that ARE settled

- Static export to Hostinger shared hosting.
- Google Sheets webhook (Apps Script Web App).
- Premium / luxury brand direction (forest / oxblood / cream / brass, Cormorant + Inter).
- Custom SVG illustrations rather than stock photography (founder's preference; can swap to real shoots when available).
- Commit after every meaningful change (user's standing instruction — see Claude memory).

---

## Where we left off — exact state

1. ✅ Code written, tested, committed (3 commits + 1 revert).
2. ✅ Static export built into `out/`.
3. ✅ `out/` contents zipped and uploaded into Hostinger `public_html/`. Files confirmed present (user verified in File Manager).
4. ⏳ Domain `indusequine.com` stuck on "still connecting" in hPanel for >24 hours. **This is the only blocker.** User needs to contact Hostinger live chat for backend fix; nothing in the code can resolve it.
5. ⏳ Once domain connects: Claude verifies live site and form submission.

Hostinger preview URL `https://mediumvioletred-cassowary-122161.hostingersite.com/` serves the home page HTML but 404s on nested CSS/JS/page paths (known Hostinger preview infrastructure bug — does NOT reflect real Apache behavior on the actual domain).

---

## Continuing on a different machine

### What's in OneDrive (auto-synced)

Everything inside `Indusequine/` (the outer folder, which is on the Desktop and inside OneDrive). That includes:
- The entire `indusequine/` repo (source code, .git history, package.json, etc.)
- `.env.local` (with the live webhook URL) — yes this dotfile DOES sync via OneDrive
- `indusequine.zip` (the deployment artifact) — exists at Desktop level if not deleted
- `node_modules/` will sync but it's huge (~360 MB); recommend `npm install` fresh on the new machine instead

### What is NOT in OneDrive (machine-local)

- Claude's auto-memory files at `C:\Users\REDDY\.claude\projects\c--Users-REDDY-OneDrive-Desktop-Indusequine\memory\` — these capture user profile, project context, preferences. When you start a Claude Code session on a different machine, point Claude at this `RESUME.md` file and the equivalent memory will rebuild over time.
- Node.js / npm installation — need to install on the new machine.
- Git installation (Mac usually has git via Xcode Command Line Tools).
- The Vercel CLI (only relevant if you ever try Vercel again — ruled out for now).

### Mac setup steps (one-time)

1. **Install OneDrive on Mac**, sign in to the same account that's synced on Windows. Wait for the `Indusequine/` folder to appear at `~/OneDrive/Desktop/Indusequine/` (or wherever Mac's OneDrive places Desktop folders).

2. **Install Node.js**. Two options:
   - Via Homebrew: `brew install node` (recommended if you already have brew)
   - Via official installer: download LTS from [nodejs.org](https://nodejs.org)
   - Verify: `node --version` should return v20.x or higher

3. **Open Terminal**, cd into the synced repo:
   ```bash
   cd ~/OneDrive/Desktop/Indusequine/indusequine
   ```
   (Path may vary based on how OneDrive places the folder.)

4. **Install dependencies fresh** (faster than syncing node_modules via OneDrive):
   ```bash
   rm -rf node_modules .next out
   npm install
   ```

5. **Verify `.env.local` made the trip**:
   ```bash
   cat .env.local
   ```
   Should show `NEXT_PUBLIC_SHEETS_WEBHOOK_URL=https://script.google.com/...`. If it's missing (OneDrive might have skipped the dotfile), recreate it with that one line — the URL is in the project Claude-memory and SETUP.md instructions.

6. **Run dev server to verify everything works**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Should look identical to how it does on Windows.

7. **Open Claude Code in this folder.** When the new session starts, paste this prompt:
   ```
   Read RESUME.md in this folder for the full project context, then tell me where we are. The next thing to do is check whether indusequine.com has connected at Hostinger yet.
   ```

### Things to do FIRST on the Mac to safety-net the project

Once you're set up, push to GitHub as a second backup. The Windows PC + OneDrive is currently your only copy. Tell Claude on the Mac "let's push this to GitHub" and it'll walk you through it.

---

## How to redeploy after future changes (reminder for future sessions)

1. Edit code
2. `npm run build`
3. Zip the contents of `out/` (not the folder itself — the contents, so `index.html` sits at zip root)
4. In Hostinger File Manager → `public_html/` → delete everything → upload new zip → extract → delete zip
5. Visit the domain. Hard-refresh to bust browser cache (`Cmd+Shift+R` on Mac).

The Apps Script webhook URL stays the same across deploys. The Google Sheet keeps accumulating submissions.

---

## Open questions for whichever session unblocks this

- **Domain activation:** still stuck? Contact Hostinger support. They have backend tooling.
- **Founder content:** founder names, real bios, real contact emails (currently placeholders: `hello@indusequine.com`, `partners@indusequine.com`, `professionals@indusequine.com` are aspirational, not real inboxes). Should be addressed before public launch.
- **Real photography:** SVG illustrations are intentional v1 art. Founder may want to commission photography before serious promotion.
- **Logo:** the SVG horseshoe-arch + monogram mark is a placeholder. A proper designed logo is a v1.1 item.

---

*This document was created 2026-05-13 to make the project portable across machines. Update it whenever the project state materially changes — keep it accurate as a single source of truth for "where are we right now."*
