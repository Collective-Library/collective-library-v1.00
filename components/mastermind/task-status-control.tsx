"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import type { TaskStatus } from "@/types";

const STATUSES: { slug: TaskStatus; label: string }[] = [
  { slug: "todo", label: "Todo" },
  { slug: "in_progress", label: "In progress" },
  { slug: "blocked", label: "Blocked" },
  { slug: "done", label: "Done" },
  { slug: "canceled", label: "Canceled" },
];

/** Inline task status setter — quick triage from the team page. */
export function TaskStatusControl({
  taskId,
  currentStatus,
}: {
  taskId: string;
  currentStatus: TaskStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<TaskStatus>(currentStatus);
  const [pending, startTransition] = useTransition();

  function setNext(next: TaskStatus) {
    setStatus(next);
    startTransition(async () => {
      const res = await fetch(`/api/mastermind/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        toast.error("Gagal update task.");
        setStatus(currentStatus);
        return;
      }
      toast.success("Task tersimpan ✓");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1">
      {STATUSES.map((s) => {
        const active = status === s.slug;
        return (
          <button
            key={s.slug}
            type="button"
            disabled={pending}
            onClick={() => setNext(s.slug)}
            className={cn(
              "inline-flex items-center h-7 px-2.5 rounded-pill text-[11px] font-medium transition-colors disabled:opacity-50",
              active
                ? "bg-ink text-parchment border border-ink"
                : "bg-paper text-ink-soft border border-hairline hover:bg-cream",
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
