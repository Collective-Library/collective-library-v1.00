import Link from "next/link";
import { listMembersForMap } from "@/lib/profile";
import { getCurrentProfile } from "@/lib/auth";
import { PetaClient } from "@/components/map/peta-client";

export const dynamic = "force-dynamic";

export default async function PetaPage() {
  const [members, me] = await Promise.all([
    listMembersForMap(),
    getCurrentProfile(),
  ]);

  const meOnMap = me?.show_on_map === true && me.map_lat != null && me.map_lng != null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">
            Peta komunitas
          </p>
          <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
            Sebaran anggota
          </h1>
          <p className="mt-2 text-body text-ink-soft max-w-xl">
            {members.length === 0
              ? "Belum ada anggota yang opt-in. Lo bisa jadi yang pertama."
              : `${members.length} anggota visible. Pin di kecamatan, bukan alamat persis.`}
          </p>
        </div>
        <Link
          href="/profile/edit"
          className="shrink-0 inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium bg-paper border border-hairline-strong text-ink-soft hover:bg-cream"
        >
          {meOnMap ? "Edit lokasi" : "Tampilin gue"}
        </Link>
      </div>

      <PetaClient members={members} />

      <div className="rounded-card-lg border border-hairline bg-cream/40 p-4 text-caption text-muted">
        <p className="font-medium text-ink-soft mb-1">Tentang visibilitas</p>
        Pin di-tempatin di tengah <span className="text-ink-soft">kecamatan</span>, bukan alamat persis lo. Toggle yang sama juga nampilin lo di{" "}
        <span className="text-ink-soft">landing publik</span> sebagai member card. Default mati — atur di{" "}
        <Link href="/profile/edit" className="text-ink-soft underline underline-offset-4">
          profile lo
        </Link>
        .
      </div>
    </div>
  );
}
