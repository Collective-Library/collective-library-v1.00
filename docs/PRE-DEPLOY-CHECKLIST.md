# Pre-deploy Checklist (P0)

Code-side P0 udah selesai (privacy fix, image domains, Sentry SDK, hCaptcha
component, password min 8). Sisa P0 yang **lo harus klik sendiri di dashboard**:

---

## 1. Run privacy migration in Supabase

Open **Supabase Dashboard → SQL Editor → New query** and paste the entire
contents of `supabase/migrations/0002_profiles_public.sql`. Click Run.

After running, verify:

```sql
-- Check the view exists
select * from public.profiles_public limit 3;

-- Check the policy is right
select polname, polcmd from pg_policy
where polrelid = 'public.profiles'::regclass;
```

You should see:
- `profiles_public` returns rows with `whatsapp = null` for everyone except
  yourself (or anyone with `whatsapp_public = true`)
- `profiles` policies include `profiles_select_own` (and not the old `profiles_select_all`)

---

## 2. Re-enable email confirmation + setup SMTP

**Why:** without email confirmation, anyone can register with someone else's
email and impersonate. Default Supabase SMTP is rate-limited (~3 emails/hour)
and goes to spam — not viable for real users.

**Steps:**

1. Sign up at **https://resend.com** (free tier: 3000 emails/month, 100/day,
   no credit card)
2. Resend → Domains → Add domain `collectivelibrary.id` (or whatever your
   prod domain is) → follow DNS verification
3. Resend → API Keys → create one → copy
4. **Supabase Dashboard → Authentication → Email Templates** — customize
   "Confirm signup" subject and body to feel like Collective Library, not generic
   Supabase
5. **Supabase Dashboard → Authentication → SMTP Settings**:
   - Enable Custom SMTP
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: your Resend API key
   - Sender email: `noreply@collectivelibrary.id`
   - Sender name: `Collective Library`
6. **Authentication → Sign In / Providers → Email** → toggle **"Confirm email"
   ON**
7. Test: register a fresh account. Should get a real-looking email within 30s.

---

## 3. Enable hCaptcha (optional but recommended)

**Why:** without bot protection, scammers can mass-register accounts to spam
the WTB feed or harvest WhatsApp numbers.

**Steps:**

1. Sign up at **https://www.hcaptcha.com** (free)
2. Dashboard → Sites → New Site → site key + secret key generated
3. Paste in `.env.local`:
   ```
   NEXT_PUBLIC_HCAPTCHA_SITEKEY=<your sitekey>
   ```
   (and add to Vercel env vars when deployed)
4. **Supabase Dashboard → Authentication → Bot and Abuse Protection** →
   enable **hCaptcha** → paste **secret key**
5. The widget will appear on `/auth/register` only when sitekey is set. Test:
   try register without solving captcha → should error.

---

## 4. Setup Sentry (recommended)

**Why:** when a user gets a crash on prod, you need to know about it. Without
Sentry you'll only find out via Twitter complaint.

**Steps:**

1. Sign up at **https://sentry.io** (free tier: 5k errors/month)
2. Create project: platform "Next.js"
3. Copy the **DSN** (looks like `https://xxx@o123.ingest.sentry.io/456`)
4. Add to `.env.local`:
   ```
   SENTRY_DSN=<dsn>
   NEXT_PUBLIC_SENTRY_DSN=<same dsn>
   ```
5. (Same on Vercel env vars at deploy)
6. To test: cause an error (e.g. throw in a server action). Check Sentry
   Issues tab in 30s.

---

## 5. Seed minimum 30 books

**Why (Thiel):** "A full shelf on day one beats a perfect empty app."
First user to land on `/shelf` should see life. 14 isn't enough; aim for 30+.

**Three ways, easiest first:**

### A. Goodreads import (fastest)
If you or Cole has a Goodreads account:
1. Go to **https://www.goodreads.com/review/import** → Export Library
2. Wait, download the CSV
3. In Collective Library: avatar dropdown → **Import dari Goodreads**
4. Upload, pick which to keep, click Import. Hundreds of books in ~30 sec.

### B. Search-and-pick (~5 sec per book)
1. `/book/add` → type 2-3 words in the picker (now backed by Open Library,
   no quota issue)
2. Click result, set status, "Simpan cepat"
3. Repeat 30 times. ~3 minutes total.

### C. Bulk seed via script (for known list)
Edit `scripts/seed-nikolas.mjs`, change `TARGET_EMAIL` and the `BOOKS` array,
re-run. Idempotent — re-running deletes prior `goodreads_import` rows and
re-inserts.

---

## After all 5 done

You're P0-clean. Run `npm run build` once more to confirm. Then **Sprint E
(Vercel deploy)**:

1. Push to GitHub: `git init && git add . && git commit -m "init" && git push`
2. **Vercel Dashboard → Add New Project → Import Repo**
3. Vercel auto-detects Next.js. Set environment variables (copy all from
   `.env.local`). **Don't** set `NEXT_PUBLIC_APP_URL` — Vercel injects
   `VERCEL_URL` automatically.
4. Click Deploy. ~2 minutes.
5. Vercel gives you `<something>.vercel.app`. Test signup + add book + WTB +
   contact flow on the live URL.
6. **Custom domain**: Vercel → Domains → add `collectivelibrary.id`. Configure
   DNS at your registrar (Vercel shows the records).
7. Back in Supabase → Authentication → URL Configuration → set Site URL to
   `https://collectivelibrary.id` and add same to Redirect URLs (otherwise
   email confirmation links break).

You're live.
