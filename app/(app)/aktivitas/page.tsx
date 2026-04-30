import Link from "next/link";
import { listActivity } from "@/lib/activity";
import { BROAD_INTERESTS } from "@/lib/interests";
import { ActivityFeedList } from "@/components/activity/activity-feed-list";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

type SP = { interest?: string };

export default async function AktivitasPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { interest } = await searchParams;
  const items = await listActivity({ limit: 50, interest });

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">
            Aktivitas komunitas
          </p>
          <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
            Yang lagi terjadi
          </h1>
          <p className="mt-2 text-body text-ink-soft max-w-xl">
            Buku baru, WTB request, anggota baru — semua di satu feed.
          </p>
          <p className="mt-3 text-body-sm">
            <Link
              href="/anggota"
              className="text-ink underline underline-offset-4 font-medium hover:text-ink-soft"
            >
              Browse semua anggota →
            </Link>
          </p>
        </div>
        <a
          href="/feed.xml"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-pill bg-paper text-ink-soft border border-hairline-strong text-body-sm font-medium hover:bg-cream hover:text-ink transition-colors shrink-0"
          title="Subscribe RSS feed (untuk Discord bot, dll)"
        >
          <RssIcon size={16} />
          <span>RSS</span>
        </a>
      </div>

      {/* Interest filter — narrow feed to events from members with that interest */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-caption font-semibold text-ink-soft uppercase tracking-wide">
            Filter by interest
          </p>
          {interest && (
            <Link
              href="/aktivitas"
              className="text-caption text-muted hover:text-ink underline underline-offset-4"
            >
              Reset
            </Link>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
          <FilterPill href="/aktivitas" active={!interest} label="Semua" />
          {BROAD_INTERESTS.map((i) => (
            <FilterPill
              key={i.slug}
              href={`/aktivitas?interest=${i.slug}`}
              active={interest === i.slug}
              label={`${i.emoji} ${i.label}`}
            />
          ))}
        </div>
      </div>

      <ActivityFeedList items={items} />

      <div className="pt-2">
        <ButtonLink href="/book/add" variant="secondary" fullWidth>
          + Tambah buku ke aktivitas
        </ButtonLink>
      </div>
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium transition-colors",
        active
          ? "bg-ink text-parchment"
          : "bg-paper text-ink-soft border border-hairline hover:bg-cream",
      )}
    >
      {label}
    </Link>
  );
}

function RssIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" />
    </svg>
  );
}
