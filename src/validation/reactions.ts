import { z } from 'zod';

export const GetActionReactionsSchema = z.object({
  actionId: z.string().min(1, 'Action ID is required'),
});

export const CreateActionReactionSchema = z
  .object({
    actionId: z.string().min(1, 'Action ID is required'),
    shortName: z.string().trim().min(1, 'shortName cannot be empty').optional(),
    unified: z.string().trim().min(1, 'unified cannot be empty').optional(),
    native: z.string().trim().min(1, 'native cannot be empty').optional(),
    skinVariation: z.string().trim().min(1, 'skinVariation cannot be empty').optional(),
  })
  .refine(
    ({ shortName, unified, native }) => Boolean(shortName || unified || native),
    {
      message: 'Provide at least one of shortName, unified, or native to identify the emoji',
      path: ['shortName'],
    }
  );

export const DeleteActionReactionSchema = z.object({
  actionId: z.string().min(1, 'Action ID is required'),
  reactionId: z.string().min(1, 'Reaction ID is required'),
});
