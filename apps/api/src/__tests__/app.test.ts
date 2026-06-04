import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ErrorCodes } from "@artmuseum/shared";
import { createApp } from "../app.js";

let app: Awaited<ReturnType<typeof createApp>>;

beforeEach(async () => {
  app = await createApp({
    config: {
      nodeEnv: "test",
      dataStore: "memory",
      storageDriver: "fake",
      jwtSecret: "test-jwt-secret-test-jwt-secret",
      cookieSecret: "test-cookie-secret-test-cookie-secret",
      enableApiDocs: true
    }
  });
  await app.ready();
});

afterEach(async () => {
  if (app) {
    await app.close();
  }
});

describe("Fastify API", () => {
  it("serves health and OpenAPI docs with core routes", async () => {
    const health = await app.inject({ method: "GET", url: "/api/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ ok: true, service: "artmuseum-api" });
    const docs = await app.inject({ method: "GET", url: "/api/docs/json" });
    expect(docs.statusCode).toBe(200);
    const body = docs.json();
    expect(body.openapi).toMatch(/^3\./);
    expect(body.paths["/api/auth/register"].post.tags).toContain("Auth");
    expect(body.paths["/api/images"].post.security).toEqual([{ cookieAuth: [] }]);
  });

  it("registers, logs in, and returns the current user from the session cookie", async () => {
    const registered = await register("Ada", "ada@example.com", "password123");
    expect(registered.statusCode).toBe(201);
    const cookie = getCookie(registered);
    const me = await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie } });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe("ada@example.com");
    const duplicate = await register("Ada", "ADA@example.com", "password123");
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json().error.code).toBe(ErrorCodes.EmailExists);
    const failedLogin = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "ada@example.com", password: "wrongpass" }
    });
    expect(failedLogin.statusCode).toBe(401);
    expect(failedLogin.json().error.code).toBe(ErrorCodes.InvalidCredentials);
  });

  it("protects uploads and enforces ownership for image edits", async () => {
    const anonymousUpload = await app.inject({
      method: "POST",
      url: "/api/images",
      ...multipartPayload({ title: "Hidden" }, { filename: "photo.jpg", mimeType: "image/jpeg", content: Buffer.from("image") })
    });
    expect(anonymousUpload.statusCode).toBe(401);
    const ownerCookie = getCookie(await register("Owner", "owner@example.com", "password123"));
    const intruderCookie = getCookie(await register("Intruder", "intruder@example.com", "password123"));
    const uploaded = await app.inject({
      method: "POST",
      url: "/api/images",
      headers: { cookie: ownerCookie, ...multipartPayloadHeaders() },
      payload: multipartPayloadBuffer(
        { title: "Blue Room", description: "A quiet frame", altText: "Blue wall" },
        { filename: "blue.jpg", mimeType: "image/jpeg", content: Buffer.from("image") }
      )
    });
    expect(uploaded.statusCode).toBe(201);
    const imageId = uploaded.json().id as string;
    const intruderPatch = await app.inject({
      method: "PATCH",
      url: `/api/images/${imageId}`,
      headers: { cookie: intruderCookie },
      payload: { title: "Taken" }
    });
    expect(intruderPatch.statusCode).toBe(403);
    const ownerPatch = await app.inject({
      method: "PATCH",
      url: `/api/images/${imageId}`,
      headers: { cookie: ownerCookie },
      payload: { title: "Blue Room Revised" }
    });
    expect(ownerPatch.statusCode).toBe(200);
    expect(ownerPatch.json().title).toBe("Blue Room Revised");
  });
});

async function register(displayName: string, email: string, password: string) {
  return app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { displayName, email, password }
  });
}

function getCookie(response: Awaited<ReturnType<typeof app.inject>>) {
  const value = response.headers["set-cookie"];
  return Array.isArray(value) ? value[0] : String(value);
}

function multipartPayload(fields: Record<string, string>, file: { filename: string; mimeType: string; content: Buffer }) {
  return {
    headers: multipartPayloadHeaders(),
    payload: multipartPayloadBuffer(fields, file)
  };
}

function multipartPayloadHeaders() {
  return {
    "content-type": "multipart/form-data; boundary=artmuseum-test-boundary"
  };
}

function multipartPayloadBuffer(fields: Record<string, string>, file: { filename: string; mimeType: string; content: Buffer }) {
  const boundary = "artmuseum-test-boundary";
  const chunks: Buffer[] = [];
  for (const [name, value] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
  }
  chunks.push(
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.filename}"\r\nContent-Type: ${file.mimeType}\r\n\r\n`),
    file.content,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  );
  return Buffer.concat(chunks);
}
