import Link from "next/link";
import { topContributors, topOwners, areaSpread, interestCounts, intentCounts } from "@/lib/mastermind/community";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function CommunityIntelligencePage() {
  const [contributors, owners, areas, interests, intents] = await Promise.all([
    topContributors(10),
    topOwners(10),
    areaSpread(15),
    interestCounts(),
    intentCounts(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Community Intelligence
        </p>
        <h1 className="font-display text-display-xl text-ink leading-tight">
          Siapa yang gerakin sistem ini.
        </h1>
        <p className="text-body text-ink-soft max-w-2xl">
          Top contributor (30d activity), top book owner, geographic spread, dan
          interest/intent distribution. Pakai untuk identifikasi core contributor
          potential, hot kecamatan, dan demand signal.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Top contributor (activity 30d)" subtitle="Distinct event count di activity_log">
          {contributors.length === 0 ? (
            <Empty>Belum ada activity di 30 hari terakhir.</Empty>
          ) : (
            <ol className="flex flex-col gap-2">
              {contributors.map((c, i) => (
                <li key={c.user_id}>
                  <Link
                    href={`/mastermind/users/${c.user_id}`}
                    className="flex items-center gap-3 bg-cream/40 hover:bg-cream border border-hairline-soft rounded-card p-2.5 transition-colors"
                  >
                    <span className="font-display text-title-md text-muted w-6 text-right">{i + 1}</span>
                    <Avatar src={c.photo_url} name={c.full_name} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-ink font-medium truncate">
                        {c.full_name ?? `@${c.username}`}
                      </p>
                      {c.username && <p className="text-caption text-muted truncate">@{c.username}</p>}
                    </div>
                    <span className="font-mono text-body-sm text-ink-soft">{c.event_count}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Top book owner" subtitle="Total buku ke-list">
          {owners.length === 0 ? (
            <Empty>Belum ada owner.</Empty>
          ) : (
            <ol className="flex flex-col gap-2">
              {owners.map((o, i) => (
                <li key={o.user_id}>
                  <Link
                    href={`/mastermind/users/${o.user_id}`}
                    className="flex items-center gap-3 bg-cream/40 hover:bg-cream border border-hairline-soft rounded-card p-2.5 transition-colors"
                  >
                    <span className="font-display text-title-md text-muted w-6 text-right">{i + 1}</span>
                    <Avatar src={o.photo_url} name={o.full_name} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-ink font-medium truncate">
                        {o.full_name ?? `@${o.username}`}
                      </p>
                      {o.username && <p className="text-caption text-muted truncate">@{o.username}</p>}
                    </div>
                    <span className="font-mono text-body-sm text-ink-soft">{o.book_count} buku</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Area distribution" subtitle="Member per kota / kecamatan">
          {areas.length === 0 ? (
            <Empty>Belum ada data lokasi.</Empty>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {areas.map((a, i) => (
                <li key={`${a.city}-${a.area}-${i}`} className="flex items-center justify-between gap-3 px-2.5 py-2 bg-cream/40 border border-hairline-soft rounded-button">
                  <span className="text-body-sm text-ink truncate">
                    {a.city}{a.area && <span className="text-muted"> · {a.area}</span>}
                  </span>
                  <span className="font-mono text-caption text-ink-soft shrink-0">{a.member_count}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Interest distribution (Layer 1)" subtitle="Slug count across profiles">
          {interests.length === 0 ? (
            <Empty>Belum ada interest data.</Empty>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {interests.slice(0, 12).map((it) => (
                <li key={it.slug} className="flex items-center justify-between gap-3 px-2.5 py-2 bg-cream/40 border border-hairline-soft rounded-button">
                  <span className="text-body-sm text-ink-soft font-mono">{it.slug}</span>
                  <span className="font-mono text-caption text-ink-soft">{it.count}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Intent distribution (Layer 3)" subtitle="What members want to DO">
          {intents.length === 0 ? (
            <Empty>Belum ada intent data.</Empty>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {intents.slice(0, 12).map((it) => (
                <li key={it.slug} className="flex items-center justify-between gap-3 px-2.5 py-2 bg-cream/40 border border-hairline-soft rounded-button">
                  <span className="text-body-sm text-ink-soft font-mono">{it.slug}</span>
                  <span className="font-mono text-caption text-ink-soft">{it.count}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 flex flex-col gap-3">
      <div>
        <h2 className="font-display text-title-lg text-ink leading-tight">{title}</h2>
        {subtitle && <p className="text-caption text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-caption text-muted italic">{children}</p>;
}
