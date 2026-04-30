import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { BulkAddForm } from "@/components/books/bulk-add-form";

export const dynamic = "force-dynamic";

export default async function BulkAddBookPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/book/add/bulk");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">Tambah cepat</p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Cari & pilih banyak buku sekaligus
        </h1>
        <p className="mt-2 text-body text-muted max-w-xl">
          Mager isi satu-satu? Cari di kotak bawah, klik buku yang lo punya — masuk ke daftar. Pilih status sekali, publikasikan semua sekaligus.
        </p>
      </div>
      <BulkAddForm userId={user.id} />
    </div>
  );
}
