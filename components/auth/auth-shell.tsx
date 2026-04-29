import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <header className="px-6 py-5">
        <Link href="/" aria-label="Beranda" className="inline-flex items-center gap-2">
          <Logo size={28} />
          <span className="font-display text-title-md text-ink leading-none">Collective Library</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          <div className="mb-7">
            <h1 className="font-display text-display-lg text-ink leading-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-body text-muted">{subtitle}</p>}
          </div>
          <div className="bg-paper border border-hairline rounded-card-lg shadow-card p-6 md:p-7">
            {children}
          </div>
          {footer && <div className="mt-5 text-center text-body-sm text-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
