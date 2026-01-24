import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppDispatch } from './index';
import { setAuth, clearAuth } from './authSlice';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch(
        setAuth({
          user: session?.user ?? null,
          session: session,
        })
      );
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        dispatch(
          setAuth({
            user: session.user,
            session: session,
          })
        );
      } else {
        dispatch(clearAuth());
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
}
