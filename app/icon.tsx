import { ImageResponse } from "next/og";

// Branded favicon — replaces the default Vercel/Next.js icon. Rendered as
// a 32x32 PNG via next/og at build/edge. Brand-colored ink-on-parchment
// monogram star matching the app palette.

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3D2E1F",
          color: "#F0E8D8",
          fontSize: 22,
          fontWeight: 700,
          borderRadius: 6,
          fontFamily: "serif",
          letterSpacing: "-1px",
        }}
      >
        ✦
      </div>
    ),
    { ...size },
  );
}
