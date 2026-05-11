# Indusequine — Setup & Deploy Guide

This is the pre-launch site for Indusequine, India's first equestrian marketplace.

## Stack

- **Next.js 16** (App Router, Turbopack) running on Node
- **Tailwind CSS v4** with brand tokens in `src/app/globals.css`
- **Cormorant Garamond** (display) + **Inter** (body) via `next/font/google`
- Server Actions handle waitlist + contact form submissions; webhook URL stays server-side
- Builds in **`output: 'standalone'`** mode — produces a self-contained bundle suitable for Hostinger's Node.js Selector

## Local development

```powershell
npm install
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

## Setting up the Google Sheets webhook

The forms post submissions via Server Actions to a Google Apps Script Web App, which appends rows to a Google Sheet. The webhook URL is read from `SHEETS_WEBHOOK_URL` (server-side only — never exposed to the client).

### Step 1 — Create the sheet

1. Create a new Google Sheet. Name it e.g. `Indusequine Submissions`.
2. Rename the first tab to **`Submissions`**.
3. Add a header row, exactly:

   ```
   timestamp	form	name	email	role	city	phone	organisation	kind	message
   ```

### Step 2 — Add the Apps Script

1. In the sheet: **Extensions → Apps Script**.
2. Replace `Code.gs` content with:

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

3. Save (`Ctrl+S`).

### Step 3 — Deploy as a Web App

1. **Deploy → New deployment** → gear icon → **Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
3. Click **Deploy**, authorize (Advanced → Go to project → Allow).
4. Copy the **Web app URL**.

> **When you change the script later:** Editing the script doesn't auto-update the live deployment. Go to **Deploy → Manage deployments**, click the edit pencil, change Version to **New version**, click Deploy. URL stays the same.

### Step 4 — Wire the URL

For local development, create `.env.local` next to `package.json`:

```
SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Restart `npm run dev`. For production, see the Hostinger setup below — env vars are set in hPanel's Node.js Selector UI, not in a file on the server.

## Building for production

```powershell
npm run build
```

Three things matter in the output:

```
.next/standalone/        ← Self-contained server bundle (server.js + minimal deps)
.next/static/            ← Static chunks (JS, CSS, fonts) — needs to be copied INTO standalone
public/                  ← Public assets (favicons, SVGs) — needs to be copied INTO standalone
```

The build doesn't auto-merge these. To produce the deployable folder, after `npm run build`:

```powershell
# from the indusequine/ project root
Copy-Item -Recurse .next\static .next\standalone\.next\static
Copy-Item -Recurse public .next\standalone\public
```

Now `.next/standalone/` is the complete deploy bundle (~22 MB). Its contents:

```
.next/standalone/
├── server.js              ← Entry point (Node runs this)
├── package.json
├── node_modules/          ← Only production deps
├── .next/
│   └── static/            ← Hashed JS/CSS/fonts
└── public/                ← Favicons, SVGs
```

## Deploying to Hostinger Node.js Selector

> **Prerequisites:** Hostinger Premium / Business / Cloud plan with **Node.js Selector** available in hPanel.

### Step 1 — Zip the bundle

Compress everything inside `.next/standalone/` into a single zip (e.g. `indusequine-app.zip`). Make sure the zip contents start with `server.js`, `package.json`, `.next/`, etc. directly — **not** wrapped in a `standalone/` folder.

### Step 2 — Upload via File Manager

1. Log in to [**hpanel.hostinger.com**](https://hpanel.hostinger.com)
2. Open your domain → **File Manager**
3. Create a new folder outside `public_html/` for the Node app, e.g. **`/nodejs/indusequine/`**. (Keeping the app outside `public_html` is the convention — the Node.js Selector will reverse-proxy your domain to this app on a private port.)
4. Upload `indusequine-app.zip` into `/nodejs/indusequine/`
5. Right-click → **Extract**. After extraction, you should see `server.js` and `package.json` directly inside `/nodejs/indusequine/`. Delete the zip.

### Step 3 — Configure Node.js Selector

1. In hPanel, navigate to **Advanced → Node.js** (or **Websites → Node.js** depending on hPanel version)
2. Click **Create Application** (or **+ Add app**)
3. Fill in:
   - **Node.js version:** select the highest 20.x available (or 22.x if offered). Next.js 16 needs Node 20+.
   - **Application mode:** Production
   - **Application root:** `/nodejs/indusequine` (or wherever you uploaded)
   - **Application URL:** `indusequine.com` (your domain — Hostinger will reverse-proxy here)
   - **Application startup file:** `server.js`
   - **Passenger log file:** leave blank (default)
4. Scroll to **Environment variables** and add:
   - **Variable name:** `SHEETS_WEBHOOK_URL`
   - **Value:** your Apps Script web app URL (the one in your local `.env.local`)
   - Add another: **`HOSTNAME`** = `0.0.0.0` (so the Node process binds to all interfaces, not just localhost)
   - And: **`PORT`** — leave Hostinger's default (it assigns one and proxies your domain to it)
   - Optionally: **`NODE_ENV`** = `production`
5. Click **Create** / **Save**

### Step 4 — Install dependencies (probably skip — standalone has them)

Standalone mode includes its own `node_modules/`, so you usually don't need to run `npm install` on the server. If Hostinger's interface offers a **Run NPM Install** button, you can skip it. If the app fails to start with "module not found" errors, then run it.

### Step 5 — Start the app

1. In Node.js Selector, find your `indusequine` app in the list
2. Click **Start App** (or **Restart**)
3. Hostinger reports a status (Running / Stopped). It should say **Running**.

### Step 6 — Verify

Visit [https://indusequine.com](https://indusequine.com). The site should load. If you see a Hostinger placeholder or a 502 error, give it 30 seconds, then hard-refresh (`Ctrl+Shift+R`). Check the Node.js Selector log file for any startup errors.

### Re-deploying after code changes

Each time you change the site:

```powershell
npm run build
Copy-Item -Recurse -Force .next\static .next\standalone\.next\static
Copy-Item -Recurse -Force public .next\standalone\public
```

Then:
1. Zip the new `.next/standalone/` contents
2. In hPanel File Manager, **delete** the contents of `/nodejs/indusequine/` (or move to a backup folder)
3. Upload + extract the new zip
4. In Node.js Selector, click **Restart App**

## What's where

```
src/
├── app/
│   ├── layout.tsx           Root layout (fonts, metadata, header, footer)
│   ├── page.tsx             Home
│   ├── globals.css          Brand tokens + base styles
│   ├── actions.ts           Server Actions for the forms (Node-only)
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
    ├── Logo.tsx
    ├── Container.tsx
    ├── Illustrations.tsx
    ├── WaitlistForm.tsx     useActionState → server action
    └── ContactForm.tsx
next.config.ts               output: 'standalone'
```

## Customising the brand

Colors and fonts live in `src/app/globals.css` under `@theme { ... }`. Tailwind v4 generates utility classes from these tokens — e.g. `bg-forest`, `text-brass-light`, `border-forest/20`.

Change a CSS variable, run `npm run build` (+ the copy steps above), redeploy.

To change fonts, edit the `next/font/google` imports in `src/app/layout.tsx` and update the corresponding variables in `globals.css`.
