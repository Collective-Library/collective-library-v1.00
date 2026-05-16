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
  owner: Pick<
    Profile,
    | "id"
    | "full_name"
    | "username"
    | "photo_url"
    | "city"
    | "whatsapp"
    | "whatsapp_public"
    | "instagram"
    | "discord"
    | "goodreads_url"
    | "storygraph_url"
  >;
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
    | "id"
    | "full_name"
    | "username"
    | "photo_url"
    | "city"
    | "whatsapp"
    | "whatsapp_public"
    | "instagram"
    | "discord"
    | "goodreads_url"
    | "storygraph_url"
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
  return Boolean(p.instagram || p.whatsapp || p.discord || p.goodreads_url || p.storygraph_url);
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

// =============================================================================
// Events (mirrors supabase/migrations/0020_events.sql)
// =============================================================================

export type EventStatus = "scheduled" | "cancelled" | "completed";
export type EventVisibility = "public" | "community";
export type EventRsvpStatus = "going" | "maybe" | "declined";

export interface Event {
  id: string;
  host_id: string;
  community_id: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  location_text: string | null;
  location_url: string | null;
  is_online: boolean;
  capacity: number | null;
  cover_url: string | null;
  contact_method: ContactMethod;
  visibility: EventVisibility;
  status: EventStatus;
  is_hidden: boolean;
  discord_announced_at: string | null;
  // Social activation fields (added in migration 0022)
  theme: string | null;
  what_to_expect: string[] | null;
  hashtags: string[] | null;
  reminder_text: string | null;
  registration_url: string | null;
  registration_label: string | null;
  registration_deadline: string | null;
  instagram_url: string | null;
  community_name: string | null;
  community_instagram_url: string | null;
  community_logo_url: string | null;
  created_at: string;
  updated_at: string;
}

/** An Event joined with host profile + community + viewer-specific RSVP state. */
export interface EventWithHost extends Event {
  host: Pick<
    Profile,
    | "id"
    | "full_name"
    | "username"
    | "photo_url"
    | "city"
    | "whatsapp"
    | "whatsapp_public"
    | "instagram"
    | "discord"
  >;
  community: Pick<Community, "id" | "name" | "slug"> | null;
  rsvp_count: number;
  viewer_rsvp: EventRsvpStatus | null;
}

export interface EventRsvp {
  event_id: string;
  profile_id: string;
  status: EventRsvpStatus;
  note: string | null;
  // RSVP context (added in migration 0022) — optional, for social signal
  origin_city: string | null;
  bringing_book: string | null;
  conversation_topic: string | null;
  created_at: string;
}

/** Attendee profile signals for rich attendee cards. */
export interface AttendeeProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  photo_url: string | null;
  city: string | null;
  interests: string[] | null;
  instagram: string | null;
  discord: string | null;
  book_count: number;
}

export interface EventRsvpWithProfile extends EventRsvp {
  profile: AttendeeProfile;
}

/** Form value types — what the Event form posts. */
export interface EventFormValues {
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string;
  timezone?: string;
  location_text?: string;
  location_url?: string;
  is_online?: boolean;
  capacity?: number;
  cover_url?: string;
  contact_method?: ContactMethod;
  visibility?: EventVisibility;
  // Social activation
  theme?: string;
  what_to_expect?: string[];
  hashtags?: string[];
  reminder_text?: string;
  registration_url?: string;
  registration_label?: string;
  registration_deadline?: string;
  instagram_url?: string;
  community_name?: string;
  community_instagram_url?: string;
  community_logo_url?: string;
}

/** RSVP context — optional fields collected after RSVP confirmation. */
export interface RsvpContextValues {
  origin_city?: string;
  bringing_book?: string;
  conversation_topic?: string;
  note?: string;
}

// =============================================================================
// Manifests (mirrors supabase/migrations/0023_manifests.sql)
// =============================================================================

export type ManifestStatus = "pending" | "approved" | "rejected";
export type ManifestVisibility = "public" | "community";
export type ManifestMood =
  | "curious"
  | "hopeful"
  | "frustrated"
  | "grateful"
  | "reflective"
  | "playful";

export interface Manifest {
  id: string;
  author_id: string;
  body: string;
  mood: ManifestMood | null;
  topic: string | null;
  is_anonymous: boolean;
  linked_event_id: string | null;
  linked_book_id: string | null;
  linked_profile_id: string | null;
  visibility: ManifestVisibility;
  status: ManifestStatus;
  moderation_note: string | null;
  approved_at: string | null;
  approved_by: string | null;
  is_hidden: boolean;
  discord_announced_at: string | null;
  x_posted_url: string | null;
  x_posted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** A Manifest with author + optional linked object summaries. */
export interface ManifestWithAuthor extends Manifest {
  author: Pick<Profile, "id" | "full_name" | "username" | "photo_url" | "city">;
  linked_event: Pick<Event, "id" | "title" | "starts_at" | "cover_url"> | null;
  linked_book: Pick<Book, "id" | "title" | "author" | "cover_url"> | null;
}

export interface ManifestFormValues {
  body: string;
  mood?: ManifestMood;
  topic?: string;
  is_anonymous?: boolean;
  visibility?: ManifestVisibility;
  linked_event_id?: string;
  linked_book_id?: string;
}
