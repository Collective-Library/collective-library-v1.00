import Link from "next/link";
import { listEvents } from "@/lib/events";
import { EventCard } from "@/components/events/event-card";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

type SP = { filter?: "upcoming" | "past" };

export default async function EventListPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { filter } = await searchParams;
  const activeFilter = filter === "past" ? "past" : "upcoming";

  const { events, total } = await listEvents({
    filter: activeFilter,
    pageSize: 30,
  });

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">
            Event komunitas
          </p>
          <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
            {activeFilter === "upcoming" ? "Yang akan datang" : "Yang sudah lewat"}
          </h1>
          <p className="mt-2 text-body text-ink-soft max-w-xl">
            Diskusi buku, kopdar, workshop, dan kumpul-kumpul lainnya yang dibikin sama anggota.
          </p>
        </div>
        <ButtonLink href="/event/new" className="shrink-0">
          + Bikin event
        </ButtonLink>
      </div>

      {/* Upcoming / Past filter pills */}
      <div className="flex gap-2">
        <FilterPill href="/event" active={activeFilter === "upcoming"} label="Akan datang" />
        <FilterPill href="/event?filter=past" active={activeFilter === "past"} label="Yang lewat" />
      </div>

      {events.length === 0 ? (
        <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
          <p className="font-display text-title-lg text-ink">
            {activeFilter === "upcoming"
              ? "Belum ada event yang akan datang."
              : "Belum ada event yang sudah lewat."}
          </p>
          <p className="mt-2 text-body text-muted">
            {activeFilter === "upcoming"
              ? "Anggota belum bikin event. Lo bisa jadi yang pertama →"
              : "Cek tab 'Akan datang' untuk yang masih bisa di-RSVP."}
          </p>
          {activeFilter === "upcoming" && (
            <div className="mt-4">
              <ButtonLink href="/event/new" variant="secondary">
                Bikin event pertama
              </ButtonLink>
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="text-caption text-muted">
            {total} event {activeFilter === "upcoming" ? "akan datang" : "sudah lewat"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium transition-colors",
        active
          ? "bg-ink text-parchment"
          : "bg-paper text-ink-soft border border-hairline hover:bg-cream",
      )}
    >
      {label}
    </Link>
  );
}
