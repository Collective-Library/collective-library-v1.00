import { cn } from "@/lib/cn";

/**
 * Tiny "✦ Journey Perintis" pill — the community trust signal.
 * Renders nothing if community is null.
 */
export function CommunityBadge({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  if (!name) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-semibold",
        "bg-cream text-ink-soft border border-hairline",
        className,
      )}
      style={{ letterSpacing: "0.15px" }}
      title={`Anggota ${name}`}
    >
      <span aria-hidden>✦</span>
      <span>{name}</span>
    </span>
  );
}
