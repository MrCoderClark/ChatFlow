import z from 'zod';

export const createMessageSchema = z.object({
  channelId: z.string(),
  content: z.string(),
  imageUrl: z.string().optional(), // Deprecated: kept for backward compatibility
  fileId: z.string().optional(), // UploadMe file ID
});

export const updateMessageSchema = z.object({
  messagelId: z.string(),
  content: z.string(),
});

export type CreateMessageSchemaType = z.infer<typeof createMessageSchema>;
export type UpdateMessageSchemaType = z.infer<typeof updateMessageSchema>;
