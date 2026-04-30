import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "@/components/ui/status-badge";
import { CommunityBadge } from "@/components/ui/community-badge";
import { Avatar } from "@/components/ui/avatar";
import { formatIDR } from "@/lib/format";
import type { BookWithOwner } from "@/types";

export function BookCard({ book }: { book: BookWithOwner }) {
  return (
    <Link
      href={`/book/${book.id}`}
      className="group flex flex-col gap-3 focus-visible:outline-none"
    >
      {/* Photo plate */}
      <div className="relative aspect-[3/4] rounded-card overflow-hidden bg-cream border border-hairline group-hover:shadow-card-hover transition-shadow">
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
            className="object-cover"
          />
        ) : (
          <CoverPlaceholder title={book.title} author={book.author} />
        )}

        {/* Floating status badge */}
        <div className="absolute top-2.5 left-2.5">
          <StatusBadge status={book.status} className="shadow-card" />
        </div>
      </div>

      {/* Meta block */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-title-sm font-semibold text-ink line-clamp-2 leading-snug">
          {book.title}
        </h3>
        <p className="text-caption text-muted line-clamp-1">{book.author}</p>

        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="flex items-center gap-1.5 min-w-0">
            <Avatar src={book.owner.photo_url} name={book.owner.full_name} size={20} />
            <span className="text-caption text-ink-soft truncate">
              {book.owner.full_name ?? book.owner.username}
            </span>
          </span>
          {book.status === "sell" && book.price != null && (
            <span className="text-caption font-semibold text-ink shrink-0">
              {formatIDR(book.price)}
            </span>
          )}
        </div>

        {book.community && (
          <CommunityBadge name={book.community.name} className="mt-0.5" />
        )}
      </div>
    </Link>
  );
}

function CoverPlaceholder({ title, author }: { title: string; author: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-cream to-parchment">
      <p className="font-display text-title-md text-ink line-clamp-3 text-center leading-tight">
        {title}
      </p>
      <p className="mt-2 text-caption text-muted line-clamp-1 text-center">{author}</p>
    </div>
  );
}
