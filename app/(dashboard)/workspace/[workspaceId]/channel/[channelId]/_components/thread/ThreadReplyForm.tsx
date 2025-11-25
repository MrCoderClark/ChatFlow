'use client';

import {
  createMessageSchema,
  CreateMessageSchemaType,
} from '@/app/schemas/message';
import { Form, FormField, FormItem } from '@/components/ui/form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import MessageComposer from '../message/MessageComposer';
import { useAttachmentUpload } from '@/hooks/use-attachment-upload';
import { useEffect, useState } from 'react';
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';
import { toast } from 'sonner';
import { Message } from '@/lib/generated/prisma/client';
import { KindeUser } from '@kinde-oss/kinde-auth-nextjs';
import { getAvatar } from '@/lib/get-avatar';
import { MessageListItem } from '@/lib/types';

interface ThreadReplyFormProps {
  threadId: string;
  user: KindeUser<Record<string, unknown>>;
}

export function ThreadReplyForm({ threadId, user }: ThreadReplyFormProps) {
  const { channelId } = useParams<{ channelId: string }>();
  const upload = useAttachmentUpload();
  const [editorKey, setEditorKey] = useState(0);
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      content: '',
      channelId: channelId,
      imageUrl: '',
      fileId: '',
      threadId: threadId,
    },
  });

  useEffect(() => {
    form.setValue('threadId', threadId);
  }, [threadId, form]);

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onMutate: async data => {
        const listOptions = orpc.message.thread.list.queryOptions({
          input: {
            messageId: threadId,
          },
        });

        type MessagePage = {
          items: Array<MessageListItem>;
          nextCursor?: string;
        };

        type InfiniteMessages = InfiniteData<MessagePage>;

        await queryClient.cancelQueries({ queryKey: listOptions.queryKey });

        // Save previous data for rollback
        const previousData = queryClient.getQueryData(listOptions.queryKey);

        const optimistic: Message = {
          id: `optimistic:${crypto.randomUUID()}`,
          content: data.content,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: user.id,
          authorEmail: user.email!,
          authorName: user.given_name ?? 'Jane Doe',
          authorAvatar: getAvatar(user.picture, user.email!),
          channelId: data.channelId,
          threadId: data.threadId!,
          imageUrl: data.imageUrl ?? null,
          fileId: data.fileId ?? null,
        };
        queryClient.setQueryData(listOptions.queryKey, old => {
          if (!old) return old;

          return {
            ...old,
            messages: [...old.messages, optimistic],
          };
        });

        // Optimistically bump replyCounts in main message list for the parent message
        queryClient.setQueryData<InfiniteMessages>(
          ['message.list', channelId],
          old => {
            if (!old) return old;
            const pages = old.pages.map(page => ({
              ...page,
              items: page.items.map(m =>
                m.id === threadId
                  ? { ...m, repliesCount: m.repliesCount + 1 }
                  : m
              ),
            }));

            return {
              ...old,
              pages,
            };
          }
        );

        return { previousData, listOptions };
      },

      onSuccess: (_data, _vars, ctx) => {
        // Reset form
        form.reset({
          channelId: channelId,
          content: '',
          imageUrl: '',
          fileId: '',
          threadId: threadId,
        });

        // Clear upload state
        upload.clear();

        setEditorKey(k => k + 1);

        // Invalidate thread query to refetch messages
        queryClient.invalidateQueries({
          queryKey: ctx.listOptions.queryKey,
        });

        toast.success('Reply sent successfully!');
      },

      onError: (_error, _variables, context) => {
        // Rollback to previous data on error
        if (context?.previousData && context?.listOptions) {
          queryClient.setQueryData(
            context.listOptions.queryKey,
            context.previousData
          );
        }
        return toast.error('Failed to send reply. Please try again.');
      },
    })
  );

  function onSubmit(data: CreateMessageSchemaType) {
    const currentValues = form.getValues();
    const effectiveImageUrl =
      data.imageUrl || currentValues.imageUrl || upload.imageUrl || '';
    const effectiveFileId =
      data.fileId || currentValues.fileId || upload.fileId || '';

    const payload: CreateMessageSchemaType = {
      channelId: data.channelId,
      content: data.content,
      imageUrl: effectiveImageUrl,
      fileId: effectiveFileId,
      threadId: data.threadId,
    };

    createMessageMutation.mutate(payload);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <MessageComposer
                value={field.value}
                onChange={field.onChange}
                upload={upload}
                key={editorKey}
                onSubmit={() => onSubmit(form.getValues())}
                isSubmitting={createMessageMutation.isPending}
                onImageUploaded={(fileId, previewUrl) => {
                  form.setValue('fileId', fileId, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                  form.setValue('imageUrl', previewUrl, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }}
              />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
