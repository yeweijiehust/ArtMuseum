export interface UploadImageInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface UploadedImage {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface ImageStorage {
  upload(input: UploadImageInput): Promise<UploadedImage>;
  delete(publicId: string): Promise<void>;
}
