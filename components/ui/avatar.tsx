import Image from "next/image";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

export function Avatar({
  src,
  name,
  size = 32,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-pill bg-cream text-ink font-semibold overflow-hidden shrink-0 border border-hairline",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? ""}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          // Avatars are small + decorative; eager-load only when explicitly large
          loading={size > 64 ? "eager" : "lazy"}
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </span>
  );
}
