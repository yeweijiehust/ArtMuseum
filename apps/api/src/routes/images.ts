import type { FastifyRequest } from "fastify";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import {
  ErrorCodes,
  ErrorResponseSchema,
  ImageListQuerySchema,
  ImageListResponseSchema,
  ImageParamsSchema,
  ImageSchema,
  ImageUpdateBodySchema,
  type GalleryImage,
  type ImageListQuery,
  type ImageParams,
  type ImageUpdateBody
} from "@artmuseum/shared";
import { sendError } from "../http/errors.js";
import type { ImageRecord } from "../services/store.js";
import { cleanRequiredText, cleanText } from "../utils/text.js";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxUploadBytes = 10 * 1024 * 1024;

interface ParsedUpload {
  fields: Record<string, string>;
  file: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  } | null;
}

export const imageRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    "/images",
    {
      schema: {
        tags: ["Images"],
        querystring: ImageListQuerySchema,
        response: {
          200: ImageListResponseSchema
        }
      }
    },
    async (request) => {
      const query = request.query as ImageListQuery;
      const result = await app.store.listPublicImages({
        limit: query.limit ?? 20,
        cursor: query.cursor
      });
      return {
        items: result.items.map(toGalleryImage),
        nextCursor: result.nextCursor
      };
    }
  );

  app.get(
    "/images/mine",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["Images"],
        security: [{ cookieAuth: [] }],
        response: {
          200: ImageListResponseSchema,
          401: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      if (!request.currentUser) {
        return sendError(reply, 401, ErrorCodes.Unauthorized);
      }
      const items = await app.store.listImagesByOwner(request.currentUser.id);
      return {
        items: items.map(toGalleryImage),
        nextCursor: null
      };
    }
  );

  app.get(
    "/images/:id",
    {
      schema: {
        tags: ["Images"],
        params: ImageParamsSchema,
        response: {
          200: ImageSchema,
          404: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const params = request.params as ImageParams;
      const image = await app.store.findImageById(params.id);
      if (!image) {
        return sendError(reply, 404, ErrorCodes.NotFound);
      }
      return toGalleryImage(image);
    }
  );

  app.post(
    "/images",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["Images"],
        security: [{ cookieAuth: [] }],
        consumes: ["multipart/form-data"],
        response: {
          201: ImageSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          502: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      if (!request.currentUser) {
        return sendError(reply, 401, ErrorCodes.Unauthorized);
      }
      const upload = await parseUpload(request);
      if (!upload.file) {
        return sendError(reply, 400, ErrorCodes.FileRequired);
      }
      if (!allowedMimeTypes.has(upload.file.mimeType)) {
        return sendError(reply, 400, ErrorCodes.InvalidFileType);
      }
      const title = cleanRequiredText(upload.fields.title, 120);
      if (!title) {
        return sendError(reply, 400, ErrorCodes.TitleRequired);
      }
      try {
        const stored = await app.imageStorage.upload({
          buffer: upload.file.buffer,
          filename: upload.file.filename,
          mimeType: upload.file.mimeType
        });
        const image = await app.store.createImage({
          ownerId: request.currentUser.id,
          ownerDisplayName: request.currentUser.displayName,
          cloudinaryPublicId: stored.publicId,
          url: stored.secureUrl,
          width: stored.width,
          height: stored.height,
          format: stored.format,
          bytes: stored.bytes,
          title,
          description: cleanText(upload.fields.description, 1000),
          altText: cleanText(upload.fields.altText, 300)
        });
        return reply.code(201).send(toGalleryImage(image));
      } catch (error) {
        request.log.error({ err: error }, "Image upload storage failure");
        return sendError(reply, 502, ErrorCodes.StorageFailure);
      }
    }
  );

  app.patch(
    "/images/:id",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["Images"],
        security: [{ cookieAuth: [] }],
        params: ImageParamsSchema,
        body: ImageUpdateBodySchema,
        response: {
          200: ImageSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      if (!request.currentUser) {
        return sendError(reply, 401, ErrorCodes.Unauthorized);
      }
      const params = request.params as ImageParams;
      const body = request.body as ImageUpdateBody;
      const image = await app.store.findImageById(params.id);
      if (!image) {
        return sendError(reply, 404, ErrorCodes.NotFound);
      }
      if (image.ownerId !== request.currentUser.id) {
        return sendError(reply, 403, ErrorCodes.Forbidden);
      }
      const update = normalizeUpdateBody(body);
      const updated = await app.store.updateImage(image.id, update);
      if (!updated) {
        return sendError(reply, 404, ErrorCodes.NotFound);
      }
      return toGalleryImage(updated);
    }
  );

  app.delete(
    "/images/:id",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["Images"],
        security: [{ cookieAuth: [] }],
        params: ImageParamsSchema,
        response: {
          204: { type: "null" },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          502: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      if (!request.currentUser) {
        return sendError(reply, 401, ErrorCodes.Unauthorized);
      }
      const params = request.params as ImageParams;
      const image = await app.store.findImageById(params.id);
      if (!image) {
        return sendError(reply, 404, ErrorCodes.NotFound);
      }
      if (image.ownerId !== request.currentUser.id) {
        return sendError(reply, 403, ErrorCodes.Forbidden);
      }
      try {
        await app.imageStorage.delete(image.cloudinaryPublicId);
        await app.store.deleteImage(image.id);
        return reply.code(204).send(null);
      } catch (error) {
        request.log.error({ err: error }, "Image delete storage failure");
        return sendError(reply, 502, ErrorCodes.StorageFailure);
      }
    }
  );
};

function toGalleryImage(image: ImageRecord): GalleryImage {
  return {
    id: image.id,
    ownerId: image.ownerId,
    ownerDisplayName: image.ownerDisplayName,
    url: image.url,
    width: image.width,
    height: image.height,
    format: image.format,
    bytes: image.bytes,
    title: image.title,
    description: image.description,
    altText: image.altText,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt
  };
}

function normalizeUpdateBody(body: ImageUpdateBody) {
  return {
    ...(body.title !== undefined ? { title: body.title.trim() } : {}),
    ...(body.description !== undefined ? { description: cleanText(body.description, 1000) } : {}),
    ...(body.altText !== undefined ? { altText: cleanText(body.altText, 300) } : {})
  };
}

async function parseUpload(request: FastifyRequest): Promise<ParsedUpload> {
  const fields: Record<string, string> = {};
  let file: ParsedUpload["file"] = null;
  if (!request.isMultipart()) {
    return { fields, file };
  }
  try {
    for await (const part of request.parts()) {
      if (part.type === "file") {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);
        if (part.file.truncated || buffer.length > maxUploadBytes) {
          throw new UploadTooLargeError();
        }
        file = {
          buffer,
          filename: part.filename,
          mimeType: part.mimetype
        };
      } else {
        fields[part.fieldname] = String(part.value ?? "");
      }
    }
  } catch (error) {
    if (error instanceof UploadTooLargeError || isMultipartTooLargeError(error)) {
      throw Object.assign(new Error(ErrorCodes.FileTooLarge), {
        statusCode: 413,
        code: "FST_REQ_FILE_TOO_LARGE"
      });
    }
    throw error;
  }
  return { fields, file };
}

class UploadTooLargeError extends Error {}

function isMultipartTooLargeError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "FST_REQ_FILE_TOO_LARGE" || error.code === "FST_FILES_LIMIT")
  );
}
