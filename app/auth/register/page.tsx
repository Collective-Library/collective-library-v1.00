import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { GoogleButton } from "@/components/auth/google-button";
import { DiscordButton } from "@/components/auth/discord-button";
import { SOCIAL_LINKS } from "@/lib/socials";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Daftarkan rak buku lo"
      subtitle="Bergabung sama jaringan pembaca yang saling berbagi & berdiskusi."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/auth/login" className="text-ink font-medium underline underline-offset-4">
            Masuk
          </Link>
          <br />
          <span className="text-muted">
            Atau{" "}
            <a
              href={SOCIAL_LINKS.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-soft font-medium underline underline-offset-4 hover:text-ink"
            >
              gabung Discord komunitas
            </a>{" "}
            dulu — ngintip vibe-nya.
          </span>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <GoogleButton />
        <DiscordButton />
        <div className="flex items-center gap-3 my-1">
          <span className="flex-1 h-px bg-hairline" />
          <span className="text-caption text-muted">atau</span>
          <span className="flex-1 h-px bg-hairline" />
        </div>
        <RegisterForm />
      </div>
    </AuthShell>
  );
}
