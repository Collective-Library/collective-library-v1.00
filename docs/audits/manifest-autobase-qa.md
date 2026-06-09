# Manifest Autobase Mode — QA Audit

**Slice 8B · 2026-05-28**

Migration `0026_manifest_autobase_mode.sql` applied. This doc records the
end-to-end code path verification for Manifest Autobase Mode (Slice 8A).

---

## What migration 0026 changes

| Before                                                      | After                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `manifests.status` default: `'pending'`                     | Default: `'approved'`                                                                 |
| `manifests.approved_at` default: `null`                     | Default: `now()`                                                                      |
| Trigger `trg_manifest_posted`: `AFTER UPDATE` only          | `AFTER INSERT OR UPDATE`                                                              |
| Activity fires when: admin transitions `pending → approved` | Activity fires when: insert with `status='approved'` OR admin approves legacy pending |
| Author-edit policy: locked to `status='pending'` rows       | Allowed on own non-hidden, non-rejected manifests                                     |

---

## Files verified

| File                                                  | Check                                                                                       | Status |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------ |
| `supabase/migrations/0026_manifest_autobase_mode.sql` | Column defaults, trigger INSERT OR UPDATE, author-edit policy                               | ✅     |
| `lib/manifests.ts:createManifest`                     | Sets `status: "approved"`, `approved_at: now`                                               | ✅     |
| `components/manifest/manifest-form.tsx`               | Client insert sets `status: "approved"`, `approved_at: now`                                 | ✅     |
| `components/manifest/manifest-form.tsx` copy          | No "pending approval" / "admin review" language                                             | ✅     |
| `app/(app)/manifest/page.tsx` copy                    | Removed "Setelah di-approve admin"                                                          | ✅     |
| `app/(app)/manifest/[id]/page.tsx` copy               | Pending banner: removed "nunggiin approval admin"                                           | ✅     |
| `app/admin/manifests/page.tsx`                        | Retroactive moderation inbox: pending + recent public sections                              | ✅     |
| `components/manifest/manifest-moderation-row.tsx`     | PUBLIK badge + "Reject retroaktif" for approved; Approve+Reject for pending                 | ✅     |
| `app/api/discord-webhook/route.ts`                    | `MANIFEST_POSTED` in `TYPE_COPY`, payload has `manifest_id`, `buildEmbed` case              | ✅     |
| `lib/activity.ts`                                     | `MANIFEST_POSTED` in `ActivityType` union; `ActivityManifest` interface; manifest in SELECT | ✅     |
| `components/activity/activity-copy.ts`                | `activityVerb` handles `MANIFEST_POSTED`; `activityTargetUrl` returns `/manifest/[id]`      | ✅     |
| `components/activity/activity-feed-list.tsx`          | Manifest card renders at lines 188-201; links to `/manifest/[id]`                           | ✅     |
| `app/feed.xml/route.ts`                               | `item.manifest` body in `<description>`; link resolves to `/manifest/[id]`                  | ✅     |
| `app/feed.json/route.ts`                              | `item.manifest` body in `summary`; `url` resolves to `/manifest/[id]`                       | ✅     |

---

## Signal loop — verified code path

```
User submits /manifest/new
  └── manifest-form.tsx (client)
        └── supabase.from("manifests").insert({ status: "approved", approved_at: now, ... })
              └── DB trigger trg_manifest_posted fires (INSERT path in 0026)
                    └── activity_log INSERT: type=MANIFEST_POSTED, manifest_id=<id>
                          ├── Supabase DB Webhook → /api/discord-webhook
                          │     └── buildEmbed MANIFEST_POSTED → Discord embed
                          ├── /aktivitas → ActivityFeedList renders manifest card
                          ├── /feed.xml → RSS item with body preview + manifest link
                          └── /feed.json → JSON item with body summary + manifest link
```

**X share:** `/manifest/[id]` shows `ManifestXTemplate` for author + admin on approved
manifests (unchanged — copy template + open intent + paste-back URL).

---

## Visibility edge cases

| Scenario                               | Activity                                           | Discord    | Public feed  | /manifest list |
| -------------------------------------- | -------------------------------------------------- | ---------- | ------------ | -------------- |
| `visibility = 'public'` + approved     | ✅ emits                                           | ✅ fan-out | ✅ visible   | ✅ visible     |
| `visibility = 'community'` + approved  | ✗ no emit (trigger checks `visibility = 'public'`) | ✗ not sent | ✗ not listed | ✗ not listed   |
| `is_hidden = true`                     | ✗ no emit (trigger checks `is_hidden = false`)     | ✗ not sent | ✗ not listed | ✗ not listed   |
| Legacy `status = 'pending'` (old rows) | ✗ no emit                                          | ✗          | ✗            | ✗              |

