"use client";

import Link from "next/link";
import type { ReactNode, MouseEvent } from "react";
import { useLoginNudge } from "./login-nudge";

/**
 * Drop-in replacement for `<Link>`. When the surrounding `LoginNudgeProvider`
 * has `isAnon=true`, intercepts the click and opens the login-nudge modal
 * instead of navigating. Otherwise behaves exactly like a regular Link.
 *
 * Used in landing strips so anon visitors get an invitation popup instead of
 * a hard auth-wall when they try to drill into a book or member card.
 */
export function GatedLink({
  href,
  children,
  className,
  "aria-label": ariaLabel,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const { isAnon, nudge } = useLoginNudge();

  if (isAnon) {
    function onClick(e: MouseEvent<HTMLAnchorElement>) {
      e.preventDefault();
      nudge();
    }
    return (
      <a href={href} onClick={onClick} className={className} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
