# Pre-Launch Audit — Collective Library

Audit dilakukan terhadap state sebelum deploy publik. Tiga lensa, masing-masing
ditulis di voice-nya sendiri biar gak blur. Setiap finding diberi prioritas:

- **P0** = ship-blocker. Jangan deploy sebelum fix ini.
- **P1** = important. Harus selesai dalam 2 minggu pertama.
- **P2** = nice-to-have. Backlog.

---

## Lens 1 — Accenture (Production Readiness)

### Security

**P0 — Privacy bug: WhatsApp leak via direct REST query.**
RLS policy `profiles_select_all` adalah `using (true)`, jadi siapa pun yang
authenticated bisa hit `GET /rest/v1/profiles?select=whatsapp&id=eq.{user_id}`
dan dapat nomor HP user lain — terlepas dari `whatsapp_public = false`.
Frontend kita filter di `getContactLinks()`, tapi REST API gak. Untuk komunitas
yang inti-nya **trust**, ini gak bisa lewat ke produksi.

Fix: bikin view `profiles_public` yang nge-mask `whatsapp` kalau gak public:

```sql
create or replace view public.profiles_public as
select
  id, full_name, username, photo_url, cover_url, city, address_area, bio,
  instagram, discord, goodreads_url, storygraph_url, campus_or_workplace,
  favorite_genres, open_for_discussion, open_for_lending, open_for_selling,
  open_for_trade, is_admin, created_at, updated_at,
  case when whatsapp_public or id = auth.uid() then whatsapp end as whatsapp,
  whatsapp_public
from public.profiles;
revoke select on public.profiles from authenticated, anon;
grant select on public.profiles_public to authenticated, anon;
```

Lalu ubah semua query frontend yang nge-select `whatsapp` ke `profiles_public`.
Insert/update tetap ke `profiles`. Owner tetap bisa baca whatsapp-nya sendiri.

**P0 — Email confirmation off (saat ini).**
Sekarang sengaja off untuk dev. Pre-launch, hidupin lagi. Tanpa konfirmasi, orang
bisa daftar pake email orang lain → spam profile. Pasangin sama Supabase SMTP atau
Resend, bukan default Supabase yang rate-limited.

**P1 — Service role key di .env.local.**
Pastikan `.env.local` ke-gitignore (sudah, by Next default). Jangan pernah commit.
Saat deploy, set di Vercel env vars dengan flag "Encrypted".

**P1 — No CAPTCHA on signup.**
Bot-bot bisa brute register. Aktifkan di Supabase → Auth → Settings → CAPTCHA →
hCaptcha. Gratis untuk Supabase free tier.

**P1 — Password minimum 6 chars.**
Default Supabase. Naikin ke 8 + complexity rule via Supabase auth settings.

**P2 — No CSP headers.**
`Content-Security-Policy` belum di-set. Risk XSS via injected user content.
Tambahkan di `next.config.ts` `headers()` saat deploy.

### Reliability

**P0 — No error logging.**
Kalau seseorang dapet error di production, kita gak tau. Sentry atau Vercel
Observability gratis tier cukup. Wajib sebelum live ke 100 user.

**P1 — `cover_url` hard-coded ke external (Open Library / Google Books).**
Jika domain itu down, semua cover hilang. Solusi: copy cover ke Supabase Storage
saat insert (sekarang scripts udah download URL-nya, tapi gak download
file-nya). Saat ini risk acceptable untuk MVP — Open Library uptime ~99.5%.

**P1 — No retry / fallback on network failures.**
Add Book gagal → user reload, double-insert. Tambahin idempotency key atau
toast "Tersimpan, coba refresh" yang gak duplikat.

**P2 — N+1 query risk.**
`listShelfBooks` joining owner + community in one PostgREST query — OK.
Tapi saat user pertama bertambah, profile reads via proxy bisa jadi mahal.
Saat ini sudah dipindah dari proxy ke layout — fine.

**P2 — Empty/blank states ada di mana-mana, gak konsisten copy-nya.**
Audit ulang post-launch.

### Performance

**P0 — Bundle size belum diukur.**
Jalanin `next build` → cek output. Critical path < 200kb gzipped untuk first
load. PapaParse + Supabase JS bisa boost size. Audit.

