import type { FastifyReply } from "fastify";
import { ErrorCodes, type ErrorCode } from "@artmuseum/shared";

export function sendError(reply: FastifyReply, statusCode: number, code: ErrorCode) {
  return reply.code(statusCode).send({
    error: {
      code,
      message: code
    }
  });
}

export function mapServerError(error: unknown) {
  if (error instanceof Error && error.message === ErrorCodes.StorageFailure) {
    return ErrorCodes.StorageFailure;
  }
  return ErrorCodes.BadRequest;
}
