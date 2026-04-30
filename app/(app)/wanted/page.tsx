import { listWantedRequests } from "@/lib/wanted";
import { getCurrentProfile } from "@/lib/auth";
import { WantedCard } from "@/components/wanted/wanted-card";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function WantedPage() {
  const [wanted, viewerProfile] = await Promise.all([
    listWantedRequests(),
    getCurrentProfile(),
  ]);
  const viewer = viewerProfile
    ? { full_name: viewerProfile.full_name, username: viewerProfile.username }
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">Wanted</p>
          <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
            Buku yang lagi dicari
          </h1>
          <p className="mt-2 text-body-lg text-ink-soft max-w-xl">
            Anggota komunitas posting buku yang mereka cari. Kalau lo punya, langsung tap{" "}
            <span className="font-semibold text-ink">&ldquo;Gue punya buku ini!&rdquo;</span>.
          </p>
        </div>
        <div className="hidden md:block">
          <ButtonLink href="/wanted/add">+ Buat WTB Request</ButtonLink>
        </div>
      </div>

      {/* Feed */}
      {wanted.length === 0 ? (
        <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
          <p className="font-display text-title-lg text-ink">
            Belum ada yang nyari buku.
          </p>
          <p className="mt-2 text-body text-muted max-w-md mx-auto">
            Kalau lo punya wishlist yang belum kebeli, mungkin sekarang waktunya
            bilang ke komunitas — siapa tau ada yang lagi mau lepas.
          </p>
          <div className="mt-5">
            <ButtonLink href="/wanted/add">+ Buat WTB Pertama</ButtonLink>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {wanted.map((w) => (
            <WantedCard key={w.id} wanted={w} viewer={viewer} />
          ))}
        </div>
      )}

      {/* Mobile CTA fallback */}
      <div className="md:hidden">
        <ButtonLink href="/wanted/add" fullWidth>+ Buat WTB Request</ButtonLink>
      </div>
    </div>
  );
}
