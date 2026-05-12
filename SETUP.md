# Indusequine — Setup & Deploy Guide

This is the pre-launch site for Indusequine, India's first equestrian marketplace.

## Stack

- **Next.js 16** (App Router, Turbopack) in **static export mode** (`output: 'export'`)
- **Tailwind CSS v4** with brand tokens in `src/app/globals.css`
- **Cormorant Garamond** (display) + **Inter** (body) via `next/font/google`
- Forms submit client-side via `fetch` to a Google Apps Script webhook — no server needed
- Deploys to any static host (Hostinger shared hosting, Cloudflare Pages, Netlify, S3, etc.)

## Local development

```powershell
npm install
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

## Setting up the Google Sheets waitlist webhook

The waitlist and contact forms POST submissions directly from the browser to a Google Apps Script Web App, which appends rows to a Google Sheet. The webhook URL is read from `NEXT_PUBLIC_SHEETS_WEBHOOK_URL` and **baked into the client bundle at build time** — so you need to set it before running `npm run build`.

> **About the `NEXT_PUBLIC_` prefix:** This is Next.js convention for env vars that get inlined into client-side JavaScript. The Apps Script URL is meant to be publicly accessible (it's deployed as "Anyone" access), so baking it into the static export is the correct architecture for this kind of hosting.

### Step 1 — Create the sheet

1. Create a new Google Sheet. Name it e.g. `Indusequine Submissions`.
2. Rename the first tab to **`Submissions`**.
3. Add a header row, exactly:

   ```
   timestamp	form	name	email	role	city	phone	organisation	kind	message
   ```

### Step 2 — Add the Apps Script

1. In the sheet: **Extensions → Apps Script**.
2. Replace the default `Code.gs` content with:

   ```javascript
   function doPost(e) {
     try {
       const data = JSON.parse(e.postData.contents);
       const sheet = SpreadsheetApp.getActive().getSheetByName('Submissions');
       sheet.appendRow([
         data.timestamp || new Date().toISOString(),
         data.form || '',
         data.name || '',
         data.email || '',
         data.role || '',
         data.city || '',
         data.phone || '',
         data.organisation || '',
         data.kind || '',
         data.message || '',
       ]);
       return ContentService
         .createTextOutput(JSON.stringify({ ok: true }))
         .setMimeType(ContentService.MimeType.JSON);
     } catch (err) {
       return ContentService
         .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
         .setMimeType(ContentService.MimeType.JSON);
     }
   }
   ```

3. Save (`Ctrl+S`). Name the project `Indusequine Webhook`.

### Step 3 — Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Gear icon next to "Select type" → **Web app**.
3. Execute as: **Me**. Who has access: **Anyone**.
4. Click **Deploy**, authorize when prompted (Advanced → Go to project → Allow).
5. Copy the **Web app URL** — `https://script.google.com/macros/s/AKfycb.../exec`.

> **When you change the script later:** Editing the script doesn't auto-update the live deployment. Go to **Deploy → Manage deployments**, click the edit pencil, change Version to **New version**, click Deploy. URL stays the same.

### Step 4 — Wire the URL into the build

Create `.env.local` in the project root (next to `package.json`):

