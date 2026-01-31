import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  MapPin,
  Users,
  FileText,
  Loader2,
  ExternalLink,
  Trash2,
  Upload,
  Plus,
  Eye,
  UserPlus,
} from 'lucide-react';
import { format } from 'date-fns';
import * as pdfjsLib from 'pdfjs-dist';
import { Tables } from '@/integrations/supabase/types';
import TicketUploadFlow from './TicketUploadFlow';
import ClaimDetails from './ClaimDetails';
import ActionButton from '@/components/ui/action-button';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

type DbEvent = Tables<'events'>;

interface TicketPDF {
  id: string;
  event_id: string;
  ticket_type_id?: string | null;
  ticket_pdf_url: string;
  created_at: string;
  is_claimed: boolean;
  claimed_by: string | null;
  claimed_at: string | null;
  thumbnailUrl?: string;
}

interface EventAdminProps {
  event: DbEvent;
}

export default function EventAdmin({ event }: EventAdminProps) {
  const [tickets, setTickets] = useState<TicketPDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [generatingThumbnails, setGeneratingThumbnails] = useState<Set<string>>(
    new Set()
  );
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimEmail, setClaimEmail] = useState('');
  const [claimingTicket, setClaimingTicket] = useState<TicketPDF | null>(null);
  const [creatingClaim, setCreatingClaim] = useState(false);
  const [viewClaimTicketId, setViewClaimTicketId] = useState<string | null>(
    null
  );
  const [ticketTypes, setTicketTypes] = useState<
    { id: string; name: string }[]
  >([]);
  const { toast } = useToast();
  const pageSize = 12;
  const thumbnailCache = useRef<Map<string, string>>(new Map());

  const getTicketPath = (value: string) => {
    if (value.startsWith('http')) {
      const marker = '/tickets/';
      if (value.includes(marker)) {
        return decodeURIComponent(value.split(marker)[1].split('?')[0]);
      }
    }
    return value;
  };

  const getSignedTicketUrl = async (pathOrUrl: string) => {
    const filePath = getTicketPath(pathOrUrl);
    const { data, error } = await supabase.storage
      .from('tickets')
      .createSignedUrl(filePath, 60 * 5);
    if (error) throw error;
    return data.signedUrl;
  };

  useEffect(() => {
    fetchTickets(true);
  }, [event.id]);

  useEffect(() => {
    const fetchTypes = async () => {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('id, name')
        .eq('event_id', event.id)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching ticket types:', error);
        setTicketTypes([]);
        return;
      }

      setTicketTypes(data || []);
    };

    fetchTypes();
  }, [event.id]);

  const getTicketTypeName = (ticketTypeId?: string | null) =>
    ticketTypes.find((type) => type.id === ticketTypeId)?.name ||
    'Unknown type';

  const fetchTickets = async (reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const offset = reset ? 0 : tickets.length;

      const { data, error, count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact' })
        .eq('event_id', event.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      const newTickets = (data || []) as TicketPDF[];

      if (reset) {
        setTickets(newTickets);
        setTotalCount(count || 0);
      } else {
        setTickets((prev) => [...prev, ...newTickets]);
      }

      setHasMore(offset + newTickets.length < (count || 0));

      // Generate thumbnails for new tickets
      newTickets.forEach((ticket) => {
        if (!thumbnailCache.current.has(ticket.id)) {
          generateThumbnail(ticket);
        }
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load tickets',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const generateThumbnail = async (ticket: TicketPDF) => {
    if (
      generatingThumbnails.has(ticket.id) ||
      thumbnailCache.current.has(ticket.id)
    ) {
      return;
    }

    setGeneratingThumbnails((prev) => new Set(prev).add(ticket.id));

    try {
      const signedUrl = await getSignedTicketUrl(ticket.ticket_pdf_url);

      // Fetch PDF with credentials for Supabase storage
      const response = await fetch(signedUrl, {
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);

      const scale = 0.5;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise;

      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
      thumbnailCache.current.set(ticket.id, thumbnailUrl);

      // Update ticket with thumbnail
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, thumbnailUrl } : t))
      );
    } catch (error) {
      console.error('Error generating thumbnail for ticket:', ticket.id, error);
      // Mark as failed so we don't retry infinitely
      thumbnailCache.current.set(ticket.id, '');
    } finally {
      setGeneratingThumbnails((prev) => {
        const next = new Set(prev);
        next.delete(ticket.id);
        return next;
      });
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTickets(false);
    }
  };

  const openClaimDialog = (ticket: TicketPDF) => {
    setClaimingTicket(ticket);
    setClaimEmail('');
    setClaimDialogOpen(true);
  };

  const handleCreateClaim = async () => {
    if (!claimingTicket) return;
    const email = claimEmail.trim().toLowerCase();
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Missing email',
        description: 'Enter the member email to assign this ticket.',
      });
      return;
    }

    setCreatingClaim(true);
    try {
      if (!claimingTicket.ticket_type_id) {
        throw new Error('Ticket type is missing for this ticket.');
      }

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (userError) throw userError;
      if (!userData?.id) {
        throw new Error('No user found with that email.');
      }

      const { error: claimError } = await supabase
        .from('ticket_claims')
        .insert({
          user_id: userData.id,
          event_id: event.id,
          ticket_id: claimingTicket.id,
          ticket_type_id: claimingTicket.ticket_type_id,
        });

      if (claimError) throw claimError;

      const claimedAt = new Date().toISOString();
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({
          is_claimed: true,
          claimed_by: userData.id,
          claimed_at: claimedAt,
        })
        .eq('id', claimingTicket.id);

      if (ticketError) throw ticketError;

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === claimingTicket.id
            ? {
                ...ticket,
                is_claimed: true,
                claimed_by: userData.id,
                claimed_at: claimedAt,
              }
            : ticket
        )
      );

      await supabase.rpc('increment_event_claimed_count', {
        event_id: event.id,
      });

      toast({
        title: 'Claim created',
        description: `${getTicketTypeName(claimingTicket.ticket_type_id)} for ${
          event.title
        } assigned to ${userData.email}`,
      });
      setClaimDialogOpen(false);
      setClaimingTicket(null);
    } catch (error: any) {
      console.error('Error creating claim:', error);
      toast({
        variant: 'destructive',
        title: 'Claim failed',
        description: error.message || 'Failed to create claim',
      });
    } finally {
      setCreatingClaim(false);
    }
  };

  const handleUnclaimed = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              is_claimed: false,
              claimed_by: null,
              claimed_at: null,
            }
          : ticket
      )
    );
    setViewClaimTicketId(null);
  };

  const handleOpenPdf = async (pathOrUrl: string) => {
    try {
      const signedUrl = await getSignedTicketUrl(pathOrUrl);
      // Open in new tab with noopener for security
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to open ticket PDF',
      });
    }
  };

  const handleDeleteTicket = async (ticket: TicketPDF) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
      // Extract path from URL for storage deletion
      const filePath = getTicketPath(ticket.ticket_pdf_url);
      await supabase.storage.from('tickets').remove([filePath]);

      const { error: dbError } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticket.id);

      if (dbError) throw dbError;

      toast({ title: 'Ticket deleted successfully' });
      setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
      setTotalCount((prev) => prev - 1);
      thumbnailCache.current.delete(ticket.id);
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete ticket',
      });
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadSection(false);
    // Refresh the tickets list
    thumbnailCache.current.clear();
    fetchTickets(true);
  };

  const claimedCount = tickets.filter((t) => t.is_claimed).length;

  return (
    <div className="space-y-6">
      {/* Event Info Header */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            {event.image_url && (
              <div className="hidden sm:block h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{event.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Event ID: {event.id}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.event_date), 'MMMM d, yyyy • h:mm a')}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {event.venue}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {event.claimed_count}/{event.capacity} claimed
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-xs text-muted-foreground">Total Tickets</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {claimedCount}
              </p>
              <p className="text-xs text-muted-foreground">Claimed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {totalCount - claimedCount}
              </p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section (toggleable) */}
      {showUploadSection && (
        <div className="space-y-4 animate-fade-in">
          <TicketUploadFlow
            eventId={event.id}
            onSuccess={handleUploadSuccess}
            onCancel={() => setShowUploadSection(false)}
            showCancelButton={true}
          />
        </div>
      )}

      {/* Tickets Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Ticket PDFs</h2>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Showing {tickets.length} of {totalCount}
            </p>
            {!showUploadSection && tickets.length > 0 && (
              <ActionButton
                size="sm"
                onClick={() => setShowUploadSection(true)}
                label="Add Tickets"
                icon={<Plus className="h-4 w-4" />}
                className="gap-1.5"
              />
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm mb-4">
                No tickets uploaded for this event yet.
              </p>
              {!showUploadSection && (
                <Button
                  onClick={() => setShowUploadSection(true)}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Tickets
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className={`overflow-hidden group transition-all hover:border-primary/30 ${
                    ticket.is_claimed ? 'opacity-60' : ''
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                    <div className="aspect-[3/4] bg-muted relative">
                      {ticket.thumbnailUrl ||
                      thumbnailCache.current.get(ticket.id) ? (
                        <img
                          src={
                            ticket.thumbnailUrl ||
                            thumbnailCache.current.get(ticket.id)
                          }
                          alt="Ticket preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {generatingThumbnails.has(ticket.id) ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          ) : (
                            <FileText className="h-10 w-10 text-muted-foreground" />
                          )}
                        </div>
                      )}

                      {/* Claimed Badge */}
                      {ticket.is_claimed && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          Claimed
                        </div>
                      )}

                      {/* Actions Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenPdf(ticket.ticket_pdf_url)}
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        {ticket.is_claimed ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setViewClaimTicketId(ticket.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openClaimDialog(ticket)}
                            className="h-8 w-8 p-0"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTicket(ticket)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                      </p>
                      {ticket.claimed_at && (
                        <p className="text-xs text-green-600">
                          Claimed {format(new Date(ticket.claimed_at), 'MMM d')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Load more tickets'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={claimDialogOpen}
        onOpenChange={(open) => {
          setClaimDialogOpen(open);
          if (!open) {
            setClaimingTicket(null);
            setClaimEmail('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Ticket</DialogTitle>
            <DialogDescription>
              Enter the member email to create a claim for this ticket.
              {claimingTicket && (
                <span className="block text-xs text-muted-foreground mt-1">
                  {getTicketTypeName(claimingTicket.ticket_type_id)} •{' '}
                  {event.title}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="claim-email">Member email</Label>
            <Input
              id="claim-email"
              type="email"
              placeholder="member@email.com"
              value={claimEmail}
              onChange={(e) => setClaimEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClaimDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateClaim}
              disabled={creatingClaim}
            >
              {creatingClaim ? 'Assigning...' : 'Create Claim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewClaimTicketId}
        onOpenChange={(open) => {
          if (!open) setViewClaimTicketId(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
            <DialogDescription>
              Full claim metadata for this ticket.
            </DialogDescription>
          </DialogHeader>
          {viewClaimTicketId && (
            <ClaimDetails
              ticketId={viewClaimTicketId}
              onUnclaimed={handleUnclaimed}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
