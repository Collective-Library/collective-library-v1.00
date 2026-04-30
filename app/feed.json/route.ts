import { listActivity, type ActivityItem } from "@/lib/activity";
import { activityVerb } from "@/components/activity/activity-copy";
import { getAppUrl } from "@/lib/url";

/**
 * JSON Feed 1.1 — modern alternative to RSS. Some Discord bots and aggregators
 * prefer it; same payload, less XML pain.
 *
 * Spec: https://jsonfeed.org/version/1.1
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await listActivity(50);
  const base = getAppUrl();
  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "Collective Library — Aktivitas Komunitas",
    description:
      "Buku baru, WTB request, dan anggota baru di Collective Library.",
    home_page_url: `${base}/aktivitas`,
    feed_url: `${base}/feed.json`,
    language: "id-ID",
    items: items.map((it) => itemToJson(it, base)),
  };
  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}

function itemToJson(item: ActivityItem, base: string) {
  const verb = activityVerb(item);
  const actorName = item.actor?.full_name ?? item.actor?.username ?? "Anggota";
  const title = `${actorName} ${verb.text}`;

  let url = `${base}/aktivitas`;
  if (item.book?.id) url = `${base}/book/${item.book.id}`;
  else if (item.type === "WTB_POSTED") url = `${base}/wanted`;
  else if (item.type === "USER_JOINED" && item.actor?.username)
    url = `${base}/profile/${item.actor.username}`;

  const summaryParts: string[] = [];
  if (item.book) summaryParts.push(`${item.book.title} — ${item.book.author}`);
  if (item.wanted)
    summaryParts.push(
      `${item.wanted.title}${item.wanted.author ? ` — ${item.wanted.author}` : ""}`,
    );
  const summary = summaryParts.join(" · ") || undefined;

  return {
    id: `cl-activity-${item.id}`,
    url,
    title,
    summary,
    image: item.book?.cover_url ?? undefined,
    date_published: new Date(item.created_at).toISOString(),
    authors: item.actor
      ? [
          {
            name: actorName,
            url: item.actor.username ? `${base}/profile/${item.actor.username}` : undefined,
            avatar: item.actor.photo_url ?? undefined,
          },
        ]
      : undefined,
    tags: [item.type.toLowerCase().replace(/_/g, "-")],
  };
}
