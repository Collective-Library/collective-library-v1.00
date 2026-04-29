"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { slugify } from "@/lib/format";
import type { Profile } from "@/types";

export function ProfileEditForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // Identity
  const [fullName, setFullName] = useState(initial.full_name ?? "");
  const [username, setUsername] = useState(initial.username ?? "");
  const [city, setCity] = useState(initial.city ?? "Semarang");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [genres, setGenres] = useState((initial.favorite_genres ?? []).join(", "));

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial.photo_url);

  // Contact
  const [instagram, setInstagram] = useState(initial.instagram ?? "");
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp ?? "");
  const [whatsappPublic, setWhatsappPublic] = useState(initial.whatsapp_public);
  const [discord, setDiscord] = useState(initial.discord ?? "");
  const [goodreads, setGoodreads] = useState(initial.goodreads_url ?? "");
  const [storygraph, setStorygraph] = useState(initial.storygraph_url ?? "");

  // Preferences
  const [openLending, setOpenLending] = useState(initial.open_for_lending);
  const [openSelling, setOpenSelling] = useState(initial.open_for_selling);
  const [openTrade, setOpenTrade] = useState(initial.open_for_trade);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError("Ukuran foto maks 3MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    if (!fullName.trim()) {
      setSaving(false);
      return setError("Nama wajib diisi.");
    }
    const usernameSlug = slugify(username);
    if (!/^[a-z0-9_.-]{3,30}$/.test(usernameSlug)) {
      setSaving(false);
      return setError("Username 3–30 karakter, huruf kecil/angka/-_. saja.");
    }
    const hasContact = Boolean(instagram || whatsapp || discord || goodreads || storygraph);
    if (!hasContact) {
      setSaving(false);
      return setError("Minimal satu cara kontak harus tetap diisi.");
    }

    // Upload new photo if selected
    let photo_url: string | null = initial.photo_url;
    if (photoFile) {
      const ext = photoFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${initial.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("book-covers") // reuse the bucket; path-prefixed by user id
        .upload(path, photoFile, { upsert: true, contentType: photoFile.type });
      if (upErr) {
        setSaving(false);
        return setError(`Upload foto gagal: ${upErr.message}`);
      }
      const { data: pub } = supabase.storage.from("book-covers").getPublicUrl(path);
      // bust cache so the new image shows immediately
      photo_url = `${pub.publicUrl}?t=${Date.now()}`;
    }

    const { error: updErr } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        username: usernameSlug,
        city: city.trim() || "Semarang",
        bio: bio.trim() || null,
        favorite_genres: genres
          ? genres.split(",").map((g) => g.trim()).filter(Boolean)
          : null,
        photo_url,
        instagram: instagram.trim() || null,
        whatsapp: whatsapp.replace(/\D/g, "") || null,
        whatsapp_public: whatsappPublic && Boolean(whatsapp),
        discord: discord.trim() || null,
        goodreads_url: goodreads.trim() || null,
        storygraph_url: storygraph.trim() || null,
        open_for_lending: openLending,
        open_for_selling: openSelling,
        open_for_trade: openTrade,
      })
      .eq("id", initial.id);

    setSaving(false);
    if (updErr) {
      if (updErr.code === "23505") {
        return setError("Username udah dipake orang lain. Coba yang lain.");
      }
      return setError(updErr.message);
    }

    setInfo("Tersimpan ✓");
    router.replace(`/profile/${usernameSlug}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="bg-paper border border-hairline rounded-card-lg shadow-card p-6 md:p-8 flex flex-col gap-6">
      {/* Photo */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-20 h-20 rounded-pill overflow-hidden border border-hairline-strong hover:border-ink transition-colors"
          aria-label="Ganti foto profil"
        >
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <Avatar name={fullName} size={80} />
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          className="hidden"
        />
        <div>
          <p className="text-body-sm font-medium text-ink">Foto profil</p>
          <p className="text-caption text-muted mt-0.5">Klik foto buat ganti. Maks 3MB.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Nama lengkap"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          required
          hint="3–30 karakter. Huruf kecil, angka, dan -_. saja."
        />
      </div>

      <Input
        label="Kota"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Semarang"
      />

      <Textarea
        label="Bio singkat"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Beberapa kalimat tentang bacaan lo, mood, atau genre favorit."
        rows={3}
      />

      <Input
        label="Genre favorit"
        value={genres}
        onChange={(e) => setGenres(e.target.value)}
        placeholder="filsafat, fiksi sejarah, sains populer"
        hint="Pisah pakai koma."
      />

      <hr className="border-hairline" />

      <div>
        <p className="text-caption font-semibold text-ink uppercase tracking-wide">Kontak</p>
        <p className="mt-1 text-body-sm text-muted">Minimal satu harus tetap keisi.</p>
      </div>

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
          hint="Format: kode negara + nomor (tanpa +)."
          inputMode="tel"
        />
        <label className="flex items-center gap-2.5 mt-1 text-body-sm text-ink-soft cursor-pointer">
          <input
            type="checkbox"
            checked={whatsappPublic}
            onChange={(e) => setWhatsappPublic(e.target.checked)}
            className="w-4 h-4 accent-(--color-ink)"
          />
          Tampilkan WhatsApp ke publik
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
        type="url"
      />

      <Input
        label="StoryGraph"
        value={storygraph}
        onChange={(e) => setStorygraph(e.target.value)}
        placeholder="https://thestorygraph.com/profile/cole"
        type="url"
      />

      <hr className="border-hairline" />

      <div>
        <p className="text-caption font-semibold text-ink uppercase tracking-wide">Preferensi</p>
        <p className="mt-1 text-body-sm text-muted">Mau buka untuk apa aja? Bisa diubah kapan saja.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Toggle label="Available untuk pinjam-meminjam" checked={openLending} onChange={setOpenLending} />
        <Toggle label="Available untuk jual-beli" checked={openSelling} onChange={setOpenSelling} />
        <Toggle label="Available untuk tukar buku" checked={openTrade} onChange={setOpenTrade} />
      </div>

      {error && <p className="text-caption text-(--color-error)">{error}</p>}
      {info && <p className="text-caption text-(--color-success)">{info}</p>}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Batal
        </Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? "Menyimpan…" : "Simpan perubahan"}
        </Button>
      </div>
    </form>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 cursor-pointer">
      <span className="text-body text-ink">{label}</span>
      <span
        className={
          "relative inline-flex h-6 w-11 rounded-pill transition-colors " +
          (checked ? "bg-ink" : "bg-hairline-strong")
        }
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span
          className={
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-pill bg-paper transition-transform " +
            (checked ? "translate-x-5" : "translate-x-0")
          }
        />
      </span>
    </label>
  );
}
