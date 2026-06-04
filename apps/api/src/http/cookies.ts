import type { FastifyReply } from "fastify";
import type { AppConfig } from "../config.js";

export const sessionCookieName = "am_session";

export function setSessionCookie(reply: FastifyReply, token: string, config: AppConfig) {
  reply.setCookie(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

export function clearSessionCookie(reply: FastifyReply, config: AppConfig) {
  reply.clearCookie(sessionCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    path: "/"
  });
}
