"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
  const router = useRouter();
  const captchaRef = useRef<HCaptcha>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // hCaptcha is enforced only when both:
  // - NEXT_PUBLIC_HCAPTCHA_SITEKEY is set (= you've configured the widget)
  // - Supabase Auth → Bot and Abuse Protection has hCaptcha enabled (server side)
  // If sitekey is unset, the widget doesn't render and Supabase signUp ignores
  // the missing token. This keeps local dev frictionless.
  const sitekey = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (sitekey && !captchaToken) {
      return setError("Selesain captcha dulu ya.");
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        ...(captchaToken ? { captchaToken } : {}),
      },
    });
    setLoading(false);
    // Reset captcha — tokens are single-use.
    captchaRef.current?.resetCaptcha();
    setCaptchaToken(null);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.replace("/onboarding");
      router.refresh();
    } else {
      setInfo("Kami sudah kirim email konfirmasi. Cek inbox lo ya.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        label="Nama lengkap"
        autoComplete="name"
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Cole Hardiyanto"
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="kamu@contoh.com"
      />
      <PasswordInput
        label="Password"
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint="Minimal 8 karakter."
      />
      {sitekey && (
        <div className="flex justify-center">
          <HCaptcha
            ref={captchaRef}
            sitekey={sitekey}
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
          />
        </div>
      )}
      {error && <p className="text-caption text-(--color-error)">{error}</p>}
      {info && <p className="text-caption text-(--color-success)">{info}</p>}
      <Button type="submit" disabled={loading} fullWidth>
        {loading ? "Membuat akun…" : "Daftar"}
      </Button>
    </form>
  );
}
