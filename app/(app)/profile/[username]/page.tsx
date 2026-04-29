import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfileByUsername, getProfileCommunities } from "@/lib/profile";
import { getBooksByOwnerUsername } from "@/lib/books";
import { getContactLinks } from "@/lib/contact";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { CommunityBadge } from "@/components/ui/community-badge";
import { SecondaryContactRow } from "@/components/books/contact-pills";
import type { BookStatus } from "@/types";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const [books, communities] = await Promise.all([
    getBooksByOwnerUsername(username),
    getProfileCommunities(profile.id),
  ]);
  const links = getContactLinks(profile);
  const counts = books.reduce<Record<BookStatus, number>>(
    (acc, b) => {
      acc[b.status] = (acc[b.status] ?? 0) + 1;
      return acc;
    },
    { sell: 0, lend: 0, trade: 0, unavailable: 0 },
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end gap-5 mb-7">
        <Avatar src={profile.photo_url} name={profile.full_name} size={88} />
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-display-xl text-ink leading-tight">
            {profile.full_name ?? profile.username}
          </h1>
          <p className="mt-1 text-body text-muted">
            @{profile.username} · {profile.city ?? "Semarang"}
          </p>
          {communities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {communities.map((c) => (
                <CommunityBadge key={c.id} name={c.name} />
              ))}
            </div>
          )}
          {profile.bio && <p className="mt-3 text-body text-ink-soft max-w-2xl">{profile.bio}</p>}
        </div>
      </div>

      {/* Contact pills */}
      {links.length > 0 ? (
        <div className="mb-7">
          <SecondaryContactRow links={links} />
        </div>
      ) : (
        <p className="mb-7 text-body-sm text-muted">Belum ada info kontak yang dipublikasikan.</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-7">
        <Stat label="Total" value={books.length} />
        <Stat label="Dijual" value={counts.sell} />
        <Stat label="Dipinjamkan" value={counts.lend} />
        <Stat label="Ditukar" value={counts.trade} />
      </div>

      {/* Books grid (full set; tabs come in Phase 7+) */}
      <h2 className="font-display text-display-md text-ink mb-4">Rak buku</h2>
      {books.length === 0 ? (
        <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
          <p className="text-body text-muted">Belum ada buku di rak.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-7">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/book/${book.id}`}
              className="group flex flex-col gap-2"
            >
              <div className="relative aspect-[3/4] rounded-card overflow-hidden bg-cream border border-hairline group-hover:shadow-card-hover transition-shadow">
                {book.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3">
                    <p className="font-display text-title-sm text-ink line-clamp-3 text-center">{book.title}</p>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <StatusBadge status={book.status} />
                </div>
              </div>
              <p className="text-caption font-medium text-ink line-clamp-2 leading-snug">{book.title}</p>
              <p className="text-caption text-muted line-clamp-1">{book.author}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-paper border border-hairline rounded-card px-3 py-3">
      <p className="font-display text-display-md text-ink leading-none">{value}</p>
      <p className="mt-1 text-caption text-muted">{label}</p>
    </div>
  );
}
