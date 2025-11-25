import { Button } from '@/components/ui/button';
import { ChevronDown, MessageSquare, X } from 'lucide-react';
import Image from 'next/image';
import { ThreadReply } from './ThreadReply';
import { ThreadReplyForm } from './ThreadReplyForm';
import { useThread } from '@/providers/ThreadProvider';
import { orpc } from '@/lib/orpc';
import { useQuery } from '@tanstack/react-query';
import { SafeContent } from '@/components/richt-text-editor/SafeContent';
import { KindeUser } from '@kinde-oss/kinde-auth-nextjs';
import { ThreadSidebarSkeleton } from './ThreadSidebarSkeleton';
import { useEffect, useRef, useState } from 'react';

interface ThreadSidebarProps {
  user: KindeUser<Record<string, unknown>>;
}

export function ThreadSidebar({ user }: ThreadSidebarProps) {
  const { selectedThreadId, closeThread } = useThread();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const lastMessageCountRef = useRef(0);

  const { data, isLoading } = useQuery(
    orpc.message.thread.list.queryOptions({
      input: {
        messageId: selectedThreadId!,
      },
      queryOptions: {
        enabled: !!selectedThreadId,
      },
    })
  );

  const parent = data?.parent;
  const messages = data?.messages ?? [];

  const messageCount = data?.messages.length ?? 0;

  const isNearBottom = (el: HTMLDivElement) =>
    el.scrollHeight - el.scrollTop - el.clientHeight <= 80;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    setIsAtBottom(isNearBottom(el));
  };

  // Initial scroll to bottom when thread first loads
  useEffect(() => {
    if (data && bottomRef.current) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ block: 'end' });
        setIsAtBottom(true);
      });
    }
  }, [data?.parent?.id]); // Only run when thread changes

  useEffect(() => {
    if (messageCount === 0) return;

    const prevMessageCount = lastMessageCountRef.current;
    const el = scrollRef.current;

    // Always scroll on new messages if we're near bottom OR if this is the first message
    if (messageCount !== prevMessageCount) {
      const shouldScroll = prevMessageCount === 0 || (el && isNearBottom(el));

      if (shouldScroll) {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({
            block: 'end',
            behavior: prevMessageCount === 0 ? 'auto' : 'smooth',
          });
          setIsAtBottom(true);
        });
      }
    }

    lastMessageCountRef.current = messageCount;
  }, [messageCount]);

  // Keep view pinned to bottom on late content growth (e.g. images)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollToBottomIfNeeded = () => {
      if (isAtBottom) {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ block: 'end' });
        });
      }
    };

    const onImageLoad = (e: Event) => {
      if (e.target instanceof HTMLImageElement) {
        scrollToBottomIfNeeded();
      }
    };

    el.addEventListener('load', onImageLoad, true);

    // ResizeObserver watches for size changes in the container
    const resizeObserver = new ResizeObserver(() => {
      scrollToBottomIfNeeded();
    });

    resizeObserver.observe(el);

    // MutationObserver watches for DOM changes (e.g., images loading, content updates)
    const mutationObserver = new MutationObserver(() => {
      scrollToBottomIfNeeded();
    });

    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    return () => {
      resizeObserver.disconnect();
      el.removeEventListener('load', onImageLoad, true);
      mutationObserver.disconnect();
    };
  }, [isAtBottom]);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;

    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });

    setIsAtBottom(true);
  };

  if (isLoading) {
    return <ThreadSidebarSkeleton />;
  }

  return (
    <div className="w-[30rem] border-l flex flex-col h-full">
      {/* Header */}
      <div className="border-b h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4" />
          <span>Thread</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={closeThread}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto"
        >
          {data && (
            <>
              <div className="p-4 border-b bg-muted/20">
                <div className="flex space-x-3">
                  <Image
                    src={data.parent.authorAvatar}
                    alt="Member Avatar"
                    width={32}
                    height={32}
                    className="size-8 rounded-full shrink-0"
                  />
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {data.parent.authorName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat('en-US', {
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: true,
                          month: 'short',
                          day: 'numeric',
                        }).format(new Date(data.parent.createdAt))}
                      </span>
                    </div>

                    <SafeContent
                      className="text-sm break-words prose dark:prose-invert max-w-none"
                      content={data.parent.content as unknown as any}
                    />
                  </div>
                </div>
              </div>
              {/* Thread Replies */}
              <div className="p-2">
                <p className="text-xs text-muted-foreground mb-3 px-2">
                  {messages.length}{' '}
                  {messages.length === 1 ? 'reply' : 'replies'}
                </p>

                <div className="space-y-1">
                  {messages.map(reply => (
                    <ThreadReply key={reply.id} message={reply} />
                  ))}
                </div>
              </div>

              <div ref={bottomRef}></div>
            </>
          )}
        </div>
        {/* Scroll to bottom button */}
        {!isAtBottom && (
          <Button
            type="button"
            size="sm"
            className="absolute bottom-4 right-5 z-20 size-10 rounded-full hover:shadow-xl transistion-all duration-200"
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="size-4" />
          </Button>
        )}
      </div>

      {/* Thread reply from */}
      <div className="border-t p-4">
        <ThreadReplyForm threadId={selectedThreadId!} user={user} />
      </div>
    </div>
  );
}
