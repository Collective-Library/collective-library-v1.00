"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const SECTIONS: { slug: string; label: string; emoji: string; href: string; phase: 1 | 2 | 3 }[] = [
  { slug: "overview",     label: "Mission Control",     emoji: "🎯", href: "/mastermind",            phase: 1 },
  { slug: "okrs",         label: "OKR Control Tower",   emoji: "🧭", href: "/mastermind/okrs",       phase: 1 },
  { slug: "team",         label: "Team & Tasks",        emoji: "🛠️", href: "/mastermind/team",       phase: 1 },
  { slug: "users",        label: "User Intelligence",   emoji: "👥", href: "/mastermind/users",      phase: 1 },
  { slug: "books",        label: "Book Intelligence",   emoji: "📚", href: "/mastermind/books",      phase: 1 },
  { slug: "requests",     label: "Buku Dicari (WTB)",   emoji: "🔎", href: "/mastermind/requests",   phase: 1 },
  { slug: "community",    label: "Community",           emoji: "🤝", href: "/mastermind/community",  phase: 1 },
  { slug: "data-health",  label: "Data Health",         emoji: "🩺", href: "/mastermind/data-health",phase: 1 },
  { slug: "events",       label: "Events & Knowledge",  emoji: "🎪", href: "/mastermind/events",     phase: 2 },
  { slug: "decisions",    label: "Decision Log",        emoji: "📓", href: "/mastermind/decisions",  phase: 2 },
  { slug: "product-lab",  label: "Product Lab",         emoji: "🧪", href: "/mastermind/product-lab",phase: 2 },
  { slug: "loans",        label: "Loan Ledger",         emoji: "📒", href: "/mastermind/loans",      phase: 3 },
];

export function MastermindSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Mastermind navigation">
      <p className="px-3 pt-1 pb-2 text-[11px] font-semibold tracking-wide text-muted uppercase">
        Sections
      </p>
      {SECTIONS.map((s) => {
        const active =
          s.href === "/mastermind"
            ? pathname === "/mastermind"
            : pathname === s.href || pathname.startsWith(s.href + "/");
        return (
          <Link
            key={s.slug}
            href={s.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-2.5 px-3 py-2 rounded-button text-body-sm transition-colors",
              active
                ? "bg-ink text-parchment"
                : "text-ink-soft hover:bg-cream hover:text-ink",
            )}
            aria-current={active ? "page" : undefined}
          >
            <span aria-hidden className="text-base leading-none">{s.emoji}</span>
            <span className="flex-1 truncate">{s.label}</span>
            {s.phase > 1 && (
              <span
                className={cn(
                  "inline-flex items-center h-5 px-1.5 rounded-pill text-[9px] font-semibold tracking-wide",
                  active
                    ? "bg-parchment/20 text-parchment"
                    : "bg-cream text-muted border border-hairline",
                )}
                title={`Phase ${s.phase} — instrumentation pending`}
              >
                P{s.phase}
              </span>
            )}
          </Link>
        );
      })}

      <div className="mt-3 pt-3 border-t border-hairline-soft">
        <Link
          href="/admin/feedback"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-button text-body-sm text-ink-soft hover:bg-cream hover:text-ink transition-colors",
            pathname.startsWith("/admin/feedback") && "bg-cream text-ink",
          )}
        >
          <span aria-hidden className="text-base leading-none">📥</span>
          <span className="flex-1 truncate">Feedback inbox</span>
        </Link>
        <Link
          href="/shelf"
          onClick={onNavigate}
          className="flex items-center gap-2.5 px-3 py-2 rounded-button text-body-sm text-muted hover:bg-cream hover:text-ink-soft transition-colors"
        >
          <span aria-hidden className="text-base leading-none">←</span>
          <span className="flex-1 truncate">Balik ke app</span>
        </Link>
      </div>
    </nav>
  );
}
