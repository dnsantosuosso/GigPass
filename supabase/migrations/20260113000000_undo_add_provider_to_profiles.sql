-- Migration: Undo add provider column to profiles table
-- This reverts the changes from the provider migration

-- Drop the update trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Drop the sync function
DROP FUNCTION IF EXISTS public.sync_user_provider();

-- Restore the handle_new_user trigger function without provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'last_name', '')
  );

  -- Assign member role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');

  RETURN NEW;
END;
$$;

-- Drop the provider column from profiles
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS provider;
