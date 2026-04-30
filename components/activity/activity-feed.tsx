import { Avatar } from "@/components/ui/avatar";
import { GatedLink } from "@/components/landing/gated-link";
import { formatRelativeID } from "@/lib/format";
import type { ActivityItem } from "@/lib/activity";
import { activityVerb, activityTargetUrl } from "./activity-copy";

/**
 * Compact "Aktivitas terbaru" widget — surfaces on /shelf default view AND
 * on the public landing page. Renders any event type (USER_JOINED /
 * BOOK_ADDED / BOOK_STATUS_CHANGED / WTB_POSTED).
 *
 * Row clicks use <GatedLink> which falls through to a regular <Link> when
 * no <LoginNudgeProvider> is in scope (i.e. on /shelf). On the public
 * landing, the provider intercepts anon clicks → invitation modal instead
 * of bouncing to /auth/login.
 */
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
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
        <GatedLink
          href="/aktivitas"
          className="ml-auto text-caption font-medium text-ink hover:underline underline-offset-4"
        >
          Lihat semua →
        </GatedLink>
      </div>
      <ul className="flex flex-col divide-y divide-hairline-soft">
        {items.map((it) => (
          <li key={it.id}>
            <Row item={it} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Row({ item }: { item: ActivityItem }) {
  const href = activityTargetUrl(item);
  const verb = activityVerb(item);
  const inner = (
    <>
      <Avatar src={item.actor?.photo_url} name={item.actor?.full_name} size={28} />
      <div className="min-w-0 flex-1">
        <p className="text-body-sm text-ink truncate">
          <span className="font-semibold">
            {item.actor?.full_name ?? item.actor?.username ?? "Anggota"}
          </span>{" "}
          <span className="text-ink-soft">{verb.text}</span>
        </p>
        <p className="text-caption text-muted">{formatRelativeID(item.created_at)}</p>
      </div>
      {item.book?.cover_url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={item.book.cover_url}
          alt=""
          className="w-8 h-11 rounded-[4px] object-cover border border-hairline shrink-0"
          loading="lazy"
        />
      )}
    </>
  );

  const className =
    "flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-card hover:bg-cream transition-colors";

  if (href) {
    return (
      <GatedLink href={href} className={className}>
        {inner}
      </GatedLink>
    );
  }
  return <div className={className}>{inner}</div>;
}
