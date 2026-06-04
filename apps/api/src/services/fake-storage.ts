import { randomUUID } from "node:crypto";
import { ErrorCodes } from "@artmuseum/shared";
import type { ImageStorage, UploadedImage, UploadImageInput } from "./image-storage.js";

export class FakeImageStorage implements ImageStorage {
  async upload(input: UploadImageInput): Promise<UploadedImage> {
    if (input.filename.includes("fail-storage")) {
      throw new Error(ErrorCodes.StorageFailure);
    }
    const id = randomUUID();
    const format = input.mimeType.split("/").at(1) ?? "jpg";
    return {
      publicId: `fake/${id}`,
      secureUrl: `https://images.example.test/${id}-${encodeURIComponent(input.filename)}`,
      width: 1200,
      height: 800,
      format,
      bytes: input.buffer.length
    };
  }

  async delete() {}
}
