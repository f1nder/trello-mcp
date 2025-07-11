import { z } from 'zod';

export const GetBoardSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
});

export const GetBoardMembersSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
});
