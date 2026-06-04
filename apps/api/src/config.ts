import { resolve } from "node:path";

export type DataStoreMode = "mongo" | "memory";

export type StorageDriverMode = "cloudinary" | "fake";

export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: string;
  jwtSecret: string;
  cookieSecret: string;
  mongoUri?: string;
  mongoDb: string;
  cloudinaryUrl?: string;
  enableApiDocs: boolean;
  dataStore: DataStoreMode;
  storageDriver: StorageDriverMode;
  webDistPath: string;
}

export function loadConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  const nodeEnv = overrides.nodeEnv ?? process.env.NODE_ENV ?? "development";
  const dataStore = overrides.dataStore ?? normalizeDataStore(process.env.DATA_STORE);
  const storageDriver = overrides.storageDriver ?? normalizeStorageDriver(process.env.STORAGE_DRIVER);
  const config: AppConfig = {
    port: overrides.port ?? Number(process.env.PORT ?? 3000),
    host: overrides.host ?? process.env.HOST ?? "0.0.0.0",
    nodeEnv,
    jwtSecret: overrides.jwtSecret ?? process.env.JWT_SECRET ?? defaultSecret(nodeEnv, "jwt"),
    cookieSecret: overrides.cookieSecret ?? process.env.COOKIE_SECRET ?? defaultSecret(nodeEnv, "cookie"),
    mongoUri: overrides.mongoUri ?? process.env.MONGODB_URI,
    mongoDb: overrides.mongoDb ?? process.env.MONGODB_DB ?? "artmuseum",
    cloudinaryUrl: overrides.cloudinaryUrl ?? process.env.CLOUDINARY_URL,
    enableApiDocs: overrides.enableApiDocs ?? process.env.ENABLE_API_DOCS === "true",
    dataStore,
    storageDriver,
    webDistPath: overrides.webDistPath ?? process.env.WEB_DIST_PATH ?? resolve(process.cwd(), "apps/web/dist")
  };
  if (config.dataStore === "mongo" && !config.mongoUri) {
    throw new Error("MONGODB_URI is required when DATA_STORE is mongo");
  }
  if (config.storageDriver === "cloudinary" && !config.cloudinaryUrl) {
    throw new Error("CLOUDINARY_URL is required when STORAGE_DRIVER is cloudinary");
  }
  return config;
}

function normalizeDataStore(value: string | undefined): DataStoreMode {
  if (value === "memory") {
    return "memory";
  }
  return "mongo";
}

function normalizeStorageDriver(value: string | undefined): StorageDriverMode {
  if (value === "fake") {
    return "fake";
  }
  return "cloudinary";
}

function defaultSecret(nodeEnv: string, name: string): string {
  if (nodeEnv === "production") {
    throw new Error(`${name.toUpperCase()} secret is required in production`);
  }
  return `local-${name}-secret-change-before-production`;
}