**P1 — Tidak ada image optimization.**
Pakai `<img>` polos di mana-mana. Cover URL eksternal cuma ~50kb tapi tidak ada
lazy-loading kontekstual. Sederhananya: tambah `loading="lazy"` (sudah di
BookCard) di semua tempat. Atau migrate ke `next/image` dengan
`remotePatterns` di `next.config.ts`:

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "covers.openlibrary.org" },
    { protocol: "https", hostname: "books.google.com" },
    { protocol: "https", hostname: "lhqwwllbzkdpzpdeeyzp.supabase.co" },
  ],
}
```

**P2 — No FTS index.**
`searchBooks` pakai ilike. Untuk 14 buku saat ini OK, untuk 10k+ pelan. Migrate
ke `tsvector + GIN` saat catalog density melewati ~500.

**P2 — Proxy queries `auth.users` on every request.**
Edge case: 100 concurrent users = 100 calls. Supabase free tier connection pool
60. Risk di traffic spike. Mitigation: tambah cache (signed JWT in-memory) atau
upgrade ke Supabase Pro.

### Operational

**P0 — Seeding rerun behavior tidak deterministik.**
`scripts/seed-nikolas.mjs` (now idempotent — deletes prior `goodreads_import`
rows). OK.

**P0 — Tidak ada admin tools.**
Reports table ada, tapi gak ada UI. Kalau user posting konten illegal/spam, lo
harus query SQL manual. Untuk 100 user pertama OK, tapi build admin/reports
view di week 2.

**P1 — Tidak ada audit trail.**
Belum ada `audit_log`. Kalau user complaint "buku gue diapus", gak bisa
investigasi. Add nanti via Postgres trigger.

**P1 — Backup strategy.**
Supabase free tier auto-backup 7 hari. Cukup untuk MVP. Note di docs siapa yang
bisa restore (lo).

**P1 — No analytics.**
Tidak tracking apa pun. North Star spec: "Chat Owner clicks". Tambah Vercel
Analytics + custom event log untuk WhatsApp button clicks. Tanpa ini, susah
tahu produk dipakai apa nggak.

### Accessibility

**P1 — Skip-to-content link missing.**
Keyboard user tidak bisa lompat dari TopBar ke main. Standard a11y. Add
`<a class="sr-only" href="#main">Skip to content</a>` di layout.

**P1 — Bottom nav focus state lemah.**
`focus-visible` ring tipis. User dengan keyboard akan kesulitan.

**P2 — Color contrast belum di-test formal.**
Forest brown `#3D2E1F` on parchment `#F0E8D8` ratio ~10:1. PASS WCAG AAA. Tapi
muted `#8B7355` on parchment ratio ~3.8:1 — borderline AA untuk text >= 18pt
saja. Pakai untuk caption/uppercase saja.

**P2 — Icon-only buttons no labels.**
Search icon button di TopBar mobile pakai `aria-label="Cari"` ✓.
Avatar dropdown trigger pakai `aria-label="Menu akun"` ✓. Audit lainnya.

### Code Quality

**P1 — Database types tidak di-generate.**
`types/index.ts` di-maintain manual. Drift risk: skema berubah, types tidak.
Run `npx supabase gen types typescript --project-id lhqwwllbzkdpzpdeeyzp >
types/db.ts` setiap migration baru.

**P2 — Tidak ada test.**
Zero unit / integration / e2e. Untuk 100 user pertama OK; saat lo udah revenue
positive, hire engineer + add Vitest + Playwright basics.

**P2 — Magic strings.**
Status enum `"sell"|"lend"|"trade"|"unavailable"` literal di banyak tempat.
Move ke const-obj single source of truth (sudah ada `STATUS_CONFIG` — gak
semua kode pakai itu).

---

## Lens 2 — Peter Thiel (Strategic / Monopoly)

### Apa secret-nya?

Lo dan tim sudah mengartikulasikan secret di product philosophy doc:

> "Books are already distributed across members' shelves. The inventory exists.
> The trust exists. The community exists. We're not creating something new —
> we're making the invisible visible."

