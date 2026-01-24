import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "member" | null;

/**
 * Helper function to extract user role from JWT claims
 * The role is stored in app_metadata.user_role by the custom_access_token_hook
 */
export const getRoleFromSession = (user: User | null): UserRole => {
  if (!user) return null;

  // Try to get role from app_metadata (set by JWT hook)
  const appMetadata = user.app_metadata;
  if (appMetadata?.user_role) {
    return appMetadata.user_role as UserRole;
  }

  return null;
};

export const useUserRole = (user: User | null) => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      // First, try to get role from JWT claims (app_metadata)
      const jwtRole = getRoleFromSession(user);
      if (jwtRole) {
        setRole(jwtRole);
        setLoading(false);
        return;
      }

      // Fallback: fetch from database if not in JWT (for existing sessions)
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        // Default to 'member' if no role exists
        setRole((data?.role as UserRole) || "member");
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("member"); // Default to member on error
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return { role, loading, isAdmin: role === "admin", isMember: role === "member" };
};
