"use client";

import { track } from "@vercel/analytics";
import { SecondaryContactRow } from "@/components/books/contact-pills";
import type { ContactLink } from "@/lib/contact";

/** Renders the "Gue punya buku ini!" primary CTA + secondary fallback contacts. */
export function WantedCTA({
  links,
  wantedId,
  requesterId,
}: {
  links: ContactLink[];
  wantedId?: string;
  requesterId?: string;
}) {
  const primary = links.find((l) => l.primary);
  const secondary = links.filter((l) => !l.primary);

  if (links.length === 0) {
    return (
      <p className="text-caption text-muted text-center py-2 border-t border-hairline-soft">
        Requester belum publikasikan kontak. Coba buka profil-nya.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-hairline-soft">
      {primary ? (
        <a
          href={primary.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            track("contact_click", {
              channel: primary.type,
              ...(wantedId ? { wanted_id: wantedId } : {}),
              ...(requesterId ? { owner_id: requesterId } : {}),
              flow: "wtb_reply",
            });
          }}
          className="inline-flex items-center justify-center gap-2 h-12 w-full rounded-pill bg-ink text-parchment font-medium hover:bg-ink-soft active:scale-[0.98] transition-all"
        >
          <span aria-hidden>{primary.icon}</span>
          <span>Gue punya buku ini!</span>
        </a>
      ) : (
        <p className="text-caption text-muted text-center py-1">
          WhatsApp belum publik. Coba via channel lain:
        </p>
      )}
      <SecondaryContactRow links={secondary} />
    </div>
  );
}
