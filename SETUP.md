# Indusequine — Setup Guide

This is the pre-launch site for Indusequine, India's first equestrian marketplace.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** with brand tokens defined in `src/app/globals.css`
- **Cormorant Garamond** (display) + **Inter** (body), loaded via `next/font/google`
- Server Actions handle form submissions — no separate API server needed

## Running locally

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Setting up the Google Sheets waitlist webhook

The waitlist and contact forms post submissions to a Google Apps Script Web App, which appends rows to a Google Sheet. Until `SHEETS_WEBHOOK_URL` is set in your environment, submissions are accepted but logged to the server console only (handy for local testing).

### Step 1 — Create the sheet

1. Create a new Google Sheet. Name it whatever you like (e.g. `Indusequine Submissions`).
2. Rename the first tab to `Submissions`.
3. Add a header row, exactly:

   ```
   timestamp | form | name | email | role | city | phone | organisation | kind | message
   ```

### Step 2 — Add the Apps Script

1. In the sheet, go to **Extensions → Apps Script**.
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

3. Save the script (Cmd/Ctrl + S). Name the project `Indusequine Webhook`.

### Step 3 — Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Description: `Indusequine waitlist webhook v1`.
4. Execute as: **Me**.
5. Who has access: **Anyone**.
6. Click **Deploy**.
7. Authorize the script when prompted (Google will warn that it's an unverified script — that's expected; click "Advanced" → "Go to project" → "Allow").
8. Copy the **Web app URL**. It will look like `https://script.google.com/macros/s/AKfycb.../exec`.

### Step 4 — Wire it into the site

Create a file named `.env.local` in the project root (next to `package.json`):

```
SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Restart the dev server. Submissions will now flow into your sheet.

> **Re-deploying the script:** If you change the Apps Script code later, you need to redeploy as a **new version** (not re-save). Otherwise the live webhook URL keeps running the old code.

## Production deployment

Deploy to **Vercel**:

1. Push the project to GitHub.
2. Import the repo in Vercel.
3. Add `SHEETS_WEBHOOK_URL` as an environment variable in Project Settings.
4. Deploy.

Or any other Node host that supports Next.js 16.

## What's where

```
src/
├── app/
│   ├── layout.tsx           Root layout (fonts, metadata, header, footer)
│   ├── page.tsx             Home
│   ├── globals.css          Brand tokens (Tailwind @theme) + base styles
│   ├── actions.ts           Server actions for waitlist + contact forms
│   ├── marketplace/
│   ├── services/
│   ├── story/
│   ├── waitlist/
│   └── contact/
└── components/
    ├── Header.tsx           Sticky nav with mobile menu
    ├── Footer.tsx
    ├── Logo.tsx             SVG mark + wordmark
    ├── Container.tsx        Max-width helper
    ├── Illustrations.tsx    Inline SVG art for category cards & hero
    ├── WaitlistForm.tsx     Client form with useActionState
    └── ContactForm.tsx
```

## Customising the brand

All colors and fonts live in `src/app/globals.css` under `@theme { ... }`. Tailwind v4 generates utility classes from these tokens automatically — e.g. `bg-forest`, `text-brass-light`, `border-forest/20`.

To change the primary palette, edit those CSS variables. To change fonts, edit the `next/font/google` import in `src/app/layout.tsx` and update the `--font-display` / `--font-body` variables to point at the new font CSS variables.
