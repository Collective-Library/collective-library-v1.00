import { cn } from "@/lib/cn";
import { STATUS_CONFIG } from "@/lib/status";
import type { BookStatus } from "@/types";

export function StatusBadge({
  status,
  className,
}: {
  status: BookStatus;
  className?: string;
}) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-0.5 text-badge font-semibold",
        cfg.bgClass,
        cfg.textClass,
        className,
      )}
      style={{ letterSpacing: "0.25px" }}
    >
      {cfg.label}
    </span>
  );
}
