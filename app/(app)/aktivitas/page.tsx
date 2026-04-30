import { getRecentBookActivity } from "@/lib/books";
import { ActivityFeedList } from "@/components/activity/activity-feed-list";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AktivitasPage() {
  // Pull a generous window — ~50 entries. When traffic grows, paginate via
  // ?offset= and add a "Load more" client component.
  const items = await getRecentBookActivity(50);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Aktivitas komunitas
        </p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Yang lagi terjadi
        </h1>
        <p className="mt-2 text-body text-ink-soft max-w-xl">
          Buku-buku terbaru yang anggota komunitas tambahin ke rak. Klik buku-nya buat lihat detail atau hubungin owner.
        </p>
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
