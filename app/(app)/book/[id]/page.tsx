import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { getBookById } from "@/lib/books";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { getContactLinks, intentForStatus } from "@/lib/contact";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { CommunityBadge } from "@/components/ui/community-badge";
import { SecondaryContactRow } from "@/components/books/contact-pills";
import { TrackedContactCTA } from "@/components/books/tracked-contact-cta";
import { SynopsisExpand } from "@/components/books/synopsis-expand";
import { CONDITION_LABELS } from "@/lib/status";
import { formatIDR, formatRelativeID } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const book = await getBookById(id);
  if (!book) return { title: "Buku gak ditemukan" };

  const owner = book.owner.full_name ?? book.owner.username ?? "anggota";
  const statusLabel: Record<string, string> = {
    sell: "dijual",
    lend: "dipinjamkan",
    trade: "ditukar",
    unavailable: "koleksi pribadi",
  };
  const status = statusLabel[book.status] ?? book.status;
  const description = `${book.title} oleh ${book.author} — ${status} oleh ${owner} di Collective Library.`;

  return {
    title: book.title,
    description,
    openGraph: {
      title: `${book.title} · ${book.author}`,
      description,
      type: "book",
      images: book.cover_url ? [{ url: book.cover_url }] : undefined,
    },
  };
}

/** Fetch a small extra trust signal — how many other books this owner has on
 *  their shelf. Cheap HEAD-only count. */
