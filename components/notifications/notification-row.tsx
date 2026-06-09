"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserNotification } from "@/types";

const TYPE_ICON: Record<string, string> = {
  SIGNAL_UNLOCKED: "✦",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}h lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function NotificationRow({
  notification,
  onRead,
}: {
  notification: UserNotification;
  onRead?: (id: string) => void;
}) {
  const router = useRouter();
  const isUnread = notification.read_at === null;
  const icon = TYPE_ICON[notification.type] ?? "🔔";

  async function handleClick() {
    if (isUnread) {
      onRead?.(notification.id);
      const db = createClient();
      await db
        .from("user_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notification.id);
    }
    if (notification.url) {
      router.push(notification.url);
    }
  }

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-cream transition-colors"
      >
        {/* Icon */}
        <span
          className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-pill bg-paper border border-hairline flex items-center justify-center text-base leading-none"
          aria-hidden
        >
          {icon}
        </span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-medium text-ink leading-tight">{notification.title}</p>
          {notification.body && (
            <p className="mt-0.5 text-caption text-muted line-clamp-2 leading-snug">
              {notification.body}
            </p>
          )}
          <p className="mt-1 text-[11px] text-muted">{relativeTime(notification.created_at)}</p>
        </div>

        {/* Unread dot */}
        {isUnread && (
          <span
            className="flex-shrink-0 mt-2 w-2 h-2 rounded-full bg-ink"
            aria-label="Belum dibaca"
          />
        )}
      </button>
    </li>
  );
}
