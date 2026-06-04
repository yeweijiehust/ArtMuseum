import { existsSync } from "node:fs";
import { join } from "node:path";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import Fastify, { type FastifyError, type FastifyReply, type FastifyRequest } from "fastify";
import { ErrorCodes } from "@artmuseum/shared";
import { loadConfig, type AppConfig } from "./config.js";
import { clearSessionCookie, sessionCookieName } from "./http/cookies.js";
import { sendError } from "./http/errors.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { imageRoutes } from "./routes/images.js";
import { CloudinaryImageStorage } from "./services/cloudinary-storage.js";
import { FakeImageStorage } from "./services/fake-storage.js";
import type { ImageStorage } from "./services/image-storage.js";
import { MemoryStore } from "./services/memory-store.js";
import { MongoStore } from "./services/mongo-store.js";
import type { AppStore } from "./services/store.js";
import { toPublicUser } from "./services/store.js";
import "./types.js";

export interface CreateAppOptions {
  config?: Partial<AppConfig>;
  store?: AppStore;
  imageStorage?: ImageStorage;
  logger?: boolean;
}

export async function createApp(options: CreateAppOptions = {}) {
  const config = loadConfig(options.config);
  const app = Fastify({
    logger: options.logger ?? config.nodeEnv === "production",
    ajv: {
      customOptions: {
        coerceTypes: true,
        removeAdditional: "all"
      }
    }
  }).withTypeProvider<TypeBoxTypeProvider>();
  const store = options.store ?? createStore(config);
  const imageStorage = options.imageStorage ?? createImageStorage(config);
  app.decorate("config", config);
  app.decorate("store", store);
  app.decorate("imageStorage", imageStorage);
  app.setErrorHandler((error, request, reply) => handleError(error as FastifyError, request, reply));
  await store.init();
  app.addHook("onClose", async () => {
    await store.close();
  });
  await app.register(cookie, {
    secret: config.cookieSecret
  });
  await app.register(jwt, {
    secret: config.jwtSecret,
    cookie: {
      cookieName: sessionCookieName,
      signed: false
    }
  });
  app.decorate("authenticate", async (request, reply) => {
    try {
      const decoded = await request.jwtVerify<{ sub: string }>();
      const user = await app.store.findUserById(decoded.sub);
      if (!user) {
        clearSessionCookie(reply, config);
        await sendError(reply, 401, ErrorCodes.Unauthorized);
        return;
      }
      request.currentUser = toPublicUser(user);
    } catch {
      await sendError(reply, 401, ErrorCodes.Unauthorized);
    }
  });
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 1,
      fields: 10
    }
  });
  await app.register(rateLimit, {
    max: 300,
    timeWindow: "1 minute"
  });
  if (docsEnabled(config)) {
    await registerDocs(app);
  }
  await app.register(healthRoutes, { prefix: "/api" });
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(imageRoutes, { prefix: "/api" });
  if (config.nodeEnv === "production" && existsSync(config.webDistPath)) {
    await app.register(fastifyStatic, {
      root: config.webDistPath,
      prefix: "/"
    });
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/api/")) {
        return sendError(reply, 404, ErrorCodes.NotFound);
      }
      return reply.sendFile("index.html");
    });
  } else {
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/api/")) {
        return sendError(reply, 404, ErrorCodes.NotFound);
      }
      return reply.code(404).send({ error: "Not found" });
    });
  }
  return app;
}

function createStore(config: AppConfig): AppStore {
  if (config.dataStore === "memory") {
    return new MemoryStore();
  }
  return new MongoStore(config.mongoUri ?? "", config.mongoDb);
}

function createImageStorage(config: AppConfig): ImageStorage {
  if (config.storageDriver === "fake") {
    return new FakeImageStorage();
  }
  return new CloudinaryImageStorage({
    cloudinaryUrl: config.cloudinaryUrl,
    cloudName: config.cloudinaryCloudName,
    apiKey: config.cloudinaryApiKey,
    apiSecret: config.cloudinaryApiSecret
  });
}

function docsEnabled(config: AppConfig) {
  return config.nodeEnv !== "production" || config.enableApiDocs;
}

async function registerDocs(app: ReturnType<typeof Fastify>) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Art Museum API",
        version: "0.1.0"
      },
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: sessionCookieName
          }
        }
      }
    }
  });
  await app.register(swaggerUi, {
    routePrefix: "/api/docs",
    jsonRoute: "/json",
    uiConfig: {
      docExpansion: "list"
    },
    staticCSP: true
  });
}

function handleError(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (error.validation) {
    return sendError(reply, 400, ErrorCodes.ValidationError);
  }
  if (error.statusCode === 415 && request.method === "POST" && request.url === "/api/images") {
    return sendError(reply, 400, ErrorCodes.FileRequired);
  }
  if (error.statusCode === 400) {
    return sendError(reply, 400, ErrorCodes.BadRequest);
  }
  if (error.statusCode === 413 || error.code === "FST_REQ_FILE_TOO_LARGE") {
    return sendError(reply, 400, ErrorCodes.FileTooLarge);
  }
  return sendError(reply, 500, ErrorCodes.BadRequest);
}

export function resolveWebIndex(config: AppConfig) {
  return join(config.webDistPath, "index.html");
}
