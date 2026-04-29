import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-parchment hover:bg-ink-soft active:scale-[0.98]",
  secondary:
    "bg-paper text-ink border border-hairline-strong hover:bg-cream active:scale-[0.98]",
  ghost:
    "bg-transparent text-ink hover:underline underline-offset-4",
};

const sizes: Record<Size, string> = {
  md: "h-12 px-5 text-[15px] rounded-button",
  sm: "h-9 px-4 text-[14px] rounded-button",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  pill?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;
type LinkProps = CommonProps & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export function Button({
  variant = "primary",
  size = "md",
  pill = false,
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        base,
        variants[variant],
        sizes[size],
        pill && "rounded-pill",
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  pill = false,
  fullWidth = false,
  className,
  href,
  children,
  ...rest
}: LinkProps) {
  const isExternal = href.startsWith("http");
  const cls = cn(
    base,
    variants[variant],
    sizes[size],
    pill && "rounded-pill",
    fullWidth && "w-full",
    className,
  );
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}
