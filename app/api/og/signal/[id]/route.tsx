import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Format = "story" | "feed" | "preview";

const DIMS: Record<Format, { width: number; height: number }> = {
  preview: { width: 1200, height: 630 },
  feed: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
};

async function getCardData(id: string) {
  const db = createAdminClient();

  const { data: signal } = await db
    .from("user_signals")
    .select(
      `id, user_id, unlocked_at,
       definition:signal_definitions!signal_slug(
         name, emoji, card_headline, card_subcopy, category
       )`
    )
    .eq("id", id)
    .maybeSingle();

  if (!signal) return null;

  const def = Array.isArray(signal.definition) ? signal.definition[0] : signal.definition;

  const { data: owner } = await db
    .from("profiles_public")
    .select("full_name, username")
    .eq("id", signal.user_id as string)
    .maybeSingle();

  return { signal, def, owner };
}

function Fallback() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#F0E8D8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#3D2E1F",
        fontSize: 52,
        fontFamily: "serif",
      }}
    >
      ✦ Collective Signals
    </div>
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const raw = req.nextUrl.searchParams.get("format") ?? "preview";
  const format: Format = raw === "story" || raw === "feed" ? raw : "preview";
  const dims = DIMS[format];

  const result = await getCardData(id);

  if (!result?.def) {
    return new ImageResponse(<Fallback />, { ...dims });
  }

  const { def, owner, signal } = result;

  const dateStr = new Date(signal.unlocked_at as string).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const ownerName =
    (owner as { full_name?: string | null; username?: string | null } | null)?.full_name ??
    (owner as { full_name?: string | null; username?: string | null } | null)?.username ??
    "Anggota";

  const emoji = (def as { emoji?: string | null } | null)?.emoji ?? "✦";
  const name = (def as { name?: string | null } | null)?.name ?? "Signal";
  const subcopy = (def as { card_subcopy?: string | null } | null)?.card_subcopy;

  if (format === "preview") {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F0E8D8",
          display: "flex",
          flexDirection: "column",
          padding: "60px 72px",
          color: "#3D2E1F",
          fontFamily: "serif",
        }}
      >
        {/* Label */}
        <div
          style={{
            display: "flex",
            fontSize: 20,
            fontWeight: 600,
            color: "#8B7355",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            marginBottom: 32,
          }}
        >
          ✦ COLLECTIVE SIGNALS
        </div>

        {/* Main row */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: 48,
          }}
        >
          <div style={{ display: "flex", fontSize: 100, lineHeight: 1 }}>{emoji}</div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                display: "flex",
                fontSize: 68,
                fontWeight: 700,
                color: "#3D2E1F",
                lineHeight: 1.1,
                marginBottom: 16,
              }}
            >
              {name}
            </div>
            {subcopy && (
              <div
                style={{
                  display: "flex",
                  fontSize: 26,
                  color: "#5A4632",
                  lineHeight: 1.5,
                  maxWidth: "560px",
                }}
              >
                {subcopy}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: "1px solid rgba(61,46,31,0.18)",
            fontSize: 18,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                display: "flex",
                fontWeight: 600,
                color: "#3D2E1F",
                fontSize: 20,
              }}
            >
              {ownerName}
            </div>
            <div style={{ display: "flex", color: "#8B7355" }}>Diunlock {dateStr}</div>
          </div>
          <div
            style={{
              display: "flex",
              color: "#8B7355",
              fontFamily: "monospace",
            }}
          >
            collectivelibrary.vercel.app
          </div>
        </div>
      </div>,
      { ...dims }
    );
  }

  /* story + feed — dark ink background, portrait */
  const isStory = format === "story";
  const emojiFontSize = isStory ? 160 : 140;
  const titleFontSize = isStory ? 96 : 80;
  const subcopyFontSize = isStory ? 32 : 28;
  const vPadding = isStory ? "80px 64px" : "72px 64px";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#3D2E1F",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: vPadding,
        fontFamily: "serif",
      }}
    >
      {/* Label */}
      <div
        style={{
          display: "flex",
          fontSize: 26,
          fontWeight: 600,
          color: "#C4A882",
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginBottom: 48,
        }}
      >
        ✦ COLLECTIVE SIGNALS
      </div>

      {/* Emoji */}
      <div
        style={{
          display: "flex",
          fontSize: emojiFontSize,
          lineHeight: 1,
          marginBottom: 40,
        }}
      >
        {emoji}
      </div>

      {/* Signal name */}
      <div
        style={{
          display: "flex",
          fontSize: titleFontSize,
          fontWeight: 700,
          color: "#F0E8D8",
          lineHeight: 1.1,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        {name}
      </div>

      {/* Subcopy */}
      {subcopy && (
        <div
          style={{
            display: "flex",
            fontSize: subcopyFontSize,
            color: "#C4A882",
            textAlign: "center",
            maxWidth: "80%",
            lineHeight: 1.5,
            marginBottom: 0,
          }}
        >
          {subcopy}
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1, display: "flex" }} />

      {/* Owner + date */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          marginBottom: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 600,
            color: "#F0E8D8",
          }}
        >
          {ownerName}
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#8B7355" }}>Diunlock {dateStr}</div>
      </div>

      {/* Brand footer */}
      <div
        style={{
          display: "flex",
          paddingTop: 28,
          borderTop: "1px solid rgba(240,232,216,0.15)",
          width: "100%",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: "#8B7355",
            fontFamily: "monospace",
          }}
        >
          collectivelibrary.vercel.app
        </div>
      </div>
    </div>,
    { ...dims }
  );
}
