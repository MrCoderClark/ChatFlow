import { RichTextEditor } from '@/components/richt-text-editor/Editor';
import { ImageUploadModal } from '@/components/richt-text-editor/ImageUploadModal';
import { Button } from '@/components/ui/button';
import { UseAttachmentUploadType } from '@/hooks/use-attachment-upload';
import { ImageIcon, Send, X } from 'lucide-react';
import Image from 'next/image';

interface iAppProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  upload: UseAttachmentUploadType;
  onImageUploaded?: (fileId: string, previewUrl: string) => void;
}

export const MessageComposer = ({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  upload,
  onImageUploaded,
}: iAppProps) => {
  const handleImageUploaded = (fileId: string, previewUrl: string) => {
    console.log('MessageComposer.handleImageUploaded fileId:', fileId, 'previewUrl:', previewUrl);
    upload.setImageUrl(previewUrl); // Store preview URL for display
    upload.setFileId(fileId); // Store fileId for database

    if (onImageUploaded) {
      console.log('MessageComposer calling parent onImageUploaded with fileId:', fileId);
      onImageUploaded(fileId, previewUrl);
    }

    // FileId is stored for database, previewUrl is used for immediate display
    // Fresh signed URLs will be fetched when displaying saved messages
  };

  const handleRemoveImage = () => {
    upload.setImageUrl(undefined);
    upload.setFileId(undefined);
  };

  return (
    <>
      <RichTextEditor
        field={{ value, onChange }}
        sendButton={
          <Button
            disabled={isSubmitting}
            type="button"
            size="sm"
            onClick={onSubmit}
          >
            <Send className="size-4 mr-1" />
            Send
          </Button>
        }
        footerLeft={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => upload.setIsOpen(true)}
          >
            <ImageIcon className="size-4 mr-1" />
            Attach
          </Button>
        }
      />

      {/* Image preview indicator */}
      {upload.imageUrl && (
        <div className="mt-2 p-3 border border-border rounded-lg bg-muted/50 flex items-center gap-3">
          <div className="relative w-16 h-16 rounded overflow-hidden bg-background border border-border shrink-0">
            <Image
              src={upload.imageUrl}
              alt="Attached image"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Image attached</p>
            <p className="text-xs text-muted-foreground">Ready to send</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleRemoveImage}
            className="shrink-0"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      <ImageUploadModal
        open={upload.isOpen}
        onOpenChange={upload.setIsOpen}
        onImageUploaded={handleImageUploaded}
      />
    </>
  );
};

export default MessageComposer;
