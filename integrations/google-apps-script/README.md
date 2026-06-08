# Google Apps Script integration

Handles two things from one Web App:
1. **Append leads** to a Google Sheet (one row per lead from the website).
2. **Create Gmail drafts** for admins to reply to a lead in one click from Telegram.

Free, no Cloud Console, no API keys to rotate.

---

## Setup (10 minutes, one-time)

### 1. Create the Sheet

1. https://sheets.new — make a new spreadsheet.
2. Rename the first tab to **Leads** (or whatever you want, just match `GOOGLE_SHEET_TAB` later).
3. Keep this tab open — you'll add the script to it.

### 2. Open the script editor

In the spreadsheet: **Extensions → Apps Script**.

You'll land on `Code.gs` — a default empty file.

### 3. Paste the code

1. Open [`Code.gs`](./Code.gs) in this folder.
2. Copy the entire contents.
3. Paste into the Apps Script editor, replacing the default `function myFunction()`.
4. **Change the `SECRET` constant at the top** — generate a long random string. Example one-liner you can run anywhere:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

   Copy the output, replace `REPLACE_ME_WITH_LONG_RANDOM_STRING` with it. Save the Apps Script (`Cmd+S`).

### 4. Deploy as Web App

In the Apps Script editor: **Deploy → New deployment**.

- **Type**: Web app (click the gear icon next to "Select type" if you don't see it).
- **Description**: `alab-leads` (or anything).
- **Execute as**: **Me** — your Google account. This is what lets the script write to your Sheet and create drafts in your Gmail.
- **Who has access**: **Anyone**. (The secret is what gates access — without it, requests are rejected.)
- Click **Deploy**.

Google asks for permissions:
- "View and manage your spreadsheets in Google Drive" — needed for append.
- "Create, send, and delete drafts in your Gmail" — needed for the reply button.

Click Allow. (You'll see a "Google hasn't verified this app" screen — click "Advanced" → "Go to (unsafe)" — this is your own script, it's fine.)

After deploy, copy the **Web app URL**. It looks like:

```
https://script.google.com/macros/s/AKfycb.../exec
```

### 5. Set Vercel env vars

In Vercel → project `alab-property` → **Settings → Environment Variables**, add:

| Name | Value | Environments |
|---|---|---|
| `GOOGLE_SHEETS_WEBHOOK_URL` | Web app URL from step 4 | Production (and Preview if you want) |
| `GOOGLE_SHEETS_WEBHOOK_SECRET` | The secret string you generated in step 3 | Production |
| `GOOGLE_SHEET_TAB` | `Leads` (or whatever tab name) | Production |

Trigger a redeploy: **Deployments → ⋯ on latest → Redeploy** (without build cache).

### 6. Test

After Vercel finishes deploying:

1. Open https://alabproperty.com/en/contacts, submit a test lead.
2. Within ~10s the row should appear in your Sheet.
3. Check Telegram — the admin notification has a "Reply in Gmail" button. Click it — Gmail should open with a draft addressed to the lead.

If anything fails, look at:
- `https://alabproperty.com/api/health` — checks `resend`, `telegram`, etc., but **doesn't probe Apps Script directly**. Lead append failure shows up as a tech-admin Telegram alert (`[api/leads] sheets append failed`).
- Apps Script logs: in the editor, click **Executions** in the left sidebar.

---

## Updating the script later

If you change `Code.gs` (e.g. add a new column to the header row):

1. Paste the new code in Apps Script.
2. **Deploy → Manage deployments → ⋮ → Edit → Version: New version → Deploy.**

The Web app URL **stays the same** as long as you "Edit" an existing deployment instead of creating a new one. If you create a new deployment, the URL changes and you have to update `GOOGLE_SHEETS_WEBHOOK_URL` in Vercel again.

---

## Security notes

- The Web App URL is **not** a secret. Anyone who finds it can hit it, but without `SECRET` they get `{ ok: false, error: 'forbidden' }` and nothing happens.
- The SECRET is in TWO places: the Apps Script source (in your private Google account) and `GOOGLE_SHEETS_WEBHOOK_SECRET` in Vercel. **Never** commit the real value to git.
- Rotating the secret: change it in both places at once (Apps Script source + Vercel env), redeploy both. The window where the two are out of sync = appends fail. Pick a quiet moment.
- Apps Script runs as **your** Google account, so all drafts are created in **your** Gmail. If you want shared access (multiple agents replying), set up a dedicated Google Workspace user and run the script as them.

---

## Why this is in `integrations/google-apps-script/` and not in the main repo build

This `.gs` file isn't part of Next.js or the bundle. It lives in the repo only so you have **one place** to look at the source — but the actual code runs inside Google's Apps Script runtime, deployed manually via the steps above. There's no automated CI for it (Apps Script doesn't have a useful programmatic deploy API).
