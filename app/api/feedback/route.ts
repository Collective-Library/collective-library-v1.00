// =============================================================================
// /api/feedback — user feedback ingestion
//
// Two-layer architecture:
//   1. Source of truth: public.feedback table in Supabase (queryable, status-
//      trackable, owns the data forever).
//   2. Notification fan-out: Discord webhook posts a color-coded embed to
//      #feedback so the team feels the pulse in real-time. Discord is just a
//      notification surface; lose Discord, lose nothing — the row is still in
//      Supabase.
//
// Anon submissions allowed (encourages low-friction signal). Authed user
// gets attributed via session cookie.
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/url";
import type { FeedbackCategory } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES = new Set<FeedbackCategory>([
  "idea",
  "bug",
  "friction",
  "appreciation",
  "other",
]);

// Embed color per category — matches the design tokens used elsewhere.
const CATEGORY_COLORS: Record<FeedbackCategory, number> = {
  idea: 0x166534, // lend green
  bug: 0xb91c1c, // error red
  friction: 0xb45309, // wanted amber
  appreciation: 0xdb2777, // pink
  other: 0x8b7355, // muted brown
};

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  idea: "💡 Ide / fitur",
  bug: "🐛 Bug / error",
  friction: "😕 Friksi / susah",
  appreciation: "❤️ Apresiasi",
  other: "✋ Lain-lain",
};

interface SubmitBody {
  category: string;
  message: string;
  email?: string | null;
  page_url?: string | null;
}

export async function POST(req: NextRequest) {
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate category
  const category = body.category as FeedbackCategory;
  if (!VALID_CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  // Validate message
  const message = (body.message ?? "").trim();
  if (message.length < 3 || message.length > 4000) {
    return NextResponse.json(
      { error: "Pesan minimal 3 karakter, maksimal 4000." },
      { status: 400 },
    );
  }

  const email = (body.email ?? "").trim() || null;
  const pageUrl = (body.page_url ?? "").trim() || null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const supabase = await createClient();

  // Pull session user (anon allowed)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Insert feedback row — RLS allows insert for anyone
  const { data: inserted, error: insertErr } = await supabase
    .from("feedback")
    .insert({
      user_id: user?.id ?? null,
      category,
      message,
      email,
      page_url: pageUrl,
      user_agent: userAgent,
      status: "new",
    })
    .select("id, created_at")
    .single();

  if (insertErr || !inserted) {
    console.error("[feedback] insert failed", insertErr);
    return NextResponse.json({ error: "Gagal nyimpen masukan." }, { status: 500 });
  }

  // Pull display info for the Discord embed (best-effort)
  let userDisplay: string | null = null;
  if (user?.id) {
    const { data: prof } = await supabase
      .from("profiles_public")
      .select("full_name, username")
      .eq("id", user.id)
      .maybeSingle();
    if (prof) {
      const name = prof.full_name as string | null;
      const handle = prof.username as string | null;
      userDisplay = name && handle ? `${name} (@${handle})` : (name ?? handle);
    }
  }

  // Fire-and-forget Discord webhook. Don't block the user response on this —
  // worst case the row is in Supabase and we missed the notification.
  postToDiscord({
    webhookUrl: process.env.DISCORD_FEEDBACK_WEBHOOK_URL,
    category,
    message,
    userDisplay,
    email,
    pageUrl,
    userAgent,
    feedbackId: inserted.id as string,
  }).catch((err) => console.warn("[feedback] discord fan-out failed", err));

  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 });
}

interface DiscordPayload {
  webhookUrl: string | undefined;
  category: FeedbackCategory;
  message: string;
  userDisplay: string | null;
  email: string | null;
  pageUrl: string | null;
  userAgent: string | null;
  feedbackId: string;
}

async function postToDiscord(p: DiscordPayload) {
  if (!p.webhookUrl) {
    console.info("[feedback] DISCORD_FEEDBACK_WEBHOOK_URL not set; skip fan-out");
    return;
  }

  const adminLink = `${getAppUrl()}/admin/feedback?id=${p.feedbackId}`;

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];
  if (p.userDisplay) {
    fields.push({ name: "User", value: p.userDisplay, inline: true });
  } else {
    fields.push({ name: "User", value: "(anon)", inline: true });
  }
  if (p.pageUrl) {
    fields.push({ name: "Page", value: `\`${p.pageUrl}\``, inline: true });
  }
  if (p.email) {
    fields.push({ name: "Email", value: p.email, inline: true });
  }
  if (p.userAgent) {
    // Trim noisy UA strings; Discord embed value max ~1024
    fields.push({
      name: "Browser",
      value: p.userAgent.slice(0, 200),
      inline: false,
    });
  }
  fields.push({ name: "Triage", value: `[Open in admin](${adminLink})`, inline: false });

  const embed = {
    title: CATEGORY_LABELS[p.category],
    description: p.message.length > 1500 ? p.message.slice(0, 1500) + "…" : p.message,
    color: CATEGORY_COLORS[p.category],
    fields,
    timestamp: new Date().toISOString(),
    footer: { text: "Collective Library · feedback" },
  };

  const res = await fetch(p.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });
  if (!res.ok) {
    throw new Error(`discord webhook ${res.status}`);
  }
}
