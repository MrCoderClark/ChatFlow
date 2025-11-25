import { SafeContent } from '@/components/richt-text-editor/SafeContent';
import { getAvatar } from '@/lib/get-avatar';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { MessageHoverToolbar } from '../toolbar';
import { EditMessage } from '../toolbar/EditMessage';
import { MessageListItem } from '@/lib/types';
import { MessageSquare } from 'lucide-react';
import { useThread } from '@/providers/ThreadProvider';
import { orpc } from '@/lib/orpc';
import { useQueryClient } from '@tanstack/react-query';

interface iAppProps {
  message: MessageListItem;
  currentUserId: string;
}

export const MessageItem = ({ message, currentUserId }: iAppProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(
    // Initialize with imageUrl for backward compatibility
    message.imageUrl || null
  );
  const [imageError, setImageError] = useState(false);

  // Fetch fresh signed URL when component mounts if fileId exists
  useEffect(() => {
    if (message.fileId) {
      console.log(
        'MessageItem: Fetching signed URL for fileId:',
        message.fileId
      );
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
        .catch(err => {
          console.error('MessageItem: Error fetching signed URL:', err);
          setImageError(true);
        });
    }
  }, [message.fileId]);

  const [isEditing, setIsEditing] = useState(false);
  const { openThread } = useThread();
  const queryClient = useQueryClient();

  const prefetchThread = useCallback(() => {
    const options = orpc.message.thread.list.queryOptions({
      input: {
        messageId: message.id,
      },
    });

    queryClient
      .prefetchQuery({ ...options, staleTime: 60_000 })
      .catch(() => {});
  }, [message.id, queryClient]);

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

        {isEditing ? (
          <EditMessage
            message={message}
            onCancel={() => setIsEditing(false)}
            onSave={() => setIsEditing(false)}
          />
        ) : (
          <>
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

            {message.repliesCount > 0 && (
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border cursor-pointer"
                onClick={() => openThread(message.id)}
                onMouseEnter={prefetchThread}
                onFocus={prefetchThread}
              >
                <MessageSquare className="size-3.5" />
                <span>
                  {message.repliesCount}{' '}
                  {message.repliesCount === 1 ? 'reply' : 'replies'}
                </span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                  View Thread
                </span>
              </button>
            )}
          </>
        )}
      </div>
      <MessageHoverToolbar
        messageId={message.id}
        canEdit={message.authorId === currentUserId}
        onEdit={() => setIsEditing(true)}
      />
    </div>
  );
};
