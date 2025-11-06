'use client';

// @react-compiler-skip

import {
  ChannelNameSchema,
  ChannelNameSchemaType,
  transformChannelName,
} from '@/app/schemas/channel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { orpc } from '@/lib/orpc';
import { zodResolver } from '@hookform/resolvers/zod';
import { isDefinedError } from '@orpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export const CreateNewChannel = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [nameValue, setNameValue] = useState('');

  const { workspaceId } = useParams<{ workspaceId: string }>();

  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(ChannelNameSchema),
    defaultValues: {
      name: '',
    },
  });

  const createChannelMutation = useMutation(
    orpc.channel.create.mutationOptions({
      onSuccess: newChannel => {
        toast.success(`Channel ${newChannel.name} created successfully`);

        queryClient.invalidateQueries({
          queryKey: orpc.channel.list.queryKey(),
        });

        form.reset();
        setOpen(false);

        router.push(`/workspace/${workspaceId}/channel/${newChannel.id}`);
      },
      onError: error => {
        if (isDefinedError(error)) {
          toast.error(error.message);
          return;
        }

        toast.error('Failed to create channel. Please try again.');
      },
    })
  );

  function onSubmit(values: ChannelNameSchemaType) {
    createChannelMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={'outline'} className="w-full">
          <Plus className="size-4" />
          Add Channel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Create new Channel to get started!
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Channel"
                      {...field}
                      onChange={e => {
                        field.onChange(e);
                        setNameValue(e.target.value);
                      }}
                    />
                  </FormControl>
                  {nameValue &&
                    transformChannelName(nameValue) !== nameValue && (
                      <p>
                        Will be created as:{' '}
                        <code>{transformChannelName(nameValue)}</code>
                      </p>
                    )}
                </FormItem>
              )}
            />

            <Button
              disabled={createChannelMutation.isPending}
              type="submit"
              className="mt-5"
            >
              {createChannelMutation.isPending
                ? 'Creating...'
                : 'Create New Channel'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
