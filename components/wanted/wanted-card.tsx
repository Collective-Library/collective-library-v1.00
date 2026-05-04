import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getRequesterContactLinks, type Viewer } from "@/lib/contact";
import { formatIDR, formatRelativeID } from "@/lib/format";
import { CONDITION_LABELS } from "@/lib/status";
import type { WantedRequestWithRequester, BookCondition } from "@/types";
import { WantedCTA } from "./wanted-cta";
import { CoverImage } from "@/components/books/cover-image";

export function WantedCard({
  wanted,
  viewer = null,
}: {
  wanted: WantedRequestWithRequester;
  viewer?: Viewer;
}) {
  const links = getRequesterContactLinks(
    wanted.requester,
    { title: wanted.title, author: wanted.author },
    viewer,
  );
  const conditionLabel =
    wanted.desired_condition && wanted.desired_condition in CONDITION_LABELS
      ? CONDITION_LABELS[wanted.desired_condition as BookCondition]
      : wanted.desired_condition;

  return (
    <article className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 md:p-6 flex flex-col gap-4">
      {/* Header — requester */}
      <Link
        href={wanted.requester.username ? `/profile/${wanted.requester.username}` : "#"}
        className="flex items-center gap-3 -m-1 p-1 rounded-card hover:bg-cream transition-colors"
      >
        <Avatar src={wanted.requester.photo_url} name={wanted.requester.full_name} size={36} />
        <div className="min-w-0">
          <p className="text-body-sm font-semibold text-ink truncate">
            {wanted.requester.full_name ?? wanted.requester.username}
          </p>
          <p className="text-caption text-muted truncate">
            {wanted.requester.city ?? "Semarang"} · {formatRelativeID(wanted.created_at)}
          </p>
        </div>
        <Badge tone="muted" className="ml-auto">DICARI</Badge>
      </Link>

      {/* Body — cover thumb + title + meta */}
      <div className="flex gap-4">
        <div className="relative w-[72px] h-[100px] shrink-0 rounded-card overflow-hidden bg-cream border border-hairline">
          <CoverImage src={wanted.cover_url} alt={wanted.title} title={wanted.title} author={wanted.author ?? ""} className="object-cover w-full h-full" />
        </div>

        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          <h3 className="font-display text-title-md text-ink leading-tight line-clamp-2">
            {wanted.title}
          </h3>
          {wanted.author && (
            <p className="text-body-sm text-ink-soft line-clamp-1">oleh {wanted.author}</p>
          )}

          {/* Inline meta — budget + condition */}
          {(wanted.max_budget != null || conditionLabel) && (
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-caption">
              {wanted.max_budget != null && (
                <span className="text-ink-soft">
                  <span className="text-muted">Budget maks · </span>
                  <span className="font-semibold">{formatIDR(wanted.max_budget)}</span>
                </span>
              )}
              {conditionLabel && (
                <span className="text-ink-soft">
                  <span className="text-muted">Kondisi · </span>
                  <span className="font-medium">{conditionLabel}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notes — always shown if present. Could be requirements, vibes, jokes,
          atau cari jodoh sambil cari buku 🤷‍♀️ */}
      {wanted.notes && (
        <blockquote className="text-body-sm text-ink-soft whitespace-pre-wrap rounded-card bg-cream/60 border-l-2 border-hairline-strong px-3 py-2.5 italic">
          &ldquo;{wanted.notes}&rdquo;
        </blockquote>
      )}

      {/* CTA — Gue punya! */}
      <WantedCTA links={links} wantedId={wanted.id} requesterId={wanted.requester.id} />
    </article>
  );
}
