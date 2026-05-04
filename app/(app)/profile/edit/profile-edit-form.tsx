"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { InterestChips, SubInterestChips, IntentChips } from "@/components/profile/interest-chips";
import Link from "next/link";
import { LocationPicker, type LocationResult } from "@/components/profile/location-picker";
import { pruneOrphanSubs } from "@/lib/interests";
import { slugify, normalizePhone } from "@/lib/format";
import { compressImage, compressionPercent } from "@/lib/compress-image";
import type { Profile } from "@/types";

interface MyBook {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
}

export function ProfileEditForm({
  initial,
  myBooks = [],
}: {
  initial: Profile;
  myBooks?: MyBook[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  // Identity
  const [fullName, setFullName] = useState(initial.full_name ?? "");
  const [username, setUsername] = useState(initial.username ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [genres, setGenres] = useState((initial.favorite_genres ?? []).join(", "));

  // Location — driven by the kecamatan picker. City + address_area + lat/lng
  // all set together when the user picks one. Free-text fallback is gone on
  // purpose: the geocoder gets garbage when input is "Pleburan dst" instead
  // of a canonical kecamatan name.
  const [locationPick, setLocationPick] = useState<LocationResult | null>(null);
  const [city, setCity] = useState(initial.city ?? "Semarang");
  const [addressArea, setAddressArea] = useState(initial.address_area ?? "");

  // Trust profile (V2.2)
  const [linkedin, setLinkedin] = useState(initial.linkedin_url ?? "");
  const [website, setWebsite] = useState(initial.website_url ?? "");
  const [profession, setProfession] = useState(initial.profession ?? "");
  const [campus, setCampus] = useState(initial.campus_or_workplace ?? "");
  const [interests, setInterests] = useState<string[]>(initial.interests ?? []);
  const [subInterests, setSubInterests] = useState<string[]>(initial.sub_interests ?? []);
  const [intents, setIntents] = useState<string[]>(initial.intents ?? []);

  // Currently reading (W2)
  const [currentlyReading, setCurrentlyReading] = useState<string>(
    initial.currently_reading_book_id ?? ""
  );

  // Photo (avatar)
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial.photo_url);

  // Banner (cover image at top of profile)
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(initial.cover_url);
  const [removeBanner, setRemoveBanner] = useState(false);

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

  // Privacy: show on community map (opt-in, kecamatan-level only)
  const [showOnMap, setShowOnMap] = useState(initial.show_on_map);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Sanity ceiling — anything past this is almost certainly a video / weird
    // file. We'll compress aggressively at upload time, so 20MB headroom is
    // generous for raw phone photos.
    if (file.size > 20 * 1024 * 1024) {
      setError("File terlalu besar (>20MB). Coba foto yang lain.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function onBannerFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setError("File terlalu besar (>25MB). Coba banner yang lain.");
      return;
    }
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setRemoveBanner(false);
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

    // Upload new photo if selected — compress to WebP first
    let photo_url: string | null = initial.photo_url;
    if (photoFile) {
      let toUpload = photoFile;
      try {
        toUpload = await compressImage(photoFile, "avatar");
        const saved = compressionPercent(photoFile.size, toUpload.size);
        if (saved > 0) {
          toast.message(`Foto profil dikompres ${saved}% (${Math.round(toUpload.size / 1024)}KB)`);
        }
      } catch (compressErr) {
        // Compression failure → fall back to original. Better to upload heavy
        // than fail the whole save.
        console.warn("[avatar compress]", compressErr);
      }
      // Always store as .webp to keep paths consistent + storage tiny.
      const path = `${initial.id}/avatar.webp`;
      const { error: upErr } = await supabase.storage
        .from("book-covers") // reuse the bucket; path-prefixed by user id
        .upload(path, toUpload, { upsert: true, contentType: toUpload.type });
      if (upErr) {
        setSaving(false);
        return setError(`Upload foto gagal: ${upErr.message}`);
      }
      const { data: pub } = supabase.storage.from("book-covers").getPublicUrl(path);
      // bust cache so the new image shows immediately
      photo_url = `${pub.publicUrl}?t=${Date.now()}`;
    }

    // Banner resolution: remove → null, new file → compress + upload, else keep existing
    let cover_url: string | null = initial.cover_url;
    if (removeBanner) {
      cover_url = null;
    } else if (bannerFile) {
      let toUpload = bannerFile;
      try {
        toUpload = await compressImage(bannerFile, "banner");
        const saved = compressionPercent(bannerFile.size, toUpload.size);
        if (saved > 0) {
          toast.message(`Banner dikompres ${saved}% (${Math.round(toUpload.size / 1024)}KB)`);
        }
      } catch (compressErr) {
        console.warn("[banner compress]", compressErr);
      }
      const path = `${initial.id}/banner.webp`;
      const { error: upErr } = await supabase.storage
        .from("book-covers")
        .upload(path, toUpload, { upsert: true, contentType: toUpload.type });
      if (upErr) {
        setSaving(false);
        return setError(`Upload banner gagal: ${upErr.message}`);
      }
      const { data: pub } = supabase.storage.from("book-covers").getPublicUrl(path);
      cover_url = `${pub.publicUrl}?t=${Date.now()}`;
    }

    // Coord resolution — three paths in priority order:
    //   1. Fresh kode pos pick this session → use its lat/lng directly.
    //   2. Existing stored coords → keep them.
    //   3. Fallback: call Nominatim with city + area (legacy free-text users).
    //
    // We only care when show_on_map is true; opt-out clears coords.
    let map_lat: number | null = initial.map_lat;
    let map_lng: number | null = initial.map_lng;
    let geocodeWarning: string | null = null;
    const cityTrim = city.trim() || "Semarang";
    const areaTrim = addressArea.trim();
    const postalCode = locationPick?.postal_code ?? initial.postal_code ?? null;

    if (showOnMap) {
      if (locationPick && locationPick.lat != null && locationPick.lng != null) {
        // Fresh pick this session — most accurate, no network round-trip
        map_lat = locationPick.lat;
        map_lng = locationPick.lng;
      } else if (initial.map_lat != null && initial.map_lng != null && !locationPick) {
        // Reuse stored — user didn't change kode pos this session
        map_lat = initial.map_lat;
        map_lng = initial.map_lng;
      } else {
        // Fallback Nominatim path — only when postal data isn't available
        try {
          const q = areaTrim
            ? `Kecamatan ${areaTrim}, ${cityTrim}, Indonesia`
            : `${cityTrim}, Indonesia`;
          const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = (await res.json()) as
              | { found: true; lat: number; lng: number }
              | { found: false };
            if (data.found) {
              map_lat = data.lat;
              map_lng = data.lng;
            } else {
              map_lat = null;
              map_lng = null;
              geocodeWarning = "Lokasi gak ketemu — pakai kode pos di atas biar pasti.";
            }
          } else {
            geocodeWarning = "Geocoding sementara gagal. Coba simpan lagi nanti.";
          }
        } catch {
          geocodeWarning = "Geocoding sementara gagal. Coba simpan lagi nanti.";
        }
      }
    } else {
      // Opt-out → clear stored coords so we don't keep stale data
      map_lat = null;
      map_lng = null;
    }

    const { error: updErr } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        username: usernameSlug,
        city: cityTrim,
        address_area: areaTrim || null,
        postal_code: postalCode,
        bio: bio.trim() || null,
        favorite_genres: genres
          ? genres
              .split(",")
              .map((g) => g.trim())
              .filter(Boolean)
          : null,
        photo_url,
        cover_url,
        currently_reading_book_id: currentlyReading || null,
        instagram: instagram.trim() || null,
        whatsapp: normalizePhone(whatsapp),
        whatsapp_public: whatsappPublic && Boolean(whatsapp),
        discord: discord.trim() || null,
        goodreads_url: goodreads.trim() || null,
        storygraph_url: storygraph.trim() || null,
        // Trust profile
        linkedin_url: linkedin.trim() || null,
        website_url: website.trim() || null,
        profession: profession.trim() || null,
        campus_or_workplace: campus.trim() || null,
        interests: interests.length ? interests : null,
        sub_interests: (() => {
          const pruned = pruneOrphanSubs(subInterests, interests);
          return pruned.length ? pruned : null;
        })(),
        intents: intents.length ? intents : null,
        open_for_lending: openLending,
        open_for_selling: openSelling,
        open_for_trade: openTrade,
        show_on_map: showOnMap,
        map_lat,
        map_lng,
      })
      .eq("id", initial.id);

    setSaving(false);
    if (updErr) {
      if (updErr.code === "23505") {
        toast.error("Username udah dipake orang lain.");
        return setError("Username udah dipake orang lain. Coba yang lain.");
      }
      toast.error("Gagal nyimpen profil.");
      return setError(updErr.message);
    }

    if (geocodeWarning) {
      toast.warning(geocodeWarning, { duration: 6000 });
    } else {
      toast.success("Profil tersimpan ✓");
    }
    setInfo("Tersimpan ✓");
    router.replace(`/profile/${usernameSlug}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-paper border border-hairline rounded-card-lg shadow-card p-6 md:p-8 flex flex-col gap-6"
    >
      {/* Banner */}
      <div className="flex flex-col gap-2">
        <p className="text-caption font-medium text-ink-soft">Banner / cover</p>
        <button
          type="button"
          onClick={() => bannerRef.current?.click()}
          className="relative h-32 w-full rounded-card-lg overflow-hidden border border-hairline-strong hover:border-ink transition-colors bg-cream"
          aria-label="Ganti banner"
        >
          {bannerPreview && !removeBanner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-caption text-muted">
              + Tambah banner (1280×400 ideal)
            </div>
          )}
        </button>
        <input
          ref={bannerRef}
          type="file"
          accept="image/*"
          onChange={onBannerFile}
          className="hidden"
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-caption text-muted">
            Klik banner buat ganti. Auto-compress ke WebP saat simpan.
          </p>
          {(bannerPreview || initial.cover_url) && !removeBanner && (
            <button
              type="button"
              onClick={() => {
                setRemoveBanner(true);
                setBannerFile(null);
                setBannerPreview(null);
              }}
              className="text-caption text-(--color-error) underline underline-offset-4"
            >
              Hapus banner
            </button>
          )}
        </div>
      </div>

      {/* Photo */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-20 h-20 rounded-pill overflow-hidden border border-hairline-strong hover:border-ink transition-colors shrink-0"
          aria-label="Ganti foto profil"
        >
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <Avatar name={fullName} size={80} />
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <div>
          <p className="text-body-sm font-medium text-ink">Foto profil</p>
          <p className="text-caption text-muted mt-0.5">
            Klik foto buat ganti. Auto-compress ke WebP saat simpan.
          </p>
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

      <div className="flex flex-col gap-2">
        <LocationPicker
          initialPostalCode={initial.postal_code}
          initialDistrict={initial.address_area}
          initialRegency={initial.city}
          onPick={(r) => {
            setLocationPick(r);
            setAddressArea(r.district);
            setCity(r.regency);
          }}
        />
        <p className="text-caption text-muted -mt-1 leading-relaxed">
          Lokasi yang akurat = lo gampang ditemuin temen sekecamatan.{" "}
          <span className="text-ink-soft">Kecamatan-level only</span> — gak ada alamat persis. Mau
          muncul di{" "}
          <Link
            href="/peta"
            target="_blank"
            className="text-ink-soft underline underline-offset-4 hover:text-ink"
          >
            peta komunitas
          </Link>
          ? Aktivin toggle &quot;Tampilin gue publik&quot; di bawah.
        </p>
      </div>

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

      {/* Trust Profile (V2.2) — personal branding fields */}
      <div>
        <p className="text-caption font-semibold text-ink uppercase tracking-wide">Tentang lo</p>
        <p className="mt-1 text-body-sm text-muted">
          Bantu anggota lain kenal lo. Semua opsional — tapi makin lengkap, makin gampang nyambung
          sama yang sefrekuensi.
        </p>
      </div>

      <Input
        label="Profesi / industri"
        value={profession}
        onChange={(e) => setProfession(e.target.value)}
        placeholder="Software Engineer di Tokopedia, Desainer freelance, Mahasiswa Filsafat…"
      />

      <Input
        label="Kampus atau tempat kerja"
        value={campus}
        onChange={(e) => setCampus(e.target.value)}
        placeholder="Universitas Diponegoro / GoTo / Komunitas X"
      />

      <Input
        label="LinkedIn"
        value={linkedin}
        onChange={(e) => setLinkedin(e.target.value)}
        placeholder="https://linkedin.com/in/colehardiyanto"
        type="url"
      />

      <Input
        label="Website / Medium"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="https://colehardiyanto.com atau https://medium.com/@cole"
        hint="Buat orang lebih kenal lo dari tulisan."
        type="url"
      />

      <InterestChips value={interests} onChange={setInterests} min={3} />
      <SubInterestChips broad={interests} value={subInterests} onChange={setSubInterests} />
      <IntentChips value={intents} onChange={setIntents} />

      {/* Currently reading — pick one of your own books */}
      <div className="flex flex-col gap-2">
        <p className="text-caption font-medium text-ink-soft">
          Lagi baca apa? <span className="text-muted">(opsional)</span>
        </p>
        {myBooks.length === 0 ? (
          <p className="text-caption text-muted">
            Tambah buku ke rak lo dulu, baru bisa pilih yang lagi lo baca.
          </p>
        ) : (
          <select
            value={currentlyReading}
            onChange={(e) => setCurrentlyReading(e.target.value)}
            className="h-12 px-3.5 bg-paper text-ink rounded-button border border-hairline-strong focus:outline-none focus:border-ink focus:border-2 focus:px-[13px] transition-colors appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%238B7355%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3e%3cpolyline%20points=%276%209%2012%2015%2018%209%27%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-[right_12px_center] bg-[length:18px] pr-10"
          >
            <option value="">— Lagi gak baca apa-apa —</option>
            {myBooks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} — {b.author}
              </option>
            ))}
          </select>
        )}
        <p className="text-caption text-muted">
          Tampil di header profil lo. Cuma buku-buku yang ada di rak lo yang bisa dipilih.
        </p>
      </div>

      <hr className="border-hairline" />

      <div>
        <p className="text-caption font-semibold text-ink uppercase tracking-wide">Preferensi</p>
        <p className="mt-1 text-body-sm text-muted">
          Mau buka untuk apa aja? Bisa diubah kapan saja.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Toggle
          label="Available untuk pinjam-meminjam"
          checked={openLending}
          onChange={setOpenLending}
        />
        <Toggle label="Available untuk jual-beli" checked={openSelling} onChange={setOpenSelling} />
        <Toggle label="Available untuk tukar buku" checked={openTrade} onChange={setOpenTrade} />
      </div>

      <hr className="border-hairline" />

      <div>
        <p className="text-caption font-semibold text-ink uppercase tracking-wide">
          Visibilitas publik
        </p>
        <p className="mt-1 text-body-sm text-muted">
          Default mati. Aktivin biar anggota lain bisa nemu lo pas nyari pembaca dekat — kecamatan
          only, gak ada alamat persis.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Toggle
          label="Tampilin gue di /peta + landing publik"
          checked={showOnMap}
          onChange={setShowOnMap}
        />
        {showOnMap && (
          <p className="text-caption text-muted -mt-1 leading-relaxed">
            Lo bakal muncul di 2 tempat:{" "}
            <Link
              href="/peta"
              target="_blank"
              className="font-medium text-ink-soft underline underline-offset-4 hover:text-ink"
            >
              /peta
            </Link>{" "}
            (bubble dengan foto + jumlah buku lo) dan di{" "}
            <Link
              href="/"
              target="_blank"
              className="font-medium text-ink-soft underline underline-offset-4 hover:text-ink"
            >
              landing publik
            </Link>{" "}
            (member card pengantar buat visitor baru). Pin di tengah kecamatan, bukan alamat persis.
          </p>
        )}
      </div>

      {error && <p className="text-caption text-(--color-error)">{error}</p>}
      {info && <p className="text-caption text-(--color-success)">{info}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? "Profil kamu lagi dirapihin…" : "Simpan perubahan"}
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
