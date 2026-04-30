import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Detect data integrity issues. Each issue carries severity + suggested fix.
 * No auto-deletion — destructive fixes must be explicit and SQL-driven.
 */

export type Severity = "low" | "medium" | "high";

export interface DataIssue {
  type: string;
  label: string;
  severity: Severity;
  count: number;
  detail?: string;
  suggestedFix: string;
  // Optional first-N affected ids for spot-check
  sample?: string[];
}

export async function detectDataIssues(): Promise<DataIssue[]> {
  const supabase = createAdminClient();
  const issues: DataIssue[] = [];

  // 1. Books with owner_id pointing to a non-existent profile
  // (FK is on books.owner_id → profiles.id with cascade delete, so this
  //  shouldn't happen, but verify in case anything bypassed FK)
  const { data: books } = await supabase
    .from("books")
    .select("id, owner_id");
  if (books && books.length > 0) {
    const ownerIds = Array.from(
      new Set(books.map((b) => b.owner_id as string)),
    );
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .in("id", ownerIds);
    const liveIds = new Set((existing ?? []).map((p) => p.id as string));
    const orphans = books.filter((b) => !liveIds.has(b.owner_id as string));
    if (orphans.length > 0) {
      issues.push({
        type: "orphan-book",
        label: "Buku dengan owner yang tidak ada",
        severity: "high",
        count: orphans.length,
        suggestedFix:
          "Investigate via SQL: select * from books where owner_id not in (select id from profiles). FK cascade should normally prevent this — verify migration history.",
        sample: orphans.slice(0, 5).map((o) => o.id as string),
      });
    }
  }

  // 2. Profiles missing username (legacy or interrupted onboarding)
  const { data: noUsername, count: noUsernameCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact" })
    .is("username", null)
    .limit(5);
  if ((noUsernameCount ?? 0) > 0) {
    issues.push({
      type: "profile-no-username",
      label: "Profil tanpa username (onboarding belum selesai)",
      severity: "medium",
      count: noUsernameCount ?? 0,
      detail: "User signup tapi belum nyelesain step 1 onboarding.",
      suggestedFix:
        "Send onboarding nudge via email or kontak admin manual. /onboarding will surface them on next login (proxy.ts gate).",
      sample: (noUsername ?? []).map((p) => p.id as string),
    });
  }

  // 3. Profiles with no contact method (incomplete by isProfileComplete)
  const { data: profilesAll } = await supabase
    .from("profiles")
    .select("id, username, instagram, whatsapp, discord, goodreads_url, storygraph_url")
    .not("username", "is", null);
  const noContact = (profilesAll ?? []).filter((p) => {
    const r = p as Record<string, unknown>;
    return !r.instagram && !r.whatsapp && !r.discord && !r.goodreads_url && !r.storygraph_url;
  });
  if (noContact.length > 0) {
    issues.push({
      type: "profile-no-contact",
      label: "Profil tanpa kontak (IG/WA/Discord/Goodreads)",
      severity: "medium",
      count: noContact.length,
      detail: "Jika tidak punya kontak, user tidak bisa dijangkau buat pinjam buku.",
      suggestedFix:
        "Audit kontak — bisa nudge ke /profile/edit atau follow-up langsung kalau kenal.",
      sample: noContact.slice(0, 5).map((p) => (p as { id: string }).id),
    });
  }

  // 4. Profiles with no photo
  const { count: noPhotoCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .is("photo_url", null)
    .not("username", "is", null);
  if ((noPhotoCount ?? 0) > 0) {
    issues.push({
      type: "profile-no-photo",
      label: "Profil tanpa foto",
      severity: "low",
      count: noPhotoCount ?? 0,
      suggestedFix:
        "Soft nudge — bisa di-encourage di onboarding atau email weekly digest.",
    });
  }

  // 5. Books missing cover URL
  const { count: noCoverCount } = await supabase
    .from("books")
    .select("*", { count: "exact", head: true })
    .is("cover_url", null);
  if ((noCoverCount ?? 0) > 0) {
    issues.push({
      type: "book-no-cover",
      label: "Buku tanpa cover image",
      severity: "low",
      count: noCoverCount ?? 0,
      suggestedFix:
        "Bisa auto-fetch dari Open Library by ISBN (existing in lib/openlibrary.ts). Pertimbangkan re-trigger saat user edit.",
    });
  }

  // 6. Books missing genre
  const { count: noGenreCount } = await supabase
    .from("books")
    .select("*", { count: "exact", head: true })
    .is("genre", null);
  if ((noGenreCount ?? 0) > 0) {
    issues.push({
      type: "book-no-genre",
      label: "Buku tanpa genre",
      severity: "low",
      count: noGenreCount ?? 0,
      suggestedFix:
        "Genre opsional di form. Pertimbangkan auto-fill dari Open Library subject metadata.",
    });
  }

  // 7. Duplicate ISBN
  const { data: isbnRows } = await supabase
    .from("books")
    .select("id, isbn")
    .not("isbn", "is", null);
  const isbnCount = new Map<string, number>();
  for (const r of (isbnRows ?? []) as { id: string; isbn: string }[]) {
    const k = r.isbn.replace(/[-\s]/g, "").toLowerCase();
    isbnCount.set(k, (isbnCount.get(k) ?? 0) + 1);
  }
  const dups = Array.from(isbnCount.entries()).filter(([, n]) => n > 1);
  if (dups.length > 0) {
    issues.push({
      type: "book-duplicate-isbn",
      label: "ISBN terduplikasi (kemungkinan duplikat buku)",
      severity: "medium",
      count: dups.reduce((s, [, n]) => s + n, 0),
      detail: `${dups.length} ISBN unik muncul lebih dari sekali`,
      suggestedFix:
        "Tinjau manual — kadang dua orang punya buku yang sama (legitimate). Kalau satu owner punya dua, gabung atau tandai is_hidden=true.",
    });
  }

  // 8. Wanted requests open & stale (>60 days)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400 * 1000).toISOString();
  const { count: staleCount } = await supabase
    .from("wanted_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "open")
    .lt("created_at", sixtyDaysAgo);
  if ((staleCount ?? 0) > 0) {
    issues.push({
      type: "wanted-stale",
      label: "WTB \"open\" lebih dari 60 hari",
      severity: "low",
      count: staleCount ?? 0,
      suggestedFix: "Audit — tanya requester apakah masih dicari atau bisa di-close.",
    });
  }

  // 9. Activity_log integrity — actor pointing to deleted profile
  // (Same FK story as books.owner_id, but check anyway)
  const { data: actorIdsData } = await supabase
    .from("activity_log")
    .select("actor_user_id")
    .limit(1000);
  const distinctActors = Array.from(
    new Set((actorIdsData ?? []).map((r) => r.actor_user_id as string).filter(Boolean)),
  );
  if (distinctActors.length > 0) {
    const { data: existingActors } = await supabase
      .from("profiles")
      .select("id")
      .in("id", distinctActors);
    const liveSet = new Set((existingActors ?? []).map((p) => p.id as string));
    const missingActors = distinctActors.filter((id) => !liveSet.has(id));
    if (missingActors.length > 0) {
      issues.push({
        type: "activity-orphan",
        label: "Activity events dari user yang sudah dihapus",
        severity: "low",
        count: missingActors.length,
        suggestedFix:
          "FK cascade harusnya hapus — kalau muncul, periksa migration. Aman dibiarkan (event sudah punya snapshot via metadata).",
      });
    }
  }

  return issues.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });
}
