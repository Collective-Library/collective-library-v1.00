/**
 * EcosystemLoopExplainer — static landing section, no data fetch.
 *
 * Renders the 6-step community loop (Profile → Signal → Discovery →
 * Contact → Trust → Activity) using vocabulary from BUSINESS_PROCESS.md.
 *
 * Layout: single-column on mobile, 2-col on sm, 3-col on lg.
 */

const STEPS = [
  {
    n: "01",
    label: "Profile",
    body: "Isi rak buku, set lokasi, dan pasang interest. Lo mulai keliatan di komunitas.",
  },
  {
    n: "02",
    label: "Signal",
    body: "Tambahin buku, post WTB, RSVP event, atau tulis manifest. Setiap gerakan itu sinyal.",
  },
  {
    n: "03",
    label: "Discovery",
    body: "Anjir, ternyata orang dekat lo punya buku yang sama. Atau mau ke event yang sama.",
  },
  {
    n: "04",
    label: "Contact",
    body: "Tap chat. Trust udah ada dari komunitas yang sama. Tinggal diterusin.",
  },
  {
    n: "05",
    label: "Trust",
    body: "Buku berpindah. Ide ngalir. Hubungan jadi lebih nyata dari sekadar satu group WA.",
  },
  {
    n: "06",
    label: "Activity",
    body: "Setiap gerakan masuk ke feed komunitas, dan jadi sinyal buat anggota berikutnya.",
  },
] as const;

export function EcosystemLoopExplainer() {
  return (
    <section
      className="px-6 md:px-10 py-14 md:py-16 bg-cream"
      aria-label="Ekosistem Collective Library"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-8 md:mb-10">
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">Ekosistem</p>
          <h2 className="mt-3 font-display text-display-lg text-ink leading-tight">
            Dari profil ke pergerakan.
          </h2>
          <p className="mt-3 text-body text-ink-soft max-w-xl mx-auto">
            Collective Library bukan app. Ini jaringan sinyal yang jalan terus selama anggotanya
            aktif.
          </p>
        </div>

        {/* 6 steps */}
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <li
              key={s.label}
              className="flex flex-col gap-1.5 p-5 rounded-card-lg border border-hairline bg-paper"
            >
              <span
                aria-hidden="true"
                className="font-display text-display-xl text-muted leading-none select-none"
              >
                {s.n}
              </span>
              <h3 className="font-display text-title-lg text-ink">{s.label}</h3>
              <p className="text-body-sm text-ink-soft leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>

        {/* Loop closes — visual reminder that step 6 feeds back into step 1 */}
        <p className="mt-6 text-caption text-center text-muted">
          Loop kembali ke awal. Setiap sinyal baru memperkaya semua.
        </p>
      </div>
    </section>
  );
}
