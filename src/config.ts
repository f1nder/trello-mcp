import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const ConfigSchema = z.object({
  TRELLO_API_KEY: z.string().min(1, 'TRELLO_API_KEY is required'),
  TRELLO_TOKEN: z.string().min(1, 'TRELLO_TOKEN is required'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  API_TIMEOUT: z.string().transform(val => parseInt(val, 10)).pipe(z.number().positive()).default('10000'),
});

export type Config = z.infer<typeof ConfigSchema>;

function validateConfig(): Config {
  try {
    return ConfigSchema.parse({
      TRELLO_API_KEY: process.env.TRELLO_API_KEY,
      TRELLO_TOKEN: process.env.TRELLO_TOKEN,
      LOG_LEVEL: process.env.LOG_LEVEL,
      API_TIMEOUT: process.env.API_TIMEOUT,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

export const config = validateConfig();

export const TRELLO_BASE_URL = 'https://api.trello.com/1';