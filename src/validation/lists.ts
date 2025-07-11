import { z } from 'zod';

export const GetListsSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
});

export const CreateListSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  name: z.string().min(1, 'List name is required'),
  position: z.string().optional().default('bottom'),
});

export const UpdateListSchema = z.object({
  listId: z.string().min(1, 'List ID is required'),
  name: z.string().optional(),
  closed: z.boolean().optional(),
  position: z.number().optional(),
});
