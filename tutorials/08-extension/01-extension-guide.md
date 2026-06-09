# Extension Guide

Prerequisites: complete the [learning path through testing](../README.md#stage-6-operate-and-change-the-system).

This guide teaches how to change the system without updating only one layer and leaving hidden contract gaps.

## General Change Method

For any feature:

1. state the user behavior and business rule;
2. identify affected data;
3. identify trust/security boundaries;
4. change shared contracts;
5. change backend behavior and adapters;
6. change frontend behavior and translations;
7. add tests at appropriate layers;
8. run full verification;
9. consider existing production data and deployment.

## Example: Add Favorites

### Domain questions

- Can only authenticated users favorite?
- Can a user favorite an image once?
- Are favorite counts public?
- What happens when an image or user is deleted?

These questions must be answered before selecting code.

### Data design options

Option A: separate `favorites` documents with `userId`, `imageId`, and timestamp.

- supports queries by user/image;
- requires a unique compound index;
- handles counts and relationships cleanly.

Option B: array of user IDs on each image.

- simpler read for one image;
- document can grow;
- owner/user queries and concurrency are harder.

### Required code surfaces

- shared schemas/types for favorite state;
- store contract methods;
- Mongo and memory adapter implementations;
- authenticated API routes and authorization rules;
- frontend API methods and query/mutation hooks;
- bilingual UI text;
- tests for duplicate favorite, anonymous rejection, deletion behavior, and UI state;
- OpenAPI assertions.

## Example: Add Infinite Gallery Scrolling

The backend already returns `nextCursor`, but frontend ignores it.

Change plan:

1. allow `api.listImages(cursor, limit)`;
2. use TanStack Query `useInfiniteQuery`;
3. flatten returned pages for `GalleryGrid`;
4. add a load-more control or intersection observer;
5. test no cursor, next cursor, final page, loading, and duplicate prevention;
6. add backend pagination tests using enough images for several pages.

Do not replace cursor pagination with offsets merely because the UI needs more pages. Understand the tradeoff in [MongoDB, records, indexes, and cursor pagination](../03-backend/04-mongodb-pagination.md).

## Example: Add Private Images

This changes the security model, not just a `visibility` string.

Required decisions:

- who may fetch a private image's metadata?
- is the Cloudinary URL itself private/signed?
- may owners toggle visibility?
- should list routes filter private records?
- what happens to previously cached public URLs?

A database visibility check alone does not make a publicly accessible Cloudinary URL private.

## Example: Add Password Reset

Requires:

- secure random reset tokens;
- expiry and one-time use;
- email delivery;
- account-enumeration-safe responses;
- password rehash;
- session invalidation decision;
- rate limits;
- new pages, translations, APIs, storage, tests, and operational secrets.

This illustrates why a small UI request can be a security-sensitive system feature.

## Adding a New API Route

Checklist:

1. choose method/path/status semantics;
2. add shared request/response schemas;
3. add stable error codes if needed;
4. register route with tags, schemas, and security declaration;
5. authenticate and authorize server-side;
6. call store/storage contracts;
7. expose frontend API method;
8. translate errors/text;
9. assert OpenAPI output;
10. add TS and Python behavior tests.

## Adding a Store Operation

Change all implementations:

- `AppStore` interface;
- `MongoStore`;
- `MemoryStore`;
- any injected/custom test stores.

Match semantics across implementations, especially ordering, null/not-found behavior, and errors.

## Adding an Error Code

Change:

1. shared `ErrorCodes`;
2. backend response behavior;
3. English translation;
4. Chinese translation;
5. frontend/API tests;
6. OpenAPI response schema only if shape changes.

## Adding a Locale

Change:

- shared `locales` tuple and `localeNames`;
- frontend translation resource;
- i18next registration;
- URL matching regexes in locale utilities;
- route preference logic;
- tests for route, switching, and fallback;
- responsive UI checks for longer text.

Current regexes explicitly list `en|zh`; adding a locale only to the shared tuple is insufficient.

## Performance Optimization Rule

Measure first. Identify whether delay is:

- Render cold start;
- Fastify/API;
- MongoDB;
- password hashing;
- Cloudinary upload;
- Cloudinary image delivery;
- frontend bundle/rendering.

Optimize the measured bottleneck and add evidence/tests where possible.

## Compatibility and Production Data

When changing stored records:

- old MongoDB documents may lack new fields;
- deployed frontend and backend may briefly be different versions;
- rollback may encounter newer data;
- indexes may take time to build.

Prefer additive, backward-compatible changes before removals or renames.

## Completion Checklist

Before committing an extension:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:api:py
```

Then review the diff for secrets, generated artifacts, unrelated changes, and missing documentation.
