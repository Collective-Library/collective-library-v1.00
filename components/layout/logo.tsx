import { cn } from "@/lib/cn";

/** Brand mark. Loads from /public/logo.svg. */
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
        className="relative inline-flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt="Collective Library"
          className="w-full h-full object-contain"
        />
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
