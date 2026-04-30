import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelativeID } from "@/lib/format";
import type { ActivityItem } from "@/lib/activity";
import { activityVerb, activityTargetUrl } from "./activity-copy";

/**
 * Long-format activity feed for the /aktivitas page. Supports all event types
 * (USER_JOINED / BOOK_ADDED / BOOK_STATUS_CHANGED / WTB_POSTED). Day-bucketed.
 */
export function ActivityFeedList({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
        <p className="font-display text-title-lg text-ink">Belum ada aktivitas.</p>
        <p className="mt-2 text-body text-muted">
          Anggota komunitas belum bergerak. Lo bisa jadi yang pertama →
        </p>
      </div>
    );
  }

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
              <ActivityRow key={it.id} item={it} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const ownerHref = item.actor?.username ? `/profile/${item.actor.username}` : null;
  const targetHref = activityTargetUrl(item);
  const verb = activityVerb(item);

  return (
    <li className="bg-paper border border-hairline rounded-card-lg p-4 md:p-5 shadow-card hover:shadow-card-hover transition-shadow">
      {/* Header: who + when */}
      <div className="flex items-center gap-3 mb-3">
        {ownerHref ? (
          <Link href={ownerHref} className="flex items-center gap-2.5 hover:opacity-80">
            <Avatar src={item.actor?.photo_url} name={item.actor?.full_name} size={36} />
            <div>
              <p className="text-body-sm font-semibold text-ink leading-tight">
                {item.actor?.full_name ?? item.actor?.username ?? "Anggota"}
              </p>
              {item.actor?.username && (
                <p className="text-caption text-muted leading-tight">@{item.actor.username}</p>
              )}
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2.5">
            <Avatar src={item.actor?.photo_url} name={item.actor?.full_name} size={36} />
            <p className="text-body-sm font-semibold text-ink">
              {item.actor?.full_name ?? "Anggota"}
            </p>
          </div>
        )}
        <span className="ml-auto text-caption text-muted">
          {formatRelativeID(item.created_at)}
        </span>
      </div>

      {/* Action verb */}
      <p className="text-body-sm text-ink-soft mb-3">{verb.text}</p>

      {/* Target — varies by event type */}
      {item.book && (
        <Link
          href={targetHref ?? `/book/${item.book.id}`}
          className="flex gap-4 -m-1 p-1 rounded-card hover:bg-cream transition-colors"
        >
          <div className="w-20 h-28 md:w-24 md:h-32 shrink-0 rounded-card overflow-hidden bg-cream border border-hairline">
            {item.book.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.book.cover_url}
                alt={item.book.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-2">
                <p className="font-display text-caption text-ink line-clamp-3 text-center">
                  {item.book.title}
                </p>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <h3 className="font-display text-title-md text-ink leading-tight line-clamp-2">
              {item.book.title}
            </h3>
            <p className="mt-1 text-body-sm text-muted line-clamp-1">{item.book.author}</p>
            <div className="mt-2">
              <StatusBadge status={item.book.status} />
            </div>
          </div>
        </Link>
      )}

      {item.wanted && !item.book && (
        <Link
          href={targetHref ?? "/wanted"}
          className="block -m-1 p-3 rounded-card border border-hairline-strong border-dashed hover:bg-cream transition-colors"
        >
          <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-1">
            Wanted
          </p>
          <p className="font-display text-title-md text-ink leading-tight">
            {item.wanted.title}
          </p>
          {item.wanted.author && (
            <p className="text-body-sm text-muted">oleh {item.wanted.author}</p>
          )}
        </Link>
      )}

      {item.type === "USER_JOINED" && item.actor && (
        <Link
          href={ownerHref ?? "#"}
          className="inline-flex items-center gap-1 text-caption text-ink-soft hover:text-ink underline underline-offset-4"
        >
          Lihat profil →
        </Link>
      )}
    </li>
  );
}

interface Bucket {
  label: string;
  items: ActivityItem[];
}

function bucketByDay(items: ActivityItem[]): Bucket[] {
  const now = new Date();
  const today = startOfDay(now).getTime();
  const yesterday = today - 86400000;
  const week = today - 7 * 86400000;
  const month = today - 30 * 86400000;

  const groups: Record<string, ActivityItem[]> = {
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
