import { normalizePhone } from "@/lib/format";
import type { Profile, BookStatus } from "@/types";
import { profileUrl } from "@/lib/url";

/** Normalize a phone number to digits-only for wa.me URLs. */


export type ContactLink =
  | { type: "whatsapp"; label: string; icon: string; href: string; primary: true }
  | {
      // IG doesn't support URL-based message prefill (unlike WhatsApp), so we
      // open the DM via ig.me/m/USERNAME and copy the template to clipboard
      // first. Caller pastes the message manually.
      type: "instagram";
      label: string;
      icon: string;
      href: string;
      copyText: string;
      primary: false;
    }
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

/** Plain-text book DM template (not URL-encoded). Used for WhatsApp prefill
 *  AND for IG copy-to-clipboard (since IG doesn't support URL prefill). */
function buildBookMessageText(
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
  return `Halo ${ownerName}, ${viewerLine} Gue lihat buku *${title}* di Collective Library — ${messageVerb}?${profileLine}`;
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

  const bookText = book ? buildBookMessageText(name, viewer, book.title, book.status) : "";

  if (owner.whatsapp_public && owner.whatsapp) {
    const qs = book ? `?text=${encodeURIComponent(bookText)}` : "";
    links.push({
      type: "whatsapp",
      label: "WhatsApp",
      icon: "💬",
      href: `https://wa.me/${normalizePhone(owner.whatsapp)}${qs}`,
      primary: true,
    });
  }

  if (owner.instagram) {
    const handle = owner.instagram.replace(/^@/, "");
    links.push({
      type: "instagram",
      label: "Instagram DM",
      icon: "📸",
      // ig.me/m/HANDLE opens IG Direct chat (mobile app or web).
      // Doesn't support URL prefill — UI copies the template first.
      href: `https://ig.me/m/${handle}`,
      copyText: bookText || `Halo ${name}, kenalin gue${viewer?.full_name ? ` ${viewer.full_name}` : ""} dari Collective Library.${viewer?.username ? `\n\nIni profil gue: ${profileUrl(viewer.username)}` : ""}`,
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
  const messageText = `Halo ${name}, ${viewerLine} Gue lihat lo lagi cari ${titleLine} di Collective Library — gue punya nih, mau ngobrol?${profileLine}`;

  if (requester.whatsapp_public && requester.whatsapp) {
    links.push({
      type: "whatsapp",
      label: "WhatsApp",
      icon: "💬",
      href: `https://wa.me/${normalizePhone(requester.whatsapp)}?text=${encodeURIComponent(messageText)}`,
      primary: true,
    });
  }
  if (requester.instagram) {
    const handle = requester.instagram.replace(/^@/, "");
    links.push({
      type: "instagram",
      label: "Instagram DM",
      icon: "📸",
      href: `https://ig.me/m/${handle}`,
      copyText: messageText,
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
