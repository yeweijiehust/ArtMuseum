# Code Map and Responsibility Index

This reference maps each important tracked file or group to its responsibility and the best tutorial to read first.

## Repository Root

| File | Responsibility | Learn first |
| --- | --- | --- |
| [`README.md`](../../README.md) | Concise operator/project overview | [Learning roadmap](../README.md) |
| [`package.json`](../../package.json) | Root scripts, engines, shared dev dependencies | [PNPM and monorepos](../00-start-here/03-node-pnpm-monorepos.md) |
| [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) | Workspace package discovery | [PNPM and monorepos](../00-start-here/03-node-pnpm-monorepos.md) |
| [`pnpm-lock.yaml`](../../pnpm-lock.yaml) | Exact dependency graph | [Dependency guide](01-dependencies.md) |
| [`tsconfig.base.json`](../../tsconfig.base.json) | Shared backend/shared TypeScript settings | [JavaScript and TypeScript](../00-start-here/02-javascript-typescript.md) |
| [`eslint.config.js`](../../eslint.config.js) | Lint rules and ignored output | [Testing strategy](../06-quality/01-testing-strategy.md) |
| [`.env.example`](../../.env.example) | Safe environment variable template | [Contracts, errors, config](../03-backend/05-contracts-errors-config.md) |
| [`.gitignore`](../../.gitignore) | Excluded secrets/generated files | [Files and command line](../00-start-here/04-files-and-command-line.md) |
| [`render.yaml`](../../render.yaml) | Render service blueprint | [Build, CI, deploy](../07-operations/01-build-ci-deploy.md) |
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | GitHub Actions verification | [Build, CI, deploy](../07-operations/01-build-ci-deploy.md) |

## Shared Package

| File | Responsibility | Learn first |
| --- | --- | --- |
| [`packages/shared/src/index.ts`](../../packages/shared/src/index.ts) | Locales, error codes, TypeBox schemas, derived API types | [Contracts and adapters](../02-architecture/02-contracts-and-adapters.md) |
| [`packages/shared/package.json`](../../packages/shared/package.json) | Shared package exports/scripts | [PNPM and monorepos](../00-start-here/03-node-pnpm-monorepos.md) |
| [`packages/shared/tsconfig.json`](../../packages/shared/tsconfig.json) | Declaration/output build settings | [PNPM and monorepos](../00-start-here/03-node-pnpm-monorepos.md) |

## API Composition and HTTP

| File | Responsibility | Learn first |
| --- | --- | --- |
| [`apps/api/src/server.ts`](../../apps/api/src/server.ts) | Production process entry and listen | [Fastify application](../03-backend/01-fastify-application.md) |
| [`apps/api/src/app.ts`](../../apps/api/src/app.ts) | Composition root, plugins, auth decoration, docs, static files, errors | [Fastify application](../03-backend/01-fastify-application.md) |
| [`apps/api/src/config.ts`](../../apps/api/src/config.ts) | Environment parsing/defaults/required settings | [Contracts, errors, config](../03-backend/05-contracts-errors-config.md) |
| [`apps/api/src/types.ts`](../../apps/api/src/types.ts) | Fastify TypeScript module augmentation | [Fastify application](../03-backend/01-fastify-application.md) |
| [`apps/api/src/test-server.ts`](../../apps/api/src/test-server.ts) | Real local server for Python tests | [Testing strategy](../06-quality/01-testing-strategy.md) |
| [`apps/api/src/http/cookies.ts`](../../apps/api/src/http/cookies.ts) | Session cookie options/set/clear | [Authentication](../03-backend/02-authentication-authorization.md) |
| [`apps/api/src/http/errors.ts`](../../apps/api/src/http/errors.ts) | Stable API error response helper | [Contracts, errors, config](../03-backend/05-contracts-errors-config.md) |
| [`apps/api/src/utils/text.ts`](../../apps/api/src/utils/text.ts) | Email normalization and metadata cleaning | [Data and rules](../01-domain/02-data-and-rules.md) |

## API Routes

| File | Responsibility | Learn first |
| --- | --- | --- |
| [`apps/api/src/routes/health.ts`](../../apps/api/src/routes/health.ts) | Health endpoint | [Fastify application](../03-backend/01-fastify-application.md) |
| [`apps/api/src/routes/auth.ts`](../../apps/api/src/routes/auth.ts) | Register, login, logout, current user | [Registration walkthrough](../05-walkthroughs/01-register-login.md) |
| [`apps/api/src/routes/images.ts`](../../apps/api/src/routes/images.ts) | Public/personal listing, upload, edit, delete | [Upload walkthrough](../05-walkthroughs/02-upload-gallery.md) |

## API Services and Adapters

| File | Responsibility | Learn first |
| --- | --- | --- |
| [`apps/api/src/services/store.ts`](../../apps/api/src/services/store.ts) | Persistence records, inputs, `AppStore` contract | [Contracts and adapters](../02-architecture/02-contracts-and-adapters.md) |
| [`apps/api/src/services/mongo-store.ts`](../../apps/api/src/services/mongo-store.ts) | Production MongoDB adapter/indexes/queries | [MongoDB and pagination](../03-backend/04-mongodb-pagination.md) |
| [`apps/api/src/services/memory-store.ts`](../../apps/api/src/services/memory-store.ts) | In-memory test/local store | [MongoDB and pagination](../03-backend/04-mongodb-pagination.md) |
| [`apps/api/src/services/cursor.ts`](../../apps/api/src/services/cursor.ts) | Cursor encode/decode | [MongoDB and pagination](../03-backend/04-mongodb-pagination.md) |
| [`apps/api/src/services/image-storage.ts`](../../apps/api/src/services/image-storage.ts) | Image-storage contract | [Image upload](../03-backend/03-image-upload-storage.md) |
| [`apps/api/src/services/cloudinary-storage.ts`](../../apps/api/src/services/cloudinary-storage.ts) | Production Cloudinary adapter/config/URLs | [Image upload](../03-backend/03-image-upload-storage.md) |
| [`apps/api/src/services/fake-storage.ts`](../../apps/api/src/services/fake-storage.ts) | Deterministic fake and failure simulation | [Testing strategy](../06-quality/01-testing-strategy.md) |

