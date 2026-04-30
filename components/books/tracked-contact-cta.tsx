"use client";

import { track } from "@vercel/analytics";

/**
 * Wraps the primary contact CTA (WhatsApp / Instagram / etc) so the click
 * fires a Vercel Analytics event before navigating. North Star metric:
 * "Chat Owner clicks" per the original spec.
 *
 * Uses anchor (not Next Link) — these are external destinations.
 */
export function TrackedContactCTA({
  href,
  icon,
  label,
  bookId,
  wantedId,
  ownerId,
  status,
  channel,
  className,
}: {
  href: string;
  icon: string;
  label: string;
  bookId?: string;
  wantedId?: string;
  ownerId?: string;
  status?: string;
  channel: "whatsapp" | "instagram" | "discord" | "goodreads" | "storygraph";
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        track("contact_click", {
          channel,
          ...(bookId ? { book_id: bookId } : {}),
          ...(wantedId ? { wanted_id: wantedId } : {}),
          ...(ownerId ? { owner_id: ownerId } : {}),
          ...(status ? { status } : {}),
        });
      }}
      className={className}
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </a>
  );
}
