"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  SLUG_REGEX,
  SPOT_TYPE_OPTIONS,
  SPOT_VISIBILITY_OPTIONS,
  slugify,
} from "@/lib/spots-constants";
import type { Spot, SpotFormValues, SpotType, SpotVisibility } from "@/types";
import { cn } from "@/lib/cn";

type Mode = "create" | "edit";

export interface SpotFormProps {
  mode: Mode;
  initial?: Partial<Spot>;
  /** Existing community options for the dropdown. */
  communities: Array<{ id: string; name: string; slug: string; city: string | null }>;
  /** When `mode='edit'`, the row's id is required for PATCH target. */
  spotId?: string;
}

/**
 * Single admin form used by /mastermind/spots/new and /mastermind/spots/[id].
 *
 * - On create: posts to /api/mastermind/spots and redirects to the new row's
 *   edit page on success.
 * - On edit: posts to /api/mastermind/spots/[id] and refreshes.
 *
 * Slug auto-derives from `name` while the slug input has not been touched.
 * Once the user edits the slug field, auto-derive stops to avoid trampling.
 */
export function SpotForm({ mode, initial, communities, spotId }: SpotFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? (initial?.name ? slugify(initial.name) : ""));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [type, setType] = useState<SpotType>((initial?.type as SpotType) ?? "cafe");
  const [city, setCity] = useState(initial?.city ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [mapsUrl, setMapsUrl] = useState(initial?.maps_url ?? "");
  const [latitude, setLatitude] = useState<string>(
    initial?.latitude != null ? String(initial.latitude) : "",
  );
  const [longitude, setLongitude] = useState<string>(
    initial?.longitude != null ? String(initial.longitude) : "",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [operatingHours, setOperatingHours] = useState(initial?.operating_hours ?? "");
  const [communityId, setCommunityId] = useState<string>(initial?.community_id ?? "");
  const [visibility, setVisibility] = useState<SpotVisibility>(
    (initial?.visibility as SpotVisibility) ?? "public",
  );

  const handleNameChange = (next: string) => {
    setName(next);
    if (!slugTouched) setSlug(slugify(next));
  };

  const handleSlugChange = (next: string) => {
    setSlug(next.toLowerCase());
    setSlugTouched(true);
  };

  const validate = (): string | null => {
    if (name.trim().length < 3 || name.trim().length > 140) {
      return "Nama harus 3–140 karakter.";
    }
    if (!SLUG_REGEX.test(slug)) {
      return "Slug invalid — pakai a-z, 0-9, dan tanda hubung.";
    }
    if (city.trim().length < 1 || city.trim().length > 120) {
      return "Kota harus 1–120 karakter.";
    }
    if (latitude && Number.isNaN(Number(latitude))) return "Latitude harus angka.";
    if (longitude && Number.isNaN(Number(longitude))) return "Longitude harus angka.";
    if (description.length > 2000) return "Deskripsi maks 2000 karakter.";
    if (operatingHours.length > 500) return "Jam buka maks 500 karakter.";
    return null;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const payload: SpotFormValues = {
      name: name.trim(),
      slug,
      type,
      city: city.trim(),
      address: address || undefined,
      maps_url: mapsUrl || undefined,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      description: description || undefined,
      image_url: imageUrl || undefined,
      operating_hours: operatingHours || undefined,
      community_id: communityId || undefined,
      visibility,
    };

    startTransition(async () => {
      const url =
        mode === "create"
          ? "/api/mastermind/spots"
          : `/api/mastermind/spots/${spotId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({ error: "Bad response" }))) as
        | { ok: true; id?: string }
        | { error: string };

      if (!res.ok || "error" in json) {
        toast.error("error" in json ? json.error : "Gagal simpan.");
        return;
      }

      if (mode === "create" && "id" in json && json.id) {
        toast.success("Spot dibikin — status awal: needs_audit.");
        router.push(`/mastermind/spots/${json.id}`);
      } else {
        toast.success("Spot di-update.");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FieldRow label="Nama" hint="3–140 karakter. Tampil sebagai judul.">
        <input
          required
          minLength={3}
          maxLength={140}
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Filosofi Kopi Melawai"
          className={baseInput}
        />
      </FieldRow>

      <FieldRow label="Slug" hint="a-z, 0-9, tanda hubung. Auto-derived dari Nama; klik untuk override.">
        <input
          required
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          onBlur={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="filosofi-kopi-melawai"
          pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          className={cn(baseInput, "font-mono text-body-sm")}
        />
      </FieldRow>

      <FieldRow label="Tipe" hint="Pilih kategori ruang fisik.">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as SpotType)}
          className={baseInput}
        >
          {SPOT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.emoji} {o.label}
            </option>
          ))}
        </select>
      </FieldRow>

      <FieldRow label="Kota / kecamatan" hint="Required. Misal: Jakarta Selatan, Semarang Tengah.">
        <input
          required
          maxLength={120}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Semarang"
          className={baseInput}
        />
      </FieldRow>

      <FieldRow label="Alamat lengkap" hint="Optional. Jalan + nomor + landmark.">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Jl. Pemuda No. 1"
          className={baseInput}
        />
      </FieldRow>

      <FieldRow label="Maps URL" hint="Optional. Tempel link Google Maps / OSM.">
        <input
          type="url"
          value={mapsUrl}
          onChange={(e) => setMapsUrl(e.target.value)}
          placeholder="https://maps.app.goo.gl/…"
          className={baseInput}
        />
      </FieldRow>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FieldRow label="Latitude" hint="Optional. Format desimal.">
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="-6.9932"
            className={baseInput}
          />
        </FieldRow>
        <FieldRow label="Longitude" hint="Optional. Format desimal.">
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="110.4203"
            className={baseInput}
          />
        </FieldRow>
      </div>

      <FieldRow label="Deskripsi" hint="Optional. Maks 2000 karakter.">
        <textarea
          rows={4}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Cerita singkat soal Spot ini — vibe, siapa biasa nongkrong, kenapa worth dikunjungi."
          className={cn(baseInput, "resize-y min-h-[100px]")}
        />
      </FieldRow>

      <FieldRow label="Image URL" hint="Optional. Cover image untuk Spot.">
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
          className={baseInput}
        />
      </FieldRow>

      <FieldRow label="Jam buka" hint="Optional. Free-form, maks 500 karakter.">
        <input
          maxLength={500}
          value={operatingHours}
          onChange={(e) => setOperatingHours(e.target.value)}
          placeholder="Senin–Jumat 09:00–22:00, weekend 10:00–23:00"
          className={baseInput}
        />
      </FieldRow>

      <FieldRow label="Community owner" hint="Optional. Komunitas yang ngelola.">
        <select
          value={communityId}
          onChange={(e) => setCommunityId(e.target.value)}
          className={baseInput}
        >
          <option value="">— Tidak ada —</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.city ? ` · ${c.city}` : ""}
            </option>
          ))}
        </select>
      </FieldRow>

      <FieldRow label="Visibility" hint="Public = bisa muncul di future /spots; community = scoped.">
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as SpotVisibility)}
          className={baseInput}
        >
          {SPOT_VISIBILITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FieldRow>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center h-11 px-6 rounded-pill bg-ink text-parchment text-body-sm font-semibold hover:bg-ink-soft disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Menyimpan…" : mode === "create" ? "Bikin Spot" : "Simpan perubahan"}
        </button>
      </div>

      {mode === "create" && (
        <p className="text-caption text-muted">
          Spot baru otomatis lahir dengan status <code className="font-mono">needs_audit</code>.
          Promosi ke <code className="font-mono">active</code> dilakukan dari halaman edit Spot setelah review.
        </p>
      )}
    </form>
  );
}

const baseInput =
  "w-full h-11 px-3.5 bg-paper text-ink rounded-button border border-hairline-strong placeholder:text-muted focus:outline-none focus:border-ink focus:border-2 focus:px-[13px]";

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-caption text-muted uppercase tracking-wide font-semibold">
        {label}
      </label>
      {children}
      {hint && <p className="text-caption text-muted leading-snug">{hint}</p>}
    </div>
  );
}
