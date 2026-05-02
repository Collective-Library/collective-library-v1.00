// =============================================================================
// Collective Library — shared types (mirrors supabase/migrations/0001_init.sql)
// =============================================================================

export type BookStatus = "sell" | "lend" | "trade" | "unavailable";
export type BookVisibility = "public" | "community" | "trusted";
export type BookCondition = "new" | "like_new" | "good" | "used" | "heavily_used";
export type ContactMethod = "whatsapp" | "instagram" | "discord";
export type BookSource = "manual" | "goodreads_import";
export type WantedStatus = "open" | "fulfilled" | "closed";
export type CommunityRole = "member" | "moderator" | "admin";
export type ReportTargetType = "book" | "user" | "wanted";
export type FeedbackCategory = "idea" | "bug" | "friction" | "appreciation" | "other";
export type FeedbackStatus = "new" | "triaged" | "planned" | "shipped" | "wontfix";

export interface FeedbackItem {
  id: string;
  user_id: string | null;
  category: FeedbackCategory;
  message: string;
  email: string | null;
  attachments: string | null;
  page_url: string | null;
  user_agent: string | null;
  status: FeedbackStatus;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  photo_url: string | null;
  cover_url: string | null;
  city: string | null;
  address_area: string | null;
  postal_code: string | null;
  bio: string | null;
  instagram: string | null;
  whatsapp: string | null;
  whatsapp_public: boolean;
  discord: string | null;
  goodreads_url: string | null;
  storygraph_url: string | null;
  campus_or_workplace: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  profession: string | null;
  interests: string[] | null;
  sub_interests: string[] | null;
  intents: string[] | null;
  favorite_genres: string[] | null;
  open_for_discussion: boolean;
  open_for_lending: boolean;
  open_for_selling: boolean;
  open_for_trade: boolean;
  is_admin: boolean;
  currently_reading_book_id: string | null;
  show_on_map: boolean;
  map_lat: number | null;
  map_lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  cover_url: string | null;
  created_at: string;
}

export interface CommunityMember {
  user_id: string;
  community_id: string;
  role: CommunityRole;
  joined_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  cover_url: string | null;
  genre: string | null;
  language: string;
  publisher: string | null;
  description: string | null;
  owner_id: string;
  community_id: string | null;
  status: BookStatus;
  visibility: BookVisibility;
  condition: BookCondition;
  price: number | null;
  negotiable: boolean;
  lending_duration_days: number | null;
  deposit_required: boolean;
  deposit_amount: number | null;
  pickup_area: string | null;
  contact_method: ContactMethod;
  notes: string | null;
  source: BookSource;
  is_featured: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

/** A Book joined with its owner profile (for shelf cards & detail). */
export interface BookWithOwner extends Book {
  owner: Pick<Profile, "id" | "full_name" | "username" | "photo_url" | "city" | "whatsapp" | "whatsapp_public" | "instagram" | "discord" | "goodreads_url" | "storygraph_url">;
  community: Pick<Community, "id" | "name" | "slug"> | null;
}

export interface WantedRequest {
  id: string;
  requester_id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  max_budget: number | null;
  desired_condition: string | null;
  city: string | null;
  notes: string | null;
  status: WantedStatus;
  created_at: string;
}

/** A WantedRequest joined with its requester profile (contact pills). */
export interface WantedRequestWithRequester extends WantedRequest {
  requester: Pick<
    Profile,
    "id" | "full_name" | "username" | "photo_url" | "city" | "whatsapp" | "whatsapp_public" | "instagram" | "discord" | "goodreads_url" | "storygraph_url"
  >;
}

export interface SavedBook {
  user_id: string;
  book_id: string;
  created_at: string;
}

/** Form value types — what the Add Book form posts. */
export interface BookFormValues {
  title: string;
  author: string;
  status: BookStatus;
  isbn?: string;
  cover_url?: string;
  genre?: string;
  language?: string;
  publisher?: string;
  description?: string;
  condition?: BookCondition;
  price?: number;
  negotiable?: boolean;
  lending_duration_days?: number;
  pickup_area?: string;
  contact_method?: ContactMethod;
  notes?: string;
}

/** Profile completion check — at least one contact method + username. */
export function isProfileComplete(p: Profile | null): p is Profile {
  if (!p) return false;
  if (!p.username) return false;
  return Boolean(
    p.instagram || p.whatsapp || p.discord || p.goodreads_url || p.storygraph_url,
  );
}

// =============================================================================
// Mastermind dashboard types (mirrors migrations 0015–0017)
// =============================================================================

export type OkrCategory =
  | "people"
  | "data"
  | "system"
  | "integration"
  | "foundation"
  | "activation";
export type OkrStatus = "on_track" | "at_risk" | "behind" | "done";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done" | "canceled";
export type TaskPriority = "low" | "med" | "high" | "urgent";
export type AdminNoteEntity =
  | "user"
  | "book"
  | "wanted"
  | "feedback"
  | "okr_objective"
  | "okr_key_result"
  | "team_task";

export interface OkrObjective {
  id: string;
  code: string;
  title: string;
  detail: string | null;
  category: OkrCategory;
  quarter: string;
  status: OkrStatus;
  progress_pct: number;
  owner_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OkrKeyResult {
  id: string;
  objective_id: string;
  code: string;
  title: string;
  detail: string | null;
  target_value: number;
  target_unit: string;
  current_value: number;
  auto_compute_key: string | null;
  status: OkrStatus;
  owner_id: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OkrObjectiveWithKRs extends OkrObjective {
  key_results: OkrKeyResult[];
}

export interface TeamTask {
  id: string;
  code: string | null;
  title: string;
  detail: string | null;
  related_objective_id: string | null;
  related_kr_id: string | null;
  owner_id: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  progress_pct: number;
  start_date: string | null;
  end_date: string | null;
  milestone: string | null;
  deliverable: string | null;
  output_link: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminNote {
  id: string;
  entity_type: AdminNoteEntity;
  entity_id: string;
  note: string;
  created_by: string;
  created_at: string;
}

export interface AdminNoteWithAuthor extends AdminNote {
  author: Pick<Profile, "id" | "full_name" | "username" | "photo_url"> | null;
}
