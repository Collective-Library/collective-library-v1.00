import Link from "next/link";
import type { Metadata } from "next";
import { listManifests } from "@/lib/manifests";
import { ManifestCard } from "@/components/manifest/manifest-card";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manifesto Komunitas",
  description:
    "Pemikiran pendek anggota Collective Library — observasi, harapan, frustrasi, dan refleksi seputar buku dan komunitas.",
};

type SP = { page?: string };

const PAGE_SIZE = 12;

export default async function ManifestListPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const { manifests, total } = await listManifests({ page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">
            Manifesto komunitas
          </p>
          <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
            Yang lagi dipikirin pembaca
          </h1>
          <p className="mt-2 text-body text-ink-soft max-w-xl">
            Pemikiran pendek anggota — observasi, harapan, frustrasi, refleksi.
            Setelah di-approve admin, manifesto bisa di-share ke X.
          </p>
        </div>
        <ButtonLink href="/manifest/new" className="shrink-0">
          + Tulis manifesto
        </ButtonLink>
      </div>

      {manifests.length === 0 ? (
        <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
          <p className="font-display text-title-lg text-ink">
            Belum ada manifesto yang publik.
          </p>
          <p className="mt-2 text-body text-muted">
            Lo bisa jadi yang pertama — 1-3 kalimat aja udah cukup.
          </p>
          <div className="mt-4">
            <ButtonLink href="/manifest/new" variant="secondary">
              Tulis manifesto pertama
            </ButtonLink>
          </div>
        </div>
      ) : (
        <>
          <p className="text-caption text-muted">{total} manifesto publik</p>
          <ul className="flex flex-col gap-5">
            {manifests.map((m) => (
              <li key={m.id}>
                <ManifestCard manifest={m} />
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-2 border-t border-hairline-soft">
              <p className="text-caption text-muted">
                Hal. <span className="font-semibold text-ink-soft">{page}</span> / {totalPages}
              </p>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/manifest?page=${page - 1}`}
                    className="inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium bg-paper text-ink-soft border border-hairline hover:bg-cream"
                  >
                    ← Sebelumnya
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/manifest?page=${page + 1}`}
                    className="inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium bg-paper text-ink-soft border border-hairline hover:bg-cream"
                  >
                    Selanjutnya →
                  </Link>
                )}
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
