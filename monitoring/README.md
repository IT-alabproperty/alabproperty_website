# ALAB Property · External uptime monitor

Cloudflare Worker that pings `/api/health` every minute and pages Telegram
when the site goes down/degraded or recovers.

Why **external** Cloudflare Worker — not a Vercel cron? If Vercel itself dies,
Vercel cron dies with it and you'd never get an alert. Cloudflare runs the
worker on its own infrastructure: as long as Cloudflare's edge is up (it
basically always is), you'll know within ~1 minute that the site fell over.

Cost: **$0**. Free tier = 100 000 cron invocations/day. We use ~1 440/day.

---

## Setup (10–15 minutes one-time)

### 1. Cloudflare account

If you don't have one — sign up at [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up). No payment required for Workers free plan.

### 2. Install wrangler CLI

```bash
npm install -g wrangler
```

Or use `npx wrangler ...` in every command below.

### 3. Log in

```bash
cd "/Volumes/T7/ALAB_Agency/ALAB Agency/alab-property/monitoring"
wrangler login
```

Opens browser, click Allow. Wrangler caches the auth token locally.

### 4. Create KV namespace for state

```bash
wrangler kv namespace create "STATE"
```

It will print something like:

```
🌀 Creating namespace with title "alab-health-monitor-STATE"
✨ Success!
Add the following to your configuration file:
{ binding = "STATE", id = "abc123def456..." }
```

**Copy the `id` value.** Open `wrangler.jsonc`, replace `REPLACE_WITH_KV_NAMESPACE_ID` with your id. Save.

### 5. Set secrets

Run each command, paste the value when prompted (it's hidden — wrangler stores
encrypted in Cloudflare):

```bash
wrangler secret put TG_BOT_TOKEN
# paste your Telegram bot token (same one used in ALAB)

wrangler secret put TG_CHAT_ID
# paste your personal Telegram chat id (numeric)

wrangler secret put HEALTH_URL
# paste: https://alabproperty.com/api/health
```

### 6. Deploy

```bash
wrangler deploy
```

Output should end with something like:

```
✨ Success! Deployed alab-health-monitor
   Triggers:
   - Schedule: * * * * *
```

Worker is now live. First execution within 60 seconds.

### 7. Test it actually works

Verify the worker can reach the site and send Telegram by simulating a "down":

```bash
# Force a "down" by pointing to a non-existent URL
wrangler secret put HEALTH_URL
# paste: https://alabproperty.com/this-does-not-exist
```

Wait ~1 minute → you should get a Telegram message:

> 🚨 **SITE DOWN**
> Transition: `up` → `down`
> HTTP: 404
> ...

Then restore:

```bash
wrangler secret put HEALTH_URL
# paste: https://alabproperty.com/api/health
```

Wait ~1 minute → you should get a recovery message:

> ✅ **SITE RECOVERED**
> Transition: `down` → `up`
> HTTP: 200
> ...

If both fire — monitor is working. Done.

---

## How the alert logic works

Worker fires every minute. Each run:
1. Hits `HEALTH_URL` with a 10s timeout.
2. Computes current state: `up` (200 + status:ok), `degraded` (200 + status:degraded), or `down` (timeout / non-200 / fetch error).
3. Compares with KV-stored `lastStatus`.
4. **Sends Telegram ONLY when state changes.** No spam.
5. Saves new `lastStatus` to KV.

So you get:
- One alert when site goes from `up` → `down`
- One alert when site goes from `down` → `up`
- One alert when transitioning to/from `degraded` (Supabase down but Next alive)

If Cloudflare's edge itself dies, you get neither alert — but that's astronomical.

---

## Tweaks

### Less frequent (5-min checks)

Edit `wrangler.jsonc`:
```jsonc
"crons": ["*/5 * * * *"]
```
Re-deploy: `wrangler deploy`.

### Multiple recipients

For now we send to one `TG_CHAT_ID`. To send to multiple — either change
`TG_CHAT_ID` to a comma-separated list and split in worker, or create a
Telegram **group**, add the bot to it, and use the group's chat_id.

### Alert on slow response

Currently only fires on HTTP errors. To also alert on `tookMs > 5000`, edit
`worker.js` — add a `slow` state similar to `degraded`. Skipped by default
because Vercel cold-starts are occasionally slow without anything being wrong.

### Recovery silence

If you don't want recovery messages (`up` after `down`), wrap the `sendTelegram`
call:
```js
if (current !== last && current !== 'up') {
  // …
}
```

---

## Where things live

- `worker.js` — the Worker code (this is what runs every minute on CF edge)
- `wrangler.jsonc` — Cloudflare deploy config (binding + cron + name)
- `README.md` — you're reading it

No build step needed. `wrangler deploy` reads `worker.js` directly.

---

## Troubleshooting

**"Authentication error" on `wrangler deploy`**
→ Run `wrangler login` again. Token can expire.

**Worker deployed but no Telegram messages**
→ First check that the SITE IS ACTUALLY UP. Worker only sends on transition.
→ Check Cloudflare Dashboard → Workers → `alab-health-monitor` → Logs to see
   what `console.error` printed.
→ Re-verify each secret: `wrangler secret list`.

**"KV namespace not found"**
→ You skipped step 4. Run `wrangler kv namespace create "STATE"` and paste
   the id into `wrangler.jsonc`.

**Constant spam every minute**
→ KV write probably failing. Check `wrangler kv namespace list`, confirm the
   id in `wrangler.jsonc` matches.
