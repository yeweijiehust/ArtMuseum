# Debugging Guide

Prerequisites:

- [Testing strategy and test syntax](01-testing-strategy.md)
- [HTTP request lifecycle and data flow](../02-architecture/03-request-lifecycle.md)

Debugging is the process of reducing uncertainty with evidence. Start by identifying which boundary failed rather than changing code immediately.

## A Repeatable Debugging Method

1. Reproduce the failure consistently.
2. Record exact request, response status, and error code.
3. Locate the failing boundary: browser, API, MongoDB, Cloudinary, build, or deployment.
4. Check logs at that boundary.
5. Form one specific hypothesis.
6. Run the smallest experiment that can disprove it.
7. Fix the cause.
8. Add a regression test at the appropriate layer.
9. Run the full verification suite.

## Start With Health and Docs

```powershell
Invoke-WebRequest https://your-host/api/health
Invoke-WebRequest https://your-host/api/docs/json
```

- health fails: process, network, startup configuration, or deployment problem;
- health works but docs `404`: likely `ENABLE_API_DOCS=false` or wrong route;
- docs JSON works: inspect declared paths and schemas.

## Browser-Side Problems

Use browser developer tools:

- **Network:** request path, method, status, payload, response, cookie presence;
- **Console:** JavaScript errors;
- **Application/Storage:** locale preference and cookies;
- **Elements/Accessibility:** rendered markup and labels.

Questions:

- Is the browser calling `/api/...` or a frontend route?
- Is `Content-Type` correct?
- Is the session cookie sent?
- Did frontend validation block the request?
- Is cached TanStack Query data stale?

## API Errors

Stable error codes narrow the investigation:

| Error code | First places to inspect |
| --- | --- |
| `VALIDATION_ERROR` | TypeBox schema and request shape |
| `UNAUTHORIZED` | cookie, JWT secret, token, current user |
| `FORBIDDEN` | target owner ID versus current user ID |
| `FILE_REQUIRED` | multipart body and content type |
| `FILE_TOO_LARGE` | multipart limits and actual bytes |
| `STORAGE_FAILURE` | Cloudinary configuration/logged vendor error |
| `NOT_FOUND` | route path or target ID |

Production Fastify logging is enabled in [`app.ts`](../../apps/api/src/app.ts). Upload/delete failures log the original error under `err`.

## Cloudinary Invalid Signature

An invalid signature usually means cloud name/key/secret do not belong together or the secret contains accidental characters.

Check:

1. Render environment has the correct `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
2. No stale `CLOUDINARY_URL` is unexpectedly used. Explicit values take priority in current code.
3. Secret has no quotes, placeholder asterisks, or copied whitespace.
4. Deployment restarted after environment change.
5. Logs show which operation failed, but never log the secret.

Do not place credentials in a committed test file.

## MongoDB Problems

Startup failure mentioning `MONGODB_URI` means configuration is absent. Connection errors may involve credentials, network allowlists, or URI formatting.

Behavior clues:

- duplicate registration returns `409`: unique index is working;
- all ID lookups return not found: inspect ObjectId format and database contents;
- slow listing: inspect indexes and query shape;
- app hangs on shutdown: verify store close lifecycle.

## Authentication Problems

If registration succeeds but `/api/auth/me` returns `401`:

- inspect `Set-Cookie` on registration response;
- inspect cookie on subsequent request;
- confirm HTTPS in production because cookie is secure;
- confirm JWT secret remains stable across restarts;
- confirm user still exists in the selected database.

If the frontend appears logged out but cookie works, inspect `["me"]` query data and browser request failures.

## Frontend Route Returns JSON `NOT_FOUND`

If a path begins with `/api/`, Fastify treats it as API. Swagger UI only exists when docs are enabled.

For React paths such as `/zh/upload`, production must have built `apps/web/dist`; then the SPA fallback sends `index.html`.

## Build and Type Failures

Run the narrowest relevant command first:

```powershell
pnpm --filter @artmuseum/api typecheck
pnpm --filter @artmuseum/web test
```

Then run root commands.

Typical causes:

- shared package was not built;
- new error code missing from translations;
- TypeScript optional/null value not handled;
- local backend import missing `.js`;
- frontend browser code imports a Node-only API.

## Performance Problems

Measure before optimizing:

- distinguish Render cold start from warm response;
- measure HTML/API separately from Cloudinary image delivery;
- inspect cache headers;
- test small read-only concurrency first;
- avoid load-testing production free services aggressively.

Known architecture costs include Argon2 hashing, MongoDB network calls, buffering uploads, and Render cold starts.

## Regression-Test Selection

- parsing/config function bug -> focused Vitest test;
- route/security bug -> Fastify injection test;
- UI interaction bug -> React Testing Library test;
- real HTTP/cookie/boundary bug -> Python behavior test;
- vendor-only bug -> isolated integration/manual test with protected credentials.
