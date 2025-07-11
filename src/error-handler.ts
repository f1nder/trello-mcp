import { ZodError } from 'zod';

export class UnknownToolError extends Error {
  constructor(toolName: string) {
    super(`Unknown tool: ${toolName}`);
    this.name = 'UnknownToolError';
  }
}

export class ToolCallError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolCallError';
  }
}

export const errorHandler = (error: any) => {
  if (error instanceof ZodError) {
    return {
      isError: true,
      message: 'Invalid arguments for tool',
      errors: error.errors,
    };
  }

  if (error instanceof UnknownToolError || error instanceof ToolCallError) {
    return {
      isError: true,
      message: error.message,
    };
  }

  return {
    isError: true,
    message: 'An unexpected error occurred',
  };
};
