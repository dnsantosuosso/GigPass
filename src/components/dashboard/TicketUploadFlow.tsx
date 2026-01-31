import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  FileText,
  Loader2,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker - use unpkg which works better with Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PagePreview {
  pageNumber: number;
  imageUrl: string;
  selected: boolean;
}

interface TicketUploadFlowProps {
  eventId: string;
  onSuccess: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

interface TicketTypeOption {
  id: string;
  name: string;
}

export default function TicketUploadFlow({
  eventId,
  onSuccess,
  onCancel,
  showCancelButton = false,
}: TicketUploadFlowProps) {
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
      const { data, error } = await supabase
        .from('ticket_types')
        .select('id, name')
        .eq('event_id', eventId)
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
  }, [eventId]);

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
          selected: true,
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
    if (!pdfFile) return;

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
      const arrayBuffer = await pdfFile.arrayBuffer();
      const originalPdfBytes = new Uint8Array(arrayBuffer.slice(0));
      const srcPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      for (const pageNum of selectedPages) {
        let blob: Blob;

        if (pagePreviews.length === 1) {
          // Single-page PDF — upload the original file to preserve content
          blob = pdfFile;
        } else {
          // Extract this single page using pdf-lib to preserve native content (barcodes, fonts, etc.)
          try {
            const srcDoc = await PDFDocument.load(originalPdfBytes);
            const singlePagePdf = await PDFDocument.create();
            const [copiedPage] = await singlePagePdf.copyPages(srcDoc, [pageNum - 1]);
            singlePagePdf.addPage(copiedPage);
            const pdfBytes = await singlePagePdf.save();
            blob = new Blob([pdfBytes], { type: 'application/pdf' });
          } catch {
            // Fallback: render page as high-res image if pdf-lib copy fails
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

        const fileName = `event-${eventId}/tickets/${Date.now()}_page${pageNum}_ticket.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('tickets')
          .upload(fileName, blob);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from('tickets').insert({
          event_id: eventId,
          ticket_pdf_url: fileName,
          ticket_type_id: selectedTicketTypeId,
        });

        if (dbError) throw dbError;
      }

      toast({
        title: 'Success',
        description: `${selectedPages.length} ticket(s) uploaded successfully`,
      });

      setShowPreviewDialog(false);
      setPdfFile(null);
      setPagePreviews([]);
      onSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Failed to upload ticket PDFs',
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
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Upload Ticket PDF</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Upload a PDF file. You can preview and select which pages to include.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Ticket Type</Label>
              <Select
                value={selectedTicketTypeId}
                onValueChange={setSelectedTicketTypeId}
                disabled={ticketTypes.length === 0}
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
                !selectedTicketTypeId
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
                  <p className="text-xs text-muted-foreground">PDF files only</p>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={!selectedTicketTypeId || processingPdf}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {showCancelButton && onCancel && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Pages to Include</DialogTitle>
            <DialogDescription>
              {pdfFile?.name} • {pagePreviews.length} page(s) • {selectedCount}{' '}
              selected
            </DialogDescription>
          </DialogHeader>

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

          <div className="flex-1 overflow-y-auto max-h-[50vh]">
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
                  <div className="aspect-[3/4] bg-muted">
                    <img
                      src={preview.imageUrl}
                      alt={`Page ${preview.pageNumber}`}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="absolute top-2 left-2">
                    <Checkbox
                      checked={preview.selected}
                      onCheckedChange={() =>
                        togglePageSelection(preview.pageNumber)
                      }
                      className="h-5 w-5 bg-background/80 backdrop-blur-sm"
                    />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm px-2 py-1 text-center">
                    <span className="text-xs font-medium">
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
                  Upload {selectedCount} Ticket{selectedCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
