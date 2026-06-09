import Link from "next/link";
import { listCommunitiesForPicker } from "@/lib/spots";
import { SpotForm } from "@/components/spots/spot-form";

export const dynamic = "force-dynamic";

export default async function NewSpotPage() {
  const communities = await listCommunitiesForPicker();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Link
        href="/mastermind/spots"
        className="text-body-sm text-ink-soft hover:text-ink underline underline-offset-4 decoration-hairline-strong"
      >
        ← Balik ke list Spots
      </Link>

      <header>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Library Nodes · admin
        </p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Bikin Spot baru
        </h1>
        <p className="mt-2 text-body text-ink-soft">
          Spot lahir dengan status <code className="font-mono">needs_audit</code>. Promosi ke{" "}
          <code className="font-mono">active</code> dilakukan setelah review di halaman edit Spot.
          Activity feed (<code className="font-mono">NODE_CREATED</code>) fires hanya pada transisi{" "}
          <em>→ active</em>, jadi nyiapin data dulu aman.
        </p>
      </header>

      <SpotForm mode="create" communities={communities} />
    </div>
  );
}
