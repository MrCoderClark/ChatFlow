import { SafeContent } from '@/components/richt-text-editor/SafeContent';
import { Message } from '@/lib/generated/prisma/client';
import { getAvatar } from '@/lib/get-avatar';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface iAppProps {
  message: Message;
}

export const MessageItem = ({ message }: iAppProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(
    // Initialize with imageUrl for backward compatibility
    message.imageUrl || null
  );
  const [imageError, setImageError] = useState(false);

  // Fetch fresh signed URL when component mounts if fileId exists
  useEffect(() => {
    if (message.fileId) {
      console.log('MessageItem: Fetching signed URL for fileId:', message.fileId);
      fetch(`/api/uploadme/files/${message.fileId}/url`)
        .then(res => {
          console.log('MessageItem: Response status:', res.status);
          return res.json();
        })
        .then(data => {
          console.log('MessageItem: Response data:', data);
          if (data.url) {
            console.log('MessageItem: Setting signed URL:', data.url);
            setSignedUrl(data.url);
          } else {
            console.error('MessageItem: No URL in response');
            setImageError(true);
          }
        })
        .catch((err) => {
          console.error('MessageItem: Error fetching signed URL:', err);
          setImageError(true);
        });
    }
  }, [message.fileId]);
  return (
    <div className="flex space-x-3 relative p-3 rounded-lg group hover:bg-muted/50">
      <Image
        src={getAvatar(message.authorAvatar, message.authorEmail)}
        alt="User Avatar"
        width={32}
        height={32}
        className="size-8 rounded-lg"
      />

      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center gap-x-2">
          <p className="font-medium leading-none">{message.authorName}</p>
          <p className="text-xs text-muted-foreground leading-none">
            {new Intl.DateTimeFormat('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
            }).format(message.createdAt)}{' '}
            {new Intl.DateTimeFormat('en-US', {
              hour12: true,
              hour: '2-digit',
              minute: '2-digit',
            }).format(message.createdAt)}
          </p>
        </div>

        <SafeContent
          className="text-sm break-words prose dark:prose-invert max-w-none mark:text-primary"
          content={message.content as unknown as any}
        />

        {(signedUrl || message.imageUrl) && !imageError ? (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signedUrl || message.imageUrl || ''}
              alt="Attachment"
              className="max-w-sm max-h-96 rounded-lg border border-border object-contain"
              onError={() => setImageError(true)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
