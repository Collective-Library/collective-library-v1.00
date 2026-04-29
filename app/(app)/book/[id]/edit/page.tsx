import { notFound, redirect } from "next/navigation";
import { getBookById } from "@/lib/books";
import { getCurrentUser } from "@/lib/auth";
import { EditBookForm } from "@/components/books/edit-book-form";

export const dynamic = "force-dynamic";

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=/book/${id}/edit`);

  const book = await getBookById(id);
  if (!book) notFound();

  // Only the owner can edit. Anyone else gets bounced to the read-only page.
  if (book.owner_id !== user.id) redirect(`/book/${id}`);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">Edit buku</p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          {book.title}
        </h1>
      </div>
      <EditBookForm book={book} />
    </div>
  );
}
