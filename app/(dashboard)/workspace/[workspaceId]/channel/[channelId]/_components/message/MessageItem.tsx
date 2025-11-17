import { SafeContent } from '@/components/richt-text-editor/SafeContent';
import { Message } from '@/lib/generated/prisma/client';
import { getAvatar } from '@/lib/get-avatar';
import Image from 'next/image';

interface iAppProps {
  message: Message;
}

export const MessageItem = ({ message }: iAppProps) => {
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

        {message.imageUrl ? (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.imageUrl}
              alt="Attachment"
              className="max-auto max-h-80 rounded-md object-contain"
              width={512}
              height={512}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
