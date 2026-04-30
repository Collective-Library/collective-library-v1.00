import { ImageResponse } from "next/og";

// Branded landing OG card — shown when collectivelibrary.vercel.app is shared
// to WhatsApp / Discord / IG / Twitter. Generated at build/edge time via
// next/og's satori under the hood.

export const runtime = "edge";
export const alt = "Collective Library — buku komunitas Journey Perintis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#F0E8D8",
          color: "#3D2E1F",
          padding: "72px 80px",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Tag pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 22,
            fontWeight: 600,
            color: "#8B7355",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: 24,
          }}
        >
          ✦ &nbsp;COLLECTIVE LIBRARY
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.06,
            letterSpacing: "-2px",
            maxWidth: "960px",
            color: "#3D2E1F",
          }}
        >
          Where books connect people, and ideas turn into movement.
        </div>

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 22,
            color: "#5A4632",
            paddingTop: 24,
            borderTop: "1px solid rgba(61, 46, 31, 0.18)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", fontWeight: 600 }}>
              Untuk Journey Perintis & sekitar — Semarang
            </div>
            <div style={{ display: "flex", fontSize: 18, color: "#8B7355" }}>
              Gratis. Selamanya. No take-rate.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: "#8B7355",
              fontFamily: "monospace",
            }}
          >
            collectivelibrary.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
