import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookAdmin } from "@/lib/mastermind/books";
import { listNotesFor } from "@/lib/mastermind/admin-notes";
import { AdminNotesThread } from "@/components/mastermind/admin-notes-thread";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeID } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BookAdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await getBookAdmin(id);
  if (!row) notFound();
  const b = row.book;
  const notes = await listNotesFor("book", b.id);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Link
        href="/mastermind/books"
        className="text-body-sm text-ink-soft hover:text-ink underline underline-offset-4 decoration-hairline-strong"
      >
        ← Balik ke Book Intelligence
      </Link>

      <header className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 md:p-6 flex flex-col sm:flex-row gap-5">
        <div className="shrink-0 w-32 h-44 bg-cream rounded-card border border-hairline-soft overflow-hidden">
          {b.cover_url ? (
            <img src={b.cover_url} alt={b.title} width={128} height={176} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted text-display-md">📕</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">Book detail</p>
          <h1 className="mt-1 font-display text-display-md text-ink leading-tight">{b.title}</h1>
          <p className="mt-1 text-body-sm text-muted">{b.author}</p>
          <div className="mt-3 flex gap-2 flex-wrap">
            <StatusBadge status={b.status} />
            <span className="inline-flex items-center h-6 px-2 rounded-pill bg-cream text-ink-soft border border-hairline text-[11px] font-semibold tracking-wide">
              {b.condition}
            </span>
            <span className="inline-flex items-center h-6 px-2 rounded-pill bg-cream text-ink-soft border border-hairline text-[11px] font-semibold tracking-wide">
              {b.visibility}
            </span>
            {b.is_featured && (
              <span className="inline-flex items-center h-6 px-2 rounded-pill bg-(--color-okr-on-track-bg) text-(--color-okr-on-track) text-[11px] font-semibold tracking-wide">
                ★ Featured
              </span>
            )}
            {b.is_hidden && (
              <span className="inline-flex items-center h-6 px-2 rounded-pill bg-(--color-okr-behind-bg) text-(--color-okr-behind) text-[11px] font-semibold tracking-wide">
                Hidden
              </span>
            )}
          </div>
          {row.flags.length > 0 && (
            <div className="mt-3 flex gap-1 flex-wrap">
              {row.flags.map((f) => (
                <span key={f} className="inline-flex items-center h-5 px-1.5 rounded-pill bg-(--color-okr-at-risk-bg) text-(--color-okr-at-risk) text-[10px] font-semibold tracking-wide">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <section className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 md:p-6">
        <h2 className="font-display text-title-lg text-ink mb-3">Owner</h2>
        {row.owner ? (
          <Link
            href={`/mastermind/users/${row.owner.id}`}
            className="flex items-center gap-3 bg-cream/40 hover:bg-cream border border-hairline-soft hover:border-hairline rounded-card p-3 transition-colors"
          >
            <Avatar src={row.owner.photo_url} name={row.owner.full_name} size={40} />
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-ink truncate">
                {row.owner.full_name ?? row.owner.username ?? "—"}
              </p>
              {row.owner.username && (
                <p className="text-caption text-muted truncate">@{row.owner.username}</p>
              )}
            </div>
          </Link>
        ) : (
          <p className="text-body-sm text-(--color-okr-behind)">⚠ Owner missing — investigate.</p>
        )}
      </section>

      <section className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 md:p-6">
        <h2 className="font-display text-title-lg text-ink mb-3">Metadata</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-body-sm">
          <Row label="ISBN" value={b.isbn ?? "—"} />
          <Row label="Genre" value={b.genre ?? "—"} />
          <Row label="Language" value={b.language} />
          <Row label="Publisher" value={b.publisher ?? "—"} />
          <Row label="Price" value={b.price ? `Rp ${b.price.toLocaleString("id-ID")}` : "—"} />
          <Row label="Negotiable" value={b.negotiable ? "Ya" : "Tidak"} />
          <Row label="Lending duration" value={b.lending_duration_days ? `${b.lending_duration_days} hari` : "—"} />
          <Row label="Deposit" value={b.deposit_required ? `Rp ${b.deposit_amount?.toLocaleString("id-ID") ?? "?"}` : "—"} />
          <Row label="Pickup area" value={b.pickup_area ?? "—"} />
          <Row label="Contact method" value={b.contact_method} />
          <Row label="Source" value={b.source} />
          <Row label="Created" value={formatRelativeID(b.created_at)} />
          <Row label="Updated" value={formatRelativeID(b.updated_at)} />
        </dl>
        {b.description && (
          <div className="mt-4 pt-4 border-t border-hairline-soft">
            <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-1">
              Description
            </p>
            <p className="text-body-sm text-ink-soft whitespace-pre-wrap leading-relaxed">
              {b.description}
            </p>
          </div>
        )}
      </section>

      <AdminNotesThread entityType="book" entityId={b.id} notes={notes} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-caption text-muted uppercase tracking-wide font-semibold">{label}</dt>
      <dd className="text-body-sm text-ink-soft truncate">{value}</dd>
    </>
  );
}
