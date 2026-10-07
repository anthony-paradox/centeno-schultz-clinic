import { BlobNotFoundError, del, get, head, list, put } from "@vercel/blob";
import { createStorage as createLocalStorage } from "emdash/storage/local";

type BlobAccess = "public" | "private";

interface UploadOptions {
	key: string;
	body: Buffer | Uint8Array | ReadableStream<Uint8Array>;
	contentType: string;
	cacheControl?: string;
}

interface UploadResult {
	key: string;
	url: string;
	size: number;
}

interface DownloadResult {
	body: ReadableStream<Uint8Array>;
	contentType: string;
	size: number;
}

interface FileInfo {
	key: string;
	size: number;
	lastModified: Date;
	etag?: string;
}

interface ListOptions {
	prefix?: string;
	limit?: number;
	cursor?: string;
}

interface ListResult {
	files: FileInfo[];
	nextCursor?: string;
}

interface SignedUploadOptions {
	key: string;
	contentType: string;
	size?: number;
	expiresIn?: number;
}

interface SignedUploadUrl {
	url: string;
	method: "PUT";
	headers: Record<string, string>;
	expiresAt: string;
}

interface MediaStorage {
	upload(options: UploadOptions): Promise<UploadResult>;
	download(key: string): Promise<DownloadResult>;
	delete(key: string): Promise<void>;
	exists(key: string): Promise<boolean>;
	list(options?: ListOptions): Promise<ListResult>;
	getSignedUploadUrl(options: SignedUploadOptions): Promise<SignedUploadUrl>;
	getPublicUrl(key: string): string;
}

const LOCAL_CONFIG = {
	directory: "./uploads",
	baseUrl: "/_emdash/api/media/file",
};

function blobAccess(): BlobAccess {
	return process.env.BLOB_ACCESS === "private" ? "private" : "public";
}

function blobCredentialsPresent(): boolean {
	return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}

function useBlob(): boolean {
	return blobCredentialsPresent() || process.env.VERCEL === "1";
}

function assertBlobConfigured(): void {
	if (blobCredentialsPresent()) return;
	throw Object.assign(
		new Error(
			"Vercel Blob is not configured. Connect a Blob store to this project so BLOB_STORE_ID is set.",
		),
		{ code: "NOT_CONFIGURED" },
	);
}

function unsupportedSignedUpload(): Error {
	return Object.assign(
		new Error(
			"Vercel Blob does not support EmDash signed upload URLs. Files upload through the server.",
		),
		{ code: "NOT_SUPPORTED" },
	);
}

function cacheMaxAge(cacheControl?: string): number {
	const match = cacheControl?.match(/max-age=(\d+)/);
	const parsed = match ? Number(match[1]) : 60 * 60 * 24 * 30;
	return Math.max(60, parsed);
}

async function toBuffer(body: UploadOptions["body"]): Promise<Buffer> {
	if (Buffer.isBuffer(body)) return body;
	if (body instanceof Uint8Array) return Buffer.from(body);

	const chunks: Uint8Array[] = [];
	const reader = body.getReader();
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (value) chunks.push(value);
	}
	return Buffer.concat(chunks);
}

function isNotFound(error: unknown): boolean {
	return error instanceof BlobNotFoundError;
}

class VercelBlobStorage implements MediaStorage {
	async upload(options: UploadOptions): Promise<UploadResult> {
		assertBlobConfigured();
		const body = await toBuffer(options.body);
		await put(options.key, body, {
			access: blobAccess(),
			contentType: options.contentType,
			addRandomSuffix: false,
			allowOverwrite: true,
			cacheControlMaxAge: cacheMaxAge(options.cacheControl),
		});

		return {
			key: options.key,
			url: this.getPublicUrl(options.key),
			size: body.byteLength,
		};
	}

	async download(key: string): Promise<DownloadResult> {
		assertBlobConfigured();
		const result = await get(key, { access: blobAccess() });
		if (!result || result.statusCode !== 200) {
			throw Object.assign(new Error(`File not found: ${key}`), { code: "NOT_FOUND" });
		}

		return {
			body: result.stream,
			contentType: result.blob.contentType,
			size: result.blob.size,
		};
	}

	async delete(key: string): Promise<void> {
		assertBlobConfigured();
		try {
			await del(key);
		} catch (error) {
			if (!isNotFound(error)) throw error;
		}
	}

	async exists(key: string): Promise<boolean> {
		assertBlobConfigured();
		try {
			await head(key);
			return true;
		} catch (error) {
			if (isNotFound(error)) return false;
			throw error;
		}
	}

	async list(options: ListOptions = {}): Promise<ListResult> {
		assertBlobConfigured();
		const result = await list({
			prefix: options.prefix,
			limit: options.limit,
			cursor: options.cursor,
		});

		return {
			files: result.blobs.map((blob) => ({
				key: blob.pathname,
				size: blob.size,
				lastModified: blob.uploadedAt,
				etag: blob.etag,
			})),
			nextCursor: result.hasMore ? result.cursor : undefined,
		};
	}

	getSignedUploadUrl(_options: SignedUploadOptions): Promise<SignedUploadUrl> {
		return Promise.reject(unsupportedSignedUpload());
	}

	getPublicUrl(key: string): string {
		return `/_emdash/api/media/file/${key}`;
	}
}

/**
 * EmDash storage entrypoint.
 * Production on Vercel reads and writes the connected Blob store.
 * Local dev without Blob credentials keeps using ./uploads.
 */
export function createStorage(_config: Record<string, unknown>): MediaStorage {
	if (useBlob()) return new VercelBlobStorage();
	return createLocalStorage(LOCAL_CONFIG) as MediaStorage;
}
