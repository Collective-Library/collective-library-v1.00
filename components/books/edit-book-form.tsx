"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookPicker } from "@/components/books/book-picker";
import { CONDITION_LABELS } from "@/lib/status";
import { normalizeIsbn, type BookSearchResult } from "@/lib/openlibrary";
import type { BookCondition, BookStatus, BookWithOwner } from "@/types";

/**
 * Edit form for an existing book. Flat (no steps) — single page with all fields.
 * Adds a Delete button gated behind a confirm. BookPicker available at the top
 * to re-fetch metadata if the original match was wrong.
 */
export function EditBookForm({ book }: { book: BookWithOwner }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [isbn, setIsbn] = useState(book.isbn ?? "");
  const [status, setStatus] = useState<BookStatus>(book.status);
  const [condition, setCondition] = useState<BookCondition>(book.condition);
  const [price, setPrice] = useState<string>(book.price?.toString() ?? "");
  const [negotiable, setNegotiable] = useState(book.negotiable);
  const [lendingDuration, setLendingDuration] = useState<string>(
    book.lending_duration_days?.toString() ?? "14",
  );
  const [pickupArea, setPickupArea] = useState(book.pickup_area ?? "");
  const [genre, setGenre] = useState(book.genre ?? "");
  const [publisher, setPublisher] = useState(book.publisher ?? "");
  const [description, setDescription] = useState(book.description ?? "");
  const [notes, setNotes] = useState(book.notes ?? "");

  // Cover handling
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(book.cover_url);
  const [remoteCoverUrl, setRemoteCoverUrl] = useState<string | null>(book.cover_url);
  const [removeCover, setRemoveCover] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function applyAutofill(b: BookSearchResult) {
    if (b.isbn) setIsbn(b.isbn);
    if (b.title) setTitle(b.title);
    if (b.author) setAuthor(b.author);
    if (b.publisher) setPublisher(b.publisher);
    if (b.description) setDescription(b.description);
    if (b.cover_url) {
      setRemoteCoverUrl(b.cover_url);
      setCoverPreview(b.cover_url);
      setCoverFile(null);
      setRemoveCover(false);
    }
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
    setRemoveCover(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Judul wajib diisi.");
    if (!author.trim()) return setError("Author wajib diisi.");

    setSaving(true);
    const supabase = createClient();

    // Cover resolution:
    // 1. If user removed cover → null
    // 2. If user uploaded new file → upload to storage, use new URL
    // 3. If remote (BookPicker autofilled) URL changed → use that
    // 4. Else → keep existing cover_url
    let cover_url: string | null = book.cover_url;
    if (removeCover) {
      cover_url = null;
    } else if (coverFile) {
      const ext = coverFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${book.owner_id}/${book.id}/cover.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("book-covers")
        .upload(path, coverFile, { upsert: true, contentType: coverFile.type });
      if (upErr) {
        setSaving(false);
        return setError(`Upload cover gagal: ${upErr.message}`);
      }
      const { data: pub } = supabase.storage.from("book-covers").getPublicUrl(path);
      cover_url = `${pub.publicUrl}?t=${Date.now()}`;
    } else if (remoteCoverUrl && remoteCoverUrl !== book.cover_url) {
      cover_url = remoteCoverUrl;
    }

    const { error: updErr } = await supabase
      .from("books")
      .update({
        title: title.trim(),
        author: author.trim(),
        isbn: normalizeIsbn(isbn) || null,
        status,
        condition,
        price: status === "sell" && price ? Number(price) : null,
        negotiable: status === "sell" ? negotiable : false,
        lending_duration_days:
          status === "lend" && lendingDuration ? Number(lendingDuration) : null,
        pickup_area: pickupArea.trim() || null,
        genre: genre.trim() || null,
        publisher: publisher.trim() || null,
        description: description.trim() || null,
        notes: notes.trim() || null,
        cover_url,
      })
      .eq("id", book.id);

    setSaving(false);
    if (updErr) return setError(updErr.message);
    router.replace(`/book/${book.id}`);
    router.refresh();
  }

  async function onDelete() {
    setDeleting(true);
    setError(null);
    const supabase = createClient();
    const { error: delErr } = await supabase.from("books").delete().eq("id", book.id);
    setDeleting(false);
    if (delErr) {
      return setError(`Gagal hapus: ${delErr.message}`);
    }
    router.replace("/shelf");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-paper border border-hairline rounded-card-lg shadow-card p-6 md:p-8 flex flex-col gap-6"
    >
      {/* Re-fetch metadata if the original match was wrong */}
      <div className="rounded-card border border-hairline-soft bg-cream p-3.5">
        <p className="text-caption font-semibold text-ink uppercase tracking-wide">
          Ganti hasil match (opsional)
        </p>
        <p className="mt-1 text-caption text-muted">
          Cari ulang kalau buku yang ke-fetch dari import salah.
        </p>
        <div className="mt-2.5">
          <BookPicker onPick={applyAutofill} />
        </div>
      </div>

      {/* Cover */}
      <div className="flex flex-col gap-2">
        <p className="text-caption font-medium text-ink-soft">Cover buku</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-32 rounded-card overflow-hidden border border-hairline-strong bg-cream hover:border-ink transition-colors flex items-center justify-center"
          >
            {coverPreview && !removeCover ? (
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
          <div className="flex flex-col gap-2">
            <p className="text-caption text-muted">Klik buat ganti. Maks 5MB.</p>
            {(coverPreview || book.cover_url) && !removeCover && (
              <button
                type="button"
                onClick={() => {
                  setRemoveCover(true);
                  setCoverFile(null);
                  setCoverPreview(null);
                  setRemoteCoverUrl(null);
                }}
                className="text-caption text-(--color-error) underline self-start"
              >
                Hapus cover
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Judul"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Input
          label="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
      </div>

      <Input label="ISBN" value={isbn} onChange={(e) => setIsbn(e.target.value)} />

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

      <Select
        label="Kondisi"
        value={condition}
        onChange={(e) => setCondition(e.target.value as BookCondition)}
      >
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
          inputMode="numeric"
        />
      )}

      <Input label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
      <Input
        label="Penerbit"
        value={publisher}
        onChange={(e) => setPublisher(e.target.value)}
      />
      <Textarea
        label="Sinopsis"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
      />
      <Input
        label="Area pickup"
        value={pickupArea}
        onChange={(e) => setPickupArea(e.target.value)}
      />
      <Textarea
        label="Catatan dari owner"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />

      {error && <p className="text-caption text-(--color-error)">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? "Menyimpan…" : "Simpan perubahan"}
        </Button>
      </div>

      {/* Danger zone */}
      <div className="mt-3 pt-5 border-t border-hairline">
        <p className="text-caption font-semibold text-(--color-error) uppercase tracking-wide">
          Danger zone
        </p>
        <p className="mt-1 text-body-sm text-muted">
          Hapus buku ini permanen. Gak bisa di-undo.
        </p>
        {confirmDelete ? (
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmDelete(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="flex-1 bg-(--color-error) text-paper border-transparent hover:opacity-90"
            >
              {deleting ? "Menghapus…" : "Iya, hapus permanen"}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-3 inline-flex h-10 items-center justify-center px-4 rounded-button border border-(--color-error) text-(--color-error) text-body-sm font-medium hover:bg-(--color-error) hover:text-paper transition-colors"
          >
            Hapus buku ini
          </button>
        )}
      </div>
    </form>
  );
}
