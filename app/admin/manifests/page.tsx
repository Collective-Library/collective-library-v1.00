import type { Metadata } from "next";
import Link from "next/link";
import { listPendingManifests } from "@/lib/manifests";
import { ManifestModerationRow } from "@/components/manifest/manifest-moderation-row";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Moderasi Manifesto",
};

export default async function AdminManifestsPage() {
  const pending = await listPendingManifests();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Admin · moderasi manifesto
        </p>
        <h1 className="mt-1 font-display text-display-lg text-ink leading-tight">
          Antrian review
        </h1>
        <p className="mt-2 text-body text-ink-soft max-w-2xl">
          Approve buat publik (otomatis muncul di /manifest + activity feed + RSS).
          Reject kasih catatan biar penulis tau alasannya. Author bisa edit lagi sebelum disubmit ulang.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
          <p className="font-display text-title-lg text-ink">
            Antrian kosong ✨
          </p>
          <p className="mt-2 text-body text-muted">
            Belum ada manifesto pending. Cek{" "}
            <Link href="/manifest" className="text-ink underline underline-offset-4 font-medium hover:text-ink-soft">
              /manifest
            </Link>{" "}
            buat yang udah publik.
          </p>
        </div>
      ) : (
        <>
          <p className="text-caption text-muted">{pending.length} pending</p>
          <ul className="flex flex-col gap-5">
            {pending.map((m) => (
              <li key={m.id}>
                <ManifestModerationRow manifest={m} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
