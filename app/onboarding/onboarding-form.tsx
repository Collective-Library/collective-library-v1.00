"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugify, normalizePhone } from "@/lib/format";
import type { Profile } from "@/types";

type Step = 1 | 2 | 3;

export function OnboardingForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Step 1 — identity
  const [fullName, setFullName] = useState(initial.full_name ?? "");
  const [username, setUsername] = useState(initial.username ?? "");
  const [city, setCity] = useState(initial.city ?? "Semarang");

  // Step 2 — contact
  const [instagram, setInstagram] = useState(initial.instagram ?? "");
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp ?? "");
  const [whatsappPublic, setWhatsappPublic] = useState(initial.whatsapp_public ?? false);
  const [discord, setDiscord] = useState(initial.discord ?? "");
  const [goodreads, setGoodreads] = useState(initial.goodreads_url ?? "");
  const [storygraph, setStorygraph] = useState(initial.storygraph_url ?? "");

  // Step 3 — bio
  const [bio, setBio] = useState(initial.bio ?? "");
  const [genres, setGenres] = useState<string>((initial.favorite_genres ?? []).join(", "));

  const hasContact = Boolean(instagram || whatsapp || discord || goodreads || storygraph);
  const usernameValid = /^[a-z0-9_.-]{3,30}$/.test(username);

  function next() {
    setError(null);
    if (step === 1) {
      if (!fullName.trim()) return setError("Nama wajib diisi.");
      if (!usernameValid) return setError("Username 3–30 karakter, huruf kecil/angka/-_. saja.");
      setStep(2);
    } else if (step === 2) {
      if (!hasContact) return setError("Minimal isi satu cara kontak ya.");
      setStep(3);
    }
  }

  async function submit() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        username: slugify(username),
        city: city.trim() || "Semarang",
        instagram: instagram.trim() || null,
        whatsapp: normalizePhone(whatsapp),
        whatsapp_public: whatsappPublic && Boolean(whatsapp),
        discord: discord.trim() || null,
        goodreads_url: goodreads.trim() || null,
        storygraph_url: storygraph.trim() || null,
        bio: bio.trim() || null,
        favorite_genres: genres
          ? genres
              .split(",")
              .map((g) => g.trim())
              .filter(Boolean)
          : null,
      })
      .eq("id", initial.id);

    if (error) {
      setSaving(false);
      toast.error("Gagal nyimpen profil. Coba lagi.");
      setError(error.message);
      return;
    }

    // Auto-join Journey Perintis (the default seeded community).
    // Idempotent: PRIMARY KEY on (user_id, community_id) makes re-onboarding safe.
    const { data: jp } = await supabase
      .from("communities")
      .select("id")
      .eq("slug", "journey-perintis")
      .maybeSingle();

    if (jp?.id) {
      await supabase
        .from("community_members")
        .upsert({ user_id: initial.id, community_id: jp.id, role: "member" });
    }

    setSaving(false);
    toast.success("Selamat datang di Collective Library 👋");
    router.replace("/shelf");
    router.refresh();
  }

  return (
    <div className="bg-paper border border-hairline rounded-card-lg shadow-card p-6 md:p-8">
      <Stepper current={step} />

      {step === 1 && (
        <div className="flex flex-col gap-4 mt-6">
          <Input
            label="Nama lengkap"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Cole Hardiyanto"
            required
          />
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="cole.hardiyanto"
            hint="Akan jadi link profil lo: collectivelibrary.id/profile/[username]"
            required
          />
          <Input
            label="Kota"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Semarang"
          />
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5 mt-6">
          <p className="text-body-sm text-muted">
            Ini yang orang pakai buat hubungin lo soal buku.{" "}
            <span className="text-ink-soft font-medium">Minimal isi satu</span> ya.
          </p>

          <Input
            label="Instagram username"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
            placeholder="cole.hardiyanto"
          />

          <div className="flex flex-col gap-2">
            <Input
              label="WhatsApp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="6281234567890"
              hint="Format: kode negara + nomor (tanpa +). Contoh: 6281234567890"
              inputMode="tel"
            />
            <label className="flex items-center gap-2.5 mt-1 text-body-sm text-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappPublic}
                onChange={(e) => setWhatsappPublic(e.target.checked)}
                className="w-4 h-4 accent-(--color-ink)"
              />
              Tampilkan WhatsApp gue ke publik
            </label>
          </div>

          <Input
            label="Discord username"
            value={discord}
            onChange={(e) => setDiscord(e.target.value)}
            placeholder="cole#1234 atau coleh"
          />

          <Input
            label="Goodreads"
            value={goodreads}
            onChange={(e) => setGoodreads(e.target.value)}
            placeholder="https://goodreads.com/user/show/12345-cole"
            hint="Paste link profil Goodreads lo (opsional)"
            type="url"
          />

          <Input
            label="StoryGraph"
            value={storygraph}
            onChange={(e) => setStorygraph(e.target.value)}
            placeholder="https://thestorygraph.com/profile/cole"
            hint="Paste link profil StoryGraph lo (opsional)"
            type="url"
          />
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5 mt-6">
          <Textarea
            label="Bio singkat"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Beberapa kalimat tentang bacaan lo, mood, atau genre favorit."
            rows={4}
          />
          <Input
            label="Genre favorit"
            value={genres}
            onChange={(e) => setGenres(e.target.value)}
            placeholder="filsafat, fiksi sejarah, sains populer"
            hint="Pisah pakai koma."
          />

          {/* Permission-style Discord invite — ngajak, gak maksa */}
          <div className="rounded-card-lg border border-hairline bg-cream/40 p-4">
            <p className="text-caption font-semibold text-ink uppercase tracking-wide">💬 Bonus</p>
            <p className="mt-1.5 text-body-sm text-ink-soft leading-relaxed">
              Diskusi buku lebih hidup di Discord. Gabung kapan aja —{" "}
              <a
                href="https://discord.gg/2nCu5p9Hsd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink font-medium underline underline-offset-4"
              >
                discord.gg/2nCu5p9Hsd
              </a>
              . Skip dulu juga gapapa.
            </p>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-caption text-(--color-error)">{error}</p>}

      <div className="mt-7 flex items-center justify-between gap-3">
        {step > 1 ? (
          <Button variant="ghost" onClick={() => setStep((s) => (s - 1) as Step)} type="button">
            ← Kembali
          </Button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <Button onClick={next} type="button">
            Lanjut
          </Button>
        ) : (
          <Button onClick={submit} disabled={saving} type="button">
            {saving ? "Sebentar, lagi nyiapin rak kamu…" : "Selesai & masuk"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={"h-1 flex-1 rounded-pill " + (n <= current ? "bg-ink" : "bg-hairline")}
        />
      ))}
    </div>
  );
}
