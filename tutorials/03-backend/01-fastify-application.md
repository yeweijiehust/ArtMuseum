# Fastify Application Factory and Plugins

Prerequisites:

- [HTTP request lifecycle and data flow](../02-architecture/03-request-lifecycle.md)
- [JavaScript and TypeScript from zero](../00-start-here/02-javascript-typescript.md)

## What Fastify Is

Fastify is a Node.js web framework. It matches HTTP requests to handlers, manages plugins and hooks, validates data, serializes responses, and exposes a test injection API.

The central file is [`apps/api/src/app.ts`](../../apps/api/src/app.ts).

## Why an Application Factory Exists

`createApp()` constructs and returns a configured Fastify instance:

```ts
export async function createApp(options: CreateAppOptions = {}) {
  // construct and configure
  return app;
}
```

It does not call `listen()`. Separating construction from listening provides:

- production can listen on a real port;
- TypeScript tests can inject requests without a network port;
- Python tests can use a separate controlled test server;
- tests can inject fake stores or storage;
- each test can create a clean app instance.

This is called an **application factory**. An alternative is a module that starts listening immediately when imported; that is simpler initially but harder to test and reuse.

## Composition Root

A **composition root** is where concrete implementations are selected and connected. `app.ts` is the composition root.

It:

1. loads configuration;
2. creates Fastify;
3. chooses `MongoStore` or `MemoryStore`;
4. chooses `CloudinaryImageStorage` or `FakeImageStorage`;
5. decorates Fastify with those capabilities;
6. registers plugins and routes;
7. installs not-found behavior.

Business code elsewhere can depend on `app.store` and `app.imageStorage` without constructing them.

## Fastify Plugins

A Fastify plugin adds routes, hooks, decorations, or behavior. Registration uses:

```ts
await app.register(plugin, options);
```

`await` matters because plugin setup may be asynchronous and registration order matters.

Plugins used here:

- `@fastify/cookie`: read and write cookies;
- `@fastify/jwt`: sign and verify session tokens;
- `@fastify/multipart`: parse file uploads;
- `@fastify/rate-limit`: limit request volume;
- `@fastify/swagger`: generate OpenAPI;
- `@fastify/swagger-ui`: serve interactive API documentation;
- `@fastify/static`: serve built frontend files.

Route modules are also plugins. Prefix registration:

```ts
await app.register(authRoutes, { prefix: "/api/auth" });
```

turns route-local `/login` into `/api/auth/login`.

## Plugin Encapsulation

Fastify plugins normally create encapsulated scopes. Decorations and hooks can be limited to descendants. This repository registers major capabilities at the root so all routes can use them.

Fastify's plugin model is preferable to a single enormous server file because related routes can remain grouped while still sharing root services.

## Decorations and Module Augmentation

`app.decorate("store", store)` adds a property at runtime. TypeScript does not automatically know that property exists.

[`apps/api/src/types.ts`](../../apps/api/src/types.ts) uses **module augmentation**:

```ts
declare module "fastify" {
  interface FastifyInstance {
    store: AppStore;
  }
}
```

This merges additional fields into Fastify's existing TypeScript interfaces. Runtime decoration and compile-time augmentation must agree.

The app also decorates an `authenticate` function and adds `currentUser` to requests after successful authentication.

## Lifecycle Hooks

After `store.init()`, the app installs an `onClose` hook:

```ts
app.addHook("onClose", async () => {
  await store.close();
});
```

This ensures closing the Fastify app also closes MongoDB. Resource cleanup prevents leaked connections in production and hanging test processes.

## Error and Not-Found Handling

`setErrorHandler` catches thrown framework/handler errors and converts expected categories into stable API errors.

`setNotFoundHandler` handles unmatched routes:

- unmatched `/api/*` paths return JSON `NOT_FOUND`;
- production frontend paths return `index.html`;
- development unmatched non-API paths return a simple `404`.

## Static Files and Caching

In production, `@fastify/static` serves `apps/web/dist`.

- hashed `/assets/*` files receive `public, max-age=31536000, immutable`;
- SPA HTML receives `public, max-age=0, must-revalidate`.

Hashed asset names change when content changes, so a browser can safely cache them for a year. HTML points to those names and must be refreshed.

## Server Entry Point

[`server.ts`](../../apps/api/src/server.ts) is intentionally small:

1. call `createApp()`;
2. call `app.listen()` with configured host and port;
3. log and exit if startup fails.

Render requires host `0.0.0.0` so the process accepts external traffic and supplies the `PORT` value.

## Where to Continue

- Identity behavior: [Authentication and authorization](02-authentication-authorization.md)
- Route contracts: [Validation, OpenAPI, errors, and configuration](05-contracts-errors-config.md)
- Testing the factory: [Testing strategy and test syntax](../06-quality/01-testing-strategy.md)
