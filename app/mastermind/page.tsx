import Link from "next/link";
import { getMissionControl } from "@/lib/mastermind/metrics";
import { getFounderPulse } from "@/lib/mastermind/pulse";
import { createClient } from "@/lib/supabase/server";
import { KpiCard, MetricGrid } from "@/components/mastermind/kpi-card";
import { FounderPulseCard } from "@/components/mastermind/founder-pulse";

export const dynamic = "force-dynamic";

/**
 * Mission Control — top-level founder cockpit overview. Every metric is
 * live-computed from real app data (no fake numbers). For sections that
 * still need instrumentation (loan ledger, events, decisions), we link to
 * their empty-state shells instead of inventing numbers.
 */
export default async function MissionControlPage() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [m, pulse, manifestsPendingX, eventsPendingDiscord] = await Promise.all([
    getMissionControl(),
    getFounderPulse(),
    // Slice 7B: Distribution queue (read-only, admin-only via layout gate).
    // Inline queries — no new lib/mastermind helper needed for this small read.
    supabase
      .from("manifests")
      .select("id, body, topic, created_at")
      .eq("status", "approved")
      .eq("visibility", "public")
      .is("x_posted_url", null)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("events")
      .select("id, title, starts_at")
      .eq("is_hidden", false)
      .eq("status", "scheduled")
      .gte("starts_at", nowIso)
      .is("discord_announced_at", null)
      .order("starts_at", { ascending: true })
      .limit(5),
  ]);

  const manifestQueue = (manifestsPendingX.data ?? []) as Array<{
    id: string;
    body: string;
    topic: string | null;
    created_at: string;
  }>;
  const eventQueue = (eventsPendingDiscord.data ?? []) as Array<{
    id: string;
    title: string;
    starts_at: string;
  }>;

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <header>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Mission Control · Q2 2026
        </p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Live system, in one cockpit.
        </h1>
        <p className="mt-2 text-body text-ink-soft max-w-2xl">
          Setiap angka di sini real — di-pull dari Supabase saat halaman ini di-load. Section yang
          masih perlu instrumentasi (loans, events, decisions, product lab) di-link ke empty-state,
          bukan dipalsukan.
        </p>
      </header>

      <FounderPulseCard pulse={pulse} />

      {/* Slice 7B: Distribution queue — admin-only, read-only. Surfaces items
          ready to share to X or announce to Discord. Each row links to the
          detail page where the existing share controls live. */}
      <SectionHeader title="Antrian distribusi" />
      <div className="grid md:grid-cols-2 gap-4">
        <DistributionCard
          label="Manifest, belum di-share ke X"
          count={manifestQueue.length}
          empty="Semua approved manifest sudah di-share."
          items={manifestQueue.map((m) => ({
            href: `/manifest/${m.id}`,
            primary: m.topic ?? truncate(m.body, 60),
            secondary: formatShortDate(m.created_at),
          }))}
        />
        <DistributionCard
          label="Event mendatang, belum di-announce ke Discord"
          count={eventQueue.length}
          empty="Semua event mendatang sudah di-announce."
          items={eventQueue.map((e) => ({
            href: `/event/${e.id}`,
            primary: e.title,
            secondary: formatShortDate(e.starts_at),
          }))}
        />
      </div>

      <SectionHeader
        title="Anggota"
        link={{ href: "/mastermind/users", label: "User Intelligence →" }}
      />
      <MetricGrid cols={4}>
        <KpiCard label="Total anggota" value={m.totalMembers} />
        <KpiCard
          label="Baru minggu ini"
          value={m.newMembersThisWeek}
          pillTone={m.newMembersThisWeek > 0 ? "positive" : "neutral"}
          pill={m.newMembersThisWeek > 0 ? "+ live" : "—"}
        />
        <KpiCard
          label="Profil lengkap"
          value={m.completedProfiles}
          sub={
            m.totalMembers === 0
              ? "—"
              : `${Math.round((m.completedProfiles / m.totalMembers) * 100)}% dari ${m.totalMembers}`
          }
          pillTone={
            m.completedProfiles / Math.max(1, m.totalMembers) >= 0.8 ? "positive" : "warning"
          }
        />
        <KpiCard
          label="Profil incomplete"
          value={m.incompleteProfiles}
          sub="Username/kontak kurang"
          pillTone={m.incompleteProfiles > 0 ? "warning" : "positive"}
        />
        <KpiCard
          label="Anggota dengan ≥1 buku"
          value={m.membersWithBook}
          sub={
            m.totalMembers === 0
              ? "—"
              : `${Math.round((m.membersWithBook / m.totalMembers) * 100)}% dari ${m.totalMembers}`
          }
          hint="Target Q2 2026: 80% (KR Q2-2026-O2-KR3)"
        />
        <KpiCard
          label="Active mingguan"
          value={m.weeklyActiveMembers}
          sub="Distinct actor di activity_log 7d"
          hint="Target Q2 2026: 30 (KR Q2-2026-O1-KR5)"
        />
      </MetricGrid>

      <SectionHeader
        title="Buku"
        link={{ href: "/mastermind/books", label: "Book Intelligence →" }}
      />
      <MetricGrid cols={4}>
        <KpiCard
          label="Total buku"
          value={m.totalBooks}
          hint="Target Q2 2026: 300 (KR Q2-2026-O2-KR1)"
        />
        <KpiCard label="Available" value={m.booksAvailable} sub="status sell / lend / trade" />
        <KpiCard label="Unavailable" value={m.booksUnavailable} sub="status unavailable" />
        <KpiCard
          label="Tanpa cover"
          value={m.booksMissingCover}
          pillTone={m.booksMissingCover > 0 ? "warning" : "positive"}
        />
      </MetricGrid>

      <SectionHeader
        title="Dicari (WTB)"
        link={{ href: "/mastermind/requests", label: "Lihat semua →" }}
      />
      <MetricGrid cols={3}>
        <KpiCard
          label="Open"
          value={m.wantedOpen}
          pillTone={m.wantedOpen > 0 ? "warning" : "neutral"}
        />
        <KpiCard label="Fulfilled" value={m.wantedFulfilled} />
        <KpiCard label="Closed" value={m.wantedClosed} />
      </MetricGrid>

      <SectionHeader
        title="Tasks (Q2 2026)"
        link={{ href: "/mastermind/team", label: "Team Tracker →" }}
      />
      <MetricGrid cols={4}>
        <KpiCard label="Total tasks" value={m.tasksTotal} />
        <KpiCard label="Done" value={m.tasksDone} pillTone="positive" />
        <KpiCard
          label="Blocked"
          value={m.tasksBlocked}
          pillTone={m.tasksBlocked > 0 ? "negative" : "neutral"}
        />
        <KpiCard
          label="Punya owner"
          value={`${m.tasksOwnedPct}%`}
          sub="Target: 100% (KR Q2-2026-O5-KR1)"
          pillTone={m.tasksOwnedPct >= 100 ? "positive" : "warning"}
        />
      </MetricGrid>

      <SectionHeader
        title="Komunitas"
        link={{ href: "/mastermind/community", label: "Community Intelligence →" }}
      />
      <MetricGrid cols={4}>
        <KpiCard label="Activity 7d" value={m.activityLast7d} sub="event log" />
        <KpiCard label="Activity 30d" value={m.activityLast30d} sub="event log" />
        <KpiCard label="Distinct kota" value={m.distinctCities} />
        <KpiCard label="Distinct kecamatan" value={m.distinctAreas} />
      </MetricGrid>

      <SectionHeader
        title="Quality & ops"
        link={{ href: "/mastermind/data-health", label: "Data Health →" }}
      />
      <MetricGrid cols={3}>
        <KpiCard
          label="Feedback open"
          value={m.feedbackOpen}
          sub="status: new / triaged"
          pillTone={m.feedbackOpen > 0 ? "warning" : "positive"}
        />
        <KpiCard label="Audit events 7d" value={m.auditEventsLast7d} />
        <KpiCard
          label="Tasks blocked"
          value={m.tasksBlocked}
          pillTone={m.tasksBlocked > 0 ? "negative" : "neutral"}
        />
      </MetricGrid>

      <p className="mt-2 text-caption text-muted">
        Mastermind v1 (PR 1) — foundation + 7 section. Section dengan badge{" "}
        <span className="inline-flex items-center h-4 px-1 rounded-pill bg-cream text-muted border border-hairline text-[9px] font-semibold">
          P2
        </span>
        {" / "}
        <span className="inline-flex items-center h-4 px-1 rounded-pill bg-cream text-muted border border-hairline text-[9px] font-semibold">
          P3
        </span>{" "}
        butuh instrumentation tambahan — lihat empty-state masing-masing.
      </p>
    </div>
  );
}

