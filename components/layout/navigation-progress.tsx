"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin ink-colored progress bar at the very top of the viewport that fires
 * on every same-origin link click and clears once the new route finishes.
 *
 * How it works (App Router):
 *  - Navigation START is detected via a document-level click listener that
 *    matches any <a href> that isn't a hash link / external link / new tab.
 *  - Navigation END is detected via usePathname + useSearchParams updates,
 *    which Next.js only delivers after the server component has rendered.
 *  - This gives smooth visual coverage for the entire server round-trip.
 *
 * Must be mounted inside a <Suspense> boundary because useSearchParams
 * opts into client-side rendering.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const didMount = useRef(false);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  // Route changed → complete bar then fade out
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    clearTimers();
    setWidth(100);
    timers.current.push(
      setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 380),
    );
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Link click → start bar, creep forward while waiting
  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      // Ignore modifier-key combos (open in new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      // Skip hash-only, mailto, tel, external, and new-tab links
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.target === "_blank") return;
      if (href.startsWith("http") && !href.startsWith(window.location.origin)) return;

      clearTimers();
      setWidth(18);
      setVisible(true);
      timers.current.push(setTimeout(() => setWidth(45), 220));
      timers.current.push(setTimeout(() => setWidth(68), 800));
    }

    document.addEventListener("click", onLinkClick);
    return () => {
      document.removeEventListener("click", onLinkClick);
      clearTimers();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[9999] h-[2px] bg-ink rounded-r-full"
      style={{
        width: `${width}%`,
        transition:
          width === 100
            ? "width 200ms ease-out, opacity 200ms ease"
            : "width 700ms cubic-bezier(0.08, 0.82, 0.17, 1)",
      }}
    />
  );
}
