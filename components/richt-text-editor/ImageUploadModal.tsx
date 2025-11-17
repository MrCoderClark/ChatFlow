import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Upload, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageUploaded?: (url: string) => void;
}

export function ImageUploadModal({
  open,
  onOpenChange,
  onImageUploaded,
}: ImageUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const nextFile = acceptedFiles[0];
    if (nextFile) {
      setFile(nextFile);
      setError(null);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(nextFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB    
  });

  const handleUpload = async () => {
    if (!file) {
      setError('Please choose a file first.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      // 1) Upload the file via chatflow's API, which uses the UploadMe Node SDK
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 429) {
          const errorData = await response.json();
          setError(errorData.error || 'Too many uploads. Please wait a moment and try again.');
        } else {
          setError('Failed to upload image.');
        }
        return;
      }

      const data = await response.json();
      const uploadedFile = data?.file;
      const fileId: string | undefined = uploadedFile?.id;
      const fallbackUrl: string | undefined = uploadedFile?.url;

      console.log('ImageUploadModal uploaded file response:', data);
      console.log('ImageUploadModal resolved file id:', fileId);

      if (!fileId) {
        // No file ID, but if we at least have a URL from the API response, use it
        if (fallbackUrl && onImageUploaded) {
          console.warn('UploadMe response missing file ID, using fallback URL');
          onImageUploaded(fallbackUrl);
          // Close modal and reset state
          handleClose();
        } else {
          setError('Upload succeeded but no file ID was returned.');
        }
        return;
      }

      let finalUrl: string | undefined;

      try {
        // 2) Try to fetch a signed URL via chatflow proxy, which calls UploadMe /files/:id/url
        const signedUrlResponse = await fetch(
          `/api/uploadme/files/${fileId}/url`
        );

        if (signedUrlResponse.ok) {
          const signedUrlData = await signedUrlResponse.json();
          const signedUrl: string | undefined = signedUrlData?.url;

          console.log('ImageUploadModal signed URL response:', signedUrlData);
          console.log('ImageUploadModal resolved signed url:', signedUrl);

          finalUrl = signedUrl || fallbackUrl;
        } else {
          console.warn(
            'Failed to get signed URL, falling back to original URL'
          );
          finalUrl = fallbackUrl;
        }
      } catch (signedUrlError) {
        console.warn(
          'Error while fetching signed URL, falling back to original URL',
          signedUrlError
        );
        finalUrl = fallbackUrl;
      }

      if (!finalUrl) {
        setError('Could not resolve an image URL.');
        return;
      }

      if (onImageUploaded) {
        onImageUploaded(finalUrl);
      }

      // Close modal and reset state after successful upload
      handleClose();
    } catch {
      setError('Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setIsUploading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload an image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone area */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors bg-card
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <input {...getInputProps()} />
            
            {preview ? (
              <div className="space-y-3">
                <div className="relative w-full h-48 rounded overflow-hidden bg-muted">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {file?.name} ({(file!.size / 1024).toFixed(1)} KB)
                </p>
                <p className="text-xs text-muted-foreground">
                  Click or drag to replace
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center">
                  {isDragActive ? (
                    <ImageIcon className="size-12 text-primary" />
                  ) : (
                    <Upload className="size-12 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {isDragActive ? 'Drop image here' : 'Drag & drop an image here'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse (max 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleUpload} 
              disabled={isUploading || !file}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isUploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
