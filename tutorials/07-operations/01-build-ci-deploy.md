# Build, CI, Deployment, and Production

Prerequisites:

- [Node.js, packages, PNPM, and monorepos](../00-start-here/03-node-pnpm-monorepos.md)
- [Architecture and repository map](../02-architecture/01-system-map.md)
- [Testing strategy and test syntax](../06-quality/01-testing-strategy.md)

## Development, Build, and Production Are Different

During development, tools prioritize fast feedback. Production runs compiled artifacts with real services and stricter security.

```text
Development:
Vite :5173 -> proxies /api -> Fastify :3000

Production:
Browser -> one Render Fastify process
           |- /api/* routes
           |- built React files
```

## Root Scripts

[`package.json`](../../package.json) is the command entry point.

### `pnpm build`

Runs:

1. shared TypeScript build;
2. web TypeScript check and Vite bundle;
3. API TypeScript build.

Outputs:

- `packages/shared/dist`;
- `apps/web/dist`;
- `apps/api/dist`.

The frontend build creates content-hashed assets. The API build creates Node-executable JavaScript.

### `pnpm start`

Runs `node apps/api/dist/server.js`. It assumes build output already exists.

### Verification commands

`lint`, `typecheck`, TypeScript tests, Python API tests, and build provide different evidence. All should pass before committing according to the repository workflow.

## GitHub Actions CI

[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) triggers on every push and pull request.

The `verify` job:

1. checks out the commit;
2. installs PNPM 10.27;
3. installs Node 24 with PNPM caching;
4. installs Python 3.9 and `uv`;
5. installs locked dependencies;
6. lints;
7. typechecks;
8. runs TypeScript tests;
9. builds;
10. runs Python API tests.

CI checks the committed state on a clean Linux runner. A local success can still fail in CI because of case-sensitive paths, uncommitted files, or environment differences.

## Render Blueprint

[`render.yaml`](../../render.yaml) declares one Node web service:

- free plan;
- build command;
- start command;
- `/api/health` health check;
- Node version;
- environment values and secrets.

`autoDeployTrigger: checksPass` tells Render to deploy after associated checks pass.

Some Render dashboard settings may override or require synchronization with blueprint changes. If a committed environment change does not affect the live service, inspect the service's Environment and Blueprint synchronization status.

## Production Environment Variables

Required real-service values:

- `MONGODB_URI`;
- `MONGODB_DB`;
- Cloudinary cloud name, API key, and API secret;
- `JWT_SECRET`;
- `COOKIE_SECRET`.

Operational values:

- `NODE_ENV=production`;
- Render-provided `PORT`;
- `ENABLE_API_DOCS`;
- optional adapter/path settings.

Secrets must be random, stable, and protected. Changing `JWT_SECRET` invalidates existing login cookies. Changing Cloudinary credentials can break upload/delete. Changing database URI may point the app at different data.

## Production Startup

1. Render runs install/build.
2. `pnpm start` executes compiled server.
3. `createApp` loads environment.
4. configuration fails fast if required secrets/services are absent.
5. MongoDB connects and indexes initialize.
6. Fastify listens on `0.0.0.0:$PORT`.
7. Render health check calls `/api/health`.

If startup never reaches listening, inspect Render build and runtime logs separately.

## Serving the SPA

In production, Fastify serves `apps/web/dist`.

For a frontend route like `/zh/mine`, the server sends `index.html`, then React Router renders the page. For unknown `/api/*`, Fastify returns JSON `404` instead of SPA HTML.

Caching:

- HTML revalidates;
- hashed assets are immutable for one year;
- Cloudinary independently controls image delivery caching.

## Swagger in Production

Swagger registers automatically outside production. In production, `ENABLE_API_DOCS=true` is required.

Public docs are useful for exploration but reveal the API surface. For sensitive APIs, disable public docs or protect them.

## Deployment Verification Checklist

After a deployment:

1. verify `/api/health`;
2. verify `/api/docs/json` if enabled;
3. load `/en` and `/zh`;
4. register/login with a test account;
5. upload a small supported image;
6. verify public gallery and owner management;
7. inspect logs for unexpected errors;
8. verify static asset cache headers;
9. remove test data if appropriate.

## Rollback Thinking

A rollback restores earlier code but may not undo data changes or environment changes. Before introducing migrations or destructive operations, plan backward compatibility and recovery.

The current repository creates indexes but has no formal migration system. Schema changes should therefore be designed to tolerate old documents or include a controlled migration process.

## Alternatives

- Separate frontend/static hosting and API service: independent scaling, more cross-origin/deployment complexity.
- Containers/Docker: reproducible runtime packaging, more configuration.
- Managed deployment pipelines beyond GitHub/Render: greater control, greater operational cost.
