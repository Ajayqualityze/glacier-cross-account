import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface UploadResult {
  success: boolean;
  key?: string | null;
  bucket?: string | null;
  storageClass?: string | null;
  message?: string | null;
}

export interface FileInfo {
  key: string;
  size: number;
  lastModified: string;
  storageClass: string;
}

export interface ListResult {
  folders: string[];
  files: FileInfo[];
  bucket?: string | null;
}

export class GlacierAPI {
  /**
   * Upload a file to cross-account S3 with Glacier storage class
   */
  static async uploadFile(
    file: File,
    folderPath?: string
  ): Promise<UploadResult> {
    try {
      // Convert file to base64
      const base64Content = await this.fileToBase64(file);

      const response = await client.queries.uploadToGlacier({
        fileName: file.name,
        fileContent: base64Content,
        folderPath: folderPath || '',
        contentType: file.type || 'application/octet-stream',
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data as UploadResult;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  /**
   * List folders and files in cross-account S3
   */
  static async listFolders(prefix?: string): Promise<ListResult> {
    try {
      const response = await client.queries.listCrossAccountFolders({
        prefix: prefix || '',
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return {
        folders: (response.data?.folders || []).filter((f): f is string => f !== null),
        files: (response.data?.files || [])
          .filter((f): f is NonNullable<typeof f> => f !== null)
          .map(f => ({
            key: f.key || '',
            size: f.size || 0,
            lastModified: f.lastModified || '',
            storageClass: f.storageClass || 'STANDARD',
          })),
        bucket: response.data?.bucket || null,
      };
    } catch (error) {
      console.error('List failed:', error);
      throw error;
    }
  }

  /**
   * Convert File to base64 string
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Format bytes to human-readable size
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
