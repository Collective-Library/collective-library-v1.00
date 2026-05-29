import Link from "next/link";
import type { ComponentType } from "react";
import type { NavIconProps } from "@/components/layout/nav-icons";
import {
  ShelfIcon,
  WantedIcon,
  EventIcon,
  ManifestIcon,
  MemberIcon,
} from "@/components/layout/nav-icons";

/**
 * First-contribution nudge shown immediately after profile onboarding
 * completion. Skippable, additive, no persistence — see Slice 4 prompt.
 *
 * Five lightweight cards mapping to the BUSINESS_PROCESS.md loop:
 *   Books   → intellectual + availability signal
 *   Wanted  → demand signal
 *   Events  → activation / offline trust
 *   Manifest → thought signal
 *   Members → people discovery
 *
 * Footer offers "Nanti dulu" → /home so users are never forced. Returning
 * users hitting /onboarding go straight to /home (handled separately in
 * app/onboarding/page.tsx) so they don't see this prompt again.
 */
interface ContributionCard {
  id: string;
  label: string;
  description: string;
  icon: ComponentType<NavIconProps>;
  href: string;
}

const CARDS: ContributionCard[] = [
  {
    id: "fc-book",
    label: "Tambah 1 buku",
    description: "Buku jadi sinyal koleksi + ketersediaan buat orang lain.",
    icon: ShelfIcon,
    href: "/book/add",
  },
  {
    id: "fc-wanted",
    label: "Cari buku",
    description: "Sinyal kalau lo lagi nyari sesuatu spesifik.",
    icon: WantedIcon,
    href: "/wanted/add",
  },
  {
    id: "fc-event",
    label: "Lihat event",
    description: "Acara komunitas yang bisa lo datengin minggu ini.",
    icon: EventIcon,
    href: "/event",
  },
  {
    id: "fc-manifest",
    label: "Tulis manifest",
    description: "Keresahan atau insight pendek soal bacaan lo.",
    icon: ManifestIcon,
    href: "/manifest/new",
  },
  {
    id: "fc-members",
    label: "Temuin orang",
    description: "Anggota komunitas yang minat baca-nya nyambung.",
    icon: MemberIcon,
    href: "/members",
  },
];

export function FirstContributionPrompt() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          First signal
        </p>
        <h1 className="font-display text-display-xl text-ink leading-tight">
          Profile lo udah jadi.
          <br />
          Mau mulai dari mana?
        </h1>
        <p className="text-body text-ink-soft max-w-xl">
          Satu aksi kecil bikin network ini mulai hidup. Tambah buku, cari buku, ikut event, atau
          tulis manifest. Lo bisa pilih satu sekarang atau lompat dulu ke Home.
        </p>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <li key={card.id}>
              <Link
                href={card.href}
                className="group flex items-start gap-3 rounded-card-lg border border-hairline bg-paper p-4 transition-all hover:shadow-card hover:-translate-y-px"
              >
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-pill bg-cream text-ink shrink-0 group-hover:bg-cream/70 transition-colors">
                  <Icon size={20} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-semibold text-ink leading-tight">{card.label}</p>
                  <p className="text-caption text-muted leading-snug mt-0.5">{card.description}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="pt-4 border-t border-hairline-soft flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-muted">Lo bisa balik kapan aja dari Home.</p>
        <Link
          href="/home"
          className="inline-flex items-center h-9 px-4 rounded-pill bg-cream text-ink-soft text-body-sm font-medium hover:bg-cream/70 transition-colors self-start sm:self-auto"
        >
          Nanti dulu, ke Home →
        </Link>
      </div>
    </div>
  );
}
