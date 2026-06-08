// sdk/js/src/modules/storage.ts

import { BaseFetch } from "../utils/fetch";
import type {
  StorageUploadOptions,
  StorageListOptions,
  StorageDownloadOptions,
} from "../types/filters";
import type {
  UploadResult,
  FileMeta,
  DeleteFileResult,
  DownloadUrlResult,
} from "../types/index";

// ─── Raw API shapes ───────────────────────────────────────────────────────────

interface UploadUrlResponse {
  upload_url: string;
  file_url: string;
  filename: string;
  bucket: string;
}

interface DownloadUrlResponse {
  url: string;
  path: string;
}

interface DeleteFileResponse {
  deleted: boolean;
  key: string;
}

// ─── BucketBuilder ────────────────────────────────────────────────────────────

/**
 * Scoped to a single bucket. Returned by `baas.storage("bucket-name")`.
 */
export class BucketBuilder {
  private http: BaseFetch;
  private projectId: string;
  private bucketName: string;

  constructor(http: BaseFetch, projectId: string, bucket: string) {
    this.http = http;
    this.projectId = projectId;
    this.bucketName = bucket;
  }

  /**
   * Get a presigned PUT URL for a direct client-to-storage upload.
   * The file is never proxied through the API server.
   *
   * @example
   * const { uploadUrl, fileUrl } = await baas.storage("avatars").upload({
   *   filename: "profile.jpg",
   *   contentType: "image/jpeg",
   * })
   * await fetch(uploadUrl, { method: "PUT", body: fileBlob })
   * // fileUrl is now the permanent/presigned download URL
   */
  async upload(options: StorageUploadOptions): Promise<UploadResult> {
    const res = await this.http.post<UploadUrlResponse>(
      `/v1/storage/${this.projectId}/${this.bucketName}/upload`,
      {
        filename: options.filename,
        content_type: options.contentType,
        expires_in: options.expiresIn ?? 3600,
      }
    );
    return {
      uploadUrl: res.data.upload_url,
      fileUrl: res.data.file_url,
      filename: res.data.filename,
      bucket: res.data.bucket,
    };
  }

  /**
   * List files in this bucket, optionally filtered by a key prefix.
   *
   * @example
   * const files = await baas.storage("avatars").listFiles()
   * const docs = await baas.storage("docs").listFiles({ prefix: "reports/", limit: 50 })
   */
  async listFiles(options?: StorageListOptions): Promise<FileMeta[]> {
    const query: Record<string, string | number | undefined> = {};
    if (options?.prefix) query["prefix"] = options.prefix;
    if (options?.limit) query["limit"] = options.limit;

    const res = await this.http.get<FileMeta[]>(
      `/v1/storage/${this.projectId}/${this.bucketName}/files`,
      query
    );
    return res.data;
  }

  /**
   * Delete a file by its key/path.
   *
   * @example
   * await baas.storage("avatars").deleteFile("profile.jpg")
   * await baas.storage("docs").deleteFile("reports/q3.pdf")
   */
  async deleteFile(path: string): Promise<DeleteFileResult> {
    const res = await this.http.delete<DeleteFileResponse>(
      `/v1/storage/${this.projectId}/${this.bucketName}/${path}`
    );
    return { deleted: res.data.deleted, key: res.data.key };
  }

  /**
   * Get a presigned download URL for a file.
   * The URL is valid for `expiresIn` seconds (default 3600).
   *
   * @example
   * const { url } = await baas.storage("avatars").getDownloadUrl("profile.jpg")
   * const { url } = await baas.storage("docs").getDownloadUrl("report.pdf", { expiresIn: 300 })
   */
  async getDownloadUrl(
    path: string,
    options?: StorageDownloadOptions
  ): Promise<DownloadUrlResult> {
    const query: Record<string, number | undefined> = {};
    if (options?.expiresIn) query["expires_in"] = options.expiresIn;

    const res = await this.http.get<DownloadUrlResponse>(
      `/v1/storage/${this.projectId}/${this.bucketName}/${path}/url`,
      query
    );
    return { url: res.data.url, path: res.data.path };
  }
}

// ─── StorageModule ────────────────────────────────────────────────────────────

export class StorageModule {
  private http: BaseFetch;
  private projectId: string;

  constructor(http: BaseFetch, projectId: string) {
    this.http = http;
    this.projectId = projectId;
  }

  /**
   * Returns a BucketBuilder scoped to the given bucket name.
   *
   * @example
   * baas.storage("avatars").upload({ filename: "pic.jpg", contentType: "image/jpeg" })
   * baas.storage("docs").listFiles({ prefix: "reports/" })
   * baas.storage("avatars").deleteFile("old-pic.jpg")
   * baas.storage("docs").getDownloadUrl("report.pdf")
   */
  bucket(name: string): BucketBuilder {
    return new BucketBuilder(this.http, this.projectId, name);
  }
}