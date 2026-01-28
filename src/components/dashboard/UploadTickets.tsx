import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  Calendar,
  MapPin,
  FileText,
  Loader2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Tables } from '@/integrations/supabase/types';
import EventSearchList from './EventSearchList';

// Set up PDF.js worker - use unpkg which works better with Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

type DbEvent = Tables<'events'>;

interface PagePreview {
  pageNumber: number;
  imageUrl: string;
  selected: boolean;
}

interface UploadTicketsProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface TicketTypeOption {
  id: string;
  name: string;
}

export default function UploadTickets({ onSuccess, onCancel }: UploadTicketsProps) {
  const [selectedEvent, setSelectedEvent] = useState<DbEvent | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [processingPdf, setProcessingPdf] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeOption[]>([]);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchTicketTypes = async () => {
      if (!selectedEvent) {
        setTicketTypes([]);
        setSelectedTicketTypeId('');
        return;
      }

      const { data, error } = await supabase
        .from('ticket_types')
        .select('id, name')
        .eq('event_id', selectedEvent.id)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading ticket types:', error);
        setTicketTypes([]);
        return;
      }

      setTicketTypes(data || []);
      setSelectedTicketTypeId('');
    };

    fetchTicketTypes();
  }, [selectedEvent]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Invalid file',
        description: 'Please select a PDF file',
      });
      return;
    }

    setPdfFile(file);
    await processPdfForPreview(file);
  };

  const processPdfForPreview = async (file: File) => {
    setProcessingPdf(true);
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
        previews.push({
          pageNumber: i,
          imageUrl,
          selected: true, // All pages selected by default
        });
      }

      setPagePreviews(previews);
      setShowPreviewDialog(true);
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process PDF file',
      });
    } finally {
      setProcessingPdf(false);
    }
  };

  const togglePageSelection = (pageNumber: number) => {
    setPagePreviews((prev) =>
      prev.map((p) =>
        p.pageNumber === pageNumber ? { ...p, selected: !p.selected } : p
      )
    );
  };

  const selectAllPages = () => {
    setPagePreviews((prev) => prev.map((p) => ({ ...p, selected: true })));
  };

  const deselectAllPages = () => {
    setPagePreviews((prev) => prev.map((p) => ({ ...p, selected: false })));
  };

  const handleUpload = async () => {
    if (!selectedEvent || !pdfFile) return;

    const selectedPages = pagePreviews
      .filter((p) => p.selected)
      .map((p) => p.pageNumber);

    if (selectedPages.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No pages selected',
        description: 'Please select at least one page to upload',
      });
      return;
    }

    if (!selectedTicketTypeId) {
      toast({
        variant: 'destructive',
        title: 'Missing ticket type',
        description: 'Select a ticket type before uploading.',
      });
      return;
    }

    setUploading(true);
    try {
      let blob: Blob;

      // If all pages selected, upload original file directly to preserve content
      if (selectedPages.length === pagePreviews.length) {
        blob = pdfFile;
      } else {
        // Extract specific pages using pdf-lib
        const arrayBuffer = await pdfFile.arrayBuffer();
        const originalPdf = await PDFDocument.load(arrayBuffer, {
          ignoreEncryption: true,
        });

        const newPdf = await PDFDocument.create();

        for (const pageNum of selectedPages) {
          const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNum - 1]);
          newPdf.addPage(copiedPage);
        }

        const pdfBytes = await newPdf.save();
        blob = new Blob([pdfBytes], { type: 'application/pdf' });
      }

      // Upload to Supabase storage
      const fileName = `event-${selectedEvent.id}/tickets/${Date.now()}_ticket.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('tickets')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Save to database
      const { error: dbError } = await supabase.from('tickets').insert({
        event_id: selectedEvent.id,
        ticket_pdf_url: fileName,
        ticket_type_id: selectedTicketTypeId,
      });

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: `Ticket uploaded with ${selectedPages.length} page(s)`,
      });

      setShowPreviewDialog(false);
      onSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Failed to upload ticket PDF',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPreview = () => {
    setShowPreviewDialog(false);
    setPdfFile(null);
    setPagePreviews([]);
  };

  const selectedCount = pagePreviews.filter((p) => p.selected).length;
  const allSelected =
    pagePreviews.length > 0 && pagePreviews.every((p) => p.selected);

  return (
    <div className="space-y-6">
      {/* Step 1: Select Event */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                Step 1: Select an Event
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Search and select the event to associate the ticket with
              </p>
            </div>

            {/* Selected Event Display */}
            {selectedEvent ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {selectedEvent.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(selectedEvent.event_date), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedEvent.venue}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <EventSearchList
                onSelectEvent={setSelectedEvent}
                height="280px"
                pageSize={10}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Upload PDF */}
      <Card className={!selectedEvent ? 'opacity-50' : ''}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                Step 2: Upload Ticket PDF
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Upload a PDF file. You can preview and select which pages to include.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Ticket Type</Label>
              <Select
                value={selectedTicketTypeId}
                onValueChange={setSelectedTicketTypeId}
                disabled={!selectedEvent || ticketTypes.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      ticketTypes.length === 0
                        ? 'No ticket types for this event'
                        : 'Select ticket type'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {ticketTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg transition-all ${
                !selectedEvent || !selectedTicketTypeId
                  ? 'cursor-not-allowed opacity-60'
                  : 'cursor-pointer hover:bg-muted/30 hover:border-primary/50'
              }`}
            >
              {processingPdf ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Processing PDF...
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">
                      Click to upload PDF
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF files only
                  </p>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={!selectedEvent || !selectedTicketTypeId || processingPdf}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Pages to Include</DialogTitle>
            <DialogDescription>
              {pdfFile?.name} • {pagePreviews.length} page(s) • {selectedCount} selected
            </DialogDescription>
          </DialogHeader>

          {/* Selection Controls */}
          <div className="flex items-center gap-2 py-2 border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={allSelected ? deselectAllPages : selectAllPages}
              className="text-xs"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Page Grid */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
              {pagePreviews.map((preview) => (
                <div
                  key={preview.pageNumber}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    preview.selected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => togglePageSelection(preview.pageNumber)}
                >
                  {/* Page Image */}
                  <div className="aspect-[3/4] bg-muted">
                    <img
                      src={preview.imageUrl}
                      alt={`Page ${preview.pageNumber}`}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Checkbox Overlay */}
                  <div className="absolute top-2 left-2">
                    <Checkbox
                      checked={preview.selected}
                      onCheckedChange={() => togglePageSelection(preview.pageNumber)}
                      className="h-5 w-5 bg-background/80 backdrop-blur-sm"
                    />
                  </div>

                  {/* Page Number */}
                  <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm px-2 py-1 text-center">
                    <span className="text-xs font-medium">
                      Page {preview.pageNumber}
                    </span>
                  </div>

                  {/* Deselected Overlay */}
                  {!preview.selected && (
                    <div className="absolute inset-0 bg-background/60" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={handleCancelPreview}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedCount === 0 || uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Upload {selectedCount} Page{selectedCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
