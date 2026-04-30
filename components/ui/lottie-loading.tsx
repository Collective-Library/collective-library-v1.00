"use client";

import dynamic from "next/dynamic";
import animationData from "@/lib/lottie/loading-dots.json";

// lottie-react bundles the animation engine; lazy-load to keep first paint
// snappy. The fallback during chunk load is a tiny invisible div so layout
// doesn't jump.
const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
  loading: () => <span aria-hidden style={{ display: "inline-block", width: 60, height: 30 }} />,
});

/**
 * Brand-tinted loading animation — three parchment-toned dots pulsing in
 * sequence. Used in places where a tiny "thinking…" cue is friendlier than
 * a static spinner (book search, postal code lookup, etc.).
 *
 * Default size: 60×30px (inline pill-friendly). Pass `size` to override.
 */
export function LottieLoading({
  size = 60,
  ariaLabel = "Loading",
}: {
  size?: number;
  ariaLabel?: string;
}) {
  // Maintain 2:1 aspect ratio matching the JSON viewport (120×60)
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      style={{
        display: "inline-block",
        width: size,
        height: size / 2,
        lineHeight: 0,
      }}
    >
      <Lottie animationData={animationData} loop autoplay />
    </span>
  );
}
