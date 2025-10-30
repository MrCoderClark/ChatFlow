'use client';

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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workspaceSchema, WorkspaceSchemaType } from '@/app/schemas/workspace';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';
import { toast } from 'sonner';

const CreateWorkspace = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: '',
    },
  });

  const createWorkspaceMutation = useMutation(
    orpc.workspace.create.mutationOptions({
      onSuccess: newWorkspace => {
        toast.success(
          `Workspace ${newWorkspace.workspaceName} created successfully`
        );

        queryClient.invalidateQueries({
          queryKey: orpc.workspace.list.queryKey(),
        });

        form.reset();
        setOpen(false);
      },
      onError: () => {
        toast.error('Failed to create workspace, try again!');
      },
    })
  );

  const onSubmit = (values: WorkspaceSchemaType) => {
    createWorkspaceMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-12 rounded-xl border-2 border-dashed border-b-muted-foreground/50 
              text-shadow-muted-foreground hover:border-muted-foreground hover:text-foreground hover:rounded-lg
              transition-all duration-200"
            >
              <Plus className="size-5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Create Workspace</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new worksoace to get started
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="My Workspace" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={createWorkspaceMutation.isPending} type="submit">
              {createWorkspaceMutation.isPending
                ? 'Creating...'
                : 'Create Workspace'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkspace;