Itu kuat. Tapi **app saat ini gak menampilkan secret-nya di first-touch.**
Visitor pertama lihat landing → "Where books connect people, ideas turn into
movement" — terlalu generic, bisa jadi tagline aplikasi mana pun. Goodreads,
Tokopedia, atau Carousell pun bisa pakai tagline ini.

**Recommendation P1 — perubahan landing copy:**

Tambah satu paragraf di hero yang **menyebut grup WhatsApp eksplisit**:

> "Komunitas pembaca lo udah punya rak buku — di kepala masing-masing,
> di shelf di rumah, di chat WhatsApp yang scroll-nya gak ketemu lagi.
> Collective Library bikin itu kelihatan."

Sekali user baca itu, dia tau ini bukan Goodreads-Indo, ini infrastruktur
spesifik untuk masalah dia.

### 0 to 1 atau 1 to n?

Beberapa fitur masih terasa **1-to-n** (Goodreads-but-Indo):
- Profile "favorite genres" — Goodreads punya ini, dan lebih dalam. Skip.
- "Reading challenge" — di luar scope, sudah benar tidak dibangun.
- Reviews / ratings — sudah benar tidak dibangun.

Yang **0-to-1** dan harus diperkuat:
- ✅ WTB feed — secara konsep tidak ada di Goodreads/StoryGraph. Pertahankan.
- ✅ Direct WhatsApp deep link — anti-pattern di e-commerce, secret di sini.
- ❌ **Community-scoped visibility** — schema sudah support `visibility =
  'community' | 'trusted'` tapi UI selalu pakai `'public'`. Manfaatkan ini
  saat lo expand dari JP ke komunitas kedua. Ini **moat** karena Goodreads
  tidak bisa replicate community trust dalam 1 minggu.

### Network effect strength

Sekarang lemah karena:
- Tidak ada feed "X anggota baru bergabung minggu ini"
- Tidak ada "buku yang lagi populer di komunitas lo"
- Profile page cover image (header banner) tidak dipakai

**P1 — Bangun "Aktivitas terbaru" widget di /shelf.**
Cukup 3 baris kecil di atas grid: "Cole baru list 5 buku", "Maya posting WTB:
Atomic Habits", "3 anggota join JP minggu ini". Bisa pakai Postgres window
functions. Loop sosial yang bikin orang return.

**P1 — Tampilkan total density.**
"14 buku · 1 anggota" sudah ada di stats bar /shelf. Tapi format-nya kurang
sales-y. Coba: "14 buku siap dipinjam · 0 lagi dicari · 1 anggota aktif".
Tiap angka adalah sales argument.

### Sales arguments per surface

- **Landing hero CTA** "Explore Rak Kolektif" — netral, gak menjual. Coba
  "Lihat 14 buku yang anggota JP udah list →".
- **Empty `/shelf`** — copy bagus ✓.
- **Empty `/wanted`** — copy bagus ✓ ("Lagi nyari buku yang gak ada di rak?").
- **Add Book "+ Tambah Buku"** — fungsional, tidak menjual. Coba "List buku ke
  rak komunitas →" — komunitas explicit.
- **Profile "Belum ada info kontak"** — pasif. Coba "Tambah satu cara kontak
  biar anggota bisa hubungin lo soal buku."

### Definite vs indefinite optimism

Dari spec: "Build as if this will work. Pre-populate. Show social proof. Make
it feel alive before anyone signs up."

**Status:** belum dilakukan. Saat ini app feels like beta — empty WTB,
1 user, 14 buku tanpa cerita. Sebelum invite JP, lo + Cole harus:

1. Seed minimal 30 buku gabungan (sekarang 14)
2. Posting 3-5 WTB request real (atau dummy yang masuk akal)
3. Update bio di profile lo dengan paragraph nyata yang menarik

Tanpa ini, JP member pertama mendarat di app yang terasa kosong → bounce.
**Ini yang Thiel maksud dengan "definite optimism" — bangun seakan-akan ini
akan jalan, jadi orang lain juga percaya.**

### Moat against Goodreads / Tokopedia / Carousell

Saat ini moat-nya:
1. **Lokal Semarang** — mereka semua nasional/global
2. **Komunitas sebagai unit** — bukan individual
3. **WhatsApp-native contact** — bukan in-app messaging
4. **Trust signal explisit** — "✦ Journey Perintis" badge

