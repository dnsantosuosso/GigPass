-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  venue TEXT NOT NULL,
  address TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT,
  genre TEXT,
  image_url TEXT,
  capacity INTEGER NOT NULL DEFAULT 100,
  claimed_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  ticket_pdf_url TEXT NOT NULL,
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ticket_claims table (for tracking member claims)
CREATE TABLE public.ticket_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_claims ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Events policies
CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Admins can create events"
  ON public.events FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Tickets policies
CREATE POLICY "Members can view available tickets"
  ON public.tickets FOR SELECT
  USING (public.has_role(auth.uid(), 'member') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage tickets"
  ON public.tickets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can claim tickets"
  ON public.tickets FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'member') 
    AND is_claimed = false
  )
  WITH CHECK (
    claimed_by = auth.uid()
  );

-- Ticket claims policies
CREATE POLICY "Users can view own claims"
  ON public.ticket_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Members can create claims"
  ON public.ticket_claims FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND public.has_role(auth.uid(), 'member')
  );

CREATE POLICY "Admins can view all claims"
  ON public.ticket_claims FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign member role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for ticket PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('tickets', 'tickets', false);

-- Storage policies for tickets bucket
CREATE POLICY "Admins can upload ticket PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tickets'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can view all ticket PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tickets'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Members can view claimed tickets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tickets'
    AND public.has_role(auth.uid(), 'member')
  );

CREATE POLICY "Admins can delete ticket PDFs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tickets'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
