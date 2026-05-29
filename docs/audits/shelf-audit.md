# `/shelf` Audit — Slice 3B

> Read-only audit. Drives the focused edit in Slice 3B. Goal: turn `/shelf` from a hybrid home-dashboard-with-books into a focused books/library surface, without reducing discovery.

`/home` (built in Slice 3A) is now the ecosystem cockpit. `/shelf` should stop carrying that load and become an excellent books surface: browse, search, filter, see status, add, manage.

**Audited file.** `app/(app)/shelf/page.tsx` (227 lines). Imports: `listShelfBooks`, `getShelfCounts` from `lib/books`; `listActivity` from `lib/activity`; `getUpcomingEvents` from `lib/events`; `BookGrid`, `ShelfClientWrapper` from `components/books/*`; `ActivityFeed` from `components/activity/activity-feed`; `EventCard` from `components/events/event-card`; `ButtonLink` from `components/ui/button`; `STATUS_FILTER_OPTIONS` from `lib/status`.

---

## 1. Current `/shelf` responsibility

Today `/shelf` is two things:

- **Page 1 unfiltered (default landing):** acts as an _informal home dashboard_ — hero + Events strip + Activity widget + book stats + book grid + pagination.
- **Page 2+ or any filtered/searched view:** acts as a _focused books surface_ — hero + book stats + filtered grid + pagination. Events/Activity widgets are suppressed by the `showSidePanels` guard (line 31).

This split is intentional — the original implementation wanted unfiltered browsing to feel rich and filtered browsing to feel clean. Now that `/home` carries the ecosystem cockpit role, the split is no longer needed: `/shelf` can be the focused view on every page.

## 2. Widgets currently rendered (page 1 unfiltered)

| #   | Widget                                                      | Lines   | Source data                                              | Always or p1-only?                 |
| --- | ----------------------------------------------------------- | ------- | -------------------------------------------------------- | ---------------------------------- |
| 1   | Hero block (title, tagline, desktop "+ Tambah Buku" pill)   | 45–59   | static                                                   | **Always**                         |
| 2   | Upcoming Events strip (4 EventCards grid + "Lihat semua →") | 62–81   | `getUpcomingEvents(4)`                                   | **Page 1 only** (`showSidePanels`) |
| 3   | Activity feed widget (4 activity rows)                      | 84      | `listActivity(4)`                                        | **Page 1 only**                    |
| 4   | Stats bar (4 cells: Dijual / Dipinjam / Ditukar / Koleksi)  | 87–92   | `getShelfCounts()`                                       | **Always**                         |
| 5   | `ShelfClientWrapper` → filter pills + search input          | 96–109  | client state                                             | **Always**                         |
| 6   | `BookGrid` (24 books per page)                              | 97      | `listShelfBooks({ status, search, page, pageSize: 24 })` | **Always**                         |
| 7   | Pagination (prev/next + range counter)                      | 98–108  | computed from `total`                                    | **Always when `totalPages > 1`**   |
| 8   | Mobile add-CTA fallback                                     | 112–114 | static                                                   | **Always** (md- only)              |

## 3. Which widgets are page-1-only