function SectionHeader({ title, link }: { title: string; link?: { href: string; label: string } }) {
  return (
    <div className="flex items-end justify-between gap-2 -mb-1 mt-2">
      <h2 className="font-display text-title-lg text-ink leading-tight">{title}</h2>
      {link && (
        <Link
          href={link.href}
          className="text-body-sm text-ink-soft hover:text-ink underline underline-offset-4 decoration-hairline-strong hover:decoration-ink"
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}

interface DistributionRow {
  href: string;
  primary: string;
  secondary: string;
}

function DistributionCard({
  label,
  count,
  empty,
  items,
}: {
  label: string;
  count: number;
  empty: string;
  items: DistributionRow[];
}) {
  return (
    <div className="rounded-card-lg border border-hairline bg-paper p-4 md:p-5">
      <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-1">{label}</p>
      <p className="font-display text-display-md text-ink leading-none">{count}</p>
      {count === 0 ? (
        <p className="mt-3 text-caption text-muted leading-relaxed">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-1.5 border-t border-hairline-soft pt-3">
          {items.map((row) => (
            <li key={row.href}>
              <Link
                href={row.href}
                className="flex items-center justify-between gap-3 text-body-sm hover:bg-cream rounded-card-lg px-2 py-1.5 -mx-2 transition-colors"
              >
                <span className="text-ink truncate min-w-0">{row.primary}</span>
                <span className="text-caption text-muted shrink-0">{row.secondary}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  });
}
