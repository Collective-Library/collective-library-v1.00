import type { BookStatus, BookCondition } from "@/types";

export const STATUS_CONFIG: Record<
  BookStatus,
  { label: string; bgClass: string; textClass: string }
> = {
  sell: { label: "Dijual", bgClass: "bg-sell-bg", textClass: "text-sell" },
  lend: { label: "Dipinjamkan", bgClass: "bg-lend-bg", textClass: "text-lend" },
  trade: { label: "Ditukar", bgClass: "bg-trade-bg", textClass: "text-trade" },
  unavailable: {
    label: "Koleksi",
    bgClass: "bg-unavailable-bg",
    textClass: "text-unavailable",
  },
};

export const CONDITION_LABELS: Record<BookCondition, string> = {
  new: "Baru",
  like_new: "Seperti Baru",
  good: "Bagus",
  used: "Pernah Dipakai",
  heavily_used: "Banyak Bekas Pakai",
};

export const STATUS_FILTER_OPTIONS: Array<{ value: BookStatus | "all"; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "sell", label: "Dijual" },
  { value: "lend", label: "Dipinjamkan" },
  { value: "trade", label: "Ditukar" },
];
