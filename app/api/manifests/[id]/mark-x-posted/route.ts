import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRawManifest, markManifestXPosted } from "@/lib/manifests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  x_posted_url: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const url = (body.x_posted_url ?? "").trim();
  if (!/^https?:\/\/(x\.com|twitter\.com)\//.test(url)) {
    return NextResponse.json(
      { error: "URL harus dari x.com atau twitter.com." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Allow either: the manifest author, or any admin
  const manifest = await getRawManifest(id);
  if (!manifest) return NextResponse.json({ error: "Manifest not found" }, { status: 404 });

  if (manifest.author_id !== user.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Cuma author atau admin." }, { status: 403 });
    }
  }

  const result = await markManifestXPosted(id, url);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, x_posted_url: url });
}
