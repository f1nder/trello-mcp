import { Tool } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { TrelloClient } from "../trello-client.js";
import { UnknownToolError, errorHandler } from "../error-handler.js";
import {
  FetchAttachmentByUrlSchema,
  FetchImageByUrlSchema,
  DownloadAttachmentToPathSchema,
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
        name: "fetch_attachment_by_url",
        description:
          "Fetch any Trello attachment URL using OAuth headers and return the file contents as an embedded resource",
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
                "Optional friendly file name included in the returned resource metadata",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "download_attachment_to_path",
        description:
          "Download a Trello attachment to the specified local path and return metadata about the saved file",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The Trello attachment URL to fetch",
            },
            destinationPath: {
              type: "string",
              description:
                "The local file path (or directory) where the attachment should be written",
            },
            fileName: {
              type: "string",
              description:
                "Optional file name override when destinationPath points to a directory",
            },
          },
          required: ["url", "destinationPath"],
        },
      },
    ];
  },

  hasToolHandler(name: string): boolean {
    return [
      "fetch_image_by_url",
      "fetch_attachment_by_url",
      "download_attachment_to_path",
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
        case "fetch_attachment_by_url":
          return await this.fetchAttachmentByUrl(args, trelloClient);
        case "download_attachment_to_path":
          return await this.downloadAttachmentToPath(args, trelloClient);
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

  async fetchAttachmentByUrl(
    args: any,
    trelloClient: TrelloClient
  ): Promise<any> {
    const { url, fileName: providedFileName } =
      FetchAttachmentByUrlSchema.parse(args);
    const { data, mimeType: detectedMimeType, fileName: detectedFileName } =
      await trelloClient.fetchAttachment(url);

    const fallbackFileName = this.getFileNameFromUrl(url);
    const fileName = providedFileName || detectedFileName || fallbackFileName;
    const mimeType =
      detectedMimeType || this.getMimeTypeFromUrl(url, "application/octet-stream");

    return {
      content: [],
      structuredContent: {
        type: "attachment",
        uri: url,
        mimeType,
        fileName,
        data,
      },
    };
  },

  async downloadAttachmentToPath(
    args: any,
    trelloClient: TrelloClient
  ): Promise<any> {
    const { url, destinationPath, fileName: providedFileName } =
      DownloadAttachmentToPathSchema.parse(args);

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

    const absoluteDestination = path.isAbsolute(destinationPath)
      ? destinationPath
      : path.resolve(process.cwd(), destinationPath);

    const destinationIndicatesDirectory =
      destinationPath.endsWith("/") || destinationPath.endsWith("\\");

    let targetPath = absoluteDestination;

    try {
      const stat = await fs.stat(absoluteDestination);
      if (stat.isDirectory()) {
        targetPath = path.join(absoluteDestination, inferredFileName);
      }
    } catch (error: any) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
      if (destinationIndicatesDirectory) {
        targetPath = path.join(absoluteDestination, inferredFileName);
      }
    }

    const resolvedFileName = path.basename(targetPath);
    const resolvedMimeType =
      detectedMimeType ||
      this.getMimeTypeFromUrl(targetPath, "application/octet-stream");

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, data);
    const stats = await fs.stat(targetPath);

    return {
      content: [],
      structuredContent: {
        type: "attachment_download",
        uri: url,
        path: targetPath,
        fileName: resolvedFileName,
        mimeType: resolvedMimeType,
        size: stats.size,
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
