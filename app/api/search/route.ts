import { NextResponse, type NextRequest } from "next/server";
import { searchBooks } from "@/lib/books";

/**
 * Lightweight search endpoint for the TopBar autocomplete dropdown. Uses the
 * existing `searchBooks` helper (FTS websearch with ilike fallback). Caps at
 * 8 by default for the dropdown — full results live at /search.
 *
 * Why a JSON endpoint instead of a server action: the dropdown debounces
 * keystrokes client-side (200ms) and needs cancelable fetch on every input.
 * Server actions would re-render the whole tree per keystroke.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "8");
  const limit = Math.max(1, Math.min(Number.isFinite(limitRaw) ? limitRaw : 8, 12));

  if (q.length < 2) {
    return NextResponse.json({ books: [], total: 0, query: q });
  }

  const results = await searchBooks(q, limit);

  // Project to the minimum shape the dropdown needs — keeps the JSON small
  // and removes unmasked WhatsApp from the wire.
  const books = results.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    cover_url: b.cover_url,
    status: b.status,
    owner: {
      id: b.owner.id,
      full_name: b.owner.full_name,
      username: b.owner.username,
      photo_url: b.owner.photo_url,
      city: b.owner.city,
    },
  }));

  return NextResponse.json(
    { books, total: books.length, query: q },
    {
      headers: {
        // Per-user cache (no shared CDN cache) — admin reads + auth-gated.
        "Cache-Control": "private, max-age=10",
      },
    },
  );
}
