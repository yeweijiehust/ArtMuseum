import { randomUUID } from "node:crypto";
import { decodeCursor, encodeCursor } from "./cursor.js";
import {
  DuplicateEmailError,
  type AppStore,
  type CreateImageInput,
  type CreateUserInput,
  type ImageRecord,
  type ListImagesOptions,
  type ListImagesResult,
  type UpdateImageInput,
  type UserRecord
} from "./store.js";

export class MemoryStore implements AppStore {
  private users = new Map<string, UserRecord>();
  private usersByEmail = new Map<string, string>();
  private images = new Map<string, ImageRecord>();

  async init() {}

  async close() {}

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    if (this.usersByEmail.has(input.email)) {
      throw new DuplicateEmailError();
    }
    const now = new Date().toISOString();
    const user: UserRecord = {
      id: randomUUID(),
      email: input.email,
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user.id);
    return user;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const id = this.usersByEmail.get(email);
    if (!id) {
      return null;
    }
    return this.users.get(id) ?? null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) ?? null;
  }

  async createImage(input: CreateImageInput): Promise<ImageRecord> {
    const now = new Date().toISOString();
    const image: ImageRecord = {
      id: randomUUID(),
      ...input,
      visibility: "public",
      createdAt: now,
      updatedAt: now
    };
    this.images.set(image.id, image);
    return image;
  }

  async listPublicImages(options: ListImagesOptions): Promise<ListImagesResult> {
    return this.listImages({ ...options, ownerId: undefined });
  }

  async listImagesByOwner(ownerId: string): Promise<ImageRecord[]> {
    return [...this.images.values()]
      .filter((image) => image.ownerId === ownerId)
      .sort(compareImages);
  }

  async findImageById(id: string): Promise<ImageRecord | null> {
    return this.images.get(id) ?? null;
  }

  async updateImage(id: string, input: UpdateImageInput): Promise<ImageRecord | null> {
    const image = this.images.get(id);
    if (!image) {
      return null;
    }
    const updated: ImageRecord = {
      ...image,
      ...input,
      updatedAt: new Date().toISOString()
    };
    this.images.set(id, updated);
    return updated;
  }

  async deleteImage(id: string): Promise<boolean> {
    return this.images.delete(id);
  }

  private async listImages(options: ListImagesOptions): Promise<ListImagesResult> {
    const decoded = decodeCursor(options.cursor);
    const filtered = [...this.images.values()]
      .filter((image) => image.visibility === "public")
      .filter((image) => !options.ownerId || image.ownerId === options.ownerId)
      .filter((image) => {
        if (!decoded) {
          return true;
        }
        if (image.createdAt < decoded.createdAt) {
          return true;
        }
        return image.createdAt === decoded.createdAt && image.id < decoded.id;
      })
      .sort(compareImages);
    const page = filtered.slice(0, options.limit + 1);
    const items = page.slice(0, options.limit);
    const last = items.at(-1);
    const nextCursor = page.length > options.limit && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null;
    return { items, nextCursor };
  }
}

function compareImages(a: ImageRecord, b: ImageRecord) {
  if (a.createdAt === b.createdAt) {
    return b.id.localeCompare(a.id);
  }
  return b.createdAt.localeCompare(a.createdAt);
}
