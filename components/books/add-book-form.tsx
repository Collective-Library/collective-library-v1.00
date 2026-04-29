"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CONDITION_LABELS } from "@/lib/status";
import { lookupIsbn, normalizeIsbn, type BookSearchResult } from "@/lib/openlibrary";
import { BookPicker } from "@/components/books/book-picker";
import type { BookCondition, BookStatus } from "@/types";

type Step = 1 | 2;

export function AddBookForm({ userId }: { userId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ISBN autofill
  const [isbn, setIsbn] = useState("");
  const [isbnLooking, setIsbnLooking] = useState(false);
  const [isbnCoverUrl, setIsbnCoverUrl] = useState<string | null>(null);
  const [isbnInfo, setIsbnInfo] = useState<string | null>(null);

  // Step 1
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<BookStatus>("unavailable");

  // Step 2 — manual fields (autofilled when ISBN found)
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [condition, setCondition] = useState<BookCondition>("good");
  const [price, setPrice] = useState<string>("");
  const [negotiable, setNegotiable] = useState(false);
  const [lendingDuration, setLendingDuration] = useState<string>("14");
  const [pickupArea, setPickupArea] = useState("");
  const [genre, setGenre] = useState("");
  const [publisher, setPublisher] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  async function lookupByIsbn() {
    setError(null);
    setIsbnInfo(null);
    const cleaned = normalizeIsbn(isbn);
    if (cleaned.length !== 10 && cleaned.length !== 13) {
      return setError("ISBN harus 10 atau 13 digit.");
    }
    setIsbnLooking(true);
    const found = await lookupIsbn(cleaned);
    setIsbnLooking(false);
    if (!found) {
      return setError(
        "ISBN gak ketemu di database publik. Lo bisa isi manual judul + author di bawah.",
      );
    }
    applyAutofill({
      id: cleaned,
      title: found.title ?? "",
      author: found.author ?? null,
      publisher: found.publisher ?? null,
      description: found.description ?? null,
      language: found.language ?? null,
      isbn: cleaned,
      cover_url: found.cover_url ?? null,
      year: null,
    });
  }

  /** Single autofill path used by both BookPicker (search) and ISBN lookup. */
  function applyAutofill(b: BookSearchResult) {
    if (b.isbn) setIsbn(b.isbn);
    if (b.title) setTitle(b.title);
    if (b.author) setAuthor(b.author);
    if (b.publisher) setPublisher(b.publisher);
    if (b.description) setDescription(b.description);
    if (b.cover_url) {
      setIsbnCoverUrl(b.cover_url);
      setCoverPreview(b.cover_url);
    }
    setIsbnInfo(`Ketemu: "${b.title}"${b.author ? ` oleh ${b.author}` : ""}. Lo bisa edit di bawah.`);
  }

  function next() {
    setError(null);
    if (!title.trim()) return setError("Judul wajib diisi.");
    if (!author.trim()) return setError("Author wajib diisi.");
    setStep(2);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran cover maksimal 5MB.");
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    // User-uploaded cover wins over the ISBN-found cover.
    setIsbnCoverUrl(null);
  }

  async function publish(quickAdd = false) {
    setSaving(true);
    setError(null);
    const supabase = createClient();

    // Look up user's primary community so the book inherits the badge.
    const { data: membership } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const community_id = (membership?.community_id as string) ?? null;

    // 1. Insert book first to get an ID. ISBN-found cover URL goes in directly;
    // user-uploaded covers replace it after the storage upload below.
    const { data: book, error: insertErr } = await supabase
      .from("books")
      .insert({
        title: title.trim(),
        author: author.trim(),
        isbn: normalizeIsbn(isbn) || null,
        owner_id: userId,
        community_id,
        status,
        condition: quickAdd ? "good" : condition,
        price: status === "sell" && price ? Number(price) : null,
        negotiable: status === "sell" ? negotiable : false,
        lending_duration_days:
          status === "lend" && lendingDuration ? Number(lendingDuration) : null,
        pickup_area: quickAdd ? null : (pickupArea.trim() || null),
        genre: quickAdd ? null : (genre.trim() || null),
        publisher: quickAdd ? null : (publisher.trim() || null),
        description: quickAdd ? null : (description.trim() || null),
        notes: quickAdd ? null : (notes.trim() || null),
        cover_url: !coverFile && isbnCoverUrl ? isbnCoverUrl : null,
      })
      .select("id")
      .single();

    if (insertErr || !book) {
      setSaving(false);
      setError(insertErr?.message ?? "Gagal menyimpan buku.");
      return;
    }

    // 2. Upload cover if present
    if (!quickAdd && coverFile) {
      const ext = coverFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${book.id}/cover.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("book-covers")
        .upload(path, coverFile, { upsert: true, contentType: coverFile.type });

      if (!upErr) {
        const { data: pub } = supabase.storage.from("book-covers").getPublicUrl(path);
        await supabase.from("books").update({ cover_url: pub.publicUrl }).eq("id", book.id);
      }
    }

    setSaving(false);
    router.replace(`/book/${book.id}`);
    router.refresh();
  }

  return (
    <div className="bg-paper border border-hairline rounded-card-lg shadow-card p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map((n) => (
          <div
            key={n}
            className={"h-1 flex-1 rounded-pill " + (n <= step ? "bg-ink" : "bg-hairline")}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-caption text-muted uppercase tracking-wide font-semibold">Langkah 1 dari 2</p>
            <h2 className="mt-1 font-display text-display-md text-ink">Info dasar buku</h2>
            <p className="mt-1 text-body-sm text-muted">Cuma 3 field — bisa selesai dalam 30 detik.</p>
          </div>

          {/* Cara cepat — search Google Books for any title/author/ISBN, pick from list */}
          <div className="rounded-card border border-hairline-soft bg-cream p-3.5">
            <p className="text-caption font-semibold text-ink uppercase tracking-wide">
              Cara cepat (opsional)
            </p>
            <p className="mt-1 text-caption text-muted">
              Cari buku — judul, author, atau ISBN. Klik dari hasil → semua otomatis keisi termasuk cover.
            </p>
            <div className="mt-2.5">
              <BookPicker onPick={applyAutofill} />
            </div>
            {isbnInfo && (
              <p className="mt-2 text-caption text-(--color-success)">{isbnInfo}</p>
            )}
            {isbnCoverUrl && (
              <p className="mt-1 text-caption text-muted">
                Cover ketemu — preview ada di langkah 2.
              </p>
            )}
            <details className="mt-2.5">
              <summary className="text-caption text-muted cursor-pointer hover:text-ink-soft">
                Atau cari pakai ISBN langsung
              </summary>
              <div className="mt-2 flex gap-2">
                <input
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="9780062316097"
                  inputMode="numeric"
                  className="flex-1 h-10 px-3 bg-paper text-ink rounded-button border border-hairline-strong placeholder:text-muted-soft focus:outline-none focus:border-ink focus:border-2 focus:px-[11px] transition-colors text-body-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={lookupByIsbn}
                  disabled={isbnLooking || !isbn.trim()}
                  variant="secondary"
                >
                  {isbnLooking ? "Cari…" : "Cari ISBN"}
                </Button>
              </div>
            </details>
          </div>

          <Input
            label="Judul"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sapiens"
            required
          />
          <Input
            label="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Yuval Noah Harari"
            required
          />
          <div className="flex flex-col gap-2">
            <p className="text-caption font-medium text-ink-soft">Status</p>
            <div className="grid grid-cols-2 gap-2">
              {(["sell", "lend", "trade", "unavailable"] as BookStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={
                    "h-12 rounded-button border text-body-sm font-medium transition-colors " +
                    (status === s
                      ? "border-ink bg-ink text-parchment"
                      : "border-hairline-strong bg-paper text-ink-soft hover:bg-cream")
                  }
                >
                  {s === "sell" && "Dijual"}
                  {s === "lend" && "Dipinjamkan"}
                  {s === "trade" && "Ditukar"}
                  {s === "unavailable" && "Koleksi (gak dijual)"}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-caption text-(--color-error)">{error}</p>}

          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={() => publish(true)} disabled={saving} type="button" variant="secondary">
              {saving ? "Menyimpan…" : "Simpan cepat (3 field)"}
            </Button>
            <Button onClick={next} disabled={saving} type="button">
              Lanjut isi detail →
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-caption text-muted uppercase tracking-wide font-semibold">Langkah 2 dari 2</p>
            <h2 className="mt-1 font-display text-display-md text-ink">Detail tambahan</h2>
            <p className="mt-1 text-body-sm text-muted">Semua opsional — bisa dilengkapi nanti.</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-caption font-medium text-ink-soft">Cover buku</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative w-24 h-32 rounded-card overflow-hidden border border-hairline-strong bg-cream hover:border-ink transition-colors flex items-center justify-center"
              >
                {coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-caption text-muted">+ Foto</span>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onFile}
                className="hidden"
              />
              <p className="text-caption text-muted">
                Foto cover yang jelas akan bikin buku lo lebih cepat dilirik. Maks 5MB.
              </p>
            </div>
          </div>

          <Select label="Kondisi" value={condition} onChange={(e) => setCondition(e.target.value as BookCondition)}>
            {(Object.keys(CONDITION_LABELS) as BookCondition[]).map((c) => (
              <option key={c} value={c}>
                {CONDITION_LABELS[c]}
              </option>
            ))}
          </Select>

          {status === "sell" && (
            <>
              <Input
                label="Harga (IDR)"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                placeholder="75000"
                inputMode="numeric"
              />
              <label className="flex items-center gap-2.5 text-body-sm text-ink-soft cursor-pointer">
                <input
                  type="checkbox"
                  checked={negotiable}
                  onChange={(e) => setNegotiable(e.target.checked)}
                  className="w-4 h-4 accent-(--color-ink)"
                />
                Bisa nego
              </label>
            </>
          )}

          {status === "lend" && (
            <Input
              label="Durasi pinjam (hari)"
              value={lendingDuration}
              onChange={(e) => setLendingDuration(e.target.value.replace(/\D/g, ""))}
              placeholder="14"
              inputMode="numeric"
            />
          )}

          <Input
            label="Genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="Sains populer, sejarah, fiksi…"
          />
          <Input
            label="Penerbit (opsional)"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            placeholder="Gramedia, Penguin Random House…"
          />
          <Textarea
            label="Sinopsis singkat (opsional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cerita pendek tentang buku ini — atau biarkan kosong kalau ISBN udah otomatis ngisi."
            rows={3}
          />
          <Input
            label="Area pickup"
            value={pickupArea}
            onChange={(e) => setPickupArea(e.target.value)}
            placeholder="Pleburan, dekat UNDIP"
          />
          <Textarea
            label="Catatan"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Misal: cover agak kusam, ada highlighting di bab 3, dll."
          />

          {error && <p className="text-caption text-(--color-error)">{error}</p>}

          <div className="mt-2 flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)} type="button">
              ← Kembali
            </Button>
            <Button onClick={() => publish(false)} disabled={saving} type="button" className="flex-1">
              {saving ? "Mempublikasikan…" : "Publikasikan buku"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
