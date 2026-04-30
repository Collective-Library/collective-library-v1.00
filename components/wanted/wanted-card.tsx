import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getRequesterContactLinks, type Viewer } from "@/lib/contact";
import { formatIDR, formatRelativeID } from "@/lib/format";
import { CONDITION_LABELS } from "@/lib/status";
import type { WantedRequestWithRequester, BookCondition } from "@/types";
import { WantedCTA } from "./wanted-cta";

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

      {/* Body — title + author */}
      <div>
        <h3 className="font-display text-title-lg text-ink leading-tight">{wanted.title}</h3>
        {wanted.author && (
          <p className="mt-1 text-body text-ink-soft">oleh {wanted.author}</p>
        )}
      </div>

      {/* Meta */}
      {(wanted.max_budget != null || conditionLabel || wanted.notes) && (
        <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-caption">
          {wanted.max_budget != null && (
            <Meta label="Budget maks">{formatIDR(wanted.max_budget)}</Meta>
          )}
          {conditionLabel && <Meta label="Kondisi diinginkan">{conditionLabel}</Meta>}
        </dl>
      )}

      {wanted.notes && (
        <p className="text-body-sm text-ink-soft whitespace-pre-wrap border-l-2 border-hairline-strong pl-3">
          {wanted.notes}
        </p>
      )}

      {/* CTA — Gue punya! */}
      <WantedCTA links={links} />
    </article>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted uppercase tracking-wide font-semibold text-[11px]">{label}</dt>
      <dd className="mt-0.5 text-ink">{children}</dd>
    </div>
  );
}
