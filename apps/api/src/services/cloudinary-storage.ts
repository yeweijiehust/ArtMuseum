import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import type { ImageStorage, UploadedImage, UploadImageInput } from "./image-storage.js";

export interface CloudinaryStorageConfig {
  cloudinaryUrl?: string;
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
}

export class CloudinaryImageStorage implements ImageStorage {
  constructor(config: CloudinaryStorageConfig) {
    configureCloudinary(config);
  }

  async upload(input: UploadImageInput): Promise<UploadedImage> {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "artmuseum",
          resource_type: "image",
          use_filename: true,
          unique_filename: true,
          overwrite: false
        },
        (error, response) => {
          if (error || !response) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }
          resolve(response);
        }
      );
      stream.end(input.buffer);
    });
    return {
      publicId: result.public_id,
      secureUrl: optimizedImageUrl(result.public_id) ?? result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  }

  async delete(publicId: string) {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image"
    });
  }
}

export function optimizedImageUrl(publicId: string) {
  return cloudinary.url(publicId, {
    secure: true,
    fetch_format: "auto",
    quality: "auto"
  });
}

function configureCloudinary(config: CloudinaryStorageConfig) {
  const credentials = resolveCloudinaryCredentials(config);
  cloudinary.config({
    cloud_name: credentials.cloudName,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    secure: true
  });
}

export function resolveCloudinaryCredentials(config: CloudinaryStorageConfig) {
  const cloudName = clean(config.cloudName);
  const apiKey = clean(config.apiKey);
  const apiSecret = clean(config.apiSecret);
  if (cloudName && apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret };
  }
  if (config.cloudinaryUrl) {
    return parseCloudinaryUrl(config.cloudinaryUrl);
  }
  throw new Error("Cloudinary credentials are missing");
}

function parseCloudinaryUrl(value: string) {
  const url = new URL(value.trim());
  if (url.protocol !== "cloudinary:") {
    throw new Error("CLOUDINARY_URL must start with cloudinary://");
  }
  const credentials = {
    cloudName: url.hostname,
    apiKey: decodeURIComponent(url.username),
    apiSecret: decodeURIComponent(url.password)
  };
  if (!credentials.cloudName || !credentials.apiKey || !credentials.apiSecret) {
    throw new Error("CLOUDINARY_URL must include api_key, api_secret, and cloud_name");
  }
  return credentials;
}

function clean(value: string | undefined) {
  const cleaned = value?.trim();
  return cleaned || undefined;
}
