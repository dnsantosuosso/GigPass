-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Create ticket_type_tiers junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.ticket_type_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE CASCADE,
    tier_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(ticket_type_id, tier_id)
);

-- Add claimed_count to ticket_types table
ALTER TABLE public.ticket_types 
ADD COLUMN IF NOT EXISTS claimed_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_ticket_type_tiers_ticket_type_id ON public.ticket_type_tiers(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_ticket_type_tiers_tier_id ON public.ticket_type_tiers(tier_id);

-- Enable RLS on new tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_type_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
    ON public.subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
    ON public.subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
    ON public.subscriptions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all subscriptions"
    ON public.subscriptions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- RLS Policies for ticket_type_tiers
CREATE POLICY "Everyone can view ticket type tiers"
    ON public.ticket_type_tiers
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage ticket type tiers"
    ON public.ticket_type_tiers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Update ticket_claims to reference ticket_type instead of individual tickets
ALTER TABLE public.ticket_claims
ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES public.ticket_types(id) ON DELETE CASCADE;

-- Create index for ticket_type_id in ticket_claims
CREATE INDEX IF NOT EXISTS idx_ticket_claims_ticket_type_id ON public.ticket_claims(ticket_type_id);

-- Function to check if user has valid subscription
CREATE OR REPLACE FUNCTION public.has_valid_subscription(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.subscriptions
        WHERE user_id = user_id_param
        AND status = 'active'
        AND (current_period_end IS NULL OR current_period_end > now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user's subscription tier allows access to ticket type
CREATE OR REPLACE FUNCTION public.can_access_ticket_type(user_id_param UUID, ticket_type_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier_id TEXT;
BEGIN
    -- Get user's tier
    SELECT tier_id INTO user_tier_id
    FROM public.subscriptions
    WHERE user_id = user_id_param
    AND status = 'active'
    AND (current_period_end IS NULL OR current_period_end > now());
    
    IF user_tier_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user's tier has access to this ticket type
    RETURN EXISTS (
        SELECT 1
        FROM public.ticket_type_tiers
        WHERE ticket_type_id = ticket_type_id_param
        AND tier_id = user_tier_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.has_valid_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_ticket_type TO authenticated;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
