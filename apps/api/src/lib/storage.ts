import { createHash } from "crypto";

export interface StorageUploadResult {
  key: string;
  url: string;
  checksum: string;
}

export interface StorageAdapter {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  delete(key: string): Promise<void>;
}

/**
 * LocalStorageAdapter — stores files on disk for development.
 * Replace with S3Adapter / R2Adapter in production.
 */
class LocalStorageAdapter implements StorageAdapter {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = process.env.LOCAL_UPLOAD_DIR ?? "./uploads";
  }

  async upload(key: string, buffer: Buffer, _mimeType: string): Promise<StorageUploadResult> {
    const { writeFile, mkdir } = await import("fs/promises");
    const { join, dirname } = await import("path");

    const filePath = join(this.uploadDir, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);

    const checksum = createHash("sha256").update(buffer).digest("hex");

    return {
      key,
      url: `/uploads/${key}`,
      checksum,
    };
  }

  async getSignedUrl(key: string, _expiresInSeconds = 3600): Promise<string> {
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const { unlink } = await import("fs/promises");
    const { join } = await import("path");
    await unlink(join(this.uploadDir, key)).catch(() => {});
  }
}

/**
 * S3StorageAdapter — production-ready S3/R2/MinIO adapter.
 * Requires: aws-sdk v3 (@aws-sdk/client-s3, @aws-sdk/s3-request-presigner)
 */
class S3StorageAdapter implements StorageAdapter {
  async upload(key: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult> {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const client = new S3Client({
      region: process.env.STORAGE_REGION ?? "us-east-1",
      endpoint: process.env.STORAGE_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? "",
      },
    });

    const checksum = createHash("sha256").update(buffer).digest("hex");

    await client.send(
      new PutObjectCommand({
        Bucket: process.env.STORAGE_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ChecksumSHA256: checksum,
        ServerSideEncryption: "AES256",
      })
    );

    return {
      key,
      url: `${process.env.STORAGE_PUBLIC_URL ?? ""}/${key}`,
      checksum,
    };
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const client = new S3Client({
      region: process.env.STORAGE_REGION ?? "us-east-1",
      endpoint: process.env.STORAGE_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? "",
      },
    });

    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: process.env.STORAGE_BUCKET, Key: key }),
      { expiresIn: expiresInSeconds }
    );
  }

  async delete(key: string): Promise<void> {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

    const client = new S3Client({
      region: process.env.STORAGE_REGION ?? "us-east-1",
      endpoint: process.env.STORAGE_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? "",
      },
    });

    await client.send(
      new DeleteObjectCommand({ Bucket: process.env.STORAGE_BUCKET, Key: key })
    );
  }
}

function createStorageAdapter(): StorageAdapter {
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  switch (provider) {
    case "s3":
    case "r2":
    case "minio":
      return new S3StorageAdapter();
    case "local":
    default:
      return new LocalStorageAdapter();
  }
}

export const storage = createStorageAdapter();
