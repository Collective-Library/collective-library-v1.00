"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { ContactLink } from "@/lib/contact";

export function SecondaryContactRow({ links }: { links: ContactLink[] }) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        if (link.type === "instagram") {
          return <InstagramDMChip key={link.type} link={link} />;
        }
        if (link.type === "discord") {
          return (
            <DiscordCopyChip
              key={link.type}
              icon={link.icon}
              label={link.label}
              value={link.copy}
            />
          );
        }
        return (
          <a
            key={link.type}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-pill bg-cream text-ink-soft text-body-sm font-medium hover:bg-parchment border border-hairline transition-colors"
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </a>
        );
      })}
    </div>
  );
}

/**
 * Instagram DM chip — copies the prepared message to clipboard, then opens
 * ig.me/m/USERNAME in a new tab. IG doesn't support URL-based message
 * prefill (unlike WhatsApp), so this is the closest "literally direct" UX
 * we can offer.
 */
function InstagramDMChip({
  link,
}: {
  link: Extract<ContactLink, { type: "instagram" }>;
}) {
  const [busy, setBusy] = useState(false);

  async function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      await navigator.clipboard.writeText(link.copyText);
      toast.success("Pesan tersalin — paste di IG ✓", { duration: 4000 });
    } catch {
      toast.message("Buka IG, paste pesan dari memory clipboard.");
    } finally {
      setBusy(false);
      // Open IG DM after copy completes (best-effort)
      window.open(link.href, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <a
      href={link.href}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-pill bg-cream text-ink-soft text-body-sm font-medium hover:bg-parchment border border-hairline transition-colors"
      title="Salin template + buka IG DM"
    >
      <span aria-hidden>{link.icon}</span>
      <span>{busy ? "Menyalin…" : link.label}</span>
    </a>
  );
}

function DiscordCopyChip({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }).catch(() => {});
      }}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-pill bg-cream text-ink-soft text-body-sm font-medium hover:bg-parchment border border-hairline transition-colors"
      title={`Salin: ${value}`}
    >
      <span>{icon}</span>
      <span>{copied ? "Disalin!" : label}</span>
    </button>
  );
}
