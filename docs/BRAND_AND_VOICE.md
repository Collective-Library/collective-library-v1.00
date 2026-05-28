# Brand & Voice — Collective Library

> Read this **before** writing any user-facing copy, designing any new surface, or proposing a color/type change. It consolidates rules that previously lived across `globals.css`, `docs/AUDIT.md` Lens 3, and `docs/STATE.md`.

Collective Library has a deliberate look and a deliberate voice. Both come from the same place: a warm, literate, community-first brand that does not want to feel like a generic startup product or a Goodreads clone.

The design system is **Notion warm-neutral grammar pushed warmer toward parchment**, with **Airbnb marketplace patterns** for cards and CTAs.

The voice is **mixed Indonesian + English, founder-first, Jaksel-friendly, never corporate**.

---

## 1. Visual identity

### Color tokens (source: `app/globals.css` `@theme`)

| Token                     | Hex                    | Purpose                                            |
| ------------------------- | ---------------------- | -------------------------------------------------- |
| `--color-ink`             | `#3D2E1F`              | Logo brown — primary brand voltage. Used scarcely. |
| `--color-ink-soft`        | `#5A4632`              | Secondary text                                     |
| `--color-muted`           | `#8B7355`              | Tertiary text, captions                            |
| `--color-muted-soft`      | `#B5A188`              | Placeholder, disabled                              |
| `--color-parchment`       | `#F0E8D8`              | Page canvas — warm cream                           |
| `--color-cream`           | `#F9F4E8`              | Section alternation                                |
| `--color-paper`           | `#FFFFFF`              | Card surface                                       |
| `--color-hairline`        | `rgb(61 46 31 / 0.10)` | Whisper borders (ink at low opacity)               |
| `--color-hairline-soft`   | `rgb(61 46 31 / 0.06)` | Even softer separators                             |
| `--color-hairline-strong` | `rgb(61 46 31 / 0.20)` | Borders that need to read                          |

### Status pill colors

| Status        | Fg / Bg                                     |
| ------------- | ------------------------------------------- |
| `sell`        | `#C2410C` / `#FDEDD8` (warmed orange)       |
| `lend`        | `#166534` / `#DCEFE0` (warmed forest green) |
| `trade`       | `#6D28D9` / `#EDE5FB` (deep violet)         |
| `wanted`      | `#B45309` / `#FCEFD3` (amber)               |
| `unavailable` | `#8B7355` / `#EFE8DA` (muted)               |

### Mastermind / OKR pill colors

| State      | Fg / Bg               |
| ---------- | --------------------- |
| `on-track` | `#166534` / `#DCEFE0` |
| `at-risk`  | `#B45309` / `#FCEFD3` |
| `behind`   | `#B91C1C` / `#FBE3E1` |
| `done`     | `#5A4632` / `#EFE8DA` |

### Typography

| Family             | Use                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `DM Serif Display` | The editorial / bookish voice. **One loud moment per page** — usually the hero headline. Weight 400 only. |
| `DM Sans`          | Everything else (400 / 500 / 600 / 700)                                                                   |
| `JetBrains Mono`   | Code, IDs, dev surfaces                                                                                   |

The type scale lives in `globals.css` as `--text-display-hero`, `--text-display-xl`, `--text-display-lg`, `--text-display-md`, `--text-title-lg`, `--text-title-md`, `--text-title-sm`, `--text-body-lg`, `--text-body`, `--text-body-sm`, `--text-caption`, `--text-badge`. Use the existing token — do not invent new sizes.

### Component grammar

- **Photo-first cards** (BookCard, MemberCard, EventCard) — cover image leads; metadata is secondary.
- **Pill search and pill filters** — rounded-full, ink-on-cream when active, muted when idle.
- **Whisper borders** — `--color-hairline` is the default border; almost never use a strong line.
- **Sticky bottom CTAs** on mobile — `safe-bottom` aware.
- **Notion-grade shadows** — multi-layer, very low opacity. See `--shadow-card`, `--shadow-card-hover`, `--shadow-modal`.

### Animation grammar

- `pop-fade-down` 180ms — dropdowns, popovers, TopBar search
- `sheet-slide-up` 280ms — mobile filter sheets, bottom drawers
- `overlay-fade-in` 200ms — modal backdrops
- `drawer-slide-in-left` 240ms — hamburger nav

Reach for these existing animations before inventing new ones.

---

## 2. Voice register

Collective Library is built by Cole (Initiator of Journey Perintis & Collective Library) for a community that lives partly in WhatsApp, partly in Instagram, partly in Discord, partly in Semarang cafes. The voice has to feel like Cole — not like a startup landing page.

### Mixed Indonesian + English

We do not pick one. Indonesian carries warmth, casualness, and in-group recognition. English carries technical precision and brand modernity. **Both belong** in the same product.

- **Headings and category labels**: usually English (Library, Activity, Events, Members, Map, Spots).
- **Conversational copy and empty states**: usually Indonesian, often Jaksel-flavored ("Lagi rame apa?", "Tambahin buku pertama lo", "Belum ada yang gabung").
- **Founder narrative on the landing page**: Indonesian-led, English where it lands more cleanly.
- **Error messages and form validation**: short, direct, mostly Indonesian.

The mix should feel intentional and confident, not accidental. When in doubt, write the Indonesian version first and translate only labels that need universal recognition.

### Founder-first

The product exists because Cole built it for a real community. The landing copy, the about page, and the manifest surface should sound like one person talking — not a marketing team.

