# Deploying War Room — Step by Step

This guide takes you from these files to a live URL you can share with your client.
No prior deployment experience needed. Budget about 15 minutes.

---

## What you're building

Two pieces working together:

- **Frontend** (`public/index.html`) — the War Room interface your client sees.
- **Backend** (`api/analyze.js`) — a small serverless function that holds YOUR
  Anthropic API key as a server-side secret and makes the actual API calls.

Your client's browser talks to your backend; your backend talks to Anthropic.
The key never reaches the browser, and the app works for anyone who opens the link.

---

## Step 1 — Get an Anthropic API key

This is different from your Claude.ai subscription. It's a developer key that
bills for API usage (you only pay for what the app actually uses).

1. Go to <https://console.anthropic.com>
2. Sign up / log in.
3. Add a payment method under **Billing** (and set a monthly spend limit so there
   are no surprises — start with something like $10–20).
4. Go to **API Keys** → **Create Key**. Copy it. It starts with `sk-ant-...`
5. Keep it somewhere safe and private for Step 4. Treat it like a password.

---

## Step 2 — Put these files on GitHub

Vercel deploys from a GitHub repository.

1. Create a free account at <https://github.com> if you don't have one.
2. Click **New repository**. Name it (e.g. `war-room`). Keep it **Private**. Create it.
3. The easiest upload path with no command line:
   - On the new empty repo page, click **uploading an existing file**.
   - Drag in the entire contents of this `war-room-app` folder, keeping the
     structure intact: the `api/` folder, the `public/` folder, `vercel.json`,
     `package.json`, and `.gitignore`.
   - Click **Commit changes**.

Your repo should look like this:

```
war-room/
├── api/
│   └── analyze.js
├── public/
│   └── index.html
├── vercel.json
├── package.json
└── .gitignore
```

---

## Step 3 — Connect Vercel to the repo

1. Go to <https://vercel.com> and sign up with your GitHub account (free Hobby plan).
2. Click **Add New → Project**.
3. Find your `war-room` repo and click **Import**.
4. Leave the build settings as their defaults — `vercel.json` already configures
   everything. Do NOT click Deploy yet; do Step 4 first (or you can add the key
   right after and redeploy).

---

## Step 4 — Add your API key as an environment variable

This is the step that keeps your key secure.

1. In the Vercel import screen (or later under **Project → Settings →
   Environment Variables**), add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** paste your `sk-ant-...` key from Step 1
   - Apply to **Production, Preview, and Development**.
2. Save.

The name must be exactly `ANTHROPIC_API_KEY` — the backend looks for that.

---

## Step 5 — Deploy

1. Click **Deploy**.
2. Wait ~1 minute. Vercel gives you a live URL like
   `https://war-room-xxxx.vercel.app`
3. Open it. Fill in a thesis, click **RUN MODULE**. You should see analysis stream in.

That URL is what you send your client. It works for them with no login and no key
on their side, because the key lives safely on your Vercel backend.

---

## If you added the key after the first deploy

Environment variables only take effect on a fresh deploy. Go to the **Deployments**
tab → click the most recent one → **⋯ → Redeploy**.

---

## Troubleshooting

**"Server is missing ANTHROPIC_API_KEY"** — the variable isn't set, the name is
misspelled, or you haven't redeployed since adding it. Recheck Step 4, then redeploy.

**"Anthropic API error 401"** — the key is wrong or was revoked. Generate a new one
in the Anthropic console and update the Vercel variable.

**"Anthropic API error 429"** — rate limit. The backend already retries automatically;
if it persists, you're sending requests too fast or your account tier is low. Wait a
moment, or raise limits in the Anthropic console.

**The page loads but buttons do nothing** — open the browser console (F12) and look
for errors. Most often the `api/` folder wasn't uploaded with the right structure.
Confirm `api/analyze.js` exists in your GitHub repo exactly as shown above.

---

## Cost note

You pay Anthropic for API usage per token, separate from any Claude.ai subscription.
A single full 5-module run is a small number of cents at current Sonnet pricing.
Set a spend cap in the Anthropic console for peace of mind. To check current pricing,
see <https://www.anthropic.com/pricing>.

---

## Locking it down later (optional)

A `.vercel.app` URL is public to anyone who has it. If you want to restrict access:

- Add a simple password gate in front of the app, or
- Use Vercel's password protection (a paid feature on Pro), or
- Add per-client access tokens your backend checks before calling Anthropic.

Ask and I can add any of these.
