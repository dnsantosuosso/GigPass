import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export const useUserProfile = (user: User | null) => {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: null,
    lastName: null,
    email: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile({ firstName: null, lastName: null, email: null });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        const profileData = data as unknown as {
          first_name: string | null;
          last_name: string | null;
          email: string | null;
        };

        setProfile({
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          email: profileData.email || user.email || null,
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setProfile({
          firstName: null,
          lastName: null,
          email: user.email || null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Display name: use firstName if available, otherwise fall back to email
  const displayName = profile.firstName || profile.email;

  return { profile, loading, displayName };
};
