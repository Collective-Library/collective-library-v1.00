/** Formats a number as IDR with no decimals. e.g. 75000 → "Rp 75.000". */
export function formatIDR(amount: number | null | undefined): string {
  if (amount == null) return "";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Short relative date in Indonesian. e.g. "2 hari lalu" / "3 minggu lalu". */
export function formatRelativeID(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) return `${Math.max(1, Math.round(diff / minute))} menit lalu`;
  if (diff < day) return `${Math.round(diff / hour)} jam lalu`;
  if (diff < 7 * day) return `${Math.round(diff / day)} hari lalu`;
  if (diff < 30 * day) return `${Math.round(diff / (7 * day))} minggu lalu`;
  if (diff < 365 * day) return `${Math.round(diff / (30 * day))} bulan lalu`;
  return `${Math.round(diff / (365 * day))} tahun lalu`;
}

/** Initials fallback for avatar when no photo exists. */
export function initials(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Slugifies a string into lowercase a-z0-9 with dashes. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
