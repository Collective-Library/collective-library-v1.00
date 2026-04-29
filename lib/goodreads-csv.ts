import Papa from "papaparse";

/**
 * Goodreads CSV row → normalized book draft.
 * Goodreads wraps ISBN columns in `="..."` (Excel formula format) to preserve
 * leading zeros — strip that before using.
 */
export interface GoodreadsRow {
  Title?: string;
  Author?: string;
  ISBN?: string;
  ISBN13?: string;
  Publisher?: string;
  "Year Published"?: string;
  "My Rating"?: string;
  "Date Read"?: string;
  "Date Added"?: string;
  "Exclusive Shelf"?: string;
  Bookshelves?: string;
  "Bookshelves with positions"?: string;
  "My Review"?: string;
}

export interface GoodreadsBook {
  title: string;
  author: string;
  isbn: string | null;
  publisher: string | null;
  description: string | null;
  shelf: string;
  rating: number | null;
}

/** Strip Goodreads's `="..."` Excel-formula wrapping. */
function stripWrap(s: string | undefined): string {
  if (!s) return "";
  return s.replace(/^="?/, "").replace(/"?$/, "").trim();
}

/** Parse a Goodreads export CSV file. Returns normalized book drafts. */
export async function parseGoodreadsCsv(file: File): Promise<GoodreadsBook[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<GoodreadsRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const books: GoodreadsBook[] = [];
        for (const row of result.data) {
          const title = (row.Title ?? "").trim();
          const author = (row.Author ?? "").trim();
          if (!title || !author) continue;

          const isbn13 = stripWrap(row.ISBN13);
          const isbn10 = stripWrap(row.ISBN);
          const isbn = (isbn13 || isbn10).replace(/[^0-9Xx]/g, "");

          const ratingNum = Number(stripWrap(row["My Rating"]));
          const rating = Number.isFinite(ratingNum) && ratingNum > 0 ? ratingNum : null;

          books.push({
            title,
            author,
            isbn: isbn.length === 10 || isbn.length === 13 ? isbn : null,
            publisher: stripWrap(row.Publisher) || null,
            description: row["My Review"]?.trim() || null,
            shelf: (row["Exclusive Shelf"] ?? "").trim() || "read",
            rating,
          });
        }
        resolve(books);
      },
      error: (err: Error) => reject(err),
    });
  });
}
