import { SectionEmpty } from "@/components/mastermind/section-empty";

export const metadata = { title: "Decision Log · Mastermind" };

export default function DecisionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Decision Log & Risk Register
        </p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Memori founder.
        </h1>
      </header>
      <SectionEmpty
        phase={2}
        title="Belum ada decisions table."
        reason="Dashboard tanpa decision log = layar tanpa memori. Section ini bakal nge-rekam decision penting + alasan + opsi yang dipertimbangin + follow-up — biar nanti bisa diliat balik kenapa pilihan tertentu dibuat."
        needs={[
          "Migration baru: decisions (id, title, context, decision, reason, options_considered, owner_id, related_okr_id, follow_up, decided_at, created_at)",
          "Migration baru: risks (id, title, severity, status, owner_id, mitigation, related_okr_id, created_at, updated_at)",
          "UI: list + detail + form tambah, filter by OKR/owner",
          "Cross-link ke OKR & tasks (decision \"X\" muncul di KR \"Y\" detail)",
          "Reuse pattern admin_notes_thread untuk follow-up updates",
        ]}
      />
    </div>
  );
}
