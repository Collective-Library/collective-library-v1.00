import type { Profile, BookStatus } from "@/types";
import { profileUrl } from "@/lib/url";

/** Normalize a phone number to digits-only for wa.me URLs. */
const cleanPhone = (n: string) => n.replace(/\D/g, "");

export type ContactLink =
  | { type: "whatsapp"; label: string; icon: string; href: string; primary: true }
  | { type: "instagram"; label: string; icon: string; href: string; primary: false }
  | { type: "goodreads"; label: string; icon: string; href: string; primary: false }
  | { type: "storygraph"; label: string; icon: string; href: string; primary: false }
  | { type: "discord"; label: string; icon: string; copy: string; primary: false };

export type Viewer = Pick<Profile, "full_name" | "username"> | null;

/**
 * Maps book status to the user-facing intent verb.
 * The CTA label and the WhatsApp message both use this — keeps tone consistent.
 */
export function intentForStatus(status: BookStatus): {
  ctaLabel: string;
  messageVerb: string;
} {
  switch (status) {
    case "sell":
      return { ctaLabel: "Mau beli buku ini", messageVerb: "boleh gue beli" };
    case "lend":
      return { ctaLabel: "Mau pinjam buku ini", messageVerb: "boleh gue pinjam" };
    case "trade":
      return { ctaLabel: "Mau tukar buku ini", messageVerb: "boleh gue tukar" };
    default:
      return {
        ctaLabel: "Kenalan lewat buku ini",
        messageVerb: "boleh kenalan lewat buku ini",
      };
  }
}

/** Builds a pre-filled WhatsApp message about a specific book, signed by the viewer. */
function buildBookMessage(
  ownerName: string,
  viewer: Viewer,
  title: string,
  status: BookStatus,
): string {
  const { messageVerb } = intentForStatus(status);
  const viewerLine = viewer?.full_name
    ? `gue ${viewer.full_name}.`
    : "kenalin gue.";
  const profileLine = viewer?.username
    ? `\n\nIni profil gue: ${profileUrl(viewer.username)}`
    : "";
  return encodeURIComponent(
    `Halo ${ownerName}, ${viewerLine} Gue lihat buku *${title}* di Collective Library — ${messageVerb}?${profileLine}`,
  );
}

/**
 * Builds the contact link list for a given owner profile.
 * `viewer` (current logged-in user) is used to sign the WhatsApp message and
 * include their profile link as a trust signal.
 */
export function getContactLinks(
  owner: Pick<
    Profile,
    "full_name" | "whatsapp" | "whatsapp_public" | "instagram" | "discord" | "goodreads_url" | "storygraph_url"
  >,
  book?: { title: string; status: BookStatus },
  viewer: Viewer = null,
): ContactLink[] {
  const links: ContactLink[] = [];
  const name = owner.full_name ?? "kak";

  if (owner.whatsapp_public && owner.whatsapp) {
    const text = book ? `?text=${buildBookMessage(name, viewer, book.title, book.status)}` : "";
    links.push({
      type: "whatsapp",
      label: "WhatsApp",
      icon: "💬",
      href: `https://wa.me/${cleanPhone(owner.whatsapp)}${text}`,
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
 * Builds contact links for a WTB requester — supply-side person reaching out
 * because they have the book the requester wants. Signed by viewer + profile link.
 */
export function getRequesterContactLinks(
  requester: Pick<
    Profile,
    "full_name" | "whatsapp" | "whatsapp_public" | "instagram" | "discord" | "goodreads_url" | "storygraph_url"
  >,
  wanted: { title: string; author?: string | null },
  viewer: Viewer = null,
): ContactLink[] {
  const links: ContactLink[] = [];
  const name = requester.full_name ?? "kak";
  const titleLine = wanted.author ? `*${wanted.title}* (${wanted.author})` : `*${wanted.title}*`;
  const viewerLine = viewer?.full_name ? `gue ${viewer.full_name}.` : "kenalin gue.";
  const profileLine = viewer?.username
    ? `\n\nIni profil gue: ${profileUrl(viewer.username)}`
    : "";
  const text = encodeURIComponent(
    `Halo ${name}, ${viewerLine} Gue lihat lo lagi cari ${titleLine} di Collective Library — gue punya nih, mau ngobrol?${profileLine}`,
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
