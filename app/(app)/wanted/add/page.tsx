import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth";
import { WantedForm } from "@/components/wanted/wanted-form";

export const dynamic = "force-dynamic";

type SP = { title?: string; author?: string };

export default async function AddWantedPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/wanted/add");

  const profile = await getCurrentProfile();
  const { title, author } = await searchParams;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">WTB Request</p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Cari buku ke komunitas
        </h1>
        <p className="mt-2 text-body text-muted">
          Anggota yang punya buku ini bisa langsung kontak lo via WhatsApp / IG.
        </p>
      </div>
      <WantedForm
        userId={user.id}
        defaultCity={profile?.city ?? "Semarang"}
        defaultTitle={title}
        defaultAuthor={author}
      />
    </div>
  );
}
