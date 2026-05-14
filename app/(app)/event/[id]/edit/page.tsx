import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRawEvent } from "@/lib/events";
import { EventForm } from "@/components/events/event-form";
import { DeleteEventButton } from "./delete-event-button";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=/event/${id}/edit`);

  const event = await getRawEvent(id);
  if (!event) notFound();
  if (event.host_id !== user.id) notFound();

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Edit event
        </p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          {event.title}
        </h1>
      </div>

      <EventForm userId={user.id} mode="edit" initial={event} />

      <div className="mt-8 pt-6 border-t border-hairline">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-2">
          Danger zone
        </p>
        <p className="text-body-sm text-ink-soft mb-3">
          Batalin event akan hide event dari feed dan mark status sebagai cancelled. RSVP list tetap tersimpan.
        </p>
        <DeleteEventButton eventId={event.id} />
      </div>
    </div>
  );
}
