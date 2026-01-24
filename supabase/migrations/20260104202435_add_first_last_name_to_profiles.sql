-- Migration: Replace full_name with first_name and last_name in profiles table

-- Add new columns
ALTER TABLE public.profiles
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Migrate existing data: split full_name into first_name and last_name
UPDATE public.profiles
SET
  first_name = CASE
    WHEN full_name IS NOT NULL AND full_name != ''
    THEN split_part(full_name, ' ', 1)
    ELSE NULL
  END,
  last_name = CASE
    WHEN full_name IS NOT NULL AND full_name != '' AND position(' ' in full_name) > 0
    THEN substring(full_name from position(' ' in full_name) + 1)
    ELSE NULL
  END;

-- Drop the old full_name column
ALTER TABLE public.profiles
DROP COLUMN full_name;

-- Update the handle_new_user trigger function to use first_name and last_name
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
