/**
 * 3-layer interest taxonomy.
 *
 * Layer 1 — BROAD_INTERESTS: domain-level chips (psikologi, filsafat, dst).
 *           Stored on profiles.interests text[].
 * Layer 2 — SUB_INTERESTS:   granular topics within a broad. Filtered
 *           dynamically by what's in Layer 1.
 *           Stored on profiles.sub_interests text[].
 * Layer 3 — INTENTS:         what the member WANTS to do (diskusi, baca
 *           rame-rame, pinjam, etc). Flat, multi-select.
 *           Stored on profiles.intents text[]. GIN-indexed.
 *
 * Slugs are canonical. Labels + emoji are display-only.
 */

export interface InterestOption {
  slug: string;
  label: string;
  emoji: string;
}

// =============================================================================
// Layer 1 — broad domains
// =============================================================================
export const BROAD_INTERESTS: InterestOption[] = [
  { slug: "psikologi", label: "Psikologi", emoji: "🧠" },
  { slug: "filsafat", label: "Filsafat", emoji: "📜" },
  { slug: "bisnis", label: "Bisnis", emoji: "📈" },
  { slug: "self-growth", label: "Self Growth", emoji: "🌱" },
  { slug: "teknologi", label: "Teknologi", emoji: "💻" },
  { slug: "sastra", label: "Sastra", emoji: "📖" },
  { slug: "sejarah", label: "Sejarah", emoji: "🏛️" },
  { slug: "spiritual", label: "Spiritual", emoji: "🕯️" },
  { slug: "sains", label: "Sains", emoji: "🔬" },
  { slug: "seni", label: "Seni & Desain", emoji: "🎨" },
];

// =============================================================================
// Layer 2 — sub-interests, keyed by Layer 1 slug
// =============================================================================
export const SUB_INTERESTS: Record<string, InterestOption[]> = {
  psikologi: [
    { slug: "kognitif", label: "Kognitif", emoji: "🧩" },
    { slug: "klinis", label: "Klinis", emoji: "🩺" },
    { slug: "perkembangan", label: "Perkembangan anak", emoji: "👶" },
    { slug: "sosial", label: "Sosial", emoji: "👥" },
    { slug: "behavioral", label: "Behavioral", emoji: "🔬" },
    { slug: "trauma", label: "Trauma & healing", emoji: "💚" },
  ],
  filsafat: [
    { slug: "eksistensialisme", label: "Eksistensialisme", emoji: "🌌" },
    { slug: "stoik", label: "Stoik", emoji: "🏛️" },
    { slug: "fenomenologi", label: "Fenomenologi", emoji: "🔍" },
    { slug: "etika", label: "Etika", emoji: "⚖️" },
    { slug: "filsafat-timur", label: "Filsafat Timur", emoji: "☯️" },
    { slug: "politik", label: "Filsafat Politik", emoji: "🏴" },
    { slug: "kritis", label: "Teori Kritis", emoji: "🔥" },
  ],
  bisnis: [
    { slug: "startup", label: "Startup", emoji: "🚀" },
    { slug: "ekonomi", label: "Ekonomi", emoji: "📊" },
    { slug: "marketing", label: "Marketing", emoji: "📣" },
    { slug: "leadership", label: "Leadership", emoji: "🎯" },
    { slug: "investasi", label: "Investasi", emoji: "💰" },
    { slug: "operasional", label: "Operasional", emoji: "⚙️" },
  ],
  "self-growth": [
    { slug: "produktivitas", label: "Produktivitas", emoji: "⏱️" },
    { slug: "habits", label: "Habits", emoji: "🔁" },
    { slug: "mindfulness", label: "Mindfulness", emoji: "🧘" },
    { slug: "career", label: "Career", emoji: "💼" },
    { slug: "relasi", label: "Relasi", emoji: "💞" },
    { slug: "finansial", label: "Personal finance", emoji: "💸" },
  ],
  teknologi: [
    { slug: "ai-ml", label: "AI / ML", emoji: "🤖" },
    { slug: "software", label: "Software Eng", emoji: "💻" },
    { slug: "produk", label: "Product", emoji: "📐" },
    { slug: "design-ux", label: "UX / Design", emoji: "🎨" },
    { slug: "infrastructure", label: "Infrastructure", emoji: "🛠️" },
    { slug: "data", label: "Data", emoji: "📊" },
  ],
  sastra: [
    { slug: "fiksi-kontemporer", label: "Fiksi kontemporer", emoji: "📖" },
    { slug: "fiksi-sejarah", label: "Fiksi sejarah", emoji: "📜" },
    { slug: "puisi", label: "Puisi", emoji: "🪶" },
    { slug: "scifi", label: "Sci-fi", emoji: "🛸" },
    { slug: "fantasi", label: "Fantasi", emoji: "🐉" },
    { slug: "sastra-id", label: "Sastra Indonesia", emoji: "🇮🇩" },
    { slug: "klasik", label: "Klasik dunia", emoji: "📚" },
    { slug: "esai", label: "Esai", emoji: "✍️" },
  ],
  sejarah: [
    { slug: "sejarah-id", label: "Sejarah Indonesia", emoji: "🇮🇩" },
    { slug: "perang-dunia", label: "Perang Dunia", emoji: "⚔️" },
    { slug: "biografi", label: "Biografi", emoji: "👤" },
    { slug: "global", label: "Global", emoji: "🌍" },
    { slug: "kolonial", label: "Kolonial", emoji: "🗿" },
    { slug: "kuno", label: "Sejarah kuno", emoji: "🏺" },
  ],
  spiritual: [
    { slug: "islam", label: "Islam", emoji: "☪️" },
    { slug: "kristen", label: "Kristen", emoji: "✝️" },
    { slug: "buddhisme", label: "Buddhisme", emoji: "☸️" },
    { slug: "tao-zen", label: "Tao / Zen", emoji: "☯️" },
    { slug: "sufism", label: "Sufism", emoji: "🌙" },
    { slug: "general", label: "Spiritualitas umum", emoji: "🕯️" },
  ],
  sains: [
    { slug: "fisika", label: "Fisika", emoji: "⚛️" },
    { slug: "biologi", label: "Biologi", emoji: "🧬" },
    { slug: "neurosains", label: "Neurosains", emoji: "🧠" },
    { slug: "astronomi", label: "Astronomi", emoji: "🪐" },
    { slug: "evolusi", label: "Evolusi", emoji: "🦴" },
    { slug: "matematika", label: "Matematika", emoji: "🔢" },
    { slug: "iklim", label: "Iklim & lingkungan", emoji: "🌱" },
  ],
  seni: [
    { slug: "desain", label: "Desain", emoji: "✏️" },
    { slug: "arsitektur", label: "Arsitektur", emoji: "🏗️" },
    { slug: "musik", label: "Musik", emoji: "🎵" },
    { slug: "film", label: "Film", emoji: "🎬" },
    { slug: "rupa", label: "Seni rupa", emoji: "🖼️" },
    { slug: "fotografi", label: "Fotografi", emoji: "📷" },
  ],
};

