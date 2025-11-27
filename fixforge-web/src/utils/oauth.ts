import { supabase } from "../lib/supabaseClient";

export const loginWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/submit`,
    }
  });
};

export const loginWithGitHub = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/submit`,
    }
  });
};