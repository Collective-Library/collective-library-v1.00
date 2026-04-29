"use client";

import { useState } from "react";
import type { ContactLink } from "@/lib/contact";

export function SecondaryContactRow({ links }: { links: ContactLink[] }) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) =>
        "href" in link ? (
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
        ) : (
          <DiscordCopyChip
            key={link.type}
            icon={link.icon}
            label={link.label}
            value={link.copy}
          />
        ),
      )}
    </div>
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
