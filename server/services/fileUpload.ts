import { randomUUID } from "crypto";
import { Client } from "@replit/object-storage";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760"); // 10MB default
const ALLOWED_MIME_TYPES = ["application/pdf"];
const STORAGE_PREFIX = "planejamentos";

const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
if (!bucketId) {
  console.warn("[fileUpload] ⚠️ DEFAULT_OBJECT_STORAGE_BUCKET_ID não configurado, usando fallback local");
}

const objectStorageClient = bucketId ? new Client({ bucketId }) : null;

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export class FileUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileUploadError";
  }
}

export function sanitizeFilename(filename: string): string {
  const extension = filename.split('.').pop() || '';
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  
  const sanitized = nameWithoutExt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const uniqueId = randomUUID().split('-')[0];
  
  return `${sanitized}-${uniqueId}.${extension}`;
}

export function validateFile(file: { mimetype: string; size: number }): void {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new FileUploadError(
      `Tipo de arquivo não permitido. Apenas ${ALLOWED_MIME_TYPES.join(', ')} são aceitos.`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(1);
    throw new FileUploadError(
      `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB.`
    );
  }
}

export async function uploadPDFToStorage(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<UploadedFile> {
  validateFile({ mimetype: mimeType, size: fileBuffer.length });

  const sanitizedName = sanitizeFilename(originalFilename);
  const storageKey = `${STORAGE_PREFIX}/${sanitizedName}`;
  
  console.log(`[fileUpload] Iniciando upload: ${originalFilename} -> ${storageKey}`);
  console.log(`[fileUpload] Tamanho do buffer: ${fileBuffer.length} bytes`);
  
  if (!objectStorageClient) {
    throw new FileUploadError("Object Storage não configurado. Verifique DEFAULT_OBJECT_STORAGE_BUCKET_ID.");
  }
  
  const uint8Array = new Uint8Array(fileBuffer);
  console.log(`[fileUpload] Convertido para Uint8Array: ${uint8Array.length} bytes`);
  
  const { ok, error } = await objectStorageClient.uploadFromBytes(storageKey, uint8Array);
  
  if (!ok) {
    console.error("[fileUpload] Erro ao salvar arquivo no Object Storage:", error);
    throw new FileUploadError(`Erro ao salvar arquivo: ${error}`);
  }
  
  console.log(`[fileUpload] ✅ Arquivo salvo no Object Storage: ${storageKey} (${fileBuffer.length} bytes)`);
  
  return {
    filename: sanitizedName,
    originalName: originalFilename,
    mimeType,
    size: fileBuffer.length,
    url: storageKey,
  };
}

export async function downloadFileFromStorage(storageKey: string): Promise<Buffer> {
  const key = storageKey.startsWith('/storage/') 
    ? storageKey.replace('/storage/', '')
    : storageKey;
    
  console.log(`[fileUpload] Baixando arquivo do Object Storage: ${key}`);
  
  if (!objectStorageClient) {
    throw new FileUploadError("Object Storage não configurado. Verifique DEFAULT_OBJECT_STORAGE_BUCKET_ID.");
  }
  
  const { ok, value, error } = await objectStorageClient.downloadAsBytes(key);
  
  if (!ok || !value) {
    console.error(`[fileUpload] Erro ao baixar arquivo: ${error}`);
    throw new FileUploadError(`Arquivo não encontrado: ${storageKey}`);
  }
  
  // The SDK returns Result<[Buffer], RequestError> - value is a tuple [Buffer]
  const buffer = value[0];
  console.log(`[fileUpload] ✅ Arquivo baixado com sucesso: ${key} (${buffer.length} bytes)`);
  
  return buffer;
}

export function convertPDFToBase64(fileBuffer: Buffer): string {
  return fileBuffer.toString('base64');
}

export async function processUploadedFiles(
  files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>
): Promise<UploadedFile[]> {
  const uploadedFiles: UploadedFile[] = [];

  for (const file of files) {
    try {
      const uploadedFile = await uploadPDFToStorage(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      uploadedFiles.push(uploadedFile);
    } catch (error) {
      if (error instanceof FileUploadError) {
        throw error;
      }
      throw new Error(`Erro ao processar arquivo ${file.originalname}: ${(error as Error).message}`);
    }
  }

  return uploadedFiles;
}