Yang mendorong moat lebih dalam:
- **Komunitas menambah komunitas** — moderator JP merekomendasikan komunitas
  pembaca lain untuk join. Build ini di Sprint Q3.
- **Reading group integration** — kalau komunitas mengadakan diskusi buku
  bulanan, app bantu schedule + RSVP. Ini fitur 0-to-1.

Hold off ini sampai post-launch. Tapi jangan build apa pun yang bertentangan
(misal: marketplace open ke siapa pun = melemahkan moat).

---

## Lens 3 — Seth Godin (Story / Tribe / Permission)

### What's the story you tell?

User pertama yang membuka app sekarang melihat:
1. Logo (warm)
2. Tagline: "Where books connect people, and ideas turn into movement."
3. Sub: "Sebuah katalog buku kolektif + jaringan pembaca..."
4. CTA: "Explore Collective Shelf" / "Daftarkan Rak Bukumu"
5. Tiga feature card: Dijual / Dipinjamkan / Dicari

**Yang hilang: founder's voice.**
Godin's heuristic: "Who's writing this to me? Why?" Tidak ada sosok manusia
di mana pun. Tagline-nya bagus tapi tidak personal.

**P1 — Tambahkan "Why this exists" section di landing.**
2-3 kalimat dengan tone manusiawi, bukan corporate:

> "Awalnya kita capek scroll WhatsApp grup pembaca, nyari siapa yang punya
> buku X. Lupa. Reset chat. Mulai dari nol lagi.
>
> Collective Library ini buat itu — biar rak kolektif komunitas keliatan,
> dan ide-ide bisa berpindah tangan tanpa hilang di chat."
>
> — Cole, JP Semarang

Itu **remarkable** karena spesifik. Itu **tribe-defining** karena memanggil
orang yang punya pengalaman sama. Itu **authentic** karena menyebutkan masalah
dengan jujur.

### Tribe identity

Saat ini app bisa terasa "for everyone in Indonesia". Itu kelemahan Godin: yang
bukan untuk semua orang adalah yang berhasil.

**Tribe Collective Library:**
- Pembaca yang punya growth mindset (mengutip mission lo)
- Capek beli buku baru terus
- Mau pinjam-meminjam dengan trust
- Tertarik diskusi reflektif, bukan rating-counting
- Berbasis di Semarang (untuk sekarang)

**P1 — Landing footer: "For yang udah baca 12+ buku setahun ini dan rak-nya
mulai overflow."**

Atau slogan kecil di bawah Daftar button: "Bukan platform jual-beli buku.
Kita platform untuk komunitas yang sudah saling kenal."

Ini **filter masuk** — orang yang gak cocok bouncing, orang yang cocok merasa
"oh ini gue".

### Permission marketing

User signup → kita dapat email mereka. Tapi kita belum tahu **kapan dan apa**
yang boleh kita kirim.

**P1 — Define permission ladder.**

Saat onboarding, tambah satu opt-in (default ON, bisa di-uncheck):

```
[ ] Boleh email gue weekly digest:
    "Buku yang lagi dicari di komunitas lo minggu ini"
```

Gak ada produk tanpa email loop di 2026. Tapi pertahankan permission yang ditanya.

### Remarkability test

Apa yang user share ke teman setelah pakai 5 menit pertama?

Audit per-page:
- **Landing**: "Liat ada app baru buat komunitas pembaca." Lemah.
- **Onboarding**: tidak ada moment remarkable.
- **Add Book dengan BookPicker**: 🔥 ini remarkable. "Liat, gue ketik 2 huruf
  dan langsung ada cover-nya." **Amplifikasi.**
- **Goodreads CSV import**: 🔥🔥 sangat remarkable. "Gue import 200 buku Goodreads
  gue sekaligus." **Amplifikasi lebih besar.**
- **Book detail page**: WhatsApp button → "Tinggal tap, langsung chat owner."
  Remarkable kalau audience-nya tidak terbiasa marketplace lokal yang baik.
- **Profile**: tergantung apakah mereka isi cover image (belum dipakai!).

