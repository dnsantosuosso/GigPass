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
import { Plus, X, ArrowRight, ArrowLeft, Upload, Loader2, Check } from 'lucide-react';
import tiers from '@/config/tiers.json';
import EventImageUpload from './EventImageUpload';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PagePreview {
  pageNumber: number;
  imageUrl: string;
  selected: boolean;
}

interface TicketType {
  name: string;
  description: string;
  price: number;
  quantity: number;
  tiers: string[];
  pdfFile: File | null;
  pagePreviews: PagePreview[];
  processingPdf: boolean;
}

interface CreateEventWizardProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

const DEFAULT_TICKET_TYPE: TicketType = {
  name: '',
  description: '',
  price: 25,
  quantity: 50,
  tiers: [],
  pdfFile: null,
  pagePreviews: [],
  processingPdf: false,
};

export default function CreateEventWizard({
  user,
  onSuccess,
  onCancel,
}: CreateEventWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
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
    { ...DEFAULT_TICKET_TYPE },
  ]);

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { ...DEFAULT_TICKET_TYPE }]);
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

  const handleTicketTypePdfChange = async (
    ticketTypeIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Invalid file',
        description: 'Please select a PDF file',
      });
      return;
    }

    setTicketTypes((prev) =>
      prev.map((tt, i) =>
        i === ticketTypeIndex ? { ...tt, pdfFile: file, processingPdf: true } : tt
      )
    );

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const previews: PagePreview[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 0.5;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
        previews.push({ pageNumber: i, imageUrl, selected: true });
      }

      setTicketTypes((prev) =>
        prev.map((tt, i) =>
          i === ticketTypeIndex
            ? { ...tt, pagePreviews: previews, processingPdf: false }
            : tt
        )
      );
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process PDF file',
      });
      setTicketTypes((prev) =>
        prev.map((tt, i) =>
          i === ticketTypeIndex
            ? { ...tt, pdfFile: null, pagePreviews: [], processingPdf: false }
            : tt
        )
      );
    }
  };

  const toggleTicketTypePageSelection = (
    ticketTypeIndex: number,
    pageNumber: number
  ) => {
    setTicketTypes((prev) =>
      prev.map((tt, i) =>
        i === ticketTypeIndex
          ? {
              ...tt,
              pagePreviews: tt.pagePreviews.map((p) =>
                p.pageNumber === pageNumber ? { ...p, selected: !p.selected } : p
              ),
            }
          : tt
      )
    );
  };

  const removeTicketTypePdf = (ticketTypeIndex: number) => {
    setTicketTypes((prev) =>
      prev.map((tt, i) =>
        i === ticketTypeIndex
          ? { ...tt, pdfFile: null, pagePreviews: [] }
          : tt
      )
    );
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

      // Insert ticket types and upload their PDFs
      for (const ticketType of validTicketTypes) {
        const { data: ticketTypeData, error: typeError } = await supabase
          .from('ticket_types')
          .insert({
            event_id: eventDataResult.id,
            name: ticketType.name,
            description: ticketType.description,
            price: ticketType.price,
            quantity: ticketType.quantity,
            tier_criteria: ticketType.tiers,
          })
          .select('id')
          .single();

        if (typeError) throw typeError;

        // Upload ticket PDFs for this ticket type — one per selected page
        const selectedPages = ticketType.pagePreviews
          .filter((p) => p.selected)
          .map((p) => p.pageNumber);

        if (ticketType.pdfFile && selectedPages.length > 0) {
          const arrayBuffer = await ticketType.pdfFile.arrayBuffer();
          const originalPdfBytes = new Uint8Array(arrayBuffer.slice(0));

          for (const pageNum of selectedPages) {
            let blob: Blob;

            if (ticketType.pagePreviews.length === 1) {
              blob = ticketType.pdfFile;
            } else {
              try {
                const srcDoc = await PDFDocument.load(originalPdfBytes);
                const singlePagePdf = await PDFDocument.create();
                const [copiedPage] = await singlePagePdf.copyPages(srcDoc, [pageNum - 1]);
                singlePagePdf.addPage(copiedPage);
                const pdfBytes = await singlePagePdf.save();
                blob = new Blob([pdfBytes], { type: 'application/pdf' });
              } catch {
                // Fallback: render page as high-res image if pdf-lib fails (e.g. encrypted PDFs)
                const srcPdf = await pdfjsLib.getDocument({ data: originalPdfBytes.slice(0) }).promise;
                const page = await srcPdf.getPage(pageNum);
                const scale = 3.0;
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) continue;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({
                  canvasContext: context,
                  viewport: viewport,
                  canvas: canvas,
                }).promise;

                const imageUrl = canvas.toDataURL('image/jpeg', 0.95);
                const imageData = imageUrl.split(',')[1];
                const imageBytes = Uint8Array.from(atob(imageData), (c) => c.charCodeAt(0));

                const newPdf = await PDFDocument.create();
                const image = await newPdf.embedJpg(imageBytes);
                const originalViewport = page.getViewport({ scale: 1.0 });
                const pdfPage = newPdf.addPage([originalViewport.width, originalViewport.height]);
                pdfPage.drawImage(image, {
                  x: 0,
                  y: 0,
                  width: originalViewport.width,
                  height: originalViewport.height,
                });

                const pdfBytes = await newPdf.save();
                blob = new Blob([pdfBytes], { type: 'application/pdf' });
              }
            }

            const fileName = `event-${eventDataResult.id}/tickets/${Date.now()}_page${pageNum}_ticket.pdf`;
            const { error: uploadError } = await supabase.storage
              .from('tickets')
              .upload(fileName, blob);
            if (uploadError) throw uploadError;

            await supabase.from('tickets').insert({
              event_id: eventDataResult.id,
              ticket_pdf_url: fileName,
              ticket_type_id: ticketTypeData.id,
            });
          }
        }
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

                      {/* Per-ticket-type PDF Upload */}
                      <div>
                        <Label className="text-xs">Upload Ticket PDF (Optional)</Label>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Each selected page becomes an individual ticket
                        </p>

                        {!ticketType.pdfFile ? (
                          <div className="mt-1.5">
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all">
                              {ticketType.processingPdf ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                  <span className="text-xs text-muted-foreground">
                                    Processing PDF...
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Upload className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-medium">
                                    Click to upload PDF
                                  </span>
                                </div>
                              )}
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,application/pdf"
                                onChange={(e) => handleTicketTypePdfChange(index, e)}
                                disabled={ticketType.processingPdf}
                              />
                            </label>
                          </div>
                        ) : (
                          <div className="mt-1.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-medium text-muted-foreground">
                                {ticketType.pdfFile.name} — {ticketType.pagePreviews.filter((p) => p.selected).length} of{' '}
                                {ticketType.pagePreviews.length} page(s) selected
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTicketTypePdf(index)}
                                className="h-6 text-[10px] px-2"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Remove
                              </Button>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-1">
                              {ticketType.pagePreviews.map((preview) => (
                                <div
                                  key={preview.pageNumber}
                                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                    preview.selected
                                      ? 'border-primary ring-2 ring-primary/20'
                                      : 'border-border hover:border-muted-foreground'
                                  }`}
                                  onClick={() => toggleTicketTypePageSelection(index, preview.pageNumber)}
                                >
                                  <div className="aspect-[3/4] bg-muted">
                                    <img
                                      src={preview.imageUrl}
                                      alt={`Page ${preview.pageNumber}`}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div className="absolute top-1 left-1">
                                    <div
                                      className={`h-3.5 w-3.5 rounded-sm border backdrop-blur-sm flex items-center justify-center ${
                                        preview.selected
                                          ? 'bg-primary border-primary text-primary-foreground'
                                          : 'bg-background/80 border-primary'
                                      }`}
                                    >
                                      {preview.selected && (
                                        <Check className="h-2.5 w-2.5" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm px-1 py-0.5 text-center">
                                    <span className="text-[9px] font-medium">
                                      Page {preview.pageNumber}
                                    </span>
                                  </div>
                                  {!preview.selected && (
                                    <div className="absolute inset-0 bg-background/60" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
