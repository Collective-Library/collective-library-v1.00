/**
 * Isomorphic constants + helpers for Spots / Library Nodes.
 *
 * Lives in its own module so client components (forms, pickers, controls)
 * can import these without transitively pulling `lib/supabase/server.ts`
 * (which imports `next/headers` and breaks at build time when reached from
 * a Client Component graph). `lib/spots.ts` re-exports from here so older
 * callers keep working.
 */

import type { SpotStatus, SpotType, SpotVisibility } from "@/types";

export const SPOT_TYPE_OPTIONS: { value: SpotType; label: string; emoji: string }[] = [
  { value: "cafe", label: "Cafe", emoji: "☕" },
  { value: "public_shelf", label: "Public bookshelf", emoji: "📚" },
  { value: "community_space", label: "Community space", emoji: "🤝" },
  { value: "school", label: "Sekolah", emoji: "🏫" },
  { value: "campus", label: "Kampus", emoji: "🎓" },
  { value: "library", label: "Library", emoji: "🏛️" },
  { value: "coworking", label: "Coworking", emoji: "💼" },
  { value: "partner", label: "Partner space", emoji: "🤲" },
  { value: "other", label: "Lainnya", emoji: "✨" },
];

export const SPOT_STATUS_OPTIONS: {
  value: SpotStatus;
  label: string;
  tone: "positive" | "warning" | "neutral";
}[] = [
  { value: "needs_audit", label: "Needs audit", tone: "warning" },
  { value: "active", label: "Active", tone: "positive" },
  { value: "inactive", label: "Inactive", tone: "neutral" },
];

export const SPOT_VISIBILITY_OPTIONS: { value: SpotVisibility; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "community", label: "Community only" },
];

/** Mirrors the DB CHECK constraint on library_nodes.slug. */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Slugify a Spot name into the DB-allowed slug format.
 * Strips accents, lowercases, replaces non-alphanumerics with single hyphens,
 * trims leading/trailing hyphens. The DB CHECK enforces the final shape.
 */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
