export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUserRecord {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface ImageRecord {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  passwordHash: string;
}

export interface CreateImageInput {
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
}

export interface ListImagesOptions {
  limit: number;
  cursor?: string;
  ownerId?: string;
}

export interface ListImagesResult {
  items: ImageRecord[];
  nextCursor: string | null;
}

export interface UpdateImageInput {
  title?: string;
  description?: string | null;
  altText?: string | null;
}

export interface AppStore {
  init(): Promise<void>;
  close(): Promise<void>;
  createUser(input: CreateUserInput): Promise<UserRecord>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  createImage(input: CreateImageInput): Promise<ImageRecord>;
  listPublicImages(options: ListImagesOptions): Promise<ListImagesResult>;
  listImagesByOwner(ownerId: string): Promise<ImageRecord[]>;
  findImageById(id: string): Promise<ImageRecord | null>;
  updateImage(id: string, input: UpdateImageInput): Promise<ImageRecord | null>;
  deleteImage(id: string): Promise<boolean>;
}

export class DuplicateEmailError extends Error {
  constructor() {
    super("DUPLICATE_EMAIL");
  }
}

export function toPublicUser(user: UserRecord): PublicUserRecord {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt
  };
}
