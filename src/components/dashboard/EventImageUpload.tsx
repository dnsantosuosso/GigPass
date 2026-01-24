import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, ImageIcon, Loader2, Trash2, AlertCircle } from 'lucide-react';

interface EventImageUploadProps {
  /** Event ID - required for edit mode (immediate upload), optional for create mode */
  eventId?: string;
  /** Current image URL (for edit mode or after upload) */
  currentImageUrl: string | null;
  /** Callback when image URL changes (edit mode) or null (removed) */
  onImageChange: (url: string | null) => void;
  /** Callback when a file is selected (create mode) - provides the file for later upload */
  onFileSelect?: (file: File | null) => void;
  /** Whether we're in create mode (hold file locally vs immediate upload) */
  createMode?: boolean;
}

export default function EventImageUpload({
  eventId,
  currentImageUrl,
  onImageChange,
  onFileSelect,
  createMode = false,
}: EventImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Reset imageError when currentImageUrl changes
  useEffect(() => {
    setImageError(false);
    setImageLoading(!!currentImageUrl && !localPreview);
  }, [currentImageUrl, localPreview]);

  // Cleanup local preview blob URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, WebP, or GIF image.',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
      });
      return;
    }

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    setImageError(false);

    // In create mode, just hold the file - don't upload yet
    if (createMode) {
      onFileSelect?.(file);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Edit mode - immediate upload
    if (!eventId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Event ID is required for upload.',
      });
      setLocalPreview(null);
      return;
    }

    setUploading(true);

    try {
      // Delete existing image if there is one stored in our bucket
      if (currentImageUrl && currentImageUrl.includes('event-images')) {
        const urlParts = currentImageUrl.split('/event-images/');
        if (urlParts.length > 1) {
          const oldPath = urlParts[1].split('?')[0];
          await supabase.storage.from('event-images').remove([oldPath]);
        }
      }

      // Upload new image
      const fileExt = file.name.split('.').pop();
      const fileName = `${eventId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL with cache-busting param
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      // Add cache-busting parameter
      const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;
      
      onImageChange(cacheBustedUrl);
      
      // Clear local preview since we now have the uploaded URL
      setLocalPreview(null);
      
      toast({
        title: 'Image uploaded',
        description: 'Event image has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      // Revert to previous state on error
      setLocalPreview(null);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload image. Please try again.',
      });
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl && !localPreview) return;

    // If in create mode or only local preview exists, just clear locally
    if (createMode || (localPreview && !currentImageUrl)) {
      setLocalPreview(null);
      onFileSelect?.(null);
      onImageChange(null);
      return;
    }

    setUploading(true);

    try {
      // Only delete from storage if it's from our bucket
      if (currentImageUrl && currentImageUrl.includes('event-images')) {
        const urlParts = currentImageUrl.split('/event-images/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split('?')[0];
          await supabase.storage.from('event-images').remove([filePath]);
        }
      }

      setLocalPreview(null);
      onImageChange(null);
      
      toast({
        title: 'Image removed',
        description: 'Event image has been removed.',
      });
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to remove image',
        description: error.message || 'Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  // Determine what to display in the preview
  const displayUrl = localPreview || currentImageUrl;
  const hasImage = displayUrl && !imageError;

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Event Flyer / Image
      </Label>

      <div className="flex gap-4 items-start">
        {/* Image Preview */}
        <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
          {hasImage ? (
            <>
              {imageLoading && !localPreview && (
                <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <img
                src={displayUrl}
                alt="Event flyer"
                className="w-full h-full object-cover"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
              {uploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </>
          ) : imageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-2">
              <AlertCircle className="h-6 w-6 mb-1 text-destructive/70" />
              <span className="text-xs text-center leading-tight">Image failed to load</span>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 mb-1" />
                  <span className="text-xs">No image</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-8 text-xs"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5 mr-1.5" />
            )}
            {displayUrl ? 'Replace Image' : 'Upload Image'}
          </Button>

          {displayUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              disabled={uploading}
              className="h-8 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Remove
            </Button>
          )}

          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG, WebP or GIF. Max 5MB.
          </p>
        </div>
      </div>
    </div>
  );
}
