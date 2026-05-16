import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ManifestForm } from "@/components/manifest/manifest-form";

export const dynamic = "force-dynamic";

export default async function NewManifestPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/manifest/new");

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Tulis manifesto
        </p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Apa yang lagi ada di kepala?
        </h1>
        <p className="mt-2 text-body text-ink-soft">
          1-3 kalimat punchy soal buku, komunitas, atau dunia. Manifesto bagus selalu pendek.
        </p>
      </div>

      <ManifestForm userId={user.id} />
    </div>
  );
}
