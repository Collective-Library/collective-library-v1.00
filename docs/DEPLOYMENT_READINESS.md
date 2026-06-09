# Deployment Readiness

**Branch:** `staging`
**Commit:** `8722631`
**Date:** 2026-05-29

---

## Release status

This branch is ready for Vercel Preview QA.
Production merge is allowed only after the checklist below passes.

Feature scope complete:

- `/home` ecosystem cockpit with live signals
- Navigation alignment (shared `nav-config.ts`, desktop nav 5 surfaces)
- `/shelf` focused on books only
- First-contribution onboarding (`/onboarding/first-contribution`)
- Manifest autobase mode (direct publish, no admin pre-approval)
- Discord `MANIFEST_POSTED` fan-out via webhook
- Event X intent-only share button (host/admin)
- Mastermind distribution queue panel
- Public landing ecosystem loop explainer
- Em dash cleanup in `app/page.tsx`

---

## Required migration

| File                                                  | Status                                              |
| ----------------------------------------------------- | --------------------------------------------------- |
| `supabase/migrations/0026_manifest_autobase_mode.sql` | Applied manually by founder via Supabase SQL Editor |

**What it does:**

- Changes `manifests.status` default from `'pending'` to `'approved'`
- Changes `manifests.approved_at` default to `now()`
- Updates `emit_manifest_posted()` trigger to fire on `INSERT OR UPDATE`
  (previously `UPDATE` only — auto-approved inserts would silently skip `activity_log`)
- Updates author-edit RLS policy to allow editing own non-hidden, non-rejected manifests

**Risk if not applied on target Supabase project:**
Manifests will insert with `status = 'pending'` (old DB default). The trigger will not fire on
insert, so `MANIFEST_POSTED` activity and Discord embed will not emit for new manifests until an
admin manually approves them. The rest of the app continues to work.

**Action required before production:**
If deploying to a different Supabase project than where 0026 was already applied, run
`supabase/migrations/0026_manifest_autobase_mode.sql` in that project's SQL editor first.

---

## Critical QA checklist

Run on Vercel Preview before merging to production.

- [ ] **1.** Public landing (`/`) loads — hero, EcosystemLoopExplainer, strips all render.
- [ ] **2.** Login lands on `/home` (not `/shelf`).
- [ ] **3.** `/home` cockpit renders live cards — My Library, Members, Events, Activity, Map, Wanted, Manifest, Spots.
- [ ] **4.** `/shelf` is focused on books — status filter, search, pagination. No events/activity widget on page 1.
- [ ] **5.** Complete new registration → onboarding → first-contribution prompt appears.
- [ ] **6.** Submit manifest as regular member → toast "Manifest lo udah tayang." → redirect to `/manifest/<id>` — manifest visible immediately, no pending banner.
- [ ] **7.** Manifest appears in `/manifest` list.
- [ ] **8.** Manifest appears in `/aktivitas` feed as `MANIFEST_POSTED` entry.
- [ ] **9.** `GET /feed.xml` returns 200 with valid RSS.
- [ ] **10.** `GET /feed.json` returns 200 with valid JSON Feed.
- [ ] **11.** (If `DISCORD_COMMUNITY_WEBHOOK_URL` configured) Discord embed appears with body preview, topic, and "Baca →" link after manifest submit.
- [ ] **12.** On `/manifest/<id>` as author — `ManifestXTemplate` visible (copy text + Buka di X + paste-back URL).
- [ ] **13.** On `/event/<id>` as host or admin — "Share ke X" button visible, opens X compose URL.
- [ ] **14.** `/mastermind` distribution queue panel renders for admin — shows manifests + events not yet X-shared.
- [ ] **15.** Desktop nav shows 5 primary surfaces. Mobile bottom nav shows correct set. Active states highlight correctly.
- [ ] **16.** Admin can retroactively reject an approved manifest via `/admin/manifests`.

---

## Known non-blockers

- **Two pre-existing em dashes remain outside `app/page.tsx`:**
  - `RecentManifestsStrip` — quote attribution dash (`— Nikolas Widad` below a manifest excerpt). Semantically appropriate for the context.
  - `Footer` — "Bukan startup, bukan platform iklan — cuma infra biar rak kolektif…"
  - Neither is a deploy blocker. Can be cleaned in a future copy polish pass.

---

## Release gate

Merge to production is safe only when **all** of the following are true:

- [ ] `npm run lint` — exit 0, 0 errors
- [ ] `npx tsc --noEmit` — exit 0
- [ ] Vercel Preview build passes (no build error in Vercel dashboard)
- [ ] All 16 QA checklist items above pass
- [ ] Migration `0026_manifest_autobase_mode.sql` confirmed applied on the production Supabase project
- [ ] No P0 or P1 issue found during QA

---

## Recommended deploy steps

```bash
# 1. Confirm branch and commit
git log --oneline -3

# 2. Final lint + tsc (should already pass from pre-commit hook)
npm run lint
npx tsc --noEmit

# 3. Vercel Preview is already triggered by the push to staging.
#    Check: https://vercel.com/dashboard → Deployments → staging branch

# 4. Run QA checklist against the Vercel Preview URL.

# 5. When checklist passes, merge to main:
git checkout main
git merge staging --no-ff -m "release: ecosystem alignment + manifest autobase (staging 8722631)"
git push origin main

# 6. Monitor Vercel production build.
```
