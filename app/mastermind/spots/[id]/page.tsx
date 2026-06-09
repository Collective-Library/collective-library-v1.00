import Link from "next/link";
import { notFound } from "next/navigation";
import {
  SPOT_STATUS_OPTIONS,
  SPOT_TYPE_OPTIONS,
  getSpotByIdAdmin,
  listCommunitiesForPicker,
} from "@/lib/spots";
import { SpotForm } from "@/components/spots/spot-form";
import {
  SpotActiveToggle,
  SpotDeleteButton,
  SpotStatusControl,
} from "@/components/spots/spot-controls";
import { CopyToClipboardButton } from "@/components/spots/copy-to-clipboard-button";
import { formatRelativeID } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SpotEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [spot, communities] = await Promise.all([getSpotByIdAdmin(id), listCommunitiesForPicker()]);
  if (!spot) notFound();

  const typeOpt = SPOT_TYPE_OPTIONS.find((t) => t.value === spot.type);
  const statusOpt = SPOT_STATUS_OPTIONS.find((s) => s.value === spot.status);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Link
        href="/mastermind/spots"
        className="text-body-sm text-ink-soft hover:text-ink underline underline-offset-4 decoration-hairline-strong"
      >
        ← Balik ke list Spots
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Library Nodes · edit
        </p>
        <h1 className="font-display text-display-xl text-ink leading-tight">
          {typeOpt?.emoji ?? "✨"} {spot.name}
        </h1>
        <p className="text-caption text-muted font-mono">{spot.slug}</p>
        <p className="text-body text-ink-soft">
          {typeOpt?.label ?? spot.type} · {spot.city} · dibikin {formatRelativeID(spot.created_at)}{" "}
          · update terakhir {formatRelativeID(spot.updated_at)}
        </p>
      </header>

      {/* Status + active row */}
      <section className="bg-paper border border-hairline rounded-card-lg shadow-card p-5">
        <h2 className="font-display text-title-md text-ink mb-1">Status &amp; visibility</h2>
        <p className="text-caption text-muted mb-3">
          Promosi ke <code className="font-mono">active</code> meng-emit{" "}
          <code className="font-mono">NODE_CREATED</code> ke activity feed (cuma sekali per transisi
          — re-promote nggak duplikat).
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted uppercase tracking-wide font-semibold">
              Status
            </span>
            <SpotStatusControl spotId={spot.id} status={spot.status} size="md" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted uppercase tracking-wide font-semibold">
              Aktif
            </span>
            <SpotActiveToggle spotId={spot.id} isActive={spot.is_active} size="md" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted uppercase tracking-wide font-semibold">
              Visibility
            </span>
            <span className="inline-flex items-center h-10 px-3 rounded-pill bg-cream border border-hairline text-body-sm text-ink-soft font-medium capitalize">
              {spot.visibility}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted uppercase tracking-wide font-semibold">
              Public-ready?
            </span>
            <span
              className={
                "inline-flex items-center h-10 px-3 rounded-pill text-body-sm font-medium border " +
                (spot.status === "active" && spot.is_active && spot.visibility === "public"
                  ? "bg-cream text-ink border-hairline-strong"
                  : "bg-paper text-muted border-hairline")
              }
            >
              {spot.status === "active" && spot.is_active && spot.visibility === "public"
                ? "✓ Discoverable"
                : "Hidden"}
            </span>
          </div>
        </div>
        {statusOpt && (
          <p className="mt-3 text-caption text-muted">
            Status saat ini: <strong className="text-ink-soft">{statusOpt.label}</strong>. Public
            surface (deferred) hanya akan menampilkan Spot dengan kombinasi
            <code className="font-mono"> active + public + is_active=true</code>.
          </p>
        )}
      </section>

      {/* Public URL + QR hint (Slice 5) */}
      <section className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 flex flex-col gap-3">
        <h2 className="font-display text-title-md text-ink">Public URL &amp; QR</h2>
        <p className="text-caption text-muted leading-relaxed">
          URL ini stabil — boleh dipakai sebagai target QR code (cetak di rak / meja). QR generator
          built-in belum ada — copy URL, tempel ke generator favorit lo (qrcode-monkey, qr.io, dll).
          Spot baru bakal accessible publik begitu
          <code className="font-mono">
            {" "}
            status=active &amp; is_active=true &amp; visibility=public
          </code>
          .
        </p>
        <div className="flex items-stretch gap-2 rounded-button border border-hairline-strong bg-cream/60 overflow-hidden">
          <span className="flex-1 min-w-0 px-3.5 py-2.5 font-mono text-body-sm text-ink-soft truncate">
            /spots/{spot.slug}
          </span>
          <CopyToClipboardButton path={`/spots/${spot.slug}`} />
        </div>
        {spot.status === "active" && spot.is_active && spot.visibility === "public" ? (
          <Link
            href={`/spots/${spot.slug}`}
            target="_blank"
            className="self-start text-caption text-ink-soft hover:text-ink underline underline-offset-4"
          >
            Buka public page di tab baru ↗
          </Link>
        ) : (
          <p className="text-caption text-muted italic">
            Public page belum bisa diakses sampai status di-promote ke{" "}
            <code className="font-mono">active</code>
            {" + "}
            <code className="font-mono">is_active=true</code>
            {" + "}
            <code className="font-mono">visibility=public</code>.
          </p>
        )}
      </section>

      {/* Edit form */}
      <section className="bg-paper border border-hairline rounded-card-lg shadow-card p-5">
        <h2 className="font-display text-title-md text-ink mb-3">Detail</h2>
        <SpotForm mode="edit" initial={spot} spotId={spot.id} communities={communities} />
      </section>

      {/* Danger zone */}
      <section className="rounded-card-lg border border-red-200 bg-red-50 p-5">
        <h2 className="font-display text-title-md text-red-800 mb-1">Danger zone</h2>
        <p className="text-caption text-red-700 mb-3">
          Delete permanen — row hilang dan <code className="font-mono">activity_log</code> entries
          terkait ikut cascade. Untuk takedown tanpa kehilangan history, pakai{" "}
          <code className="font-mono">is_active=false</code> atau{" "}
          <code className="font-mono">status=inactive</code> di atas.
        </p>
        <SpotDeleteButton spotId={spot.id} spotName={spot.name} />
      </section>
    </div>
  );
}