## Web Application Core

| File | Responsibility | Learn first |
| --- | --- | --- |
| [`apps/web/index.html`](../../apps/web/index.html) | Browser HTML shell/root element | [How web apps work](../00-start-here/01-how-web-apps-work.md) |
| [`apps/web/src/main.tsx`](../../apps/web/src/main.tsx) | React browser entry | [React, routing, state](../04-frontend/01-react-routing-state.md) |
| [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) | Providers, routes, locale layout, auth guard | [React, routing, state](../04-frontend/01-react-routing-state.md) |
| [`apps/web/src/api.ts`](../../apps/web/src/api.ts) | Shared fetch/error/API methods | [React, routing, state](../04-frontend/01-react-routing-state.md) |
| [`apps/web/src/queries.ts`](../../apps/web/src/queries.ts) | Shared current-user/logout query hooks | [React, routing, state](../04-frontend/01-react-routing-state.md) |
| [`apps/web/src/i18n.ts`](../../apps/web/src/i18n.ts) | i18next setup/resources | [Forms and i18n](../04-frontend/02-forms-i18n-responsive.md) |
| [`apps/web/src/locale.ts`](../../apps/web/src/locale.ts) | Locale validation/preference/path switching | [Forms and i18n](../04-frontend/02-forms-i18n-responsive.md) |
| [`apps/web/src/styles.css`](../../apps/web/src/styles.css) | Complete responsive visual layout | [Forms and i18n](../04-frontend/02-forms-i18n-responsive.md) |
| [`apps/web/src/locales/en.json`](../../apps/web/src/locales/en.json) | English UI/errors | [Forms and i18n](../04-frontend/02-forms-i18n-responsive.md) |
| [`apps/web/src/locales/zh.json`](../../apps/web/src/locales/zh.json) | Chinese UI/errors | [Forms and i18n](../04-frontend/02-forms-i18n-responsive.md) |

## Web Pages and Components

| File/group | Responsibility | Learn first |
| --- | --- | --- |
| [`GalleryPage.tsx`](../../apps/web/src/pages/GalleryPage.tsx) | Public gallery query and lightbox state | [Upload/gallery walkthrough](../05-walkthroughs/02-upload-gallery.md) |
| [`LoginPage.tsx`](../../apps/web/src/pages/LoginPage.tsx) and [`RegisterPage.tsx`](../../apps/web/src/pages/RegisterPage.tsx) | Authentication forms | [Registration walkthrough](../05-walkthroughs/01-register-login.md) |
| [`UploadPage.tsx`](../../apps/web/src/pages/UploadPage.tsx) | Multipart upload form | [Upload/gallery walkthrough](../05-walkthroughs/02-upload-gallery.md) |
| [`MyUploadsPage.tsx`](../../apps/web/src/pages/MyUploadsPage.tsx) | Owner edit/delete UI | [Edit/delete walkthrough](../05-walkthroughs/03-edit-delete.md) |
| [`Header.tsx`](../../apps/web/src/components/Header.tsx) | Brand, locale, auth navigation | [React, routing, state](../04-frontend/01-react-routing-state.md) |
| [`GalleryGrid.tsx`](../../apps/web/src/components/GalleryGrid.tsx) | Responsive selectable image list | [Forms and i18n](../04-frontend/02-forms-i18n-responsive.md) |
| [`Lightbox.tsx`](../../apps/web/src/components/Lightbox.tsx) | Enlarged modal-style viewer | [Forms and i18n](../04-frontend/02-forms-i18n-responsive.md) |
| [`FormError.tsx`](../../apps/web/src/components/FormError.tsx) | API error-code translation | [Contracts, errors, config](../03-backend/05-contracts-errors-config.md) |

## Tests and Tool Configuration

| File/group | Responsibility | Learn first |
| --- | --- | --- |
| [`apps/api/src/__tests__`](../../apps/api/src/__tests__) | Fastify behavior and focused API unit tests | [Testing strategy](../06-quality/01-testing-strategy.md) |
| [`apps/web/src/App.test.tsx`](../../apps/web/src/App.test.tsx) | Frontend route/form/lightbox behaviors | [Testing strategy](../06-quality/01-testing-strategy.md) |
| [`apps/web/src/test/setup.ts`](../../apps/web/src/test/setup.ts) | Frontend matcher setup | [Testing strategy](../06-quality/01-testing-strategy.md) |
| [`tests/api/test_api_behavior.py`](../../tests/api/test_api_behavior.py) | External HTTP behavior/boundary tests | [Testing strategy](../06-quality/01-testing-strategy.md) |
| [`tests/api/requirements.txt`](../../tests/api/requirements.txt) | Python test dependencies | [Dependency guide](01-dependencies.md) |
| API/web `vitest.config.ts` | Node versus jsdom test environments and aliases | [Testing strategy](../06-quality/01-testing-strategy.md) |
| [`apps/web/vite.config.ts`](../../apps/web/vite.config.ts) | Vite React plugin, shared alias, API dev proxy | [Build, CI, deploy](../07-operations/01-build-ci-deploy.md) |
| Package `tsconfig.json` files | TypeScript input/output/environment settings | [JavaScript and TypeScript](../00-start-here/02-javascript-typescript.md) |
