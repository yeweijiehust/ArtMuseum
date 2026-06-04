import type { FastifyReply } from "fastify";
import type { AppConfig } from "./config.js";
import type { ImageStorage } from "./services/image-storage.js";
import type { AppStore, PublicUserRecord } from "./services/store.js";

declare module "fastify" {
  interface FastifyInstance {
    config: AppConfig;
    store: AppStore;
    imageStorage: ImageStorage;
    authenticate(request: import("fastify").FastifyRequest, reply: FastifyReply): Promise<void>;
  }

  interface FastifyRequest {
    currentUser?: PublicUserRecord;
  }
}
