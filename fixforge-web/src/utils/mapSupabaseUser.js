// src/utils/mapSupabaseUser.js

/**
 * Maps Supabase Auth user to match your users table schema
 */
export const mapSupabaseUser = (supabaseUser) => {
  if (!supabaseUser) return null;

  const meta = supabaseUser.user_metadata || {};

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    username: meta.username || "",
    display_name: meta.display_name || meta.full_name || "Unnamed User",
    avatar: meta.avatar || "", // changed from avatar_url to match your schema
    bio: meta.bio || "",
    location: meta.location || "",
    role: meta.role || "developer",
    email_verified: !!supabaseUser.email_confirmed_at,
    created_at: supabaseUser.created_at,
  };
};
