import type { Metadata } from "next";
import Link from "next/link";
import { listPendingManifests, listRecentManifests } from "@/lib/manifests";
import { ManifestModerationRow } from "@/components/manifest/manifest-moderation-row";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Moderasi Manifest",
};

export default async function AdminManifestsPage() {
  const [pending, recent] = await Promise.all([listPendingManifests(), listRecentManifests(20)]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Admin · moderasi manifest
        </p>
        <h1 className="mt-1 font-display text-display-lg text-ink leading-tight">
          Moderasi manifest
        </h1>
        <p className="mt-2 text-body text-ink-soft max-w-2xl">
          Manifest sekarang langsung tayang tanpa perlu approval dulu — masuk ke aktivitas komunitas
          dan Discord otomatis. Kalau ada yang perlu ditolak atau disembunyikan, bisa dari sini atau
          dari halaman detail manifest.
        </p>
      </div>

      {/* Pending queue — shown only if legacy pending rows exist */}
      {pending.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-title-md text-ink">Pending ({pending.length})</h2>
          <p className="text-caption text-muted -mt-2">
            Manifest lama yang masuk sebelum autobase mode. Approve untuk publik atau reject dengan
            catatan.
          </p>
          <ul className="flex flex-col gap-5">
            {pending.map((m) => (
              <li key={m.id}>
                <ManifestModerationRow manifest={m} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent public manifests — retroactive moderation */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-title-md text-ink">Manifest terbaru</h2>
        <p className="text-caption text-muted -mt-2">
          20 manifest publik terakhir. Reject untuk menghapus dari feed jika diperlukan.
        </p>

        {recent.length === 0 ? (
          <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
            <p className="font-display text-title-lg text-ink">Belum ada manifest publik.</p>
            <p className="mt-2 text-body text-muted">
              Cek{" "}
              <Link
                href="/manifest"
                className="text-ink underline underline-offset-4 font-medium hover:text-ink-soft"
              >
                /manifest
              </Link>{" "}
              kalau sudah ada yang masuk.
            </p>
          </div>
        ) : (
          <>
            <p className="text-caption text-muted">{recent.length} manifest terbaru</p>
            <ul className="flex flex-col gap-5">
              {recent.map((m) => (
                <li key={m.id}>
                  <ManifestModerationRow manifest={m} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
