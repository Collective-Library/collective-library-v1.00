import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";

type SP = { next?: string };

export default async function LoginPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { next } = await searchParams;
  return (
    <AuthShell
      title="Masuk"
      subtitle="Lanjutkan ke rak buku komunitas lo."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/auth/register" className="text-ink font-medium underline underline-offset-4">
            Daftar
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <GoogleButton next={next} />
        <div className="flex items-center gap-3">
          <span className="flex-1 h-px bg-hairline" />
          <span className="text-caption text-muted">atau</span>
          <span className="flex-1 h-px bg-hairline" />
        </div>
        <LoginForm next={next} />
      </div>
    </AuthShell>
  );
}
