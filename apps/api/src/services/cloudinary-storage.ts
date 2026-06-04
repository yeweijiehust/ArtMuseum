import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import type { ImageStorage, UploadedImage, UploadImageInput } from "./image-storage.js";

export class CloudinaryImageStorage implements ImageStorage {
  constructor(cloudinaryUrl?: string) {
    if (cloudinaryUrl) {
      process.env.CLOUDINARY_URL = cloudinaryUrl;
    }
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
      secureUrl: result.secure_url,
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
