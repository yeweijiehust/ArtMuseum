# Dependency Guide

Prerequisite: [Node.js, packages, PNPM, and monorepos](../00-start-here/03-node-pnpm-monorepos.md).

This guide explains why each important direct dependency exists and what alternative category could replace it.

## Backend Runtime Dependencies

| Dependency | Purpose here | Possible alternative |
| --- | --- | --- |
| `fastify` | HTTP server, routing, hooks, schemas, injection | Express, Koa, Hono |
| `@fastify/type-provider-typebox` | Connect TypeBox schemas to Fastify route typing | Zod type provider, manual types |
| `@sinclair/typebox` | Runtime JSON schemas plus derived TS types | Zod, JSON Schema by hand |
| `@fastify/cookie` | Cookie parsing/writing | manual headers |
| `@fastify/jwt` | Sign and verify session JWTs | server-side session library |
| `@fastify/multipart` | Parse upload multipart bodies | Busboy/formidable integration |
| `@fastify/rate-limit` | Limit request volume | reverse-proxy or custom limits |
| `@fastify/static` | Serve built React assets | separate static host |
| `@fastify/swagger` | Generate OpenAPI from route schemas | handwritten OpenAPI |
| `@fastify/swagger-ui` | Interactive API docs | another OpenAPI renderer |
| `mongodb` | Official MongoDB driver | ODM such as Mongoose, SQL DB |
| `cloudinary` | Upload/delete/URL operations | S3 plus image service |
| `argon2` | Secure password hashing | bcrypt, scrypt |

## Frontend Runtime Dependencies

| Dependency | Purpose here | Possible alternative |
| --- | --- | --- |
| `react`, `react-dom` | Component rendering and UI state | Vue, Svelte, plain DOM |
| `react-router-dom` | Locale-aware browser routing | framework router, custom routing |
| `@tanstack/react-query` | Server state, caching, mutations | SWR, custom fetch state |
| `react-hook-form` | Efficient form state and submission | controlled React state |
| `zod` | Runtime form validation | Valibot, Yup, manual checks |
| `@hookform/resolvers` | Connect Zod to React Hook Form | custom resolver |
| `i18next`, `react-i18next` | Translation resources and React integration | FormatJS, Lingui |
| `lucide-react` | Consistent accessible icon components | another icon library |
| `@artmuseum/shared` | Local schemas, types, locales, errors | generated API client/contracts |

## Development Dependencies

| Dependency | Purpose |
| --- | --- |
| `typescript` | Compile and statically check TypeScript |
| `vite` | Frontend development server and production bundler |
| `@vitejs/plugin-react` | React transformation for Vite |
| `vitest` | TypeScript test runner |
| `jsdom` | Browser-like DOM environment for frontend tests |
| React Testing Library packages | User-oriented component testing |
| `eslint` and plugins | Static lint rules |
| `tsx` | Execute/watch TypeScript during API development |
| `@types/*` | Type declarations for libraries/runtime |

## Python Test Dependencies

| Dependency | Purpose |
| --- | --- |
| `pytest` | Test collection, fixtures, assertions |
| `requests` | External HTTP client with cookie sessions |
| `uv` | Reproducible Python environment/tool execution |

## Platform and Service Dependencies

| Service | Purpose | Failure impact |
| --- | --- | --- |
| MongoDB | Durable user/image metadata | startup/read/write failures |
| Cloudinary | Durable image bytes and delivery | upload/delete/delivery failures |
| Render | Build and run production web service | site unavailable |
| GitHub Actions | Verify pushed commits | deployment checks absent/failing |

## How to Evaluate a New Dependency

Before adding one, ask:

1. Does the standard library or existing dependency already solve it?
2. Does it match current architecture?
3. Is it maintained and compatible with Node 24/React 19/Fastify 5?
4. What production/security risk does it add?
5. What bundle or startup cost does it add?
6. How will it be tested?
7. Is its license acceptable?

Dependencies save implementation effort, but every dependency becomes code the project must update, understand, and trust.
