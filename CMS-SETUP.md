# TooAmple CMS — Setup (one-time, ~5 minutes)

Your site now has a CMS at **tooample.com/admin** — the same system as regxvisuals.com/admin.
Edits you make there commit straight to your GitHub repo, and Cloudflare Pages redeploys
automatically (usually under a minute). No more editing code for everyday changes.

## What you can edit from /admin
- 🛒 **Store Products** — add/remove products, prices, discounts, covers, download links
- 🎓 **Physical Classes** — tuition, descriptions, curriculum chips, covers
- 🎬 **Videos** — YouTube IDs for the portfolio Videography tab and home page cards
- 📸 **Portfolio Gallery** — add/remove photos, captions, filter tags (upload images right in the CMS)
- ⚙️ **Site Settings** — WhatsApp number, emails, Instagram links, Academy intro video, showreel

## One-time setup

### 1. Fill in two lines in `admin/config.yml`
- `repo:` → your GitHub username/repo for this site (e.g. `dayo/tooample-site`)
- `base_url:` → your OAuth worker URL. **Copy it from regxvisuals**: open your regxvisuals
  repo → `admin/config.yml` → copy the `base_url` value (it looks like
  `https://something.workers.dev`).

### 2. Allow tooample.com on the OAuth worker
In Cloudflare dashboard → Workers → your auth worker → Settings → Variables:
- Find `ALLOWED_DOMAINS` and add `tooample.com,www.tooample.com` to the existing value
  (comma-separated). Save & deploy.

If the worker has no `ALLOWED_DOMAINS` variable, it allows all domains — nothing to do.

### 3. Push these files to GitHub, then open tooample.com/admin
Sign in with GitHub (same account that owns the repo). Done.

## Notes
- **Course titles** in 🎓 must exactly match the names in the apply form dropdown on
  academy.html — if you rename a course, tell Claude to update the dropdown too.
- **Gallery tags** must be from: beauty, fashion, editorial, portrait, studio, branding,
  boudoir (those are the filter buttons). A photo can have several tags.
- After publishing a change, Cloudflare deploys in ~30–60s. On your phone's installed app,
  close and reopen twice to pick it up.
- If /admin shows a config error, the `repo:` or `base_url:` line in admin/config.yml is
  wrong — that's always the first thing to check.
