import Link from "next/link";
import { notFound } from "next/navigation";
import { getMemberAdmin } from "@/lib/mastermind/users";
import { listNotesFor } from "@/lib/mastermind/admin-notes";
import { AdminNotesThread } from "@/components/mastermind/admin-notes-thread";
import { ScoreBadge } from "@/components/mastermind/score-badge";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeID } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await getMemberAdmin(id);
  if (!row) notFound();
  const p = row.profile;
  const notes = await listNotesFor("user", p.id);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Link
        href="/mastermind/users"
        className="text-body-sm text-ink-soft hover:text-ink underline underline-offset-4 decoration-hairline-strong"
      >
        ← Balik ke User Intelligence
      </Link>

      <header className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 md:p-6 flex flex-col sm:flex-row gap-5 items-start">
        <Avatar src={p.photo_url} name={p.full_name} size={88} isAdmin={p.is_admin} />
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-display-md text-ink leading-tight">
            {p.full_name ?? p.username ?? "—"}
          </h1>
          {p.username && (
            <p className="text-body-sm text-muted">
              <Link
                href={`/profile/${p.username}`}
                target="_blank"
                className="underline underline-offset-4 hover:text-ink"
              >
                @{p.username} ↗
              </Link>
            </p>
          )}
          {p.bio && <p className="mt-3 text-body text-ink-soft leading-relaxed">{p.bio}</p>}
          <div className="mt-3 flex gap-2 flex-wrap">
            <ScoreBadge score={row.completion.score} label="Profile" factors={row.completion.factors} size="md" />
            <ScoreBadge score={row.potential.score} label="Potential" factors={row.potential.factors} size="md" />
          </div>
        </div>
      </header>

      <section className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 md:p-6">
        <h2 className="font-display text-title-lg text-ink mb-3">Profile data</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-body-sm">
          <Row label="Joined" value={formatRelativeID(p.created_at)} />
          <Row label="Updated" value={formatRelativeID(p.updated_at)} />
          <Row label="Email" value="—" hint="Tidak terekspos di profiles tabel" />
          <Row label="City" value={p.city ?? "—"} />
          <Row label="Area" value={p.address_area ?? "—"} />
          <Row label="Postal code" value={p.postal_code ?? "—"} />
          <Row label="Profession" value={p.profession ?? "—"} />
          <Row label="Workplace/campus" value={p.campus_or_workplace ?? "—"} />
          <Row label="Instagram" value={p.instagram ?? "—"} />
          <Row label="WhatsApp" value={p.whatsapp ?? "—"} hint={p.whatsapp_public ? "Publik" : "Hidden default — masked di profiles_public"} />
          <Row label="Discord" value={p.discord ?? "—"} />
          <Row label="Goodreads" value={p.goodreads_url ?? "—"} />
          <Row label="StoryGraph" value={p.storygraph_url ?? "—"} />
          <Row label="LinkedIn" value={p.linkedin_url ?? "—"} />
          <Row label="Website" value={p.website_url ?? "—"} />
          <Row label="Show on map" value={p.show_on_map ? "Ya" : "Tidak"} />
          <Row label="Map coords" value={p.map_lat && p.map_lng ? `${p.map_lat.toFixed(4)}, ${p.map_lng.toFixed(4)}` : "—"} />
          <Row label="Open for lending" value={p.open_for_lending ? "Ya" : "Tidak"} />
          <Row label="Open for selling" value={p.open_for_selling ? "Ya" : "Tidak"} />
          <Row label="Open for trade" value={p.open_for_trade ? "Ya" : "Tidak"} />
          <Row label="Open for discussion" value={p.open_for_discussion ? "Ya" : "Tidak"} />
          <Row label="Interests (L1)" value={p.interests?.join(", ") ?? "—"} />
          <Row label="Sub interests (L2)" value={p.sub_interests?.join(", ") ?? "—"} />
          <Row label="Intents (L3)" value={p.intents?.join(", ") ?? "—"} />
          <Row label="Favorite genres" value={p.favorite_genres?.join(", ") ?? "—"} />
          <Row label="Currently reading book" value={p.currently_reading_book_id ?? "—"} />
          <Row label="is_admin" value={p.is_admin ? "Ya ✦" : "Tidak"} />
        </dl>
      </section>

      <section className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 md:p-6">
        <h2 className="font-display text-title-lg text-ink mb-2">Activity & contribution</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Books listed" value={row.bookCount} />
          <Stat label="Events 30d" value={row.activityLast30d} />
          <Stat label="Profile score" value={row.completion.score} />
          <Stat label="Potential" value={row.potential.score} />
        </dl>
      </section>

      <AdminNotesThread entityType="user" entityId={p.id} notes={notes} />
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <>
      <dt className="text-caption text-muted uppercase tracking-wide font-semibold" title={hint}>
        {label}
      </dt>
      <dd className="text-body-sm text-ink-soft truncate">{value}</dd>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-cream/60 border border-hairline-soft rounded-card p-3">
      <p className="text-caption text-muted uppercase tracking-wide font-semibold">{label}</p>
      <p className="font-display text-title-md text-ink leading-none mt-1">{value}</p>
    </div>
  );
}
