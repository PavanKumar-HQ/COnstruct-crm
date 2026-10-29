import fs from "fs";
import path from "path";
import crypto from "crypto";
import { env } from "./env";

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB max

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/msword", // doc
]);

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
 * Enforces tenant-isolated storage, allowed MIME types, max file sizes,
 * and strict path traversal protection.
 */
export class StorageService {
  private static getTenantRoot(organizationId: string): string {
    // Sanitize organizationId to guarantee alphanumeric/hyphen uuid characters only
    const safeOrgId = organizationId.replace(/[^a-zA-Z0-9_-]/g, "");
    const root = path.resolve(process.cwd(), env.STORAGE_LOCAL_ROOT, safeOrgId);
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }
    return root;
  }

  static async saveFile(params: SaveFileParams): Promise<StoredFileMetadata> {
    if (!params.buffer || params.buffer.length === 0) {
      throw new Error("File buffer cannot be empty");
    }

    if (params.buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size exceeds maximum permitted limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`);
    }

    if (!ALLOWED_MIME_TYPES.has(params.mimeType.toLowerCase())) {
      throw new Error(`Unsupported or prohibited file type: ${params.mimeType}`);
    }

    const tenantDir = this.getTenantRoot(params.organizationId);
    // Sanitize extension and extract only extension without traversal sequences
    const sanitizedExt = path.extname(params.originalFileName).replace(/[^a-zA-Z0-9.]/g, "") || "";
    const uniqueKey = `${Date.now()}_${crypto.randomBytes(16).toString("hex")}${sanitizedExt}`;
    const destinationPath = path.join(tenantDir, uniqueKey);

    await fs.promises.writeFile(destinationPath, params.buffer);

    return {
      storageKey: uniqueKey,
      fileName: path.basename(params.originalFileName),
      fileSize: params.buffer.length,
      mimeType: params.mimeType,
    };
  }

  static async getFileBuffer(organizationId: string, storageKey: string): Promise<Buffer | null> {
    // Enforce basename extraction to eliminate all path traversal (/../, ../, etc.)
    const sanitizedKey = path.basename(storageKey);
    const tenantDir = this.getTenantRoot(organizationId);
    const fullPath = path.join(tenantDir, sanitizedKey);

    // Verify canonical path begins with tenant root directory
    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(path.resolve(tenantDir))) {
      throw new Error("Security violation: Path traversal detected");
    }

    if (!fs.existsSync(resolvedPath)) {
      return null;
    }

    return fs.promises.readFile(resolvedPath);
  }
}
