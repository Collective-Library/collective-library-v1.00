import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUserSignal } from "@/lib/signals";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/url";
import { Avatar } from "@/components/ui/avatar";
import { CopySignalLink } from "@/components/signals/copy-signal-link";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

async function getOwnerProfile(userId: string) {
  const db = createAdminClient();
  const { data } = await db
    .from("profiles_public")
    .select("id, full_name, username, photo_url")
    .eq("id", userId)
    .maybeSingle();
  return data as {
    id: string;
    full_name: string | null;
    username: string | null;
    photo_url: string | null;
  } | null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const signal = await getUserSignal(id);
  if (!signal?.definition) return { title: "Collective Signal" };

  const def = signal.definition;
  const base = getAppUrl();
  const label = `${def.emoji ?? "✦"} ${def.name}`;
  const desc = def.card_subcopy ?? def.description ?? "Signal di Collective Library.";

  return {
    title: label,
    description: desc,
    openGraph: {
      title: `${label} · Collective Library`,
      description: desc,
      images: [`${base}/api/og/signal/${id}?format=preview`],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function SignalDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const signal = await getUserSignal(id);
  if (!signal?.definition) notFound();

  const def = signal.definition;
  const [owner] = await Promise.all([getOwnerProfile(signal.user_id)]);

  const base = getAppUrl();
  const signalUrl = `${base}/signal/${id}`;

  const dateStr = new Date(signal.unlocked_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-md mx-auto flex flex-col items-center text-center py-8 md:py-12">
      {/* Emoji */}
      {def.emoji && (
        <div className="text-[72px] leading-none mb-5 select-none" aria-hidden>
          {def.emoji}
        </div>
      )}

      {/* Signal name */}
      <h1 className="font-display text-display-xl text-ink leading-tight mb-2">{def.name}</h1>

      {/* Card headline — only shown when different from name */}
      {def.card_headline && def.card_headline !== def.name && (
        <p className="text-body font-semibold text-ink mb-2">{def.card_headline}</p>
      )}

      {/* Subcopy */}
      {def.card_subcopy && (
        <p className="text-body text-ink-soft max-w-xs mb-6">{def.card_subcopy}</p>
      )}

      {/* Owner + unlock date */}
      <div className="mb-8 flex flex-col items-center gap-1.5">
        {owner && (
          <Link
            href={`/profile/${owner.username}`}
            className="flex items-center gap-2 hover:opacity-75 transition-opacity"
          >
            <Avatar src={owner.photo_url} name={owner.full_name} size={28} />
            <span className="text-body-sm font-medium text-ink">
              {owner.full_name ?? owner.username ?? "Anggota"}
            </span>
          </Link>
        )}
        <p className="text-caption text-muted">Diunlock {dateStr}</p>
      </div>

      {/* Share actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full">
        <CopySignalLink url={signalUrl} />

        {/* Card export buttons — wired up in Slice 7 */}
        <a
          href={`${base}/api/og/signal/${id}?format=story`}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled="true"
          tabIndex={-1}
          onClick={(e) => e.preventDefault()}
          title="Signal Card — tersedia segera"
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-pill
            bg-paper border border-hairline text-ink-soft text-body-sm font-medium
            opacity-50 cursor-not-allowed select-none"
        >
          Share Story
        </a>

        <a
          href={`${base}/api/og/signal/${id}?format=feed`}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled="true"
          tabIndex={-1}
          onClick={(e) => e.preventDefault()}
          title="Signal Card — tersedia segera"
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-pill
            bg-paper border border-hairline text-ink-soft text-body-sm font-medium
            opacity-50 cursor-not-allowed select-none"
        >
          Download Feed
        </a>
      </div>

      {/* Category badge */}
      <p className="mt-8 text-caption text-muted uppercase tracking-wide">{def.category} signal</p>
    </div>
  );
}
