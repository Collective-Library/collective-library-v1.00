import * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "ink" | "muted";

const tones: Record<Tone, string> = {
  neutral: "bg-cream text-ink-soft",
  ink: "bg-ink text-parchment",
  muted: "bg-transparent text-muted border border-hairline",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-badge font-semibold",
        tones[tone],
        className,
      )}
      style={{ letterSpacing: "0.25px" }}
    >
      {children}
    </span>
  );
}
