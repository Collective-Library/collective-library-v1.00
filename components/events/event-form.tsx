"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EventSpotPicker } from "@/components/events/event-spot-picker";
import type { SelectableSpot } from "@/lib/spots";
import type { ContactMethod, Event, EventFormValues, EventVisibility } from "@/types";

type Step = 1 | 2 | 3;
type Mode = "create" | "edit";

interface Props {
  userId: string;
  mode: Mode;
  initial?: Event;
  /** Spots available to attach (active + public + is_active=true). */
  spots?: SelectableSpot[];
  /** Whether the current user can inline-create a new Spot. */
  eligibleHost?: boolean;
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

/** Split a multi-line/text-list into a clean array. */
function splitLines(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Split hashtags by space or comma; strip leading '#'. */
function splitTags(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map((t) => t.trim().replace(/^#+/, ""))
    .filter(Boolean);
}

export function EventForm({ userId, mode, initial, spots = [], eligibleHost = false }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: When & Where
  const [title, setTitle] = useState(initial?.title ?? "");
  const [startsAt, setStartsAt] = useState(
    initial?.starts_at ? initial.starts_at.slice(0, 16) : ""
  );
  const [endsAt, setEndsAt] = useState(initial?.ends_at ? initial.ends_at.slice(0, 16) : "");
  const [locationText, setLocationText] = useState(initial?.location_text ?? "");
  const [locationUrl, setLocationUrl] = useState(initial?.location_url ?? "");
  const [isOnline, setIsOnline] = useState(initial?.is_online ?? false);
  const [nodeId, setNodeId] = useState<string>(initial?.node_id ?? "");

  // Step 2: Description & vibe
  const [theme, setTheme] = useState(initial?.theme ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [whatToExpect, setWhatToExpect] = useState((initial?.what_to_expect ?? []).join("\n"));
  const [reminderText, setReminderText] = useState(initial?.reminder_text ?? "");
  const [hashtags, setHashtags] = useState((initial?.hashtags ?? []).join(" "));
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? "");

  // Step 3: Registration + social + ops
  const [registrationUrl, setRegistrationUrl] = useState(initial?.registration_url ?? "");
  const [registrationLabel, setRegistrationLabel] = useState(initial?.registration_label ?? "");
  const [registrationDeadline, setRegistrationDeadline] = useState(
    initial?.registration_deadline ? initial.registration_deadline.slice(0, 16) : ""
  );
  const [instagramUrl, setInstagramUrl] = useState(initial?.instagram_url ?? "");
  const [communityName, setCommunityName] = useState(initial?.community_name ?? "");
  const [communityInstagramUrl, setCommunityInstagramUrl] = useState(
    initial?.community_instagram_url ?? ""
  );
  const [communityLogoUrl, setCommunityLogoUrl] = useState(initial?.community_logo_url ?? "");
  const [capacity, setCapacity] = useState(initial?.capacity?.toString() ?? "");
  const [contactMethod, setContactMethod] = useState<ContactMethod>(
    initial?.contact_method ?? "whatsapp"
  );
  const [visibility, setVisibility] = useState<EventVisibility>(initial?.visibility ?? "public");

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
      theme: theme.trim() || undefined,
      what_to_expect: splitLines(whatToExpect).length > 0 ? splitLines(whatToExpect) : undefined,
      hashtags: splitTags(hashtags).length > 0 ? splitTags(hashtags) : undefined,
      reminder_text: reminderText.trim() || undefined,
      registration_url: registrationUrl.trim() || undefined,
      registration_label: registrationLabel.trim() || undefined,
      registration_deadline: registrationDeadline
        ? new Date(registrationDeadline).toISOString()
        : undefined,
      instagram_url: instagramUrl.trim() || undefined,
      community_name: communityName.trim() || undefined,
      community_instagram_url: communityInstagramUrl.trim() || undefined,
      community_logo_url: communityLogoUrl.trim() || undefined,
      node_id: nodeId || null,
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
        {([1, 2, 3] as Step[]).map((s) => (
          <div
            key={s}
            className={
              "h-1.5 flex-1 rounded-full transition-colors " +
              (step >= s ? "bg-ink" : "bg-cream border border-hairline")
            }
          />
        ))}
      </div>
      <p className="text-caption text-muted">
        Step {step} / 3 ·{" "}
        {step === 1 ? "Kapan & di mana" : step === 2 ? "Tentang event" : "Pendaftaran & sosial"}
      </p>

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
              placeholder="Contoh: Share&Connect Vol. 6"
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
              <label className="block text-body-sm font-semibold text-ink mb-1.5">Selesai</label>
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
            <EventSpotPicker
              value={nodeId}
              onChange={(nextId, spot) => {
                setNodeId(nextId);
                // Auto-fill location_text only when empty so we don't trample
                // a host's custom phrasing. Maps URL likewise.
                if (spot) {
                  if (!locationText.trim()) {
                    setLocationText(`${spot.name}, ${spot.city}`);
                  }
                  if (!locationUrl.trim() && spot.maps_url) {
                    setLocationUrl(spot.maps_url);
                  }
                }
              }}
              spots={spots}
              eligibleHost={eligibleHost}
            />
          )}

          {!isOnline && (
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">
                Lokasi <span className="text-red-500">*</span>
              </label>
              <Input
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Contoh: Honest Coffee, Semarang"
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
              if (err) {
                setError(err);
                return;
              }
              setError(null);
              setStep(2);
            }}
            className="w-full"
          >
            Lanjut →
          </Button>
        </div>
      )}

