import { ActivityItem } from "./activity";
import { BookStatus } from "@/types";

export interface GroupedActivityItem extends Omit<ActivityItem, "book"> {
  books?: (ActivityItem["book"] & { status: BookStatus })[];
  is_grouped?: boolean;
  book: ActivityItem["book"] | null;
}

/**
 * Groups consecutive BOOK_ADDED activities by the same actor within a short timeframe.
 * Helps prevent feed spam during bulk imports.
 */
export function groupActivities(items: ActivityItem[], windowMs = 60000): GroupedActivityItem[] {
  const grouped: GroupedActivityItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const current = items[i];

    if (current.type !== "BOOK_ADDED" || !current.actor || !current.book) {
      grouped.push({ ...current, book: current.book });
      continue;
    }

    const last = grouped[grouped.length - 1];

    // Check if we can group with the last item
    if (
      last &&
      last.type === "BOOK_ADDED" &&
      last.actor?.id === current.actor.id &&
      Math.abs(new Date(last.created_at).getTime() - new Date(current.created_at).getTime()) <=
        windowMs
    ) {
      if (!last.books) {
        // Fallback status if missing, though BOOK_ADDED should have it
        const lastBook = last.book!;
        last.books = [{ ...lastBook, status: lastBook.status || "unavailable" }];
        last.is_grouped = true;
        last.book = null;
      }
      last.books.push({ ...current.book, status: current.book.status || "unavailable" });
      // Use the most recent timestamp for the group
      if (new Date(current.created_at) > new Date(last.created_at)) {
        last.created_at = current.created_at;
      }
    } else {
      grouped.push({ ...current, book: current.book });
    }
  }

  return grouped;
}
