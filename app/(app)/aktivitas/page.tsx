import Link from "next/link";
import { listActivity } from "@/lib/activity";
import { ActivityFeedList } from "@/components/activity/activity-feed-list";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AktivitasPage() {
  // Pull a generous window — ~50 entries. When traffic grows, paginate via
  // ?offset= and add a "Load more" client component.
  const items = await listActivity(50);

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

      <ActivityFeedList items={items} />

      <div className="pt-2">
        <ButtonLink href="/book/add" variant="secondary" fullWidth>
          + Tambah buku ke aktivitas
        </ButtonLink>
      </div>
    </div>
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
