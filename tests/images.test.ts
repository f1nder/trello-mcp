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

  describe('download_attachment_to_tmp', () => {
    it('downloads to tmp dir and returns path with mime type', async () => {
      const mockBuffer = Buffer.from('file-binary');
      mockTrelloClient.fetchAttachment.mockResolvedValue({
        data: mockBuffer,
        mimeType: 'application/octet-stream',
        fileName: 'remote.bin',
      });

      const args = { url: 'https://example.com/files/remote.bin' };

      const result = await imageTools.handleToolCall(
        'download_attachment_to_tmp',
        args,
        mockTrelloClient
      );

      const structured = result.structuredContent as {
        type: string;
        path: string;
        mimeType: string;
      };

      expect(mockTrelloClient.fetchAttachment).toHaveBeenCalledWith(args.url);
      expect(result.content).toEqual([]);
      expect(structured.type).toBe('attachment_download');
      expect(structured.mimeType).toBe('application/octet-stream');
      expect(structured.path.startsWith(os.tmpdir())).toBe(true);

      const written = await fs.readFile(structured.path);
      expect(written.equals(mockBuffer)).toBe(true);

      await fs.rm(path.dirname(structured.path), { recursive: true, force: true });
    });

    it('uses detected filename when available', async () => {
      const mockBuffer = Buffer.from('pdf-data');
      mockTrelloClient.fetchAttachment.mockResolvedValue({
        data: mockBuffer,
        mimeType: 'application/pdf',
        fileName: 'remote.pdf',
      });

      const args = { url: 'https://example.com/files/report.pdf' };

      const result = await imageTools.handleToolCall(
        'download_attachment_to_tmp',
        args,
        mockTrelloClient
      );

      const structured = result.structuredContent as {
        path: string;
        mimeType: string;
      };

      expect(path.basename(structured.path)).toBe('remote.pdf');
      expect(structured.mimeType).toBe('application/pdf');

      const written = await fs.readFile(structured.path);
      expect(written.equals(mockBuffer)).toBe(true);

      await fs.rm(path.dirname(structured.path), { recursive: true, force: true });
    });
  });
});
