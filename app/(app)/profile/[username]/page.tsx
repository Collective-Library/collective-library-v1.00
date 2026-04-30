import { notFound } from "next/navigation";
import { getProfileByUsername, getProfileCommunities } from "@/lib/profile";
import { getBooksByOwnerUsername } from "@/lib/books";
import { getCurrentUser } from "@/lib/auth";
import { getContactLinks } from "@/lib/contact";
import { Avatar } from "@/components/ui/avatar";
import { CommunityBadge } from "@/components/ui/community-badge";
import { SecondaryContactRow } from "@/components/books/contact-pills";
import { MyShelfManager } from "@/components/books/my-shelf-manager";
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

  const [books, communities, currentUser] = await Promise.all([
    getBooksByOwnerUsername(username),
    getProfileCommunities(profile.id),
    getCurrentUser(),
  ]);
  const isOwner = currentUser?.id === profile.id;
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

      {/* Books grid — owner gets bulk-management toggle, visitors see read-only */}
      <MyShelfManager books={books} isOwner={isOwner} />
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
