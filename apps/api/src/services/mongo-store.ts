import { ObjectId, type Collection, type Db, type Filter, MongoClient } from "mongodb";
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

interface UserDocument {
  _id: ObjectId;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ImageDocument {
  _id: ObjectId;
  ownerId: string;
  ownerDisplayName: string;
  cloudinaryPublicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  title: string;
  description: string | null;
  altText: string | null;
  visibility: "public";
  createdAt: Date;
  updatedAt: Date;
}

export class MongoStore implements AppStore {
  private client: MongoClient;
  private db?: Db;
  private users?: Collection<UserDocument>;
  private images?: Collection<ImageDocument>;

  constructor(uri: string, private dbName: string) {
    this.client = new MongoClient(uri);
  }

  async init() {
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    this.users = this.db.collection<UserDocument>("users");
    this.images = this.db.collection<ImageDocument>("images");
    await this.users.createIndex({ email: 1 }, { unique: true });
    await this.images.createIndex({ createdAt: -1, _id: -1 });
    await this.images.createIndex({ ownerId: 1, createdAt: -1 });
  }

  async close() {
    await this.client.close();
  }

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    const now = new Date();
    const document: UserDocument = {
      _id: new ObjectId(),
      email: input.email,
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now
    };
    try {
      await this.userCollection().insertOne(document);
      return toUserRecord(document);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new DuplicateEmailError();
      }
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const document = await this.userCollection().findOne({ email });
    return document ? toUserRecord(document) : null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const document = await this.userCollection().findOne({ _id: new ObjectId(id) });
    return document ? toUserRecord(document) : null;
  }

  async createImage(input: CreateImageInput): Promise<ImageRecord> {
    const now = new Date();
    const document: ImageDocument = {
      _id: new ObjectId(),
      ...input,
      visibility: "public",
      createdAt: now,
      updatedAt: now
    };
    await this.imageCollection().insertOne(document);
    return toImageRecord(document);
  }

  async listPublicImages(options: ListImagesOptions): Promise<ListImagesResult> {
    const filter: Filter<ImageDocument> = { visibility: "public" };
    const decoded = decodeCursor(options.cursor);
    if (decoded && ObjectId.isValid(decoded.id)) {
      filter.$or = [
        { createdAt: { $lt: new Date(decoded.createdAt) } },
        { createdAt: new Date(decoded.createdAt), _id: { $lt: new ObjectId(decoded.id) } }
      ];
    }
    const documents = await this.imageCollection()
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(options.limit + 1)
      .toArray();
    const items = documents.slice(0, options.limit).map(toImageRecord);
    const last = items.at(-1);
    const nextCursor = documents.length > options.limit && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null;
    return { items, nextCursor };
  }

  async listImagesByOwner(ownerId: string): Promise<ImageRecord[]> {
    const documents = await this.imageCollection()
      .find({ ownerId })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();
    return documents.map(toImageRecord);
  }

  async findImageById(id: string): Promise<ImageRecord | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const document = await this.imageCollection().findOne({ _id: new ObjectId(id) });
    return document ? toImageRecord(document) : null;
  }

  async updateImage(id: string, input: UpdateImageInput): Promise<ImageRecord | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const document = await this.imageCollection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...input,
          updatedAt: new Date()
        }
      },
      { returnDocument: "after" }
    );
    return document ? toImageRecord(document) : null;
  }

  async deleteImage(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const result = await this.imageCollection().deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  private userCollection() {
    if (!this.users) {
      throw new Error("MongoStore users collection is not initialized");
    }
    return this.users;
  }

  private imageCollection() {
    if (!this.images) {
      throw new Error("MongoStore images collection is not initialized");
    }
    return this.images;
  }
}

function toUserRecord(document: UserDocument): UserRecord {
  return {
    id: document._id.toString(),
    email: document.email,
    displayName: document.displayName,
    passwordHash: document.passwordHash,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

function toImageRecord(document: ImageDocument): ImageRecord {
  return {
    id: document._id.toString(),
    ownerId: document.ownerId,
    ownerDisplayName: document.ownerDisplayName,
    cloudinaryPublicId: document.cloudinaryPublicId,
    url: document.url,
    width: document.width,
    height: document.height,
    format: document.format,
    bytes: document.bytes,
    title: document.title,
    description: document.description,
    altText: document.altText,
    visibility: document.visibility,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

function isDuplicateKeyError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}
