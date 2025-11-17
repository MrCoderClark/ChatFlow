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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';
import { toast } from 'sonner';
import { useState } from 'react';
import { useAttachmentUpload } from '@/hooks/use-attachment-upload';

interface iAppProps {
  channelId: string;
}

export const MessageInputForm = ({ channelId }: iAppProps) => {
  const queryClient = useQueryClient();
  const [editorKey, setEditorKey] = useState(0);
  const upload = useAttachmentUpload();

  const form = useForm({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      channelId: channelId,
      content: '',
      imageUrl: '',
    },
  });

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.message.list.key(),
        });

        // Reset form but keep channelId and clear imageUrl
        form.reset({ 
          channelId: channelId, 
          content: '',
          imageUrl: '',
        });

        // Clear upload state
        upload.setImageUrl(undefined);

        setEditorKey(k => k + 1);

        return toast.success('Message created successfully');
      },
      onError: () => {
        return toast.error('Failed to create message');
      },
    })
  );

  function onSubmit(data: CreateMessageSchemaType) {
    const currentValues = form.getValues();
    const effectiveImageUrl = data.imageUrl || currentValues.imageUrl || upload.imageUrl || '';

    const payload: CreateMessageSchemaType = {
      channelId: data.channelId,
      content: data.content,
      imageUrl: effectiveImageUrl,
    };

    console.log('MessageInputForm onSubmit raw data:', data);
    console.log('MessageInputForm onSubmit form values:', currentValues);
    console.log('MessageInputForm onSubmit upload.imageUrl:', upload.imageUrl);
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
                  onImageUploaded={url => {
                    console.log('MessageInputForm setting imageUrl via setValue:', url);
                    form.setValue('imageUrl', url, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                    console.log('MessageInputForm after setValue, form.getValues():', form.getValues());
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
