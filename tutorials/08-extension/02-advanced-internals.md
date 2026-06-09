# Advanced Internals and Design Tradeoffs

Prerequisites:

- [Architecture and repository map](../02-architecture/01-system-map.md)
- [Fastify application factory and plugins](../03-backend/01-fastify-application.md)
- [Testing strategy and test syntax](../06-quality/01-testing-strategy.md)

This chapter surfaces behavior that is easy to miss even after understanding individual files.

## Compile-Time Types Versus Runtime Truth

TypeScript types disappear at runtime. `apiFetch<ImageListResponse>` does not prove the remote JSON matches that type; it asserts the programmer's expectation.

Backend TypeBox validation is runtime enforcement. Frontend Zod is runtime enforcement for forms. MongoDB can still contain historical or manually inserted documents outside these schemas.

For stronger end-to-end runtime guarantees, the frontend could parse API responses with shared schemas or use a generated client.

## Fastify Type Provider Boundaries

The app calls `.withTypeProvider<TypeBoxTypeProvider>()`, helping TypeScript infer route shapes from TypeBox schemas. Route modules are typed as `FastifyPluginAsyncTypebox`.

Some handlers still cast `request.body`, `request.query`, and `request.params`. These casts make intent explicit but can hide inference mismatches. Removing unnecessary casts after confirming provider inference could improve type safety.

## Fastify Encapsulation and Registration Order

Fastify creates scopes when plugins register. Decorations/hooks must exist in the relevant ancestor scope before routes need them.

Swagger dynamic mode must register before routes. Static serving and not-found handling come after API routes so they do not swallow API behavior.

Changing registration order can create failures that look unrelated to the moved line.

## Authentication Control Flow Subtlety

`app.authenticate` sends an error response on failure. Protected handlers also check `request.currentUser`.

This defensive second check avoids assuming the pre-handler always populated user state. When adding hooks, ensure a response sent in a pre-handler prevents protected work and does not accidentally continue.

## In-Memory and Mongo Semantic Drift

Adapters aim for equivalent behavior, but differences remain:

- memory IDs are UUIDs; Mongo IDs are ObjectIds;
- invalid cursor IDs may behave differently;
- Mongo has unique constraints/concurrency; memory implementation is single-process;
- date/ID ordering properties differ;
- persistence survives restart only in Mongo.

Passing memory-backed tests does not prove Mongo adapter correctness.

## Cursor Trust

Cursors are Base64URL-encoded JSON, not signed. A client can modify them.

The store validates structure and Mongo ObjectId before using it. Manipulated cursors may change pagination position but do not grant access to private data because the public filter remains enforced.

A signed cursor could prevent tampering if cursor integrity mattered.

## Distributed Consistency

MongoDB and Cloudinary do not share a transaction. Upload and delete workflows can leave mismatched state after partial failure.

Patterns for stronger reliability:

- compensation: undo the first operation if the second fails;
- idempotency: safely retry an operation;
- outbox/job queue: record intended work and process reliably;
- reconciliation: periodically compare stores and repair differences;
- soft delete: mark metadata before asynchronous media deletion.

## Security Tradeoffs

- JWT cookie is convenient and stateless but has no current revocation list.
- `sameSite=lax` reduces many CSRF cases but a full threat model should consider mutation endpoints and deployment topology.
- MIME type validation trusts client metadata; content sniffing would be stronger.
- rate limit is global/general; authentication-specific limits may be desirable.
- public Cloudinary URLs mean public media remains directly retrievable.

## Performance Tradeoffs

- Argon2 is intentionally slow; that protects passwords but makes auth CPU-heavy.
- upload buffering simplifies validation but consumes memory per concurrent upload.
- denormalized owner display name speeds gallery reads but complicates profile changes.
- one Render process simplifies deployment but couples API and static serving capacity.
- `listImagesByOwner` returns all owned images without pagination.
- frontend bundle is a single main chunk; route-based code splitting could reduce initial load.

## Error Semantics

The global error handler maps unexpected errors to `500` with code `BAD_REQUEST`. The status correctly indicates server failure, but the code suggests caller fault.

A future `INTERNAL_ERROR` code would improve observability and semantics while still hiding sensitive details.

## Accessibility Internals

The lightbox has dialog semantics and Escape support, but a robust modal should:

- move focus inside on open;
- trap tab focus;
- restore focus on close;
- prevent background interaction/scroll;
- potentially use a proven dialog primitive.

Accessibility is behavioral correctness, not only ARIA attributes.

## Advanced Review Questions

When reviewing a change, ask:

1. Does a compile-time type falsely imply runtime validation?
2. Can two external operations partially succeed?
3. Do fake and real adapters still share semantics?
4. Does route registration order affect behavior?
5. Can an authenticated but unauthorized user reach this operation?
6. Can old production data satisfy the new assumption?
7. Does a retry duplicate or corrupt work?
8. Does responsive and keyboard behavior remain usable?
