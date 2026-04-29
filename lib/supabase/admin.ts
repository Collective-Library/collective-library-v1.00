import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS — server-only. Never import into client code.
 * Use for admin tasks, scheduled jobs, and trusted server actions.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
