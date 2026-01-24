import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, ArrowRight, ArrowLeft, Upload } from 'lucide-react';
import tiers from '@/config/tiers.json';
import EventImageUpload from './EventImageUpload';

interface TicketType {
  name: string;
  description: string;
  price: number;
  quantity: number;
  tiers: string[];
}

interface CreateEventWizardProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateEventWizard({
  user,
  onSuccess,
  onCancel,
}: CreateEventWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [ticketFiles, setTicketFiles] = useState<File[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    venue: '',
    address: '',
    event_date: '',
    event_type: '',
    genre: '',
    capacity: 100,
    image_url: '',
  });

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    {
      name: '',
      description: '',
      price: 25,
      quantity: 50,
      tiers: [],
    },
  ]);

  const addTicketType = () => {
    setTicketTypes([
      ...ticketTypes,
      { name: '', description: '', price: 25, quantity: 50, tiers: [] },
    ]);
  };

  const removeTicketType = (index: number) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  const updateTicketType = (
    index: number,
    field: keyof TicketType,
    value: string | number
  ) => {
    const updated = [...ticketTypes];
    updated[index] = { ...updated[index], [field]: value };
    setTicketTypes(updated);
  };

  const toggleTier = (ticketIndex: number, tierId: string) => {
    const updated = [...ticketTypes];
    const currentTiers = updated[ticketIndex].tiers;
    updated[ticketIndex].tiers = currentTiers.includes(tierId)
      ? currentTiers.filter((t) => t !== tierId)
      : [...currentTiers, tierId];
    setTicketTypes(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        (file) => file.type === 'application/pdf'
      );
      setTicketFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setTicketFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    if (!eventData.title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Event title is required',
      });
      return false;
    }
    if (!eventData.venue.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Venue is required',
      });
      return false;
    }
    if (!eventData.address.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Address is required',
      });
      return false;
    }
    if (!eventData.event_date) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Event date is required',
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validTicketTypes = ticketTypes.filter(
      (tt) => tt.name.trim() && tt.tiers.length > 0
    );

    if (validTicketTypes.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          'Please add at least one ticket type with a name and selected tiers',
      });
      return;
    }

    setLoading(true);

    try {
      // First, create the event to get the eventId
      const eventInsertData = { ...eventData, created_by: user.id };
      // Remove image_url for now if we have a file to upload
      if (imageFile) {
        eventInsertData.image_url = '';
      }
      
      const { data: eventDataResult, error: eventError } = await supabase
        .from('events')
        .insert(eventInsertData)
        .select()
        .single();

      if (eventError) throw eventError;

      // Upload event image if one was selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${eventDataResult.id}/${Date.now()}.${fileExt}`;
        
        const { error: imageUploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, imageFile);

        if (imageUploadError) throw imageUploadError;

        // Get public URL and update the event
        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);

        const { error: updateError } = await supabase
          .from('events')
          .update({ image_url: publicUrl })
          .eq('id', eventDataResult.id);

        if (updateError) throw updateError;
      }

      if (ticketFiles.length > 0) {
        for (const file of ticketFiles) {
          const fileName = `${eventDataResult.id}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('tickets')
            .upload(fileName, file);
          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from('tickets').getPublicUrl(fileName);
          await supabase.from('tickets').insert({
            event_id: eventDataResult.id,
            ticket_pdf_url: publicUrl,
          });
        }
      }

      for (const ticketType of validTicketTypes) {
        const { error: typeError } = await supabase
          .from('ticket_types')
          .insert({
            event_id: eventDataResult.id,
            name: ticketType.name,
            description: ticketType.description,
            price: ticketType.price,
            quantity: ticketType.quantity,
            tier_criteria: ticketType.tiers,
          });

        if (typeError) throw typeError;
      }

      toast({
        title: 'Event created!',
        description: `Created with ${validTicketTypes.length} ticket type(s)`,
      });

      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create event',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Create New Event</CardTitle>
            <CardDescription>
              Step {step} of 2: {step === 1 ? 'Event Details' : 'Ticket Types'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {step === 1 ? (
            <>
              {/* Step 1: Event Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Title *</Label>
                  <Input
                    value={eventData.title}
                    onChange={(e) =>
                      setEventData({ ...eventData, title: e.target.value })
                    }
                    className="h-8 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Venue *</Label>
                  <Input
                    value={eventData.venue}
                    onChange={(e) =>
                      setEventData({ ...eventData, venue: e.target.value })
                    }
                    className="h-8 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Date *</Label>
                  <Input
                    type="datetime-local"
                    value={eventData.event_date}
                    onChange={(e) =>
                      setEventData({ ...eventData, event_date: e.target.value })
                    }
                    className="h-8 text-sm"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Address *</Label>
                  <Input
                    value={eventData.address}
                    onChange={(e) =>
                      setEventData({ ...eventData, address: e.target.value })
                    }
                    className="h-8 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Input
                    value={eventData.event_type}
                    onChange={(e) =>
                      setEventData({ ...eventData, event_type: e.target.value })
                    }
                    placeholder="Concert, Festival..."
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Capacity</Label>
                  <Input
                    type="number"
                    value={eventData.capacity}
                    onChange={(e) =>
                      setEventData({
                        ...eventData,
                        capacity: parseInt(e.target.value),
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Genre</Label>
                  <Input
                    value={eventData.genre}
                    onChange={(e) =>
                      setEventData({ ...eventData, genre: e.target.value })
                    }
                    placeholder="Rock, Jazz..."
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Event Image Upload */}
              <EventImageUpload
                currentImageUrl={eventData.image_url || null}
                onImageChange={(url) => setEventData({ ...eventData, image_url: url || '' })}
                onFileSelect={(file) => setImageFile(file)}
                createMode={true}
              />

              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={eventData.description}
                  onChange={(e) =>
                    setEventData({ ...eventData, description: e.target.value })
                  }
                  className="text-sm min-h-[60px]"
                  rows={2}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleNext}
                  className="h-9"
                >
                  Next: Ticket Types
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Ticket Types */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Ticket Types *
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTicketType}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Type
                  </Button>
                </div>
                <div className="grid gap-3">
                  {ticketTypes.map((ticketType, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Ticket Type {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTicketType(index)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Name *</Label>
                          <Input
                            value={ticketType.name}
                            onChange={(e) =>
                              updateTicketType(index, 'name', e.target.value)
                            }
                            placeholder="VIP, General..."
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Price</Label>
                          <Input
                            type="number"
                            value={ticketType.price}
                            onChange={(e) =>
                              updateTicketType(
                                index,
                                'price',
                                parseFloat(e.target.value)
                              )
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            value={ticketType.quantity}
                            onChange={(e) =>
                              updateTicketType(
                                index,
                                'quantity',
                                parseInt(e.target.value)
                              )
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={ticketType.description}
                            onChange={(e) =>
                              updateTicketType(
                                index,
                                'description',
                                e.target.value
                              )
                            }
                            placeholder="Optional description..."
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Available to Tiers *</Label>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {tiers.tiers.map((tier) => (
                            <label
                              key={tier.id}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <Checkbox
                                checked={ticketType.tiers.includes(tier.id)}
                                onCheckedChange={() =>
                                  toggleTier(index, tier.id)
                                }
                                className="h-3.5 w-3.5"
                              />
                              <span className="text-xs">{tier.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <Label className="text-xs">Upload Ticket PDFs (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload PDF tickets that will be sent to members who claim a
                  spot
                </p>
                <div className="mt-1.5">
                  <label className="flex flex-col items-center justify-center w-full h-40  border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-medium text-foreground">
                          Click to upload PDF tickets
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          PDF files only, multiple files supported
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      multiple
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                {ticketFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Selected Files ({ticketFiles.length})
                    </p>
                    <div className="space-y-1.5">
                      {ticketFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 bg-muted/50 px-3 py-2.5 rounded-lg border border-border group hover:border-primary/50 transition-colors"
                        >
                          <div className="h-8 w-8 rounded bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                            <svg
                              className="h-5 w-5 text-red-600 dark:text-red-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                            </svg>
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
                            onClick={() => removeFile(index)}
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
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="h-9"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-9"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
