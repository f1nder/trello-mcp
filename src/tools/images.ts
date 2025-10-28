import { Tool } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import os from "node:os";
import { TrelloClient } from "../trello-client.js";
import { UnknownToolError, errorHandler } from "../error-handler.js";
import {
  FetchImageByUrlSchema,
  DownloadAttachmentToTmpSchema,
} from "../validation/images.js";

export const imageTools = {
  getToolDefinitions(): Tool[] {
    return [
      {
        name: "fetch_image_by_url",
        description:
          "Fetch a single image from a Trello attachment URL using OAuth headers and return raw binary",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The Trello attachment URL to fetch",
            },
            fileName: {
              type: "string",
              description: "Optional friendly file name for the returned image",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "download_attachment_to_tmp",
        description:
          "Download a Trello attachment to a temporary system directory and return its path and mime type",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The Trello attachment URL to fetch",
            },
            fileName: {
              type: "string",
              description:
                "Optional file name override for the downloaded attachment",
            },
          },
          required: ["url"],
        },
      },
    ];
  },

  hasToolHandler(name: string): boolean {
    return [
      "fetch_image_by_url",
      "download_attachment_to_tmp",
    ].includes(name);
  },

  async handleToolCall(
    name: string,
    args: any,
    trelloClient: TrelloClient
  ): Promise<any> {
    try {
      switch (name) {
        case "fetch_image_by_url":
          return await this.fetchImageByUrl(args, trelloClient);
        case "download_attachment_to_tmp":
          return await this.downloadAttachmentToTmp(args, trelloClient);
        default:
          throw new UnknownToolError(name);
      }
    } catch (error) {
      return errorHandler(error);
    }
  },

  async fetchImageByUrl(args: any, trelloClient: TrelloClient): Promise<any> {
    const { url } = FetchImageByUrlSchema.parse(args);
    const imageBuffer = await trelloClient.fetchAttachmentImage(url);

    // Convert buffer to base64
    const base64Data = imageBuffer.toString("base64");

    // Detect mime type from URL extension
    const mimeType = this.getMimeTypeFromUrl(url, "image/jpeg");

    return {
      content: [
        {
          type: "image",
          data: base64Data,
          mimeType,
        },
      ],
    };
  },
  async downloadAttachmentToTmp(
    args: any,
    trelloClient: TrelloClient
  ): Promise<any> {
    const { url, fileName: providedFileName } =
      DownloadAttachmentToTmpSchema.parse(args);

    const {
      data,
      mimeType: detectedMimeType,
      fileName: detectedFileName,
    } = await trelloClient.fetchAttachment(url);

    const inferredFileName =
      providedFileName ||
      detectedFileName ||
      this.getFileNameFromUrl(url) ||
      "attachment";

    const tempDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "trello-mcp-")
    );
    const targetPath = path.join(tempDirectory, inferredFileName);

    const resolvedMimeType =
      detectedMimeType ||
      this.getMimeTypeFromUrl(targetPath, "application/octet-stream");

    await fs.writeFile(targetPath, data);

    return {
      content: [],
      structuredContent: {
        type: "attachment_download",
        path: targetPath,
        mimeType: resolvedMimeType,
      },
    };
  },

  getMimeTypeFromUrl(url: string, defaultMimeType = "application/octet-stream"): string {
    const fileName = this.getFileNameFromUrl(url) || url;
    const extension = fileName.split(".").pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      bmp: "image/bmp",
      tiff: "image/tiff",
      ico: "image/x-icon",
      pdf: "application/pdf",
      txt: "text/plain",
      csv: "text/csv",
      json: "application/json",
      md: "text/markdown",
      doc: "application/msword",
      docx:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      zip: "application/zip",
      rar: "application/vnd.rar",
      "7z": "application/x-7z-compressed",
      tar: "application/x-tar",
      gz: "application/gzip",
      mp4: "video/mp4",
      mov: "video/quicktime",
      avi: "video/x-msvideo",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      heic: "image/heic",
    };
    return mimeTypes[extension || ""] || defaultMimeType;
  },

  getFileNameFromUrl(url: string): string | undefined {
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments.length === 0) {
        return undefined;
      }
      const lastSegment = segments[segments.length - 1];
      if (!lastSegment) {
        return undefined;
      }
      return decodeURIComponent(lastSegment);
    } catch {
      return undefined;
    }
  },
};
