import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelativeID } from "@/lib/format";
import type { RecentBookActivity } from "@/lib/books";

/**
 * Long-format activity feed for the /aktivitas page.
 * IG-2017-style rows — each entry has a bigger cover, full meta, and is
 * directly clickable to its book detail. Group headers split by day.
 */
export function ActivityFeedList({ items }: { items: RecentBookActivity[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
        <p className="font-display text-title-lg text-ink">Belum ada aktivitas.</p>
        <p className="mt-2 text-body text-muted">
          Anggota komunitas belum nambahin buku. Lo bisa jadi yang pertama →
        </p>
      </div>
    );
  }

  // Group by day bucket: today / yesterday / "X hari lalu"
  const buckets = bucketByDay(items);

  return (
    <div className="flex flex-col gap-7">
      {buckets.map((bucket) => (
        <section key={bucket.label}>
          <h2 className="text-caption font-semibold text-muted uppercase tracking-wide mb-3">
            {bucket.label}
          </h2>
          <ul className="flex flex-col gap-3">
            {bucket.items.map((it) => (
              <ActivityRow key={it.book_id} item={it} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ActivityRow({ item }: { item: RecentBookActivity }) {
  const ownerHref = item.owner_username
    ? `/profile/${item.owner_username}`
    : null;

  return (
    <li className="bg-paper border border-hairline rounded-card-lg p-4 md:p-5 shadow-card hover:shadow-card-hover transition-shadow">
      {/* Header: who + when */}
      <div className="flex items-center gap-3 mb-3">
        {ownerHref ? (
          <Link href={ownerHref} className="flex items-center gap-2.5 hover:opacity-80">
            <Avatar src={item.owner_photo} name={item.owner_name} size={36} />
            <div>
              <p className="text-body-sm font-semibold text-ink leading-tight">
                {item.owner_name ?? item.owner_username}
              </p>
              <p className="text-caption text-muted leading-tight">
                @{item.owner_username}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2.5">
            <Avatar src={item.owner_photo} name={item.owner_name} size={36} />
            <p className="text-body-sm font-semibold text-ink">
              {item.owner_name ?? "Anggota"}
            </p>
          </div>
        )}
        <span className="ml-auto text-caption text-muted">
          {formatRelativeID(item.created_at)}
        </span>
      </div>

      {/* Action verb */}
      <p className="text-body-sm text-ink-soft mb-3">
        menambahkan buku ke rak komunitas
      </p>

      {/* Book card row — clickable */}
      <Link
        href={`/book/${item.book_id}`}
        className="flex gap-4 -m-1 p-1 rounded-card hover:bg-cream transition-colors"
      >
        <div className="w-20 h-28 md:w-24 md:h-32 shrink-0 rounded-card overflow-hidden bg-cream border border-hairline">
          {item.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.cover_url}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-2">
              <p className="font-display text-caption text-ink line-clamp-3 text-center">
                {item.title}
              </p>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <h3 className="font-display text-title-md text-ink leading-tight line-clamp-2">
            {item.title}
          </h3>
          <p className="mt-1 text-body-sm text-muted line-clamp-1">
            {item.author}
          </p>
          <div className="mt-2">
            <StatusBadge status={item.status} />
          </div>
        </div>
      </Link>
    </li>
  );
}

interface Bucket {
  label: string;
  items: RecentBookActivity[];
}

function bucketByDay(items: RecentBookActivity[]): Bucket[] {
  const now = new Date();
  const today = startOfDay(now).getTime();
  const yesterday = today - 86400000;
  const week = today - 7 * 86400000;
  const month = today - 30 * 86400000;

  const groups: Record<string, RecentBookActivity[]> = {
    "Hari ini": [],
    "Kemarin": [],
    "Minggu ini": [],
    "Bulan ini": [],
    "Lebih lama": [],
  };
  for (const it of items) {
    const t = new Date(it.created_at).getTime();
    if (t >= today) groups["Hari ini"].push(it);
    else if (t >= yesterday) groups["Kemarin"].push(it);
    else if (t >= week) groups["Minggu ini"].push(it);
    else if (t >= month) groups["Bulan ini"].push(it);
    else groups["Lebih lama"].push(it);
  }
  return Object.entries(groups)
    .filter(([, arr]) => arr.length > 0)
    .map(([label, arr]) => ({ label, items: arr }));
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
