"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ContactMethod, Event, EventFormValues, EventVisibility } from "@/types";

type Step = 1 | 2;
type Mode = "create" | "edit";

interface Props {
  userId: string;
  mode: Mode;
  initial?: Event;
}

const CONTACT_OPTIONS: { value: ContactMethod; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "discord", label: "Discord" },
];

const VISIBILITY_OPTIONS: { value: EventVisibility; label: string }[] = [
  { value: "public", label: "Publik — semua bisa lihat" },
  { value: "community", label: "Komunitas — anggota Journey Perintis" },
];

export function EventForm({ userId, mode, initial }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [startsAt, setStartsAt] = useState(
    initial?.starts_at ? initial.starts_at.slice(0, 16) : "",
  );
  const [endsAt, setEndsAt] = useState(
    initial?.ends_at ? initial.ends_at.slice(0, 16) : "",
  );
  const [locationText, setLocationText] = useState(initial?.location_text ?? "");
  const [locationUrl, setLocationUrl] = useState(initial?.location_url ?? "");
  const [isOnline, setIsOnline] = useState(initial?.is_online ?? false);

  const [description, setDescription] = useState(initial?.description ?? "");
  const [capacity, setCapacity] = useState(initial?.capacity?.toString() ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? "");
  const [contactMethod, setContactMethod] = useState<ContactMethod>(
    initial?.contact_method ?? "whatsapp",
  );
  const [visibility, setVisibility] = useState<EventVisibility>(
    initial?.visibility ?? "public",
  );

  function validateStep1(): string | null {
    if (title.trim().length < 3) return "Judul event minimal 3 karakter.";
    if (!startsAt) return "Tanggal mulai harus diisi.";
    if (endsAt && endsAt <= startsAt) return "Waktu selesai harus setelah waktu mulai.";
    if (!isOnline && !locationText.trim()) return "Lokasi event harus diisi (atau centang Online).";
    return null;
  }

  async function handleSubmit() {
    setError(null);
    setSaving(true);

    const supabase = createClient();
    const values: EventFormValues = {
      title: title.trim(),
      description: description.trim() || undefined,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: endsAt ? new Date(endsAt).toISOString() : undefined,
      location_text: locationText.trim() || undefined,
      location_url: locationUrl.trim() || undefined,
      is_online: isOnline,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      cover_url: coverUrl.trim() || undefined,
      contact_method: contactMethod,
      visibility,
    };

    try {
      if (mode === "create") {
        const { data, error: insertErr } = await supabase
          .from("events")
          .insert({ ...values, host_id: userId })
          .select("id")
          .single();

        if (insertErr || !data) {
          setError(insertErr?.message ?? "Gagal bikin event.");
          return;
        }
        toast.success("Event berhasil dibuat!");
        router.replace(`/event/${data.id as string}`);
      } else {
        const { error: updateErr } = await supabase
          .from("events")
          .update(values)
          .eq("id", initial!.id);

        if (updateErr) {
          setError(updateErr.message);
          return;
        }
        toast.success("Event diupdate.");
        router.replace(`/event/${initial!.id}`);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {([1, 2] as Step[]).map((s) => (
          <div
            key={s}
            className={
              "h-1.5 flex-1 rounded-full transition-colors " +
              (step >= s ? "bg-ink" : "bg-cream border border-hairline")
            }
          />
        ))}
      </div>

      {error && (
        <p className="text-body-sm text-red-700 bg-red-50 border border-red-200 rounded-card px-4 py-3">
          {error}
        </p>
      )}

      {/* ── Step 1: When & Where ── */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">
              Judul event <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Diskusi Buku Bulan Mei"
              maxLength={140}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">
                Mulai <span className="text-red-500">*</span>
              </label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">
                Selesai
              </label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_online"
              checked={isOnline}
              onChange={(e) => setIsOnline(e.target.checked)}
              className="w-4 h-4 accent-ink"
            />
            <label htmlFor="is_online" className="text-body-sm text-ink">
              Event online
            </label>
          </div>

          {!isOnline && (
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">
                Lokasi <span className="text-red-500">*</span>
              </label>
              <Input
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Contoh: Treetales Coffee, Semarang"
              />
            </div>
          )}

          {(isOnline || locationText) && (
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">
                Link {isOnline ? "meeting" : "Google Maps"} (opsional)
              </label>
              <Input
                type="url"
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}

          <Button
            onClick={() => {
              const err = validateStep1();
              if (err) { setError(err); return; }
              setError(null);
              setStep(2);
            }}
            className="w-full"
          >
            Lanjut →
          </Button>
        </div>
      )}

      {/* ── Step 2: Details ── */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">
              Deskripsi (opsional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritain event ini buat yang belum tau..."
              rows={4}
              maxLength={4000}
            />
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">
              Kapasitas (opsional)
            </label>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Kosongi kalau tidak terbatas"
              min={1}
            />
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">
              URL cover (opsional)
            </label>
            <Input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://... (link gambar)"
            />
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">
              Kontak host
            </label>
            <Select
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value as ContactMethod)}
            >
              {CONTACT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">
              Siapa yang bisa lihat
            </label>
            <Select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as EventVisibility)}
            >
              {VISIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => { setError(null); setStep(1); }}
              className="flex-1"
              disabled={saving}
            >
              ← Balik
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={saving}>
              {saving ? "Menyimpan..." : mode === "create" ? "Buat Event" : "Simpan Perubahan"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
