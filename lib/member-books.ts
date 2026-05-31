/**
 * Pure bucketing for the landing "Pembaca yang udah join" member strip.
 *
 * Deliberately free of any Supabase / server imports so it stays unit-testable
 * with `node --test` and reusable. The caller is responsible for fetching the
 * rows (already filtered to public, non-hidden books) and ordering them
 * newest-first — this helper just buckets per owner.
 *
 * Two concerns are kept separate on purpose:
 *   - `countByOwner` counts EVERY row per owner → an accurate total, even for a
 *     member whose books have no `cover_url`.
 *   - `coversByOwner` collects up to `coverCap` non-null covers per owner for
 *     the thumbnail row.
 *
 * Regression context: the previous landing query capped the whole cohort with a
 * single global `.limit()`, so prolific members starved others of rows and they
 * showed "0 buku". Counting must run over the full, un-capped row set.
 */
export interface OwnerBookRow {
  owner_id: string;
  cover_url: string | null;
}

export interface MemberBookBuckets {
  countByOwner: Map<string, number>;
  coversByOwner: Map<string, string[]>;
}

export function bucketMemberBooks(rows: OwnerBookRow[], coverCap = 3): MemberBookBuckets {
  const countByOwner = new Map<string, number>();
  const coversByOwner = new Map<string, string[]>();

  for (const row of rows) {
    const owner = row.owner_id;
    countByOwner.set(owner, (countByOwner.get(owner) ?? 0) + 1);

    const covers = coversByOwner.get(owner) ?? [];
    if (covers.length < coverCap && row.cover_url) {
      covers.push(row.cover_url);
    }
    coversByOwner.set(owner, covers);
  }

  return { countByOwner, coversByOwner };
}