Community manifests are visible only to the author + admins (per RLS). This is
pre-existing behavior unchanged by 0026.

---

## Known gaps (pre-existing, out of scope)

1. **Anonymous manifests in activity feed:** `activity_log.actor_user_id` is
   always set (even for anonymous manifests), so the activity feed and RSS
   both display the real actor name for `is_anonymous = true` manifests.
   The `is_anonymous` masking only applies on the manifest detail page and
   list page. This is a pre-existing design limitation — fix requires either
   filtering anonymous manifests from the activity log at trigger time, or
   enriching the activity feed render with `is_anonymous` checks. Deferred.

2. **Compact ActivityFeed widget (activity-feed.tsx):** Shows manifest rows as
   actor + verb text only — no body preview card. Full preview is in
   `ActivityFeedList` on `/aktivitas`. Acceptable UX for the compact widget.

3. **`visibility = 'community'` RLS:** Community manifests are visible to
   author + admin only, not to all community members. The RLS policy lacks a
   `community_id`-based membership check. Pre-existing; deferred to a future
   slice when community access patterns are clearer.

---

## Fixes applied in Slice 8B

| File                                         | Fix                                              |
| -------------------------------------------- | ------------------------------------------------ |
| `components/activity/activity-feed-list.tsx` | Updated stale JSDoc to list all 7 activity types |

No other code changes needed.

---

## Lint / tsc / feed smoke

| Check              | Result                                        |
| ------------------ | --------------------------------------------- |
| `npm run lint`     | exit 0 — 0 errors, pre-existing warnings only |
| `npx tsc --noEmit` | exit 0                                        |
| `GET /feed.xml`    | 200 ✓                                         |
| `GET /feed.json`   | 200 ✓                                         |

---

## Manual Vercel Preview QA checklist

Run after deploying the Slice 8A/8B changes + migration 0026 to Vercel Preview.

- [ ] **1.** Sign in as a regular member (not admin).
- [ ] **2.** Navigate to `/manifest/new`.
- [ ] **3.** Write a manifest body (min 10 chars), optionally set mood + topic.
- [ ] **4.** Click "Kirim manifest" — confirm toast says **"Manifest lo udah tayang."** (not "nungguin approval admin").
- [ ] **5.** Confirm redirect to `/manifest/<id>` — manifest visible immediately, **no pending banner**.
- [ ] **6.** Navigate to `/manifest` — confirm manifest appears in the list.
- [ ] **7.** Navigate to `/aktivitas` — confirm `MANIFEST_POSTED` entry appears in today's bucket.
- [ ] **8.** Click the manifest card in activity feed — confirm it links to `/manifest/<id>`.
- [ ] **9.** Check `/feed.xml` — manifest body should appear in an `<item>` description.
- [ ] **10.** Check `/feed.json` — manifest body should appear in an item `summary`.
- [ ] **11.** (If `DISCORD_COMMUNITY_WEBHOOK_URL` configured) Confirm Discord embed appears in channel: actor name, body preview, "Baca →" link.
- [ ] **12.** On `/manifest/<id>`, confirm `ManifestXTemplate` visible as author (Copy text + Buka di X + paste-back URL for admin).
- [ ] **13.** Sign in as admin. Navigate to `/admin/manifests` — confirm "Moderasi manifest" heading, "Manifest terbaru" section with PUBLIK badges, "Reject retroaktif" button.
- [ ] **14.** As admin, click "Reject retroaktif" on a manifest, provide note, confirm. Navigate to `/manifest` — confirm manifest disappears from public list.
- [ ] **15.** (Optional) Submit a manifest with `visibility = "community"` — confirm it does NOT appear on `/manifest` list, `/aktivitas`, or Discord.

---

## Recommendation

**Safe to proceed to Slice 8 (landing copy polish + ecosystem loop explainer).**

All critical paths in the Manifest signal loop are verified:

- Insert → activity_log ✅
- activity_log → Discord ✅
- activity_log → /aktivitas UI ✅
- activity_log → /feed.xml + /feed.json ✅
- X share (manual, intent-only) ✅
- Admin retroactive moderation ✅

The only prerequisite before going live: run migration `0026_manifest_autobase_mode.sql`
on the production Supabase project (apply in SQL editor or via `supabase db push`).
