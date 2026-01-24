-- Add user role to JWT custom claims
-- This function is automatically called by Supabase when generating JWT tokens

-- Create the custom JWT claims hook function
-- This function is called by Supabase Auth when generating access tokens
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims JSONB;
  user_role TEXT;
BEGIN
  -- Get the user's role from user_roles table (using app_role enum)
  SELECT ur.role::text INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = (event->>'user_id')::UUID
  LIMIT 1;

  -- If no role found, default to 'member'
  IF user_role IS NULL THEN
    user_role := 'member';
  END IF;

  -- Get existing claims
  claims := event->'claims';

  -- Add custom claims under app_metadata
  IF claims->'app_metadata' IS NULL THEN
    claims := jsonb_set(claims, '{app_metadata}', '{}');
  END IF;

  -- Set the user role in app_metadata
  claims := jsonb_set(claims, '{app_metadata, user_role}', to_jsonb(user_role));

  -- Update the event with new claims
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- Grant execute permission to supabase_auth_admin (required for auth hooks)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) TO supabase_auth_admin;

-- Revoke execute from public for security
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) FROM authenticated;

-- Note: To enable this hook, you need to run this in the Supabase Dashboard SQL Editor
-- or contact Supabase support for cloud projects:
--
-- For local development, add this to your config.toml:
-- [auth.hook.custom_access_token]
-- enabled = true
-- uri = "pg-functions://postgres/public/custom_access_token_hook"
