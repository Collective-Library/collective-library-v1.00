import type { Profile, BookStatus } from "@/types";

/** Normalize a phone number to digits-only for wa.me URLs. */
const cleanPhone = (n: string) => n.replace(/\D/g, "");

export type ContactLink =
  | { type: "whatsapp"; label: string; icon: string; href: string; primary: true }
  | { type: "instagram"; label: string; icon: string; href: string; primary: false }
  | { type: "goodreads"; label: string; icon: string; href: string; primary: false }
  | { type: "storygraph"; label: string; icon: string; href: string; primary: false }
  | { type: "discord"; label: string; icon: string; copy: string; primary: false };

/** Builds a pre-filled WhatsApp message about a specific book. */
function buildBookMessage(ownerName: string, title: string, status: BookStatus): string {
  const statusVerb =
    status === "sell" ? "dijual" :
    status === "lend" ? "bisa dipinjam" :
    status === "trade" ? "bisa ditukar" :
    "tersedia";
  return encodeURIComponent(
    `Halo ${ownerName}! Gue lihat buku *${title}* di Collective Library. Masih ${statusVerb}?`,
  );
}

/**
 * Builds the contact link list for a given owner profile.
 * If `book` is supplied, the WhatsApp link includes a pre-filled message.
 */
export function getContactLinks(
  owner: Pick<
    Profile,
    "full_name" | "whatsapp" | "whatsapp_public" | "instagram" | "discord" | "goodreads_url" | "storygraph_url"
  >,
  book?: { title: string; status: BookStatus },
): ContactLink[] {
  const links: ContactLink[] = [];
  const name = owner.full_name ?? "kak";

  if (owner.whatsapp_public && owner.whatsapp) {
    const text = book ? `?text=${buildBookMessage(name, book.title, book.status)}` : "";
    links.push({
      type: "whatsapp",
      label: "WhatsApp",
      icon: "💬",
      href: `https://wa.me/${owner.whatsapp.replace(/\D/g, "")}${text}`,
      primary: true,
    });
  }

  if (owner.instagram) {
    links.push({
      type: "instagram",
      label: "Instagram",
      icon: "📸",
      href: `https://instagram.com/${owner.instagram.replace(/^@/, "")}`,
      primary: false,
    });
  }

  if (owner.goodreads_url) {
    links.push({
      type: "goodreads",
      label: "Goodreads",
      icon: "📚",
      href: owner.goodreads_url,
      primary: false,
    });
  }

  if (owner.storygraph_url) {
    links.push({
      type: "storygraph",
      label: "StoryGraph",
      icon: "🌿",
      href: owner.storygraph_url,
      primary: false,
    });
  }

  if (owner.discord) {
    links.push({
      type: "discord",
      label: "Discord",
      icon: "🎮",
      copy: owner.discord,
      primary: false,
    });
  }

  return links;
}

/**
 * Builds contact links for a WTB requester — same primary-secondary pattern,
 * but the pre-filled WhatsApp message frames the conversation as supply→demand.
 */
export function getRequesterContactLinks(
  requester: Pick<
    Profile,
    "full_name" | "whatsapp" | "whatsapp_public" | "instagram" | "discord" | "goodreads_url" | "storygraph_url"
  >,
  wanted: { title: string; author?: string | null },
): ContactLink[] {
  const links: ContactLink[] = [];
  const name = requester.full_name ?? "kak";
  const titleLine = wanted.author ? `*${wanted.title}* (${wanted.author})` : `*${wanted.title}*`;
  const text = encodeURIComponent(
    `Halo ${name}! Gue lihat lo lagi cari ${titleLine} di Collective Library. Gue punya nih — mau ngobrol?`,
  );

  if (requester.whatsapp_public && requester.whatsapp) {
    links.push({
      type: "whatsapp",
      label: "WhatsApp",
      icon: "💬",
      href: `https://wa.me/${cleanPhone(requester.whatsapp)}?text=${text}`,
      primary: true,
    });
  }
  if (requester.instagram) {
    links.push({
      type: "instagram",
      label: "Instagram",
      icon: "📸",
      href: `https://instagram.com/${requester.instagram.replace(/^@/, "")}`,
      primary: false,
    });
  }
  if (requester.discord) {
    links.push({
      type: "discord",
      label: "Discord",
      icon: "🎮",
      copy: requester.discord,
      primary: false,
    });
  }
  if (requester.goodreads_url) {
    links.push({
      type: "goodreads",
      label: "Goodreads",
      icon: "📚",
      href: requester.goodreads_url,
      primary: false,
    });
  }
  if (requester.storygraph_url) {
    links.push({
      type: "storygraph",
      label: "StoryGraph",
      icon: "🌿",
      href: requester.storygraph_url,
      primary: false,
    });
  }
  return links;
}
