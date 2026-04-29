"use client";

import { ButtonLink } from "@/components/ui/button";
import { SecondaryContactRow } from "@/components/books/contact-pills";
import type { ContactLink } from "@/lib/contact";

/** Renders the "Gue punya buku ini!" primary CTA + secondary fallback contacts. */
export function WantedCTA({ links }: { links: ContactLink[] }) {
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
        <ButtonLink href={primary.href} pill fullWidth>
          <span aria-hidden>{primary.icon}</span>
          <span>Gue punya buku ini!</span>
        </ButtonLink>
      ) : (
        <p className="text-caption text-muted text-center py-1">
          WhatsApp belum publik. Coba via channel lain:
        </p>
      )}
      <SecondaryContactRow links={secondary} />
    </div>
  );
}
