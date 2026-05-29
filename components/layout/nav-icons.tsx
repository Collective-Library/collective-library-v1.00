/**
 * Consolidated navigation icons. Single source of truth for every icon used
 * across DesktopNav, BottomNav, HamburgerMenu, AvatarMenu, and ExploreDropdown.
 *
 * Each icon: 24x24 viewBox, currentColor stroke (1.75), single-stroke design.
 * Caller controls size via the `size` prop and may pass `className` for
 * layout-specific tweaks (e.g. `shrink-0 mt-0.5` for Hamburger rows).
 *
 * Shell-only chrome (the hamburger Menu/Close buttons, the TopBar search
 * shortcut) stays in its host component — those are not nav surfaces.
 */

export type NavIconProps = { size?: number; className?: string };

function baseProps(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor" as const,
    strokeWidth: "1.75",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    className,
  };
}

export function HomeIcon({ size = 18, className }: NavIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

export function ShelfIcon({ size = 18, className }: NavIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M4 4v16M4 8h16M4 16h16M20 4v16M8 8v8M11 8v8M14 8v8M17 8v8" />
    </svg>
  );
}

export function ActivityIcon({ size = 18, className }: NavIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export function EventIcon({ size = 18, className }: NavIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  );
}

export function MemberIcon({ size = 18, className }: NavIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 21v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" />
      <circle cx="17" cy="8" r="3" />
      <path d="M21 21v-1a5 5 0 0 0-3-4.6" />
    </svg>
  );
}

export function ManifestIcon({ size = 18, className }: NavIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M3 21V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M16 3v5h5" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

export function MapIcon({ size = 18, className }: NavIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

export function SpotIcon({ size = 18, className }: NavIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M12 22s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function WantedIcon({ size = 18, className }: NavIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2 2-2.5 3v.5" />
      <line x1="12" y1="17" x2="12" y2="17" />
    </svg>
  );
}

export function SearchIcon({ size = 18, className }: NavIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function AddIcon({ size = 18, className }: NavIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function ProfileIcon({ size = 18, className }: NavIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

export function FeedbackIcon({ size = 18, className }: NavIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function MastermindIcon({ size = 18, className }: NavIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M3 12c2-3 7-4 9-2 2-2 7-1 9 2" />
    </svg>
  );
}

export function MarketIcon({ size = 18, className }: NavIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M3 6h18l-1.5 11a2 2 0 0 1-2 1.7H6.5A2 2 0 0 1 4.5 17z" />
      <path d="M8 6V4a4 4 0 0 1 8 0v2" />
    </svg>
  );
}

export function ExploreIcon({ size = 16, className }: NavIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 11 6-3-3 6-3-3 6-3" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 12, className }: NavIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
