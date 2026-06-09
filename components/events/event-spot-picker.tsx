"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SPOT_TYPE_OPTIONS } from "@/lib/spots-constants";
import type { SelectableSpot } from "@/lib/spots";
import type { SpotType } from "@/types";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  /** Currently attached node_id (or empty string for unattached). */
  value: string;
  onChange: (nodeId: string | "", spot: SelectableSpot | null) => void;
  /** Active+public+is_active Spots from the server. */
  spots: SelectableSpot[];
  /** Whether the current user can inline-create a Spot. */
  eligibleHost: boolean;
}

/**
 * Spot picker for the event create/edit form.
 *
 * - Dropdown of selectable Spots ("Active + Public + Is_active=true").
 * - Optional inline-create (only for eligible hosts) — POSTs to
 *   /api/events/host-spot, which uses the RLS-enforced server client.
 * - Selection bubbles up via `onChange` so the parent form can also auto-fill
 *   `location_text` if the user hasn't typed anything custom.
 *
 * Additive only — public event detail page does not yet render the linked
 * Spot. This picker is the host's tool, not a public-facing UI change.
 */
export function EventSpotPicker({ value, onChange, spots, eligibleHost }: Props) {
  const [allSpots, setAllSpots] = useState<SelectableSpot[]>(spots);
  const [creating, setCreating] = useState(false);

  // Inline-create form state
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<SpotType>("cafe");
  const [newCity, setNewCity] = useState("");
  const [newMapsUrl, setNewMapsUrl] = useState("");
  const [submitting, startTransition] = useTransition();

  const selectedSpot = allSpots.find((s) => s.id === value) ?? null;

  function pick(nextId: string) {
    const spot = allSpots.find((s) => s.id === nextId) ?? null;
    onChange(nextId, spot);
  }

  function cancelInline() {
    setCreating(false);
    setNewName("");
    setNewType("cafe");
    setNewCity("");
    setNewMapsUrl("");
  }

  function submitInline() {
    if (newName.trim().length < 3) {
      toast.error("Nama Spot minimal 3 karakter.");
      return;
    }
    if (!newCity.trim()) {
      toast.error("Kota harus diisi.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/events/host-spot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          type: newType,
          city: newCity.trim(),
          maps_url: newMapsUrl.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => ({ error: "Bad response" }))) as
        | { ok: true; id: string; slug: string; name: string; city: string }
        | { error: string };
      if (!res.ok || "error" in json) {
        toast.error("error" in json ? json.error : "Gagal bikin Spot.");
        return;
      }
      const created: SelectableSpot = {
        id: json.id,
        name: json.name,
        slug: json.slug,
        type: newType,
        city: json.city,
        maps_url: newMapsUrl.trim() || null,
      };
      setAllSpots((prev) => [created, ...prev]);
      onChange(created.id, created);
      cancelInline();
      toast.success("Spot baru dibikin — pending review admin. Event lo udah terhubung.");
    });
  }

  return (
    <div className="rounded-card border border-hairline bg-cream/40 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-body-sm font-semibold text-ink">
            Spot <span className="text-caption text-muted font-normal">(opsional)</span>
          </p>
          <p className="text-caption text-muted leading-snug">
            Tautkan event ke tempat fisik (cafe / rak buku publik / community space) biar
            event-event lain di sana ke-stack. Free-text lokasi di bawah tetap aktif sebagai
            fallback.
          </p>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange("", null)}
            className="shrink-0 text-caption text-muted hover:text-ink underline underline-offset-4"
          >
            Lepas Spot
          </button>
        )}
      </div>

      {selectedSpot ? (
        <div className="flex items-center gap-2 p-2.5 rounded-button bg-paper border border-hairline-strong">
          <span aria-hidden className="text-lg">
            {SPOT_TYPE_OPTIONS.find((t) => t.value === selectedSpot.type)?.emoji ?? "✨"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-body-sm text-ink font-medium truncate">{selectedSpot.name}</p>
            <p className="text-caption text-muted truncate">
              {SPOT_TYPE_OPTIONS.find((t) => t.value === selectedSpot.type)?.label ??
                selectedSpot.type}
              {" · "}
              {selectedSpot.city}
            </p>
          </div>
        </div>
      ) : (
        <Select value="" onChange={(e) => pick(e.target.value)}>
          <option value="">— Pilih Spot atau lewati —</option>
          {allSpots.length === 0 && (
            <option value="" disabled>
              Belum ada Spot aktif.{" "}
              {eligibleHost ? "Bikin baru di bawah ↓" : "Pakai free-text lokasi aja."}
            </option>
          )}
          {allSpots.map((s) => (
            <option key={s.id} value={s.id}>
              {SPOT_TYPE_OPTIONS.find((t) => t.value === s.type)?.emoji ?? "✨"} {s.name} · {s.city}
            </option>
          ))}
        </Select>
      )}

      {/* Inline create */}
      {eligibleHost && !selectedSpot && !creating && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="self-start inline-flex items-center h-9 px-3 rounded-pill bg-paper border border-hairline-strong text-body-sm font-medium text-ink-soft hover:bg-cream"
        >
          + Bikin Spot baru
        </button>
      )}

      {eligibleHost && creating && (
        <div className="flex flex-col gap-3 p-3 rounded-button bg-paper border border-hairline-strong">
          <p className="text-caption text-muted">
            Spot baru lahir dengan status <code className="font-mono">needs_audit</code> — admin
            akan review sebelum muncul publik. Event lo otomatis di-link.
          </p>
          <div>
            <label className="block text-caption font-semibold text-ink mb-1">Nama tempat</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Filosofi Kopi Melawai"
              maxLength={140}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-caption font-semibold text-ink mb-1">Tipe</label>
              <Select value={newType} onChange={(e) => setNewType(e.target.value as SpotType)}>
                {SPOT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.emoji} {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-caption font-semibold text-ink mb-1">Kota</label>
              <Input
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="Semarang"
                maxLength={120}
              />
            </div>
          </div>
          <div>
            <label className="block text-caption font-semibold text-ink mb-1">
              Maps URL <span className="text-muted font-normal">(opsional)</span>
            </label>
            <Input
              type="url"
              value={newMapsUrl}
              onChange={(e) => setNewMapsUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/…"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={cancelInline}
              disabled={submitting}
              className="flex-1"
            >
              Batal
            </Button>
            <Button onClick={submitInline} disabled={submitting} className="flex-1">
              {submitting ? "Bikin…" : "Bikin Spot"}
            </Button>
          </div>
        </div>
      )}

      {!eligibleHost && !selectedSpot && (
        <p className="text-caption text-muted italic">
          Cuma host yang udah pernah bikin event yang bisa bikin Spot baru. Lo masih bisa pilih dari
          Spot yang udah ada, atau pakai free-text lokasi di bawah.
        </p>
      )}
    </div>
  );
}
