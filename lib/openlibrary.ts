/**
 * ISBN → book metadata lookup. Tries Google Books first (broader Indonesian
 * coverage), falls back to Open Library. Both are public + CORS-enabled.
 */

export interface IsbnLookup {
  isbn: string;
  title?: string;
  author?: string;
  publisher?: string;
  description?: string;
  cover_url?: string;
  language?: string;
}

/** Strip everything but digits, accept ISBN-10 or ISBN-13. */
export function normalizeIsbn(input: string): string {
  return input.replace(/[^0-9Xx]/g, "").toUpperCase();
}

/** Open Library cover by ISBN — works even when book metadata is missing. */
export function openLibraryCoverUrl(isbn: string, size: "S" | "M" | "L" = "L") {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
}

async function lookupGoogleBooks(isbn: string): Promise<IsbnLookup | null> {
  try {
    const r = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`,
      { cache: "force-cache" },
    );
    if (!r.ok) return null;
    const data = (await r.json()) as {
      items?: Array<{
        volumeInfo?: {
          title?: string;
          authors?: string[];
          publisher?: string;
          description?: string;
          language?: string;
          imageLinks?: { thumbnail?: string; smallThumbnail?: string };
        };
      }>;
    };
    const v = data.items?.[0]?.volumeInfo;
    if (!v?.title) return null;
    // Force HTTPS for Google's image links to avoid mixed-content blocks
    const cover = v.imageLinks?.thumbnail?.replace(/^http:/, "https:");
    return {
      isbn,
      title: v.title,
      author: v.authors?.join(", "),
      publisher: v.publisher,
      description: v.description,
      language: v.language,
      cover_url: cover,
    };
  } catch {
    return null;
  }
}

async function lookupOpenLibrary(isbn: string): Promise<IsbnLookup | null> {
  try {
    const r = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`,
      { cache: "force-cache" },
    );
    if (!r.ok) return null;
    const data = (await r.json()) as Record<
      string,
      {
        title?: string;
        authors?: { name: string }[];
        publishers?: { name: string }[];
        cover?: { large?: string; medium?: string; small?: string };
        notes?: string | { value: string };
      }
    >;
    const v = data[`ISBN:${isbn}`];
    if (!v?.title) return null;
    const description =
      typeof v.notes === "string" ? v.notes : v.notes?.value;
    return {
      isbn,
      title: v.title,
      author: v.authors?.map((a) => a.name).join(", "),
      publisher: v.publishers?.map((p) => p.name).join(", "),
      description,
      cover_url: v.cover?.large ?? v.cover?.medium,
    };
  } catch {
    return null;
  }
}

/** A single search result (one candidate book). */
export interface BookSearchResult {
  /** Stable client-side key. Google Books volume id. */
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  description: string | null;
  language: string | null;
  isbn: string | null;
  cover_url: string | null;
  /** Year published, if known. */
  year: string | null;
}

/**
 * Open Library search — no quota limits, reliable for autocomplete.
 * Returns top `limit` candidates with cover URLs from covers.openlibrary.org.
 */
async function searchOpenLibraryBooks(query: string, limit = 8): Promise<BookSearchResult[]> {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=key,title,author_name,isbn,cover_i,publisher,first_publish_year,language`;
    const r = await fetch(url, { cache: "force-cache" });
    if (!r.ok) return [];
    const data = (await r.json()) as {
      docs?: Array<{
        key?: string;
        title?: string;
        author_name?: string[];
        isbn?: string[];
        cover_i?: number;
        publisher?: string[];
        first_publish_year?: number;
        language?: string[];
      }>;
    };
    return (data.docs ?? [])
      .filter((d) => d.title)
      .map((d, idx) => {
        const isbn = d.isbn?.[0] ?? null;
        const cover = d.cover_i
          ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`
          : (isbn ? openLibraryCoverUrl(isbn, "L") : null);
        return {
          id: d.key ?? `ol-${idx}`,
          title: d.title!,
          author: d.author_name?.join(", ") ?? null,
          publisher: d.publisher?.[0] ?? null,
          description: null, // OL search doesn't include description; the work API would
          language: d.language?.[0] ?? null,
          isbn,
          cover_url: cover,
          year: d.first_publish_year?.toString() ?? null,
        };
      });
  } catch {
    return [];
  }
}

/**
 * Google Books search — used as fallback after Open Library.
 * Anonymous calls share a global quota that frequently exceeds → keep secondary.
 */
async function searchGoogleBooksOnly(query: string, limit = 8): Promise<BookSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const r = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=${limit}&printType=books`,
      { cache: "force-cache" },
    );
    if (!r.ok) return [];
    const data = (await r.json()) as {
      items?: Array<{
        id?: string;
        volumeInfo?: {
          title?: string;
          authors?: string[];
          publisher?: string;
          publishedDate?: string;
          description?: string;
          language?: string;
          imageLinks?: { thumbnail?: string; smallThumbnail?: string };
          industryIdentifiers?: { type: string; identifier: string }[];
        };
      }>;
    };
    return (data.items ?? [])
      .filter((it) => it.volumeInfo?.title)
      .map((it, idx) => {
        const v = it.volumeInfo!;
        const ids = v.industryIdentifiers ?? [];
        const isbn13 = ids.find((i) => i.type === "ISBN_13")?.identifier;
        const isbn10 = ids.find((i) => i.type === "ISBN_10")?.identifier;
        const isbn = isbn13 ?? isbn10 ?? null;
        const rawCover = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail;
        const cover = rawCover?.replace(/^http:/, "https:") ?? (isbn ? openLibraryCoverUrl(isbn, "M") : null);
        return {
          id: it.id ?? `gb-${idx}`,
          title: v.title!,
          author: v.authors?.join(", ") ?? null,
          publisher: v.publisher ?? null,
          description: v.description ?? null,
          language: v.language ?? null,
          isbn,
          cover_url: cover,
          year: v.publishedDate?.slice(0, 4) ?? null,
        };
      });
  } catch {
    return [];
  }
}

/**
 * Search public book metadata by free text (title, author, or ISBN).
 * Tries Open Library first (no quota), falls back to Google Books.
 * Used by the Add Book / Edit Book picker.
 */
export async function searchGoogleBooks(query: string, limit = 8): Promise<BookSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const ol = await searchOpenLibraryBooks(q, limit);
  if (ol.length > 0) return ol;
  return await searchGoogleBooksOnly(q, limit);
}

/** Look up a book by ISBN. Returns null if no provider found anything. */
export async function lookupIsbn(rawIsbn: string): Promise<IsbnLookup | null> {
  const isbn = normalizeIsbn(rawIsbn);
  if (isbn.length !== 10 && isbn.length !== 13) return null;

  // Try Google Books first
  const google = await lookupGoogleBooks(isbn);
  if (google) {
    if (!google.cover_url) google.cover_url = openLibraryCoverUrl(isbn);
    return google;
  }

  // Fall back to Open Library
  const ol = await lookupOpenLibrary(isbn);
  if (ol) {
    if (!ol.cover_url) ol.cover_url = openLibraryCoverUrl(isbn);
    return ol;
  }

  return null;
}
