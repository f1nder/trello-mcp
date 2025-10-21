import { z } from "zod";

const FetchByUrlSchema = z.object({
  url: z.string().url("Valid URL is required"),
  fileName: z.string().optional(),
});

export const FetchImageByUrlSchema = FetchByUrlSchema;
export const FetchAttachmentByUrlSchema = FetchByUrlSchema;
export const DownloadAttachmentToPathSchema = FetchByUrlSchema.extend({
  destinationPath: z
    .string()
    .min(1, "A destination path is required to download the attachment"),
});

export type FetchImageByUrlInput = z.infer<typeof FetchImageByUrlSchema>;
export type FetchAttachmentByUrlInput = z.infer<
  typeof FetchAttachmentByUrlSchema
>;
export type DownloadAttachmentToPathInput = z.infer<
  typeof DownloadAttachmentToPathSchema
>;
