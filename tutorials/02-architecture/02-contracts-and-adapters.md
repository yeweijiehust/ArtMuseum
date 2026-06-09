# Contracts, Schemas, Adapters, and Dependency Inversion

Prerequisites:

- [JavaScript and TypeScript from zero](../00-start-here/02-javascript-typescript.md)
- [Architecture and repository map](01-system-map.md)

## What Is a Contract?

A **contract** describes what one part of a system promises to accept or provide. Contracts reduce the amount each part must know about another part.

This repository uses several contract forms:

- TypeScript interfaces for internal service capabilities;
- TypeBox schemas for HTTP data;
- stable error-code strings;
- route paths and status codes;
- environment variable names.

## Internal Service Contracts

[`AppStore`](../../apps/api/src/services/store.ts) describes persistence operations:

```ts
export interface AppStore {
  createUser(input: CreateUserInput): Promise<UserRecord>;
  findUserById(id: string): Promise<UserRecord | null>;
  createImage(input: CreateImageInput): Promise<ImageRecord>;
  // more operations
}
```

Business meaning: routes can create and retrieve records without knowing which database is used.

Syntax:

- `interface` declares required member shapes;
- each member is a function signature;
- `Promise<T>` means the result arrives asynchronously;
- `T | null` means “found value or not found.”

Both [`MongoStore`](../../apps/api/src/services/mongo-store.ts) and [`MemoryStore`](../../apps/api/src/services/memory-store.ts) implement this contract.

[`ImageStorage`](../../apps/api/src/services/image-storage.ts) similarly isolates image-byte storage. Cloudinary is the production adapter; the fake adapter is deterministic and avoids external calls during tests.

## Adapter Pattern

An **adapter** translates between the application's preferred contract and an external technology's API.

`MongoStore` translates:

- application string IDs to MongoDB `ObjectId`;
- JavaScript ISO date strings to MongoDB `Date`;
- duplicate key error code `11000` to `DuplicateEmailError`.

`CloudinaryImageStorage` translates:

- a `Buffer` into an upload stream;
- Cloudinary's upload response into `UploadedImage`;
- application deletion into `cloudinary.uploader.destroy`.

Adapters prevent vendor details from spreading through route handlers.

## Dependency Inversion

Without dependency inversion, an upload route might construct a Cloudinary client and MongoDB query directly. It would be hard to test and hard to replace either vendor.

With dependency inversion:

```text
route -> ImageStorage contract <- Cloudinary adapter
                         <- Fake adapter
```

The higher-level business workflow depends on an abstraction. The composition root chooses the implementation.

In [`app.ts`](../../apps/api/src/app.ts):

```ts
const store = options.store ?? createStore(config);
const imageStorage = options.imageStorage ?? createImageStorage(config);
app.decorate("store", store);
app.decorate("imageStorage", imageStorage);
```

Business purpose: production gets real services; tests can inject controlled substitutes.

Syntax:

- `??` uses the right side only when the left side is nullish;
- `app.decorate` adds capabilities to the Fastify instance;
- module augmentation in [`types.ts`](../../apps/api/src/types.ts) teaches TypeScript about those added properties.

## Runtime Schemas as HTTP Contracts

[`packages/shared/src/index.ts`](../../packages/shared/src/index.ts) defines TypeBox schemas:

```ts
export const ImageListQuerySchema = Type.Object({
  cursor: Type.Optional(Type.String({ minLength: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50 }))
});
```

This is executable runtime data describing allowed request values. Fastify validates requests against it.

The package also derives static types:

```ts
export type ImageListQuery = Static<typeof ImageListQuerySchema>;
```

`typeof` asks TypeScript for the type of the schema variable. `Static<...>` converts a TypeBox schema type into the represented data type.

One schema therefore supports:

- runtime validation;
- TypeScript guidance;
- response serialization;
- OpenAPI generation.

## Why Shared Contracts Matter

The frontend imports response types and error codes from the same package used by the backend. If an image response shape changes, TypeScript can reveal affected frontend code during typechecking.

However, the frontend's generic `apiFetch<T>` casts parsed JSON to `T`; it does not runtime-validate API responses. The shared types reduce accidental drift but do not prove a deployed server returned valid data.

## Stable Error Codes as a Contract

The API sends:

```json
{"error":{"code":"INVALID_CREDENTIALS","message":"INVALID_CREDENTIALS"}}
```

The frontend maps `errors.INVALID_CREDENTIALS` through i18next. The server does not decide whether the user sees English or Chinese.

Adding or renaming an error code affects:

- shared `ErrorCodes`;
- backend behavior;
- both translation files;
- tests.

## Alternatives

- Direct vendor calls in routes: fewer files initially, but tightly coupled and harder to test.
- Abstract every small function: creates unnecessary indirection. This repository abstracts vendor boundaries where substitution has clear value.
- OpenAPI-generated clients: stronger frontend/server synchronization, but adds a generation step.
- Separate schema libraries per layer: flexible, but increases duplication.

## Next Step

Read [HTTP request lifecycle and data flow](03-request-lifecycle.md) to see these contracts cooperate during a real request.
