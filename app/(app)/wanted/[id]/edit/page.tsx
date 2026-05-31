import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getWantedById } from "@/lib/wanted";
import { WantedForm } from "@/components/wanted/wanted-form";
import { DeleteWantedButton } from "@/components/wanted/delete-wanted-button";
import type { BookCondition } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditWantedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=/wanted/${id}/edit`);

  const wanted = await getWantedById(id);
  if (!wanted) notFound();
  // Ownership gate — non-owners can't reach the edit surface even by direct URL.
  // RLS (wanted_update_own / wanted_delete_own) is the real enforcement; this is
  // the UX guard so the page never renders for a non-owner.
  if (wanted.requester_id !== user.id) notFound();

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Edit WTB Request
        </p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">{wanted.title}</h1>
      </div>

      <WantedForm
        userId={user.id}
        mode="edit"
        wantedId={wanted.id}
        defaultTitle={wanted.title}
        defaultAuthor={wanted.author ?? ""}
        defaultBudget={wanted.max_budget != null ? String(wanted.max_budget) : ""}
        defaultCondition={(wanted.desired_condition as BookCondition | null) ?? ""}
        defaultCity={wanted.city ?? "Semarang"}
        defaultNotes={wanted.notes ?? ""}
      />

      <div className="mt-8 pt-6 border-t border-hairline">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-2">
          Danger zone
        </p>
        <p className="text-body-sm text-ink-soft mb-3">
          Hapus WTB request ini permanen. Nggak bisa di-undo.
        </p>
        <DeleteWantedButton wantedId={wanted.id} />
      </div>
    </div>
  );
}
