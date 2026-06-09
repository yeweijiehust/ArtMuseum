# Validation, OpenAPI, Errors, and Configuration

Prerequisites:

- [Contracts, schemas, adapters, and dependency inversion](../02-architecture/02-contracts-and-adapters.md)
- [Fastify application factory and plugins](01-fastify-application.md)

## Schema-First Routes

A schema-first route declares accepted input and possible output alongside the handler:

```ts
schema: {
  tags: ["Auth"],
  body: RegisterBodySchema,
  response: {
    201: AuthUserResponseSchema,
    400: ErrorResponseSchema,
    409: ErrorResponseSchema
  }
}
```

Business purpose: the API contract is explicit and machine-readable.

Fastify uses these schemas to:

- validate request data;
- serialize responses;
- provide TypeScript type-provider assistance;
- generate OpenAPI documentation.

## TypeBox

TypeBox builds JSON Schema-compatible objects with TypeScript-friendly typing.

Example from [`packages/shared/src/index.ts`](../../packages/shared/src/index.ts):

```ts
Type.String({ minLength: 2, maxLength: 80 })
```

This is runtime data describing a constrained string. It is different from the TypeScript `string` type, which cannot enforce length after compilation.

`additionalProperties: false` restricts undeclared properties. The Fastify AJV configuration also removes extra properties.

## OpenAPI and Swagger UI

**OpenAPI** is a standard document describing HTTP APIs. **Swagger UI** renders that document as interactive web documentation.

`@fastify/swagger` must register before API routes in dynamic mode so it can observe their schemas.

The repository exposes:

- `/api/docs`: Swagger UI;
- `/api/docs/`: Swagger UI;
- `/api/docs/json`: generated OpenAPI JSON.

In production, docs register only when `ENABLE_API_DOCS=true`. This allows deployments to decide whether documentation should be publicly visible.

OpenAPI can document authentication requirements through the `cookieAuth` security scheme, but it does not implement authentication itself.

## Stable Error Responses

[`sendError`](../../apps/api/src/http/errors.ts) creates:

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "FILE_TOO_LARGE"
  }
}
```

Why use codes instead of server-translated sentences?

- callers can reliably branch on codes;
- frontend can translate into English or Chinese;
- wording can change without changing API semantics;
- tests can assert stable behavior.

The `message` currently repeats the code. It exists in the response shape but is not the localized user message.

## Central Error Mapping

The Fastify error handler in [`app.ts`](../../apps/api/src/app.ts) maps framework errors:

- validation errors -> `400 VALIDATION_ERROR`;
- missing multipart content type on upload -> `400 FILE_REQUIRED`;
- malformed request -> `400 BAD_REQUEST`;
- oversized upload -> `400 FILE_TOO_LARGE`;
- unexpected error -> `500 BAD_REQUEST`.

Routes handle expected business cases directly, such as `EMAIL_EXISTS`, `FORBIDDEN`, or `STORAGE_FAILURE`.

An advanced improvement would use a distinct internal-server error code rather than mapping unexpected failures to `BAD_REQUEST`.

## Configuration

[`config.ts`](../../apps/api/src/config.ts) turns environment variables and optional test overrides into a typed `AppConfig`.

Important categories:

- network: `PORT`, `HOST`;
- environment: `NODE_ENV`;
- authentication secrets: `JWT_SECRET`, `COOKIE_SECRET`;
- database: `MONGODB_URI`, `MONGODB_DB`;
- image storage: Cloudinary variables;
- feature flag: `ENABLE_API_DOCS`;
- adapter selection: `DATA_STORE`, `STORAGE_DRIVER`;
- frontend path: `WEB_DIST_PATH`.

The nullish-coalescing sequence:

```ts
overrides.port ?? Number(process.env.PORT ?? 3000)
```

means test/code override first, then environment variable, then default.

## Fail Fast

In production, missing JWT or cookie secrets throw during startup. Real Mongo and Cloudinary modes also require credentials.

This is **fail-fast configuration**: refuse to run in a broken or insecure state rather than discovering the problem during a user request.

Development gets obvious placeholder secrets for convenience. They must never be treated as production secrets.

## Feature Flags and Adapter Modes

`ENABLE_API_DOCS` is a small feature flag.

`DATA_STORE=memory` and `STORAGE_DRIVER=fake` select test/local adapters. Production defaults to MongoDB and Cloudinary.

Adapter selection through configuration makes tests independent of remote credentials, but tests using fakes cannot fully verify vendor behavior.

## Configuration Precedence and Cloudinary

Cloudinary supports:

1. explicit cloud name, key, and secret;
2. `CLOUDINARY_URL` fallback.

The storage adapter prefers explicit credentials. This helps avoid a stale `CLOUDINARY_URL` silently overriding dashboard values.

Secrets must stay in environment configuration and out of Git, logs, browser code, and tutorials.

## Alternatives

- Validate environment with a schema library at startup: more systematic error reporting; useful as configuration grows.
- Handwrite OpenAPI: precise but easily drifts from actual routes.
- Generate server routes from OpenAPI: contract-first workflow, but more tooling and generated code.
- Return localized server messages: can support non-browser clients, but requires locale negotiation and duplicates frontend language concerns.

## Related Guides

- Troubleshooting configuration: [Debugging guide](../06-quality/02-debugging-guide.md)
- Deployment variables: [Build, CI, deployment, and production](../07-operations/01-build-ci-deploy.md)
