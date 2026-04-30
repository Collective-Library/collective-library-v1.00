/**
 * Layer 1 of the interest taxonomy — broad domains.
 * Sub-interests + intent (Layer 2/3) come in a follow-up sprint.
 *
 * Selectable as chips in onboarding + profile/edit. Stored as text[] on
 * profiles.interests. The slug is canonical; label is the displayed text.
 */
export interface InterestOption {
  slug: string;
  label: string;
  emoji: string;
}

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

/** Lookup helper. Falls back to a humanized version of the slug. */
export function labelForInterest(slug: string): string {
  const found = BROAD_INTERESTS.find((i) => i.slug === slug);
  if (found) return found.label;
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function emojiForInterest(slug: string): string {
  return BROAD_INTERESTS.find((i) => i.slug === slug)?.emoji ?? "✦";
}
