import { SectionEmpty } from "@/components/mastermind/section-empty";

export const metadata = { title: "Product Lab · Mastermind" };

export default function ProductLabPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Product Lab & Feature Radar
        </p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Backlog + scoring.
        </h1>
      </header>
      <SectionEmpty
        phase={2}
        title="Belum ada feature_ideas table (atau feedback bisa di-promote)."
        reason="Section ini bakal kasih backlog buat ide / bug / feature dari founder note + user feedback. Setiap ide di-scoring (Impact + Urgency + Confidence + Strategic Fit − Effort) biar prioritisasi sprint jadi defensible."
        needs={[
          "Pilihan A: Promote existing feedback table — tambah kolom impact, urgency, confidence, strategic_fit, effort, sprint_target",
          "Pilihan B: Migration baru feature_ideas (lebih clean — feedback tetap raw inbox, ideas tetap curated)",
          "UI: list + sorting by priority score, filter by sprint, link ke OKR",
          "Scoring formula visible (no black box) — pakai pattern yang sama dengan ScoreBadge di User Intelligence",
          "Recommendation: A dulu (hemat schema), upgrade ke B kalau backlog grow",
        ]}
      />
    </div>
  );
}
