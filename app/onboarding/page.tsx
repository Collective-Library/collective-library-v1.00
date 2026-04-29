import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { isProfileComplete } from "@/types";
import { OnboardingForm } from "./onboarding-form";
import { Logo } from "@/components/layout/logo";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login");
  if (isProfileComplete(profile)) redirect("/shelf");

  return (
    <div className="min-h-screen bg-parchment">
      <header className="px-6 py-5 border-b border-hairline-soft">
        <div className="mx-auto max-w-2xl flex items-center gap-2">
          <Logo size={28} />
          <span className="font-display text-title-md text-ink leading-none">Collective Library</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8">
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">Onboarding</p>
          <h1 className="mt-2 font-display text-display-xl text-ink leading-tight">
            Mari kenalan dulu
          </h1>
          <p className="mt-3 text-body-lg text-ink-soft">
            Beberapa info biar orang bisa nemuin lo dan ngobrol soal buku.
          </p>
        </div>
        <OnboardingForm initial={profile} />
      </main>
    </div>
  );
}
