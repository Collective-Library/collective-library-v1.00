"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const captchaRef = useRef<HCaptcha>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // hCaptcha required only when sitekey is configured. In dev (no key),
  // widget is hidden and Supabase signIn ignores the missing token.
  const sitekey = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (sitekey && !captchaToken) {
      return setError("Selesain captcha dulu ya.");
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      ...(captchaToken ? { options: { captchaToken } } : {}),
    });
    setLoading(false);
    captchaRef.current?.resetCaptcha();
    setCaptchaToken(null);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace(next ?? "/shelf");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
        autoComplete="current-password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
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
      <Button type="submit" disabled={loading} fullWidth>
        {loading ? "Masuk…" : "Masuk"}
      </Button>
    </form>
  );
}
