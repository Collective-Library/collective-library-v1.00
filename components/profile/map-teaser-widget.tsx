import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { listMembersForMap } from "@/lib/profile";

/**
 * Compact teaser strip for /peta. Sits above the anggota grid as a soft
 * social-proof hook: "X anggota udah di peta — ikutan?".
 *
 * Not an interactive map — that's /peta. This is a curiosity layer:
 * a row of overlapping avatars on a parchment-paper-map gradient, plus a
 * gentle CTA. No leaflet bundle weight here.
 */
export async function MapTeaserWidget() {
  const members = await listMembersForMap();
  if (members.length === 0) {
    // Empty state: invite the first opt-in. Permission framing.
    return (
      <Link
        href="/profile/edit"
        className="group flex items-center gap-4 p-4 rounded-card-lg border border-hairline bg-gradient-to-br from-cream to-parchment hover:shadow-card transition-shadow"
      >
        <div className="shrink-0 w-12 h-12 rounded-pill bg-ink/5 flex items-center justify-center text-ink-soft text-2xl">
          📍
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-semibold text-ink">Belum ada anggota di peta.</p>
          <p className="text-caption text-muted">Lo bisa jadi yang pertama ikut tampilin lokasi.</p>
        </div>
        <span className="text-caption text-ink-soft shrink-0 hidden sm:inline">Jadi pioneer →</span>
      </Link>
    );
  }

  // Pick up to 6 members for the avatar stack — diverse-feeling sample.
  // Just take the first 6 (already sorted by updated_at desc in listMembersForMap)
  const stack = members.slice(0, 6);
  const cities = Array.from(
    new Set(members.map((m) => m.city).filter(Boolean) as string[]),
  ).slice(0, 3);
  const cityLabel = cities.length > 0 ? cities.join(" · ") : "Indonesia";

  return (
    <Link
      href="/peta"
      aria-label="Buka peta komunitas"
      className="group relative flex items-center gap-4 p-4 rounded-card-lg border border-hairline bg-gradient-to-br from-cream via-paper to-parchment hover:shadow-card transition-shadow overflow-hidden"
    >
      {/* Soft dotted overlay — paper-map vibe */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--color-ink) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* Avatar stack — overlapping, suggesting clustering */}
      <div className="relative flex shrink-0 -space-x-2">
        {stack.map((m, i) => (
          <span
            key={m.id}
            className="relative inline-block ring-2 ring-paper rounded-pill"
            style={{ zIndex: stack.length - i }}
          >
            <Avatar
              src={m.photo_url}
              name={m.full_name ?? m.username}
              size={36}
            />
          </span>
        ))}
      </div>

      <div className="relative flex-1 min-w-0">
        <p className="text-body-sm font-semibold text-ink leading-tight">
          {members.length} anggota udah di peta
        </p>
        <p className="text-caption text-muted truncate">
          {cityLabel} · klik buat lihat sebaran lengkap
        </p>
      </div>

      <span className="relative shrink-0 inline-flex items-center gap-1 text-body-sm font-semibold text-ink-soft group-hover:text-ink transition-colors">
        <span className="hidden sm:inline">Buka peta</span>
        <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
