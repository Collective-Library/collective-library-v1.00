import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AddBookForm } from "@/components/books/add-book-form";

export const dynamic = "force-dynamic";

export default async function AddBookPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/book/add");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">Tambah buku</p>
          <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
            Tambah buku ke rak komunitas
          </h1>
        </div>
        <Link
          href="/book/import"
          className="text-body-sm font-medium text-ink underline underline-offset-4 hover:text-ink-soft"
        >
          Atau import banyak sekaligus →
        </Link>
      </div>
      <AddBookForm userId={user.id} />
    </div>
  );
}