```
NEXT_PUBLIC_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

For local dev, restart `npm run dev` to pick up the var. For production, the URL gets compiled into the JS bundle the next time you run `npm run build`.

## Building the production site

```powershell
npm run build
```

Output goes to `out/`. That folder is the complete static site — HTML, CSS, JS, fonts, images — ready to upload to any static host.

## Deploying to Hostinger shared hosting

> **What you'll need:** Hostinger account, a domain pointed at it, hPanel access.

### Step 1 — Build locally

```powershell
npm run build
```

Then verify `out/` exists and contains `index.html`, `marketplace/`, `services/`, etc.

### Step 2 — ZIP the contents

In Windows Explorer, open the `out/` folder. **Select all files INSIDE `out/`** (Ctrl+A) — _not the `out/` folder itself_ — then right-click → **Send to → Compressed (zipped) folder**. Name it `indusequine.zip`.

> **Why this matters:** If you zip the `out/` folder itself, you'll end up serving the site from `yourdomain.com/out/` instead of `yourdomain.com/`. The zip should expand to put `index.html` straight into `public_html/`.

### Step 3 — Upload via Hostinger File Manager

1. Log in to **hPanel** at [hpanel.hostinger.com](https://hpanel.hostinger.com).
2. Click your domain → **File Manager** (or directly: **Files → File Manager**).
3. Open the **`public_html`** folder.
4. **Important** — if `public_html` has existing files (e.g. a default Hostinger placeholder `default.php`, `.htaccess`), select them all and **move them to a backup folder** (right-click → Move → e.g. `public_html_backup/`) rather than deleting outright. Keeps a rollback option.
5. Click the **upload icon** (cloud-with-arrow, top toolbar) → select your `indusequine.zip`.
6. Once uploaded, right-click the zip in the file list → **Extract**.
7. Confirm. After extraction, you should see `index.html`, `_next/`, `marketplace/`, etc. directly inside `public_html/`.
8. Delete the zip file (it's no longer needed).

### Step 4 — Point your domain

If your domain is already configured at Hostinger as the primary domain, it's already pointed at `public_html`. Visit your domain in a browser — site should load.

If you see a Hostinger placeholder page, force a hard refresh (`Ctrl+Shift+R`) or wait 2–3 minutes for any cached version to expire.

### Step 5 — Re-deploying after code changes

Each time you change the site:

```powershell
npm run build       # rebuild out/ with the latest code
```

Then:
- ZIP the new contents of `out/`
- In hPanel File Manager, delete (or move to backup) everything in `public_html/` from the previous deploy
- Upload + extract the new zip

> **Tip:** You can also use Hostinger's FTP credentials with a tool like FileZilla for faster repeated uploads if this becomes frequent.

## What's where

```
src/
├── app/
│   ├── layout.tsx           Root layout (fonts, metadata, header, footer)
│   ├── page.tsx             Home
│   ├── globals.css          Brand tokens (Tailwind @theme) + base styles
│   ├── marketplace/page.tsx
│   ├── services/page.tsx
│   ├── story/page.tsx
│   ├── waitlist/page.tsx
│   ├── contact/page.tsx
│   ├── sitemap.ts           Generates /sitemap.xml
│   └── robots.ts            Generates /robots.txt
└── components/
    ├── Header.tsx
    ├── Footer.tsx
    ├── Logo.tsx             SVG mark + wordmark
    ├── Container.tsx
    ├── Illustrations.tsx    Inline SVG art for category cards & hero
    ├── WaitlistForm.tsx     Client-side fetch to Apps Script
    └── ContactForm.tsx
next.config.ts               output: 'export' (static site mode)
```

## Customising the brand

All colors and fonts live in `src/app/globals.css` under `@theme { ... }`. Tailwind v4 generates utility classes from these tokens — e.g. `bg-forest`, `text-brass-light`, `border-forest/20`.

Change a CSS variable, run `npm run build`, redeploy — site is rebranded.

To change fonts, edit the `next/font/google` imports in `src/app/layout.tsx` and update the `--font-display` / `--font-body` variables in `globals.css` to point at the new font CSS variables.

## Upgrading the architecture later

This static export is the right call for a pre-launch landing site. When you're ready to build the actual marketplace (auth, payments, multi-seller, dynamic data), you'll likely want to:

1. Remove `output: 'export'` from `next.config.ts`
2. Switch back to server-rendered Next.js
3. Deploy to a host that supports Node (Vercel, Cloudflare Pages, Railway, or a Hostinger VPS plan)
4. Add a real database (Postgres on Neon / Supabase) + auth (Clerk / Auth.js) + payments (Razorpay)

The current pages and brand assets all carry over — only the form submission logic and hosting setup change.
