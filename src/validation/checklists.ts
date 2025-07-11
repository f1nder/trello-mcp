import { z } from 'zod';

export const GetCardChecklistsSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
});

export const CreateChecklistSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  name: z.string().min(1, 'Checklist name is required'),
});

export const AddChecklistItemSchema = z.object({
  checklistId: z.string().min(1, 'Checklist ID is required'),
  name: z.string().min(1, 'Item name is required'),
  position: z.string().optional().default('bottom'),
});

export const UpdateChecklistItemSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  itemId: z.string().min(1, 'Item ID is required'),
  state: z.enum(['complete', 'incomplete']),
});

export const DeleteChecklistSchema = z.object({
  checklistId: z.string().min(1, 'Checklist ID is required'),
});
