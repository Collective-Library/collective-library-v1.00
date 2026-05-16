"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ManifestMood, ManifestVisibility } from "@/types";

const MOODS: { value: ManifestMood; label: string }[] = [
  { value: "curious", label: "🤔 Curious — lagi penasaran" },
  { value: "hopeful", label: "🌱 Hopeful — ada harapan" },
  { value: "frustrated", label: "😤 Frustrated — ada ganjelan" },
  { value: "grateful", label: "🙏 Grateful — bersyukur" },
  { value: "reflective", label: "🪞 Reflective — lagi mikir-mikir" },
  { value: "playful", label: "🎈 Playful — santai ringan" },
];

const VISIBILITY: { value: ManifestVisibility; label: string }[] = [
  { value: "public", label: "Publik — bisa muncul di X / aktivitas / RSS" },
  { value: "community", label: "Komunitas — anggota Journey Perintis aja" },
];

export function ManifestForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<ManifestMood | "">("");
  const [topic, setTopic] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [visibility, setVisibility] = useState<ManifestVisibility>("public");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedBody = body.trim();
  const bodyTooShort = trimmedBody.length > 0 && trimmedBody.length < 10;
  const charsLeft = 1200 - trimmedBody.length;

  async function submit() {
    setError(null);
    if (trimmedBody.length < 10) {
      setError("Manifesto minimal 10 karakter. Bukan harus panjang, tapi harus ada isinya.");
      return;
    }
    if (trimmedBody.length > 1200) {
      setError("Maksimal 1200 karakter — ringkas aja, biar gampang di-share.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { data, error: insertErr } = await supabase
      .from("manifests")
      .insert({
        author_id: userId,
        body: trimmedBody,
        mood: mood || null,
        topic: topic.trim() || null,
        is_anonymous: isAnonymous,
        visibility,
        status: "pending",
      })
      .select("id")
      .single();

    setSaving(false);

    if (insertErr || !data) {
      setError(insertErr?.message ?? "Gagal kirim manifesto.");
      return;
    }
    toast.success("Manifesto terkirim — nungguin approval admin.");
    router.replace(`/manifest/${data.id as string}`);
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-5">
      {error && (
        <p className="text-body-sm text-red-700 bg-red-50 border border-red-200 rounded-card px-4 py-3">
          {error}
        </p>
      )}

      <div className="p-4 rounded-card bg-cream/60 border border-hairline">
        <p className="text-caption text-ink-soft leading-relaxed">
          💭 <strong>Manifesto</strong> = pemikiran pendek lo soal buku, komunitas, atau dunia.
          Bisa observasi, frustrasi, harapan, atau pengamatan kecil yang penting.
          Bukan blog post — 1-3 kalimat punchy aja. Admin akan review sebelum publik.
        </p>
      </div>

      <div>
        <label className="block text-body-sm font-semibold text-ink mb-1.5">
          Manifesto kamu <span className="text-red-500">*</span>
        </label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Contoh:\n"Buku terbaik yang pernah dibaca seseorang seringkali bukan yang paling terkenal, tapi yang ketemu di waktu yang tepat."`}
          rows={6}
          maxLength={1300}
          className={bodyTooShort ? "border-amber-300" : undefined}
        />
        <div className="flex items-center justify-between mt-1">
          <p className={"text-caption " + (bodyTooShort ? "text-amber-700" : "text-muted")}>
            {bodyTooShort
              ? `Minimal 10 karakter (sekarang ${trimmedBody.length}).`
              : "Tulis padat. Yang berkesan biasanya pendek."}
          </p>
          <p
            className={
              "text-caption " +
              (charsLeft < 0 ? "text-red-700 font-semibold" : "text-muted")
            }
          >
            {charsLeft} char sisa
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-body-sm font-semibold text-ink mb-1.5">
            Mood (opsional)
          </label>
          <Select value={mood} onChange={(e) => setMood(e.target.value as ManifestMood | "")}>
            <option value="">Pilih mood...</option>
            {MOODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-ink mb-1.5">
            Topik (opsional)
          </label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="buku, komunitas, habit..."
            maxLength={80}
          />
        </div>
      </div>

      <div>
        <label className="block text-body-sm font-semibold text-ink mb-1.5">
          Siapa yang bisa lihat
        </label>
        <Select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as ManifestVisibility)}
        >
          {VISIBILITY.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </Select>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-card border border-hairline">
        <input
          type="checkbox"
          id="anon"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="w-4 h-4 mt-1 accent-ink"
        />
        <label htmlFor="anon" className="flex-1 text-body-sm text-ink leading-relaxed">
          Anonymous — tampil sebagai &ldquo;Anonymous&rdquo; ke publik.{" "}
          <span className="text-muted">
            (Admin tetap bisa liat identitas asli buat moderasi.)
          </span>
        </label>
      </div>

      <Button onClick={submit} disabled={saving} className="w-full">
        {saving ? "Mengirim..." : "Kirim manifesto"}
      </Button>
      <p className="text-caption text-muted text-center leading-relaxed">
        Setelah dikirim, admin review dulu. Kalau approve, manifesto muncul di feed publik + bisa di-share ke X.
      </p>
    </div>
  );
}
