# Art Museum

Bilingual photography gallery monorepo with a Fastify API, React frontend, MongoDB metadata store, Cloudinary image storage, Railway deployment config, TypeScript tests, Python API behavior tests, and GitHub Actions CI.

## Structure

- `apps/api`: Fastify 5 API, OpenAPI docs, auth, uploads, MongoDB and Cloudinary adapters
- `apps/web`: React, Vite, bilingual routes, responsive gallery, upload and owner management UI
- `packages/shared`: shared TypeBox schemas, API types, locales, and error codes
- `tests/api`: Python behavior tests against a real local HTTP server

## Scripts

- `pnpm dev`: run the API in development mode
- `pnpm build`: build shared, web, and API packages
- `pnpm start`: run the compiled API, which serves the built frontend in production
- `pnpm lint`: run ESLint
- `pnpm typecheck`: run TypeScript checks
- `pnpm test`: run TypeScript tests
- `pnpm test:api:py`: run Python API behavior tests through `uv`

## Environment

Copy `.env.example` to `.env` for local production-like runs and set:

- `MONGODB_URI`
- `MONGODB_DB`
- `CLOUDINARY_URL`
- `JWT_SECRET`
- `COOKIE_SECRET`
- `ENABLE_API_DOCS`

Use `DATA_STORE=memory` and `STORAGE_DRIVER=fake` only for tests or local experiments.
