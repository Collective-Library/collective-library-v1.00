import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getBookById } from "@/lib/books";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { getContactLinks, intentForStatus } from "@/lib/contact";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { CommunityBadge } from "@/components/ui/community-badge";
import { SecondaryContactRow } from "@/components/books/contact-pills";
import { TrackedContactCTA } from "@/components/books/tracked-contact-cta";
import { BookDetailTabs } from "@/components/books/book-detail-tabs";
import { CoverImage } from "@/components/books/cover-image";

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

  const ownerName = book.owner.full_name ?? book.owner.username ?? "anggota";

  return (
    <article className="max-w-4xl mx-auto">
      {/* ── Hero with blurred backdrop ── */}
      <div className="relative -mx-4 md:-mx-6 mb-3 md:mb-8 overflow-hidden rounded-none md:rounded-card-lg">
        <div className="relative h-56 md:h-72">
          {book.cover_url && (
            <img
              src={book.cover_url}
              alt=""
              className="object-cover blur-2xl scale-110 opacity-40"
              aria-hidden
             loading="lazy" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-parchment/40 to-parchment" />
        </div>

        {/* Cover + title always side-by-side (flex-row on all sizes) */}
        <div className="relative -mt-32 md:-mt-40 px-4 md:px-6 flex flex-row gap-4 md:gap-6 items-end">
          <div className="relative w-24 md:w-48 aspect-[3/4] rounded-card overflow-hidden bg-cream border border-hairline shadow-card-hover shrink-0">
            <CoverImage src={book.cover_url} alt={book.title} title={book.title} author={book.author} className="object-cover w-full h-full" />
          </div>
          <div className="flex-1 pb-2 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusBadge status={book.status} />
              {book.community && <CommunityBadge name={book.community.name} />}
              {isOwner && (
                <Link
                  href={`/book/${book.id}/edit`}
                  className="ml-auto inline-flex items-center h-7 px-2.5 rounded-pill bg-paper text-ink-soft border border-hairline-strong text-caption font-medium hover:bg-cream"
                >
                  ✎ Edit
                </Link>
              )}
            </div>
            <h1 className="font-display text-display-md md:text-display-xl text-ink leading-tight">
              {book.title}
            </h1>
            <p className="mt-1 text-body text-ink-soft line-clamp-2">{book.author}</p>
          </div>
        </div>
      </div>

      {/* ── Two-column grid (1-col on mobile) ── */}
      <div className="grid md:grid-cols-[1fr_320px] gap-5 md:gap-8">

        {/* Left: tabs on mobile, stacked cards on desktop */}
        <div className="min-w-0">
          <BookDetailTabs book={book} ownerBookCount={ownerBookCount} isOwner={isOwner} />
        </div>

        {/* Right: sticky CTA panel.
            order-first puts it right below the hero on mobile so the
            contact button is above the fold before any tab content. */}
        <aside className="order-first md:order-none md:sticky md:top-20 md:self-start">
          <div className="p-4 md:p-5 rounded-card-lg border border-hairline bg-paper shadow-card flex flex-col gap-3">
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
                {ownerName.split(" ")[0]} belum publikasikan WhatsApp. Coba channel lain
                di bawah.
              </p>
            )}
            <SecondaryContactRow links={secondary} />
          </div>
        </aside>
      </div>
    </article>
  );
}
