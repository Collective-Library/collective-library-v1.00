import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { EventForm } from "@/components/events/event-form";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/event/new");

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Bikin event
        </p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Ngumpul yuk
        </h1>
        <p className="mt-2 text-body text-ink-soft">
          Diskusi buku, kopdar, workshop — apa aja yang bikin orang ketemu offline (atau online).
        </p>
      </div>

      <EventForm userId={user.id} mode="create" />
    </div>
  );
}
