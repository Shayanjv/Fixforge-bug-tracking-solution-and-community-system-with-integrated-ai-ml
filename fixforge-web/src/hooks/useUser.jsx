// src/hooks/useUser.js
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { mapSupabaseUser } from "../utils/mapSupabaseUser"; // imported utility

/**
 * Main hook to manage authenticated user state and dynamic profile info
 */
export const useUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchUser = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Get current Supabase auth user
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        // No user session case
        if (!authUser) {
          if (active) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // 2. Normalize base auth user data
        const baseUser = mapSupabaseUser(authUser);

        // 3. Fetch extended profile data from your "users" table
        const { data: profiles, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .limit(1);

        if (profileError) {
          console.warn("User profile fetch warning:", profileError.message);
        }

        const profile = profiles && profiles.length > 0 ? profiles[0] : {};

        // 4. Merge both (auth user + profile)
        const mergedUser = {
          ...baseUser,
          ...profile,
          display_name:
            profile.display_name || baseUser.display_name || "Unnamed User",
          avatar_url: profile.avatar_url || baseUser.avatar_url,
          bio: profile.bio || baseUser.bio,
          location: profile.location || baseUser.location,
          role: profile.role || baseUser.role,
        };

        if (active) setUser(mergedUser);
      } catch (err) {
        console.error("useUser() error:", err);
        if (active) {
          setError(err.message || "Unexpected error fetching user data");
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    // Initial fetch
    fetchUser();

    // 5. Listen for login/logout or token refresh events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser();
      } else if (active) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, error };
};
