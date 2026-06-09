"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import type { UserNotification } from "@/types";
import type { Profile } from "@/types";
import { NotificationRow } from "./notification-row";

export function NotificationBell({
  profile,
  initialUnreadCount,
}: {
  profile: Profile;
  initialUnreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape (mirrors AvatarMenu)
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Fetch recent notifications when popover first opens
  useEffect(() => {
    if (!open || loaded) return;
    const db = createClient();
    db.from("user_notifications")
      .select("*")
      .eq("recipient_user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setNotifications((data ?? []) as UserNotification[]);
        setLoaded(true);
      });
  }, [open, loaded, profile.id]);

  const handleRowRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setCount((c) => Math.max(0, c - 1));
  }, []);

  async function markAllRead() {
    const db = createClient();
    await db
      .from("user_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_user_id", profile.id)
      .is("read_at", null);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    setCount(0);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={count > 0 ? `${count} notifikasi belum dibaca` : "Notifikasi"}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-10 h-10 rounded-pill hover:bg-cream transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        <BellIcon />
        {count > 0 && (
          <span
            aria-hidden
            className={cn(
              "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1",
              "rounded-full bg-ink text-parchment text-[10px] font-semibold leading-[18px] text-center"
            )}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 rounded-card-lg bg-paper border border-hairline shadow-modal overflow-hidden z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-hairline-soft">
            <p className="text-body-sm font-semibold text-ink">Notifikasi</p>
            {count > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-caption text-muted hover:text-ink transition-colors"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          {!loaded ? (
            <div className="px-4 py-6 text-center text-caption text-muted">Memuat...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-body-sm text-muted">Belum ada notifikasi.</p>
            </div>
          ) : (
            <ul className="divide-y divide-hairline-soft max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <NotificationRow key={n.id} notification={n} onRead={handleRowRead} />
              ))}
            </ul>
          )}

          {/* Footer */}
          <div className="border-t border-hairline-soft">
            <Link
              href="/notifications"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-body-sm text-center text-ink-soft hover:bg-cream transition-colors"
            >
              Lihat semua notifikasi
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
