import argon2 from "argon2";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import {
  AuthUserResponseSchema,
  ErrorCodes,
  ErrorResponseSchema,
  LoginBodySchema,
  RegisterBodySchema,
  type LoginBody,
  type RegisterBody
} from "@artmuseum/shared";
import { clearSessionCookie, setSessionCookie } from "../http/cookies.js";
import { sendError } from "../http/errors.js";
import { DuplicateEmailError, toPublicUser } from "../services/store.js";
import { isValidEmail, normalizeEmail } from "../utils/text.js";

export const authRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.post(
    "/register",
    {
      schema: {
        tags: ["Auth"],
        body: RegisterBodySchema,
        response: {
          201: AuthUserResponseSchema,
          400: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const body = request.body as RegisterBody;
      const email = normalizeEmail(body.email);
      const displayName = body.displayName.trim();
      if (!isValidEmail(email)) {
        return sendError(reply, 400, ErrorCodes.ValidationError);
      }
      try {
        const user = await app.store.createUser({
          email,
          displayName,
          passwordHash: await argon2.hash(body.password)
        });
        const publicUser = toPublicUser(user);
        const token = app.jwt.sign({ sub: user.id });
        setSessionCookie(reply, token, app.config);
        return reply.code(201).send({ user: publicUser });
      } catch (error) {
        if (error instanceof DuplicateEmailError) {
          return sendError(reply, 409, ErrorCodes.EmailExists);
        }
        throw error;
      }
    }
  );

  app.post(
    "/login",
    {
      schema: {
        tags: ["Auth"],
        body: LoginBodySchema,
        response: {
          200: AuthUserResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const body = request.body as LoginBody;
      const email = normalizeEmail(body.email);
      const user = await app.store.findUserByEmail(email);
      if (!user || !(await argon2.verify(user.passwordHash, body.password))) {
        return sendError(reply, 401, ErrorCodes.InvalidCredentials);
      }
      const publicUser = toPublicUser(user);
      const token = app.jwt.sign({ sub: user.id });
      setSessionCookie(reply, token, app.config);
      return { user: publicUser };
    }
  );

  app.post(
    "/logout",
    {
      schema: {
        tags: ["Auth"],
        response: {
          204: { type: "null" }
        }
      }
    },
    async (_request, reply) => {
      clearSessionCookie(reply, app.config);
      return reply.code(204).send(null);
    }
  );

  app.get(
    "/me",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["Auth"],
        security: [{ cookieAuth: [] }],
        response: {
          200: AuthUserResponseSchema,
          401: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      if (!request.currentUser) {
        return sendError(reply, 401, ErrorCodes.Unauthorized);
      }
      return { user: request.currentUser };
    }
  );
};
