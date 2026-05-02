import type { ActivityItem } from "@/lib/activity";
import type { GroupedActivityItem } from "@/lib/activity-grouping";
import type { BookStatus } from "@/types";

const STATUS_VERB: Record<BookStatus, string> = {
  sell: "untuk dijual",
  lend: "untuk dipinjam",
  trade: "untuk ditukar",
  unavailable: "ke koleksinya",
};

const STATUS_LABEL_NEW: Record<BookStatus, string> = {
  sell: "buka untuk dijual",
  lend: "buka untuk dipinjam",
  trade: "buka untuk ditukar",
  unavailable: "balikin ke koleksi",
};

/** Returns the action verb / sentence fragment for an activity row. */
export function activityVerb(item: ActivityItem | GroupedActivityItem): { text: string; bookTitleEmphasis?: boolean } {
  switch (item.type) {
    case "USER_JOINED":
      return { text: "bergabung di Collective Library" };
    case "BOOK_ADDED": {
      if ("is_grouped" in item && item.is_grouped && item.books) {
        return { text: `nambahin ${item.books.length} buku baru sekaligus` };
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
        (item.metadata?.new_status as BookStatus | undefined) ??
        book?.status ??
        "unavailable";
      return { text: `${STATUS_LABEL_NEW[newStatus]}: ${title}` };
    }
    case "WTB_POSTED": {
      const title = item.wanted?.title ?? "buku";
      return { text: `cari buku: ${title}` };
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
  if (item.type === "USER_JOINED" && item.actor?.username) {
    return `/profile/${item.actor.username}`;
  }
  if ("is_grouped" in item && item.is_grouped && item.actor?.username) {
    return `/profile/${item.actor.username}`;
  }
  return null;
}
