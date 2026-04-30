import { ImageResponse } from "next/og";

// Apple touch icon — shown when iOS users add to home screen.
// 180x180 is the recommended size; same monogram star, larger plate.

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 120,
          fontWeight: 700,
          borderRadius: 32,
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
