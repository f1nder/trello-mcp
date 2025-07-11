import { z } from 'zod';

export const GetLabelsSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
});

export const CreateLabelSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  name: z.string().min(1, 'Label name is required'),
  color: z.enum([
    'yellow', 'purple', 'blue', 'red', 'green', 'orange', 'black', 'sky', 'pink', 'lime'
  ]),
});

export const CardLabelSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  labelId: z.string().min(1, 'Label ID is required'),
});
