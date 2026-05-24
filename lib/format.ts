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

/**
 * Formats an event's start time as a readable Indonesian date-time string.
 * e.g. "Sab, 25 Mei 2026 · 19:00 WIB"
 */
export function formatEventWhen(
  startsAt: string,
  endsAt?: string | null,
  timezone = "Asia/Jakarta",
): string {
  const tzLabel: Record<string, string> = {
    "Asia/Jakarta": "WIB",
    "Asia/Makassar": "WITA",
    "Asia/Jayapura": "WIT",
  };
  const label = tzLabel[timezone] ?? timezone;

  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(iso).toLocaleString("id-ID", { timeZone: timezone, ...opts });

  const date = fmt(startsAt, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = fmt(startsAt, { hour: "2-digit", minute: "2-digit", hour12: false });

  if (endsAt) {
    const endTime = fmt(endsAt, { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${date} · ${time}–${endTime} ${label}`;
  }
  return `${date} · ${time} ${label}`;
}

/** Normalizes a phone number for DB storage (remove non-digits, 0 -> 62). */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const cleaned = input.replace(/\D/g, "");
  if (!cleaned) return null;
  if (cleaned.startsWith("0")) return "62" + cleaned.slice(1);
  return cleaned;
}
