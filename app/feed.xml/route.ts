import { listActivity, type ActivityItem } from "@/lib/activity";
import { activityVerb } from "@/components/activity/activity-copy";
import { getAppUrl } from "@/lib/url";

/**
 * Public RSS 2.0 feed of community activity.
 *
 * Designed for Discord bots (MonitoRSS, RSSHub, etc) to subscribe and post
 * updates into a community channel. Cache-headers tuned for ~5 minute polls.
 *
 * Includes book covers as <enclosure> + <media:thumbnail> so Discord embeds
 * render with the right artwork.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEMS = 50;

export async function GET() {
  const items = await listActivity(ITEMS);
  const xml = renderRss(items);
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}

function renderRss(items: ActivityItem[]): string {
  const base = getAppUrl();
  const channelTitle = "Collective Library — Aktivitas Komunitas";
  const channelDescription =
    "Buku baru, WTB request, dan anggota baru di Collective Library. Subscribe via Discord bot biar otomatis ke channel komunitas lo.";
  const channelLink = `${base}/aktivitas`;
  const lastBuild = items.length > 0 ? rfc822(items[0].created_at) : rfc822(new Date().toISOString());
  const atomLink = `${base}/feed.xml`;

  const itemsXml = items.map((it) => renderItem(it, base)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>id-ID</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${escapeXml(atomLink)}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;
}

function renderItem(item: ActivityItem, base: string): string {
  const verb = activityVerb(item);
  const actorName = item.actor?.full_name ?? item.actor?.username ?? "Anggota";
  const title = `${actorName} ${verb.text}`;

  // Best-effort permalink
  let link = `${base}/aktivitas`;
  if (item.book?.id) link = `${base}/book/${item.book.id}`;
  else if (item.type === "WTB_POSTED") link = `${base}/wanted`;
  else if (item.type === "USER_JOINED" && item.actor?.username)
    link = `${base}/profile/${item.actor.username}`;

  // Description: longer-form context, plain text + Markdown-ish
  const descParts: string[] = [];
  if (item.book) {
    descParts.push(`📖 ${item.book.title} — ${item.book.author}`);
  }
  if (item.wanted) {
    descParts.push(`🔍 ${item.wanted.title}${item.wanted.author ? ` — ${item.wanted.author}` : ""}`);
  }
  if (item.actor?.username) {
    descParts.push(`👤 @${item.actor.username}`);
  }
  const description = descParts.join("\n");

  const cover = item.book?.cover_url;
  const enclosure = cover
    ? `\n      <enclosure url="${escapeXml(cover)}" type="image/jpeg" length="0" />\n      <media:thumbnail url="${escapeXml(cover)}" />`
    : "";

  return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">cl-activity-${item.id}</guid>
      <pubDate>${rfc822(item.created_at)}</pubDate>
      <dc:creator>${escapeXml(actorName)}</dc:creator>
      <category>${item.type}</category>
      <description>${escapeXml(description)}</description>${enclosure}
    </item>`;
}

function rfc822(iso: string): string {
  const d = new Date(iso);
  return d.toUTCString();
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
