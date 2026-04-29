// Seed 20 popular Indonesian novels (modern + classic) into journey.perintis's
// shelf. Idempotent: skips titles already on the user's shelf (case-insensitive).
//
// Run from collective-library/ with:
//   node --env-file=.env.local scripts/seed-novels-id.mjs

import { createClient } from "@supabase/supabase-js";

const TARGET_EMAIL = "nikolas.widad@gmail.com";

const NOVELS = [
  // Eka Kurniawan — modern literary force
  { title: "Cantik Itu Luka", author: "Eka Kurniawan", note: "Eka di puncak — magical realism + sejarah Indonesia." },
  { title: "Lelaki Harimau", author: "Eka Kurniawan", note: "Pendek, padat, intens." },
  { title: "Seperti Dendam, Rindu Harus Dibayar Tuntas", author: "Eka Kurniawan", note: "Adaptasi filmnya juga bagus." },

  // Pramoedya Ananta Toer — Tetralogi Buru
  { title: "Bumi Manusia", author: "Pramoedya Ananta Toer", note: "Klasik wajib. Mulai dari sini." },
  { title: "Anak Semua Bangsa", author: "Pramoedya Ananta Toer", note: "Tetralogi Buru #2." },
  { title: "Jejak Langkah", author: "Pramoedya Ananta Toer", note: "Tetralogi Buru #3." },
  { title: "Rumah Kaca", author: "Pramoedya Ananta Toer", note: "Tetralogi Buru #4 — pamungkas." },

  // Andrea Hirata
  { title: "Laskar Pelangi", author: "Andrea Hirata", note: "Belitung, Lintang, dan masa kecil yang gak akan ketemu lagi." },
  { title: "Sang Pemimpi", author: "Andrea Hirata", note: "Sekuel Laskar Pelangi." },

  // Dee Lestari
  { title: "Filosofi Kopi", author: "Dee Lestari", note: "Cerita pendek + filsafat secangkir." },
  { title: "Perahu Kertas", author: "Dee Lestari", note: "Cinta, mimpi, dan gambar." },
  { title: "Supernova: Kesatria, Putri, dan Bintang Jatuh", author: "Dee Lestari", note: "Mulai dari sini buat baca series Supernova." },

  // Tere Liye
  { title: "Negeri Para Bedebah", author: "Tere Liye", note: "Thriller finance Indonesia." },
  { title: "Pulang", author: "Tere Liye", note: "Bujang, Keluarga Tong, dan harga sebuah pulang." },
  { title: "Bumi", author: "Tere Liye", note: "Series Bumi #1 — fantasi remaja." },

  // Habiburrahman El Shirazy
  { title: "Ayat-Ayat Cinta", author: "Habiburrahman El Shirazy", note: "Roman religi yang ngebentuk satu generasi." },

  // Ahmad Tohari
  { title: "Ronggeng Dukuh Paruk", author: "Ahmad Tohari", note: "Klasik. Trilogi yang sarat sejarah." },

  // Leila S. Chudori
  { title: "Pulang", author: "Leila S. Chudori", note: "Eksil 1965 dan rasa identitas yang tercabik." },
  { title: "Laut Bercerita", author: "Leila S. Chudori", note: "Aktivis 1998 — wajib baca." },

  // Ayu Utami
  { title: "Saman", author: "Ayu Utami", note: "Sastra Indonesia post-Reformasi." },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function searchOpenLibrary(query) {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1&fields=key,title,author_name,isbn,cover_i,publisher,first_publish_year,language`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    const d = data.docs?.[0];
    if (!d?.title) return null;
    const isbn = d.isbn?.[0] ?? null;
    const cover_url = d.cover_i
      ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`
      : (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null);
    return {
      title: d.title,
      author: d.author_name?.join(", ") ?? null,
      publisher: d.publisher?.[0] ?? null,
      isbn,
      cover_url,
      language: "Indonesia",
      work_key: d.key,
    };
  } catch {
    return null;
  }
}

async function fetchOpenLibraryDescription(workKey) {
  try {
    const r = await fetch(`https://openlibrary.org${workKey}.json`);
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.description) return null;
    return typeof data.description === "string" ? data.description : data.description.value ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const user = users.find((u) => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());
  if (!user) {
    console.error(`User ${TARGET_EMAIL} not found`);
    process.exit(1);
  }
  console.log(`✓ User: ${user.email}`);

  const { data: community } = await supabase
    .from("communities").select("id").eq("slug", "journey-perintis").single();
  const community_id = community?.id ?? null;

  // Skip duplicates already on shelf
  const { data: existing } = await supabase
    .from("books").select("title").eq("owner_id", user.id);
  const seen = new Set((existing ?? []).map((b) => b.title.toLowerCase()));

  console.log(`\nSeeding ${NOVELS.length} Indonesian novels…\n`);
  let ok = 0, skipped = 0, failed = 0;

  for (const n of NOVELS) {
    if (seen.has(n.title.toLowerCase())) {
      console.log(`◦ skip "${n.title}" (already on shelf)`);
      skipped++;
      continue;
    }
    process.stdout.write(`  "${n.title}" — `);
    const meta = await searchOpenLibrary(`${n.title} ${n.author}`);
    let description = null;
    if (meta?.work_key) description = await fetchOpenLibraryDescription(meta.work_key);

    const { error } = await supabase.from("books").insert({
      title: meta?.title ?? n.title,
      author: meta?.author ?? n.author,
      isbn: meta?.isbn ?? null,
      publisher: meta?.publisher ?? null,
      description,
      language: "Indonesia",
      cover_url: meta?.cover_url ?? null,
      owner_id: user.id,
      community_id,
      status: "unavailable",
      condition: "good",
      source: "goodreads_import",
      notes: n.note,
    });
    if (error) {
      console.log(`✗ ${error.message}`);
      failed++;
    } else {
      const tag = meta?.cover_url ? "✓ with cover" : meta ? "✓ (no cover)" : "✓ bare-bones";
      console.log(tag);
      ok++;
    }
    await new Promise((r) => setTimeout(r, 250)); // be nice to Open Library
  }

  console.log(`\nDone. ${ok} added · ${skipped} skipped · ${failed} failed.`);
}

await main();
