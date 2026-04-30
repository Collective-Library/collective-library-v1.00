// =============================================================================
// Instagram feed via Behold.so
//
// We fetch the public Behold JSON endpoint server-side with Next's `revalidate`
// caching, so visitors always see fresh-ish content without us paying upstream
// latency on every render. Behold handles Meta's auth + token refresh; we just
// consume the JSON.
//
// Feed ID is configurable via env so we can rotate or use different accounts
// per environment without redeploying. Fallback default = the production feed.
// =============================================================================

const FEED_ID =
  process.env.NEXT_PUBLIC_INSTAGRAM_FEED_ID ?? "KXEDH9v8OvaFCkYYgsX7";
const FEED_URL = `https://feeds.behold.so/${FEED_ID}`;

const REVALIDATE_SECONDS = 60 * 60; // 1 hour — IG posts don't change often

export interface InstagramPost {
  id: string;
  permalink: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | string;
  caption: string;
  prunedCaption: string;
  thumbnail: string;
  isCarousel: boolean;
  isVideo: boolean;
  timestamp: string;
}

export interface InstagramFeed {
  username: string;
  biography: string;
  profilePictureUrl: string;
  followersCount: number;
  posts: InstagramPost[];
}

interface RawBeholdPost {
  id: string;
  timestamp: string;
  permalink: string;
  mediaType: string;
  mediaUrl: string;
  caption?: string;
  prunedCaption?: string;
  sizes?: {
    small?: { mediaUrl?: string };
    medium?: { mediaUrl?: string };
    large?: { mediaUrl?: string };
    full?: { mediaUrl?: string };
  };
}

interface RawBeholdResponse {
  username?: string;
  biography?: string;
  profilePictureUrl?: string;
  followersCount?: number;
  posts?: RawBeholdPost[];
}

/**
 * Fetch the Instagram feed. Returns null on hard failure so callers can hide
 * the section gracefully — landing should never throw because IG is down.
 */
export async function fetchInstagramFeed(limit = 8): Promise<InstagramFeed | null> {
  try {
    const res = await fetch(FEED_URL, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      console.warn("[instagram] feed fetch returned", res.status);
      return null;
    }
    const json = (await res.json()) as RawBeholdResponse;

    const posts: InstagramPost[] = (json.posts ?? [])
      .slice(0, limit)
      .map((p) => {
        // Prefer medium size (560×700) for thumbnails — close to our card
        // dimensions, avoids paying for 1080px when displaying ~200px.
        const thumbnail =
          p.sizes?.medium?.mediaUrl ??
          p.sizes?.small?.mediaUrl ??
          p.sizes?.large?.mediaUrl ??
          p.mediaUrl;

        return {
          id: p.id,
          permalink: p.permalink,
          mediaType: p.mediaType,
          caption: p.caption ?? "",
          prunedCaption: p.prunedCaption ?? p.caption ?? "",
          thumbnail,
          isCarousel: p.mediaType === "CAROUSEL_ALBUM",
          isVideo: p.mediaType === "VIDEO",
          timestamp: p.timestamp,
        };
      });

    return {
      username: json.username ?? "collectivelibrary.id",
      biography: json.biography ?? "",
      profilePictureUrl: json.profilePictureUrl ?? "",
      followersCount: json.followersCount ?? 0,
      posts,
    };
  } catch (err) {
    console.error("[instagram] feed fetch failed", err);
    return null;
  }
}
