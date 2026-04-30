import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/url";

/**
 * Supabase Database Webhook → Discord channel relay.
 *
 * Setup:
 * 1. Create a Discord webhook URL in your community channel
 *    (Channel → Edit → Integrations → Webhooks → Copy URL)
 * 2. Vercel env: DISCORD_COMMUNITY_WEBHOOK_URL=<discord webhook>
 *    (and a shared secret: DISCORD_WEBHOOK_SECRET=<random string>)
 * 3. Supabase Dashboard → Database → Webhooks → Create:
 *    - Table: activity_log
 *    - Events: INSERT
 *    - HTTP method: POST
 *    - URL: https://<your-app>/api/discord-webhook
 *    - HTTP headers: Authorization=Bearer <DISCORD_WEBHOOK_SECRET>
 *    - Save → enable
 *
 * On every new activity row, Supabase POSTs the row here. We enrich it with
 * actor + book + wanted via service-role, format a Discord embed, and POST
 * to the Discord webhook.
 */

export const runtime = "nodejs";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_COMMUNITY_WEBHOOK_URL;
const SHARED_SECRET = process.env.DISCORD_WEBHOOK_SECRET;

const STATUS_LABEL: Record<string, string> = {
  sell: "Dijual",
  lend: "Dipinjamkan",
  trade: "Ditukar",
  unavailable: "Koleksi",
};

const TYPE_COPY: Record<string, { label: string; color: number }> = {
  USER_JOINED: { label: "Anggota baru", color: 0xc2410c },
  BOOK_ADDED: { label: "Buku baru di rak", color: 0x166534 },
  BOOK_STATUS_CHANGED: { label: "Update status buku", color: 0x6d28d9 },
  WTB_POSTED: { label: "Buku dicari", color: 0xb45309 },
};

interface SupabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: {
    id: string;
    actor_user_id: string | null;
    type: keyof typeof TYPE_COPY;
    book_id: string | null;
    wanted_id: string | null;
    metadata: { old_status?: string; new_status?: string } | null;
    created_at: string;
  };
  old_record: unknown;
}

export async function POST(request: NextRequest) {
  // Auth check — only accept requests carrying our shared secret
  if (SHARED_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${SHARED_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!DISCORD_WEBHOOK_URL) {
    // Webhook not configured — accept but no-op
    return NextResponse.json({ ok: true, skipped: "no webhook configured" });
  }

  let payload: SupabaseWebhookPayload;
  try {
    payload = (await request.json()) as SupabaseWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "activity_log") {
    return NextResponse.json({ ok: true, skipped: "not activity_log INSERT" });
  }

  const row = payload.record;
  const supabase = createAdminClient();

  // Enrich actor (any logged-in profile)
  let actorName = "Anggota";
  let actorUsername: string | null = null;
  let actorPhoto: string | null = null;
  if (row.actor_user_id) {
    const { data: actor } = await supabase
      .from("profiles_public")
      .select("full_name, username, photo_url")
      .eq("id", row.actor_user_id)
      .maybeSingle();
    if (actor) {
      actorName = actor.full_name ?? actor.username ?? "Anggota";
      actorUsername = actor.username as string | null;
      actorPhoto = actor.photo_url as string | null;
    }
  }

  // Enrich book / wanted
  type BookCtx = { title: string; author: string; cover_url: string | null; status: string };
  type WantedCtx = { title: string; author: string | null };
  let book: BookCtx | null = null;
  if (row.book_id) {
    const { data: b } = await supabase
      .from("books")
      .select("title, author, cover_url, status")
      .eq("id", row.book_id)
      .maybeSingle();
    if (b) book = b as unknown as BookCtx;
  }
  let wanted: WantedCtx | null = null;
  if (row.wanted_id) {
    const { data: w } = await supabase
      .from("wanted_requests")
      .select("title, author")
      .eq("id", row.wanted_id)
      .maybeSingle();
    if (w) wanted = w as unknown as WantedCtx;
  }

  const embed = buildEmbed(row, actorName, actorUsername, actorPhoto, book, wanted);
  if (!embed) {
    return NextResponse.json({ ok: true, skipped: "no embed for type" });
  }

  // POST to Discord
  const r = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Collective Library",
      avatar_url: `${getAppUrl()}/logo.svg`,
      embeds: [embed],
    }),
  });

  if (!r.ok) {
    const text = await r.text();
    console.error("Discord webhook failed", r.status, text);
    return NextResponse.json({ error: "discord webhook failed", status: r.status }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

function buildEmbed(
  row: SupabaseWebhookPayload["record"],
  actorName: string,
  actorUsername: string | null,
  actorPhoto: string | null,
  book: { title: string; author: string; cover_url: string | null; status: string } | null,
  wanted: { title: string; author: string | null } | null,
) {
  const cfg = TYPE_COPY[row.type];
  if (!cfg) return null;
  const base = getAppUrl();
  const profileUrl = actorUsername ? `${base}/profile/${actorUsername}` : null;

  let title = "";
  let description = "";
  let url = `${base}/aktivitas`;
  let thumbnail: string | null = null;

  switch (row.type) {
    case "USER_JOINED":
      title = `${actorName} bergabung di Collective Library`;
      description = profileUrl ? `[Lihat profil →](${profileUrl})` : "";
      url = profileUrl ?? url;
      break;
    case "BOOK_ADDED": {
      const verb = book ? STATUS_LABEL[book.status] ?? "Koleksi" : "rak";
      title = `${actorName} nambahin buku`;
      description = book
        ? `**${book.title}** — ${book.author}\nStatus: ${verb}`
        : "Buku baru ditambahkan.";
      thumbnail = book?.cover_url ?? null;
      url = row.book_id ? `${base}/book/${row.book_id}` : url;
      break;
    }
    case "BOOK_STATUS_CHANGED": {
      const newStatus = row.metadata?.new_status ?? book?.status ?? "unavailable";
      title = `${actorName} buka buku untuk ${STATUS_LABEL[newStatus] ?? newStatus}`;
      description = book
        ? `**${book.title}** — ${book.author}`
        : "Status buku berubah.";
      thumbnail = book?.cover_url ?? null;
      url = row.book_id ? `${base}/book/${row.book_id}` : url;
      break;
    }
    case "WTB_POSTED": {
      title = `${actorName} cari buku`;
      description = wanted
        ? `**${wanted.title}**${wanted.author ? ` — ${wanted.author}` : ""}\n[Klik kalau lo punya →](${base}/wanted)`
        : "WTB request baru.";
      url = `${base}/wanted`;
      break;
    }
  }

  return {
    title,
    description,
    url,
    color: cfg.color,
    timestamp: row.created_at,
    author: profileUrl
      ? { name: actorName, url: profileUrl, icon_url: actorPhoto ?? undefined }
      : { name: actorName, icon_url: actorPhoto ?? undefined },
    thumbnail: thumbnail ? { url: thumbnail } : undefined,
    footer: { text: cfg.label },
  };
}

// Optional GET for sanity check
export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: Boolean(DISCORD_WEBHOOK_URL),
    secret: Boolean(SHARED_SECRET),
  });
}
