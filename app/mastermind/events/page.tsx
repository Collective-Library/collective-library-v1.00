import { SectionEmpty } from "@/components/mastermind/section-empty";

export const metadata = { title: "Events & Knowledge · Mastermind" };

export default function EventsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Events & Knowledge Loop
        </p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Tracking event + knowledge artifacts.
        </h1>
      </header>
      <SectionEmpty
        phase={2}
        title="Belum ada events table."
        reason="Section ini bakal kasih log event komunitas (book club, diskusi, workshop), output knowledge dari tiap event, dan koneksi event ↔ buku ↔ insight. Sesuai KR Q2-2026-O4-KR1 (setiap event ada knowledge output)."
        needs={[
          "Migration baru: events (id, title, date, type, owner_id, participant_count, related_books[], output_link, key_insights, follow_up_actions, related_okr, status)",
          "Migration baru: event_participants (event_id, user_id, role) — junction table",
          "Migration baru: knowledge_artifacts (id, event_id, type, title, link, summary)",
          "UI: list event, detail event, form tambah event, link ke book(s)",
          "Auto-compute KR: 'minimum_4_events' = count(events where date in current quarter)",
          "Auto-compute KR: 'activity_book_linked_pct' (sudah implementasi di kr-compute.ts) — tapi events table bakal jadi sumber yang lebih kaya",
        ]}
      />
    </div>
  );
}
