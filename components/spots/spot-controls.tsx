"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SPOT_STATUS_OPTIONS } from "@/lib/spots-constants";
import type { SpotStatus } from "@/types";
import { cn } from "@/lib/cn";

/**
 * Inline status setter + is_active toggle, used on the list row and the
 * edit page. Each control posts to PATCH /api/mastermind/spots/[id] and
 * refreshes the route on success.
 */
export function SpotStatusControl({
  spotId,
  status,
  size = "sm",
}: {
  spotId: string;
  status: SpotStatus;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const change = (next: SpotStatus) => {
    if (next === status) return;
    startTransition(async () => {
      const res = await fetch(`/api/mastermind/spots/${spotId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = (await res.json().catch(() => ({ error: "Bad response" }))) as
        | { ok: true }
        | { error: string };
      if (!res.ok || "error" in json) {
        toast.error("error" in json ? json.error : "Gagal ganti status.");
        return;
      }
      if (next === "active") {
        toast.success("Spot di-promote ke Active. Activity log emit NODE_CREATED.");
      } else {
        toast.success(`Status: ${next}.`);
      }
      router.refresh();
    });
  };

  return (
    <select
      aria-label="Status"
      disabled={pending}
      value={status}
      onChange={(e) => change(e.target.value as SpotStatus)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "rounded-pill bg-paper border border-hairline-strong text-ink-soft font-medium",
        "focus:outline-none focus:border-ink",
        "disabled:opacity-60",
        size === "md" ? "h-10 px-3 text-body-sm" : "h-8 px-2.5 text-caption",
      )}
    >
      {SPOT_STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SpotActiveToggle({
  spotId,
  isActive,
  size = "sm",
}: {
  spotId: string;
  isActive: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const flip = () => {
    startTransition(async () => {
      const next = !isActive;
      const res = await fetch(`/api/mastermind/spots/${spotId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      const json = (await res.json().catch(() => ({ error: "Bad response" }))) as
        | { ok: true }
        | { error: string };
      if (!res.ok || "error" in json) {
        toast.error("error" in json ? json.error : "Gagal toggle.");
        return;
      }
      toast.success(next ? "Spot di-aktifkan." : "Spot di-deaktifkan.");
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        flip();
      }}
      disabled={pending}
      aria-pressed={isActive}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill font-medium border transition-colors",
        "disabled:opacity-60",
        isActive
          ? "bg-ink text-parchment border-ink hover:bg-ink-soft"
          : "bg-paper text-muted border-hairline hover:bg-cream",
        size === "md" ? "h-10 px-3 text-body-sm" : "h-8 px-2.5 text-caption",
      )}
    >
      <span aria-hidden>{isActive ? "●" : "○"}</span>
      <span>{isActive ? "Active" : "Off"}</span>
    </button>
  );
}

/** Danger zone — hard delete with confirm dialog. */
export function SpotDeleteButton({ spotId, spotName }: { spotId: string; spotName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    if (!confirm(`Yakin mau hapus permanen "${spotName}"? Action ini gak bisa di-undo.`)) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/mastermind/spots/${spotId}`, { method: "DELETE" });
      const json = (await res.json().catch(() => ({ error: "Bad response" }))) as
        | { ok: true }
        | { error: string };
      if (!res.ok || "error" in json) {
        toast.error("error" in json ? json.error : "Gagal delete.");
        return;
      }
      toast.success("Spot dihapus.");
      router.push("/mastermind/spots");
    });
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      className="inline-flex items-center h-10 px-4 rounded-pill text-body-sm font-medium border border-red-300 text-red-700 bg-paper hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "Menghapus…" : "Hapus Spot permanen"}
    </button>
  );
}