async function getOwnerBookCount(ownerId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("books")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("is_hidden", false)
    .eq("visibility", "public");
  return count ?? 0;
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [book, currentUser, viewerProfile] = await Promise.all([
    getBookById(id),
    getCurrentUser(),
    getCurrentProfile(),
  ]);
  if (!book) notFound();

  const isOwner = currentUser?.id === book.owner_id;
  const viewer = viewerProfile
    ? { full_name: viewerProfile.full_name, username: viewerProfile.username }
    : null;
  const links = getContactLinks(book.owner, { title: book.title, status: book.status }, viewer);
  const primary = links.find((l) => l.primary);
  const secondary = links.filter((l) => !l.primary);
  const { ctaLabel } = intentForStatus(book.status);
  const ownerBookCount = await getOwnerBookCount(book.owner_id);

  // Seth pass: only render specs that carry signal.
  // condition='good' = 92% of the catalog → noise. Demote unless surprising.
  const showCondition = book.condition !== "good";
  const showLanguage = book.language && book.language !== "Indonesia";
  const showPrice = book.status === "sell" && book.price != null && book.price > 0;
  const showLending = book.status === "lend" && book.lending_duration_days;

  // Owner display name + warm trust line
  const ownerName = book.owner.full_name ?? book.owner.username ?? "anggota";

  return (
    <article className="max-w-4xl mx-auto">
      {/* Hero with blurred backdrop */}
      <div className="relative -mx-4 md:-mx-6 mb-3 md:mb-8 overflow-hidden rounded-none md:rounded-card-lg">
        <div className="relative h-56 md:h-72">
          {book.cover_url && (
            <Image
              src={book.cover_url}
              alt=""
              fill
              sizes="100vw"
              quality={30}
              className="object-cover blur-2xl scale-110 opacity-40"
              aria-hidden
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-parchment/40 to-parchment" />
        </div>
        <div className="relative -mt-32 md:-mt-40 px-4 md:px-6 flex flex-row gap-4 md:gap-6 items-end">
          <div className="relative w-24 md:w-48 aspect-[3/4] rounded-card overflow-hidden bg-cream border border-hairline shadow-card-hover shrink-0">
            {book.cover_url ? (
              <Image
                src={book.cover_url}
                alt={book.title}
                fill
                sizes="(max-width: 768px) 128px, 192px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-cream to-parchment">
                <p className="font-display text-title-md text-ink line-clamp-3 text-center leading-tight">
                  {book.title}
                </p>
              </div>
            )}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <StatusBadge status={book.status} />
              {book.community && <CommunityBadge name={book.community.name} />}
              {isOwner && (
                <Link
                  href={`/book/${book.id}/edit`}
                  className="ml-auto inline-flex items-center h-8 px-3 rounded-pill bg-paper text-ink-soft border border-hairline-strong text-caption font-medium hover:bg-cream"
                >
                  ✎ Edit
                </Link>
              )}
            </div>
            <h1 className="font-display text-display-md md:text-display-xl text-ink leading-tight">{book.title}</h1>
            <p className="mt-1 text-body text-ink-soft">{book.author}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-5 md:gap-8">
        <div className="flex flex-col gap-6">
          {/* Synopsis — story first. When present, this is the page's voltage.
              When absent, soft permission-y prompt instead of empty silence. */}
          <section className="p-5 md:p-6 rounded-card-lg border border-hairline bg-paper shadow-card">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-caption text-muted uppercase tracking-wide font-semibold">
                Tentang buku ini
              </p>
            </div>
            {book.description ? (
              <SynopsisExpand text={book.description} />
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-body text-ink-soft leading-relaxed">
                  Belum ada sinopsis di sini. {isOwner ? (
                    <>
                      Tambahin biar reader tau kenapa buku ini worth-it untuk lo.{" "}
                      <Link
                        href={`/book/${book.id}/edit`}
                        className="text-ink font-semibold underline underline-offset-4 decoration-hairline-strong hover:decoration-ink"
                      >
                        Edit buku ini →
                      </Link>
                    </>
                  ) : (
                    <>
                      Kalau penasaran, tanya langsung ke {ownerName}. Sekalian
                      kenalan.
                    </>
                  )}
                </p>
              </div>
            )}
          </section>

          {/* Owner card — trust layer. Now carries book_count + city as a
              relational line, not just timestamp. */}
          <Link
            href={book.owner.username ? `/profile/${book.owner.username}` : "#"}
            className="flex items-center gap-3 p-4 rounded-card border border-hairline bg-paper hover:bg-cream transition-colors"
          >
            <Avatar src={book.owner.photo_url} name={book.owner.full_name} size={48} />
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-ink truncate">
                {ownerName}
              </p>
              <p className="text-caption text-muted truncate">
                {[
                  book.owner.city ?? "Semarang",
                  ownerBookCount > 1 ? `${ownerBookCount} buku di rak` : null,
                  `posted ${formatRelativeID(book.created_at)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <span className="text-caption text-muted shrink-0">→</span>
          </Link>

          {/* Details — only show what carries signal. Hide silent fields. */}
          {(showCondition || book.genre || showLanguage || showPrice || showLending || book.pickup_area || book.isbn) && (
            <dl className="grid grid-cols-2 gap-y-4 gap-x-6 p-5 rounded-card border border-hairline bg-paper">
              {showCondition && <Detail label="Kondisi" value={CONDITION_LABELS[book.condition]} />}
              {book.genre && <Detail label="Genre" value={book.genre} />}
              {showLanguage && <Detail label="Bahasa" value={book.language} />}
              {showPrice && (
                <Detail
                  label="Harga"
                  value={`${formatIDR(book.price!)}${book.negotiable ? " · Bisa nego" : ""}`}
                />
              )}
              {showLending && (
                <Detail label="Durasi pinjam" value={`${book.lending_duration_days} hari`} />
              )}
              {book.pickup_area && <Detail label="Area pickup" value={book.pickup_area} />}
              {book.isbn && <Detail label="ISBN" value={book.isbn} />}
            </dl>
          )}

          {/* Owner notes — separate intent from synopsis. Italicized blockquote
              so user-uploaded vibes/jokes don't get mistaken for stale meta. */}
          {book.notes && (
            <div className="p-5 rounded-card border-l-2 border-ink/20 bg-cream/50">
              <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-2">
                Catatan dari {ownerName.split(" ")[0]}
              </p>
              <p className="text-body text-ink-soft italic whitespace-pre-wrap leading-relaxed">
                {book.notes}
              </p>
            </div>
          )}
        </div>

        {/* Sticky CTA panel — order-first puts it right below the hero on
            mobile (above synopsis/owner/details), md:order-none restores the
            right-column position on desktop. */}
        <aside className="order-first md:order-none md:sticky md:top-20 md:self-start">
          <div className="p-5 rounded-card-lg border border-hairline bg-paper shadow-card flex flex-col gap-3">
            {primary ? (
              <>
                <TrackedContactCTA
                  href={primary.href}
                  icon={primary.icon}
                  label={ctaLabel}
                  channel={primary.type}
                  bookId={book.id}
                  ownerId={book.owner_id}
                  status={book.status}
                  className="inline-flex items-center justify-center gap-2 h-12 w-full rounded-pill bg-ink text-parchment font-medium hover:bg-ink-soft active:scale-[0.98] transition-all"
                />
                <p className="text-caption text-muted leading-relaxed">
                  {ownerName.split(" ")[0]} langsung dapet pesan dengan judul buku +
                  nama lo. Gak ada pressure — kalau gak bales dalam 2-3 hari, anggap
                  udah.
                </p>
              </>
            ) : (
              <p className="text-body-sm text-ink-soft text-center py-2 leading-relaxed">
                {ownerName.split(" ")[0]} belum publikasikan WhatsApp. Coba channel lain di bawah.
              </p>
            )}

            <SecondaryContactRow links={secondary} />
          </div>
        </aside>
      </div>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-muted uppercase tracking-wide font-semibold">{label}</dt>
      <dd className="mt-0.5 text-body text-ink">{value}</dd>
    </div>
  );
}
