import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfileByUsername, getProfileCommunities } from "@/lib/profile";
import { getBooksByOwnerUsername } from "@/lib/books";
import { getCurrentUser } from "@/lib/auth";
import { getContactLinks } from "@/lib/contact";
import { profileUrl } from "@/lib/url";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { CommunityBadge } from "@/components/ui/community-badge";
import { SecondaryContactRow } from "@/components/books/contact-pills";
import { MyShelfManager } from "@/components/books/my-shelf-manager";
import { CoverImage } from "@/components/books/cover-image";
import {
  InterestList,
  SubInterestList,
  IntentList,
} from "@/components/profile/interest-chips";
import { ShareProfileButton } from "@/components/profile/share-profile-button";
import type { BookStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) {
    return { title: "Profil gak ditemukan" };
  }
  const name = profile.full_name ?? profile.username ?? "Anggota";
  const where = profile.city ?? "Semarang";
  const bio = profile.bio?.trim();
  const description =
    bio && bio.length > 20
      ? bio.slice(0, 160)
      : `Profil ${name} di Collective Library — ${profile.profession ?? "pembaca"} di ${where}.`;
  return {
    title: `${name} (@${profile.username})`,
    description,
    openGraph: {
      title: `${name} (@${profile.username}) · Collective Library`,
      description,
      type: "profile",
    },
  };
}

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

  // Currently reading book — fetched separately to keep type clean
  type CurrentlyReading = { id: string; title: string; author: string; cover_url: string | null };
  let currentlyReading: CurrentlyReading | null = null;
  if (profile.currently_reading_book_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("books")
      .select("id, title, author, cover_url")
      .eq("id", profile.currently_reading_book_id)
      .maybeSingle();
    if (data) currentlyReading = data as unknown as CurrentlyReading;
  }

  const url = profileUrl(profile.username);
  const cityLine = [profile.city, profile.address_area].filter(Boolean).join(" · ");

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Share — absolute top-right pojok, IG-style. Sits above banner so
          it stays reachable; icon-only pill keeps the layout compact. */}
      <div className="absolute top-2 right-2 md:top-3 md:right-3 z-20">
        <ShareProfileButton
          url={url}
          username={profile.username}
          fullName={profile.full_name ?? profile.username ?? "Anggota"}
          bookCount={books.length}
          city={profile.city ?? "Semarang"}
        />
      </div>

      {/* Banner — only when present */}
      {profile.cover_url && (
        <div className="relative -mx-4 md:-mx-6 mb-6 overflow-hidden md:rounded-card-lg h-32 md:h-48">
          <img
            src={profile.cover_url}
            alt=""
            className="object-cover"
           loading="lazy" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-5 mb-7">
        <Avatar
          src={profile.photo_url}
          name={profile.full_name}
          size={88}
          isAdmin={profile.is_admin}
        />
        <div className="flex-1 min-w-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap pr-12">
              <h1 className="font-display text-display-xl text-ink leading-tight">
                {profile.full_name ?? profile.username}
              </h1>
              {profile.is_admin && (
                <span
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-pill bg-ink text-parchment text-[11px] font-semibold tracking-wide"
                  title="Admin Collective Library"
                >
                  <span aria-hidden>✦</span>
                  ADMIN
                </span>
              )}
            </div>
            <p className="mt-1 text-body text-muted">
              @{profile.username} · {cityLine || "Semarang"}
            </p>
          </div>
          {profile.profession && (
            <p className="mt-2 text-body-sm text-ink-soft">{profile.profession}</p>
          )}
          {profile.campus_or_workplace && (
            <p className="text-body-sm text-muted">{profile.campus_or_workplace}</p>
          )}
          {communities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {communities.map((c) => (
                <CommunityBadge key={c.id} name={c.name} />
              ))}
            </div>
          )}
          {profile.bio && (
            <p className="mt-3 text-body text-ink-soft max-w-2xl">{profile.bio}</p>
          )}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-3">
              <InterestList slugs={profile.interests} />
            </div>
          )}
          {profile.sub_interests && profile.sub_interests.length > 0 && (
            <div className="mt-1.5">
              <SubInterestList slugs={profile.sub_interests} />
            </div>
          )}
          {profile.intents && profile.intents.length > 0 && (
            <div className="mt-2.5">
              <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-1">
                Available untuk
              </p>
              <IntentList slugs={profile.intents} />
            </div>
          )}
        </div>
      </div>

      {/* Currently reading widget */}
      {currentlyReading && (
        <Link
          href={`/book/${currentlyReading.id}`}
          className="mb-7 flex items-center gap-3 p-3 -ml-1 -mr-1 rounded-card bg-paper border border-hairline hover:bg-cream transition-colors"
        >
          <span className="text-[20px]" aria-hidden>📖</span>
          <div className="relative w-10 h-14 shrink-0 rounded-[4px] overflow-hidden bg-cream border border-hairline">
            <CoverImage src={currentlyReading.cover_url} alt={currentlyReading.title} title={currentlyReading.title} author={currentlyReading.author} className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-caption text-muted uppercase tracking-wide font-semibold">
              Currently reading
            </p>
            <p className="text-body-sm font-semibold text-ink line-clamp-1">
              {currentlyReading.title}
            </p>
            <p className="text-caption text-muted line-clamp-1">
              {currentlyReading.author}
            </p>
          </div>
        </Link>
      )}

      {/* Contact pills */}
      {links.length > 0 ? (
        <div className="mb-3">
          <SecondaryContactRow links={links} />
        </div>
      ) : (
        <p className="mb-3 text-body-sm text-muted">Belum ada info kontak yang dipublikasikan.</p>
      )}

      {/* Personal-branding links */}
      {(profile.linkedin_url || profile.website_url) && (
        <div className="mb-7 flex flex-wrap gap-2">
          {profile.linkedin_url && (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-pill bg-cream text-ink-soft text-body-sm font-medium hover:bg-parchment border border-hairline transition-colors"
            >
              <span aria-hidden>💼</span>
              <span>LinkedIn</span>
            </a>
          )}
          {profile.website_url && (
            <a
              href={profile.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-pill bg-cream text-ink-soft text-body-sm font-medium hover:bg-parchment border border-hairline transition-colors"
            >
              <span aria-hidden>🌐</span>
              <span>Website</span>
            </a>
          )}
        </div>
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
