import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeID } from "@/lib/format";
import type { RecentBookActivity } from "@/lib/books";

/**
 * "Aktivitas terbaru" — 3-5 line widget showing recent book additions.
 * Reads from books.created_at; upgrade to a real activity_log table when
 * we need cross-entity events (joins, WTBs, profile updates).
 */
export function ActivityFeed({ items }: { items: RecentBookActivity[] }) {
  if (items.length === 0) return null;

  return (
    <section
      className="rounded-card-lg border border-hairline bg-paper p-4 md:p-5"
      aria-label="Aktivitas terbaru"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-pill bg-cream text-ink text-[11px]" aria-hidden>✦</span>
        <p className="text-caption font-semibold text-ink-soft uppercase tracking-wide">
          Aktivitas terbaru
        </p>
        <Link
          href="/aktivitas"
          className="ml-auto text-caption font-medium text-ink hover:underline underline-offset-4"
        >
          Lihat semua →
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-hairline-soft">
        {items.map((it) => (
          <li key={it.book_id}>
            <Link
              href={`/book/${it.book_id}`}
              className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-card hover:bg-cream transition-colors"
            >
              <Avatar src={it.owner_photo} name={it.owner_name} size={28} />
              <div className="min-w-0 flex-1">
                <p className="text-body-sm text-ink truncate">
                  {it.owner_username ? (
                    <span className="font-semibold">{it.owner_name ?? it.owner_username}</span>
                  ) : (
                    <span className="font-semibold">Anggota</span>
                  )}{" "}
                  <span className="text-ink-soft">menambahkan</span>{" "}
                  <span className="font-medium">{it.title}</span>
                </p>
                <p className="text-caption text-muted">{formatRelativeID(it.created_at)}</p>
              </div>
              {it.cover_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={it.cover_url}
                  alt=""
                  className="w-8 h-11 rounded-[4px] object-cover border border-hairline shrink-0"
                  loading="lazy"
                />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
