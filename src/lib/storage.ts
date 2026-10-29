import fs from "fs";
import path from "path";
import crypto from "crypto";
import { env } from "./env";

export interface SaveFileParams {
  organizationId: string;
  originalFileName: string;
  buffer: Buffer;
  mimeType: string;
}

export interface StoredFileMetadata {
  storageKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Storage service abstraction.
 * Currently defaults to protected local directory with tenant partition.
 * Storage path is kept private and never exposed directly via public static files.
 */
export class StorageService {
  private static getTenantRoot(organizationId: string): string {
    const root = path.resolve(process.cwd(), env.STORAGE_LOCAL_ROOT, organizationId);
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }
    return root;
  }

  static async saveFile(params: SaveFileParams): Promise<StoredFileMetadata> {
    const tenantDir = this.getTenantRoot(params.organizationId);
    const fileExt = path.extname(params.originalFileName) || "";
    const uniqueKey = `${Date.now()}_${crypto.randomBytes(12).toString("hex")}${fileExt}`;
    const destinationPath = path.join(tenantDir, uniqueKey);

    await fs.promises.writeFile(destinationPath, params.buffer);

    return {
      storageKey: uniqueKey,
      fileName: params.originalFileName,
      fileSize: params.buffer.length,
      mimeType: params.mimeType,
    };
  }

  static async getFileBuffer(organizationId: string, storageKey: string): Promise<Buffer | null> {
    // Prevent path traversal attacks
    const sanitizedKey = path.basename(storageKey);
    const tenantDir = this.getTenantRoot(organizationId);
    const fullPath = path.join(tenantDir, sanitizedKey);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    return fs.promises.readFile(fullPath);
  }
}