- Upcoming Events strip (widget #2)
- Activity feed widget (widget #3)

Both gated by `showSidePanels = filter === "all" && !q && page === 1` (line 31).

## 4. Which widgets are pure book surface

- Hero block (#1)
- Stats bar (#4)
- ShelfClientWrapper / filter pills / search (#5)
- BookGrid (#6)
- Pagination (#7)
- Mobile add CTA (#8)

All of these stay.

## 5. Which widgets are ecosystem / discovery surface

- Upcoming Events strip (#2) — Events surface, already on `/home` (`HomeModuleCard label="Events"`) + UpcomingEvents landing strip + DesktopNav + HamburgerMenu Activity group + AvatarMenu.
- Activity feed widget (#3) — Activity surface, already on `/home` ("Lagi rame apa?" preview reusing the same `<ActivityFeed>` component) + dedicated `/activity` page + DesktopNav + HamburgerMenu + AvatarMenu + BottomNav Activity tab + RSS/JSON feeds.

Both have first-class representation on `/home` and elsewhere in nav. Removing them from `/shelf` does NOT silently drop a discovery surface.

## 6. What moves to `/home`

Nothing literally moves — `/home` already renders equivalent surfaces (Events module card + "Lagi rame apa?" activity preview built in Slice 3A). The audit confirms parity:

| `/shelf` widget being removed | `/home` equivalent                                                         |
| ----------------------------- | -------------------------------------------------------------------------- |
| Upcoming Events strip (top 4) | `HomeModuleCard label="Events"` + Events tab in DesktopNav + `/event` page |
| Activity feed widget (top 4)  | `HomeActivityPreview` ("Lagi rame apa?" — 6 rows, links to `/activity`)    |

## 7. What stays on `/shelf`

All six "pure book surface" widgets: hero, stats bar, ShelfClientWrapper (filter + search), BookGrid, Pagination, mobile add CTA.

## 8. What gets replaced by a small cross-link CTA

A slim, single-line banner card on page 1 only (same `filter=all && !q && page===1` condition that gated the side panels), pointing to `/home`. Copy:

> **Lihat yang lagi terjadi di komunitas**
> Activity, event, map, manifest, dan spots sekarang ada di Home.
> [ Buka Home → ]

Placement: between hero and stats bar. Visual treatment: cream background + hairline-soft border + ink pill button on the right. Subtle. Not feature-card prominence. Should read as _"oh, that stuff moved — one tap away"_, never as _"this is the home dashboard again"_.

The CTA does NOT appear on filtered views or page 2+, mirroring the previous `showSidePanels` semantics so filtered browsing stays uncluttered.

## 9. Risks

| Risk                                                                                                   | Likelihood | Mitigation                                                                                                     |
| ------------------------------------------------------------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------- |
| Users who navigated to `/shelf` for the activity widget find nothing                                   | Medium     | Cross-link CTA on p1 points to `/home`. BottomNav `Home` tab is one tap away. DesktopNav `Home` pill same.     |
| Users who navigated to `/shelf` to scan upcoming events lose that surface                              | Medium     | Same. Plus `/event` is also in DesktopNav, HamburgerMenu, AvatarMenu, and `/home` Events card.                 |
| The page-1 layout shifts noticeably (hero → was Events → was Activity → stats was much lower)          | Low        | Stats bar moves up. Acceptable shift; first-time visitors won't notice, returning users will see books faster. |
| Forgotten import of `listActivity` / `getUpcomingEvents` / `ActivityFeed` / `EventCard` breaks compile | Low        | Remove imports atomically with the JSX they served. TypeScript + lint catch unused imports.                    |
| `showSidePanels` variable becomes dead                                                                 | Low        | Rename to `showHomeCta` (same condition) so it now gates the cross-link CTA.                                   |
| Removing the inline Activity widget breaks something elsewhere that imports from `/shelf`              | None       | `/shelf` doesn't export anything; it's a page. No external callers.                                            |

## 10. Proposed exact edit list

In `app/(app)/shelf/page.tsx`:

1. **Remove imports** (lines 4, 5, 8, 9):
   - `listActivity` from `@/lib/activity`
   - `getUpcomingEvents` from `@/lib/events`
   - `ActivityFeed` from `@/components/activity/activity-feed`
   - `EventCard` from `@/components/events/event-card`
2. **Remove from `Promise.all`** (lines 32–39): the `activity` and `upcomingEvents` parallel fetches. Resulting tuple is `[{ books, total }, counts]`.
3. **Remove the JSX blocks**:
   - Upcoming Events strip (lines 62–81)
   - Activity feed widget (line 84)
4. **Rename `showSidePanels` → `showHomeCta`** (line 31). Same condition: `filter === "all" && !q && page === 1`.
5. **Insert new cross-link CTA** between hero and stats bar, gated by `showHomeCta`. Slim banner card — see §8 copy.

No other changes. Hero copy stays. Stats bar stays. Filter/search/grid/pagination stays. Mobile add CTA stays.

## Acceptance criteria for the edit

- `/shelf` p1 unfiltered: hero → small `Buka Home` CTA → stats bar → filter pills → book grid → pagination → mobile add CTA.
- `/shelf` p2+, filtered, or searched: hero → stats bar → filter pills → book grid → pagination → mobile add CTA. **No** Home CTA.
- All existing routes still work: `/shelf?status=lend`, `/shelf?page=2`, `/shelf?q=sapiens`, `/library` (rewrite), `/shelf/[anything]`.
- `npm run lint` + `npx tsc --noEmit` pass with no new warnings or errors.
- `/home` still renders identically (no shared state touched).
- Public landing `/` still renders identically.

---

**Last updated:** 2026-05-28 (Slice 3B audit, pre-edit). After the edit lands, the audit closes; no follow-up audit doc needed.
