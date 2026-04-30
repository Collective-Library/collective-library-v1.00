import { SectionEmpty } from "@/components/mastermind/section-empty";

export const metadata = { title: "Loan Ledger · Mastermind" };

export default function LoansPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Loan Ledger
        </p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Tracking peminjaman buku.
        </h1>
      </header>
      <SectionEmpty
        phase={3}
        title="Belum ada loan ledger — kontak masih full off-platform (WA/IG/Discord)."
        reason="Saat ini Collective Library sengaja gak punya internal chat (per decision di STATE.md: 'No internal chat ever' — feature, bukan bug). Tapi untuk hit KR Q2-2026-O3-KR2 'Minimal 10 transaksi peminjaman berhasil' kita perlu cara catat loan lifecycle. Phase 3 bakal nge-add minimal ledger tanpa nge-rusak intent off-platform contact."
        needs={[
          "Decision dulu: cara catat loan TANPA chat internal — opsi: (1) borrower self-confirm via tombol \"udah dipinjam\" → \"udah balik\", (2) owner mark sendiri, (3) hybrid 2-confirmation",
          "Migration baru: loans (id, book_id, borrower_id, owner_id, status enum [requested/handover/borrowed/returned/canceled/disputed], requested_at, handover_at, due_at, returned_at, condition_on_return, deposit_held, notes)",
          "UI: track loan lifecycle, dispute resolution, overdue detection",
          "Auto-compute KR: 'completed_loans' (replaces hard-coded current_value at KR Q2-2026-O3-KR2)",
          "Reuse contact pattern: WhatsApp/IG/Discord deep links tetap; loan record cuma metadata layer di atas off-platform handshake",
          "PR scope rekomendasi: design loan UX dulu (Phase 2 product-lab), implement Phase 3",
        ]}
      />
    </div>
  );
}
