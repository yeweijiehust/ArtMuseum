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
  if (config.cloudinaryUrl) {
    const parsed = parseCloudinaryUrl(config.cloudinaryUrl);
    cloudinary.config({
      cloud_name: parsed.cloudName,
      api_key: parsed.apiKey,
      api_secret: parsed.apiSecret,
      secure: true
    });
    return;
  }
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true
  });
}

function parseCloudinaryUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "cloudinary:") {
    throw new Error("CLOUDINARY_URL must start with cloudinary://");
  }
  return {
    cloudName: url.hostname,
    apiKey: decodeURIComponent(url.username),
    apiSecret: decodeURIComponent(url.password)
  };
}
