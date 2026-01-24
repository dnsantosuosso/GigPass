import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'member' | null;

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  initialized: boolean;
}

/**
 * Extract user role from JWT app_metadata
 */
const extractRoleFromUser = (user: User | null): UserRole => {
  if (!user) return null;
  const appMetadata = user.app_metadata;
  if (appMetadata?.user_role) {
    return appMetadata.user_role as UserRole;
  }
  return null;
};

const initialState: AuthState = {
  user: null,
  session: null,
  role: null,
  loading: true,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{ user: User | null; session: Session | null }>
    ) => {
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.role = extractRoleFromUser(action.payload.user);
      state.loading = false;
      state.initialized = true;
    },
    setRole: (state, action: PayloadAction<UserRole>) => {
      state.role = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.session = null;
      state.role = null;
      state.loading = false;
      state.initialized = true;
    },
  },
});

export const { setAuth, setRole, setLoading, clearAuth } = authSlice.actions;
export default authSlice.reducer;
