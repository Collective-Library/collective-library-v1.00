"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NotificationRow } from "@/components/notifications/notification-row";
import type { UserNotification } from "@/types";

type Filter = "all" | "signals";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function bucketByDay(items: UserNotification[]): { label: string; items: UserNotification[] }[] {
  const now = new Date();
  const today = startOfDay(now).getTime();
  const yesterday = today - 86400000;
  const week = today - 7 * 86400000;
  const month = today - 30 * 86400000;

  const groups: Record<string, UserNotification[]> = {
    "Hari ini": [],
    Kemarin: [],
    "Minggu ini": [],
    "Bulan ini": [],
    "Lebih lama": [],
  };
  for (const n of items) {
    const t = new Date(n.created_at).getTime();
    if (t >= today) groups["Hari ini"].push(n);
    else if (t >= yesterday) groups["Kemarin"].push(n);
    else if (t >= week) groups["Minggu ini"].push(n);
    else if (t >= month) groups["Bulan ini"].push(n);
    else groups["Lebih lama"].push(n);
  }
  return Object.entries(groups)
    .filter(([, arr]) => arr.length > 0)
    .map(([label, items]) => ({ label, items }));
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const db = createClient();
    db.from("user_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setNotifications((data ?? []) as UserNotification[]);
        setLoading(false);
      });
  }, []);

  const handleRowRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  }, []);

  async function markAllRead() {
    const db = createClient();
    await db
      .from("user_notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
  }

  const filtered =
    filter === "signals"
      ? notifications.filter((n) => n.type === "SIGNAL_UNLOCKED")
      : notifications;
  const buckets = bucketByDay(filtered);
  const unreadCount = notifications.filter((n) => n.read_at === null).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-display-xl text-ink">Notifikasi</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-body-sm text-muted hover:text-ink transition-colors"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
          Semua
        </FilterTab>
        <FilterTab active={filter === "signals"} onClick={() => setFilter("signals")}>
          ✦ Signals
        </FilterTab>
      </div>

      {/* Content */}
      {loading ? (
        <NotificationsSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
          <p className="font-display text-title-lg text-ink">
            {filter === "signals" ? "Belum ada Signal." : "Belum ada notifikasi."}
          </p>
          <p className="mt-2 text-body text-muted">
            {filter === "signals"
              ? "Berkontribusi ke komunitas buat unlock Signal pertama kamu."
              : "Aktivitas kamu di komunitas akan muncul di sini."}
          </p>
          {filter === "signals" && (
            <Link
              href="/library"
              className="mt-4 inline-flex items-center h-10 px-5 rounded-pill bg-ink text-parchment text-body-sm font-medium hover:bg-ink-soft transition-colors"
            >
              Ke rak buku
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-7">
          {buckets.map((bucket) => (
            <section key={bucket.label}>
              <h2 className="text-caption font-semibold text-muted uppercase tracking-wide mb-3">
                {bucket.label}
              </h2>
              <ul className="bg-paper border border-hairline rounded-card-lg overflow-hidden divide-y divide-hairline-soft">
                {bucket.items.map((n) => (
                  <NotificationRow key={n.id} notification={n} onRead={handleRowRead} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex items-center h-8 px-3.5 rounded-pill text-body-sm font-semibold bg-ink text-parchment"
          : "inline-flex items-center h-8 px-3.5 rounded-pill text-body-sm text-muted hover:bg-cream border border-hairline transition-colors"
      }
    >
      {children}
    </button>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-paper border border-hairline rounded-card-lg px-4 py-3 flex items-center gap-3 animate-pulse"
        >
          <div className="w-8 h-8 rounded-pill bg-cream shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-cream rounded w-3/4" />
            <div className="h-3 bg-cream rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
