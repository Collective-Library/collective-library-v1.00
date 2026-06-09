import type { ActivityItem } from "@/lib/activity";
import type { GroupedActivityItem } from "@/lib/activity-grouping";
import type { BookStatus } from "@/types";

// Slice 6 voice refinement — text-only. Function signatures, exports, and
// return shapes are unchanged so RSS / JSON feeds and the two activity-feed
// components stay consumer-stable. Copy follows BRAND_AND_VOICE.md:
// plain text only, no em dash, no markdown, no HTML, one line per string,
// mixed Indonesian + English with founder voice. Each verb is feed-safe —
// the feed routes escape via escapeXml() / JSON.stringify().

const STATUS_VERB: Record<BookStatus, string> = {
  sell: "yang bisa dibeli",
  lend: "yang bisa dipinjam",
  trade: "yang bisa ditukar",
  unavailable: "ke raknya",
};

const STATUS_LABEL_NEW: Record<BookStatus, string> = {
  sell: "sekarang bisa dibeli",
  lend: "sekarang bisa dipinjam",
  trade: "sekarang terbuka untuk tukar",
  unavailable: "udah balik ke rak",
};

/** Returns the action verb / sentence fragment for an activity row. */
export function activityVerb(item: ActivityItem | GroupedActivityItem): {
  text: string;
  bookTitleEmphasis?: boolean;
} {
  switch (item.type) {
    case "USER_JOINED":
      return { text: "baru gabung di komunitas" };
    case "BOOK_ADDED": {
      if ("is_grouped" in item && item.is_grouped && item.books) {
        return { text: `nambahin ${item.books.length} buku baru ke raknya` };
      }
      const book = item.book;
      const title = book?.title ?? "buku baru";
      const status = book?.status ?? "unavailable";
      return { text: `nambahin ${title} ${STATUS_VERB[status]}` };
    }
    case "BOOK_STATUS_CHANGED": {
      const book = item.book;
      const title = book?.title ?? "buku";
      const newStatus =
        (item.metadata?.new_status as BookStatus | undefined) ?? book?.status ?? "unavailable";
      return { text: `${title} ${STATUS_LABEL_NEW[newStatus]}` };
    }
    case "WTB_POSTED": {
      const title = item.wanted?.title ?? "buku";
      return { text: `lagi nyari ${title}. Ada yang punya?` };
    }
    case "EVENT_CREATED": {
      const title = item.event?.title ?? "event baru";
      return { text: `bikin event baru: ${title}` };
    }
    case "EVENT_RSVPED": {
      const title = item.event?.title ?? "event";
      return { text: `bakal hadir di ${title}` };
    }
    case "MANIFEST_POSTED": {
      const topic = item.manifest?.topic;
      return { text: topic ? `nulis manifest soal ${topic}` : `nulis manifest baru` };
    }
    default:
      return { text: "ada aktivitas baru" };
  }
}

/** Returns the destination URL for an activity row, or null for non-clickable. */
export function activityTargetUrl(item: ActivityItem | GroupedActivityItem): string | null {
  const book = item.book;
  if (book?.id && (item.type === "BOOK_ADDED" || item.type === "BOOK_STATUS_CHANGED")) {
    return `/book/${book.id}`;
  }
  if (item.type === "WTB_POSTED") {
    return "/wanted";
  }
  if (item.event?.id && (item.type === "EVENT_CREATED" || item.type === "EVENT_RSVPED")) {
    return `/event/${item.event.id}`;
  }
  if (item.manifest?.id && item.type === "MANIFEST_POSTED") {
    return `/manifest/${item.manifest.id}`;
  }
  if (item.type === "USER_JOINED" && item.actor?.username) {
    return `/profile/${item.actor.username}`;
  }
  if ("is_grouped" in item && item.is_grouped && item.actor?.username) {
    return `/profile/${item.actor.username}`;
  }
  return null;
}
