import Link from "next/link";
import { ActivityFeed } from "@/components/activity/activity-feed";
import type { ActivityItem } from "@/lib/activity";
import { HomeEmptyState } from "./HomeEmptyState";

/**
 * "Lagi rame apa?" section on /home. Wraps the existing landing-style
 * ActivityFeed widget with a section header and a Lihat semua →
 * link. Falls back to a warm empty state when the feed has nothing.
 *
 * Reuses `ActivityFeed` rather than duplicating row rendering.
 */
export function HomeActivityPreview({ items }: { items: ActivityItem[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-title-lg text-ink">Lagi rame apa?</h2>
        <Link
          href="/activity"
          className="text-caption text-ink-soft hover:text-ink underline-offset-4 hover:underline shrink-0"
        >
          Lihat semua →
        </Link>
      </div>
      {items.length === 0 ? (
        <HomeEmptyState
          title="Belum ada gerakan minggu ini."
          cta="Mulai dari satu sinyal kecil — tambah buku, RSVP event, atau tulis manifest."
          action={{ label: "+ Tambah buku", href: "/book/add" }}
        />
      ) : (
        <ActivityFeed items={items} />
      )}
    </section>
  );
}
