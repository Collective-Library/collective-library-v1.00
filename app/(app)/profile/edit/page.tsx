import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { ProfileEditForm } from "./profile-edit-form";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">Profil</p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Edit profil lo
        </h1>
        <p className="mt-2 text-body text-muted">
          Update info, foto, atau cara orang ngehubungin lo.
        </p>
      </div>
      <ProfileEditForm initial={profile} />
    </div>
  );
}
