import Link from "next/link";
import { notFound } from "next/navigation";
import { getKeyResultById } from "@/lib/mastermind/okrs";
import { computeKr } from "@/lib/mastermind/kr-compute";
import { listNotesFor } from "@/lib/mastermind/admin-notes";
import { KrEditForm } from "@/components/mastermind/kr-edit-form";
import { AdminNotesThread } from "@/components/mastermind/admin-notes-thread";

export const dynamic = "force-dynamic";

export default async function KrEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kr = await getKeyResultById(id);
  if (!kr) notFound();

  // Resolve auto-compute value live so the form shows the right number
  let displayKr = kr;
  if (kr.auto_compute_key) {
    const live = await computeKr(kr.auto_compute_key);
    displayKr = { ...kr, current_value: live };
  }

  const notes = await listNotesFor("okr_key_result", kr.id);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Link
        href="/mastermind/okrs"
        className="text-body-sm text-ink-soft hover:text-ink underline underline-offset-4 decoration-hairline-strong"
      >
        ← Balik ke OKR Control Tower
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold font-mono">
          {kr.code}
        </p>
        <h1 className="font-display text-display-md text-ink leading-tight">
          {kr.title}
        </h1>
        {kr.detail && (
          <p className="text-body text-ink-soft leading-relaxed">{kr.detail}</p>
        )}
      </header>

      <section className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 md:p-6">
        <KrEditForm kr={displayKr} />
      </section>

      <AdminNotesThread entityType="okr_key_result" entityId={kr.id} notes={notes} />
    </div>
  );
}
