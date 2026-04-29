import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
const user = users.find((u) => u.email === "nikolas.widad@gmail.com");

const { data: books } = await supabase
  .from("books")
  .select("title, cover_url, isbn, status, source")
  .eq("owner_id", user.id)
  .order("created_at", { ascending: false });

console.log(`\n${books.length} books in your shelf:\n`);
books.forEach((b, i) => {
  const cov = b.cover_url ? "🖼" : "—";
  console.log(`${String(i + 1).padStart(2)}. ${cov} ${b.title}${b.isbn ? ` (ISBN ${b.isbn})` : ""}`);
});
