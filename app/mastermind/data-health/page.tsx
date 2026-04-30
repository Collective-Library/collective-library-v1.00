import { detectDataIssues } from "@/lib/mastermind/data-health";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const SEVERITY_TONE = {
  high: "bg-(--color-okr-behind-bg) text-(--color-okr-behind)",
  medium: "bg-(--color-okr-at-risk-bg) text-(--color-okr-at-risk)",
  low: "bg-cream text-muted border border-hairline",
};

export default async function DataHealthPage() {
  const issues = await detectDataIssues();

  const totalAffected = issues.reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Data Health & Repair Center
        </p>
        <h1 className="font-display text-display-xl text-ink leading-tight">
          {issues.length === 0 ? "Bersih ✓" : `${issues.length} jenis masalah · ${totalAffected} record terdampak.`}
        </h1>
        <p className="text-body text-ink-soft max-w-2xl">
          Setiap masalah punya severity + suggested fix. PR 1 sengaja TIDAK
          auto-fix data — destructive operation harus eksplisit. Untuk fix
          aman, jalanin SQL yang disuggest atau buat migration baru.
        </p>
      </header>

      {issues.length === 0 ? (
        <div className="bg-paper border border-hairline rounded-card-lg shadow-card p-10 text-center">
          <p className="font-display text-title-lg text-ink">Tidak ada masalah terdeteksi.</p>
          <p className="mt-2 text-body text-muted">
            Data integrity OK. Cek lagi nanti — kalau user activity meningkat, masalah baru bisa muncul.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {issues.map((issue) => (
            <li
              key={issue.type}
              className="bg-paper border border-hairline rounded-card-lg shadow-card p-4 md:p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "inline-flex items-center h-5 px-2 rounded-pill text-[10px] font-semibold tracking-wide",
                      SEVERITY_TONE[issue.severity],
                    )}>
                      {issue.severity.toUpperCase()}
                    </span>
                    <span className="text-caption text-muted font-mono">{issue.type}</span>
                  </div>
                  <h3 className="mt-1 text-body font-medium text-ink leading-snug">
                    {issue.label}
                  </h3>
                  {issue.detail && (
                    <p className="text-caption text-muted">{issue.detail}</p>
                  )}
                </div>
                <span className="font-display text-display-md text-ink leading-none shrink-0">
                  {issue.count}
                </span>
              </div>

              <div className="bg-cream/60 border border-hairline-soft rounded-button p-3">
                <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-1">
                  Suggested fix
                </p>
                <p className="text-body-sm text-ink-soft leading-relaxed">{issue.suggestedFix}</p>
              </div>

              {issue.sample && issue.sample.length > 0 && (
                <details className="text-caption">
                  <summary className="cursor-pointer text-ink-soft hover:text-ink underline underline-offset-4 decoration-hairline-strong">
                    Sample affected IDs ({issue.sample.length})
                  </summary>
                  <ul className="mt-2 flex flex-col gap-0.5">
                    {issue.sample.map((id) => (
                      <li key={id} className="font-mono text-muted">{id}</li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
