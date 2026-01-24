-- Migration: Add providers column to profiles table
-- This stores the auth providers array (email, google, etc.) for easier querying

-- Add providers column as TEXT array
ALTER TABLE public.profiles
ADD COLUMN providers TEXT[] DEFAULT ARRAY['email'];

-- Backfill existing profiles with providers from auth.users
UPDATE public.profiles p
SET providers = COALESCE(
  (
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(u.raw_app_meta_data->'providers')
    )
    FROM auth.users u
    WHERE u.id = p.id
  ),
  ARRAY['email']
);

-- Update the handle_new_user trigger function to store providers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, providers)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_app_meta_data->'providers')),
      ARRAY['email']
    )
  );

  -- Assign member role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');

  RETURN NEW;
END;
$$;

-- Create a trigger to update providers when auth.users is updated
-- This handles cases where a user links a new provider
CREATE OR REPLACE FUNCTION public.sync_user_providers()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET providers = COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(NEW.raw_app_meta_data->'providers')),
    ARRAY['email']
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Create the update trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF raw_app_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_providers();
