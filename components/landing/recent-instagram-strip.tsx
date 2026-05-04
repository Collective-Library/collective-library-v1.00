import { fetchInstagramFeed } from "@/lib/instagram";

/**
 * Latest Instagram posts from @collectivelibrary.id, served via Behold.so.
 * Horizontal scroll grid, square cards, click → opens post in new tab.
 *
 * Hides itself silently if the feed fetch fails — landing shouldn't break
 * because IG is having a moment.
 */
export async function RecentInstagramStrip() {
  const feed = await fetchInstagramFeed(8);
  if (!feed || feed.posts.length === 0) return null;

  const igUrl = `https://instagram.com/${feed.username}`;

  return (
    <section
      className="px-6 md:px-10 py-12 bg-cream/40"
      aria-label="Instagram"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <p className="text-caption text-muted uppercase tracking-wide font-semibold">
              Di Instagram
            </p>
            <h2 className="mt-1 font-display text-display-md md:text-display-lg text-ink leading-tight">
              Lagi rame di @{feed.username}
            </h2>
            {feed.biography && (
              <p className="mt-1 text-body-sm text-muted max-w-md line-clamp-2">
                {feed.biography}
              </p>
            )}
          </div>
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 text-body-sm font-medium text-ink hover:underline underline-offset-4"
          >
            <InstagramIcon />
            Follow
          </a>
        </div>

        <div
          className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-6 px-6 md:-mx-10 md:px-10 pb-2"
          aria-label="Posting Instagram terbaru — geser ke samping"
        >
          {feed.posts.map((p) => (
            <a
              key={p.id}
              href={p.permalink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={
                p.prunedCaption
                  ? `Post Instagram: ${p.prunedCaption.slice(0, 80)}`
                  : "Post Instagram"
              }
              className="group relative shrink-0 snap-start w-[200px] h-[200px] rounded-card overflow-hidden bg-cream border border-hairline shadow-card hover:shadow-card-hover transition-shadow"
            >
              <img
                src={p.thumbnail}
                alt=""
                fill
                sizes="200px"
                className="object-cover"
              />

              {/* Carousel / video icons */}
              {p.isCarousel && (
                <div className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-pill bg-black/45 text-white">
                  <CarouselIcon />
                </div>
              )}
              {p.isVideo && (
                <div className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-pill bg-black/45 text-white">
                  <PlayIcon />
                </div>
              )}

              {/* Hover overlay with caption preview */}
              {p.prunedCaption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[11px] text-white line-clamp-3 leading-snug">
                    {p.prunedCaption}
                  </p>
                </div>
              )}
            </a>
          ))}

          {/* Final card: CTA to follow */}
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 snap-start w-[200px] h-[200px] rounded-card border border-hairline-strong border-dashed bg-paper hover:bg-cream transition-colors flex flex-col items-center justify-center gap-2 px-4 text-center"
          >
            <InstagramIcon />
            <p className="text-body-sm font-semibold text-ink leading-snug">
              Follow @{feed.username}
            </p>
            <p className="text-caption text-muted">
              Buat update komunitas
            </p>
          </a>
        </div>
      </div>
    </section>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function CarouselIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="7" y="7" width="14" height="14" rx="2" ry="2" />
      <path d="M3 17V5a2 2 0 0 1 2-2h12" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinejoin="round" aria-hidden>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
