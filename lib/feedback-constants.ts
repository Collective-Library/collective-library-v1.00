import type { FeedbackCategory, FeedbackStatus } from "@/types";

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  idea: "💡 Ide",
  bug: "🐛 Bug",
  friction: "😕 Friksi",
  appreciation: "❤️ Apresiasi",
  other: "✋ Lain",
};

export const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "Baru",
  triaged: "Triaged",
  planned: "Planned",
  shipped: "Shipped",
  wontfix: "Won't fix",
};

export const STATUS_TONE: Record<FeedbackStatus, string> = {
  new: "bg-(--color-wanted-bg) text-(--color-wanted)",
  triaged: "bg-cream text-ink-soft border border-hairline",
  planned: "bg-(--color-trade-bg) text-(--color-trade)",
  shipped: "bg-(--color-lend-bg) text-(--color-lend)",
  wontfix: "bg-(--color-unavailable-bg) text-(--color-unavailable)",
};
