import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { imageTools } from '../src/tools/images';
import { TrelloClient } from '../src/trello-client';

jest.mock('../src/trello-client');

const mockTrelloClient = new TrelloClient() as jest.Mocked<TrelloClient>;

describe('Image and Attachment Tools', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetch_image_by_url', () => {
    it('returns image content with base64-encoded payload', async () => {
      const mockBuffer = Buffer.from('image-data');
      mockTrelloClient.fetchAttachmentImage.mockResolvedValue(mockBuffer);

      const args = { url: 'https://example.com/path/picture.png' };
      const result = await imageTools.handleToolCall(
        'fetch_image_by_url',
        args,
        mockTrelloClient
      );

      expect(mockTrelloClient.fetchAttachmentImage).toHaveBeenCalledWith(
        args.url
      );
      expect(result.content[0]).toEqual({
        type: 'image',
        data: mockBuffer.toString('base64'),
        mimeType: 'image/png',
      });
    });
  });

  describe('fetch_attachment_by_url', () => {
    it('returns embedded resource with fetched metadata when available', async () => {
      const mockBuffer = Buffer.from('file-data');
      mockTrelloClient.fetchAttachment.mockResolvedValue({
        data: mockBuffer,
        mimeType: 'application/pdf',
        fileName: 'report.pdf',
      });

      const args = { url: 'https://example.com/files/report.pdf' };
      const result = await imageTools.handleToolCall(
        'fetch_attachment_by_url',
        args,
        mockTrelloClient
      );

      expect(mockTrelloClient.fetchAttachment).toHaveBeenCalledWith(args.url);
      expect(result.content).toEqual([]);
      expect(result.structuredContent).toMatchObject({
        type: 'attachment',
        uri: args.url,
        mimeType: 'application/pdf',
        fileName: 'report.pdf',
      });
      expect(result.structuredContent?.data).toBe(mockBuffer);
    });

    it('falls back to provided values and defaults when metadata missing', async () => {
      const mockBuffer = Buffer.from('binary-data');
      mockTrelloClient.fetchAttachment.mockResolvedValue({
        data: mockBuffer,
      });

      const args = {
        url: 'https://trello-attachments.s3.amazonaws.com/some/path/resource',
        fileName: 'download.bin',
      };
      const result = await imageTools.handleToolCall(
        'fetch_attachment_by_url',
        args,
        mockTrelloClient
      );

      expect(mockTrelloClient.fetchAttachment).toHaveBeenCalledWith(args.url);
      expect(result.content).toEqual([]);
      expect(result.structuredContent).toMatchObject({
        type: 'attachment',
        uri: args.url,
        mimeType: 'application/octet-stream',
        fileName: 'download.bin',
      });
      expect(result.structuredContent?.data).toBe(mockBuffer);
    });
  });

  describe('download_attachment_to_path', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'trello-mcp-'));
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('writes the attachment to the specified file path and returns metadata', async () => {
      const mockBuffer = Buffer.from('file-binary');
      mockTrelloClient.fetchAttachment.mockResolvedValue({
        data: mockBuffer,
        mimeType: 'application/octet-stream',
        fileName: 'remote.bin',
      });

      const destinationPath = path.join(tempDir, 'local.bin');
      const args = { url: 'https://example.com/files/remote.bin', destinationPath };

      const result = await imageTools.handleToolCall(
        'download_attachment_to_path',
        args,
        mockTrelloClient
      );

      const written = await fs.readFile(destinationPath);
      expect(written.equals(mockBuffer)).toBe(true);
      expect(result.content).toEqual([]);
      expect(result.structuredContent).toMatchObject({
        type: 'attachment_download',
        uri: args.url,
        path: destinationPath,
        fileName: 'local.bin',
        mimeType: 'application/octet-stream',
      });
      expect(result.structuredContent?.size).toBe(mockBuffer.length);
    });

    it('treats destination as directory and derives file name', async () => {
      const mockBuffer = Buffer.from('pdf-data');
      mockTrelloClient.fetchAttachment.mockResolvedValue({
        data: mockBuffer,
        mimeType: 'application/pdf',
        fileName: 'remote.pdf',
      });

      const destinationDir = path.join(tempDir, 'nested');
      const args = {
        url: 'https://example.com/files/report.pdf',
        destinationPath: `${destinationDir}${path.sep}`,
      };

      const result = await imageTools.handleToolCall(
        'download_attachment_to_path',
        args,
        mockTrelloClient
      );

      const expectedPath = path.join(destinationDir, 'remote.pdf');
      const written = await fs.readFile(expectedPath);
      expect(written.equals(mockBuffer)).toBe(true);
      expect(result.structuredContent).toMatchObject({
        path: expectedPath,
        fileName: 'remote.pdf',
        mimeType: 'application/pdf',
      });
    });
  });
});
