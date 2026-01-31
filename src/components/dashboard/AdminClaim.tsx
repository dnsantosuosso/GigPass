import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Ticket, User, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface AdminClaimProps {
  ticketId: string;
  onUnclaimed?: (ticketId: string) => void;
}

interface ClaimData {
  id: string;
  claimed_at: string | null;
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  event: {
    id: string;
    title: string;
    venue: string;
    event_date: string;
    address: string | null;
  } | null;
  ticket: {
    id: string;
    ticket_pdf_url: string;
    is_claimed: boolean;
    claimed_by: string | null;
    claimed_at: string | null;
    created_at: string;
  } | null;
  ticket_type: {
    id: string;
    name: string;
  } | null;
}

const getTicketPath = (value: string) => {
  if (value.startsWith('http')) {
    const marker = '/tickets/';
    if (value.includes(marker)) {
      return decodeURIComponent(value.split(marker)[1].split('?')[0]);
    }
  }
  return value;
};

export default function AdminClaim({ ticketId, onUnclaimed }: AdminClaimProps) {
  const [claim, setClaim] = useState<ClaimData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const [unclaiming, setUnclaiming] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        setLoading(true);
        const { data: claimData, error: claimError } = await supabase
          .from('ticket_claims')
          .select('id, claimed_at, user_id, event_id, ticket_id, ticket_type_id')
          .eq('ticket_id', ticketId)
          .maybeSingle();

        if (claimError) throw claimError;
        if (!claimData) {
          setClaim(null);
          return;
        }

        const [
          { data: userData },
          { data: eventData },
          { data: ticketData },
          { data: ticketTypeData },
        ] =
          await Promise.all([
            supabase
              .from('profiles')
              .select('id, email, first_name, last_name')
              .eq('id', claimData.user_id)
              .maybeSingle(),
            supabase
              .from('events')
              .select('id, title, venue, event_date, address')
              .eq('id', claimData.event_id)
              .maybeSingle(),
            supabase
              .from('tickets')
              .select(
                'id, ticket_pdf_url, is_claimed, claimed_by, claimed_at, created_at'
              )
              .eq('id', claimData.ticket_id)
              .maybeSingle(),
            supabase
              .from('ticket_types')
              .select('id, name')
              .eq('id', claimData.ticket_type_id)
              .maybeSingle(),
          ]);

        setClaim({
          id: claimData.id,
          claimed_at: claimData.claimed_at,
          user: userData
            ? {
                id: userData.id,
                email: userData.email,
                first_name: userData.first_name,
                last_name: userData.last_name,
              }
            : null,
          event: eventData
            ? {
                id: eventData.id,
                title: eventData.title,
                venue: eventData.venue,
                event_date: eventData.event_date,
                address: eventData.address,
              }
            : null,
          ticket: ticketData
            ? {
                id: ticketData.id,
                ticket_pdf_url: ticketData.ticket_pdf_url,
                is_claimed: ticketData.is_claimed,
                claimed_by: ticketData.claimed_by,
                claimed_at: ticketData.claimed_at,
                created_at: ticketData.created_at,
              }
            : null,
          ticket_type: ticketTypeData
            ? { id: ticketTypeData.id, name: ticketTypeData.name }
            : null,
        });

        if (ticketData?.ticket_pdf_url) {
          const filePath = getTicketPath(ticketData.ticket_pdf_url);
          const { data: signed, error: signedError } = await supabase.storage
            .from('tickets')
            .createSignedUrl(filePath, 60 * 5);
          if (!signedError && signed?.signedUrl) {
            setOpenUrl(signed.signedUrl);
          }
        }
      } catch (error) {
        console.error('Error loading claim:', error);
        setClaim(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClaim();
  }, [ticketId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Loading claim...
        </CardContent>
      </Card>
    );
  }

  if (!claim) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          No claim found for this ticket.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Claim ID</p>
            <p className="text-sm font-medium">{claim.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {openUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(openUrl, '_blank', 'noopener,noreferrer')
                }
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View PDF
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              disabled={unclaiming}
              onClick={async () => {
                if (!claim.ticket?.id || !claim.event?.id) return;
                if (!confirm('Unclaim this ticket?')) return;
                try {
                  setUnclaiming(true);
                  const { error: deleteError } = await supabase
                    .from('ticket_claims')
                    .delete()
                    .eq('id', claim.id);
                  if (deleteError) throw deleteError;

                  const { error: ticketError } = await supabase
                    .from('tickets')
                    .update({
                      is_claimed: false,
                      claimed_by: null,
                      claimed_at: null,
                    })
                    .eq('id', claim.ticket.id);

                  if (ticketError) throw ticketError;

                  await supabase.rpc('decrement_event_claimed_count', {
                    event_id: claim.event.id,
                  });

                  toast({ title: 'Ticket unclaimed' });
                  onUnclaimed?.(claim.ticket.id);
                } catch (error) {
                  console.error('Error unclaiming ticket:', error);
                  toast({
                    variant: 'destructive',
                    title: 'Unclaim failed',
                    description: 'Could not unclaim this ticket.',
                  });
                } finally {
                  setUnclaiming(false);
                }
              }}
            >
              {unclaiming ? 'Unclaiming...' : 'Unclaim'}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              User
            </div>
            <p className="text-sm">
              {claim.user
                ? claim.user.first_name && claim.user.last_name
                  ? `${claim.user.first_name} ${claim.user.last_name}`
                  : claim.user.email
                : 'Unknown user'}
            </p>
            <p className="text-xs text-muted-foreground">
              {claim.user?.email || 'No email'}
            </p>
            <p className="text-xs text-muted-foreground">
              {claim.user?.id || 'No user id'}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Ticket className="h-4 w-4" />
              Ticket
            </div>
            <p className="text-sm">Ticket ID: {claim.ticket?.id}</p>
            <p className="text-xs text-muted-foreground break-all">
              {claim.ticket?.ticket_pdf_url}
            </p>
            <p className="text-xs text-muted-foreground">
              Ticket type: {claim.ticket_type?.name || 'Unknown'}
            </p>
            <p className="text-xs text-muted-foreground">
              Created{' '}
              {claim.ticket?.created_at
                ? format(new Date(claim.ticket.created_at), 'MMM d, yyyy h:mm a')
                : 'Unknown'}
            </p>
            <p className="text-xs text-muted-foreground">
              Claimed by: {claim.ticket?.claimed_by || 'Unknown'}
            </p>
            <Badge variant={claim.ticket?.is_claimed ? 'default' : 'secondary'}>
              {claim.ticket?.is_claimed ? 'Claimed' : 'Unclaimed'}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Claim
          </div>
          <p className="text-sm">
            Claimed at:{' '}
            {claim.claimed_at
              ? format(new Date(claim.claimed_at), 'MMM d, yyyy h:mm a')
              : 'Unknown'}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4" />
            Event
          </div>
          <p className="text-sm font-medium">{claim.event?.title}</p>
          <p className="text-xs text-muted-foreground">
            {claim.event?.venue}
          </p>
          <p className="text-xs text-muted-foreground">
            {claim.event?.address}
          </p>
          <p className="text-xs text-muted-foreground">
            {claim.event?.event_date
              ? format(new Date(claim.event.event_date), 'MMM d, yyyy h:mm a')
              : 'Unknown date'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
