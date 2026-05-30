/**
 * Server-only Discord webhook helpers.
 *
 * Rules enforced here:
 * - Webhook URLs are read from env vars only — never passed from the client.
 * - All calls are fire-and-forget from the caller's perspective; errors are
 *   logged server-side and swallowed so user flows are never blocked.
 * - Only display-safe fields (names, titles, cities) reach Discord.
 *   No emails, IDs, tokens, phone numbers, or private addresses.
 */

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  author?: { name: string; url?: string; icon_url?: string };
  thumbnail?: { url: string };
  image?: { url: string };
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
}

/**
 * POST a single embed to a Discord incoming webhook URL.
 * Returns true on success, false on any failure (never throws).
 */
export async function sendDiscordWebhook(
  webhookUrl: string,
  embed: DiscordEmbed
): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[discord] webhook POST failed", res.status, text.slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[discord] webhook fetch error", err instanceof Error ? err.message : err);
    return false;
  }
}

/**
 * Route an embed to one or more channels by looking up env vars.
 * Silently skips any channel whose env var is not set.
 * Never throws.
 */
export async function sendToChannels(
  channels: DiscordChannel[],
  embed: DiscordEmbed
): Promise<void> {
  const urls = channels.map(resolveChannelUrl).filter(Boolean) as string[];
  if (urls.length === 0) return;
  await Promise.all(urls.map((url) => sendDiscordWebhook(url, embed)));
}

export type DiscordChannel =
  | "activity"
  | "books"
  | "map"
  | "events"
  | "feedback"
  | "system"
  | "test";

/**
 * Resolve a logical channel name to its configured webhook URL.
 * Falls back from the new per-channel vars to the legacy
 * DISCORD_COMMUNITY_WEBHOOK_URL for the "activity" channel so
 * existing Supabase webhook configs keep working during migration.
 */
export function resolveChannelUrl(channel: DiscordChannel): string | undefined {
  switch (channel) {
    case "activity":
      return process.env.DISCORD_ACTIVITY_WEBHOOK_URL ?? process.env.DISCORD_COMMUNITY_WEBHOOK_URL;
    case "books":
      return process.env.DISCORD_BOOKS_WEBHOOK_URL;
    case "map":
      return process.env.DISCORD_MAP_WEBHOOK_URL;
    case "events":
      return process.env.DISCORD_EVENTS_WEBHOOK_URL;
    case "feedback":
      return process.env.DISCORD_FEEDBACK_WEBHOOK_URL;
    case "system":
      return process.env.DISCORD_SYSTEM_WEBHOOK_URL;
    case "test":
      return process.env.DISCORD_TEST_WEBHOOK_URL;
  }
}

/** Truncate a string to Discord's safe embed field length. */
export function truncateDiscordField(value: string, maxLength = 1024): string {
  return value.length > maxLength ? value.slice(0, maxLength - 1) + "…" : value;
}