**P1 — Tambahkan share moment ke Add Book + Import success.**
Setelah publish: toast besar "Buku #1 lo masuk ke rak. Pamerin ke teman?"
dengan tombol "Copy link profile" / "Share via WhatsApp". Ini gratis growth
loop — Godin's "remarkability".

### Empty space — what to remove

Godin: less but better. Audit fitur yang **tidak menambah cerita**:

- **"Penerbit" field di Add Book** — apakah ada user yang care? Mungkin sembunyikan
  di expandable "Detail lebih lanjut".
- **"Open for trade" toggle di onboarding** — kalau lo cuma punya 3 status di
  app (sell/lend/trade), 3 toggle berlebih. Cukup 1 toggle "Mau berbagi buku?".
- **Sub-tagline panjang Bahasa Indonesia di header landing** — terlalu padat.
  Pecah jadi headline + 1 baris saja.

### Linchpin — human signature

> "The linchpin is the only one who can do this work — replaceable by no one."

Apa signature manusiawi yang terbaca?

- Logo two-faces — strong ✓
- DM Serif Display di hero — strong ✓
- Warm parchment + sepia palette — strong ✓
- Empty state copy ("Belum ada buku di sini. Jadi yang pertama!") — generic.
  Ini kesempatan personal voice yang missed.

**P2 — Re-write semua empty state dengan voice yang sama:**
- `/shelf` empty: "Rak ini lagi nunggu buku pertama. Buku yang lo selesai
  baca tahun ini, gimana?"
- `/wanted` empty: "Belum ada yang nyari buku. Kalau lo ada wishlist yang
  belum kebeli, mungkin sekarang waktunya bilang ke komunitas."
- `/search` empty: "Ketik judul, atau scroll random buku di komunitas dulu."

### Transparency

Godin checks: does the user know:
1. **How does this make money?** — Tidak terjawab. **Add ke footer:**
   "Gratis. Selamanya. Dibangun bareng komunitas Journey Perintis."
2. **Who runs this?** — Tidak terjawab. **Add /about page** dengan satu foto
   founder, satu paragraf.
3. **What happens to my data?** — Tidak ada privacy page. **Add /privacy**
   minimal.
4. **Can I export my data?** — Tidak ada. Untuk MVP OK, post-launch tambah
   "Export buku ke CSV" di profile edit.

---

## Top 12 actions before public launch (prioritized)

### P0 (must-fix)
1. Fix WhatsApp privacy leak via `profiles_public` view + revoke select on `profiles`
2. Hidupin email confirmation di Supabase + setup proper SMTP (Resend gratis 3k email/bulan)
3. Setup Sentry / Vercel Observability untuk error logging
4. Hidupin hCaptcha di registration
5. Re-seed shelf jadi minimal 30 buku gabungan (lo + Cole)
6. Tambahkan domain ke `next.config.ts` `images.remotePatterns` untuk Open Library + Google Books + Supabase

### P1 (week 1)
7. Tambahkan "Why this exists" section dengan founder's voice di landing
8. Bangun "Aktivitas terbaru" widget di /shelf (3 baris recent activity)
9. Tambahkan share moment toast setelah Add Book / Import success
10. Re-write semua empty state dengan voice yang konsisten
11. Tambah footer dengan "Gratis. Selamanya." + link About + Privacy
12. Tambah Vercel Analytics + custom event "whatsapp_click"

### P2 (week 2-4)
- Admin dashboard MVP (table view + report list)
- Audit log via Postgres trigger
- Skip-to-content link + a11y audit pass
- Auto-generated database types via supabase CLI
- Migrate ke `next/image` dengan remotePatterns

---

## Bottom line

App ini **layak ship ke 100 user pertama setelah P0 selesai**. Estimasi P0
total ~1 hari kerja (privacy fix paling lama, ~3 jam). P1 ~1 minggu kerja
sambil nunggu user feedback masuk. P2 backlog 1 bulan pertama.

Tapi yang paling penting: **jangan hide product behind perfect launch**. Godin
bilang "ship or shut up." Selesai P0, deploy. Loop dengan user. P1 dan P2
prioritized berdasarkan apa yang user complaint, bukan apa yang gue tulis di
sini.