// =============================================================================
// Layer 3 — intents (what user wants to DO with reading)
// =============================================================================
export const INTENTS: InterestOption[] = [
  { slug: "diskusi", label: "Diskusi & tukar pikiran", emoji: "💬" },
  { slug: "book-club", label: "Baca rame-rame", emoji: "📚" },
  { slug: "lend", label: "Pinjam-meminjam", emoji: "🤝" },
  { slug: "trade", label: "Tukar buku", emoji: "🔄" },
  { slug: "rekomendasi", label: "Cari rekomendasi", emoji: "🔍" },
  { slug: "writing", label: "Nulis bareng", emoji: "✍️" },
  { slug: "review", label: "Review buku", emoji: "⭐" },
  { slug: "ngobrol", label: "Ngobrol kasual", emoji: "☕" },
];

// =============================================================================
// Lookup helpers
// =============================================================================

/** All Layer 2 options across every Layer 1, used for label/emoji lookup. */
const ALL_SUB: InterestOption[] = Object.values(SUB_INTERESTS).flat();

export function labelForInterest(slug: string): string {
  const found =
    BROAD_INTERESTS.find((i) => i.slug === slug) ??
    ALL_SUB.find((i) => i.slug === slug) ??
    INTENTS.find((i) => i.slug === slug);
  if (found) return found.label;
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function emojiForInterest(slug: string): string {
  const found =
    BROAD_INTERESTS.find((i) => i.slug === slug) ??
    ALL_SUB.find((i) => i.slug === slug) ??
    INTENTS.find((i) => i.slug === slug);
  return found?.emoji ?? "✦";
}

export function labelForIntent(slug: string): string {
  return INTENTS.find((i) => i.slug === slug)?.label ?? slug;
}

export function emojiForIntent(slug: string): string {
  return INTENTS.find((i) => i.slug === slug)?.emoji ?? "✦";
}

/**
 * Returns the Layer 2 options visible given a user's Layer 1 selection.
 * Empty when no Layer 1 selected — caller can hide the Layer 2 section.
 */
export function subInterestsFor(broadSlugs: string[]): InterestOption[] {
  return broadSlugs.flatMap((b) => SUB_INTERESTS[b] ?? []);
}

/**
 * Filters a sub-interest selection down to only those whose parent is still
 * selected. Used at save-time to drop orphans when user deselects a Layer 1.
 */
export function pruneOrphanSubs(
  subs: string[],
  broadSlugs: string[],
): string[] {
  const valid = new Set(subInterestsFor(broadSlugs).map((s) => s.slug));
  return subs.filter((s) => valid.has(s));
}
