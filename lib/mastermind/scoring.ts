import type { OkrKeyResult, Profile } from "@/types";

/**
 * Scoring primitives for the Mastermind dashboard. Pure functions so they
 * can be unit-tested and called from anywhere. Every score is explainable —
 * each returns its factors so the UI can show "why this score" in a tooltip.
 */

export interface ScoreBreakdown {
  score: number;     // 0–100
  factors: { label: string; weight: number; got: number }[];
}

// =============================================================================
// Profile Completion Score (max 100)
// =============================================================================

const PROFILE_FACTORS: { label: string; weight: number; check: (p: Profile) => boolean }[] = [
  { label: "Username", weight: 20, check: (p) => Boolean(p.username) },
  { label: "Foto profil", weight: 10, check: (p) => Boolean(p.photo_url) },
  { label: "Bio", weight: 10, check: (p) => Boolean(p.bio && p.bio.length >= 10) },
  { label: "Lokasi (kota)", weight: 10, check: (p) => Boolean(p.city) },
  { label: "Kontak (IG/WA/Discord)", weight: 20, check: (p) =>
      Boolean(p.instagram || p.whatsapp || p.discord) },
  { label: "Reading link (Goodreads/StoryGraph)", weight: 5, check: (p) =>
      Boolean(p.goodreads_url || p.storygraph_url) },
  { label: "Profession / kampus", weight: 5, check: (p) =>
      Boolean(p.profession || p.campus_or_workplace) },
  { label: "Interest Layer 1", weight: 10, check: (p) =>
      Boolean(p.interests && p.interests.length > 0) },
  { label: "Intent Layer 3", weight: 10, check: (p) =>
      Boolean(p.intents && p.intents.length > 0) },
];

export function profileCompletionScore(p: Profile): ScoreBreakdown {
  const factors = PROFILE_FACTORS.map((f) => ({
    label: f.label,
    weight: f.weight,
    got: f.check(p) ? f.weight : 0,
  }));
  const score = factors.reduce((sum, f) => sum + f.got, 0);
  return { score, factors };
}

// =============================================================================
// Member Potential Score (0–100) — who could become a core contributor?
// =============================================================================

export interface MemberSignals {
  profile: Profile;
  bookCount: number;
  activityLast30d: number; // events emitted by user in last 30 days
}

export function memberPotentialScore(s: MemberSignals): ScoreBreakdown {
  const profileSubScore = profileCompletionScore(s.profile).score; // 0–100
  const bookContribution = Math.min(20, s.bookCount * 2); // cap at 20 (= 10 books)
  const activitySignal = Math.min(20, s.activityLast30d * 2); // cap at 20 (= 10 events/mo)
  const richnessOfInterests =
    Math.min(10, ((s.profile.interests?.length ?? 0) +
                  (s.profile.sub_interests?.length ?? 0) +
                  (s.profile.intents?.length ?? 0)) * 2);
  const trustSignal =
    (s.profile.linkedin_url ? 5 : 0) +
    (s.profile.profession ? 3 : 0) +
    (s.profile.bio && s.profile.bio.length >= 30 ? 2 : 0);

  // Weight profile completeness at 30%, the rest at 50% combined
  const weighted =
    profileSubScore * 0.3 +
    bookContribution +
    activitySignal +
    richnessOfInterests +
    trustSignal;

  const factors = [
    { label: "Profile completeness", weight: 30, got: Math.round(profileSubScore * 0.3) },
    { label: "Book contribution", weight: 20, got: bookContribution },
    { label: "Recent activity (30d)", weight: 20, got: activitySignal },
    { label: "Interest richness", weight: 10, got: richnessOfInterests },
    { label: "Trust signals", weight: 10, got: trustSignal },
  ];

  return { score: Math.min(100, Math.round(weighted)), factors };
}

// =============================================================================
// Trust Score — internal admin signal, not user-facing
// =============================================================================

export function trustScore(s: MemberSignals & { auditFlagsLast90d?: number }): ScoreBreakdown {
  const profileSubScore = profileCompletionScore(s.profile).score;
  const hasContact = Boolean(
    s.profile.instagram || s.profile.whatsapp || s.profile.discord,
  );
  const hasBooks = s.bookCount > 0;
  const auditPenalty = Math.min(20, (s.auditFlagsLast90d ?? 0) * 5);
  const adminVerified = s.profile.is_admin ? 10 : 0;

  const raw =
    profileSubScore * 0.5 +
    (hasContact ? 15 : 0) +
    (hasBooks ? 15 : 0) +
    adminVerified -
    auditPenalty;

  const factors = [
    { label: "Profile completeness", weight: 50, got: Math.round(profileSubScore * 0.5) },
    { label: "Contact method present", weight: 15, got: hasContact ? 15 : 0 },
    { label: "Has at least 1 book", weight: 15, got: hasBooks ? 15 : 0 },
    { label: "Admin-verified", weight: 10, got: adminVerified },
    { label: "Audit flags (90d) penalty", weight: -20, got: -auditPenalty },
  ];

  return { score: Math.max(0, Math.min(100, Math.round(raw))), factors };
}

// =============================================================================
// OKR Health Score — derived from progress, time remaining, and movement
// =============================================================================

export interface KrHealthInputs {
  kr: OkrKeyResult;
  daysLeftInQuarter: number;
  totalDaysInQuarter: number; // typically ~91 for a quarter
}

export function okrHealthScore(input: KrHealthInputs): ScoreBreakdown {
  const { kr, daysLeftInQuarter, totalDaysInQuarter } = input;
  const target = Number(kr.target_value) || 0;
  const current = Number(kr.current_value) || 0;
  const progressPct = target === 0 ? 0 : Math.min(100, (current / target) * 100);

  const daysElapsed = Math.max(0, totalDaysInQuarter - daysLeftInQuarter);
  const expectedPctByNow = totalDaysInQuarter === 0 ? 0 : (daysElapsed / totalDaysInQuarter) * 100;
  const ahead = progressPct - expectedPctByNow; // positive = ahead, negative = behind

  // Health: 100 if at-or-ahead pace, scales down as the gap grows
  let healthScore: number;
  if (ahead >= 0) healthScore = 100;
  else if (ahead >= -15) healthScore = 75; // mild slip
  else if (ahead >= -30) healthScore = 50; // at-risk
  else healthScore = 25; // behind

  if (kr.status === "done" || progressPct >= 100) healthScore = 100;

  const factors = [
    { label: "Target", weight: target, got: target },
    { label: "Current", weight: 0, got: current },
    { label: "Progress %", weight: 100, got: Math.round(progressPct) },
    { label: "Expected by now %", weight: 100, got: Math.round(expectedPctByNow) },
    { label: "Days left in quarter", weight: 0, got: Math.round(daysLeftInQuarter) },
  ];

  return { score: healthScore, factors };
}

/** Picks an OkrStatus enum value from a numeric health score. */
export function inferOkrStatus(healthScore: number, progressPct: number): "on_track" | "at_risk" | "behind" | "done" {
  if (progressPct >= 100) return "done";
  if (healthScore >= 90) return "on_track";
  if (healthScore >= 60) return "at_risk";
  return "behind";
}
