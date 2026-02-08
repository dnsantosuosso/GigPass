import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface SavingsData {
  totalSavings: number;
  eventsAttended: number;
  loading: boolean;
  error: string | null;
  hasMissingPriceData: boolean;
  refetch: () => Promise<void>;
}

export const useTotalSavings = (user: User | null): SavingsData => {
  const [totalSavings, setTotalSavings] = useState(0);
  const [eventsAttended, setEventsAttended] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMissingPriceData, setHasMissingPriceData] = useState(false);

  const fetchSavings = useCallback(async () => {
    if (!user) {
      setTotalSavings(0);
      setEventsAttended(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all ticket claims with their savings data
      const { data, error: fetchError } = await supabase
        .from('ticket_claims')
        .select('full_ticket_price, member_price_paid')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      let savings = 0;
      let attended = 0;
      let missingData = false;

      (data || []).forEach((claim: any) => {
        const fullPrice = Number(claim.full_ticket_price) || 0;
        const memberPaid = Number(claim.member_price_paid) || 0;

        // Only count if we have valid price data
        if (fullPrice > 0) {
          // Savings = max(0, full_price - member_price_paid)
          const eventSavings = Math.max(0, fullPrice - memberPaid);
          savings += eventSavings;
          attended++;
        } else {
          // Track that some events don't have price data
          missingData = true;
        }
      });

      setTotalSavings(savings);
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
