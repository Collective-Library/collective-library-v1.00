import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

export function Avatar({
  src,
  name,
  size = 32,
  className,
  isAdmin = false,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  /** Renders a tiny ✦ shield overlay bottom-right when true. */
  isAdmin?: boolean;
}) {
  // Badge size scales with avatar — small enough to not dominate, big enough
  // to read at a glance. Floor at 12 so it never disappears.
  const badgeSize = Math.max(12, Math.round(size * 0.32));

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span
        className="inline-flex items-center justify-center w-full h-full rounded-pill bg-cream text-ink font-semibold overflow-hidden border border-hairline"
        style={{ fontSize: size * 0.4 }}
      >
        {src ? (
          <img
            src={src}
            alt={name ?? ""}
            width={size}
            height={size}
            className="w-full h-full object-cover"
            loading={size > 64 ? "eager" : "lazy"}
          />
        ) : (
          <span>{initials(name)}</span>
        )}
      </span>
      {isAdmin && (
        <span
          aria-label="Admin"
          title="Admin Collective Library"
          className="absolute bottom-0 right-0 inline-flex items-center justify-center rounded-pill bg-ink text-parchment border-2 border-parchment shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
          style={{
            width: badgeSize,
            height: badgeSize,
            fontSize: Math.round(badgeSize * 0.6),
            lineHeight: 1,
          }}
        >
          ✦
        </span>
      )}
    </span>
  );
}
