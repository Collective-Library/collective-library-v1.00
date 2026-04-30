"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Discord OAuth login. Identical pattern to GoogleButton.
 * Requires Discord provider enabled in Supabase Auth + Client ID/Secret pasted.
 *
 * Discord scopes used: identify (default — username + avatar) and email
 * (so Supabase can dedup with email-password accounts).
 */
export function DiscordButton({ next }: { next?: string }) {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    const redirectTo = new URL("/auth/callback", window.location.origin);
    if (next) redirectTo.searchParams.set("next", next);
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: redirectTo.toString(),
        scopes: "identify email",
      },
    });
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={loading}
      className="w-full h-12 rounded-button bg-[#5865F2] text-white font-medium inline-flex items-center justify-center gap-3 hover:bg-[#4752C4] transition-colors disabled:opacity-50"
    >
      <svg width="20" height="20" viewBox="0 0 71 55" aria-hidden fill="currentColor">
        <path d="M60.105 4.898A58.55 58.55 0 0 0 45.653.415a.221.221 0 0 0-.232.111c-.65 1.149-1.354 2.585-1.847 3.751-5.892-.873-11.792-.873-17.564 0-.493-1.184-1.207-2.602-1.851-3.75a.227.227 0 0 0-.233-.112C19.288.928 14.395 2.42 9.835 4.898a.21.21 0 0 0-.094.082C.879 18.198-1.483 31.07.071 43.802a.245.245 0 0 0 .093.166c5.93 4.34 11.665 6.965 17.292 8.708a.234.234 0 0 0 .254-.082c1.336-1.81 2.526-3.717 3.546-5.722a.227.227 0 0 0-.124-.317c-1.886-.708-3.682-1.572-5.412-2.554a.228.228 0 0 1-.022-.379 30.06 30.06 0 0 0 1.075-.835.22.22 0 0 1 .228-.031c11.34 5.157 23.62 5.157 34.826 0a.219.219 0 0 1 .232.029c.349.286.706.563 1.077.838a.228.228 0 0 1-.02.378 35.658 35.658 0 0 1-5.412 2.55.227.227 0 0 0-.123.319 41.298 41.298 0 0 0 3.546 5.72.224.224 0 0 0 .254.085c5.652-1.745 11.387-4.37 17.317-8.71a.226.226 0 0 0 .093-.164c1.86-14.717-3.115-27.484-13.184-38.825a.18.18 0 0 0-.092-.083zM23.725 36.05c-3.524 0-6.426-3.236-6.426-7.21 0-3.974 2.846-7.211 6.426-7.211 3.608 0 6.482 3.265 6.426 7.21 0 3.974-2.846 7.21-6.426 7.21zm23.633 0c-3.523 0-6.425-3.236-6.425-7.21 0-3.974 2.846-7.211 6.425-7.211 3.61 0 6.483 3.265 6.426 7.21 0 3.974-2.817 7.21-6.426 7.21z" />
      </svg>
      {loading ? "Membuka Discord…" : "Lanjutkan dengan Discord"}
    </button>
  );
}
