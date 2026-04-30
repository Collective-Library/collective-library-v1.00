import { listObjectives } from "@/lib/mastermind/okrs";
import { OkrCard } from "@/components/mastermind/okr-card";

export const dynamic = "force-dynamic";

export default async function OkrControlTowerPage() {
  const objectives = await listObjectives("Q2-2026");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          OKR Control Tower · Q2 2026
        </p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Strategi, dipantau live.
        </h1>
        <p className="mt-2 text-body text-ink-soft max-w-2xl">
          5 Objectives + 25+ Key Results dari masterprompt. KR yang punya{" "}
          <span className="inline-flex items-center h-4 px-1 rounded-pill bg-cream text-muted border border-hairline text-[9px] font-semibold tracking-wide">
            AUTO
          </span>{" "}
          di-resolve live dari data app — sisanya manual entry. Click ke setiap
          KR untuk edit current value, status, dan notes.
        </p>
      </header>

      {objectives.length === 0 ? (
        <div className="bg-paper border border-hairline rounded-card-lg shadow-card p-10 text-center">
          <p className="font-display text-title-lg text-ink">
            OKR belum ada di Q2 2026.
          </p>
          <p className="mt-2 text-body text-muted">
            Migration <code>0015_mastermind_okrs.sql</code> harusnya seed 5 Objective + 25+ KR.
            Verifikasi: <code>select count(*) from okr_objectives where quarter=&apos;Q2-2026&apos;</code>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {objectives.map((o) => (
            <OkrCard key={o.id} objective={o} />
          ))}
        </div>
      )}
    </div>
  );
}
