'use client';

import {
  createMessageSchema,
  CreateMessageSchemaType,
} from '@/app/schemas/message';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import MessageComposer from './MessageComposer';
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';
import { toast } from 'sonner';
import { useState } from 'react';
import { useAttachmentUpload } from '@/hooks/use-attachment-upload';
import { Message } from '@/lib/generated/prisma/client';
import { KindeUser } from '@kinde-oss/kinde-auth-nextjs';
import { getAvatar } from '@/lib/get-avatar';

interface iAppProps {
  channelId: string;
  user: KindeUser<Record<string, unknown>>;
}

type MessagePage = { items: Message[]; nextCursor?: string };
type InfiniteMessages = InfiniteData<MessagePage>;

export const MessageInputForm = ({ channelId, user }: iAppProps) => {
  const queryClient = useQueryClient();
  const [editorKey, setEditorKey] = useState(0);
  const upload = useAttachmentUpload();

  const form = useForm({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      channelId: channelId,
      content: '',
      imageUrl: '',
      fileId: '',
    },
  });

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onMutate: async data => {
        await queryClient.cancelQueries({
          queryKey: ['message.list', channelId],
        });

        const previousData = queryClient.getQueryData<InfiniteMessages>([
          'message.list',
          channelId,
        ]);

        const tempId = `optimistic-${crypto.randomUUID()}`;

        const optimisticMessage: Message = {
          id: tempId,
          fileId: data.fileId ?? null,
          content: data.content,
          imageUrl: data.imageUrl ?? null,
          threadId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: user.id,
          authorEmail: user.email!,
          authorName: user.given_name ?? 'Jane Doe',
          authorAvatar: getAvatar(user.picture, user.email!),
          channelId: data.channelId,
        };

        queryClient.setQueryData<InfiniteMessages>(
          ['message.list', channelId],
          old => {
            if (!old) {
              return {
                pages: [
                  {
                    items: [optimisticMessage],
                    nextCursor: undefined,
                  },
                ],
                pageParams: [undefined],
              } satisfies InfiniteMessages;
            }

            const firstPage = old.pages[0] ?? {
              items: [],
              nextCursor: undefined,
            };

            const updatedFirstPage: MessagePage = {
              ...firstPage,
              items: [optimisticMessage, ...firstPage.items],
            };

            return {
              ...old,
              pages: [updatedFirstPage, ...old.pages.slice(1)],
            };
          }
        );

        return { previousData, tempId };
      },

      onSuccess: (data, _variables, context) => {
        queryClient.setQueryData<InfiniteMessages>(
          ['message.list', channelId],
          old => {
            if (!old) return old;

            const updatedPages = old.pages.map(page => ({
              ...page,
              items: page.items.map(m =>
                m.id === context.tempId
                  ? {
                      ...data,
                    }
                  : m
              ),
            }));

            return { ...old, pages: updatedPages };
          }
        );

        // Reset form but keep channelId and clear imageUrl and fileId
        form.reset({
          channelId: channelId,
          content: '',
          imageUrl: '',
          fileId: '',
        });

        // Clear upload state
        upload.clear();

        setEditorKey(k => k + 1);

        return toast.success('Message created successfully');
      },
      onError: (_err, _variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(
            ['message.list', channelId],
            context.previousData
          );
        }
        return toast.error('Failed to create message');
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
    };

    console.log('MessageInputForm onSubmit raw data:', data);
    console.log('MessageInputForm onSubmit form values:', currentValues);
    console.log('MessageInputForm onSubmit upload.imageUrl:', upload.imageUrl);
    console.log('MessageInputForm onSubmit upload.fileId:', upload.fileId);
    console.log('MessageInputForm onSubmit final payload:', payload);

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
              <FormControl>
                <MessageComposer
                  key={editorKey}
                  value={field.value}
                  onChange={field.onChange}
                  onSubmit={() => onSubmit(form.getValues())}
                  isSubmitting={createMessageMutation.isPending}
                  upload={upload}
                  onImageUploaded={(fileId, previewUrl) => {
                    console.log(
                      'MessageInputForm setting fileId:',
                      fileId,
                      'imageUrl:',
                      previewUrl
                    );
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
                    console.log(
                      'MessageInputForm after setValue, form.getValues():',
                      form.getValues()
                    );
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
