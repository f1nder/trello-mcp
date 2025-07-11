import { z } from 'zod';

export const GetCardsSchema = z.object({
  boardId: z.string().optional(),
  listId: z.string().optional(),
}).refine(data => data.boardId || data.listId, {
  message: 'Either boardId or listId must be provided',
});

export const GetCardSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
});

export const CreateCardSchema = z.object({
  listId: z.string().min(1, 'List ID is required'),
  name: z.string().min(1, 'Card name is required'),
  description: z.string().optional(),
  due: z.string().optional(),
  position: z.string().optional().default('bottom'),
});

export const UpdateCardSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  name: z.string().optional(),
  description: z.string().optional(),
  due: z.string().optional(),
  dueComplete: z.boolean().optional(),
  closed: z.boolean().optional(),
});

export const MoveCardSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  listId: z.string().min(1, 'Target list ID is required'),
  position: z.string().optional().default('bottom'),
});

export const DeleteCardSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
});

export const CardMemberSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  memberId: z.string().min(1, 'Member ID is required'),
});