      {/* ── Step 2: Description & vibe ── */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">
              Tagline / tema (opsional)
            </label>
            <Input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Tumbuh bersama sesama 🤝"
              maxLength={200}
            />
            <p className="text-caption text-muted mt-1">
              Sekalimat punchy yang ngegambarin vibe event-nya.
            </p>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">
              Deskripsi (opsional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritain event ini buat yang belum tau. Kenapa bikin? Buat siapa?"
              rows={4}
              maxLength={4000}
            />
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">
              Di event ini kamu bisa... (opsional, satu baris per bullet)
            </label>
            <Textarea
              value={whatToExpect}
              onChange={(e) => setWhatToExpect(e.target.value)}
              placeholder={
                "baca buku favorit dalam suasana santai\nkenalan sama pembaca lain\nshare insight dari buku yang lagi dibaca"
              }
              rows={4}
            />
            <p className="text-caption text-muted mt-1">
              Tiap baris jadi bullet di event page. Bikin jelas apa yg bakal terjadi.
            </p>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">
              Reminder / catatan ke peserta (opsional)
            </label>
            <Textarea
              value={reminderText}
              onChange={(e) => setReminderText(e.target.value)}
              placeholder="Bawa buku yang mau didiskusi, plus IG story tag @collectivelibrary.id yaa 📸"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">
              Hashtag (opsional)
            </label>
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="ShareConnect BookClubSemarang TumbuhBersama"
            />
            <p className="text-caption text-muted mt-1">Pisahkan dengan spasi. Tanpa tanda #.</p>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">
              URL cover image (opsional)
            </label>
            <Input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://... (link gambar)"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              className="flex-1"
            >
              ← Balik
            </Button>
            <Button
              onClick={() => {
                setError(null);
                setStep(3);
              }}
              className="flex-1"
            >
              Lanjut →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Registration + Social + Ops ── */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div className="p-3 rounded-card bg-cream/50 border border-hairline">
            <p className="text-caption text-muted leading-relaxed">
              💡 <strong>RSVP di Collective Library</strong> ngegantiin form pendaftaran terpisah —
              tapi kalo komunitas kamu udah punya Google Form / Lu.ma, link aja di sini. Web app ini
              jadi <em>social visibility layer</em>, bukan ngotot replace flow lama.
            </p>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">
              Link form pendaftaran eksternal (opsional)
            </label>
            <Input
              type="url"
              value={registrationUrl}
              onChange={(e) => setRegistrationUrl(e.target.value)}
              placeholder="https://forms.gle/... atau https://lu.ma/..."
            />
          </div>

          {registrationUrl && (
            <>
              <div>
                <label className="block text-body-sm font-semibold text-ink mb-1.5">
                  Label tombol pendaftaran
                </label>
                <Input
                  value={registrationLabel}
                  onChange={(e) => setRegistrationLabel(e.target.value)}
                  placeholder="Daftar via Google Form"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold text-ink mb-1.5">
                  Deadline pendaftaran (opsional)
                </label>
                <Input
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">
              Instagram post event (opsional)
            </label>
            <Input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/p/..."
            />
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">
              Nama komunitas penyelenggara (opsional)
            </label>
            <Input
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              placeholder="Book Club Semarang"
              maxLength={120}
            />
          </div>

          {communityName && (
            <>
              <div>
                <label className="block text-body-sm font-semibold text-ink mb-1.5">
                  Instagram komunitas (opsional)
                </label>
                <Input
                  type="url"
                  value={communityInstagramUrl}
                  onChange={(e) => setCommunityInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/bookclub_semarang"
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold text-ink mb-1.5">
                  URL logo komunitas (opsional)
                </label>
                <Input
                  type="url"
                  value={communityLogoUrl}
                  onChange={(e) => setCommunityLogoUrl(e.target.value)}
                  placeholder="https://... (link gambar logo)"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">Kapasitas</label>
              <Input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="∞"
                min={1}
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
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
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
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setError(null);
                setStep(2);
              }}
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
