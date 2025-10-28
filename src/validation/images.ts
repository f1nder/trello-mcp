import { z } from "zod";

const FetchByUrlSchema = z.object({
  url: z.string().url("Valid URL is required"),
  fileName: z.string().optional(),
});

export const FetchImageByUrlSchema = FetchByUrlSchema;
export const DownloadAttachmentToTmpSchema = FetchByUrlSchema;

export type FetchImageByUrlInput = z.infer<typeof FetchImageByUrlSchema>;
export type DownloadAttachmentToTmpInput = z.infer<
  typeof DownloadAttachmentToTmpSchema
>;
