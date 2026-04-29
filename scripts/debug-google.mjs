// Debug: see what Google Books returns from Node.
const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent("Atomic Habits James Clear")}&maxResults=1&printType=books`;
console.log("Fetching:", url);
const r = await fetch(url);
console.log("Status:", r.status, r.statusText);
const text = await r.text();
console.log("Body (first 800):", text.slice(0, 800));