- Reference the founder by first name where it fits ("Cole, Initiator Journey Perintis").
- Link the founder's IG (`@nikolaswidad_`) where credibility matters.
- Avoid "we" when "I" is honest. Avoid "we" when "you" is more direct.

### Tribe-filtered

Per `docs/AUDIT.md` Lens 3, the brand has to filter. Generic copy fails. We want readers, lenders, organizers, contributors who care about **distributed knowledge, local trust, and quiet community** — and we should make that obvious in copy so the wrong audience self-selects out.

Example reframings:

- ❌ "Where books connect people" (generic, could be Goodreads-Indo)
- ✅ "Ini bukan app pinjam buku. Ini radar buat nemuin orang, buku, tempat, dan obrolan yang harusnya lo temuin lebih awal."

Or for the more formal English register:

- ❌ "A community-driven book sharing platform"
- ✅ "Infrastructure for local knowledge networks that already exist but are invisible."

### Permission, not interruption

Borrowing Seth Godin's framing. Discord, Instagram, WhatsApp deep links should feel like an invitation, not a CTA pop-up. Avoid intrusive overlays, exit-intent modals, push notifications. Login nudges (the existing `<LoginNudgeModal>`) should feel like "hey, gabung dulu yuk biar bisa connect" — never "register now to unlock."

---

## 3. Copy rules

### No em dash in user-facing copy

Em dashes (`—`) read as ChatGPT/AI tone in 2026. They are also visually heavy on parchment. In user-facing UI copy:

- Use commas, periods, or new lines instead.
- Reserve em dashes for dev-facing docs, code comments, and editorial long-form (manifest body, AUDIT.md, this doc).
- Exception: where the em dash is unavoidable for clarity in display headings, prefer two regular dashes (`--`) or a colon.

### No fake personalization

- If the user has no city set, do not invent one ("Pembaca di Indonesia" beats faking "Pembaca di Jakarta").
- If activity is empty, do not show a sample row labeled "example" — show a warm empty state with a real CTA.
- If a card cannot find data, hide the card or show an opt-in message ("Aktifin lokasi di profil lo biar muncul di peta").

### Empty-state copy patterns

Pattern: **warm acknowledgment + small invitation + clear next step**.

Examples:

> Belum ada activity yang rame.
> Mulai dari satu sinyal kecil: tambah buku, cari buku, RSVP event, atau tulis manifest.

> Belum ada event mingguan ini.
> Lo bisa jadi yang pertama bikin — `+ Bikin event`.

> Belum ada Spot di kota lo.
> Kasih tau kita lewat feedback, atau usulin Spot baru lewat host event-mu.

Avoid: "No data," "Nothing here yet," "Sorry, nothing found."

### Status pill copy

- `Dijual`, `Dipinjamkan`, `Ditukar`, `Belum tersedia` (Indonesian for member-facing book status)
- `Open`, `Fulfilled`, `Closed` (English for wanted requests, since admin-facing)
- `Pending`, `Approved`, `Rejected` (English for manifest moderation, admin-facing)

### CTA copy

- Primary CTAs use action verbs in Indonesian where the user is mid-flow (`+ Tambah buku`, `RSVP`, `Kirim manifest`).
- Secondary CTAs use English when the action is structural (`See all`, `Edit`, `Cancel`).
- Avoid double-CTA pages where the action is unclear. One primary, one secondary, max.

### Person and tense

- Second person (`lo`, `you`) where direct address feels warm.
- First-person plural (`kita`) when the community is the subject.
- Avoid "users" — say "anggota" or "pembaca" or just "orang."

---

## 4. Voice examples (good vs. avoid)

### Landing hero

**Avoid:**

> Where books connect people. Discover, share, and lend books with your community.

**Good:**

> Ini bukan app pinjam buku.
> Ini radar buat nemuin orang, buku, tempat, dan obrolan yang harusnya lo temuin lebih awal.

### Authed home greeting

**Avoid:**

> Welcome back, {name}. Here is your dashboard.

**Good:**

> Halo, {firstName}.
> Lagi rame apa di knowledge network lo?

### Onboarding first-contribution

**Avoid:**

> Onboarding complete! Now add your first book to get started.

**Good:**

> Profile lo udah jadi.
> Mau mulai dari mana?
> [Add 1 buku] [Cari buku] [RSVP event] [Tulis manifest]

### Activity row

**Avoid:**

> User Nadia added a book.

**Good:**

> Nadia nambah _Lima Karya Pramoedya_. Bisa dipinjam, di Jakarta Selatan.

### Empty members directory

**Avoid:**

> No members found.

**Good:**

> Belum ada yang muncul di filter ini.
> Coba kecamatan lain, atau intent yang lebih luas.

---

## 5. When to break the rules

The voice is a starting point, not a constraint. Break the rules when:

- A safety / privacy / legal copy needs precision (use plain English, even if it sounds clinical).
- An admin-facing surface needs scannable English labels.
- A long-form manifest carries the author's own voice — that wins over any house style.

When in doubt, ask: **does this sound like Cole on a good day talking to a friend in the JP community?** If yes, ship. If no, rewrite.

---

## 6. Cross-references

- `app/globals.css` — token source of truth
- `docs/BUSINESS_PROCESS.md` — what the surfaces do (vocabulary alignment)
- `docs/AUDIT.md` Lens 3 — historical voice findings (Seth Godin lens)
- `docs/PROJECT_VISION.md` — the why

---

**Last updated:** 2026-05-28 (Slice 1 of the ecosystem alignment initiative).
