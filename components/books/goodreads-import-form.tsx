"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseGoodreadsCsv, type GoodreadsBook } from "@/lib/goodreads-csv";
import { openLibraryCoverUrl } from "@/lib/openlibrary";
import { Button } from "@/components/ui/button";

type Phase = "idle" | "parsed" | "importing" | "done";

export function GoodreadsImportForm({ userId }: { userId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [books, setBooks] = useState<GoodreadsBook[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState({ done: 0, total: 0, ok: 0, fail: 0 });
  const [error, setError] = useState<string | null>(null);
  const [filterShelf, setFilterShelf] = useState<string>("all");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const parsed = await parseGoodreadsCsv(file);
      setBooks(parsed);
      // Default selection: only the "to-read" + "read" shelves (skip currently-reading).
      const initial = new Set<number>();
      parsed.forEach((b, i) => {
        if (b.shelf === "to-read" || b.shelf === "read") initial.add(i);
      });
      setSelected(initial);
      setPhase("parsed");
    } catch (err) {
      setError(`Gagal membaca CSV: ${(err as Error).message}`);
    }
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function selectAll(visible: number[]) {
    setSelected((prev) => new Set([...prev, ...visible]));
  }
  function deselectAll(visible: number[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      visible.forEach((i) => next.delete(i));
      return next;
    });
  }

  async function importSelected() {
    if (selected.size === 0) {
      setError("Pilih minimal satu buku.");
      return;
    }
    setError(null);
    setPhase("importing");
    const supabase = createClient();

    // Look up community once for batch
    const { data: membership } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const community_id = (membership?.community_id as string) ?? null;

    const indices = Array.from(selected);
    setProgress({ done: 0, total: indices.length, ok: 0, fail: 0 });

    // Insert in chunks of 50 — large enough for throughput, small enough to avoid REST timeouts.
    const CHUNK = 50;
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < indices.length; i += CHUNK) {
      const slice = indices.slice(i, i + CHUNK);
      const rows = slice.map((idx) => {
        const b = books[idx];
        return {
          title: b.title,
          author: b.author,
          isbn: b.isbn,
          owner_id: userId,
          community_id,
          status: "unavailable" as const,
          condition: "good" as const,
          publisher: b.publisher,
          description: b.description,
          source: "goodreads_import" as const,
          cover_url: b.isbn ? openLibraryCoverUrl(b.isbn) : null,
        };
      });
      const { error: err } = await supabase.from("books").insert(rows);
      if (err) {
        fail += slice.length;
        console.error("import chunk failed", err);
      } else {
        ok += slice.length;
      }
      setProgress({ done: i + slice.length, total: indices.length, ok, fail });
    }

    setPhase("done");
    if (ok > 0) router.refresh();
  }

  // Filter visible
  const shelves = Array.from(new Set(books.map((b) => b.shelf))).sort();
  const visible = books
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => filterShelf === "all" || b.shelf === filterShelf);
  const visibleIndices = visible.map((v) => v.i);
  const visibleSelectedCount = visible.filter((v) => selected.has(v.i)).length;

  // ────────────────────────────────────────────────────────────────────────
  // Phase: idle — file picker
  // ────────────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="rounded-card-lg border border-hairline bg-paper p-8 text-center">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          className="hidden"
        />
        <Button onClick={() => fileRef.current?.click()} type="button">
          Pilih file CSV
        </Button>
        {error && <p className="mt-3 text-caption text-(--color-error)">{error}</p>}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Phase: importing — progress
  // ────────────────────────────────────────────────────────────────────────
  if (phase === "importing") {
    const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <div className="rounded-card-lg border border-hairline bg-paper p-8">
        <p className="font-display text-title-lg text-ink">Mengimpor…</p>
        <p className="mt-1 text-body text-muted">
          {progress.done} dari {progress.total} buku ({pct}%)
        </p>
        <div className="mt-4 h-2 rounded-pill bg-cream overflow-hidden">
          <div
            className="h-full bg-ink transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Phase: done — summary
  // ────────────────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="rounded-card-lg border border-hairline bg-paper p-8">
        <p className="font-display text-display-md text-ink">Selesai ✓</p>
        <p className="mt-2 text-body text-ink-soft">
          {progress.ok} buku berhasil masuk ke rak
          {progress.fail > 0 && <>, {progress.fail} gagal (cek console).</>}.
        </p>
        <p className="mt-1 text-body-sm text-muted">
          Status default: Koleksi (gak dijual). Edit tiap buku kapan aja buat ubah jadi Dijual / Dipinjamkan.
        </p>
        <div className="mt-5 flex gap-2">
          <Button onClick={() => router.replace("/shelf")}>Lihat Rak</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setPhase("idle");
              setBooks([]);
              setSelected(new Set());
              setProgress({ done: 0, total: 0, ok: 0, fail: 0 });
            }}
          >
            Import lagi
          </Button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Phase: parsed — selection table
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-card-lg border border-hairline bg-paper">
      <div className="p-5 border-b border-hairline-soft flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-body font-semibold text-ink">
            {books.length} buku terbaca
          </p>
          <p className="text-caption text-muted">
            {selected.size} dipilih · default: shelf <code className="font-mono">read</code> + <code className="font-mono">to-read</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterShelf}
            onChange={(e) => setFilterShelf(e.target.value)}
            className="h-9 px-3 rounded-button bg-paper text-ink-soft border border-hairline-strong text-body-sm"
          >
            <option value="all">Semua shelf</option>
            {shelves.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {visibleSelectedCount === visible.length ? (
            <Button size="sm" variant="secondary" onClick={() => deselectAll(visibleIndices)}>
              Uncheck visible
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => selectAll(visibleIndices)}>
              Check visible
            </Button>
          )}
        </div>
      </div>

      <ul className="max-h-[560px] overflow-y-auto divide-y divide-hairline-soft">
        {visible.map(({ b, i }) => (
          <li key={i} className="px-5 py-3 flex items-start gap-3">
            <input
              type="checkbox"
              checked={selected.has(i)}
              onChange={() => toggle(i)}
              className="mt-1 w-4 h-4 accent-(--color-ink) shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-semibold text-ink truncate">{b.title}</p>
              <p className="text-caption text-muted truncate">
                {b.author}
                {b.isbn && <> · ISBN {b.isbn}</>}
              </p>
            </div>
            <span className="shrink-0 text-[11px] uppercase tracking-wide font-semibold text-muted px-2 py-0.5 rounded-pill bg-cream border border-hairline">
              {b.shelf}
            </span>
          </li>
        ))}
      </ul>

      <div className="p-5 border-t border-hairline-soft flex items-center justify-between gap-3 flex-wrap">
        {error && <p className="text-caption text-(--color-error) flex-1">{error}</p>}
        <Button
          variant="secondary"
          onClick={() => {
            setPhase("idle");
            setBooks([]);
            setSelected(new Set());
          }}
        >
          Cancel
        </Button>
        <Button onClick={importSelected} disabled={selected.size === 0}>
          Import {selected.size} buku
        </Button>
      </div>
    </div>
  );
}
