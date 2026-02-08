import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import tiers from '@/config/tiers.json';

// Get monthly subscription price from tiers config
const MONTHLY_SUBSCRIPTION_PRICE = tiers.tiers[0]?.price || 25;

export interface SavingsData {
  totalSavings: number;
  totalTicketValue: number;
  subscriptionCost: number;
  eventsAttended: number;
  loading: boolean;
  error: string | null;
  hasMissingPriceData: boolean;
  refetch: () => Promise<void>;
}

export const useTotalSavings = (user: User | null): SavingsData => {
  const [totalSavings, setTotalSavings] = useState(0);
  const [totalTicketValue, setTotalTicketValue] = useState(0);
  const [subscriptionCost, setSubscriptionCost] = useState(0);
  const [eventsAttended, setEventsAttended] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMissingPriceData, setHasMissingPriceData] = useState(false);

  const fetchSavings = useCallback(async () => {
    if (!user) {
      setTotalSavings(0);
      setTotalTicketValue(0);
      setSubscriptionCost(0);
      setEventsAttended(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all ticket claims with their event's ticket types to calculate savings
      const { data: claims, error: claimsError } = await supabase
        .from('ticket_claims')
        .select('id, event_id')
        .eq('user_id', user.id);

      if (claimsError) throw claimsError;

      if (!claims || claims.length === 0) {
        setTotalSavings(0);
        setTotalTicketValue(0);
        setSubscriptionCost(MONTHLY_SUBSCRIPTION_PRICE);
        setEventsAttended(0);
        setLoading(false);
        return;
      }

      // Get unique event IDs
      const eventIds = [...new Set(claims.map(c => c.event_id))];

      // Fetch ticket types for these events to get prices
      const { data: ticketTypes, error: typesError } = await supabase
        .from('ticket_types')
        .select('event_id, price')
        .in('event_id', eventIds);

      if (typesError) throw typesError;

      // Build a map of event_id -> minimum ticket price
      const eventPriceMap: Record<string, number> = {};
      (ticketTypes || []).forEach((tt: any) => {
        const price = Number(tt.price) || 0;
        if (!eventPriceMap[tt.event_id] || price < eventPriceMap[tt.event_id]) {
          eventPriceMap[tt.event_id] = price;
        }
      });

      let ticketValue = 0;
      let attended = 0;
      let missingData = false;

      claims.forEach((claim) => {
        const fullPrice = eventPriceMap[claim.event_id];

        if (fullPrice && fullPrice > 0) {
          ticketValue += fullPrice;
          attended++;
        } else {
          missingData = true;
        }
      });

      // Calculate net savings: ticket value minus subscription cost
      const netSavings = Math.max(0, ticketValue - MONTHLY_SUBSCRIPTION_PRICE);

      setTotalTicketValue(ticketValue);
      setSubscriptionCost(MONTHLY_SUBSCRIPTION_PRICE);
      setTotalSavings(netSavings);
      setEventsAttended(attended);
      setHasMissingPriceData(missingData);
    } catch (err: any) {
      console.error('Error fetching savings:', err);
      setError(err.message || 'Failed to load savings data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavings();
  }, [fetchSavings]);

  return {
    totalSavings,
    totalTicketValue,
    subscriptionCost,
    eventsAttended,
    loading,
    error,
    hasMissingPriceData,
    refetch: fetchSavings,
  };
};

// Utility function to format currency
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
