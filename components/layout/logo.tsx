import { cn } from "@/lib/cn";

/**
 * Brand mark. Loads from /public/logo.png (or /logo.svg — preferred).
 * Until you save the logo, the mark shows as a "CL" text monogram fallback
 * inside a parchment-colored square.
 *
 * Save the brand monogram as `public/logo.svg` (preferred) or `public/logo.png`.
 */
export function Logo({
  size = 32,
  withWordmark = false,
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className="relative inline-flex items-center justify-center bg-cream rounded-[6px] border border-hairline overflow-hidden shrink-0"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Collective Library"
          className="absolute inset-0 w-full h-full object-contain"
        />
        {/* Fallback CL monogram — sits behind the image. If the image fails to load,
            the broken-image alt is hidden by overflow-hidden + the monogram shows through. */}
        <span
          className="font-display text-ink leading-none"
          style={{ fontSize: size * 0.55 }}
          aria-hidden
        >
          CL
        </span>
      </span>
      {withWordmark && (
        <span
          className="font-display text-ink leading-none"
          style={{ fontSize: size * 0.6 }}
        >
          Collective Library
        </span>
      )}
    </span>
  );
}
