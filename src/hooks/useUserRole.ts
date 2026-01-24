import { useMemo } from 'react';
import { Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'member' | null;

/**
 * Decode JWT and extract user role from app_metadata.
 * The role is injected by the custom_access_token_hook in Supabase.
 */
const getRoleFromJWT = (accessToken: string): UserRole => {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    return (payload.app_metadata?.user_role as UserRole) ?? null;
  } catch {
    return null;
  }
};

/**
 * Hook to get user role from the session JWT.
 * No database fallback - role must be in the JWT (set by custom_access_token_hook).
 * If role is missing, user should re-authenticate to get a fresh token.
 */
export const useUserRole = (session: Session | null) => {
  const role = useMemo(() => {
    if (!session?.access_token) return null;
    return getRoleFromJWT(session.access_token) ?? 'member';
  }, [session?.access_token]);

  return {
    role,
    loading: false,
    isAdmin: role === 'admin',
    isMember: role === 'member',
  };
};
