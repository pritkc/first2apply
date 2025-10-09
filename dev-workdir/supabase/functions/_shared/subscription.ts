import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { DbSchema, Profile } from "./types.ts";

/**
 * Retrieve the user profile and check if his subscription allows advanced matching.
 */
export async function checkUserSubscription({
  supabaseClient,
  userId,
}: {
  supabaseClient: SupabaseClient<DbSchema, "public">;
  userId: string;
}): Promise<{
  profile: Profile;
  subscriptionHasExpired: boolean;
  hasAdvancedMatching: boolean;
}> {
  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  if (!profile) {
    throw new Error("Profile not found");
  }

  // For local development, bypass subscription checks
  // const subscriptionHasExpired =
  //   new Date(profile.subscription_end_date) < new Date();
  // const hasRequiredTier = profile.subscription_tier === "pro";

  return {
    profile,
    subscriptionHasExpired: false, // Always treat subscription as active for local development
    hasAdvancedMatching: true, // Always allow advanced matching for local development
  };
}
