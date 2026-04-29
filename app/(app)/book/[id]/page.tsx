import { notFound } from "next/navigation";
import Link from "next/link";
import { getBookById } from "@/lib/books";
import { getCurrentUser } from "@/lib/auth";
import { getContactLinks } from "@/lib/contact";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { CommunityBadge } from "@/components/ui/community-badge";
import { ButtonLink } from "@/components/ui/button";
import { SecondaryContactRow } from "@/components/books/contact-pills";
import { CONDITION_LABELS } from "@/lib/status";
import { formatIDR, formatRelativeID } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [book, currentUser] = await Promise.all([
    getBookById(id),
    getCurrentUser(),
  ]);
  if (!book) notFound();

  const isOwner = currentUser?.id === book.owner_id;
  const links = getContactLinks(book.owner, { title: book.title, status: book.status });
  const primary = links.find((l) => l.primary);
  const secondary = links.filter((l) => !l.primary);

  return (
    <article className="max-w-4xl mx-auto">
      {/* Hero with blurred backdrop */}
      <div className="relative -mx-4 md:-mx-6 mb-8 overflow-hidden rounded-none md:rounded-card-lg">
        <div className="relative h-56 md:h-72">
          {book.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
              aria-hidden
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-parchment/40 to-parchment" />
        </div>
        <div className="relative -mt-32 md:-mt-40 px-4 md:px-6 flex flex-col md:flex-row gap-6 items-end">
          <div className="w-32 md:w-48 aspect-[3/4] rounded-card overflow-hidden bg-cream border border-hairline shadow-card-hover shrink-0">
            {book.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
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
            <h1 className="font-display text-display-xl text-ink leading-tight">{book.title}</h1>
            <p className="mt-1 text-body-lg text-ink-soft">{book.author}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div className="flex flex-col gap-6">
          {/* Owner card */}
          <Link
            href={book.owner.username ? `/profile/${book.owner.username}` : "#"}
            className="flex items-center gap-3 p-4 rounded-card border border-hairline bg-paper hover:bg-cream transition-colors"
          >
            <Avatar src={book.owner.photo_url} name={book.owner.full_name} size={44} />
            <div className="min-w-0">
              <p className="text-body font-semibold text-ink truncate">
                {book.owner.full_name ?? book.owner.username}
              </p>
              <p className="text-caption text-muted truncate">
                {book.owner.city ?? "Semarang"} · Posted {formatRelativeID(book.created_at)}
              </p>
            </div>
            <span className="ml-auto text-caption text-muted">→</span>
          </Link>

          {/* Details */}
          <dl className="grid grid-cols-2 gap-y-4 gap-x-6 p-5 rounded-card border border-hairline bg-paper">
            <Detail label="Kondisi" value={CONDITION_LABELS[book.condition]} />
            {book.genre && <Detail label="Genre" value={book.genre} />}
            {book.language && <Detail label="Bahasa" value={book.language} />}
            {book.status === "sell" && book.price != null && (
              <Detail
                label="Harga"
                value={`${formatIDR(book.price)}${book.negotiable ? " · Bisa nego" : ""}`}
              />
            )}
            {book.status === "lend" && book.lending_duration_days && (
              <Detail label="Durasi pinjam" value={`${book.lending_duration_days} hari`} />
            )}
            {book.pickup_area && <Detail label="Area pickup" value={book.pickup_area} />}
            {book.isbn && <Detail label="ISBN" value={book.isbn} />}
          </dl>

          {/* Notes */}
          {book.notes && (
            <div className="p-5 rounded-card border border-hairline bg-paper">
              <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-2">
                Catatan dari owner
              </p>
              <p className="text-body text-ink whitespace-pre-wrap">{book.notes}</p>
            </div>
          )}
        </div>

        {/* Sticky CTA panel */}
        <aside className="md:sticky md:top-20 md:self-start">
          <div className="p-5 rounded-card-lg border border-hairline bg-paper shadow-card flex flex-col gap-3">
            {primary ? (
              <ButtonLink href={primary.href} pill fullWidth>
                <span>{primary.icon}</span>
                <span>Chat Owner via WhatsApp</span>
              </ButtonLink>
            ) : (
              <p className="text-body-sm text-muted text-center py-2">
                Owner belum publikasikan WhatsApp. Coba hubungi via channel lain.
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

