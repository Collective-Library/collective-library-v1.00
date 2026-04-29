// One-off seed script. Looks up user by email, fetches Open Library metadata
// for each title in BOOKS, inserts into public.books with their owner_id.
//
// Run from collective-library/ with:
//   node --env-file=.env.local scripts/seed-nikolas.mjs
//
// Idempotent: deletes prior `goodreads_import` rows for this user before
// re-inserting, so re-runs always converge to the BOOKS array below.

import { createClient } from "@supabase/supabase-js";

const TARGET_EMAIL = "nikolas.widad@gmail.com";

const BOOKS = [
  { title: "The Laws of Human Nature", author: "Robert Greene", status: "to-read" },
  { title: "Wisdom from Rich Dad, Poor Dad", author: "Robert T. Kiyosaki", status: "read", my_rating: 5 },
  { title: "Marketing 4.0", author: "Philip Kotler, Hermawan Kartajaya", status: "read", my_rating: 5, date_read: "2025-02" },
  { title: "The Concise 33 Strategies of War", author: "Robert Greene", status: "to-read" },
  { title: "Rich Dad's Cashflow Quadrant", author: "Robert T. Kiyosaki", status: "read", my_rating: 5 },
  { title: "Belajar Marketing Belajar Hidup", author: "Henry Manampiring", status: "read", my_rating: 4 },
  { title: "Emotional Intelligence", author: "Daniel Goleman", status: "currently-reading" },
  { title: "The 48 Laws of Power", author: "Robert Greene", status: "to-read" },
  { title: "The Psychology of Money", author: "Morgan Housel", status: "read", my_rating: 5 },
  { title: "The 7 Habits of Highly Effective People", author: "Stephen R. Covey", status: "to-read" },
  { title: "How to Win Friends & Influence People", author: "Dale Carnegie", status: "to-read" },
  { title: "Atomic Habits", author: "James Clear", status: "to-read" },
  { title: "Elon Musk: Tesla, SpaceX, and the Quest for a Fantastic Future", author: "Ashlee Vance", status: "read", my_rating: 4, date_read: "2025-07-23" },
  { title: "Steve Jobs", author: "Walter Isaacson", status: "to-read" },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Search Open Library by free text. Returns the top match + an editon-key for description fetch. */
async function searchOpenLibrary(query) {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1&fields=title,author_name,isbn,cover_i,cover_edition_key,publisher,first_publish_year,language,key`;
    const r = await fetch(url);
    if (!r.ok) {
      console.error(`  OL search failed: ${r.status}`);
      return null;
    }
    const data = await r.json();
    const d = data.docs?.[0];
    if (!d?.title) return null;
    const isbn = d.isbn?.[0] ?? null;
    const cover_url = d.cover_i
      ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`
      : (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null);
    const lang = d.language?.[0];
    return {
      title: d.title,
      author: d.author_name?.join(", ") ?? null,
      publisher: d.publisher?.[0] ?? null,
      isbn,
      cover_url,
      language: lang === "ind" ? "Indonesia" : lang === "eng" ? "English" : "Indonesia",
      work_key: d.key, // e.g. /works/OL12345W — used to fetch description
    };
  } catch (err) {
    console.error("  OL search error:", err.message);
    return null;
  }
}

/** Fetch description from /works/{key}.json. Returns null on miss. */
async function fetchOpenLibraryDescription(workKey) {
  try {
    const url = `https://openlibrary.org${workKey}.json`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.description) return null;
    return typeof data.description === "string" ? data.description : data.description.value ?? null;
  } catch {
    return null;
  }
}

function buildNotes(b) {
  if (b.status === "currently-reading") return "Lagi gue baca sekarang.";
  if (b.status === "to-read") return "Wishlist gue.";
  if (b.status === "read") {
    const parts = [];
    if (b.my_rating) parts.push(`⭐ ${b.my_rating}/5`);
    if (b.date_read) parts.push(`selesai ${b.date_read}`);
    return parts.length ? parts.join(" · ") : null;
  }
  return null;
}

async function main() {
  console.log(`Looking up user: ${TARGET_EMAIL}…`);
  const { data: { users }, error: lookupErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (lookupErr) {
    console.error("Failed to list users:", lookupErr.message);
    process.exit(1);
  }
  const user = users.find((u) => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());
  if (!user) {
    console.error(`\n✗ User ${TARGET_EMAIL} not found in auth.users.`);
    process.exit(1);
  }
  console.log(`✓ Found user ${user.email}`);

  const { data: community } = await supabase
    .from("communities")
    .select("id, name")
    .eq("slug", "journey-perintis")
    .single();
  const community_id = community?.id ?? null;
  console.log(`✓ Community: ${community?.name ?? "(none)"}`);

  // Wipe prior goodreads_import for this user — keeps the script idempotent.
  const { error: delErr, count } = await supabase
    .from("books")
    .delete({ count: "exact" })
    .eq("owner_id", user.id)
    .eq("source", "goodreads_import");
  if (delErr) {
    console.error(`✗ Failed to clear prior seed: ${delErr.message}`);
    process.exit(1);
  }
  console.log(`✓ Cleared ${count ?? 0} prior goodreads_import row(s)\n`);

  console.log(`Seeding ${BOOKS.length} books…\n`);
  let ok = 0, failed = 0;

  for (const b of BOOKS) {
    process.stdout.write(`  "${b.title}" — `);
    const meta = await searchOpenLibrary(`${b.title} ${b.author}`);
    let description = null;
    if (meta?.work_key) {
      description = await fetchOpenLibraryDescription(meta.work_key);
    }
    const { error } = await supabase.from("books").insert({
      title: meta?.title ?? b.title,
      author: meta?.author ?? b.author,
      isbn: meta?.isbn ?? null,
      publisher: meta?.publisher ?? null,
      description: description ?? null,
      language: meta?.language ?? "Indonesia",
      cover_url: meta?.cover_url ?? null,
      owner_id: user.id,
      community_id,
      status: "unavailable",
      condition: "good",
      source: "goodreads_import",
      notes: buildNotes(b),
    });
    if (error) {
      console.log(`✗ ${error.message}`);
      failed++;
    } else {
      const tag = meta?.cover_url ? "✓ with cover" : meta ? "✓ (no cover)" : "✓ bare-bones";
      console.log(tag);
      ok++;
    }
    // be polite to Open Library
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\nDone. ${ok} added · ${failed} failed.`);
}

await main();
