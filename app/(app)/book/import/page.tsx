import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { GoodreadsImportForm } from "@/components/books/goodreads-import-form";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/book/import");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">Import</p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Import dari Goodreads
        </h1>
        <p className="mt-2 text-body text-muted max-w-2xl">
          Upload file CSV export Goodreads — buku-buku lo akan masuk ke rak sebagai{" "}
          <span className="font-semibold text-ink">Koleksi</span> (gak otomatis dijual). Lo bisa edit
          tiap-tiap buku setelah import.
        </p>
      </div>

      <details className="mb-6 rounded-card border border-hairline bg-paper p-4">
        <summary className="cursor-pointer text-body-sm font-semibold text-ink">
          Cara dapetin file CSV dari Goodreads
        </summary>
        <ol className="mt-3 ml-5 list-decimal text-body-sm text-ink-soft space-y-1">
          <li>Buka <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener noreferrer" className="underline text-ink">goodreads.com/review/import</a></li>
          <li>Klik <span className="font-semibold">Export Library</span></li>
          <li>Tunggu sebentar, lalu download file <code className="font-mono text-[12px]">goodreads_library_export.csv</code></li>
          <li>Upload di sini</li>
        </ol>
      </details>

      <GoodreadsImportForm userId={user.id} />
    </div>
  );
}
