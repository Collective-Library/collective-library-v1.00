import { createAdminClient } from "@/lib/supabase/admin";

const SEVEN_DAYS_MS = 7 * 86400 * 1000;
const FOURTEEN_DAYS_MS = 14 * 86400 * 1000;

export interface PulseSignal {
  label: string;
  current: number;
  prior: number;
  delta: number;        // current - prior
  deltaPct: number;     // % change vs prior
  direction: "up" | "down" | "flat";
  tone: "positive" | "negative" | "neutral";
}

export interface FounderPulse {
  signals: PulseSignal[];
  // Compiled narrative bullets — what the dashboard surfaces above the cards
  whatChanged: string[];
  whatGrowing: string[];
  whatStuck: string[];
  needsAttention: string[];
}

export async function getFounderPulse(): Promise<FounderPulse> {
  const supabase = createAdminClient();
  const now = Date.now();
  const sevenAgo = new Date(now - SEVEN_DAYS_MS).toISOString();
  const fourteenAgo = new Date(now - FOURTEEN_DAYS_MS).toISOString();

  const [
    members7,
    members14,
    books7,
    books14,
    activity7,
    activity14,
    wantedOpen7,
    wantedOpen14,
    feedback7,
    feedback14,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true })
      .gte("created_at", sevenAgo),
    supabase.from("profiles").select("*", { count: "exact", head: true })
      .gte("created_at", fourteenAgo).lt("created_at", sevenAgo),
    supabase.from("books").select("*", { count: "exact", head: true })
      .gte("created_at", sevenAgo),
    supabase.from("books").select("*", { count: "exact", head: true })
      .gte("created_at", fourteenAgo).lt("created_at", sevenAgo),
    supabase.from("activity_log").select("*", { count: "exact", head: true })
      .gte("created_at", sevenAgo),
    supabase.from("activity_log").select("*", { count: "exact", head: true })
      .gte("created_at", fourteenAgo).lt("created_at", sevenAgo),
    supabase.from("wanted_requests").select("*", { count: "exact", head: true })
      .gte("created_at", sevenAgo),
    supabase.from("wanted_requests").select("*", { count: "exact", head: true })
      .gte("created_at", fourteenAgo).lt("created_at", sevenAgo),
    supabase.from("feedback").select("*", { count: "exact", head: true })
      .gte("created_at", sevenAgo),
    supabase.from("feedback").select("*", { count: "exact", head: true })
      .gte("created_at", fourteenAgo).lt("created_at", sevenAgo),
  ]);

  function makeSignal(
    label: string,
    current: number,
    prior: number,
    positiveOnRise = true,
  ): PulseSignal {
    const delta = current - prior;
    const deltaPct = prior === 0 ? (current > 0 ? 100 : 0) : Math.round((delta / prior) * 100);
    const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    let tone: PulseSignal["tone"] = "neutral";
    if (direction === "up") tone = positiveOnRise ? "positive" : "negative";
    if (direction === "down") tone = positiveOnRise ? "negative" : "positive";
    return { label, current, prior, delta, deltaPct, direction, tone };
  }

  const signals: PulseSignal[] = [
    makeSignal("Anggota baru (7d)", members7.count ?? 0, members14.count ?? 0),
    makeSignal("Buku baru (7d)", books7.count ?? 0, books14.count ?? 0),
    makeSignal("Activity events (7d)", activity7.count ?? 0, activity14.count ?? 0),
    makeSignal("WTB baru (7d)", wantedOpen7.count ?? 0, wantedOpen14.count ?? 0),
    makeSignal("Feedback masuk (7d)", feedback7.count ?? 0, feedback14.count ?? 0),
  ];

  const whatChanged: string[] = [];
  const whatGrowing: string[] = [];
  const whatStuck: string[] = [];
  const needsAttention: string[] = [];

  for (const s of signals) {
    if (s.delta === 0 && s.current === 0) {
      whatStuck.push(`${s.label}: 0 (tidak ada gerakan).`);
      continue;
    }
    if (s.tone === "positive" && s.deltaPct >= 50) {
      whatGrowing.push(`${s.label}: ${s.current} (naik ${s.deltaPct}% vs minggu lalu).`);
    } else if (s.tone === "negative" && Math.abs(s.deltaPct) >= 30) {
      needsAttention.push(`${s.label}: ${s.current} (turun ${Math.abs(s.deltaPct)}% vs minggu lalu).`);
    } else if (s.delta !== 0) {
      whatChanged.push(`${s.label}: ${s.current} (${s.delta >= 0 ? "+" : ""}${s.delta} vs minggu lalu).`);
    }
  }

  if (whatStuck.length === 0 && whatGrowing.length === 0 && needsAttention.length === 0 && whatChanged.length === 0) {
    whatChanged.push("Belum ada signal yang signifikan minggu ini.");
  }

  return { signals, whatChanged, whatGrowing, whatStuck, needsAttention };
}
