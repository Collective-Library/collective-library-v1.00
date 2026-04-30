"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import type { OkrKeyResult, OkrStatus } from "@/types";

const STATUSES: { slug: OkrStatus; label: string }[] = [
  { slug: "on_track", label: "On track" },
  { slug: "at_risk", label: "At risk" },
  { slug: "behind", label: "Behind" },
  { slug: "done", label: "Done" },
];

/**
 * Edit form for a Key Result. If `auto_compute_key` is set, current_value is
 * derived live from app data — the input is disabled with an explanation.
 */
export function KrEditForm({ kr }: { kr: OkrKeyResult }) {
  const router = useRouter();
  const [current, setCurrent] = useState(String(kr.current_value));
  const [status, setStatus] = useState<OkrStatus>(kr.status);
  const [notes, setNotes] = useState(kr.notes ?? "");
  const [pending, startTransition] = useTransition();

  const isAuto = Boolean(kr.auto_compute_key);

  function save() {
    startTransition(async () => {
      const body: { current_value?: number; status: OkrStatus; notes: string } = {
        status,
        notes: notes.trim(),
      };
      if (!isAuto) body.current_value = Number(current) || 0;

      const res = await fetch(`/api/mastermind/okrs/${kr.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Gagal simpan KR.");
        return;
      }
      toast.success("KR tersimpan ✓");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="kr-current" className="text-caption font-medium text-ink-soft">
          Current value
        </label>
        <input
          id="kr-current"
          type="number"
          step="0.01"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          disabled={isAuto || pending}
          className="w-full h-11 px-3.5 bg-paper text-ink rounded-button border border-hairline-strong focus:outline-none focus:border-ink focus:border-2 focus:px-[13px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {isAuto ? (
          <p className="text-caption text-muted italic">
            Auto-computed dari app data via <code className="text-ink-soft">{kr.auto_compute_key}</code>.
            Edit lewat code (lib/mastermind/kr-compute.ts) jika perlu ubah formula.
          </p>
        ) : (
          <p className="text-caption text-muted">
            Target: {Number(kr.target_value).toLocaleString("id-ID")} {kr.target_unit}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-caption font-medium text-ink-soft">Status</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => {
            const active = status === s.slug;
            return (
              <button
                key={s.slug}
                type="button"
                disabled={pending}
                onClick={() => setStatus(s.slug)}
                className={cn(
                  "inline-flex items-center h-9 px-3 rounded-pill text-caption font-medium transition-colors disabled:opacity-50",
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
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="kr-notes" className="text-caption font-medium text-ink-soft">
          Notes (internal)
        </label>
        <textarea
          id="kr-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Konteks, blocker, decision yang relate sama KR ini…"
          className="w-full px-3.5 py-3 bg-paper text-ink rounded-button border border-hairline-strong focus:outline-none focus:border-ink focus:border-2 focus:px-[13px] focus:py-[11px] transition-colors resize-y"
        />
      </div>

      <div className="flex gap-2 mt-1">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center h-11 px-5 rounded-pill bg-ink text-parchment text-body-sm font-semibold hover:bg-ink-soft disabled:opacity-50"
        >
          {pending ? "Simpan…" : "Simpan KR"}
        </button>
      </div>
    </form>
  );
}
