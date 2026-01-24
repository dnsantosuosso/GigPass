import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Trash2,
  X,
  Edit2,
  Save,
  Calendar,
  MapPin,
  Users,
  Upload,
  FileText,
  ExternalLink,
} from 'lucide-react';
import tiers from '@/config/tiers.json';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import CreateEventWizard from './CreateEventWizard';
import ClaimsManagement from './ClaimsManagement';
import MembersManagement from './MembersManagement';
import EventImageUpload from './EventImageUpload';

type DbEvent = Tables<'events'>;

interface TicketType {
  id?: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  claimed_count?: number;
  tiers: string[];
}

interface TicketPDF {
  id: string;
  event_id: string;
  ticket_pdf_url: string;
  created_at: string;
}

interface AdminDashboardProps {
  user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const { displayName } = useUserProfile(user);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<DbEvent | null>(null);
  const [editingTicketTypes, setEditingTicketTypes] = useState<TicketType[]>(
    []
  );
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [ticketPDFs, setTicketPDFs] = useState<TicketPDF[]>([]);
  const [uploadingPDFs, setUploadingPDFs] = useState<File[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load events',
      });
    }
  };

  const fetchEventTicketTypes = async (eventId: string) => {
    try {
      const { data: types, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;

      const typesWithTiers = (types || []).map((type) => {
        const tierCriteria = type.tier_criteria as string[] | null;
        return {
          id: type.id,
          name: type.name,
          description: type.description || '',
          price: Number(type.price),
          quantity: type.quantity,
          tiers: tierCriteria || [],
        };
      });

      setEditingTicketTypes(typesWithTiers);
    } catch (error) {
      console.error('Error fetching ticket types:', error);
    }
  };

  const fetchEventPDFs = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, event_id, ticket_pdf_url, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTicketPDFs(data || []);
    } catch (error) {
      console.error('Error fetching ticket PDFs:', error);
    }
  };

  const handleEditEvent = async (event: DbEvent) => {
    // Toggle - if already editing this event, close it
    if (expandedEventId === event.id) {
      handleCancelEdit();
      return;
    }

    setExpandedEventId(event.id);
    setEditingEvent(event);
    await fetchEventTicketTypes(event.id);
    await fetchEventPDFs(event.id);
  };

  const handleCancelEdit = () => {
    setExpandedEventId(null);
    setEditingEvent(null);
    setEditingTicketTypes([]);
    setTicketPDFs([]);
    setUploadingPDFs([]);
  };

  const addEditTicketType = () => {
    setEditingTicketTypes([
      ...editingTicketTypes,
      { name: '', description: '', price: 25, quantity: 50, tiers: [] },
    ]);
  };

  const removeEditTicketType = async (index: number) => {
    const ticketType = editingTicketTypes[index];

    if (ticketType.id) {
      try {
        await supabase.from('ticket_types').delete().eq('id', ticketType.id);
        toast({ title: 'Ticket type deleted' });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete ticket type',
        });
        return;
      }
    }

    setEditingTicketTypes(editingTicketTypes.filter((_, i) => i !== index));
  };

  const updateEditTicketType = (
    index: number,
    field: keyof TicketType,
    value: string | number
  ) => {
    const updated = [...editingTicketTypes];
    updated[index] = { ...updated[index], [field]: value };
    setEditingTicketTypes(updated);
  };

  const toggleEditTier = (ticketIndex: number, tierId: string) => {
    const updated = [...editingTicketTypes];
    const currentTiers = updated[ticketIndex].tiers;
    updated[ticketIndex].tiers = currentTiers.includes(tierId)
      ? currentTiers.filter((t) => t !== tierId)
      : [...currentTiers, tierId];
    setEditingTicketTypes(updated);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    setLoading(true);

    try {
      const validTicketTypes = editingTicketTypes.filter(
        (tt) => tt.name.trim() && tt.tiers.length > 0
      );

      if (validTicketTypes.length === 0) {
        throw new Error(
          'Please have at least one ticket type with a name and selected tiers'
        );
      }

      const { error: eventError } = await supabase
        .from('events')
        .update({
          title: editingEvent.title,
          description: editingEvent.description,
          venue: editingEvent.venue,
          address: editingEvent.address,
          event_date: editingEvent.event_date,
          event_type: editingEvent.event_type,
          genre: editingEvent.genre,
          capacity: editingEvent.capacity,
          image_url: editingEvent.image_url,
        })
        .eq('id', editingEvent.id);

      if (eventError) throw eventError;

      for (const ticketType of validTicketTypes) {
        if (ticketType.id) {
          const { error: typeError } = await supabase
            .from('ticket_types')
            .update({
              name: ticketType.name,
              description: ticketType.description,
              price: ticketType.price,
              quantity: ticketType.quantity,
              tier_criteria: ticketType.tiers,
            })
            .eq('id', ticketType.id);

          if (typeError) throw typeError;
        } else {
          const { error: typeError } = await supabase
            .from('ticket_types')
            .insert({
              event_id: editingEvent.id,
              name: ticketType.name,
              description: ticketType.description,
              price: ticketType.price,
              quantity: ticketType.quantity,
              tier_criteria: ticketType.tiers,
            });

          if (typeError) throw typeError;
        }
      }

      // Handle PDF uploads
      if (uploadingPDFs.length > 0) {
        for (const file of uploadingPDFs) {
          const fileName = `${editingEvent.id}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('tickets')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from('tickets').getPublicUrl(fileName);

          await supabase.from('tickets').insert({
            event_id: editingEvent.id,
            ticket_pdf_url: publicUrl,
          });
        }
      }

      toast({
        title: 'Event updated successfully',
        description:
          uploadingPDFs.length > 0
            ? `Updated with ${uploadingPDFs.length} new PDF(s)`
            : undefined,
      });
      handleCancelEdit();
      fetchEvents();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update event',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      if (error) throw error;
      toast({ title: 'Event deleted' });
      fetchEvents();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete event',
      });
    }
  };

  const handlePDFFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        (file) => file.type === 'application/pdf'
      );
      setUploadingPDFs((prev) => [...prev, ...newFiles]);
    }
  };

  const removeUploadingPDF = (index: number) => {
    setUploadingPDFs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeletePDF = async (pdf: TicketPDF) => {
    if (!confirm('Are you sure you want to delete this PDF ticket?')) return;

    try {
      // Extract path from URL
      const urlParts = pdf.ticket_pdf_url.split('/tickets/');
      if (urlParts.length < 2) throw new Error('Invalid PDF URL');

      const filePath = urlParts[1].split('?')[0];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('tickets')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('tickets')
        .delete()
        .eq('id', pdf.id);

      if (dbError) throw dbError;

      toast({ title: 'PDF deleted successfully' });
      setTicketPDFs((prev) => prev.filter((p) => p.id !== pdf.id));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete PDF',
      });
    }
  };

  const TicketTypeCard = ({
    ticketType,
    index,
    isEditing = false,
    onUpdate,
    onRemove,
    onToggleTier,
  }: {
    ticketType: TicketType;
    index: number;
    isEditing?: boolean;
    onUpdate: (
      index: number,
      field: keyof TicketType,
      value: string | number
    ) => void;
    onRemove: (index: number) => void;
    onToggleTier: (index: number, tierId: string) => void;
  }) => (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Ticket Type {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 sm:col-span-1">
          <Label className="text-xs">Name</Label>
          <Input
            value={ticketType.name}
            onChange={(e) => onUpdate(index, 'name', e.target.value)}
            placeholder="VIP, General..."
            className="h-8 text-sm"
          />
        </div>
        <div className="col-span-1">
          <Label className="text-xs">Price</Label>
          <Input
            type="number"
            value={ticketType.price}
            onChange={(e) =>
              onUpdate(index, 'price', parseFloat(e.target.value))
            }
            className="h-8 text-sm"
          />
        </div>
        <div className="col-span-1">
          <Label className="text-xs">Quantity</Label>
          <Input
            type="number"
            value={ticketType.quantity}
            onChange={(e) =>
              onUpdate(index, 'quantity', parseInt(e.target.value))
            }
            className="h-8 text-sm"
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Description</Label>
          <Input
            value={ticketType.description}
            onChange={(e) => onUpdate(index, 'description', e.target.value)}
            placeholder="Optional description..."
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Available to Tiers</Label>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {tiers.tiers.map((tier) => (
            <label
              key={tier.id}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <Checkbox
                checked={ticketType.tiers.includes(tier.id)}
                onCheckedChange={() => onToggleTier(index, tier.id)}
                className="h-3.5 w-3.5"
              />
              <span className="text-xs">{tier.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <ModernSidebar
        userEmail={user.email}
        displayName={displayName || undefined}
        isAdmin={true}
      />

      <main className="flex-1 md:ml-0 pt-14 md:pt-0">
        <div className="h-full overflow-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gradient mb-1">
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage events and tickets
              </p>
            </div>

            <Tabs
              defaultValue="events"
              className="space-y-4"
            >
              <TabsList className="bg-muted/50 h-9 grid grid-cols-4 w-full max-w-2xl">
                <TabsTrigger
                  value="events"
                  className="text-sm h-7"
                >
                  Events
                </TabsTrigger>
                <TabsTrigger
                  value="claims"
                  className="text-sm h-7"
                >
                  Claims
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="text-sm h-7"
                >
                  Members
                </TabsTrigger>
                <TabsTrigger
                  value="create"
                  className="text-sm h-7"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Create
                </TabsTrigger>
              </TabsList>

              {/* Events List */}
              <TabsContent
                value="events"
                className="space-y-3 animate-fade-in"
              >
                {events.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">
                        No events yet. Create your first event!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  events.map((event) => (
                    <Card
                      key={event.id}
                      className="overflow-hidden hover:border-primary/30 transition-colors"
                    >
                      <CardContent className="p-0">
                        {/* Event Row */}
                        <div className="flex items-center gap-3 p-3 md:p-4">
                          {/* Event Image */}
                          {event.image_url && (
                            <div className="hidden sm:block h-14 w-14 rounded-md overflow-hidden bg-muted shrink-0">
                              <img
                                src={event.image_url}
                                alt={event.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}

                          {/* Event Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm md:text-base truncate">
                              {event.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(
                                  new Date(event.event_date),
                                  'MMM d, yyyy'
                                )}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.venue}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {event.claimed_count}/{event.capacity}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEvent(event)}
                              className="h-8 px-2"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Edit Form */}
                        {expandedEventId === event.id && editingEvent && (
                          <div className="border-t border-border bg-muted/20 p-4 animate-slide-in">
                            <form
                              onSubmit={handleUpdateEvent}
                              className="space-y-4"
                            >
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="col-span-2">
                                  <Label className="text-xs">Title</Label>
                                  <Input
                                    value={editingEvent.title}
                                    onChange={(e) =>
                                      setEditingEvent({
                                        ...editingEvent,
                                        title: e.target.value,
                                      })
                                    }
                                    className="h-8 text-sm"
                                    required
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Venue</Label>
                                  <Input
                                    value={editingEvent.venue}
                                    onChange={(e) =>
                                      setEditingEvent({
                                        ...editingEvent,
                                        venue: e.target.value,
                                      })
                                    }
                                    className="h-8 text-sm"
                                    required
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Date</Label>
                                  <Input
                                    type="datetime-local"
                                    value={editingEvent.event_date.slice(0, 16)}
                                    onChange={(e) =>
                                      setEditingEvent({
                                        ...editingEvent,
                                        event_date: e.target.value,
                                      })
                                    }
                                    className="h-8 text-sm"
                                    required
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label className="text-xs">Address</Label>
                                  <Input
                                    value={editingEvent.address}
                                    onChange={(e) =>
                                      setEditingEvent({
                                        ...editingEvent,
                                        address: e.target.value,
                                      })
                                    }
                                    className="h-8 text-sm"
                                    required
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Type</Label>
                                  <Input
                                    value={editingEvent.event_type || ''}
                                    onChange={(e) =>
                                      setEditingEvent({
                                        ...editingEvent,
                                        event_type: e.target.value,
                                      })
                                    }
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Capacity</Label>
                                  <Input
                                    type="number"
                                    value={editingEvent.capacity}
                                    onChange={(e) =>
                                      setEditingEvent({
                                        ...editingEvent,
                                        capacity: parseInt(e.target.value),
                                      })
                                    }
                                    className="h-8 text-sm"
                                    required
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Genre</Label>
                                  <Input
                                    value={editingEvent.genre || ''}
                                    onChange={(e) =>
                                      setEditingEvent({
                                        ...editingEvent,
                                        genre: e.target.value,
                                      })
                                    }
                                    placeholder="Rock, Jazz..."
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs">Description</Label>
                                <Textarea
                                  value={editingEvent.description || ''}
                                  onChange={(e) =>
                                    setEditingEvent({
                                      ...editingEvent,
                                      description: e.target.value,
                                    })
                                  }
                                  className="text-sm min-h-[60px]"
                                  rows={2}
                                />
                              </div>

                              {/* Event Image Upload */}
                              <EventImageUpload
                                eventId={editingEvent.id}
                                currentImageUrl={editingEvent.image_url}
                                onImageChange={(url) =>
                                  setEditingEvent({
                                    ...editingEvent,
                                    image_url: url,
                                  })
                                }
                              />

                              {/* Ticket Types */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Ticket Types
                                  </Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addEditTicketType}
                                    className="h-7 text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </Button>
                                </div>
                                <div className="grid gap-3">
                                  {editingTicketTypes.map(
                                    (ticketType, index) => (
                                      <TicketTypeCard
                                        key={ticketType.id || index}
                                        ticketType={ticketType}
                                        index={index}
                                        isEditing
                                        onUpdate={updateEditTicketType}
                                        onRemove={removeEditTicketType}
                                        onToggleTier={toggleEditTier}
                                      />
                                    )
                                  )}
                                </div>
                              </div>

                              {/* PDF Management */}
                              <div className="space-y-3">
                                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Ticket PDFs
                                </Label>

                                {/* Existing PDFs */}
                                {ticketPDFs.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                      Existing PDFs ({ticketPDFs.length})
                                    </p>
                                    <div className="space-y-1.5">
                                      {ticketPDFs.map((pdf) => (
                                        <div
                                          key={pdf.id}
                                          className="flex items-center gap-3 bg-muted/50 px-3 py-2.5 rounded-lg border border-border group hover:border-primary/50 transition-colors"
                                        >
                                          <div className="h-8 w-8 rounded bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                                            <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                              Ticket PDF
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {format(
                                                new Date(pdf.created_at),
                                                'MMM d, yyyy'
                                              )}
                                            </p>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              window.open(
                                                pdf.ticket_pdf_url,
                                                '_blank'
                                              )
                                            }
                                            className="h-8 w-8 p-0"
                                          >
                                            <ExternalLink className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeletePDF(pdf)}
                                            className="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Upload New PDFs */}
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Add new PDF tickets
                                  </p>
                                  <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all">
                                    <div className="flex items-center gap-2">
                                      <Upload className="w-4 h-4 text-primary" />
                                      <span className="text-sm text-foreground">
                                        Click to upload PDFs
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      PDF files only, multiple supported
                                    </p>
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept=".pdf"
                                      multiple
                                      onChange={handlePDFFileChange}
                                    />
                                  </label>
                                </div>

                                {/* Files to Upload */}
                                {uploadingPDFs.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                      Files to upload ({uploadingPDFs.length})
                                    </p>
                                    <div className="space-y-1.5">
                                      {uploadingPDFs.map((file, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center gap-3 bg-primary/5 px-3 py-2.5 rounded-lg border border-primary/20 group"
                                        >
                                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                            <Upload className="h-4 w-4 text-primary" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                              {file.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              removeUploadingPDF(index)
                                            }
                                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button
                                  type="submit"
                                  size="sm"
                                  disabled={loading}
                                  className="h-8"
                                >
                                  <Save className="h-3.5 w-3.5 mr-1.5" />
                                  {loading ? 'Saving...' : 'Save'}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="h-8"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Claims Tab */}
              <TabsContent
                value="claims"
                className="animate-fade-in"
              >
                <ClaimsManagement />
              </TabsContent>

              {/* Members Tab */}
              <TabsContent
                value="members"
                className="animate-fade-in"
              >
                <MembersManagement />
              </TabsContent>

              {/* Create Event */}
              <TabsContent
                value="create"
                className="animate-fade-in"
              >
                <CreateEventWizard
                  user={user}
                  onSuccess={() => {
                    fetchEvents();
                    setShowCreateWizard(false);
                  }}
                  onCancel={() => setShowCreateWizard(false)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
