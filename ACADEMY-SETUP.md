# Academy course gate — setup

Server-side password gate for the masterclass. Nothing under `/academy/` is
served without a valid signed cookie, so the videos and project files are not
reachable by guessing the URL.

## Files

```
course-login.html                 ← public login page
academy/index.html                ← the course page (gated)
functions/academy/_middleware.js  ← guards everything under /academy/
functions/api/course-login.js     ← verifies the access code
functions/api/course-me.js        ← serves the student's modules + Stream IDs
functions/api/course-logout.js    ← clears the session
lib/academy-auth.js               ← shared signing helpers (not a route)
```

Drop them into the repo root as they are, keeping the folder structure.

## 1. Environment variables

Cloudflare Pages → your project → **Settings → Variables and Secrets**.
Add these to **Production** (and Preview if you test there):

| Name | Value |
|---|---|
| `ACADEMY_SECRET` | A long random string. Generate with `openssl rand -base64 32`. Treat as a secret. |
| `ACADEMY_STUDENTS` | JSON, one entry per student — see below. |
| `STREAM_CUSTOMER_CODE` | Your Cloudflare Stream customer code. |

### `ACADEMY_STUDENTS` format

```json
{"NM-7F3A-K29B":{"name":"Nickel Massamba","email":"nickel@example.com","unlocked":["m1","m2","m3"]}}
```

- The **key is the access code** the student types in. Make it unguessable —
  initials plus two random blocks works well.
- `unlocked` lists which module ids that student can see. To release a new
  module to everyone, add its id to each student's array and redeploy.
- Adding a student = adding one entry. No database needed until you outgrow this.

### Finding your Stream customer code

Cloudflare dashboard → **Stream** → any video → **Embed**. The iframe URL looks
like `https://customer-a1b2c3d4e5.cloudflarestream.com/...` — the part after
`customer-` is the code.

## 2. Lock Stream to your domain

Stream → **Settings → Allowed Origins** → add `tooample.com`. Without this, a
leaked video URL plays anywhere. With it, the embed only works on your site.

## 3. Add each module as you record it

Open `functions/api/course-me.js` and edit the `MODULES` array near the top.
For each module:

- `video` — the Stream video UID (Stream → the video → **UID**). Leave as `''`
  until recorded; the page shows it as locked with the release date.
- `releases` — `YYYY-MM-DD`, shown to students while locked.
- `files` — project file downloads, e.g.
  `[{"label":"Module 3 — Resolve project","url":"https://..."}]`

Host project files anywhere that gives a direct link (R2, Dropbox, Drive). To
serve them from the gated area instead, drop them in `academy/files/` and link
as `/academy/files/m3-resolve.zip` — the middleware protects that path too.

## 4. Giving a student access

1. Add their entry to `ACADEMY_STUDENTS` and save.
2. Redeploy (Pages redeploys on variable change, or push any commit).
3. Email them the login URL and their code:
   `https://tooample.com/course-login.html`

Sessions last 30 days, then they sign in again with the same code. To revoke
someone, delete their entry and redeploy.

## 5. Check before you send a student the link

- Visit `https://tooample.com/academy/` in a private window → should bounce to login.
- Enter a wrong code → "That code was not recognised."
- Enter a real code → lands on the course page with the right name in the header.

## Notes

- `styles.css` is not linked from the course page, so it does not need a cache
  bump. If you later want the site header on it, add the stylesheet link and
  bump the version as usual.
- The service worker should not cache these paths. If you see a stale course
  page, confirm `/academy/` and `/api/` are excluded from the worker's cache
  rules.
- One code per student is deliberate — it means you can tell who shared a login,
  and revoke just that one.
